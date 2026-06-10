/**
 * 灵石消耗服务
 * 
 * 提供各种灵石消耗功能的统一入口
 * 包括：装备重铸、功法突破、境界突破辅助、属性重置
 */

import {
  SpiritStoneSink,
  SinkApplyResult,
  getSinkConfig,
  REFORGE_CONFIG,
  TECHNIQUE_BREAKTHROUGH_CONFIG,
  REALM_BREAKTHROUGH_CONFIG,
  STAT_RESET_CONFIG,
} from './types';
import { EquipmentAffix, AffixType, AffixEffect } from '@/modules/equipment/data/equipmentAffixData';
import { CurrencyService } from '../shop/currencyService';
import { PlayerCurrencies, CurrencyType } from '../shop/types';
import { Protagonist, Equipment, Technique, ItemRarity, StatKey } from '@/core/types';

/**
 * 灵石消耗服务
 */
export class SpiritStoneSinkService {
  /**
   * 检查玩家是否可以使用某消耗途径
   */
  static canUse(
    sinkId: string,
    protagonist: Protagonist,
    params: Record<string, any>
  ): { canUse: boolean; reason?: string } {
    const sink = getSinkConfig(sinkId);
    if (!sink) {
      return { canUse: false, reason: '消耗途径不存在' };
    }

    if (!sink.enabled) {
      return { canUse: false, reason: '该功能暂未开放' };
    }

    // 检查解锁条件
    if (sink.unlockCondition) {
      if (sink.unlockCondition.minLevel && protagonist.level < sink.unlockCondition.minLevel) {
        return { canUse: false, reason: `需要等级 ${sink.unlockCondition.minLevel}` };
      }
    }

    // 检查灵石是否足够
    const cost = sink.calculateCost(params);
    const currencies = protagonist.currencies || { spirit_stone: 0, contribution: 0 };
    const spiritStone = currencies.spirit_stone || 0;
    
    if (spiritStone < cost) {
      return { canUse: false, reason: `灵石不足，需要 ${cost} 灵石` };
    }

    return { canUse: true };
  }

  /**
   * 计算消耗灵石数量
   */
  static calculateCost(sinkId: string, params: Record<string, any>): number {
    const sink = getSinkConfig(sinkId);
    if (!sink) return 0;
    return sink.calculateCost(params);
  }

  /**
   * 扣除灵石
   */
  static deductSpiritStone(
    currencies: PlayerCurrencies,
    amount: number
  ): PlayerCurrencies | null {
    return CurrencyService.deduct(currencies, {
      type: 'spirit_stone',
      amount,
    });
  }

  /**
   * 获取推荐消耗途径
   */
  static getRecommendedSinks(protagonist: Protagonist): SpiritStoneSink[] {
    const currencies = protagonist.currencies || { spirit_stone: 0, contribution: 0 };
    const spiritStone = currencies.spirit_stone || 0;
    
    // 根据灵石数量推荐不同的消耗途径
    if (spiritStone >= 100000) {
      // 富裕：推荐高消耗途径
      return [
        getSinkConfig('equipment_reforge')!,
        getSinkConfig('technique_breakthrough')!,
      ].filter(Boolean);
    } else if (spiritStone >= 10000) {
      // 中等：推荐中等消耗途径
      return [
        getSinkConfig('realm_breakthrough_assist')!,
        getSinkConfig('technique_breakthrough')!,
      ].filter(Boolean);
    } else if (spiritStone >= 1000) {
      // 较少：推荐属性重置
      return [getSinkConfig('stat_reset')!].filter(Boolean);
    }
    
    return [];
  }
}

/**
 * 装备重铸服务
 */
export class EquipmentReforgeService {
  /**
   * 执行重铸
   */
  static reforge(
    equipment: Equipment,
    currencies: PlayerCurrencies,
    preserveAffixIds?: string[]
  ): { success: boolean; cost: number; newAffixes?: EquipmentAffix[]; error?: string } {
    // 计算消耗
    let cost = SpiritStoneSinkService.calculateCost('equipment_reforge', {
      level: equipment.level,
      rarity: equipment.rarity,
    });

    // 保留词缀额外消耗
    if (preserveAffixIds && preserveAffixIds.length > 0) {
      cost += REFORGE_CONFIG.preserveAffixCost * preserveAffixIds.length;
    }

    // 检查灵石是否足够
    const spiritStone = currencies.spirit_stone || 0;
    if (spiritStone < cost) {
      return { success: false, cost, error: `灵石不足，需要 ${cost} 灵石` };
    }

    // 生成新词缀
    const newAffixes = this.generateAffixes(equipment, preserveAffixIds);

    return { success: true, cost, newAffixes };
  }

  /**
   * 计算重铸消耗
   */
  static calculateCost(equipment: Equipment, preserveAffixIds?: string[]): number {
    let cost = SpiritStoneSinkService.calculateCost('equipment_reforge', {
      level: equipment.level,
      rarity: equipment.rarity,
    });

    if (preserveAffixIds && preserveAffixIds.length > 0) {
      cost += REFORGE_CONFIG.preserveAffixCost * preserveAffixIds.length;
    }

    return cost;
  }

