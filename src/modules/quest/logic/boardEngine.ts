/**
 * 板块引擎
 *
 * 管理任务板块的刷新、槽位分配、任务选取。
 * 依赖 BoardRegistry 获取板块定义，依赖 QuestRegistry 获取任务数据。
 * 纯函数集合，接收 RNG 作为参数。
 *
 * @module modules/quest/logic
 */

import { QuestRegistry } from '@/core/registry/QuestRegistry';
import type { QuestBoard, QuestState } from '@/core/types';

// ============================================
// 刷新判断
// ============================================

/**
 * 检查板块是否需要刷新
 *
 * @param board - 板块定义
 * @param boardLastRefresh - 上次刷新时间戳
 * @param nowTimestamp - 当前时间戳
 * @returns true = 需要刷新
 */
export function needsRefresh(
  board: QuestBoard,
  boardLastRefresh: Record<string, number>,
  nowTimestamp: number,
): boolean {
  const lastRefresh = boardLastRefresh[board.id] ?? 0;

  switch (board.refreshRule.type) {
    case 'never':
      // 只在从未初始化时"刷新"（初始化槽位）
      return lastRefresh === 0;
    case 'daily': {
      const last = new Date(lastRefresh);
      const now = new Date(nowTimestamp);
      const resetHour = board.refreshRule.resetHour ?? 0;
      return (
        last.getDate() !== now.getDate()
        || last.getMonth() !== now.getMonth()
        || last.getFullYear() !== now.getFullYear()
      ) && now.getHours() >= resetHour;
    }
    case 'weekly': {
      const resetDay = board.refreshRule.resetDay ?? 0; // 0=周日
      const last = new Date(lastRefresh);
      const now = new Date(nowTimestamp);
      const dayDiff = Math.floor((nowTimestamp - lastRefresh) / 86400000);
      // 跨过 resetDay
      return dayDiff >= 7 || (
        dayDiff > 0
        && last.getDay() < resetDay
        && now.getDay() >= resetDay
      );
    }
    case 'custom':
      // 简化实现：检查是否跨天（cron 表达式完整解析留给未来）
      const lastD = new Date(lastRefresh);
      const nowD = new Date(nowTimestamp);
      return lastD.getDate() !== nowD.getDate()
        || lastD.getMonth() !== nowD.getMonth();
    default:
      return false;
  }
}

// ============================================
// 可用任务筛选
// ============================================

/**
 * 从板块任务池中筛选可用的任务
 *
 * @param board - 板块定义
 * @param questState - 任务状态
 * @param nowTimestamp - 当前时间戳（用于冷却计算）
 * @returns 可用任务 ID 列表
 */
export function getAvailableQuestsForBoard(
  board: QuestBoard,
  questState: QuestState,
  nowTimestamp: number = Date.now(),
): string[] {
  const registry = QuestRegistry.getInstance();
  const available: string[] = [];

  for (const questId of board.questPool) {
    const quest = registry.getById(questId);
    if (!quest) continue;
    if (questState.activeQuests[questId]) continue;
    if (!quest.repeatable && questState.completedQuestIds.includes(questId)) continue;
    if (questState.completedQuestIds.includes(questId)
      && !questState.claimedQuestIds.includes(questId)) continue;

    if (quest.repeatable && isQuestInCooldown(questId, quest.cooldownSeconds, questState, nowTimestamp)) {
      continue;
    }

    available.push(questId);
  }

  return available;
}

// ============================================
// 槽位刷新
// ============================================

/**
 * 刷新板块槽位
 *
 * 从可用任务中选取 slotCount 个任务放入槽位。
 * randomPick=true 时使用加权随机（默认等权重），
 * randomPick=false 时按 questPool 顺序选取。
 *
 * @param board - 板块定义
 * @param questState - 任务状态
 * @param nowTimestamp - 当前时间戳
 * @param rng - 随机数生成器（可选，不提供则使用顺序选取）
 * @returns 更新后的 boardSlots 和 boardLastRefresh
 */
