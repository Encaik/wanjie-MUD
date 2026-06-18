/**
 * 阶段二：策略选择（phase2_strategy）
 *
 * 心魔提出诱惑/考验，玩家从3-4种应对策略中选择。
 * 每种策略的成败受 CoreStats、流派技能和心魔类型影响。
 *
 * @module modules/progression/logic/demonBreakthrough
 */

import type {
  GeneratedDemon,
  StrategyChoice,
  StrategyChoiceResult,
  StrategyStatType,
  PlayerCoreStatsSnapshot,
  DemonType,
} from './types';

// ============================================
// 策略生成
// ============================================

/**
 * 根据心魔类型和玩家数据生成可选的应对策略
 *
 * 每种心魔类型提供3种通用策略（坚守本心、以智破魔、正面交锋）。
 * 魔修流派额外提供第4选项"吸收心魔"。
 *
 * @param demon - 当前心魔
 * @param coreStats - 玩家 CoreStats
 * @param cultivationPath - 玩家修炼流派
 * @returns 策略选项列表
 */
export function generateStrategyChoices(
  demon: GeneratedDemon,
  coreStats: PlayerCoreStatsSnapshot,
  cultivationPath: string | null,
): StrategyChoice[] {
  const choices: StrategyChoice[] = [];

  // 通用策略一：坚守本心（willpower检定）
  choices.push(createChoice(
    0,
    demon.type,
    'willpower',
    coreStats.willpower,
  ));

  // 通用策略二：以智破魔（intelligence检定）
  choices.push(createChoice(
    1,
    demon.type,
    'intelligence',
    coreStats.intelligence,
  ));

  // 通用策略三：正面交锋（根据心魔弱点选择物理或法术）
  const combatStat: StrategyStatType = demon.weakPointType === 'physical'
    ? 'physicalATK'
    : 'specialATK';
  const combatValue = combatStat === 'physicalATK'
    ? coreStats.physicalATK
    : coreStats.specialATK;
  choices.push(createChoice(
    2,
    demon.type,
    combatStat,
    combatValue,
  ));

  // 魔修专属第四选项：吸收心魔
  if (cultivationPath === 'demon') {
    choices.push(createDemonAbsorbChoice(3, coreStats));
  }

  // 为每项计算实际成功率
  return choices.map(c => ({
    ...c,
    actualRate: clampSuccessRate(
      c.baseRate + c.statValue * c.statWeight,
    ),
  }));
}

// ============================================
// 策略执行
// ============================================

/**
 * 执行玩家选择的策略并判定结果
 *
 * @param choice - 玩家选择的策略
 * @param coreStats - 玩家 CoreStats
 * @param cultivationPath - 玩家流派
 * @param seed - 随机种子
 * @returns 策略执行结果
 */
export function executeStrategyChoice(
  choice: StrategyChoice,
  coreStats: PlayerCoreStatsSnapshot,
  cultivationPath: string | null,
  seed: number,
): StrategyChoiceResult {
  // 确定随机值（seed-based）
  const roll = ((seed * 16807 + choice.index * 7919) % 2147483647) / 2147483647;

  const isDemonAbsorb = choice.demonExclusive;
  const success = roll < choice.actualRate;

  // 计算属性变化
  const statChanges = success
    ? { ...choice.successEffect.statBonus }
    : { ...choice.failEffect.statBonus };

  // 魔修吸收心魔成功时双倍属性
  if (isDemonAbsorb && success) {
    for (const key of Object.keys(statChanges) as Array<keyof typeof statChanges>) {
      const val = statChanges[key];
      if (val !== undefined) {
        statChanges[key] = val * 2;
      }
    }
  }

  const stabilityChange = success
    ? choice.successEffect.stabilityChange
    : choice.failEffect.stabilityChange;

  const demonChanceChange = success
    ? choice.successEffect.demonChanceChange
    : choice.failEffect.demonChanceChange;

  const message = success
    ? choice.successEffect.description
    : choice.failEffect.description;

  return {
    choiceIndex: choice.index,
    isDemonAbsorb,
    success,
    message,
    statChanges,
    stabilityChange,
    demonChanceChange,
  };
}

// ============================================
// 策略选项构建
// ============================================

/**
 * 创建通用策略选项
 */
function createChoice(
  index: number,
  demonType: DemonType,
  statType: StrategyStatType,
  statValue: number,
): StrategyChoice {
  const config = STRATEGY_CONFIGS[statType];
  const demonConfig = DEMON_STRATEGY_TEXTS[demonType];

  return {
    index,
    text: (demonConfig as unknown as Record<string, string>)[statType] ?? config.defaultText,
    statType,
    baseRate: config.baseRate,
    actualRate: 0, // 后续计算
    statValue,
    statWeight: config.statWeight,
    successEffect: {
      stabilityChange: config.successStability,
      statBonus: config.successStats,
      demonChanceChange: config.successDemonChance,
      demonWeakened: true,
      description: (demonConfig.successTexts as unknown as Record<string, string>)[statType] ?? config.successDescription,
    },
    failEffect: {
      stabilityChange: config.failStability,
      statBonus: config.failStats,
      demonChanceChange: config.failDemonChance,
      demonWeakened: false,
      description: (demonConfig.failTexts as unknown as Record<string, string>)[statType] ?? config.failDescription,
    },
    demonExclusive: false,
  };
}

