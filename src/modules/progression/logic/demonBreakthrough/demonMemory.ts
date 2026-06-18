/**
 * 心魔图鉴逻辑（demonMemory）
 *
 * 管理玩家与心魔的长期交互记录：
 * - 记录每次心魔遭遇
 * - 追踪连败次数和宿敌心魔判定
 * - 计算对各类心魔的抗性加成
 *
 * @module modules/progression/logic/demonBreakthrough
 */

import type { DemonMemory } from './types';
import type { DemonType } from './types';

// ============================================
// 心魔图鉴查询
// ============================================

/**
 * 在图鉴中查找指定类型心魔的记录
 *
 * @param codex - 心魔图鉴
 * @param demonType - 心魔类型
 * @returns 记录条目，未找到返回 undefined
 */
export function findDemonMemory(
  codex: DemonMemory[],
  demonType: DemonType,
): DemonMemory | undefined {
  return codex.find(m => m.demonType === demonType);
}

/**
 * 获取对该类心魔的抗性加成（基于遭遇经验）
 *
 * 每战胜一次 +5% 抗性，每遭遇过一次 +2% 基础认知。
 * 上限 30%。宿敌心魔无抗性加成（反而有恐惧debuff）。
 *
 * @param codex - 心魔图鉴
 * @param demonType - 心魔类型
 * @returns 抗性加成百分比（0-0.3）
 */
export function calculateDemonResistance(
  codex: DemonMemory[],
  demonType: DemonType,
): number {
  const memory = findDemonMemory(codex, demonType);
  if (!memory) return 0;

  // 宿敌心魔：每次遭遇反而增加心魔强度，不给抗性
  if (memory.isArchNemesis) return 0;

  // 抗性 = 战胜次数 × 5% + min(遭遇次数, 5) × 2%
  const victoryBonus = memory.victories * 0.05;
  const encounterBonus = Math.min(memory.encounters, 5) * 0.02;

  return Math.min(0.30, victoryBonus + encounterBonus);
}

// ============================================
// 心魔遭遇记录
// ============================================

/**
 * 记录一次心魔遭遇
 *
 * @param codex - 当前心魔图鉴
 * @param demonType - 心魔类型
 * @param demonName - 心魔名称
 * @param worldType - 所在世界观
 * @param victory - 是否战胜
 * @returns 更新后的图鉴
 */
export function recordDemonEncounter(
  codex: DemonMemory[],
  demonType: DemonType,
  demonName: string,
  worldType: string,
  victory: boolean,
): DemonMemory[] {
  const existing = findDemonMemory(codex, demonType);

  if (existing) {
    const newConsecutiveLosses = victory ? 0 : existing.consecutiveLosses + 1;
    return codex.map(m =>
      m.demonType === demonType
        ? {
            ...m,
            name: demonName, // 更新为最新名称
            encounters: m.encounters + 1,
            victories: m.victories + (victory ? 1 : 0),
            lastEncountered: Date.now(),
            lastWorldType: worldType,
            consecutiveLosses: newConsecutiveLosses,
            isArchNemesis: newConsecutiveLosses >= 3,
          }
        : m,
    );
  }

  // 首次遭遇
  return [
    ...codex,
    {
      demonType,
      name: demonName,
      encounters: 1,
      victories: victory ? 1 : 0,
      lastEncountered: Date.now(),
      lastWorldType: worldType,
      isArchNemesis: false,
      consecutiveLosses: victory ? 0 : 1,
    },
  ];
}

/**
 * 检查某类型心魔是否已成为宿敌
 *
 * @param codex - 心魔图鉴
 * @param demonType - 心魔类型
 * @returns 是否为宿敌心魔
 */
export function isArchNemesis(
  codex: DemonMemory[],
  demonType: DemonType,
): boolean {
  const memory = findDemonMemory(codex, demonType);
  return memory?.isArchNemesis ?? false;
}

/**
 * 宿敌心魔的属性加成（攻击力提升百分比）
 *
 * @param codex - 心魔图鉴
 * @param demonType - 心魔类型
 * @returns 加成百分比（0-0.5），仅宿敌心魔有
 */
export function getArchNemesisBonus(
  codex: DemonMemory[],
  demonType: DemonType,
): number {
  if (!isArchNemesis(codex, demonType)) return 0;
  return 0.50; // 宿敌心魔全属性+50%
}
