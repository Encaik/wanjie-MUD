/**
 * 飞升系统配置文件
 * 定义穿越守卫、世界生成、飞升奖励等配置
 */

import { WorldType, LegacyStats } from '@/core/types';

// ============================================
// 穿越守卫配置
// ============================================

/**
 * 守卫特殊能力
 */
export interface GuardianAbility {
  name: string;
  description: string;
  triggerCondition: 'phase' | 'hp' | 'round' | 'random';
  triggerValue?: number;
  triggerPhase?: number;
  effect: {
    type: 'damage' | 'buff' | 'debuff' | 'heal' | 'dispel' | 'silence' | 'multi_attack' | 'aoe_damage' | 'copy_skill' | 'seal_slot';
    value?: number;
    target?: 'player' | 'self';
    stat?: string;
    duration?: number;
    count?: number;
    min?: number;
    max?: number;
  };
  cooldown: number;
}

/**
 * 守卫战斗台词
 */
export interface GuardianBattleCries {
  start: string;
  phase2: string;
  phase3: string;
  defeat: string;
}

/**
 * 守卫配置
 */
export interface GuardianConfig {
  name: string;
  title: string;
  description: string;
  personality: string;
  hpMultiplier: number;
  attackMultiplier: number;
  defenseMultiplier: number;
  specialAbility: GuardianAbility[];
  phases: number;
  phaseThresholds: number[];
  battleCries: GuardianBattleCries;
}

/**
 * 各世界观的穿越守卫配置
 */