  /**
   * 生成新词缀
   */
  static generateAffixes(equipment: Equipment, preserveIds?: string[]): EquipmentAffix[] {
    const maxAffixes = REFORGE_CONFIG.maxAffixes[equipment.rarity] || 1;
    const affixes: EquipmentAffix[] = [];
    
    // 保留指定词缀
    const existingAffixes = equipment.affixes || [];
    if (preserveIds) {
      for (const affix of existingAffixes) {
        if (preserveIds.includes(affix.id)) {
          affixes.push(affix);
        }
      }
    }

    // 生成新词缀
    const remainingSlots = maxAffixes - affixes.length;
    for (let i = 0; i < remainingSlots; i++) {
      affixes.push(this.generateRandomAffix(equipment));
    }

    return affixes;
  }

  /**
   * 生成随机词缀
   */
  private static generateRandomAffix(equipment: Equipment): EquipmentAffix {
    const statPool: StatKey[] = ['体质', '灵根', '悟性', '幸运', '意志'];
    const stat = statPool[Math.floor(Math.random() * statPool.length)];
    
    // 根据装备等级和稀有度计算数值
    const baseValue = Math.max(1, Math.floor(equipment.level * 0.3));
    const rarityMultiplier: Record<ItemRarity, number> = {
      '普通': 1,
      '稀有': 1.5,
      '史诗': 2,
      '传说': 3,
      '神话': 5,
    };
    const value = Math.floor(baseValue * rarityMultiplier[equipment.rarity] * (0.8 + Math.random() * 0.4));

    const affixNames: Record<StatKey, string> = {
      '体质': '强壮',
      '灵根': '灵动',
      '悟性': '智慧',
      '幸运': '幸运',
      '意志': '坚毅',
    };

    const affixType: AffixType = Math.random() > 0.5 ? 'prefix' : 'suffix';
    
    return {
      id: `affix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${affixNames[stat]}之${affixType === 'prefix' ? '前' : '后'}`,
      type: affixType,
      rarity: equipment.rarity,
      effects: [{
        type: 'stat',
        stat,
        value,
        description: `${stat}+${value}`,
      }],
      dropWeight: 100,
    };
  }
}

/**
 * 功法突破服务
 * 
 * 注意：Technique 类型没有 maxLevel 属性
 * 使用 technique.level 作为基础进行突破计算
 */
export class TechniqueBreakthroughService {
  /**
   * 执行突破
   */
  static breakthrough(
    technique: Technique,
    currencies: PlayerCurrencies
  ): { success: boolean; cost: number; newMaxLevel?: number; error?: string } {
    // 使用功法当前等级作为基础计算
    const currentLevel = technique.level || 1;
    const cost = currentLevel * TECHNIQUE_BREAKTHROUGH_CONFIG.costPerLevel;

    const spiritStone = currencies.spirit_stone || 0;
    if (spiritStone < cost) {
      return { success: false, cost, error: `灵石不足，需要 ${cost} 灵石` };
    }

    // 突破后等级上限提升
    const newMaxLevel = currentLevel + TECHNIQUE_BREAKTHROUGH_CONFIG.levelIncrease;

    return { success: true, cost, newMaxLevel };
  }

  /**
   * 计算突破消耗
   */
  static calculateCost(technique: Technique): number {
    const currentLevel = technique.level || 1;
    return currentLevel * TECHNIQUE_BREAKTHROUGH_CONFIG.costPerLevel;
  }

  /**
   * 检查是否可以突破
   */
  static canBreakthrough(
    technique: Technique,
    currencies: PlayerCurrencies
  ): { canBreakthrough: boolean; reason?: string } {
    const cost = this.calculateCost(technique);
    const spiritStone = currencies.spirit_stone || 0;
    
    if (spiritStone < cost) {
      return { canBreakthrough: false, reason: `灵石不足，需要 ${cost} 灵石` };
    }

    return { canBreakthrough: true };
  }
}

/**
 * 境界突破辅助服务
 */
export class RealmBreakthroughAssistService {
  /**
   * 购买突破辅助
   */
  static purchase(
    realmLevel: number,
    currencies: PlayerCurrencies
  ): { success: boolean; cost: number; bonus: number; error?: string } {
    const cost = REALM_BREAKTHROUGH_CONFIG.baseCost + 
                 realmLevel * REALM_BREAKTHROUGH_CONFIG.realmMultiplier * 100;

    const spiritStone = currencies.spirit_stone || 0;
    if (spiritStone < cost) {
      return { success: false, cost, bonus: 0, error: `灵石不足，需要 ${cost} 灵石` };
    }

    return { 
      success: true, 
      cost, 
      bonus: REALM_BREAKTHROUGH_CONFIG.successRateBonus 
    };
  }

  /**
   * 计算辅助消耗
   */
  static calculateCost(realmLevel: number): number {
    return REALM_BREAKTHROUGH_CONFIG.baseCost + 
           realmLevel * REALM_BREAKTHROUGH_CONFIG.realmMultiplier * 100;
  }
}

/**
 * 属性重置服务
 */
export class StatResetService {
  /**
   * 执行属性重置
   */
  static reset(
    protagonist: Protagonist,
    currencies: PlayerCurrencies
  ): { success: boolean; cost: number; returnedPoints: number; error?: string } {
    const cost = STAT_RESET_CONFIG.fixedCost;
    const spiritStone = currencies.spirit_stone || 0;

    if (spiritStone < cost) {
      return { success: false, cost, returnedPoints: 0, error: `灵石不足，需要 ${cost} 灵石` };
    }

    // 计算返还的属性点
    const stats = protagonist.stats;
    const returnedPoints = Object.values(stats).reduce((sum, val) => sum + val, 0);

    return { success: true, cost, returnedPoints };
  }

  /**
   * 计算重置消耗
   */
  static calculateCost(): number {
    return STAT_RESET_CONFIG.fixedCost;
  }
}
