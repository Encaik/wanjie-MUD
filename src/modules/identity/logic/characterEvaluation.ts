/**
 * 角色评估系统
 * 
 * 多维度评估角色价值，解决"无脑选最高数值"的问题
 * 
 * 核心功能：
 * 1. 属性价值矩阵：根据不同维度（战斗/修炼/生存/探索）计算属性价值
 * 2. 协同效果检测：检测词条组合产生的额外加成
 * 3. 角色定位判断：基于属性分布确定角色定位类型
 */

import { 
  Character, 
  CharacterStats, 
  DimensionScores, 
  SynergyEffect, 
  RoleProfile, 
  RoleArchetype,
  CharacterEvaluation,
  ImpactfulTrait 
} from '@/shared/lib/types';

// ============================================
// 属性价值矩阵
// ============================================

/**
 * 属性在不同维度的权重
 * 以50为基准值，偏离越大影响越大
 */
/**
 * 属性价值矩阵
 * 
 * 设计原则：
 * - 每个维度只关注核心属性，核心属性权重极高
 * - 次要属性权重极低，减少干扰
 * - 负向属性也纳入计算
 */
const ATTRIBUTE_VALUE_MATRIX = {
  // 战斗评分（影响战斗伤害、防御、暴击）
  // 体质=生命根基，意志=战斗意志，幸运=暴击
  combat: {
    体质: 2.0,   // 生命值=体质×10，战斗核心
    意志: 1.5,   // 战斗意志、抗性
    幸运: 1.2,   // 暴击概率
    灵根: 0.3,   // 法术伤害（次要）
    悟性: 0.2,   // 技能学习（几乎无关）
  },
  
  // 修炼评分（影响修炼速度、突破成功率）
  // 灵根=修炼效率，悟性=理解突破，意志=心境
  cultivation: {
    灵根: 2.0,   // 修炼效率基础
    悟性: 1.6,   // 突破悟性要求
    意志: 1.0,   // 突破心境要求
    体质: 0.3,   // 根基（次要）
    幸运: 0.2,   // 随机顿悟（几乎无关）
  },
  
  // 生存评分（影响逃跑成功率、恢复速度）
  // 体质=生命，意志=抗性，幸运=躲避
  survival: {
    体质: 2.0,   // 基础生存能力
    意志: 1.5,   // 精神抗性
    幸运: 1.2,   // 躲避概率
    灵根: 0.8,   // 灵力护盾
    悟性: 0.3,   // 危机判断（次要）
  },
  
  // 探索评分（影响机缘发现、掉落概率）
  // 幸运=核心探索属性，悟性=理解线索
  exploration: {
    幸运: 2.0,   // 核心探索属性
    悟性: 1.4,   // 理解隐藏线索
    意志: 0.6,   // 坚持探索（次要）
    灵根: 0.4,   // 感应灵气（次要）
    体质: 0.3,   // 体力消耗
  },
};

// ============================================
// 协同效果定义
// ============================================

/**
 * 协同效果列表
 * 当特定词条组合同时出现时触发
 */
