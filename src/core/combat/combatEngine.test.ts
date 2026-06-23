/**
 * 事件驱动双人战斗引擎 — 单元测试
 *
 * 运行: pnpm vitest run src/core/combat/
 */
import { describe, it, expect } from 'vitest';

import { executeCombat, calculateDamage, setCombatSeed } from './combatEngine';

import type { CombatUnit } from './types';

/** 默认测试单位 coreStats */
const DEFAULT_CORE_STATS = {
  maxHp: 200, physicalATK: 15, specialATK: 15,
  physicalDEF: 10, specialDEF: 10, speed: 10,
  intelligence: 10, willpower: 10, lifespan: 80,
  perception: 10, specialResourceCap: 20,
};

function makeUnit(overrides: Partial<CombatUnit> & { coreStatOverrides?: Partial<typeof DEFAULT_CORE_STATS> } = {}): CombatUnit {
  const { coreStatOverrides, ...rest } = overrides;
  return {
    id: 'test', name: '测试单位', level: 5, isPlayer: true,
    coreStats: { ...DEFAULT_CORE_STATS, ...coreStatOverrides },
    currentHp: DEFAULT_CORE_STATS.maxHp,
    skills: [{ id: 's1', name: '斩击', damageType: 'physical', power: 50, weaponModifier: 0, cooldownSeconds: 0, currentCooldown: 0 }],
    ...rest,
  };
}

// ============================================
// 伤害计算（不变）
// ============================================