export function refreshBoard(
  board: QuestBoard,
  questState: QuestState,
  nowTimestamp: number = Date.now(),
  rng?: () => number,
): {
  boardSlots: Record<string, string[]>;
  boardLastRefresh: Record<string, number>;
} {
  const available = getAvailableQuestsForBoard(board, questState, nowTimestamp);

  let selected: string[];

  if (board.randomPick && rng) {
    // 随机选取（等权重）
    selected = pickRandom(available, board.slotCount, rng);
  } else {
    // 按顺序选取
    selected = available.slice(0, board.slotCount);
  }

  return {
    boardSlots: { [board.id]: selected },
    boardLastRefresh: { [board.id]: nowTimestamp },
  };
}

/**
 * 推进线性板块的槽位（随机板块不需要）
 *
 * 当某个槽位任务完成/领取后，按顺序推送下一个可用任务。
 */
export function advanceBoardSlot(
  board: QuestBoard,
  questState: QuestState,
  nowTimestamp: number = Date.now(),
): Record<string, string[]> {
  const currentSlots = questState.boardSlots[board.id]?.questIds ?? [];
  if (board.randomPick) return { [board.id]: currentSlots };

  const available = getAvailableQuestsForBoard(board, questState, nowTimestamp);

  // 去除已完成/已领取的任务
  const remaining = currentSlots.filter(qid =>
    !questState.claimedQuestIds.includes(qid)
    && (!questState.completedQuestIds.includes(qid) || questState.activeQuests[qid]),
  );

  // 从可用任务中补充到 slotCount
  const needed = board.slotCount - remaining.length;
  const newSlots = available
    .filter(qid => !remaining.includes(qid))
    .slice(0, needed);

  return { [board.id]: [...remaining, ...newSlots] };
}

// ============================================
// 板块 UI 状态
// ============================================

/** 板块 UI 展示状态 */
export type BoardUIState =
  | 'locked'
  | 'empty'
  | 'available'
  | 'claimable'
  | 'cooling_down'
  | 'completed';

/**
 * 获取板块的 UI 状态
 */
export function getBoardUIState(
  board: QuestBoard,
  questState: QuestState,
  isUnlocked: boolean,
  nowTimestamp: number = Date.now(),
): BoardUIState {
  if (!isUnlocked) return 'locked';

  const slots = questState.boardSlots[board.id]?.questIds ?? [];

  if (slots.length === 0) return 'empty';

  // 检查是否有可领取的
  const hasClaimable = slots.some(qid =>
    questState.completedQuestIds.includes(qid)
    && !questState.claimedQuestIds.includes(qid),
  );
  if (hasClaimable) return 'claimable';

  // 检查是否有可接取的
  const hasAvailable = slots.some(qid =>
    !questState.completedQuestIds.includes(qid)
    && !questState.activeQuests[qid],
  );
  if (hasAvailable) return 'available';

  // 检查是否全部完成并领取
  const allClaimed = slots.every(qid =>
    questState.claimedQuestIds.includes(qid),
  );
  if (allClaimed) {
    // 检查冷却中
    const hasCooldown = slots.some(qid => {
      const completedAt = questState.completedTimestamps[qid];
      if (!completedAt) return false;
      const quest = QuestRegistry.getInstance().getById(qid);
      if (!quest?.repeatable || !quest.cooldownSeconds) return false;
      return nowTimestamp < completedAt + quest.cooldownSeconds * 1000;
    });
    if (hasCooldown) return 'cooling_down';
    return 'completed';
  }

  return 'available';
}

// ============================================
// 辅助
// ============================================

/** 检查重复任务是否在冷却中 */
function isQuestInCooldown(
  questId: string,
  cooldownSeconds: number | undefined,
  questState: QuestState,
  nowTimestamp: number,
): boolean {
  if (!cooldownSeconds) return false;
  const cooldownMs = cooldownSeconds * 1000;

  const completedAt = questState.completedTimestamps[questId];
  if (completedAt && nowTimestamp < completedAt + cooldownMs) return true;

  if (questState.claimedQuestIds.includes(questId)) {
    const claimedAt = questState.completedTimestamps[questId] ?? 0;
    if (nowTimestamp < claimedAt + cooldownMs) return true;
  }

  return false;
}

/** 等权重随机选取 n 个元素（Fisher-Yates 部分洗牌） */
function pickRandom<T>(arr: T[], n: number, rng: () => number): T[] {
  const result = [...arr];
  const count = Math.min(n, result.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (result.length - i));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.slice(0, count);
}