export const WORLD_GUARDIANS: Record<WorldType, GuardianConfig> = {
  '修仙': {
    name: '天道化身',
    title: '天地法则的守护者',
    description: '化身天道，代行天罚。任何妄图突破世界壁垒者，必先过此关。',
    personality: '威严',
    hpMultiplier: 3.0,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.2,
    specialAbility: [
      {
        name: '天罚',
        description: '召唤天雷，造成大量伤害',
        triggerCondition: 'phase',
        effect: { type: 'damage', value: 1.5, target: 'player' },
        cooldown: 3
      },
      {
        name: '法则压制',
        description: '降低玩家所有属性10%',
        triggerCondition: 'hp',
        triggerValue: 0.5,
        effect: { type: 'debuff', stat: 'all', value: 0.1, duration: 3 },
        cooldown: 5
      },
      {
        name: '天道审判',
        description: '第三阶段终极技能，连续三次攻击',
        triggerCondition: 'phase',
        triggerPhase: 3,
        effect: { type: 'multi_attack', count: 3, value: 0.8 },
        cooldown: 4
      }
    ],
    phases: 3,
    phaseThresholds: [1.0, 0.5, 0.2],
    battleCries: {
      start: '凡人，竟敢妄图逆天而行！',
      phase2: '天道无情，尔等皆为蝼蚁！',
      phase3: '吾乃天道，何人能挡！',
      defeat: '天意...难违...'
    }
  },
  '高武': {
    name: '武道意志',
    title: '万古武道的化身',
    description: '汇聚万古武者意志，守护武道巅峰。',
    personality: '狂傲',
    hpMultiplier: 3.2,
    attackMultiplier: 1.6,
    defenseMultiplier: 1.1,
    specialAbility: [
      {
        name: '武魂附体',
        description: '召唤历代武者英魂，大幅提升攻击',
        triggerCondition: 'phase',
        effect: { type: 'buff', stat: 'attack', value: 0.5, duration: 3 },
        cooldown: 0
      },
      {
        name: '崩山拳',
        description: '蓄力一击，造成毁灭性伤害',
        triggerCondition: 'round',
        triggerValue: 5,
        effect: { type: 'damage', value: 2.0, target: 'player' },
        cooldown: 5
      }
    ],
    phases: 3,
    phaseThresholds: [1.0, 0.5, 0.2],
    battleCries: {
      start: '武者，用你的拳头说话！',
      phase2: '不错！让我认真起来！',
      phase3: '这一战，痛快！',
      defeat: '后生可畏...武道后继有人...'
    }
  },
  '科技': {
    name: '系统终端',
    title: '维度守恒程序',
    description: '高级文明留下的维度守护系统，防止维度穿越。',
    personality: '冰冷',
    hpMultiplier: 2.8,
    attackMultiplier: 1.4,
    defenseMultiplier: 1.3,
    specialAbility: [
      {
        name: '数据重置',
        description: '强制重置玩家增益效果',
        triggerCondition: 'phase',
        effect: { type: 'dispel', target: 'player' },
        cooldown: 0
      },
      {
        name: '维度封锁',
        description: '封锁玩家技能，持续2回合',
        triggerCondition: 'hp',
        triggerValue: 0.5,
        effect: { type: 'silence', duration: 2 },
        cooldown: 6
      }
    ],
    phases: 3,
    phaseThresholds: [1.0, 0.5, 0.2],
    battleCries: {
      start: '检测到非法穿越行为。启动拦截协议。',
      phase2: '警告：系统负载升高。提升战斗模式。',
      phase3: '终极协议启动。目标：清除入侵者。',
      defeat: '系统...崩溃...数据...丢失...'
    }
  },
  '魔幻': {
    name: '位面守护者',
    title: '诸神留下的守望者',
    description: '诸神时代留下的强大存在，守护位面不被侵犯。',
    personality: '神秘',
    hpMultiplier: 3.0,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.2,
    specialAbility: [
      {
        name: '禁咒封印',
        description: '封印玩家魔力，降低MP回复',
        triggerCondition: 'phase',
        effect: { type: 'debuff', stat: 'mpRegen', value: 0.5, duration: 3 },
        cooldown: 0
      },
      {
        name: '元素风暴',
        description: '召唤四元素攻击',
        triggerCondition: 'random',
        triggerValue: 0.3,
        effect: { type: 'damage', min: 1.0, max: 2.0, target: 'player' },
        cooldown: 3
      }
    ],
    phases: 3,
    phaseThresholds: [1.0, 0.5, 0.2],
    battleCries: {
      start: '凡人，这里不是你该来的地方。',
      phase2: '诸神的愤怒，你承受不起。',
      phase3: '既然如此...让诸神的制裁降临吧！',
      defeat: '诸神...已经离去了吗...'
    }
  },
  '异能': {
    name: '觉醒之源',
    title: '异能的起源与终结',
    description: '所有异能的源头，也是异能者的最终归宿。',
    personality: '混沌',
    hpMultiplier: 3.0,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.2,
    specialAbility: [
      {
        name: '异能共鸣',
        description: '复制玩家上一个技能并反击',
        triggerCondition: 'round',
        triggerValue: 3,
        effect: { type: 'copy_skill' },
        cooldown: 4
      },
      {
        name: '异能剥夺',
        description: '随机封印一个技能槽',
        triggerCondition: 'hp',
        triggerValue: 0.6,
        effect: { type: 'seal_slot', duration: 3 },
        cooldown: 5
      }
    ],
    phases: 3,
    phaseThresholds: [1.0, 0.5, 0.2],
    battleCries: {
      start: '又一个觉醒者...想要回归本源吗？',
      phase2: '你的力量...我很熟悉...',
      phase3: '那就...彻底觉醒吧！',
      defeat: '你...已经超越了起源...'
    }
  },
  '仙侠': {
    name: '天道化身',
    title: '天道意志',
    description: '天之道的化身，维护天地秩序。',
    personality: '超然',
    hpMultiplier: 3.0,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.2,
    specialAbility: [
      {
        name: '天罚',
        description: '召唤天雷，造成大量伤害',
        triggerCondition: 'phase',
        effect: { type: 'damage', value: 1.5, target: 'player' },
        cooldown: 3
      }
    ],
    phases: 3,
    phaseThresholds: [1.0, 0.5, 0.2],
    battleCries: {
      start: '道友，回头是岸。',
      phase2: '天道无常，顺应自然。',
      phase3: '既然执意如此...',
      defeat: '道...可道...'
    }
  },
  '武侠': {
    name: '武道真意',
    title: '天下第一',
    description: '武道的极致，所有武者心中的那座高峰。',
    personality: '侠义',
    hpMultiplier: 3.0,
    attackMultiplier: 1.6,
    defenseMultiplier: 1.1,
    specialAbility: [
      {
        name: '天人合一',
        description: '进入天人合一状态，攻击必中',
        triggerCondition: 'phase',
        effect: { type: 'buff', stat: 'accuracy', value: 1.0, duration: 3 },
        cooldown: 0
      }
    ],
    phases: 3,
    phaseThresholds: [1.0, 0.5, 0.2],
    battleCries: {
      start: '请赐教。',
      phase2: '好武功！让我认真对待。',
      phase3: '这一战，问心无愧！',
      defeat: '长江后浪推前浪...'
    }
  },
  '末世': {
    name: '末日审判',
    title: '毁灭与新生',
    description: '末世的终点，也是新世界的起点。',
    personality: '悲悯',
    hpMultiplier: 3.2,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.2,
    specialAbility: [
      {
        name: '毁灭降临',
        description: '召唤末日灾难',
        triggerCondition: 'phase',
        effect: { type: 'aoe_damage', value: 1.2 },
        cooldown: 3
      },
      {
        name: '新生之门',
        description: '自我恢复HP',
        triggerCondition: 'hp',
        triggerValue: 0.3,
        effect: { type: 'heal', value: 0.2 },
        cooldown: 8
      }
    ],
    phases: 3,
    phaseThresholds: [1.0, 0.5, 0.2],
    battleCries: {
      start: '穿越者...末日之后，可有新生？',
      phase2: '毁灭是宿命，新生是希望。',
      phase3: '那就...用你的方式，证明新生！',
      defeat: '愿你在新世界...找到希望...'
    }
  }
};

