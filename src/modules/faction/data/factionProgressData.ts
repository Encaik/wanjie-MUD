/**
 * 势力进度系统数据配置（V2 重构版）
 * 
 * 包含：
 * 1. 声望等级系统
 * 2. 职位系统
 * 3. 任务轮次系统（新）
 * 4. 势力委托系统（新）
 * 5. 势力商店系统
 * 6. 势力技能系统
 */

import { ItemRarity } from '@/core/types';

// ============================================
// 声望等级系统
// ============================================

export type ReputationLevel = 'outsider' | 'neutral' | 'friendly' | 'honored' | 'revered' | 'exalted';

export const REPUTATION_LEVELS: Record<ReputationLevel, { 
  min: number; 
  name: string; 
  color: string;
  bonus: number;
}> = {
  outsider: { min: 0, name: '陌生', color: 'text-gray-500', bonus: 0 },
  neutral: { min: 1000, name: '熟悉', color: 'text-gray-400', bonus: 3 },
  friendly: { min: 5000, name: '亲近', color: 'text-green-500', bonus: 5 },
  honored: { min: 20000, name: '敬重', color: 'text-blue-500', bonus: 10 },
  revered: { min: 50000, name: '爱戴', color: 'text-purple-500', bonus: 15 },
  exalted: { min: 100000, name: '挚爱', color: 'text-yellow-500', bonus: 20 }
};

export function getReputationLevel(reputation: number): ReputationLevel {
  const levels = Object.entries(REPUTATION_LEVELS) as [ReputationLevel, typeof REPUTATION_LEVELS[ReputationLevel]][];
  levels.sort((a, b) => b[1].min - a[1].min);
  
  for (const [level, config] of levels) {
    if (reputation >= config.min) {
      return level;
    }
  }
  return 'outsider';
}

// ============================================
// 职位系统
// ============================================

export interface RankBenefit {
  type: 'discount' | 'salary' | 'access' | 'skill' | 'special';
  value: number | string;
  description: string;
}

export interface FactionRankConfig {
  id: string;
  name: string;
  description: string;
  requiredReputation: number;
  requiredReputationLevel: ReputationLevel;
  benefits: RankBenefit[];
}

// 宗门职位
export const SECT_RANKS: FactionRankConfig[] = [
  { id: 'servant', name: '杂役', description: '负责宗门杂务的入门弟子', requiredReputation: 0, requiredReputationLevel: 'outsider', benefits: [{ type: 'discount', value: 2, description: '商店折扣2%' }] },
  { id: 'outer_disciple', name: '外门弟子', description: '宗门正式入门弟子', requiredReputation: 1000, requiredReputationLevel: 'neutral', benefits: [{ type: 'discount', value: 5, description: '商店折扣5%' }, { type: 'salary', value: 50, description: '晋升时领取50灵石俸禄' }] },
  { id: 'inner_disciple', name: '内门弟子', description: '宗门核心弟子', requiredReputation: 5000, requiredReputationLevel: 'friendly', benefits: [{ type: 'discount', value: 10, description: '商店折扣10%' }, { type: 'salary', value: 100, description: '晋升时领取100灵石俸禄' }] },
  { id: 'core_disciple', name: '亲传弟子', description: '宗门重点培养对象', requiredReputation: 15000, requiredReputationLevel: 'honored', benefits: [{ type: 'discount', value: 15, description: '商店折扣15%' }, { type: 'salary', value: 300, description: '晋升时领取300灵石俸禄' }, { type: 'access', value: 'core_shop', description: '解锁核心商店' }] },
  { id: 'elder', name: '长老', description: '宗门管理层', requiredReputation: 50000, requiredReputationLevel: 'revered', benefits: [{ type: 'discount', value: 20, description: '商店折扣20%' }, { type: 'salary', value: 800, description: '晋升时领取800灵石俸禄' }, { type: 'access', value: 'elder_shop', description: '解锁长老商店' }, { type: 'skill', value: 'faction_skill_elder', description: '解锁势力技能：宗门护体' }] },
  { id: 'vice_sect_master', name: '副宗主', description: '宗门副手', requiredReputation: 100000, requiredReputationLevel: 'exalted', benefits: [{ type: 'discount', value: 25, description: '商店折扣25%' }, { type: 'salary', value: 1500, description: '晋升时领取1500灵石俸禄' }] },
  { id: 'sect_master', name: '宗主', description: '宗门最高权力者', requiredReputation: 200000, requiredReputationLevel: 'exalted', benefits: [{ type: 'discount', value: 30, description: '商店折扣30%' }, { type: 'salary', value: 3000, description: '晋升时领取3000灵石俸禄' }, { type: 'special', value: 'faction_leader', description: '势力领袖特权' }, { type: 'skill', value: 'faction_skill_master', description: '解锁势力技能：宗门传承' }] }
];

