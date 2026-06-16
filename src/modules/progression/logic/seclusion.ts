// @ts-nocheck — TODO: 统一物品系统迁移后重构
/**
 * 闭关修炼系统
 * 提供多倍修炼功能
 * 
 * 属性增长规则（V2）：
 * - 闭关修炼只获得经验，不直接增加属性
 * - 属性增长只通过突破事件触发
 * - 境界突破成功时：+3~+10点可成长属性（随机分配）
 * - 天人交感效果：+5~+15点全属性可成长
 * - 大彻大悟效果：+3~+8点主属性可成长
 */

import { getMaxExperience } from '@/modules/progression/logic/cultivation';
import { processExperienceGain, calculateBreakthroughTransfer } from '@/modules/progression/logic/experienceSystem';
import { getRealmName } from '@/modules/progression/data/realmCore';
import { getTerminology } from '@/modules/narrative/logic/terminology';
import { Protagonist, CultivationResult, CharacterStats, GrowthStats, WorldType, InventoryItem, createInventoryItem, getGrowthStatCap } from '@/core/types';
import { getMaxLevel } from '@/modules/progression/data/realmData';

// TODO: 统一物品系统迁移 — 暂代
const spiritStoneItems = [{ id: 'spirit_stone', name: '灵石', type: '灵石', rarity: '普通' as const, description: '', stackable: true, maxStack: 999999, effects: [] as never[] }];

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * 闭关类型
 */
export type SeclusionType = 'minor' | 'major' | 'legendary';

/**
 * 闭关配置
 */
export interface SeclusionConfig {
  type: SeclusionType;
  name: string;
  multiplier: number;        // 经验倍数
  unlockLevel: number;       // 解锁等级
  baseCost: number;          // 基础消耗
  costMultiplier: number;    // 消耗倍数（相对于基础修炼）
  duration: number;          // 闭关时长（游戏时间）
  description: string;
}

/**
 * 闭关效果等级
 */
export type SeclusionOutcome = 
  | 'deviation'      // 走火入魔
  | 'heart_demon'    // 心魔入侵
  | 'normal'         // 平平常常
  | 'insight'        // 小有领悟
  | 'enlightenment'  // 大彻大悟
  | 'harmony';       // 天人交感

/**
 * 闭关效果配置
 */
export interface SeclusionOutcomeConfig {
  outcome: SeclusionOutcome;
  name: string;
  probability: number;       // 概率（百分比）
  expMultiplier: number;     // 经验倍数
  description: string;
  isSpecial: boolean;        // 是否为特殊事件
}

/**
 * 闭关结果
 * 
 * V2说明：闭关修炼不再直接增加属性
 * 属性增长只在突破成功或特定效果时触发
 */
export interface SeclusionResult {
  success: boolean;
  message: string;
  seclusionType: SeclusionType;
  outcome: SeclusionOutcome;
  outcomeName: string;
  baseMultiplier: number;    // 基础倍数
  actualMultiplier: number;  // 实际倍数（包含效果加成）
  cost: number;              // 实际消耗
  experienceGain: number;   // 经验获得
  statChanges?: Partial<GrowthStats>; // 可成长属性变化
  itemsCost: InventoryItem[];
  breakthroughAttempt?: boolean;
  breakthroughSuccess?: boolean;
  newLevel?: number;
  newRealm?: string;
  canAfford?: boolean;
}

/**
 * 闭关配置表
 */
export const SECLUSION_CONFIGS: Record<SeclusionType, SeclusionConfig> = {
  minor: {
    type: 'minor',
    name: '小闭关',
    multiplier: 10,
    unlockLevel: 10,
    baseCost: 20,
    costMultiplier: 10,
    duration: 1,
    description: '短暂闭关，十倍修炼效率',
  },
  major: {
    type: 'major',
    name: '大闭关',
    multiplier: 100,
    unlockLevel: 30,
    baseCost: 20,
    costMultiplier: 125,  // 12.5倍基础消耗，略有溢价
    duration: 3,
    description: '深度闭关，百倍修炼效率',
  },
  legendary: {
    type: 'legendary',
    name: '绝世闭关',
    multiplier: 1000,
    unlockLevel: 50,
    baseCost: 20,
    costMultiplier: 1750, // 17.5倍基础消耗，更高溢价
    duration: 7,
    description: '绝世闭关，千倍修炼效率，可遇不可求',
  },
};