// ============================================
// 世界生成配置
// ============================================

/**
 * 世界名称生成器
 */
export const WORLD_NAME_GENERATORS: Record<WorldType, string[]> = {
  '修仙': ['青云界', '玄天大陆', '灵域', '仙霞山', '问道山', '长生界', '九天仙域'],
  '高武': ['武神大陆', '百战域', '龙腾神州', '玄武界', '天武山', '破苍穹', '武道天'],
  '科技': ['银河联邦', '机械之心', '星渊', '数据之海', '量子领域', '新纪元', '赛博城'],
  '魔幻': ['艾尔德兰', '魔法之源', '元素之地', '龙之谷', '精灵之森', '暗影界', '光明域'],
  '异能': ['觉醒之城', '异域', '超能联邦', '变异之地', '源能世界', '新人类纪元', '进化域'],
  '仙侠': ['剑仙大陆', '问道天涯', '仙缘界', '青云门', '万剑山', '仙侠传', '剑域'],
  '武侠': ['江湖', '武林', '侠客行', '武林盟', '华山论剑', '武林风云', '侠义界'],
  '末世': ['废土', '末世残存', '求生之地', '新世界', '希望之城', '黎明破晓', '重建地']
};

/**
 * 世界特性库
 */
export const WORLD_FEATURES: Record<WorldType, string[]> = {
  '修仙': [
    '灵气浓郁，修炼速度+20%',
    '天材地宝众多',
    '宗门林立，机缘众多',
    '妖兽横行，危险与机遇并存',
    '古道遗迹遍布',
    '仙人洞府现世'
  ],
  '高武': [
    '武道昌盛，武馆遍布',
    '武者圣地，突破更容易',
    '妖魔横行，需小心应对',
    '武道传承丰富',
    '百战之地，成长迅速',
    '武魂觉醒率高'
  ],
  '科技': [
    '科技高度发达',
    '资源采集效率高',
    '人工智能辅助',
    '基因进化技术成熟',
    '星际航道开通',
    '能源充足'
  ],
  '魔幻': [
    '魔法元素充沛',
    '龙族栖息地',
    '精灵王国',
    '魔法学院众多',
    '神器遗迹',
    '魔法生物丰富'
  ],
  '异能': [
    '觉醒者众多',
    '异能进化更容易',
    '异能组织林立',
    '基因变异频发',
    '神秘遗迹',
    '源能矿脉丰富'
  ],
  '仙侠': [
    '剑修圣地',
    '仙缘众多',
    '飞剑传说道',
    '炼丹术发达',
    '仙侠世家',
    '古剑冢'
  ],
  '武侠': [
    '江湖风云',
    '门派林立',
    '武功秘籍众多',
    '武林大会定期举办',
    '侠客云集',
    '奇人异事频发'
  ],
  '末世': [
    '资源稀缺但珍贵',
    '变异生物众多',
    '幸存者聚落',
    '废墟遗迹丰富',
    '新秩序建立中',
    '进化者联盟'
  ]
};

// ============================================
// 飞升印记配置
// ============================================

/**
 * 飞升里程碑奖励
 */
export interface AscensionMilestone {
  statBonus: Partial<LegacyStats>;
  title: string;
  ability: string;
  description: string;
}

export const ASCENSION_MILESTONES: Record<number, AscensionMilestone> = {
  1: {
    statBonus: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 },
    title: '飞升者',
    ability: '跨界感知',
    description: '感知其他世界的存在，世界选择时可以重新随机一次'
  },
  2: {
    statBonus: { 体质: 8, 灵根: 8, 悟性: 8, 幸运: 8, 意志: 8 },
    title: '多界行者',
    ability: '经验传承',
    description: '经验获取+10%，修炼速度提升'
  },
  3: {
    statBonus: { 体质: 7, 灵根: 7, 悟性: 7, 幸运: 7, 意志: 7 },
    title: '世界穿梭者',
    ability: '传承强化',
    description: '传承功法/装备等级+2'
  },
  5: {
    statBonus: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 },
    title: '万界至尊',
    ability: '命运眷顾',
    description: '世界特性更有利，资源丰富度+20%'
  },
  10: {
    statBonus: { 体质: 15, 灵根: 15, 悟性: 15, 幸运: 15, 意志: 15 },
    title: '永恒存在',
    ability: '轮回不灭',
    description: '解锁专属技能树，可以携带2本功法和2件装备'
  }
};

