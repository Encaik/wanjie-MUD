/**
 * modules/fortune/logic/eventEngine.ts — 机缘事件引擎
 *
 * 事件注册表 + 事件查询 + 事件选择处理。
 * 支持 Mod 通过注册表注入事件模板。
 */

import type { WorldType } from '@/core/types';

import { getDefaultEvents } from '../data/defaultEvents';

import type {
  FortuneEventTemplate,
  FortuneEventChoice,
} from '../types';
import type { FortuneTypeId } from '../types';


// ============================================
// 事件注册表
// ============================================

/** 机缘事件注册表（单例） */
class FortuneEventRegistryImpl {
  private events: FortuneEventTemplate[] = [];

  /** 注册事件模板 */
  register(event: FortuneEventTemplate): void {
    // 去重：同 ID 则覆盖
    const idx = this.events.findIndex(e => e.id === event.id);
    if (idx >= 0) {
      this.events[idx] = event;
    } else {
      this.events.push(event);
    }
  }

  /** 批量注册 */
  registerAll(events: FortuneEventTemplate[]): void {
    for (const event of events) {
      this.register(event);
    }
  }

  /** 注销事件 */
  unregister(eventId: string): void {
    this.events = this.events.filter(e => e.id !== eventId);
  }

  /**
   * 查询匹配的事件模板
   *
   * @param worldType - 当前世界类型（可选）
   * @param fortuneType - 当前机缘主题（可选）
   * @param depth - 当前深度
   * @returns 匹配的事件模板列表
   */
  query(
    worldType?: WorldType,
    fortuneType?: FortuneTypeId,
    depth?: number
  ): FortuneEventTemplate[] {
    // 合并：默认事件 + 注册事件
    const allEvents = [
      ...getDefaultEvents(depth),
      ...this.events,
    ];

    return allEvents.filter(e => {
      // 世界类型筛选
      if (e.worldType && worldType && e.worldType !== worldType) return false;

      // 机缘主题筛选
      if (e.fortuneType && fortuneType && e.fortuneType !== fortuneType) return false;

      // 深度筛选
      if (depth !== undefined) {
        if (e.minDepth !== undefined && depth < e.minDepth) return false;
        if (e.maxDepth !== undefined && depth > e.maxDepth) return false;
      }

      return true;
    });
  }

  /** 获取所有已注册事件数量 */
  get count(): number {
    return this.events.length;
  }

  /** 清空注册表（测试用） */
  clear(): void {
    this.events = [];
  }
}

/** 全局机缘事件注册表单例 */
export const fortuneEventRegistry = new FortuneEventRegistryImpl();

// ============================================
// 事件处理
// ============================================

/** 事件选择结果 */
export interface EventResult {
  /** 是否触发战斗 */
  startBattle?: string;
  /** 灵石变化 */
  spiritStones?: number;
  /** 经验变化 */
  experience?: number;
  /** HP 变化 */
  hpChange?: number;
  /** MP 变化 */
  mpChange?: number;
  /** 获得物品 */
  items?: Record<string, number>;
  /** 获得碎片 */
  fragments?: Array<{ sourceName: string; type: 'technique' | 'equipment'; rarity: string; count: number }>;
  /** 结果文本 */
  resultText: string;
}

/**
 * 处理事件选择
 *
 * @param event - 事件模板
 * @param choiceIndex - 选择的选项索引
 * @returns 选择结果
 */
export function resolveEventChoice(
  event: FortuneEventTemplate,
  choiceIndex: number
): EventResult {
  const choice = event.choices[choiceIndex];

  if (!choice) {
    return {
      resultText: '选择无效。',
    };
  }

  return {
    startBattle: choice.effects.startBattle,
    spiritStones: choice.effects.spiritStones,
    experience: choice.effects.experience,
    hpChange: choice.effects.hpChange,
    mpChange: choice.effects.mpChange,
    items: choice.effects.items,
    fragments: choice.effects.fragments,
    resultText: choice.resultText,
  };
}

/**
 * 按权重随机选择事件
 *
 * @param events - 候选事件列表
 * @param rng - 随机数生成函数
 * @returns 选中的事件，或 null（无可用事件）
 */
export function selectRandomEvent(
  events: FortuneEventTemplate[],
  rng: () => number
): FortuneEventTemplate | null {
  if (events.length === 0) return null;

  // 稀有度权重
  const rarityWeights: Record<string, number> = {
    common: 50,
    uncommon: 30,
    rare: 15,
    legendary: 5,
  };

  // 加权选择
  const totalWeight = events.reduce((sum, e) => sum + (rarityWeights[e.rarity] || 10), 0);
  let roll = rng() * totalWeight;

  for (const event of events) {
    roll -= rarityWeights[event.rarity] || 10;
    if (roll <= 0) return event;
  }

  return events[events.length - 1];
}
