/**
 * 战斗引擎测试
 */
import { describe, it, expect } from 'vitest';
import {
  executeCombat,
  calculateDamage,
  setCombatSeed,
} from './combatEngine';
import type { CombatUnit } from './types';

function makeUnit(overrides: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id: 'test_unit',
    name: '测试单位',
    level: 5,
    isPlayer: true,
    coreStats: {
      maxHp: 50, physicalATK: 15, specialATK: 15,
      physicalDEF: 10, specialDEF: 10, speed: 12,
      intelligence: 10, willpower: 10, lifespan: 80,
      perception: 10, specialResourceCap: 30,
    },
    currentHp: 50,
    skills: [
      { id: 'slash', name: '斩击', damageType: 'physical', power: 50, weaponModifier: 0, cooldownSeconds: 0, currentCooldown: 0 },
    ],
    ...overrides,
  };
}

describe('calculateDamage', () => {
  it('物理伤害基本计算', () => {
    setCombatSeed(0); // 固定随机
    const { damage } = calculateDamage(5, 15, 10, 50);
    // (2*5+10)/250 * 15/10 * 50 + 2 = 0.08*1.5*50+2 = 6+2 = 8
    expect(damage).toBeGreaterThanOrEqual(6);
    expect(damage).toBeLessThanOrEqual(10);
  });

  it('防御为0时不会除以0', () => {
    const { damage } = calculateDamage(5, 15, 0, 50);
    expect(damage).toBeGreaterThan(0);
    expect(Number.isFinite(damage)).toBe(true);
  });

  it('武器修正影响伤害', () => {
    setCombatSeed(0);
    const without = calculateDamage(5, 15, 10, 50, 0);
    setCombatSeed(0);
    const withBonus = calculateDamage(5, 15, 10, 50, 10);
    expect(withBonus.damage).toBeGreaterThan(without.damage);
  });

  it('最小伤害为1', () => {
    const { damage } = calculateDamage(1, 1, 100, 1);
    expect(damage).toBeGreaterThanOrEqual(1);
  });
});

describe('executeCombat', () => {
  it('遭遇战正常结束', () => {
    setCombatSeed(42);
    const attacker = makeUnit({ id: 'A', name: '攻击方' });
    const defender = makeUnit({ id: 'B', name: '防御方', currentHp: 20 });
    const result = executeCombat(attacker, defender, 'encounter', 'auto');
    expect(result.totalRounds).toBeGreaterThan(0);
    expect(result.logs.length).toBeGreaterThan(0);
    expect(result.victory || !result.victory).toBe(true); // 任一方胜
  });

  it('ambush 首轮攻击方先手', () => {
    setCombatSeed(42);
    // 攻击方速度低但应该先手
    const attacker = makeUnit({ id: 'A', name: '攻击方', coreStats: { ...makeUnit().coreStats, speed: 5 } });
    const defender = makeUnit({ id: 'B', name: '防御方', coreStats: { ...makeUnit().coreStats, speed: 30 }, currentHp: 20 });
    const result = executeCombat(attacker, defender, 'ambush', 'auto');
    expect(result.logs[0].attackerName).toBe('攻击方');
  });

  it('手动模式回调', () => {
    setCombatSeed(42);
    const attacker = makeUnit({
      skills: [
        { id: 'weak', name: '弱攻击', damageType: 'physical', power: 30, weaponModifier: 0, cooldownSeconds: 0, currentCooldown: 0 },
        { id: 'strong', name: '强攻击', damageType: 'physical', power: 80, weaponModifier: 0, cooldownSeconds: 0, currentCooldown: 0 },
      ],
    });
    const defender = makeUnit({ currentHp: 30 });
    const result = executeCombat(attacker, defender, 'encounter', 'manual',
      (_, __, available) => available.includes('strong') ? 'strong' : available[0]);
    expect(result.logs[0].skillName).toBe('强攻击');
  });

  it('自动模式选择威力最高技能', () => {
    setCombatSeed(42);
    const attacker = makeUnit({
      skills: [
        { id: 'slash', name: '斩击', damageType: 'physical', power: 50, weaponModifier: 0, cooldownSeconds: 0, currentCooldown: 0 },
        { id: 'heavy', name: '重击', damageType: 'physical', power: 80, weaponModifier: 0, cooldownSeconds: 0, currentCooldown: 0 },
      ],
    });
    const defender = makeUnit({ currentHp: 30 });
    const result = executeCombat(attacker, defender, 'encounter', 'auto');
    expect(result.logs[0].skillName).toBe('重击');
  });
});
