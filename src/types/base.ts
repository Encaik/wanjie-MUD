/**
 * 基础类型定义
 * 包含品质、属性等核心类型
 */

// 品质类型（全局统一，从高到低）
// 红色(mythic) > 橙色(legendary) > 黄色(epic) > 紫色(rare) > 蓝色(uncommon) > 绿色(common) > 灰色(poor) > 白色(basic)
export type Quality = 'mythic' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common' | 'poor' | 'basic';

// 品质中文名称映射
export const QualityNames: Record<Quality, string> = {
  mythic: '传说',
  legendary: '史诗',
  epic: '稀有',
  rare: '精良',
  uncommon: '优秀',
  common: '普通',
  poor: '劣质',
  basic: '基础',
};

// 影响类型（兼容旧代码，映射到品质）
export type ImpactLevel = 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';

// 敌人等级类型
export type EnemyTier = 'normal' | 'elite' | 'miniboss' | 'boss';

// 世界类型
export type WorldType = '修仙' | '高武' | '科技' | '魔幻' | '异能' | '仙侠' | '武侠' | '末世';

// 世界难度等级
export type WorldDifficulty = '简单' | '普通' | '困难' | '噩梦';

// 道具类型
export type ItemType = '丹药' | '材料' | '功法' | '装备' | '消耗品' | '灵石';

// 道具稀有度
export type ItemRarity = '普通' | '稀有' | '史诗' | '传说';

// 道具效果类型
export type EffectType = 
  | 'cultivation_boost' // 修炼增益
  | 'stat_boost' // 属性增益
  | 'restore' // 恢复
  | 'luck_boost' // 幸运增益
  | 'combat_boost' // 战斗增益
  | 'breakthrough_boost' // 突破增益
  | 'restore_hp' // 恢复生命
  | 'restore_mp'; // 恢复法力

// 修炼流派类型
export type CultivationPath = 'body' | 'sword' | 'spell' | 'alchemy' | 'demon';

// 功法类型
export type TechniqueType = 'attack' | 'defense';

// 装备槽位类型
export type EquipmentSlot = 'melee' | 'ranged' | 'head' | 'body' | 'legs' | 'feet';

// 装备槽位名称
export const EquipmentSlotNames: Record<EquipmentSlot, string> = {
  melee: '近战',
  ranged: '远程',
  head: '头部',
  body: '身体',
  legs: '腿部',
  feet: '脚部',
};

// 装备槽位影响属性
export const EquipmentSlotEffect: Record<EquipmentSlot, 'attack' | 'defense'> = {
  melee: 'attack',
  ranged: 'attack',
  head: 'defense',
  body: 'defense',
  legs: 'defense',
  feet: 'defense',
};

// 游戏阶段
export type GamePhase = 'character-select' | 'world-select' | 'backstory' | 'playing';

// 当前操作Tab
export type ActionTab = 'cultivation' | 'experience' | 'adventure' | 'shop' | 'technique' | 'equipment' | 'achievement' | 'collection';

// 机缘难度选择阶段
export type AdventurePhase = 'select' | 'playing';

// 机缘冒险格子类型
export type CellType = 'empty' | 'treasure' | 'enemy' | 'elite' | 'miniboss' | 'boss' | 'event' | 'rest' | 'portal';

// 升级系统类型
export type UpgradeableItemType = 'technique' | 'equipment';

// 功法槽位数量
export const TECHNIQUE_SLOT_COUNT = 3;

// 升级配置
export const UPGRADE_CONFIG = {
  maxLevel: 10,
  baseExpRequired: 100,
  expMultiplier: 1.5,
  materialExpBase: 50,
  materialExpPerLevel: 30,
  rarityExpMultiplier: {
    '普通': 1,
    '稀有': 1.5,
    '史诗': 2,
    '传说': 3,
    '神话': 4,
  },
};

// 消息配置
export const MESSAGE_CONFIG = {
  defaultGameId: 'default_game',
  pageSize: 20,
  maxMessages: 100,
};
