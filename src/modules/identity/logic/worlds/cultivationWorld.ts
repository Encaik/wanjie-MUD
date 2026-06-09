/**
 * 修仙世界机制（baseline）
 *
 * 标准修炼→战斗→探索循环。其他世界类型默认继承此机制。
 */

import type { WorldMechanics } from './types';
import { getTerminology } from '@/modules/narrative/logic/terminology';

/** 修仙世界机制 */
export const cultivationWorld: WorldMechanics = {
  worldType: '修仙',

  getCultivationParams: () => ({
    resourceName: '灵石',
    actionName: '修炼',
    baseCost: 20,
    useStandardFormula: true,
    successRateModifier: 0,
  }),

  getCombatParams: () => ({
    mpName: '真气',
    abilityName: '招式',
    basicAttackName: '普通攻击',
  }),

  getExplorationParams: () => ({
    exploreName: '历练',
    hasSpecialMechanics: false,
  }),
};