/**
 * 闭关效果配置表
 */
export const SECLUSION_OUTCOMES: SeclusionOutcomeConfig[] = [
  {
    outcome: 'deviation',
    name: '走火入魔',
    probability: 5,
    expMultiplier: 0.5,
    description: '灵气逆行，经脉受损，修为大幅亏损',
    isSpecial: false,
  },
  {
    outcome: 'heart_demon',
    name: '心魔入侵',
    probability: 10,
    expMultiplier: 0.7,
    description: '心魔作祟，道心不稳，效果大打折扣',
    isSpecial: false,
  },
  {
    outcome: 'normal',
    name: '平平常常',
    probability: 50,
    expMultiplier: 1.0,
    description: '按部就班，无惊无险',
    isSpecial: false,
  },
  {
    outcome: 'insight',
    name: '小有领悟',
    probability: 25,
    expMultiplier: 1.2,
    description: '灵光一闪，略有感悟',
    isSpecial: false,
  },
  {
    outcome: 'enlightenment',
    name: '大彻大悟',
    probability: 8,
    expMultiplier: 1.5,
    description: '顿悟真理，修为精进',
    isSpecial: false,
  },
  {
    outcome: 'harmony',
    name: '天人交感',
    probability: 2,
    expMultiplier: 3.0,
    description: '与天地共鸣，大道显化，修为暴涨',
    isSpecial: true,
  },
];

/**
 * 世界特定的闭关描述
 */