const SYNERGY_EFFECTS: SynergyEffect[] = [
  // 战斗类协同
  {
    id: 'warrior_soul',
    name: '战魂',
    description: '战斗天赋觉醒',
    traits: ['战斗狂人', '武痴', '血性汉子', '战斗世家'],
    stats: ['体质', '意志'],
    bonus: 5,
    type: 'combat',
  },
  {
    id: 'berserker',
    name: '狂战士',
    description: '愈战愈勇',
    traits: ['血性汉子', '战斗狂人'],
    stats: ['体质', '幸运'],
    bonus: 4,
    type: 'combat',
  },
  
  // 修炼类协同
  {
    id: 'twin_attack',
    name: '双修',
    description: '体质与灵根相辅相成',
    traits: ['强体', '灵慧', '炼体', '灵童'],
    stats: ['体质', '灵根'],
    bonus: 3,
    type: 'cultivation',
  },
  {
    id: 'wisdom_body',
    name: '智体双修',
    description: '悟性与体质相得益彰',
    traits: ['聪明', '强健', '智者', '学者'],
    stats: ['悟性', '体质'],
    bonus: 4,
    type: 'cultivation',
  },
  {
    id: 'enlightenment',
    name: '顿悟',
    description: '高悟性配合灵根，修炼如有神助',
    traits: ['天才', '灵童', '悟性惊人'],
    stats: ['悟性', '灵根'],
    bonus: 6,
    type: 'cultivation',
  },
  {
    id: 'spirit_root',
    name: '天灵根',
    description: '灵根天赋卓越',
    traits: ['天灵根', '变异灵根', '圣灵根'],
    stats: ['灵根'],
    bonus: 8,
    type: 'cultivation',
  },
  
  // 生存类协同
  {
    id: 'iron_will',
    name: '铁意志',
    description: '坚定意志配合强健体魄',
    traits: ['意志坚定', '钢筋铁骨', '坚韧'],
    stats: ['意志', '体质'],
    bonus: 4,
    type: 'survival',
  },
  {
    id: 'fortitude',
    name: '坚韧',
    description: '意志坚定，不屈不挠',
    traits: ['意志坚定', '不屈', '意志如铁'],
    stats: ['意志'],
    bonus: 5,
    type: 'survival',
  },
  
  // 探索类协同
  {
    id: 'fortune_bless',
    name: '天眷',
    description: '幸运与悟性双重加持',
    traits: ['天选之人', '吉星高照', '命运宠儿'],
    stats: ['幸运', '悟性'],
    bonus: 5,
    type: 'exploration',
  },
  {
    id: 'lucky_star',
    name: '幸运星',
    description: '天生的幸运儿',
    traits: ['天选之人', '吉星高照', '天命之人'],
    stats: ['幸运'],
    bonus: 6,
    type: 'exploration',
  },
  {
    id: 'treasure_sense',
    name: '寻宝直觉',
    description: '对宝物有天生的敏感',
    traits: ['寻宝体质', '探宝者', '宝物亲和'],
    stats: ['幸运', '悟性'],
    bonus: 4,
    type: 'exploration',
  },
];

// ============================================
// 角色定位标签映射
// ============================================

const ARCHETYPE_LABELS: Record<RoleArchetype, string> = {
  'combat_warrior': '战斗型',
  'cultivation_genius': '修炼型',
  'survival_master': '生存型',
  'fortune_seeker': '探索型',
  'balanced': '均衡型',
  'specialist': '特化型',
};

const ARCHETYPE_DESCRIPTIONS: Record<RoleArchetype, string> = {
  'combat_warrior': '战斗天赋卓越，体质与意志出众',
  'cultivation_genius': '修炼悟性极高，灵根与悟性卓绝',
  'survival_master': '意志坚定体魄强健，生存能力极强',
  'fortune_seeker': '幸运眷顾悟性不凡，探索机缘无人能及',
  'balanced': '各项属性发展均衡，没有明显短板',
  'specialist': '极端发展某一项能力，其他方面需更多资源弥补',
};

const ARCHETYPE_PLAYSTYLES: Record<RoleArchetype, string> = {
  'combat_warrior': '适合战斗流派，挑战副本，PK对战',
  'cultivation_genius': '适合快速升级，追求境界突破，闭关修炼',
  'survival_master': '适合越级挑战，高难度副本，持久战斗',
  'fortune_seeker': '适合探索机缘，收集装备，刷稀有掉落',
  'balanced': '适合各种玩法，随机应变能力强',
  'specialist': '极限挑战者专属，需要更多资源平衡',
};

// ============================================
// 维度评分计算
// ============================================

/**
 * 核心属性列表（各维度最重要的属性）
 */