// 皇朝职位
export const EMPIRE_RANKS: FactionRankConfig[] = [
  { id: 'servant', name: '平民', description: '皇朝普通子民', requiredReputation: 0, requiredReputationLevel: 'outsider', benefits: [{ type: 'discount', value: 2, description: '商店折扣2%' }] },
  { id: 'citizen', name: '士兵', description: '皇朝军队一员', requiredReputation: 1000, requiredReputationLevel: 'neutral', benefits: [{ type: 'discount', value: 5, description: '商店折扣5%' }, { type: 'salary', value: 50, description: '晋升时领取50灵石俸禄' }] },
  { id: 'officer', name: '校尉', description: '军队中层军官', requiredReputation: 5000, requiredReputationLevel: 'friendly', benefits: [{ type: 'discount', value: 10, description: '商店折扣10%' }, { type: 'salary', value: 150, description: '晋升时领取150灵石俸禄' }, { type: 'access', value: 'military_shop', description: '解锁军需商店' }] },
  { id: 'general', name: '将军', description: '军队高层将领', requiredReputation: 20000, requiredReputationLevel: 'honored', benefits: [{ type: 'discount', value: 15, description: '商店折扣15%' }, { type: 'salary', value: 500, description: '晋升时领取500灵石俸禄' }, { type: 'skill', value: 'faction_skill_general', description: '解锁势力技能：皇朝战意' }] },
  { id: 'minister', name: '大臣', description: '朝廷重臣', requiredReputation: 50000, requiredReputationLevel: 'revered', benefits: [{ type: 'discount', value: 20, description: '商店折扣20%' }, { type: 'salary', value: 1000, description: '晋升时领取1000灵石俸禄' }, { type: 'skill', value: 'faction_skill_minister', description: '解锁势力技能：皇权护体' }] },
  { id: 'prime_minister', name: '宰相', description: '一人之下万人之上', requiredReputation: 100000, requiredReputationLevel: 'exalted', benefits: [{ type: 'discount', value: 25, description: '商店折扣25%' }, { type: 'salary', value: 2000, description: '晋升时领取2000灵石俸禄' }] },
  { id: 'emperor', name: '皇帝', description: '皇朝最高统治者', requiredReputation: 200000, requiredReputationLevel: 'exalted', benefits: [{ type: 'discount', value: 35, description: '商店折扣35%' }, { type: 'salary', value: 5000, description: '晋升时领取5000灵石俸禄' }, { type: 'special', value: 'faction_leader', description: '势力领袖特权' }] }
];

// 通用职位
export const GENERIC_RANKS: FactionRankConfig[] = [
  { id: 'trainee', name: '见习', description: '见习成员，初入势力', requiredReputation: 0, requiredReputationLevel: 'outsider', benefits: [{ type: 'discount', value: 3, description: '商店折扣3%' }] },
  { id: 'member', name: '成员', description: '正式成员，获得认可', requiredReputation: 1000, requiredReputationLevel: 'neutral', benefits: [{ type: 'discount', value: 5, description: '商店折扣5%' }, { type: 'salary', value: 50, description: '晋升时领取50灵石俸禄' }] },
  { id: 'elite', name: '精英', description: '精英成员，势力骨干', requiredReputation: 5000, requiredReputationLevel: 'friendly', benefits: [{ type: 'discount', value: 10, description: '商店折扣10%' }, { type: 'salary', value: 200, description: '晋升时领取200灵石俸禄' }] },
  { id: 'leader', name: '首领', description: '势力最高领袖', requiredReputation: 50000, requiredReputationLevel: 'revered', benefits: [{ type: 'discount', value: 20, description: '商店折扣20%' }, { type: 'salary', value: 1000, description: '晋升时领取1000灵石俸禄' }, { type: 'special', value: 'faction_leader', description: '势力领袖特权' }] }
];

export function getRanksByFactionType(factionType: string): FactionRankConfig[] {
  if (factionType === 'sect' || factionType === 'academy') return SECT_RANKS;
  if (factionType === 'empire') return EMPIRE_RANKS;
  return GENERIC_RANKS;
}

// ============================================
// 任务轮次系统（V2新增）
// ============================================