const SECLUSION_DESCRIPTIONS: Record<WorldType, Record<SeclusionOutcome, { start: string[], end: string[] }>> = {
  '修仙': {
    deviation: {
      start: ['你进入闭关状态，准备冲击境界...', '洞府阵法启动，灵气汇聚...'],
      end: ['灵气突然逆行，你喷出一口鲜血！走火入魔！', '经脉逆行，修为受损，此次闭关损失惨重。'],
    },
    heart_demon: {
      start: ['你盘膝而坐，准备闭关修炼...', '心魔悄然而至，但你浑然不觉...'],
      end: ['心魔入侵，幻象丛生，修为仅提升少许。', '道心受扰，此次闭关效果不佳。'],
    },
    normal: {
      start: ['你进入洞府，开始闭关...', '阵法运转，灵气缓缓流入体内...'],
      end: ['闭关结束，修为稳步提升。', '此次闭关平稳完成，修为有所精进。'],
    },
    insight: {
      start: ['你感觉今日灵感涌动，决定闭关...', '天地灵气汇聚，似有所感...'],
      end: ['灵光一闪，对功法有了新的理解！', '小有领悟，修炼效率超出预期。'],
    },
    enlightenment: {
      start: ['你感觉机缘已至，立即进入闭关...', '天道似有感应，灵气异常活跃...'],
      end: ['大彻大悟！瓶颈松动，修为大涨！', '顿悟天道真理，此次闭关收获巨大！'],
    },
    harmony: {
      start: ['天降异象，你抓住这千载难逢的机会闭关...', '天人交感，大道显化！'],
      end: ['天地共鸣，灵气如江河入海！修为暴涨！', '得天道眷顾，此次闭关成就非凡！'],
    },
  },
  '高武': {
    deviation: {
      start: ['你进入密室，准备闭关...', '真气运转，准备冲击瓶颈...'],
      end: ['真气暴走，经脉受损！走火入魔！', '内力失控，此次闭关损失惨重。'],
    },
    heart_demon: {
      start: ['你静心凝神，开始闭关...', '武道意志面临考验...'],
      end: ['心魔干扰，武道意志动摇。', '未能坚守本心，效果大打折扣。'],
    },
    normal: {
      start: ['你运转功法，开始闭关修炼...', '真气在经脉中缓缓流转...'],
      end: ['闭关结束，内力更加浑厚。', '真气运转更加顺畅，实力提升。'],
    },
    insight: {
      start: ['你对武技有了新的理解，决定闭关...', '武道感悟涌上心头...'],
      end: ['对武技的领悟更深一层！', '武学造诣有所提升。'],
    },
    enlightenment: {
      start: ['你感觉武道瓶颈即将突破...', '血脉隐隐躁动，似有大机缘...'],
      end: ['武道通神！瓶颈突破，实力大涨！', '顿悟武道真谛，战力飙升！'],
    },
    harmony: {
      start: ['天地共鸣，武道意志与天地交融...', '武道极致，天人合一！'],
      end: ['天人合一！武道意志达到新境界！', '得天地认可，实力暴涨！'],
    },
  },
  '科技': {
    deviation: {
      start: ['进入强化舱，启动进化程序...', '基因优化程序开始运行...'],
      end: ['基因序列异常！进化出现偏差！', '系统故障，强化效果大打折扣。'],
    },
    heart_demon: {
      start: ['神经链接建立，准备深度训练...', '意识进入虚拟空间...'],
      end: ['神经链接不稳定，训练效果不佳。', '意识波动干扰，进化受阻。'],
    },
    normal: {
      start: ['进入深度强化模式...', '基因优化程序正常运行...'],
      end: ['强化完成，各项指标稳步提升。', '进化程序顺利结束。'],
    },
    insight: {
      start: ['检测到最佳进化窗口，启动强化...', '系统优化算法有所突破...'],
      end: ['算法优化成功，效率超出预期！', '新的进化路径被发现。'],
    },
    enlightenment: {
      start: ['基因链出现良性突变征兆...', '检测到罕见的进化契机...'],
      end: ['基因跃迁成功！能力大幅提升！', '进化瓶颈突破，获得质的飞跃！'],
    },
    harmony: {
      start: ['未知能量反应！启动紧急进化协议...', '与宇宙能量场产生共振！'],
      end: ['能量共振完成！获得超凡进化！', '宇宙能量融入基因，成为完美生命体！'],
    },
  },
  '魔幻': {
    deviation: {
      start: ['进入魔法阵，准备冥想...', '魔力核心开始凝聚...'],
      end: ['魔力暴走！元素反噬！', '魔法失控，魔力核心受损。'],
    },
    heart_demon: {
      start: ['你静心冥想，与元素沟通...', '精神力深入魔法本源...'],
      end: ['精神受扰，元素沟通不畅。', '魔力吸收受阻，效果不佳。'],
    },
    normal: {
      start: ['你开始深度冥想...', '魔力在身边缓缓流转...'],
      end: ['冥想结束，魔力更加充盈。', '魔力核心更加稳固。'],
    },
    insight: {
      start: ['你对魔法有了新的理解...', '元素精灵似乎在向你低语...'],
      end: ['领悟了新的魔法技巧！', '与元素的亲和力提升。'],
    },
    enlightenment: {
      start: ['你感受到魔法的本源在召唤...', '魔力潮汐涌动，机缘已至...'],
      end: ['触摸到魔法本源！境界大涨！', '顿悟魔法真谛，魔力暴涨！'],
    },
    harmony: {
      start: ['元素界与你产生共鸣！', '魔力风暴汇聚，天地变色！'],
      end: ['元素臣服！成为元素之主！', '得元素祝福，魔力无边！'],
    },
  },
  '异能': {
    deviation: {
      start: ['进入静室，准备觉醒训练...', '异能波动开始汇聚...'],
      end: ['异能暴走！能力失控！', '基因排斥反应，能力受损。'],
    },
    heart_demon: {
      start: ['你集中精神，探索异能本源...', '意识深入异能核心...'],
      end: ['精神干扰，异能不稳定的。', '意识波动，训练效果打折。'],
    },
    normal: {
      start: ['你开始深度觉醒训练...', '异能在体内缓缓流动...'],
      end: ['训练结束，异能更加稳定。', '控制能力有所提升。'],
    },
    insight: {
      start: ['你对异能有了新的认知...', '异能波动出现异常活跃...'],
      end: ['开发出异能的新用法！', '对异能的理解更深一层。'],
    },
    enlightenment: {
      start: ['你感觉基因锁即将开启...', '异能本源在召唤你...'],
      end: ['基因锁开启！异能进化！', '觉醒本源之力，实力暴涨！'],
    },
    harmony: {
      start: ['宇宙能量与你产生共鸣！', '异能波动与天地同步！'],
      end: ['觉醒真我！成为异能之神！', '得宇宙认可，异能无边！'],
    },
  },
  '仙侠': {
    deviation: {
      start: ['进入剑阁，准备闭关...', '剑气开始凝聚...'],
      end: ['剑气反噬！经脉受损！', '剑心破碎，修为大跌。'],
    },
    heart_demon: {
      start: ['你静心凝剑，准备闭关...', '剑心面临考验...'],
      end: ['剑心蒙尘，修为提升有限。', '未能坚守剑道，效果不佳。'],
    },
    normal: {
      start: ['你开始剑道闭关...', '剑气在周身流转...'],
      end: ['闭关结束，剑气更加精纯。', '剑道修为稳步提升。'],
    },
    insight: {
      start: ['你对剑法有了新的领悟...', '剑意涌动，似有所感...'],
      end: ['领悟新的剑招！', '剑意更加锋锐。'],
    },
    enlightenment: {
      start: ['你感觉剑道瓶颈即将突破...', '剑心通明，机缘已至...'],
      end: ['剑道通玄！瓶颈突破！', '顿悟剑道真谛，剑气冲霄！'],
    },
    harmony: {
      start: ['天降剑气，万剑朝宗！', '剑道与天道产生共鸣！'],
      end: ['人剑合一！成为剑道至尊！', '得剑道认可，一剑破万法！'],
    },
  },
  '武侠': {
    deviation: {
      start: ['进入密室，准备闭关...', '内力开始运转...'],
      end: ['真气走火入魔！经脉受损！', '内力失控，功力倒退。'],
    },
    heart_demon: {
      start: ['你静心运功，准备闭关...', '内功心法运转...'],
      end: ['心魔干扰，真气运行不畅。', '武学心境受扰，效果打折。'],
    },
    normal: {
      start: ['你开始闭关修炼...', '真气在经脉中流转...'],
      end: ['闭关结束，内力更加浑厚。', '功力稳步提升。'],
    },
    insight: {
      start: ['你对武功有了新的理解...', '武学感悟涌上心头...'],
      end: ['领悟新的招式！', '武学造诣提升。'],
    },
    enlightenment: {
      start: ['你感觉武学瓶颈即将突破...', '武学真谛若隐若现...'],
      end: ['武学大成！瓶颈突破！', '顿悟武学奥义，功力暴涨！'],
    },
    harmony: {
      start: ['天地共鸣，武学与天道交融！', '武学意境达到极致！'],
      end: ['武道通神！成为武林至尊！', '得天地认可，无敌于天下！'],
    },
  },
  '末世': {
    deviation: {
      start: ['进入安全屋，准备进化...', '晶体能量开始吸收...'],
      end: ['基因崩溃！进化失败！', '辐射过量，身体受损。'],
    },
    heart_demon: {
      start: ['你准备进行深度进化...', '基因开始重组...'],
      end: ['基因排斥，进化受阻。', '身体产生抗辐射反应。'],
    },
    normal: {
      start: ['你开始深度进化...', '晶体能量缓缓吸收...'],
      end: ['进化完成，能力稳步提升。', '基因更加稳定。'],
    },
    insight: {
      start: ['你对进化有了新的认知...', '基因序列出现异常活跃...'],
      end: ['发现新的进化方向！', '适应能力增强。'],
    },
    enlightenment: {
      start: ['你感觉基因即将跃迁...', '进化临界点即将到来...'],
      end: ['基因跃迁成功！能力暴涨！', '突破进化瓶颈，获得新能力！'],
    },
    harmony: {
      start: ['与辐射源产生共鸣！', '基因与末日环境完美融合！'],
      end: ['成为新人类！进化的顶点！', '得末日认可，生存之王！'],
    },
  },
};

