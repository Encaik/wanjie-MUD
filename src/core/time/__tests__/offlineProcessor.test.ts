/**
 * offlineProcessor 命名空间单元测试
 */
import { describe, it, expect } from 'vitest';

import type { Protagonist } from '@/core/types';

import { DEFAULT_OFFLINE_CONFIG } from '../constants';
import { createDefaultGameClock } from '../gameClock';
import { process, applyResult, shouldShowDialog } from '../offlineProcessor';
import { createDefaultRealClock } from '../realClock';

import type { TimeState } from '../types';


const NOW = 1000000000000;

/** 创建最小测试 Protagonist */
function makeProtagonist(overrides: Partial<Protagonist> = {}): Protagonist {
  return {
    character: {} as any,
    world: {} as any,
    backstory: '',
    level: 10,
    realm: '筑基期',
    stats: {} as any,
    statCapBonuses: {},
    inventory: [],
    activeEffects: [],
    experience: 0,
    overflowExperience: 0,
    currentHp: 100,
    maxHp: 200,
    currentMp: 50,
    maxMp: 100,
    techniques: [],
    equippedAttackTechniques: [],
    equippedDefenseTechniques: [],
    equipments: [],
    equippedMelee: null,
    equippedRanged: null,
    equippedHead: null,
    equippedBody: null,
    equippedLegs: null,
    equippedFeet: null,
    factionId: null,
    stamina: 50,
    maxStamina: 100,
    items: [
      {
        instanceId: 'test-spirit-stone',
        templateId: 'wanjie:common:spirit_stone',
        quantity: 999999,
        level: 1,
        exp: 0,
        affixes: [],
        equipped: false,
        equippedInSlot: null,
        equippedSkills: {},
        element: null,
        isFragment: false,
        obtainedAt: 0,
        source: 'initial',
      },
    ],
    slots: {},
    maxSlotCounts: {},
    ...overrides,
  };
}

function makeTime(serverNow: number = NOW): TimeState {
  return {
    game: createDefaultGameClock(),
    real: createDefaultRealClock(serverNow),
  };
}

describe('offlineProcessor', () => {
  describe('process', () => {
    it('离线时间超过容量时强制恢复触顶', () => {
      const time = makeTime(NOW);
      const protagonist = makeProtagonist();

      // 模拟 30 分钟离线
      const result = process(
        { ...time, real: { ...time.real, lastLogoutAt: NOW - 30 * 60 * 1000 } },
        protagonist,
        NOW,
      );

      expect(result.staminaRecovered).toBeGreaterThan(0);
      expect(result.offlineDuration).toBeLessThanOrEqual(DEFAULT_OFFLINE_CONFIG.maxOfflineDuration);
    });

    it('无有效离线记录时不计算恢复', () => {
      const time = makeTime(NOW);
      const protagonist = makeProtagonist({ stamina: 100, maxStamina: 100, currentHp: 200, currentMp: 100 });

      const result = process(time, protagonist, NOW);

      expect(result.staminaRecovered).toBe(0);
      expect(result.hpRecovered).toBe(0);
      expect(result.mpRecovered).toBe(0);
    });

    it('体力已满时不恢复', () => {
      const time = { ...makeTime(NOW), real: { ...makeTime(NOW).real, lastLogoutAt: NOW - 30 * 60 * 1000 } };
      const protagonist = makeProtagonist({ stamina: 100, maxStamina: 100 });

      const result = process(time, protagonist, NOW);

      expect(result.staminaRecovered).toBe(0);
    });

    it('开启自动修炼时应计算修炼收益', () => {
      const time = { ...makeTime(NOW), real: { ...makeTime(NOW).real, lastLogoutAt: NOW - 5000 } };
      const protagonist = makeProtagonist();

      const result = process(time, protagonist, NOW, true);

      expect(result.autoCultivate.executed).toBe(true);
      expect(result.autoCultivate.count).toBeGreaterThan(0);
    });

    it('未开启自动修炼时不计算修炼收益', () => {
      const time = { ...makeTime(NOW), real: { ...makeTime(NOW).real, lastLogoutAt: NOW - 5000 } };
      const protagonist = makeProtagonist();

      const result = process(time, protagonist, NOW, false);

      expect(result.autoCultivate.executed).toBe(false);
    });
  });

  describe('applyResult', () => {
    it('应正确应用体力恢复到主角', () => {
      const protagonist = makeProtagonist({ stamina: 50 });
      const result = {
        offlineDuration: 300000,
        offlineDurationText: '5分钟',
        staminaRecovered: 5,
        hpRecovered: 0,
        mpRecovered: 0,
        expiredCooldownIds: [],
        needsDailyRefresh: false,
        needsWeeklyRefresh: false,
        autoCultivate: { executed: false, count: 0, spiritStonesSpent: 0, totalExpGained: 0, startLevel: 10, endLevel: 10, endExperience: 0, stoppedByResource: false },
      };

      const updated = applyResult(protagonist, result);
      expect(updated.stamina).toBe(55);
    });

    it('体力恢复不应超过最大值', () => {
      const protagonist = makeProtagonist({ stamina: 98, maxStamina: 100 });
      const result = {
        offlineDuration: 600000,
        offlineDurationText: '10分钟',
        staminaRecovered: 5,
        hpRecovered: 0,
        mpRecovered: 0,
        expiredCooldownIds: [],
        needsDailyRefresh: false,
        needsWeeklyRefresh: false,
        autoCultivate: { executed: false, count: 0, spiritStonesSpent: 0, totalExpGained: 0, startLevel: 10, endLevel: 10, endExperience: 0, stoppedByResource: false },
      };

      const updated = applyResult(protagonist, result);
      expect(updated.stamina).toBe(100);
    });
  });

  describe('shouldShowDialog', () => {
    it('离线超过 30 秒应显示弹窗', () => {
      const result = {
        offlineDuration: 60000,
        offlineDurationText: '1分钟',
        staminaRecovered: 0,
        hpRecovered: 0,
        mpRecovered: 0,
        expiredCooldownIds: [],
        needsDailyRefresh: false,
        needsWeeklyRefresh: false,
        autoCultivate: { executed: false, count: 0, spiritStonesSpent: 0, totalExpGained: 0, startLevel: 10, endLevel: 10, endExperience: 0, stoppedByResource: false },
      };
      expect(shouldShowDialog(result)).toBe(true);
    });

    it('离线不足 30 秒不应显示弹窗', () => {
      const result = {
        offlineDuration: 5000,
        offlineDurationText: '5秒',
        staminaRecovered: 0,
        hpRecovered: 0,
        mpRecovered: 0,
        expiredCooldownIds: [],
        needsDailyRefresh: false,
        needsWeeklyRefresh: false,
        autoCultivate: { executed: false, count: 0, spiritStonesSpent: 0, totalExpGained: 0, startLevel: 10, endLevel: 10, endExperience: 0, stoppedByResource: false },
      };
      expect(shouldShowDialog(result)).toBe(false);
    });
  });
});