export type TaskType = 'daily' | 'weekly' | 'special';
export type TaskDifficulty = 'easy' | 'normal' | 'hard' | 'nightmare';

export interface TaskRequirement {
  type: 'kill' | 'collect' | 'cultivate' | 'explore' | 'donate' | 'upgrade';
  target: string;
  count: number;
  description: string;
}

export interface TaskReward {
  reputation: number;
  contribution: number;
  experience?: number;
  items?: { itemId: string; quantity: number; rarity?: ItemRarity }[];
}

/**
 * 任务配置
 */
export interface FactionTaskConfig {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  difficulty: TaskDifficulty;
  requirements: TaskRequirement[];
  rewards: TaskReward;
  minRank?: string;
  minLevel?: number;
}

/**
 * 任务轮次配置
 */
export interface TaskRoundConfig {
  type: 'daily' | 'weekly';
  maxTasksPerRound: number;      // 每轮最大任务数
  roundCooldown: number;          // 轮次冷却时间（毫秒）
  taskPool: string[];             // 可选任务池
  tasksPerRefresh: number;        // 每次刷新的任务数量
}

// 日常任务轮次配置
export const DAILY_TASK_ROUND: TaskRoundConfig = {
  type: 'daily',
  maxTasksPerRound: 20,
  roundCooldown: 86400000,  // 24小时
  taskPool: [
    'daily_kill_monsters',
    'daily_explore',
    'daily_cultivate',
    'daily_donate',
    'daily_collect',
    'daily_upgrade'
  ],
  tasksPerRefresh: 6
};

// 周常任务轮次配置
export const WEEKLY_TASK_ROUND: TaskRoundConfig = {
  type: 'weekly',
  maxTasksPerRound: 10,
  roundCooldown: 604800000,  // 7天
  taskPool: [
    'weekly_boss_hunter',
    'weekly_dungeon_master',
    'weekly_elite_hunter',
    'weekly_upgrade_equipment'
  ],
  tasksPerRefresh: 4
};

// 势力任务列表
export const FACTION_TASKS: FactionTaskConfig[] = [
  // ========== 日常任务 ==========
  {
    id: 'daily_kill_monsters',
    name: '清剿妖兽',
    description: '击败任意敌人，维护势力领地安全',
    type: 'daily',
    difficulty: 'easy',
    requirements: [{ type: 'kill', target: 'any', count: 10, description: '击败10个敌人' }],
    rewards: { reputation: 100, contribution: 50, experience: 50 }
  },
  {
    id: 'daily_explore',
    name: '秘境探索',
    description: '完成一次秘境探索',
    type: 'daily',
    difficulty: 'normal',
    requirements: [{ type: 'explore', target: 'dungeon', count: 1, description: '完成1次秘境探索' }],
    rewards: { reputation: 200, contribution: 100, experience: 100 }
  },
  {
    id: 'daily_cultivate',
    name: '勤勉修炼',
    description: '进行修炼提升实力',
    type: 'daily',
    difficulty: 'easy',
    requirements: [{ type: 'cultivate', target: 'any', count: 5, description: '修炼5次' }],
    rewards: { reputation: 80, contribution: 40, experience: 40 }
  },
  {
    id: 'daily_donate',
    name: '势力捐献',
    description: '向势力捐献灵石',
    type: 'daily',
    difficulty: 'easy',
    requirements: [{ type: 'donate', target: 'spirit_stone', count: 500, description: '捐献500灵石' }],
    rewards: { reputation: 150, contribution: 200, experience: 60 }
  },
  {
    id: 'daily_collect',
    name: '资源收集',
    description: '收集任意材料',
    type: 'daily',
    difficulty: 'easy',
    requirements: [{ type: 'collect', target: 'any', count: 5, description: '收集5份材料' }],
    rewards: { reputation: 100, contribution: 60, experience: 50 }
  },
  {
    id: 'daily_upgrade',
    name: '装备强化',
    description: '强化或重铸装备',
    type: 'daily',
    difficulty: 'normal',
    requirements: [{ type: 'upgrade', target: 'equipment', count: 1, description: '强化装备1次' }],
    rewards: { reputation: 150, contribution: 80, experience: 80 }
  },
  
  // ========== 周常任务 ==========
  {
    id: 'weekly_boss_hunter',
    name: 'Boss猎杀者',
    description: '击杀Boss证明实力',
    type: 'weekly',
    difficulty: 'hard',
    requirements: [{ type: 'kill', target: 'boss', count: 5, description: '击败5个Boss' }],
    rewards: { reputation: 1000, contribution: 500, experience: 500, items: [{ itemId: 'pill_breakthrough_low', quantity: 2, rarity: '稀有' }] },
    minLevel: 20
  },
  {
    id: 'weekly_dungeon_master',
    name: '秘境大师',
    description: '完成多次秘境探索',
    type: 'weekly',
    difficulty: 'normal',
    requirements: [{ type: 'explore', target: 'dungeon', count: 7, description: '完成7次秘境探索' }],
    rewards: { reputation: 800, contribution: 400, experience: 400, items: [{ itemId: 'pill_cultivation_mid', quantity: 3, rarity: '稀有' }] }
  },
  {
    id: 'weekly_elite_hunter',
    name: '精英猎手',
    description: '击杀精英敌人',
    type: 'weekly',
    difficulty: 'normal',
    requirements: [{ type: 'kill', target: 'elite', count: 15, description: '击败15个精英敌人' }],
    rewards: { reputation: 600, contribution: 350, experience: 300 }
  },
  {
    id: 'weekly_upgrade_equipment',
    name: '装备强化',
    description: '提升装备实力',
    type: 'weekly',
    difficulty: 'normal',
    requirements: [{ type: 'upgrade', target: 'equipment', count: 5, description: '强化装备5次' }],
    rewards: { reputation: 500, contribution: 250, experience: 250 }
  },
];