/**
 * 获取闭关消耗
 */
export function getSeclusionCost(type: SeclusionType, baseCost: number = 20): number {
  const config = SECLUSION_CONFIGS[type];
  return Math.floor(baseCost * config.costMultiplier);
}

/**
 * 检查是否解锁闭关类型
 */
export function isSeclusionUnlocked(type: SeclusionType, level: number): boolean {
  return level >= SECLUSION_CONFIGS[type].unlockLevel;
}

/**
 * 获取已解锁的闭关类型
 */
export function getUnlockedSeclusions(level: number): SeclusionConfig[] {
  return Object.values(SECLUSION_CONFIGS).filter(config => level >= config.unlockLevel);
}

/**
 * 抽取闭关效果
 */
export function drawSeclusionOutcome(): SeclusionOutcomeConfig {
  const roll = Math.random() * 100;
  let cumulative = 0;
  
  for (const outcome of SECLUSION_OUTCOMES) {
    cumulative += outcome.probability;
    if (roll < cumulative) {
      return outcome;
    }
  }
  
  // 默认返回平平常常
  return SECLUSION_OUTCOMES[2];
}

/**
 * 获取世界术语
 */
function getWorldTerms(worldType: WorldType) {
  const term = getTerminology(worldType);
  return {
    power: term.power,
    energy: term.energy,
    resource: term.resource,
  };
}