const CORE_ATTRIBUTES: Record<string, string[]> = {
  combat: ['体质', '意志', '幸运'],
  cultivation: ['灵根', '悟性', '意志'],
  survival: ['体质', '意志', '幸运'],
  exploration: ['幸运', '悟性', '体质'],
};

/**
 * 使用价值矩阵计算单维度评分
 * 
 * 关键设计：
 * - 只使用核心属性计算，忽略次要属性的干扰
 * - 核心属性权重高，次要属性几乎为0
 * - 以50为基准，偏离越大分数越高/越低
 */
function calculateDimensionScore(
  stats: Record<string, number>,
  dimension: keyof typeof ATTRIBUTE_VALUE_MATRIX
): number {
  const weights = ATTRIBUTE_VALUE_MATRIX[dimension];
  const coreAttrs = CORE_ATTRIBUTES[dimension];
  
  let weightedScore = 0;
  let totalWeight = 0;
  
  for (const [attr, weight] of Object.entries(weights)) {
    const value = stats[attr] || 0;
    // 以50为基准值，偏离越大影响越大
    const deviation = value - 50;
    
    // 只计算核心属性，或者如果属性在矩阵中有权重则计算
    if (weight > 0) {
      weightedScore += deviation * weight;
      totalWeight += weight;
    }
  }
  
  // 计算加权平均偏差
  const avgDeviation = totalWeight > 0 ? weightedScore / totalWeight : 0;
  
  // 映射到 0-100 范围，以50为中心
  // avgDeviation 代表平均偏差值，偏差越大分数越高
  // 假设典型偏差范围是 -20 到 +20，对应 0-100
  const normalizedScore = 50 + (avgDeviation * 2.5);
  
  // 限制在 0-100 范围内
  return Math.max(0, Math.min(100, Math.round(normalizedScore)));
}

/**
 * 计算多维度评分
 * 使用最终属性（base + growth）进行计算
 */
export function calculateDimensionScores(stats: CharacterStats): DimensionScores {
  // 使用最终属性（base + growth）
  const finalStats = {
    体质: stats.base.体质 + stats.growth.体质,
    灵根: stats.base.灵根 + stats.growth.灵根,
    悟性: stats.base.悟性 + stats.growth.悟性,
    幸运: stats.base.幸运 + stats.growth.幸运,
    意志: stats.base.意志 + stats.growth.意志,
  };
  
  const combat = calculateDimensionScore(finalStats, 'combat');
  const cultivation = calculateDimensionScore(finalStats, 'cultivation');
  const survival = calculateDimensionScore(finalStats, 'survival');
  const exploration = calculateDimensionScore(finalStats, 'exploration');
  
  // 综合评分取四维平均
  const overall = Math.round((combat + cultivation + survival + exploration) / 4);
  
  return { combat, cultivation, survival, exploration, overall };
}

// ============================================
// 协同效果检测
// ============================================

/**
 * 检测词条组合触发的协同效果
 */
export function detectSynergies(traits: ImpactfulTrait[]): SynergyEffect[] {
  const traitNames = traits.map(t => t.name);
  const detected: SynergyEffect[] = [];
  
  for (const synergy of SYNERGY_EFFECTS) {
    // 检查是否有足够的匹配词条
    const matchedTraits = synergy.traits.filter(t => traitNames.includes(t));
    
    // 需要至少2个词条匹配才能触发协同
    if (matchedTraits.length >= 2) {
      detected.push({
        ...synergy,
        traits: matchedTraits, // 只保留实际匹配的词条名
      });
    }
  }
  
  // 限制每种类型最多1个协同效果
  const byType = new Map<string, SynergyEffect>();
  for (const s of detected) {
    if (!byType.has(s.type) || byType.get(s.type)!.bonus < s.bonus) {
      byType.set(s.type, s);
    }
  }
  
  return Array.from(byType.values());
}

// ============================================
// 角色定位判断
// ============================================

/**
 * 定位阈值配置
 */
