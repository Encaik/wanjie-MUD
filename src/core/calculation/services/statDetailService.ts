/**
 * 属性详情解析服务
 * 
 * 将计算系统的效果贡献转换为玩家可理解的展示格式
 * 使用游戏内术语，避免暴露底层计算逻辑
 */

import { Protagonist, getFinalStats, BaseStats } from '@/core/types';

import { getCalculator } from '../calculator';
import { buildContextFromProtagonist } from '../helpers/contextHelper';
import { 
  CalculableStat, 
  EffectSourceType, 
  StatCalculationResult,
  EffectContribution 
} from '../types';

// ============================================
// 展示用类型定义
// ============================================

/** 效果来源的玩家可见名称 */
const SOURCE_DISPLAY_NAMES: Record<EffectSourceType, string> = {
  equipment: '装备加成',
  technique: '功法修行',
  faction: '势力庇护',
  school: '流派传承',
  buff: '临时状态',
  world_danger: '天地压制',
  world_opportunity: '天地机缘',
  realm: '境界底蕴',
  pill: '丹药效果',
  title: '称号荣誉',
  world_base: '天地之气',
  state: '身体状态',
  passive: '天赋能力',
  enemy_buff: '敌人增益',
};

/** 效果来源的分类 */
export type EffectCategory = 
  | 'innate'      // 天赋（出身）
  | 'cultivation' // 修炼（成长）
  | 'equipment'   // 装备
  | 'technique'   // 功法
  | 'faction'     // 势力
  | 'buff'        // 临时效果
  | 'world'       // 世界效果
  | 'other';      // 其他

/** 单个加成来源的展示信息 */
export interface StatBonusSource {
  /** 来源名称（玩家可见） */
  name: string;
  /** 来源类型 */
  category: EffectCategory;
  /** 效果值 */
  value: number;
  /** 是否为百分比 */
  isPercentage: boolean;
  /** 效果图标（可选） */
  icon?: string;
  /** 额外描述（可选） */
  description?: string;
  /** 来源详情（如装备名、功法名） */
  sourceDetail?: string;
}

/** 单个属性的详细解析结果 */
export interface StatDetailBreakdown {
  /** 属性名称（玩家可见） */
  statName: string;
  /** 属性ID */
  statId: CalculableStat | string;
  /** 基础值 */
  baseValue: number;
  /** 成长值 */
  growthValue: number;
  /** 最终值 */
  finalValue: number;
  /** 所有加成来源 */
  bonuses: StatBonusSource[];
  /** 总加成值 */
  totalBonus: number;
  /** 是否有加成 */
  hasBonus: boolean;
  /** 简短描述 */
  summary: string;
}

/** 所有属性的详细解析结果 */
export interface AllStatBreakdowns {
  /** 五维属性 */
  baseStats: StatDetailBreakdown[];
  /** 战斗属性 */
  combatStats: StatDetailBreakdown[];
  /** 经济属性 */
  economyStats: StatDetailBreakdown[];
  /** 修炼属性 */
  cultivationStats: StatDetailBreakdown[];
  /** 计算时间戳 */
  timestamp: number;
  /** 总效果数量 */
  totalEffects: number;
}

// ============================================
// 属性名称映射
// ============================================

/** 属性ID到玩家可见名称的映射 */
const STAT_DISPLAY_NAMES: Record<string, string> = {
  // 五维属性
  '体质': '体质',
  '灵根': '灵根',
  '悟性': '悟性',
  '幸运': '幸运',
  '意志': '意志',
  // 战斗属性
  maxHp: '生命上限',
  maxMp: '法力上限',
  attack: '攻击力',
  defense: '防御力',
  critRate: '暴击几率',
  critDamage: '暴击伤害',
  dodgeRate: '闪避几率',
  // 修炼属性
  cultivationExp: '修炼效率',
  breakthroughRate: '突破几率',
  techniqueExp: '功法领悟',
  // 经济属性
  expGain: '经验获取',
  spiritStoneGain: '灵石获取',
  dropRate: '掉落几率',
  rarityBoost: '稀有加成',
  // 特殊属性
  luck: '运势',
  power: '战力',
};

/** 效果来源类型到分类的映射 */
function categorizeSourceType(sourceType: EffectSourceType): EffectCategory {
  switch (sourceType) {
    case 'equipment':
      return 'equipment';
    case 'technique':
      return 'technique';
    case 'faction':
    case 'school':
      return 'faction';
    case 'buff':
    case 'pill':
    case 'state':
      return 'buff';
    case 'world_danger':
    case 'world_opportunity':
    case 'world_base':
      return 'world';
    case 'realm':
    case 'title':
    case 'passive':
      return 'cultivation';
    default:
      return 'other';
  }
}