// 获取任务配置
export function getTaskConfig(taskId: string): FactionTaskConfig | undefined {
  return FACTION_TASKS.find(t => t.id === taskId);
}

// 获取任务名称（用于显示）
export function getTaskName(taskId: string): string {
  return getTaskConfig(taskId)?.name || taskId;
}

// 获取任务描述（用于显示）
export function getTaskDescription(taskId: string): string {
  return getTaskConfig(taskId)?.description || '';
}

// ============================================
// 势力委托系统（V2新增，替代旧日常）
// ============================================

export type CommissionType = 'hunt' | 'collect' | 'explore' | 'escort';
export type CommissionQuality = 'common' | 'elite' | 'rare' | 'legendary';

export interface CommissionRequirement {
  type: 'kill' | 'collect' | 'explore';
  target: string;
  count: number;
  description: string;
}

export interface CommissionRewards {
  contribution: number;
  reputation: number;
  experience?: number;
  items?: { itemId: string; quantity: number }[];
  qualityBonus: number;
}

/**
 * 委托配置
 */
export interface FactionCommissionConfig {
  id: string;
  name: string;
  description: string;
  type: CommissionType;
  quality: CommissionQuality;
  requirements: CommissionRequirement[];
  rewards: CommissionRewards;
  timeLimit: number;  // 时间限制（毫秒），0表示无限制
  minRank?: string;
}

// 委托品质奖励配置
export const COMMISSION_QUALITY_CONFIG: Record<CommissionQuality, {
  color: string;
  name: string;
  contributionBase: number;
  reputationBase: number;
  qualityBonus: number;
}> = {
  common: { color: 'text-gray-500', name: '普通', contributionBase: 50, reputationBase: 30, qualityBonus: 1.0 },
  elite: { color: 'text-blue-500', name: '精英', contributionBase: 100, reputationBase: 60, qualityBonus: 1.5 },
  rare: { color: 'text-purple-500', name: '稀有', contributionBase: 200, reputationBase: 120, qualityBonus: 2.0 },
  legendary: { color: 'text-yellow-500', name: '传说', contributionBase: 500, reputationBase: 300, qualityBonus: 3.0 }
};