const ARCHETYPE_THRESHOLDS = {
  // 方差小于此值认为是均衡型（各维度发展接近）
  balancedVariance: 8,
  // 主次维度差距大于此值认为是特化型（某一维度特别突出）
  specialistGap: 15,
};

/**
 * 根据属性分布确定角色定位
 */
function determineArchetype(
  scores: DimensionScores,
  stats: CharacterStats
): RoleProfile {
  const scoresArray = [
    { type: 'combat' as const, score: scores.combat },
    { type: 'cultivation' as const, score: scores.cultivation },
    { type: 'survival' as const, score: scores.survival },
    { type: 'exploration' as const, score: scores.exploration },
  ].sort((a, b) => b.score - a.score);
  
  const primary = scoresArray[0];
  const secondary = scoresArray[1];
  const tertiary = scoresArray[2];
  const quaternary = scoresArray[3];
  
  // 计算方差，判断是否为均衡型
  const mean = (scores.combat + scores.cultivation + scores.survival + scores.exploration) / 4;
  const variance = Math.sqrt(
    Math.pow(scores.combat - mean, 2) +
    Math.pow(scores.cultivation - mean, 2) +
    Math.pow(scores.survival - mean, 2) +
    Math.pow(scores.exploration - mean, 2)
  );
  
  // 主次属性差距
  const primaryGap = primary.score - secondary.score;
  
  // 判断定位类型
  // 1. 均衡型：方差很小，四维发展均衡
  // 2. 特化型：某维度特别突出（主次差距大）
  // 3. 普通定位：有一定偏向但不极端
  
  if (variance < ARCHETYPE_THRESHOLDS.balancedVariance) {
    return {
      archetype: 'balanced',
      label: ARCHETYPE_LABELS['balanced'],
      description: ARCHETYPE_DESCRIPTIONS['balanced'],
      recommendedPlaystyle: ARCHETYPE_PLAYSTYLES['balanced'],
      strengths: ['无明显弱点', '适应性强'],
      weaknesses: ['没有突出优势'],
    };
  }
  
  // 主属性与次属性差距大于阈值认为是特化型
  if (primaryGap > ARCHETYPE_THRESHOLDS.specialistGap) {
    const archetypeMap: Record<string, RoleArchetype> = {
      'combat': 'combat_warrior',
      'cultivation': 'cultivation_genius',
      'survival': 'survival_master',
      'exploration': 'fortune_seeker',
    };
    const archetype = archetypeMap[primary.type] || 'specialist';
    
    return {
      archetype,
      label: ARCHETYPE_LABELS[archetype],
      description: ARCHETYPE_DESCRIPTIONS[archetype],
      recommendedPlaystyle: ARCHETYPE_PLAYSTYLES[archetype],
      strengths: [getSpecialistStrength(primary.type)],
      weaknesses: [getSpecialistWeakness(primary.type)],
    };
  }
  
  // 普通定位类型（有一定偏向但不极端）
  const archetypeMap: Record<string, RoleArchetype> = {
    'combat': 'combat_warrior',
    'cultivation': 'cultivation_genius',
    'survival': 'survival_master',
    'exploration': 'fortune_seeker',
  };
  const archetype = archetypeMap[primary.type] || 'balanced';
  
  return {
    archetype,
    label: ARCHETYPE_LABELS[archetype],
    description: ARCHETYPE_DESCRIPTIONS[archetype],
    recommendedPlaystyle: ARCHETYPE_PLAYSTYLES[archetype],
    strengths: getStrengths(primary.type, secondary.type, tertiary.type, quaternary.type, primary.score, secondary.score, tertiary.score, quaternary.score),
    weaknesses: getWeaknesses(archetype, scores),
  };
}

/**
 * 获取特化型角色的优势描述
 */
function getSpecialistStrength(type: string): string {
  const strengths: Record<string, string> = {
    'combat': '战斗能力达到极限',
    'cultivation': '修炼速度无人能及',
    'survival': '生存能力登峰造极',
    'exploration': '探索机缘如有神助',
  };
  return strengths[type] || '某项能力极强';
}