// ============================================
// 属性详情解析服务
// ============================================

export class StatDetailService {
  /**
   * 解析主角的所有属性详情
   */
  analyzeProtagonistStats(protagonist: Protagonist): AllStatBreakdowns {
    // 构建计算上下文
    const context = buildContextFromProtagonist(protagonist);
    
    // 获取计算器
    const calculator = getCalculator();
    
    // 计算所有属性
    const result = calculator.calculateAllStats(context);
    
    let totalEffects = 0;
    
    // 解析五维属性（直接从主角数据获取）
    const baseStats = this.parseBaseStatsDirectly(protagonist);
    
    // 解析战斗属性
    const combatStats = this.parseCombatStats(protagonist, result.stats);
    
    // 解析经济属性
    const economyStats = this.parseEconomyStats(result.stats);
    
    // 解析修炼属性
    const cultivationStats = this.parseCultivationStats(result.stats);
    
    // 统计总效果数
    for (const [, statResult] of result.stats) {
      totalEffects += statResult.contributions.length;
    }
    
    return {
      baseStats,
      combatStats,
      economyStats,
      cultivationStats,
      timestamp: Date.now(),
      totalEffects,
    };
  }
  
  /**
   * 直接从主角数据解析五维属性（不通过计算系统）
   */
  private parseBaseStatsDirectly(protagonist: Protagonist): StatDetailBreakdown[] {
    const results: StatDetailBreakdown[] = [];
    const statKeys: Array<keyof BaseStats> = ['体质', '灵根', '悟性', '幸运', '意志'];
    
    for (const key of statKeys) {
      const baseValue = protagonist.stats.base[key];
      const growthValue = protagonist.stats.growth[key];
      const finalValue = baseValue + growthValue;
      
      // 检查是否有属性上限加成
      const capBonus = protagonist.statCapBonuses?.[key] || 0;
      const bonuses: StatBonusSource[] = [];
      
      if (capBonus > 0) {
        bonuses.push({
          name: '天赋机缘',
          category: 'innate',
          value: capBonus,
          isPercentage: false,
          description: '来自出身的额外天赋',
        });
      }
      
      results.push({
        statName: key,
        statId: key,
        baseValue,
        growthValue,
        finalValue: finalValue + capBonus,
        bonuses,
        totalBonus: capBonus,
        hasBonus: bonuses.length > 0,
        summary: this.generateBaseStatSummary(key, baseValue, growthValue, capBonus),
      });
    }
    
    return results;
  }
  
  /**
   * 解析战斗属性
   */
  private parseCombatStats(
    protagonist: Protagonist,
    stats: Map<CalculableStat, StatCalculationResult>
  ): StatDetailBreakdown[] {
    const results: StatDetailBreakdown[] = [];
    
    // 使用主角的实际 HP/MP 数据
    results.push(this.createCombatStatBreakdown(
      'maxHp',
      '生命上限',
      protagonist.maxHp,
      stats.get('maxHp')
    ));
    
    results.push(this.createCombatStatBreakdown(
      'maxMp',
      '法力上限',
      protagonist.maxMp,
      stats.get('maxMp')
    ));
    
    // 其他战斗属性
    const otherCombatStats: CalculableStat[] = ['attack', 'defense', 'critRate', 'critDamage', 'dodgeRate'];
    for (const statId of otherCombatStats) {
      const statResult = stats.get(statId);
      if (statResult) {
        results.push(this.createStatBreakdownFromResult(statId, statResult));
      }
    }
    
    return results;
  }
  
  /**
   * 解析经济属性
   */
  private parseEconomyStats(
    stats: Map<CalculableStat, StatCalculationResult>
  ): StatDetailBreakdown[] {
    const economyStatIds: CalculableStat[] = [
      'expGain', 'spiritStoneGain', 'dropRate', 'rarityBoost'
    ];
    
    return economyStatIds
      .map(statId => stats.get(statId))
      .filter((r): r is StatCalculationResult => r != null)
      .map(result => this.createStatBreakdownFromResult(result.stat, result));
  }
  