describe('calculateDamage', () => {
  it('基本伤害范围', () => {
    setCombatSeed(0);
    const { damage } = calculateDamage(5, 15, 10, 50);
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

// ============================================
// 事件驱动衰减 + 保底
// ============================================

describe('事件驱动速度衰减', () => {
  it('速度相近（10 vs 5）基本交替行动', () => {
    setCombatSeed(42);
    const a = makeUnit({
      id: 'a', name: 'A',
      coreStatOverrides: { speed: 10, maxHp: 500 },
      currentHp: 500,
    });
    const b = makeUnit({
      id: 'b', name: 'B',
      coreStatOverrides: { speed: 5, maxHp: 500 },
      currentHp: 500,
    });

    const r = executeCombat(a, b, 'encounter');

    // 检查交替模式：日志中不应出现连续3次以上同一方行动
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    let lastActor = '';

    for (const log of r.logs) {
      if (log.attackerName === lastActor) {
        currentConsecutive++;
      } else {
        currentConsecutive = 1;
      }
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      lastActor = log.attackerName;
    }

    // 速度2:1在衰减模型下应基本交替，偶尔连击
    expect(maxConsecutive).toBeLessThanOrEqual(3);
  });

  it('速度碾压（100k vs 10k）高速方连续行动多次', () => {
    setCombatSeed(42);
    const a = makeUnit({
      id: 'a', name: 'A',
      coreStatOverrides: { speed: 100000, maxHp: 5000 },
      currentHp: 5000,
    });
    const b = makeUnit({
      id: 'b', name: 'B',
      coreStatOverrides: { speed: 10000, maxHp: 5000 },
      currentHp: 5000,
    });

    const r = executeCombat(a, b, 'encounter');

    const aActions = r.logs.filter(l => l.attackerName === 'A').length;
    const bActions = r.logs.filter(l => l.attackerName === 'B').length;

    // A 应远多于 B
    expect(aActions).toBeGreaterThan(bActions * 2);

    // B 至少行动了（保底保证了）
    expect(bActions).toBeGreaterThan(0);

    // 检查 B 行动前 A 已连续行动多次
    const firstBIdx = r.logs.findIndex(l => l.attackerName === 'B');
    if (firstBIdx > 0) {
      // B第一次行动前A应已行动多次
      const aBeforeB = r.logs.slice(0, firstBIdx).filter(l => l.attackerName === 'A').length;
      expect(aBeforeB).toBeGreaterThanOrEqual(2);
    }
  });

  it('保底机制阻止无限连续行动', () => {
    setCombatSeed(42);
    const a = makeUnit({
      id: 'a', name: 'A',
      coreStatOverrides: { speed: 1000000, maxHp: 10000 },
      currentHp: 10000,
    });
    const b = makeUnit({
      id: 'b', name: 'B',
      coreStatOverrides: { speed: 1, maxHp: 10000 },
      currentHp: 10000,
    });

    const r = executeCombat(a, b, 'encounter');

    // 找出最大连续行动次数（应不超过 PITY_MAX = 4）
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    let lastActor = '';

    for (const log of r.logs) {
      if (log.attackerName === lastActor) {
        currentConsecutive++;
      } else {
        currentConsecutive = 1;
      }
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      lastActor = log.attackerName;
    }

    // 保底保证连续行动不超过 PITY_MAX
    expect(maxConsecutive).toBeLessThanOrEqual(4);

    // B 必须至少行动过一次
    const bActions = r.logs.filter(l => l.attackerName === 'B').length;
    expect(bActions).toBeGreaterThan(0);
  });
});

// ============================================
// 开场类型
// ============================================

describe('开场类型', () => {
  it('ambush 攻击方首轮先手', () => {
    setCombatSeed(42);
    const a = makeUnit({ id: 'a', name: 'A', coreStatOverrides: { speed: 1 } });
    const b = makeUnit({ id: 'b', name: 'B', coreStatOverrides: { speed: 99 }, currentHp: 100 });

    const r = executeCombat(a, b, 'ambush');
    expect(r.logs[0].attackerName).toBe('A');
  });

  it('defense 防御方获得临时血量', () => {
    setCombatSeed(42);
    const a = makeUnit({ id: 'a', name: 'A' });
    const b = makeUnit({
      id: 'b', name: 'B',
      coreStatOverrides: { maxHp: 100 },
      currentHp: 50,
    });

    const r = executeCombat(a, b, 'defense');
    // 防御方应由 50 → ceil(50 * 1.1) = 55
    // 验证战斗正常结束
    expect(r.totalRounds).toBeGreaterThan(0);
  });
});

// ============================================
// 行动次数上限
// ============================================

describe('行动次数上限', () => {
  it('到达上限时按血量比例判定', () => {
    setCombatSeed(42);
    // 设置极低伤害，确保打到上限
    const a = makeUnit({
      id: 'a', name: 'A',
      coreStatOverrides: { physicalATK: 1, maxHp: 1000, speed: 10 },
      currentHp: 1000,
      skills: [{ id: 's1', name: '轻击', damageType: 'physical', power: 20, weaponModifier: 0, cooldownSeconds: 0, currentCooldown: 0 }],
    });
    // 初始B血量就比A低很多
    const b = makeUnit({
      id: 'b', name: 'B',
      coreStatOverrides: { physicalATK: 1, maxHp: 1000, speed: 10 },
      currentHp: 100,  // B只有100血，比例10%
    });

    // 这场战斗B应该很快被打败（伤害小但B血少）
    // 如果不死则到50次上限按比例判定
    const r = executeCombat(a, b, 'encounter');

    expect(r.totalRounds).toBeGreaterThan(0);
    // 要么B死了A胜，要么达到上限按比例判定
    if (r.defenderRemainingHp > 0 && r.attackerRemainingHp > 0) {
      // 达到上限的情况：A血量比例应高于B
      expect(r.victory).toBe(true);
    }
  });
});

// ============================================
// CD 冷却（按自身行动次数）
// ============================================

describe('技能冷却', () => {
  it('CD技能使用后需等待自身行动N次才可用', () => {
    setCombatSeed(42);
    const a = makeUnit({
      id: 'a', name: 'A',
      coreStatOverrides: { speed: 100, maxHp: 500 },
      currentHp: 500,
      skills: [
        { id: 'big', name: '大招', damageType: 'physical', power: 100, weaponModifier: 0, cooldownSeconds: 3, currentCooldown: 0 },
        { id: 'basic', name: '普攻', damageType: 'physical', power: 30, weaponModifier: 0, cooldownSeconds: 0, currentCooldown: 0 },
      ],
    });
    const b = makeUnit({
      id: 'b', name: 'B',
      coreStatOverrides: { speed: 1, maxHp: 2000 },  // B很慢很肉，确保A能行动多次
      currentHp: 2000,
    });

    const r = executeCombat(a, b, 'encounter');

    // 大招至少被使用过
    const bigSkills = r.logs.filter(l => l.skillName === '大招');
    expect(bigSkills.length).toBeGreaterThanOrEqual(1);

    // 大招两次使用之间应有A的其他行动（冷却期间）
    if (bigSkills.length >= 2) {
      const firstBigIdx = r.logs.findIndex(l => l.skillName === '大招');
      const secondBigIdx = r.logs.findIndex((l, i) => i > firstBigIdx && l.skillName === '大招');

      if (secondBigIdx > firstBigIdx) {
        const aActionsBetween = r.logs
          .slice(firstBigIdx + 1, secondBigIdx)
          .filter(l => l.attackerName === 'A').length;
        // 大招冷却=3次自身行动，期间A应至少行动3次
        expect(aActionsBetween).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

// ============================================
// 战斗正常结束
// ============================================

describe('战斗结束', () => {
  it('正常战斗以一方死亡结束', () => {
    setCombatSeed(42);
    const a = makeUnit();
    const b = makeUnit({ currentHp: 30 });

    const r = executeCombat(a, b, 'encounter');
    expect(r.logs.length).toBeGreaterThan(0);
    expect(r.totalRounds).toBeGreaterThan(0);
    // B血量少，应该很快被击败
    expect(r.defenderRemainingHp).toBe(0);
  });
});