/**
 * 获取特化型角色的劣势描述
 */
function getSpecialistWeakness(type: string): string {
  const weaknesses: Record<string, string> = {
    'combat': '修炼探索需要更多资源',
    'cultivation': '实战能力相对薄弱',
    'survival': '探索效率较低',
    'exploration': '正面战斗压力较大',
  };
  return weaknesses[type] || '其他方面需要更多资源平衡';
}

/**
 * 获取普通定位的优势列表
 */
function getStrengths(
  primary: string, 
  secondary: string, 
  tertiary: string, 
  quaternary: string,
  primaryScore: number,
  secondaryScore: number,
  tertiaryScore: number,
  quaternaryScore: number
): string[] {
  const strengthMap: Record<string, string> = {
    'combat': '战斗能力强',
    'cultivation': '修炼效率高',
    'survival': '生存能力强',
    'exploration': '探索能力强',
  };
  const strengths: string[] = [];
  
  // 主属性
  if (strengthMap[primary]) strengths.push(strengthMap[primary]);
  
  // 次属性（只有与主属性差距小于10时才计入）
  if (primaryScore - secondaryScore < 10 && strengthMap[secondary]) {
    strengths.push(strengthMap[secondary] + '(次)');
  }
  
  return strengths.length > 0 ? strengths : ['有一定潜力'];
}

/**
 * 获取普通定位的劣势列表
 */
function getWeaknesses(archetype: RoleArchetype, scores: DimensionScores): string[] {
  // 根据各维度评分确定劣势
  const weaknesses: string[] = [];
  
  // 找出评分最低的维度
  const sortedScores = [
    { type: 'combat', score: scores.combat },
    { type: 'cultivation', score: scores.cultivation },
    { type: 'survival', score: scores.survival },
    { type: 'exploration', score: scores.exploration },
  ].sort((a, b) => a.score - b.score);
  
  const weakest = sortedScores[0];
  const secondWeakest = sortedScores[1];
  
  // 只有当弱势维度与强势维度差距大于15时才列出
  const strongest = sortedScores[3];
  if (strongest.score - weakest.score > 15) {
    const weaknessMap: Record<string, string> = {
      'combat': '战斗较弱',
      'cultivation': '修炼效率较低',
      'survival': '生存能力较弱',
      'exploration': '探索机缘较少',
    };
    weaknesses.push(weaknessMap[weakest.type] || '某方面较弱');
    
    // 如果第二弱势也差距较大
    if (strongest.score - secondWeakest.score > 15) {
      weaknesses.push(weaknessMap[secondWeakest.type] || '某方面较弱');
    }
  }
  
  // 如果没有明显劣势，添加通用劣势
  if (weaknesses.length === 0) {
    const defaultWeaknesses: Record<RoleArchetype, string[]> = {
      'combat_warrior': ['修炼速度一般', '机缘发现一般'],
      'cultivation_genius': ['战斗经验较少', '生存压力一般'],
      'survival_master': ['攻击能力有限', '机缘发现较慢'],
      'fortune_seeker': ['持久战能力一般', '正面战斗一般'],
      'balanced': ['没有明显优势'],
      'specialist': ['短板明显'],
    };
    return defaultWeaknesses[archetype] || ['发展潜力一般'];
  }
  
  return weaknesses;
}

// ============================================
// 词条属性偏向性检测
// ============================================

/**
 * 分析词条的正向属性分布
 * 返回各属性的出现次数和偏向性
 */
function analyzeTraitAttrBias(traits: ImpactfulTrait[]): Record<string, number> {
  const attrCount: Record<string, number> = {
    '体质': 0,
    '灵根': 0,
    '悟性': 0,
    '幸运': 0,
    '意志': 0,
  };
  
  for (const trait of traits) {
    const impact = trait.impact;
    // 统计正向属性（impact > 0）
    if (impact.体质 && impact.体质 > 0) attrCount['体质']++;
    if (impact.灵根 && impact.灵根 > 0) attrCount['灵根']++;
    if (impact.悟性 && impact.悟性 > 0) attrCount['悟性']++;
    if (impact.幸运 && impact.幸运 > 0) attrCount['幸运']++;
    if (impact.意志 && impact.意志 > 0) attrCount['意志']++;
  }
  
  return attrCount;
}