/**
 * 创建魔修专属"吸收心魔"选项
 */
function createDemonAbsorbChoice(
  index: number,
  coreStats: PlayerCoreStatsSnapshot,
): StrategyChoice {
  return {
    index,
    text: '吞噬心魔，将其炼化为自身力量（魔修专属）',
    statType: 'willpower',
    baseRate: 0.15, // 极低基础成功率
    actualRate: 0,
    statValue: coreStats.willpower,
    statWeight: 0.003, // 每点意志 +0.3%
    successEffect: {
      stabilityChange: 30,
      statBonus: { 意志: 5, 体质: 3 },
      demonChanceChange: -0.05,
      demonWeakened: true,
      description: '你将心魔彻底吞噬！它化为纯粹的力量融入你的体内，你的修为大涨！',
    },
    failEffect: {
      stabilityChange: -50,
      statBonus: { 意志: -3, 体质: -2 },
      demonChanceChange: 0.15,
      demonWeakened: false,
      description: '心魔反噬！它在你体内肆虐，你的修为大幅受损……',
    },
    demonExclusive: true,
  };
}

// ============================================
// 策略配置表
// ============================================

/** 策略类型配置 */
interface StrategyConfig {
  /** 策略默认显示文本 */
  defaultText: string;
  /** 基础成功率 */
  baseRate: number;
  /** 主属性权重（每点属性增加值） */
  statWeight: number;
  /** 成功时心境稳定度变化 */
  successStability: number;
  /** 成功时属性加成 */
  successStats: Record<string, number>;
  /** 成功时心魔概率变化 */
  successDemonChance: number;
  /** 成功描述文本 */
  successDescription: string;
  /** 失败时心境稳定度变化 */
  failStability: number;
  /** 失败时属性损失 */
  failStats: Record<string, number>;
  /** 失败时心魔概率变化 */
  failDemonChance: number;
  /** 失败描述文本 */
  failDescription: string;
}

const STRATEGY_CONFIGS: Record<string, StrategyConfig> = {
  willpower: {
    defaultText: '坚守本心，不为所动',
    baseRate: 0.40,
    statWeight: 0.008,
    successStability: 25,
    successStats: { 意志: 2 },
    successDemonChance: -0.03,
    successDescription: '你的意志坚如磐石，心魔在你面前节节败退！',
    failStability: -30,
    failStats: { 意志: -1 },
    failDemonChance: 0.04,
    failDescription: '心魔趁机侵入你的心神，你的道心动摇了……',
  },
  intelligence: {
    defaultText: '以智破魔，看穿虚妄',
    baseRate: 0.50,
    statWeight: 0.006,
    successStability: 15,
    successStats: { 悟性: 2 },
    successDemonChance: -0.02,
    successDescription: '你洞悉了心魔的本质，以智慧化解了它的诱惑！',
    failStability: -15,
    failStats: { 悟性: -1 },
    failDemonChance: 0.02,
    failDescription: '心魔的花言巧语迷惑了你，你一时间难以分辨真假……',
  },
  physicalATK: {
    defaultText: '正面交锋，以力破之',
    baseRate: 0.35,
    statWeight: 0.010,
    successStability: 20,
    successStats: { 体质: 3 },
    successDemonChance: -0.02,
    successDescription: '你以无匹的力量击溃了心魔的显化，它仓皇逃窜！',
    failStability: -25,
    failStats: { 体质: -2 },
    failDemonChance: 0.05,
    failDescription: '心魔以力抗力，你在正面交锋中落了下风……',
  },
  specialATK: {
    defaultText: '正面交锋，以力破之',
    baseRate: 0.35,
    statWeight: 0.010,
    successStability: 20,
    successStats: { 灵根: 3 },
    successDemonChance: -0.02,
    successDescription: '你的力量贯穿了心魔的核心，将其彻底击溃！',
    failStability: -25,
    failStats: { 灵根: -2 },
    failDemonChance: 0.05,
    failDescription: '心魔的力量超乎你想象，你的攻击未能奏效……',
  },
};

/** 不同心魔类型的策略文本 */
interface DemonStrategyTexts {
  willpower: string;
  intelligence: string;
  physicalATK: string;
  specialATK: string;
  successTexts: Record<string, string>;
  failTexts: Record<string, string>;
}

