/**
 * useGameHooks — 派生数据选择器 Hook
 *
 * 从 GameStore 读取 gameState，返回派生数据。
 * 纯数据读取，不含 action 函数。action 请使用 domainHooks/。
 */

'use client';

import { useMemo } from 'react';

import { calcPlayerAttack, calcPlayerDefense } from '@/core/calculation';
import { getFinalStats } from '@/core/types';
import type { InventoryItem, Technique } from '@/core/types';
import { useGameStore } from './GameStore';
import { useInventory as useInventoryActions } from './domainHooks/useInventory';
import { useEquipment } from './domainHooks/useEquipment';
import { getRealmName, getNextRealm, getNextMainRealmLevel, getMainRealmName } from '@/modules/progression/data/realmData';
import { getMaxExperience } from '@/modules/progression/logic/cultivation';
import { getActualStatCap, MAX_LEVEL } from '@/modules/progression/logic/realmSystem';
import { getAttributeNames, getDungeonInfo, getTerminology } from '@/modules/narrative/logic/terminology';

/** 获取主角数据 */
export function useProtagonist() {
  const { gameState } = useGameStore();
  return useMemo(() => gameState.protagonist, [gameState.protagonist]);
}

/** 获取主角基本信息 */
export function useProtagonistInfo() {
  const { gameState } = useGameStore();
  return useMemo(() => {
    const p = gameState.protagonist;
    if (!p) return null;
    const realmSystem = p.world.realmSystem;
    return {
      name: p.character.name, level: p.level,
      realm: getRealmName(realmSystem, p.level),
      nextRealm: getNextRealm(realmSystem, p.level),
      nextMainRealmLevel: getNextMainRealmLevel(realmSystem, p.level),
      nextMainRealmName: getNextMainRealmLevel(realmSystem, p.level) ? getMainRealmName(realmSystem, getNextMainRealmLevel(realmSystem, p.level)!) : null,
      maxExperience: getMaxExperience(p.level),
      expPercentage: Math.min((p.experience / getMaxExperience(p.level)) * 100, 100),
      isMaxLevel: p.level >= MAX_LEVEL,
      world: p.world, character: p.character,
    };
  }, [gameState.protagonist]);
}

/** 获取 HP/MP */
export function useHpMp() {
  const { gameState } = useGameStore();
  return useMemo(() => {
    const p = gameState.protagonist;
    if (!p) return null;
    return {
      currentHp: p.currentHp, maxHp: p.maxHp,
      hpPercentage: Math.max(0, (p.currentHp / p.maxHp) * 100),
      currentMp: p.currentMp, maxMp: p.maxMp,
      mpPercentage: Math.max(0, (p.currentMp / p.maxMp) * 100),
    };
  }, [gameState.protagonist]);
}

/** 获取属性详情 */
export function useStats() {
  const { gameState } = useGameStore();
  return useMemo(() => {
    const p = gameState.protagonist;
    if (!p) return null;
    const attrNames = getAttributeNames(p.world.type);
    const fs = getFinalStats(p.stats);
    const caps = p.statCapBonuses || {};
    const keys = ['体质', '灵根', '悟性', '幸运', '意志'] as const;
    const details = keys.map(k => {
      const maxV = getActualStatCap(p.level, caps[k] || 0);
      return { key: k, value: fs[k], maxValue: maxV, percentage: Math.min((fs[k] / maxV) * 100, 100), displayName: attrNames[k] || k, capBonus: caps[k] || 0, baseValue: p.stats.base[k], growthValue: p.stats.growth[k] };
    });
    return { stats: fs, statCapBonuses: caps, statDetails: details, attributeNames: attrNames };
  }, [gameState.protagonist]);
}

