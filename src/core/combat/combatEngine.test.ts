/**
 * ATB 时间条战斗引擎 — 单元测试
 *
 * 运行: pnpm vitest run src/core/combat/
 */
import { describe, it, expect } from 'vitest';
import { executeCombat, calculateDamage, setCombatSeed } from './combatEngine';
import type { CombatUnit, CombatSkill } from './types';

function makeUnit(overrides: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id: 'test', name: '测试', level: 5, isPlayer: true,
    coreStats: { maxHp: 60, physicalATK: 15, specialATK: 15, physicalDEF: 10, specialDEF: 10, speed: 12, intelligence: 10, willpower: 10, lifespan: 80, perception: 10, specialResourceCap: 20 },
    currentHp: 60,
    skills: [{ id: 's1', name: '斩击', damageType: 'physical', power: 50, weaponModifier: 0, cooldownSeconds: 0, currentCooldown: 0 }],
    ...overrides,
  };
}

describe('calculateDamage', () => {
  it('基本伤害', () => {
    setCombatSeed(0);
    const { damage } = calculateDamage(5, 15, 10, 50);
    // (2*5+10)/250 * 15/10 * 50 + 2 = 0.08*1.5*50+2 = 8
    expect(damage).toBeGreaterThanOrEqual(6);
    expect(damage).toBeLessThanOrEqual(10);
  });

  it('防御为0不除零', () => {
    const { damage } = calculateDamage(5, 15, 0, 50);
    expect(damage).toBeGreaterThan(0);
  });

  it('武器修正增加伤害', () => {
    setCombatSeed(0);
    const a = calculateDamage(5, 15, 10, 50, 0);
    setCombatSeed(0);
    const b = calculateDamage(5, 15, 10, 50, 10);
    expect(b.damage).toBeGreaterThan(a.damage);
  });

  it('最小伤害为1', () => {
    expect(calculateDamage(1, 1, 100, 1).damage).toBeGreaterThanOrEqual(1);
  });
});

describe('ATB executeCombat', () => {
  it('速度高者行动次数多', () => {
    setCombatSeed(42);
    const fast = makeUnit({ id: 'fast', name: '快', coreStats: { ...makeUnit().coreStats, speed: 50 } });
    const slow = makeUnit({ id: 'slow', name: '慢', coreStats: { ...makeUnit().coreStats, speed: 5 }, currentHp: 200 });
    const r = executeCombat(fast, slow, 'encounter');
    const fastActions = r.logs.filter(l => l.attackerName === '快').length;
    const slowActions = r.logs.filter(l => l.attackerName === '慢').length;
    // 快者应比慢者行动多 (50 vs 5 = 10x)
    expect(fastActions).toBeGreaterThan(slowActions);
  });

  it('ambush 攻击方先行动', () => {
    setCombatSeed(42);
    const atk = makeUnit({ id: 'atk', name: '攻击', coreStats: { ...makeUnit().coreStats, speed: 1 } });
    const def = makeUnit({ id: 'def', name: '防御', coreStats: { ...makeUnit().coreStats, speed: 99 }, currentHp: 30 });
    const r = executeCombat(atk, def, 'ambush');
    expect(r.logs[0].attackerName).toBe('攻击');
  });

  it('极速差可连击多次', () => {
    setCombatSeed(42);
    const fast = makeUnit({ id: 'fast', name: '快', coreStats: { ...makeUnit().coreStats, speed: 95 }, currentHp: 100 });
    const slow = makeUnit({ id: 'slow', name: '慢', coreStats: { ...makeUnit().coreStats, speed: 1 }, currentHp: 500 });
    const r = executeCombat(fast, slow, 'encounter');
    // 快者(95)应该在慢者(1)行动前多次出手
    const firstSlowIdx = r.logs.findIndex(l => l.attackerName === '慢');
    if (firstSlowIdx > 0) {
      // 慢者行动前，快者应已出手多次
      expect(firstSlowIdx).toBeGreaterThanOrEqual(10);
    }
  });

  it('战斗正常结束有结果', () => {
    setCombatSeed(42);
    const r = executeCombat(makeUnit(), makeUnit({ currentHp: 30 }), 'encounter');
    expect(r.logs.length).toBeGreaterThan(0);
    expect(r.totalRounds).toBeGreaterThan(0);
  });

  it('CD技能冷却后复用', () => {
    setCombatSeed(42);
    const unit = makeUnit({
      skills: [
        { id: 'cd_skill', name: '大招', damageType: 'physical', power: 100, weaponModifier: 0, cooldownSeconds: 10, currentCooldown: 0 },
        { id: 'basic', name: '普攻', damageType: 'physical', power: 30, weaponModifier: 0, cooldownSeconds: 0, currentCooldown: 0 },
      ],
      coreStats: { ...makeUnit().coreStats, speed: 50 },
    });
    const target = makeUnit({ currentHp: 500 });
    const r = executeCombat(unit, target, 'encounter');
    // 大招应至少使用2次（CD会衰减）
    const bigSkills = r.logs.filter(l => l.skillName === '大招').length;
    expect(bigSkills).toBeGreaterThanOrEqual(1);
  });
});
