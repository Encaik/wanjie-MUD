/**
 * 战斗策略系统单元测试
 * 
 * 测试克制关系、伤害计算等核心逻辑
 */

import { describe, it, expect } from 'vitest';
import { 
  Element, 
  WeaponCategory,
} from '../types';
import {
  ELEMENT_COUNTER_MAP,
  WEAPON_COUNTER_MAP,
  calculateElementMultiplier,
  calculateWeaponMultiplier,
  calculateRestraintResult,
  detectElementFromName,
  detectWeaponCategoryFromName,
  ELEMENT_NAMES,
  WEAPON_CATEGORY_NAMES,
} from '../restraintSystem';

// ========== 克制关系测试 ==========

describe('克制关系系统', () => {
  describe('元素克制', () => {
    it('火克冰 - 伤害加成', () => {
      const multiplier = calculateElementMultiplier('fire', 'ice');
      expect(multiplier).toBe(1.25); // 克制 +25%
    });

    it('冰克雷 - 伤害加成', () => {
      const multiplier = calculateElementMultiplier('ice', 'thunder');
      expect(multiplier).toBe(1.25);
    });

    it('雷克风 - 伤害加成', () => {
      const multiplier = calculateElementMultiplier('thunder', 'wind');
      expect(multiplier).toBe(1.25);
    });

    it('风克土 - 伤害加成', () => {
      const multiplier = calculateElementMultiplier('wind', 'earth');
      expect(multiplier).toBe(1.25);
    });

    it('土克火 - 伤害加成', () => {
      const multiplier = calculateElementMultiplier('earth', 'fire');
      expect(multiplier).toBe(1.25);
    });

    it('光暗互克 - 双方加成', () => {
      const lightVsDark = calculateElementMultiplier('light', 'dark');
      const darkVsLight = calculateElementMultiplier('dark', 'light');
      expect(lightVsDark).toBe(1.2); // 双方都 +20%
      expect(darkVsLight).toBe(1.2);
    });

    it('被克制关系 - 伤害降低', () => {
      const multiplier = calculateElementMultiplier('ice', 'fire');
      expect(multiplier).toBe(0.85); // 被克制 -15%
    });

    it('无克制关系（相同元素）', () => {
      const multiplier = calculateElementMultiplier('fire', 'fire');
      expect(multiplier).toBe(1.0);
    });

    it('一方无属性 - 默认系数', () => {
      const multiplier = calculateElementMultiplier(null, 'fire');
      expect(multiplier).toBe(1.0);
    });
  });

  describe('武器克制', () => {
    it('剑克刀 - 伤害加成', () => {
      const multiplier = calculateWeaponMultiplier('sword', 'blade');
      expect(multiplier).toBe(1.25);
    });

    it('刀克拳 - 伤害加成', () => {
      const multiplier = calculateWeaponMultiplier('blade', 'fist');
      expect(multiplier).toBe(1.25);
    });

    it('拳克弓 - 伤害加成', () => {
      const multiplier = calculateWeaponMultiplier('fist', 'bow');
      expect(multiplier).toBe(1.25);
    });

    it('弓克枪 - 伤害加成', () => {
      const multiplier = calculateWeaponMultiplier('bow', 'spear');
      expect(multiplier).toBe(1.25);
    });

    it('枪克剑 - 伤害加成', () => {
      const multiplier = calculateWeaponMultiplier('spear', 'sword');
      expect(multiplier).toBe(1.25);
    });

    it('被克制关系 - 伤害降低', () => {
      const multiplier = calculateWeaponMultiplier('blade', 'sword');
      expect(multiplier).toBe(0.85);
    });

    it('无克制关系（相同武器）', () => {
      const multiplier = calculateWeaponMultiplier('sword', 'sword');
      expect(multiplier).toBe(1.0);
    });
  });

  describe('组合克制', () => {
    it('元素和武器双重克制', () => {
      const result = calculateRestraintResult(
        'fire', 'ice',  // 元素克制
        'sword', 'blade' // 武器克制
      );
      expect(result.damageMultiplier).toBeCloseTo(1.25 * 1.25);
      expect(result.restraintType).toBe('counter');
    });

    it('元素克制但武器被克制', () => {
      const result = calculateRestraintResult(
        'fire', 'ice',  // 元素克制
        'blade', 'sword' // 武器被克制
      );
      // 优势 * 劣势 ≈ 中性
      expect(result.damageMultiplier).toBeCloseTo(1.25 * 0.85);
      expect(result.restraintType).toBe('neutral');
    });

    it('一方无属性时使用默认值', () => {
      const result = calculateRestraintResult(
        null, null,
        null, null
      );
      expect(result.damageMultiplier).toBe(1.0);
      expect(result.restraintType).toBe('neutral');
    });

    it('攻守反转系数', () => {
      const result = calculateRestraintResult('fire', 'ice', null, null);
      // 攻击方有优势时，受击伤害倍率降低
      expect(result.receivedMultiplier).toBeCloseTo(2 - result.damageMultiplier);
    });
  });
});