/**
 * 获取灵石数量
 */
function getSpiritStoneCount(inventory: InventoryItem[]): number {
  const item = inventory.find(i => i.definition.id === 'spirit_stone');
  return item ? item.quantity : 0;
}

/**
 * 执行闭关修炼
 */
export function executeSeclusion(
  protagonist: Protagonist,
  seclusionType: SeclusionType
): SeclusionResult {
  const config = SECLUSION_CONFIGS[seclusionType];
  const worldType = protagonist.world.type;
  const terms = getWorldTerms(worldType);
  const descriptions = SECLUSION_DESCRIPTIONS[worldType];
  
  // 检查等级是否足够
  if (protagonist.level < config.unlockLevel) {
    return {
      success: false,
      message: `等级不足！需要达到${config.unlockLevel}级才能进行${config.name}。`,
      seclusionType,
      outcome: 'normal',
      outcomeName: '等级不足',
      baseMultiplier: config.multiplier,
      actualMultiplier: 0,
      cost: 0,
      experienceGain: 0,
      itemsCost: [],
      canAfford: false,
    };
  }
  
  // 计算消耗
  const cost = getSeclusionCost(seclusionType);
  const spiritStones = getSpiritStoneCount(protagonist.inventory);
  
  // 检查资源是否足够
  if (spiritStones < cost) {
    return {
      success: false,
      message: `${terms.resource}不足！${config.name}需要${cost}${terms.resource}，当前只有${spiritStones}。`,
      seclusionType,
      outcome: 'normal',
      outcomeName: '资源不足',
      baseMultiplier: config.multiplier,
      actualMultiplier: 0,
      cost,
      experienceGain: 0,
      itemsCost: [],
      canAfford: false,
    };
  }
  
  // 抽取闭关效果
  const outcome = drawSeclusionOutcome();
  
  // 计算实际倍数
  const actualMultiplier = config.multiplier * outcome.expMultiplier;
  
  // 生成描述
  const startDesc = descriptions[outcome.outcome].start[random(0, descriptions[outcome.outcome].start.length - 1)];
  const endDesc = descriptions[outcome.outcome].end[random(0, descriptions[outcome.outcome].end.length - 1)];
  
  // 消耗资源
  const itemsCost: InventoryItem[] = [
    createInventoryItem(spiritStoneItems[0], cost),
  ];
  
  // 计算经验获得
  // 基础经验：单次修炼的20经验 × 倍数
  const levelBonus = Math.floor(protagonist.level / 10) * 5;
  const baseExpPerCultivation = 20 + levelBonus;
  const totalExpGain = Math.floor(baseExpPerCultivation * actualMultiplier);
  
  // 处理经验获得和突破
  const maxExp = getMaxExperience(protagonist.level);
  const expResult = processExperienceGain(
    protagonist.experience,
    totalExpGain,
    maxExp,
    protagonist.overflowExperience
  );
  
  let newExp = expResult.newExp;
  let newOverflowExp = expResult.newOverflow;
  let newLevel = protagonist.level;
  let newRealm = protagonist.realm;
  let breakthroughAttempt = false;
  let breakthroughSuccess = false;
  
  // 检查是否达到突破条件
  const maxLevel = getMaxLevel(protagonist.world.realmSystem);
  if (newExp >= maxExp && protagonist.level < maxLevel) {
    breakthroughAttempt = true;
    // 闭关突破成功率有加成
    const finalStats = {
      体质: protagonist.stats.base.体质 + protagonist.stats.growth.体质,
      灵根: protagonist.stats.base.灵根 + protagonist.stats.growth.灵根,
      悟性: protagonist.stats.base.悟性 + protagonist.stats.growth.悟性,
      幸运: protagonist.stats.base.幸运 + protagonist.stats.growth.幸运,
      意志: protagonist.stats.base.意志 + protagonist.stats.growth.意志,
    };
    const baseBreakthroughChance = 50 + finalStats.幸运 * 0.5;
    const seclusionBonus = seclusionType === 'legendary' ? 30 : seclusionType === 'major' ? 15 : 5;
    const breakthroughChance = Math.min(95, baseBreakthroughChance + seclusionBonus);
    
    if (Math.random() * 100 < breakthroughChance) {
      breakthroughSuccess = true;
      newLevel += 1;
      newRealm = getRealmName(protagonist.world.realmSystem, newLevel);
      const nextMaxExp = getMaxExperience(newLevel);
      newExp = calculateBreakthroughTransfer(newOverflowExp, nextMaxExp);
      newOverflowExp = 0;
    }
  }
  
  // 构建消息
  let message = `【${config.name}】\n${startDesc}\n\n`;
  message += `【闭关效果】${outcome.name}\n${outcome.description}\n\n`;
  message += `${endDesc}\n\n`;
  message += `【消耗】${cost} ${terms.resource}\n`;
  message += `【基础倍数】${config.multiplier}倍 × ${outcome.expMultiplier} = ${actualMultiplier.toFixed(1)}倍\n`;
  message += `【获得经验】${totalExpGain}`;
  
  if (breakthroughAttempt) {
    if (breakthroughSuccess) {
      message += `\n\n【境界突破】${protagonist.level}级 → ${newLevel}级！`;
    } else {
      message += `\n\n【突破尝试】感受到了突破契机，但未能成功。`;
    }
  }
  
  if (outcome.isSpecial) {
    message += `\n\n🌟 天人交感！得天道眷顾！`;
  }
  
  return {
    success: true,
    message,
    seclusionType,
    outcome: outcome.outcome,
    outcomeName: outcome.name,
    baseMultiplier: config.multiplier,
    actualMultiplier,
    cost,
    experienceGain: totalExpGain,
    itemsCost,
    breakthroughAttempt,
    breakthroughSuccess,
    newLevel,
    newRealm,
    canAfford: true,
  };
}

/**
 * 获取闭关效果颜色
 */
export function getOutcomeColor(outcome: SeclusionOutcome): string {
  const colors: Record<SeclusionOutcome, string> = {
    deviation: 'text-red-500',
    heart_demon: 'text-orange-500',
    normal: 'text-blue-500',
    insight: 'text-green-500',
    enlightenment: 'text-purple-500',
    harmony: 'text-yellow-500',
  };
  return colors[outcome];
}

/**
 * 获取闭关效果背景色
 */
export function getOutcomeBgColor(outcome: SeclusionOutcome): string {
  const colors: Record<SeclusionOutcome, string> = {
    deviation: 'bg-red-500/10 border-red-500/30',
    heart_demon: 'bg-orange-500/10 border-orange-500/30',
    normal: 'bg-blue-500/10 border-blue-500/30',
    insight: 'bg-green-500/10 border-green-500/30',
    enlightenment: 'bg-purple-500/10 border-purple-500/30',
    harmony: 'bg-yellow-500/10 border-yellow-500/30',
  };
  return colors[outcome];
}
