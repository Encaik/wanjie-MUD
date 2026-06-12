/**
 * calculateCoreStats / calculateAttributeGrowth 测试
 */
import { describe, it, expect } from 'vitest';
import {
  calculateCoreStats,
  calculateAttributeGrowth,
  DEFAULT_CORE_STAT_BASE_VALUES,
} from './calculateCoreStats';
import type { AttributeTemplate, AttributeGrowthRule } from '@/core/types';

// 修仙属性集（简化版，用于测试）
const cultivationAttrs: AttributeTemplate[] = [
  {
    type: 'numeric',
    key: 'constitution',
    displayName: '体质',
    category: 'primary_physical',
    baseValue: 8,
    calculations: [
      { targetCoreStat: 'maxHp', multiplier: 2 },
      { targetCoreStat: 'physicalATK', multiplier: 1 },
    ],
  },
  {
    type: 'numeric',
    key: 'spiritPower',
    displayName: '灵力',
    category: 'primary_spiritual',
    baseValue: 8,
    calculations: [
      { targetCoreStat: 'specialATK', multiplier: 1.5 },
      { targetCoreStat: 'specialResourceCap', multiplier: 3 },
    ],
  },
  {
    type: 'enum',
    key: 'spiritRoot',
    displayName: '灵根属性',
    category: 'primary_spiritual',
    enumValues: [
      { value: '金灵根', bonuses: { specialATK: 8 } },
      { value: '木灵根', bonuses: { maxHp: 10 } },
    ],
  },
];

describe('calculateAttributeGrowth', () => {
  it('线性成长：baseValue + perLevel * level', () => {
    const rule: AttributeGrowthRule = [{ type: 'linear', multiplier: 0.5 }];
    // baseValue 8 + 0.5 * 10 = 13
    expect(calculateAttributeGrowth(8, rule, 10)).toBe(13);
  });

  it('线性 + 常数', () => {
    const rule: AttributeGrowthRule = [
      { type: 'linear', multiplier: 0.5 },
      { type: 'constant', value: 2 },
    ];
    // 8 + 0.5*10 + 2 = 15
    expect(calculateAttributeGrowth(8, rule, 10)).toBe(15);
  });

  it('指数成长', () => {
    const rule: AttributeGrowthRule = [{ type: 'exponential', baseMultiplier: 1.1 }];
    // 8 * (1.1 ^ 3) = 8 * 1.331 = 10.648 → 10.65
    const result = calculateAttributeGrowth(8, rule, 3);
    expect(result).toBeCloseTo(10.65, 1);
  });

  it('境界加成', () => {
    const rule: AttributeGrowthRule = [
      { type: 'linear', multiplier: 0.5 },
      { type: 'perRealm', realmBonuses: { '筑基': 2, '金丹': 5 } },
    ];
    // 筑基：8 + 0.5*10 + 2 = 15
    expect(calculateAttributeGrowth(8, rule, 10, '筑基')).toBe(15);
    // 金丹：8 + 0.5*10 + 5 = 18
    expect(calculateAttributeGrowth(8, rule, 10, '金丹')).toBe(18);
    // 无境界匹配：8 + 0.5*10 + 0 = 13
    expect(calculateAttributeGrowth(8, rule, 10)).toBe(13);
  });

  it('空成长规则返回 baseValue', () => {
    expect(calculateAttributeGrowth(8, [], 10)).toBe(8);
  });
});

describe('calculateCoreStats', () => {
  it('核心值初始值为 DEFAULT_CORE_STAT_BASE_VALUES', () => {
    const result = calculateCoreStats({}, []);
    expect(result.maxHp).toBe(DEFAULT_CORE_STAT_BASE_VALUES.maxHp);
    expect(result.physicalATK).toBe(DEFAULT_CORE_STAT_BASE_VALUES.physicalATK);
  });

  it('数值型属性贡献核心值', () => {
    const attrs = { constitution: 10, spiritPower: 12 };
    const result = calculateCoreStats(attrs, cultivationAttrs);

    // maxHp = base(20) + 10*2 = 40
    expect(result.maxHp).toBe(40);
    // physicalATK = base(5) + 10*1 = 15
    expect(result.physicalATK).toBe(15);
    // specialATK = base(5) + 12*1.5 = 23
    expect(result.specialATK).toBe(23);
    // specialResourceCap = base(0) + 12*3 = 36
    expect(result.specialResourceCap).toBe(36);
  });

  it('枚举型属性贡献固定加成', () => {
    const attrs = { constitution: 10, spiritPower: 12, spiritRoot: '金灵根' };
    const result = calculateCoreStats(attrs, cultivationAttrs);

    // specialATK = base(5) + spiritPower(12*1.5=18) + 金灵根(8) = 31
    expect(result.specialATK).toBe(31);
  });

  it('枚举值不匹配时忽略加成', () => {
    const attrs = { constitution: 10, spiritPower: 12, spiritRoot: '不存在' };
    const result = calculateCoreStats(attrs, cultivationAttrs);

    // specialATK = base(5) + 12*1.5 = 23（无枚举加成）
    expect(result.specialATK).toBe(23);
  });

  it('缺失属性使用 baseValue', () => {
    // constitution 未提供，使用 baseValue 8
    const result = calculateCoreStats({ spiritPower: 12 }, cultivationAttrs);

    // maxHp = base(20) + 8*2 = 36
    expect(result.maxHp).toBe(36);
  });

  it('可覆盖基础值', () => {
    const result = calculateCoreStats({ constitution: 10 }, cultivationAttrs, { maxHp: 30 });
    // maxHp = override(30) + 10*2 = 50
    expect(result.maxHp).toBe(50);
  });

  it('未知属性 key 不影响结果', () => {
    // 空属性集，所有核心值应等于默认值
    const result = calculateCoreStats({ 未知: 999 }, []);
    expect(result.maxHp).toBe(DEFAULT_CORE_STAT_BASE_VALUES.maxHp);
    expect(result.specialATK).toBe(DEFAULT_CORE_STAT_BASE_VALUES.specialATK);
  });

  it('未传属性值时使用 baseValue', () => {
    // constitution 未传，使用 baseValue 8
    const result = calculateCoreStats({}, cultivationAttrs);
    // maxHp = base(20) + 8*2 = 36
    expect(result.maxHp).toBe(36);
  });
});