/**
 * 基于词条属性偏向性调整维度评分
 * 如果角色词条明显偏向某类属性，增加对应维度权重
 */
function applyTraitBiasToScores(
  scores: DimensionScores,
  attrBias: Record<string, number>
): DimensionScores {
  // 找出词条偏向最高的属性
  let maxBiasAttr = '';
  let maxBiasCount = 0;
  
  for (const [attr, count] of Object.entries(attrBias)) {
    if (count > maxBiasCount) {
      maxBiasCount = count;
      maxBiasAttr = attr;
    }
  }
  
  // 如果有明显的属性偏向（最高属性出现次数 >= 3）
  if (maxBiasCount >= 3) {
    // 根据偏向属性调整对应维度评分
    const biasBonus: Record<string, Record<string, number>> = {
      '体质': { combat: 5, survival: 5 },  // 体质偏向增强战斗和生存
      '灵根': { cultivation: 6 },           // 灵根偏向主要增强修炼
      '悟性': { cultivation: 4, exploration: 3 }, // 悟性偏向增强修炼和探索
      '幸运': { exploration: 5, combat: 2, survival: 2 }, // 幸运偏向增强探索
      '意志': { combat: 3, survival: 4, cultivation: 2 }, // 意志偏向增强战斗和生存
    };
    
    const bonuses = biasBonus[maxBiasAttr] || {};
    return {
      combat: Math.min(100, scores.combat + (bonuses.combat || 0)),
      cultivation: Math.min(100, scores.cultivation + (bonuses.cultivation || 0)),
      survival: Math.min(100, scores.survival + (bonuses.survival || 0)),
      exploration: Math.min(100, scores.exploration + (bonuses.exploration || 0)),
      overall: scores.overall,
    };
  }
  
  return scores;
}

// ============================================
// 完整角色评估
// ============================================

/**
 * 评估单个角色（返回带有评估信息的角色）
 */
export function evaluateCharacter(character: Character): Character {
  // 收集所有词条
  const traits: ImpactfulTrait[] = [
    character.origin,
    character.trait,
    character.personality,
    character.talent,
  ];
  
  // 计算维度评分
  let scores = calculateDimensionScores(character.stats);
  
  // 分析词条属性偏向性
  const attrBias = analyzeTraitAttrBias(traits);
  
  // 基于词条偏向调整评分
  scores = applyTraitBiasToScores(scores, attrBias);
  
  // 检测协同效果
  const synergies = detectSynergies(traits);
  
  // 将协同加成应用到评分
  const bonusScores = {
    combat: scores.combat,
    cultivation: scores.cultivation,
    survival: scores.survival,
    exploration: scores.exploration,
  };
  
  for (const synergy of synergies) {
    bonusScores[synergy.type] = Math.min(100, bonusScores[synergy.type] + synergy.bonus);
  }
  
  const finalScores: DimensionScores = {
    ...bonusScores,
    overall: Math.round(
      (bonusScores.combat + bonusScores.cultivation + 
       bonusScores.survival + bonusScores.exploration) / 4
    ),
  };
  
  // 确定角色定位
  const archetype = determineArchetype(finalScores, character.stats);
  
  // 返回带有评估信息的角色
  return {
    ...character,
    dimensionScores: finalScores,
    synergies,
    archetype,
  };
}

/**
 * 为角色数组计算评估
 */
export function evaluateCharacters(characters: Character[]): Character[] {
  return characters.map(character => evaluateCharacter(character));
}

// ============================================
// 导出类型用于UI
// ============================================

export type { CharacterStats, ImpactfulTrait };