  /**
   * 解析修炼属性
   */
  private parseCultivationStats(
    stats: Map<CalculableStat, StatCalculationResult>
  ): StatDetailBreakdown[] {
    const cultivationStatIds: CalculableStat[] = [
      'cultivationExp', 'breakthroughRate', 'techniqueExp'
    ];
    
    return cultivationStatIds
      .map(statId => stats.get(statId))
      .filter((r): r is StatCalculationResult => r != null)
      .map(result => this.createStatBreakdownFromResult(result.stat, result));
  }
  
  /**
   * 创建战斗属性分解
   */
  private createCombatStatBreakdown(
    statId: CalculableStat,
    displayName: string,
    actualValue: number,
    statResult?: StatCalculationResult
  ): StatDetailBreakdown {
    const bonuses = statResult ? this.extractBonuses(statResult.contributions) : [];
    const baseValue = statResult?.baseValue ?? actualValue;
    const totalBonus = actualValue - baseValue;
    
    return {
      statName: displayName,
      statId,
      baseValue,
      growthValue: 0,
      finalValue: actualValue,
      bonuses,
      totalBonus,
      hasBonus: bonuses.length > 0 || totalBonus !== 0,
      summary: this.generateSummary(displayName, baseValue, 0, totalBonus),
    };
  }
  
  /**
   * 从计算结果创建属性分解
   */
  private createStatBreakdownFromResult(
    statId: CalculableStat,
    statResult: StatCalculationResult
  ): StatDetailBreakdown {
    const displayName = STAT_DISPLAY_NAMES[statId] || statId;
    const bonuses = this.extractBonuses(statResult.contributions);
    const totalBonus = statResult.finalValue - statResult.baseValue;
    
    return {
      statName: displayName,
      statId,
      baseValue: statResult.baseValue,
      growthValue: 0,
      finalValue: statResult.finalValue,
      bonuses,
      totalBonus,
      hasBonus: bonuses.length > 0,
      summary: this.generateSummary(displayName, statResult.baseValue, 0, totalBonus),
    };
  }
  
  /**
   * 从效果贡献中提取加成来源
   */
  private extractBonuses(
    contributions: EffectContribution[]
  ): StatBonusSource[] {
    // 按来源类型分组
    const grouped = new Map<string, StatBonusSource>();
    
    for (const contribution of contributions) {
      // 跳过无效贡献
      if (!contribution.sourceType || contribution.value === undefined) continue;
      
      const category = categorizeSourceType(contribution.sourceType);
      const displayName = SOURCE_DISPLAY_NAMES[contribution.sourceType] || contribution.sourceType;
      
      // 合并相同来源的效果
      const key = `${contribution.sourceType}_${contribution.sourceName || 'unknown'}`;
      const existing = grouped.get(key);
      
      if (existing) {
        existing.value += contribution.value;
      } else {
        grouped.set(key, {
          name: displayName,
          category,
          value: contribution.value,
          isPercentage: contribution.calcType === 'multiply',
          sourceDetail: contribution.sourceName,
        });
      }
    }
    
    // 转换为数组并排序
    return Array.from(grouped.values())
      .filter(bonus => Math.abs(bonus.value) > 0.0001) // 过滤微小值
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }
  
  /**
   * 生成五维属性描述摘要
   */
  private generateBaseStatSummary(
    statName: string,
    baseValue: number,
    growthValue: number,
    capBonus: number
  ): string {
    const parts: string[] = [];
    
    if (baseValue > 0) {
      parts.push(`天赋 ${baseValue}`);
    }
    
    if (growthValue > 0) {
      parts.push(`修炼 +${growthValue}`);
    }
    
    if (capBonus > 0) {
      parts.push(`机缘 +${capBonus}`);
    }
    
    return parts.join(' | ');
  }
  
  /**
   * 生成属性描述摘要
   */
  private generateSummary(
    statName: string,
    baseValue: number,
    growthValue: number,
    totalBonus: number
  ): string {
    const parts: string[] = [];
    
    if (baseValue > 0) {
      parts.push(`基础 ${baseValue}`);
    }
    
    if (growthValue > 0) {
      parts.push(`成长 +${growthValue}`);
    }
    
    if (totalBonus > 0) {
      parts.push(`加成 +${totalBonus.toFixed(1)}`);
    } else if (totalBonus < 0) {
      parts.push(`压制 ${totalBonus.toFixed(1)}`);
    }
    
    return parts.join(' | ');
  }
}

// ============================================
// 单例服务
// ============================================

let serviceInstance: StatDetailService | null = null;

export function getStatDetailService(): StatDetailService {
  if (!serviceInstance) {
    serviceInstance = new StatDetailService();
  }
  return serviceInstance;
}