// 委托模板
export const COMMISSION_TEMPLATES: Omit<FactionCommissionConfig, 'id'>[] = [
  // 普通品质
  {
    name: '清剿小妖',
    description: '势力周围有小妖作乱，前去清剿',
    type: 'hunt',
    quality: 'common',
    requirements: [{ type: 'kill', target: 'monster', count: 5, description: '击败5个小妖' }],
    rewards: { contribution: 50, reputation: 30, qualityBonus: 1.0 },
    timeLimit: 0
  },
  {
    name: '采集草药',
    description: '势力需要一些常见草药',
    type: 'collect',
    quality: 'common',
    requirements: [{ type: 'collect', target: 'herb', count: 3, description: '采集3份草药' }],
    rewards: { contribution: 60, reputation: 35, qualityBonus: 1.0 },
    timeLimit: 0
  },
  {
    name: '巡视领地',
    description: '巡视势力领地，确保安全',
    type: 'explore',
    quality: 'common',
    requirements: [{ type: 'explore', target: 'territory', count: 1, description: '完成1次巡视' }],
    rewards: { contribution: 40, reputation: 25, qualityBonus: 1.0 },
    timeLimit: 0
  },
  // 精英品质
  {
    name: '讨伐妖将',
    description: '妖族将领入侵，前去讨伐',
    type: 'hunt',
    quality: 'elite',
    requirements: [{ type: 'kill', target: 'elite', count: 3, description: '击败3个精英敌人' }],
    rewards: { contribution: 100, reputation: 60, experience: 50, qualityBonus: 1.5 },
    timeLimit: 3600000,  // 1小时
    minRank: 'outer_disciple'
  },
  {
    name: '搜罗灵材',
    description: '势力需要稀有灵材',
    type: 'collect',
    quality: 'elite',
    requirements: [{ type: 'collect', target: 'rare_material', count: 2, description: '收集2份稀有材料' }],
    rewards: { contribution: 120, reputation: 70, qualityBonus: 1.5 },
    timeLimit: 0,
    minRank: 'outer_disciple'
  },
  // 稀有品质
  {
    name: '斩杀妖王',
    description: '妖王威胁势力安全，必须铲除',
    type: 'hunt',
    quality: 'rare',
    requirements: [{ type: 'kill', target: 'boss', count: 1, description: '击败1个Boss' }],
    rewards: { contribution: 200, reputation: 120, experience: 100, items: [{ itemId: 'pill_cultivation_mid', quantity: 1 }], qualityBonus: 2.0 },
    timeLimit: 7200000,  // 2小时
    minRank: 'inner_disciple'
  },
  {
    name: '秘境探索',
    description: '探索势力发现的秘境',
    type: 'explore',
    quality: 'rare',
    requirements: [{ type: 'explore', target: 'dungeon', count: 1, description: '完成1次秘境探索' }],
    rewards: { contribution: 180, reputation: 100, experience: 80, qualityBonus: 2.0 },
    timeLimit: 7200000,
    minRank: 'inner_disciple'
  },
  // 传说品质
  {
    name: '诛灭魔王',
    description: '魔王降世，势力存亡之际',
    type: 'hunt',
    quality: 'legendary',
    requirements: [{ type: 'kill', target: 'boss', count: 3, description: '击败3个Boss' }],
    rewards: { contribution: 500, reputation: 300, experience: 300, items: [{ itemId: 'pill_breakthrough_mid', quantity: 1 }], qualityBonus: 3.0 },
    timeLimit: 86400000,  // 24小时
    minRank: 'core_disciple'
  }
];

/**
 * 生成随机委托
 */