// ========== 属性识别测试 ==========

describe('属性识别', () => {
  describe('元素识别', () => {
    it('从名称识别火元素', () => {
      expect(detectElementFromName('烈焰剑法')).toBe('fire');
      expect(detectElementFromName('火焰掌')).toBe('fire');
    });

    it('从名称识别冰元素', () => {
      expect(detectElementFromName('冰心诀')).toBe('ice');
      expect(detectElementFromName('寒冰掌')).toBe('ice');
    });

    it('从名称识别雷元素', () => {
      expect(detectElementFromName('雷霆剑')).toBe('thunder');
      expect(detectElementFromName('雷电术')).toBe('thunder');
    });

    it('无法识别时返回 null', () => {
      expect(detectElementFromName('普通攻击')).toBe(null);
      expect(detectElementFromName('')).toBe(null);
    });
  });

  describe('武器类别识别', () => {
    it('从名称识别剑类', () => {
      expect(detectWeaponCategoryFromName('青锋剑')).toBe('sword');
      expect(detectWeaponCategoryFromName('剑法')).toBe('sword');
    });

    it('从名称识别刀类', () => {
      expect(detectWeaponCategoryFromName('屠龙刀')).toBe('blade');
      expect(detectWeaponCategoryFromName('刀法')).toBe('blade');
    });

    it('从名称识别枪类', () => {
      expect(detectWeaponCategoryFromName('亮银枪')).toBe('spear');
      expect(detectWeaponCategoryFromName('枪法')).toBe('spear');
    });

    it('无法识别时返回 null', () => {
      expect(detectWeaponCategoryFromName('法杖')).toBe(null); // "杖"不在关键词中
      expect(detectWeaponCategoryFromName('')).toBe(null);
    });
  });
});

// ========== 伤害计算测试 ==========

describe('伤害计算', () => {
  // 模拟基础伤害计算
  const calculateBaseDamage = (
    attackerAttack: number,
    defenderDefense: number,
    restraintMultiplier: number = 1
  ): number => {
    const baseDamage = Math.max(1, attackerAttack - defenderDefense * 0.5);
    return Math.floor(baseDamage * restraintMultiplier);
  };

  it('基础伤害 = 攻击力 - 防御力*0.5', () => {
    const damage = calculateBaseDamage(100, 40);
    expect(damage).toBe(80); // 100 - 40*0.5 = 80
  });

  it('最小伤害为1', () => {
    const damage = calculateBaseDamage(10, 100);
    expect(damage).toBe(1);
  });

  it('克制加成伤害', () => {
    const normalDamage = calculateBaseDamage(100, 40, 1);
    const restrainedDamage = calculateBaseDamage(100, 40, 1.25);
    expect(restrainedDamage).toBe(Math.floor(normalDamage * 1.25));
  });

  it('被克制惩罚伤害', () => {
    const normalDamage = calculateBaseDamage(100, 40, 1);
    const penaltyDamage = calculateBaseDamage(100, 40, 0.85);
    expect(penaltyDamage).toBe(Math.floor(normalDamage * 0.85));
  });
});

// ========== 名称映射测试 ==========

describe('名称映射', () => {
  it('所有元素都有中文名称', () => {
    const elements: Element[] = ['fire', 'ice', 'thunder', 'wind', 'earth', 'light', 'dark'];
    elements.forEach(e => {
      expect(ELEMENT_NAMES[e]).toBeTruthy();
      expect(typeof ELEMENT_NAMES[e]).toBe('string');
    });
  });

  it('所有武器都有中文名称', () => {
    const weapons: WeaponCategory[] = ['sword', 'blade', 'fist', 'bow', 'spear'];
    weapons.forEach(w => {
      expect(WEAPON_CATEGORY_NAMES[w]).toBeTruthy();
      expect(typeof WEAPON_CATEGORY_NAMES[w]).toBe('string');
    });
  });
});

// ========== 边界情况测试 ==========

describe('边界情况处理', () => {
  it('null 元素处理', () => {
    const multiplier = calculateElementMultiplier(null, 'fire');
    expect(multiplier).toBe(1.0);
  });

  it('双方都无属性', () => {
    const result = calculateRestraintResult(null, null, null, null);
    expect(result.damageMultiplier).toBe(1.0);
    expect(result.restraintType).toBe('neutral');
  });

  it('克制关系映射完整性', () => {
    // 确保每个元素都有对应的克制对象
    const elements: Element[] = ['fire', 'ice', 'thunder', 'wind', 'earth', 'light', 'dark'];
    elements.forEach(e => {
      expect(ELEMENT_COUNTER_MAP[e]).toBeDefined();
    });
  });

  it('武器克制关系映射完整性', () => {
    // 确保每个武器都有对应的克制对象
    const weapons: WeaponCategory[] = ['sword', 'blade', 'fist', 'bow', 'spear'];
    weapons.forEach(w => {
      expect(WEAPON_COUNTER_MAP[w]).toBeDefined();
    });
  });
});
