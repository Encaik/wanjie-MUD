/**
 * 世界观文案定义类型
 * 
 * 每个世界观都遵循相同的结构，方便复制和修改
 * 添加新世界观只需复制一个文件然后修改内容
 */

import { WorldType } from '../../game/types';

/**
 * 术语文案
 * 核心概念词，随世界观变化
 */
export interface WorldTerminology {
  /** 资源名称（灵石/武晶/能量块/魔晶/源能石/仙石/银两/补给点） */
  resource: string;
  /** 力量名称（灵力/真气/能量/魔力/异能/仙力/内力/异能） */
  power: string;
  /** 能量源名称（灵气/天地元气/能源/魔法元素/能量/仙气/真气/进化能） */
  energy: string;
  /** 修炼行为（修炼/修炼/强化/修行/觉醒/修炼/修炼/进化） */
  practice: string;
  /** 核心名称（丹田/丹田/核心/魔力核心/异能核心/仙府/气海/进化核） */
  core: string;
  /** 突破名称（突破/突破/进化/晋升/觉醒/突破/突破/进化） */
  breakthrough: string;
  /** 敌人统称（妖兽/武者/变异体/魔兽/变异者/妖魔/武者/感染者） */
  enemy: string;
  /** 秘境名称（秘境/武域/遗迹/地下城/禁区/仙境/秘洞/废墟） */
  dungeon: string;
  /** 丹药统称（丹药/丹药/强化剂/药剂/强化剂/仙丹/丹药/强化剂） */
  pill: string;
  /** 宝物统称（法宝/武宝/装备/神器/强化物/仙宝/兵器/物资） */
  treasure: string;
  /** 秘境描述后缀 */
  dungeonDesc: string;
  /** 秘境位置 */
  dungeonLocation: string;
  /** 突破丹药 */
  breakthroughPill: string;
  /** 修炼丹药 */
  cultivationPill: string;
}

/**
 * 属性名称
 * 五大属性在不同世界的叫法
 */
export interface WorldStatNames {
  /** 体质（肉身/体魄/体魄/体魄/体魄/仙体/内力/体魄） */
  body: string;
  /** 天赋（灵根/血脉/基因/魔力/潜能/仙骨/资质/进化） */
  talent: string;
  /** 悟性 */
  wisdom: string;
  /** 幸运（气运/机缘/运气/运势/运气/仙缘/机缘/运气） */
  luck: string;
  /** 意志（道心/意志/意志/意志/意志/道心/意志/意志） */
  will: string;
}

/**
 * 战斗文案模板
 */
export interface WorldCombatTexts {
  /** 战斗胜利 */
  victory: string;
  /** 战斗失败 */
  defeat: string;
  /** 造成伤害 */
  damageDeal: string;
  /** 受到伤害 */
  damageReceive: string;
  /** 暴击 */
  damageCrit: string;
  /** 闪避 */
  dodge: string;
  /** 回合 */
  round: string;
  /** 战斗开始 */
  start: string;
  /** 战斗结束 */
  end: string;
}

/**
 * 修炼文案模板
 */
export interface WorldCultivationTexts {
  /** 修炼成功 */
  success: string;
  /** 修炼失败 */
  failure: string;
  /** 突破成功 */
  breakthrough: string;
  /** 突破失败 */
  breakthroughFail: string;
  /** 溢出警告 */
  overflowWarning: string;
  /** 消耗 */
  cost: string;
}

/**
 * 资源文案模板
 */
export interface WorldResourceTexts {
  /** 获得资源 */
  gain: string;
  /** 消耗资源 */
  spend: string;
  /** 资源不足 */
  insufficient: string;
}

/**
 * 物品文案模板
 */
export interface WorldItemTexts {
  /** 使用物品 */
  use: string;
  /** 获得物品 */
  obtain: string;
  /** 出售物品 */
  sell: string;
}

/**
 * 秘境文案模板
 */
export interface WorldDungeonTexts {
  /** 进入秘境 */
  enter: string;
  /** 退出秘境 */
  exit: string;
  /** 通关秘境 */
  clear: string;
  /** 扫荡秘境 */
  sweep: string;
  /** 体力消耗 */
  staminaCost: string;
  /** 战力要求 */
  powerRequire: string;
}

/**
 * UI文案模板
 */
export interface WorldUITexts {
  /** 等级显示 */
  level: string;
  /** 境界显示 */
  realm: string;
  /** 战力显示 */
  combatPower: string;
  /** 经验显示 */
  exp: string;
  /** 生命值显示 */
  hp: string;
  /** 法力值显示 */
  mp: string;
  /** 体力显示 */
  stamina: string;
}

/**
 * 突破文案模板
 */
export interface WorldBreakthroughTexts {
  /** 突破成功 */
  success: string;
  /** 突破失败 */
  fail: string;
  /** 突破成功率 */
  rate: string;
  /** 突破丹药加成 */
  pillBonus: string;
}

/**
 * 消息文案模板
 */
export interface WorldMessageTexts {
  /** 离线收益标题 */
  offlineTitle: string;
  /** 离线收益内容 */
  offlineContent: string;
}

// ============================================
// 流派文案类型
// ============================================

/**
 * 流派类型标识
 */
export type PathTypeId = 'body' | 'sword' | 'spell' | 'alchemy' | 'demon';

/**
 * 属性键名（统一键名，不同世界有不同显示名）
 */
export type StatKey = 'body' | 'talent' | 'wisdom' | 'luck' | 'will';

/**
 * 单个流派文案定义
 */
export interface PathTextDefinition {
  /** 流派ID */
  id: PathTypeId;
  /** 流派名称 */
  name: string;
  /** 流派描述 */
  description: string;
  /** 主属性键名（通过 stats[key] 获取实际显示名） */
  primaryStatKey: StatKey;
  /** 副属性键名（通过 stats[key] 获取实际显示名） */
  secondaryStatKey: StatKey;
  /** 终极能力 */
  ultimateAbility: {
    /** 名称 */
    name: string;
    /** 描述 */
    description: string;
    /** 效果 */
    effect: string;
  };
}

/**
 * 流派文案集合
 */
export interface WorldPathTexts {
  /** 体修/力量型流派 */
  body: PathTextDefinition;
  /** 剑修/敏捷型流派 */
  sword: PathTextDefinition;
  /** 法修/智力型流派 */
  spell: PathTextDefinition;
  /** 丹修/辅助型流派 */
  alchemy: PathTextDefinition;
  /** 魔修/特殊流派 */
  demon: PathTextDefinition;
}

/**
 * 世界观文案定义
 * 
 * 包含该世界观下所有文案的完整定义
 */
export interface WorldTextDefinition {
  /** 世界观名称 */
  name: WorldType;
  /** 世界观描述 */
  description: string;
  /** 术语 */
  terminology: WorldTerminology;
  /** 属性名 */
  stats: WorldStatNames;
  /** 战斗文案 */
  combat: WorldCombatTexts;
  /** 修炼文案 */
  cultivation: WorldCultivationTexts;
  /** 资源文案 */
  resource: WorldResourceTexts;
  /** 物品文案 */
  item: WorldItemTexts;
  /** 秘境文案 */
  dungeon: WorldDungeonTexts;
  /** UI文案 */
  ui: WorldUITexts;
  /** 突破文案 */
  breakthrough: WorldBreakthroughTexts;
  /** 消息文案 */
  message: WorldMessageTexts;
  /** 流派文案 */
  paths: WorldPathTexts;
}

/**
 * 世界观文案映射表
 */
export type WorldTextsMap = Partial<Record<WorldType, WorldTextDefinition>>;
