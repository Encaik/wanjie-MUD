/**
 * 统计追踪器 — 主入口
 *
 * 提供 `processStatisticsEvent()` 纯函数，接收 GameStatistics + GameEvent，
 * 查表调用对应的 updater 并返回新的统计数据。
 *
 * 设计原则：
 * - 纯函数：不依赖外部状态，不产生副作用
 * - 未知事件类型安全回退：不修改 stats，不抛异常
 * - 不可变更新：返回新对象，不修改输入
 *
 * @module core/statistics
 */

import type { GameStatistics } from '@/core/types';
import type { GameEvent } from '@/core/events';

import type { StatisticsEventType } from './types';
import { statisticsUpdaters } from './updaters';

// ============================================
// 核心函数
// ============================================

/**
 * 处理单个统计事件，返回更新后的统计数据
 *
 * 根据事件类型查表调用对应的 updater 纯函数。
 * 如果事件类型未知（不在 updaters 映射中），安全回退：
 * 返回原 stats 不做修改，不抛出异常。
 *
 * @param stats - 当前统计数据
 * @param event - 游戏事件（包含 type 和 payload）
 * @returns 更新后的统计数据（纯函数，不修改输入）
 *
 * @example
 * const newStats = processStatisticsEvent(
 *   currentStats,
 *   { type: 'cultivation:performed', payload: { count: 1 }, timestamp: Date.now() }
 * );
 * // newStats.totalCultivations === currentStats.totalCultivations + 1
 */
export function processStatisticsEvent(
  stats: GameStatistics,
  event: GameEvent,
): GameStatistics {
  const eventType = event.type as StatisticsEventType;

  // 查找对应的 updater
  const updater = statisticsUpdaters[eventType];

  if (!updater) {
    // 未知事件类型，静默跳过（不抛异常，不修改 stats）
    return stats;
  }

  // 调用 updater（纯函数，返回新对象）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload 类型由 updaters 内部校验
  return updater(stats, event.payload as any);
}

/**
 * 批量处理统计事件
 *
 * 对事件列表中的每个事件依次调用 `processStatisticsEvent`，
 * 返回最终的统计数据。这比多次独立调用更高效，因为中间对象
 * 只在函数内部创建，调用方只得到最终结果。
 *
 * @param stats - 初始统计数据
 * @param events - 按时间顺序排列的事件列表
 * @returns 处理所有事件后的统计数据
 *
 * @example
 * const newStats = processStatisticsEvents(currentStats, [
 *   { type: 'cultivation:performed', payload: { count: 2 }, timestamp: 1 },
 *   { type: 'combat:enemy_killed', payload: { count: 3 }, timestamp: 2 },
 * ]);
 */
export function processStatisticsEvents(
  stats: GameStatistics,
  events: GameEvent[],
): GameStatistics {
  return events.reduce<GameStatistics>(
    (currentStats, event) => processStatisticsEvent(currentStats, event),
    stats,
  );
}

/**
 * 判断事件是否为统计相关事件
 *
 * 用于事件处理器中快速过滤非统计事件，避免不必要的函数调用。
 *
 * @param eventType - 事件类型字符串
 * @returns 是否为已知的统计事件类型
 */
export function isStatisticsEvent(eventType: string): eventType is StatisticsEventType {
  return eventType in statisticsUpdaters;
}