export function generateCommission(quality?: CommissionQuality, rank?: string): FactionCommissionConfig {
  // 根据职位确定可刷新的品质范围
  let possibleQualities: CommissionQuality[] = ['common'];
  if (rank && ['outer_disciple', 'member', 'citizen', 'officer'].includes(rank)) {
    possibleQualities = ['common', 'elite'];
  }
  if (rank && ['inner_disciple', 'elite', 'general'].includes(rank)) {
    possibleQualities = ['common', 'elite', 'rare'];
  }
  if (rank && ['core_disciple', 'elder', 'minister', 'leader', 'vice_sect_master', 'prime_minister', 'sect_master', 'emperor'].includes(rank)) {
    possibleQualities = ['common', 'elite', 'rare', 'legendary'];
  }
  
  // 确定品质
  const finalQuality = quality || possibleQualities[Math.floor(Math.random() * possibleQualities.length)];
  
  // 筛选符合条件的模板
  const templates = COMMISSION_TEMPLATES.filter(t => t.quality === finalQuality);
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // 生成唯一ID
  const id = `commission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    ...template,
    id
  };
}

// ============================================
// 势力商店系统
// ============================================

export interface FactionShopItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  cost: { contribution: number };
  stock: number;
  requiredRank?: string;
  requiredReputationLevel?: ReputationLevel;
}

export const FACTION_SHOP_ITEMS: FactionShopItem[] = [
  { id: 'fs_pill_hp', itemId: 'pill_hp_low', name: '回春丹', description: '恢复生命值', rarity: '普通', cost: { contribution: 50 }, stock: -1 },
  { id: 'fs_pill_mp', itemId: 'pill_mp_low', name: '归元丹', description: '恢复法力值', rarity: '普通', cost: { contribution: 50 }, stock: -1 },
  { id: 'fs_pill_cultivation_mid', itemId: 'pill_cultivation_mid', name: '凝元丹', description: '中级修炼丹药', rarity: '稀有', cost: { contribution: 200 }, stock: -1, requiredRank: 'inner_disciple' },
  { id: 'fs_pill_breakthrough_low', itemId: 'pill_breakthrough_low', name: '筑基丹', description: '辅助突破', rarity: '稀有', cost: { contribution: 300 }, stock: -1, requiredRank: 'inner_disciple' },
  { id: 'fs_pill_cultivation_high', itemId: 'pill_cultivation_high', name: '化神丹', description: '高级修炼丹药', rarity: '史诗', cost: { contribution: 500 }, stock: -1, requiredRank: 'core_disciple' },
  { id: 'fs_pill_breakthrough_mid', itemId: 'pill_breakthrough_mid', name: '结金丹', description: '中级突破丹药', rarity: '史诗', cost: { contribution: 800 }, stock: 10, requiredRank: 'core_disciple', requiredReputationLevel: 'friendly' },
  { id: 'fs_pill_breakthrough_high', itemId: 'pill_breakthrough_high', name: '渡劫丹', description: '高级突破丹药', rarity: '传说', cost: { contribution: 2000 }, stock: 5, requiredRank: 'elder', requiredReputationLevel: 'honored' }
];

// ============================================
// 势力技能系统
// ============================================

export interface FactionSkill {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active';
  effects: {
    statBonus?: Record<string, number>;
    special?: string;
  };
  requiredRank: string;
}

export const FACTION_SKILLS: FactionSkill[] = [
  { id: 'faction_skill_elder', name: '宗门护体', description: '受到伤害时有一定概率触发护盾', type: 'passive', effects: { special: 'damage_shield_15' }, requiredRank: 'elder' },
  { id: 'faction_skill_master', name: '宗门传承', description: '修炼效率大幅提升', type: 'passive', effects: { statBonus: { 修炼效率: 25 }, special: 'cultivation_boost_25' }, requiredRank: 'sect_master' },
  { id: 'faction_skill_general', name: '皇朝战意', description: '攻击力永久提升', type: 'passive', effects: { statBonus: { 攻击力: 10 } }, requiredRank: 'general' },
  { id: 'faction_skill_minister', name: '皇权护体', description: '防御力大幅提升', type: 'passive', effects: { statBonus: { 防御力: 15 } }, requiredRank: 'minister' }
];

// ============================================
// 辅助函数
// ============================================

/**
 * 检查职位晋升
 */
export function checkRankPromotion(
  currentRank: string,
  reputation: number,
  factionType: string
): { canPromote: boolean; newRank: string | null; message: string } {
  const ranks = getRanksByFactionType(factionType);
  const currentIndex = ranks.findIndex(r => r.id === currentRank);
  
  if (currentIndex === -1 || currentIndex >= ranks.length - 1) {
    return { canPromote: false, newRank: null, message: '已达到最高职位' };
  }
  
  const nextRank = ranks[currentIndex + 1];
  const reputationLevel = getReputationLevel(reputation);
  
  if (reputation >= nextRank.requiredReputation && 
      REPUTATION_LEVELS[reputationLevel].min >= REPUTATION_LEVELS[nextRank.requiredReputationLevel].min) {
    return { canPromote: true, newRank: nextRank.id, message: `可以晋升为${nextRank.name}` };
  }
  
  return { 
    canPromote: false, 
    newRank: null, 
    message: `需要声望达到${nextRank.requiredReputation}且声望等级达到${REPUTATION_LEVELS[nextRank.requiredReputationLevel].name}` 
  };
}

/**
 * 获取每日俸禄
 */
export function calculateDailySalary(rank: string, factionType: string): number {
  const ranks = getRanksByFactionType(factionType);
  const rankConfig = ranks.find(r => r.id === rank);
  
  if (!rankConfig) return 0;
  
  const salaryBenefit = rankConfig.benefits.find(b => b.type === 'salary');
  return salaryBenefit ? Number(salaryBenefit.value) : 0;
}

/**
 * 获取商店折扣
 */
export function getShopDiscount(rank: string, factionType: string): number {
  const ranks = getRanksByFactionType(factionType);
  const rankConfig = ranks.find(r => r.id === rank);
  
  if (!rankConfig) return 0;
  
  const discountBenefit = rankConfig.benefits.find(b => b.type === 'discount');
  return discountBenefit ? Number(discountBenefit.value) : 0;
}