/**
 * 称号系统
 */
export interface TitleEffect {
  description: string;
  effects: string[];
  display: string;
}

export const TITLE_SYSTEM: Record<string, TitleEffect> = {
  '飞升者': {
    description: '突破世界壁垒的勇者',
    effects: ['跨界感知：可重新随机世界一次'],
    display: '✨ 飞升者'
  },
  '多界行者': {
    description: '行走于多个世界的旅者',
    effects: ['经验+10%'],
    display: '🌟 多界行者'
  },
  '世界穿梭者': {
    description: '在世界间自由穿梭的强者',
    effects: ['传承等级+2'],
    display: '💫 世界穿梭者'
  },
  '万界至尊': {
    description: '征服多个世界的霸主',
    effects: ['资源+20%', '特性加成'],
    display: '👑 万界至尊'
  },
  '永恒存在': {
    description: '超脱轮回的永恒之身',
    effects: ['双传承', '专属技能'],
    display: '∞ 永恒存在'
  }
};

// ============================================
// 核心配置
// ============================================

export const ASCENSION_CONFIG = {
  // 基础成功率
  baseSuccessRate: 0.4,
  
  // 成功率加成条件
  successRateBonuses: {
    mentalStability70: 0.05,
    mentalStability90: 0.10,
    ascensionPill: 0.10,
    pathLevel5: 0.05,
    pathLevel8: 0.08,
    fullLegendaryEquipment: 0.10,
    tribulationPassed: 0.05,
  },
  
  // 战斗参数
  battle: {
    maxTurns: 20,
    phaseThresholds: [1.0, 0.5, 0.2],
  },
  
  // 属性加成（每次飞升）
  statBonusPerAscension: {
    1: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 },
    2: { 体质: 8, 灵根: 8, 悟性: 8, 幸运: 8, 意志: 8 },
    3: { 体质: 7, 灵根: 7, 悟性: 7, 幸运: 7, 意志: 7 },
    5: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 },
    10: { 体质: 15, 灵根: 15, 悟性: 15, 幸运: 15, 意志: 15 },
  },
  
  // 失败惩罚
  penalty: {
    hpLossPercent: 0.3,
    mpLossPercent: 0.3,
    mentalDrop: 20,
    demonChanceAdd: 10,
    cooldownBaseHours: 24,
    cooldownMaxHours: 72,
  },
  
  // 传承限制
  inheritance: {
    maxSpiritStonesPercent: 0.5,
    maxTechniques: 1,
    maxEquipments: 1,
    extraSlots: {
      ascensionRequired: 10,
      extraTechniques: 1,
      extraEquipments: 1,
    },
  },
  
  // 世界权重（飞升次数越多，稀有世界概率越高）
  worldWeightBase: {
    '修仙': 10,
    '高武': 10,
    '科技': 8,
    '魔幻': 6,
    '异能': 8,
    '仙侠': 10,
    '武侠': 10,
    '末世': 5,
  },
};

/**
 * 获取守卫配置
 */
export function getGuardianConfig(worldType: WorldType): GuardianConfig {
  return WORLD_GUARDIANS[worldType];
}

/**
 * 获取世界名称
 */
export function getWorldName(worldType: WorldType): string {
  const names = WORLD_NAME_GENERATORS[worldType];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * 获取世界特性
 */
export function getWorldFeatures(worldType: WorldType, count: number = 2): string[] {
  const features = WORLD_FEATURES[worldType];
  const shuffled = [...features].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, features.length));
}

/**
 * 获取飞升里程碑
 */
export function getAscensionMilestone(count: number): AscensionMilestone | null {
  // 找到小于等于当前次数的最大里程碑
  const milestones = Object.keys(ASCENSION_MILESTONES)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const milestone of milestones) {
    if (count >= milestone) {
      return ASCENSION_MILESTONES[milestone];
    }
  }
  return null;
}

/**
 * 计算世界权重（飞升次数影响）
 */
export function calculateWorldWeights(ascensionCount: number): Record<WorldType, number> {
  const base = ASCENSION_CONFIG.worldWeightBase;
  const weights: Record<WorldType, number> = { ...base };
  
  // 飞升次数越多，稀有世界概率越高
  weights['科技'] += ascensionCount * 0.5;
  weights['魔幻'] += ascensionCount * 0.8;
  weights['末世'] += ascensionCount;
  
  return weights;
}

/**
 * 加权随机选择
 */
export function weightedRandom<T extends string>(
  items: T[],
  weights: Record<T, number>
): T {
  const totalWeight = items.reduce((sum, item) => sum + weights[item], 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= weights[item];
    if (random <= 0) {
      return item;
    }
  }
  
  return items[items.length - 1];
}