/** 获取战斗属性 */
export function useCombatStats() {
  const { gameState } = useGameStore();
  return useMemo(() => {
    const p = gameState.protagonist;
    if (!p) return null;
    const fs = getFinalStats(p.stats);
    const ws = p.world.worldStats;
    let attack = calcPlayerAttack(fs.体质, fs.灵根, p.level, ws);
    let techAtkBonus = 0;
    for (const t of (p.equippedAttackTechniques || [])) { if (t) techAtkBonus += t.bonus; }
    if (techAtkBonus > 0) attack = Math.floor(attack * (1 + techAtkBonus / 100));
    let eqAtkBonus = 0;
    if (p.equippedMelee) eqAtkBonus += p.equippedMelee.attackBonus;
    if (p.equippedRanged) eqAtkBonus += p.equippedRanged.attackBonus;
    if (eqAtkBonus > 0) attack = Math.floor(attack * (1 + eqAtkBonus / 100));
    let defense = calcPlayerDefense(fs.意志, p.level, ws);
    let techDefBonus = 0;
    for (const t of (p.equippedDefenseTechniques || [])) { if (t) techDefBonus += t.bonus; }
    if (techDefBonus > 0) defense = Math.floor(defense * (1 + techDefBonus / 100));
    let eqDefBonus = 0;
    if (p.equippedHead) eqDefBonus += p.equippedHead.defenseBonus;
    if (p.equippedBody) eqDefBonus += p.equippedBody.defenseBonus;
    if (p.equippedLegs) eqDefBonus += p.equippedLegs.defenseBonus;
    if (p.equippedFeet) eqDefBonus += p.equippedFeet.defenseBonus;
    if (eqDefBonus > 0) defense = Math.floor(defense * (1 + eqDefBonus / 100));
    return { attack, attackBonus: techAtkBonus, equipmentAttackBonus: eqAtkBonus, totalAttackBonus: techAtkBonus + eqAtkBonus, attackTechniques: p.equippedAttackTechniques || [], defense, defenseBonus: techDefBonus, equipmentDefenseBonus: eqDefBonus, totalDefenseBonus: techDefBonus + eqDefBonus, defenseTechniques: p.equippedDefenseTechniques || [] };
  }, [gameState.protagonist]);
}

/** 获取背包数据 + useItem action */
export function useInventory() {
  const { gameState } = useGameStore();
  const { useItem } = useInventoryActions();

  return useMemo(() => {
    const inv = gameState.protagonist?.inventory || [];
    const effects = gameState.protagonist?.activeEffects || [];
    const ssCount = inv.find((i: InventoryItem) => i.definition.id === 'spirit_stone')?.quantity ?? 0;
    return { inventory: inv, activeEffects: effects, spiritStoneCount: ssCount, useItem };
  }, [gameState.protagonist?.inventory, gameState.protagonist?.activeEffects, useItem]);
}

/** 获取功法数据 + equip/unequip action */
export function useTechniques() {
  const { gameState } = useGameStore();
  const { equipTechnique, unequipTechnique } = useEquipment();

  return useMemo(() => {
    const p = gameState.protagonist;
    if (!p) return { techniques: [], equippedAttackTechniques: [null, null, null], equippedDefenseTechniques: [null, null, null], equipTechnique, unequipTechnique };
    const normalize = (slots: (Technique | null)[] | undefined): [Technique | null, Technique | null, Technique | null] => {
      const result: [Technique | null, Technique | null, Technique | null] = [null, null, null];
      if (slots) { for (let i = 0; i < Math.min(slots.length, 3); i++) { result[i] = slots[i] ?? null; } }
      return result;
    };
    return { techniques: p.techniques || [], equippedAttackTechniques: normalize(p.equippedAttackTechniques), equippedDefenseTechniques: normalize(p.equippedDefenseTechniques), equipTechnique, unequipTechnique };
  }, [gameState.protagonist, equipTechnique, unequipTechnique]);
}

/** 获取世界术语 */
export function useTerminology() {
  const { gameState } = useGameStore();
  return useMemo(() => {
    const wt = gameState.protagonist?.world.type;
    if (!wt) return null;
    return { terminology: getTerminology(wt), attributeNames: getAttributeNames(wt), dungeonInfo: getDungeonInfo(wt) };
  }, [gameState.protagonist?.world.type]);
}