const DEMON_STRATEGY_TEXTS: Record<DemonType, DemonStrategyTexts> = {
  greed: {
    willpower: '坚守本心，拒绝诱惑',
    intelligence: '分析贪婪的根源，看清得失',
    physicalATK: '以实力证明无需外在之物',
    specialATK: '以实力证明无需外在之物',
    successTexts: {
      willpower: '你守住了本心，贪念之魔的诱惑对你毫无作用！',
      intelligence: '你明白了贪婪的空虚，心魔的力量随之消散！',
      physicalATK: '你的实力证明了一切——真正的强者无需贪图外物！',
      specialATK: '你的力量击破了心魔的虚妄——真正的强者无需外物！',
    },
    failTexts: {
      willpower: '贪欲涌上心头，你开始觊觎那些本不属于你的东西……',
      intelligence: '理智被贪欲蒙蔽，你开始看不清真正的得失……',
      physicalATK: '无法证明自己的节制，心魔变本加厉……',
      specialATK: '力量未能奏效，贪欲更深地侵蚀了你……',
    },
  },
  fear: {
    willpower: '直面恐惧，勇气为盾',
    intelligence: '理性分析恐惧的根源',
    physicalATK: '以行动证明你的无畏',
    specialATK: '以行动证明你的无畏',
    successTexts: {
      willpower: '恐惧在你坚定的意志面前消散了！',
      intelligence: '你认清了恐惧的本质，它不过是对未知的过度担忧！',
      physicalATK: '你用行动证明了自己无所畏惧，恐惧之魔不战而退！',
      specialATK: '你的力量粉碎了恐惧的幻象，它消散在光芒中！',
    },
    failTexts: {
      willpower: '恐惧如潮水般淹没你的勇气……',
      intelligence: '过度分析反而让你陷入更深的恐惧……',
      physicalATK: '行动未能驱散恐惧，它更深地笼罩了你……',
      specialATK: '力量在恐惧面前显得苍白无力……',
    },
  },
  arrogance: {
    willpower: '收敛傲气，谦逊审视',
    intelligence: '理性评估自身实力',
    physicalATK: '山外有山，保持敬畏',
    specialATK: '山外有山，保持敬畏',
    successTexts: {
      willpower: '你收敛了内心的傲气，心境重归平和！',
      intelligence: '你清醒地认识到自己还有很长的路要走！',
      physicalATK: '你时刻铭记天外有天，恭敬之心使你更加强大！',
      specialATK: '谦逊使你的力量更加纯粹，傲慢之魔无言以对！',
    },
    failTexts: {
      willpower: '傲慢占据了你的心神，你觉得天下无人能敌……',
      intelligence: '自负蒙蔽了你的判断力，你高估了自己……',
      physicalATK: '恃强凌弱的心态让你渐失武道初心……',
      specialATK: '力量带来的傲慢让你迷失了方向……',
    },
  },
  regret: {
    willpower: '斩断过去，展望未来',
    intelligence: '理解过去的必然性',
    physicalATK: '用新的行动弥补过去',
    specialATK: '用新的行动弥补过去',
    successTexts: {
      willpower: '你毅然斩断了对过去的执念，心境一片澄明！',
      intelligence: '你理解了所有选择都有其意义，无需后悔！',
      physicalATK: '你用新的成就填补了过去的遗憾！',
      specialATK: '你的力量击碎了过去的幻影，新的道路就在眼前！',
    },
    failTexts: {
      willpower: '过去的遗憾如藤蔓般缠绕你的心灵……',
      intelligence: '越是分析过去的错误，越是深陷悔恨……',
      physicalATK: '行动无法抹去过去的遗憾，它依然困扰着你……',
      specialATK: '力量可以摧毁敌人，却无法摧毁记忆……',
    },
  },
  doubt: {
    willpower: '坚定信念，不为所动',
    intelligence: '审视道路，确认方向',
    physicalATK: '用实践证明道路正确',
    specialATK: '用实践证明道路正确',
    successTexts: {
      willpower: '你的道心坚如磐石，疑惑之魔无法动摇！',
      intelligence: '经过审视，你确认了自己的道路是正确的！',
      physicalATK: '实践出真知，你的行动证明了你的道路！',
      specialATK: '你的力量证明了一切，疑惑烟消云散！',
    },
    failTexts: {
      willpower: '疑惑如野草般在你的内心蔓延……',
      intelligence: '想得越多，疑惑越深，你陷入了思维的迷宫……',
      physicalATK: '行动无法给你答案，你依然在迷茫中……',
      specialATK: '力量不能解决一切，你内心的疑问依然存在……',
    },
  },
};

// ============================================
// 工具函数
// ============================================

/** 限制成功率在 10%-90% 之间 */
function clampSuccessRate(rate: number): number {
  return Math.max(0.10, Math.min(0.90, rate));
}
