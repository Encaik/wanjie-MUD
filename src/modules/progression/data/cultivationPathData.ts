/**
 * 修炼流派系统数据配置
 * 
 * 流派提供差异化成长方向，让玩家有明确的选择感
 */

import { LegacyStats, StatKey } from '@/shared/lib/types';

// 修炼流派类型
export type CultivationPath = 'body' | 'sword' | 'spell' | 'alchemy' | 'demon';

// 流派名称映射
export const CultivationPathNames: Record<CultivationPath, string> = {
  body: '体修',
  sword: '剑修',
  spell: '法修',
  alchemy: '丹修',
  demon: '魔修',
};

// 流派描述
export const CultivationPathDescriptions: Record<CultivationPath, string> = {
  body: '以肉身证道，金刚不坏，力能扛鼎',
  sword: '剑心通明，一剑破万法',
  spell: '法力无边，呼风唤雨',
  alchemy: '丹道通神，药石济世',
  demon: '以魔入道，力量与代价并存',
};

// 流派图标
export const CultivationPathIcons: Record<CultivationPath, string> = {
  body: 'Shield',
  sword: 'Swords',
  spell: 'Sparkles',
  alchemy: 'FlaskConical',
  demon: 'Flame',
};

// 流派行为类型 - 触发流派经验获取的行为
export type PathActionType = 
  | 'melee_attack'      // 近战攻击
  | 'take_damage'       // 受到伤害
  | 'sword_attack'      // 剑类攻击
  | 'spell_attack'      // 法术攻击
  | 'craft_success'     // 炼丹成功
  | 'forge_success'     // 炼器成功
  | 'near_death'        // 濒死状态战斗
  | 'breakthrough'      // 突破成功
  | 'explore'           // 探索历练
  | 'defeat_enemy';     // 击败敌人

// 流派行为经验配置
export interface PathActionExp {
  actionType: PathActionType;
  baseExp: number;          // 基础经验
  description: string;       // 行为描述（用于UI显示）
}

// 流派等级解锁的技能
export interface PathSkill {
  level: number;
  name: string;
  description: string;
  effect: {
    type: 'passive' | 'active';
    statBonus?: Partial<LegacyStats>;
    multiplier?: { stat: StatKey; value: number };
    special?: string;
  };
}

// 流派配置
export interface PathConfig {
  id: CultivationPath;
  name: string;
  description: string;
  icon: string;
  color: string;
  // 主属性
  primaryStat: StatKey;
  secondaryStat: StatKey;
  // 加成
  cultivationBonus: number;  // 修炼经验加成%
  breakthroughBonus: number; // 突破成功率加成%
  // 解锁条件
  unlockConditions: {
    level: number;
    stats: Partial<LegacyStats>;
  };
  // 流派行为经验配置 - 完成特定行为获得流派经验
  actionExp: PathActionExp[];
  // 流派技能（每10级流派等级解锁一个）
  skills: PathSkill[];
  // 质变能力（满级解锁）
  ultimateAbility: {
    name: string;
    description: string;
    effect: string;
  };
  // 劣势（平衡设计）
  drawbacks: string[];
}

// 流派配置数据
export const CULTIVATION_PATHS: Record<CultivationPath, PathConfig> = {
  body: {
    id: 'body',
    name: '体修',
    description: '以肉身证道，金刚不坏，力能扛鼎',
    icon: 'Shield',
    color: 'text-orange-500',
    primaryStat: '体质',
    secondaryStat: '意志',
    cultivationBonus: 10,
    breakthroughBonus: 5,
    unlockConditions: {
      level: 10,
      stats: { 体质: 25 }
    },
    // 体修行为：近战攻击、承受伤害
    actionExp: [
      { actionType: 'melee_attack', baseExp: 2, description: '使用近战攻击' },
      { actionType: 'take_damage', baseExp: 3, description: '承受敌人伤害' },
      { actionType: 'defeat_enemy', baseExp: 5, description: '击败敌人' },
    ],
    skills: [
      { level: 1, name: '铜皮铁骨', description: '体质效果+10%', effect: { type: 'passive', multiplier: { stat: '体质', value: 0.1 } } },
      { level: 2, name: '气血如龙', description: 'HP上限+10%', effect: { type: 'passive', special: 'hp_bonus_10' } },
      { level: 3, name: '金刚不坏', description: '物理伤害减免5%', effect: { type: 'passive', special: 'physical_reduction_5' } },
      { level: 4, name: '力拔山兮', description: '攻击力+15%', effect: { type: 'passive', multiplier: { stat: '体质', value: 0.15 } } },
      { level: 5, name: '百战之躯', description: '战斗后恢复20%HP', effect: { type: 'passive', special: 'battle_regen_20' } },
      { level: 6, name: '不灭金身', description: '物理伤害减免+10%', effect: { type: 'passive', special: 'physical_reduction_10' } },
      { level: 7, name: '神力通天', description: '暴击伤害+30%', effect: { type: 'passive', special: 'crit_damage_30' } },
      { level: 8, name: '万劫不磨', description: '死亡时有20%概率保留1HP', effect: { type: 'passive', special: 'death_save_20' } },
      { level: 9, name: '肉身成圣', description: '体质+20，意志+10', effect: { type: 'passive', statBonus: { 体质: 20, 意志: 10 } } },
      { level: 10, name: '金刚圣体', description: '免疫所有控制效果', effect: { type: 'passive', special: 'immune_cc' } },
    ],
    ultimateAbility: {
      name: '金刚圣体',
      description: '肉身修炼至极，可硬抗天劫',
      effect: '免疫致命伤害一次（每场战斗）'
    },
    drawbacks: ['法力上限-20%', '功法威力-10%']
  },
  
  sword: {
    id: 'sword',
    name: '剑修',
    description: '剑心通明，一剑破万法',
    icon: 'Swords',
    color: 'text-cyan-500',
    primaryStat: '灵根',
    secondaryStat: '悟性',
    cultivationBonus: 8,
    breakthroughBonus: 3,
    unlockConditions: {
      level: 10,
      stats: { 灵根: 25 }
    },
    // 剑修行为：剑类攻击、击败敌人
    actionExp: [
      { actionType: 'sword_attack', baseExp: 3, description: '使用剑类武器攻击' },
      { actionType: 'defeat_enemy', baseExp: 5, description: '击败敌人' },
      { actionType: 'breakthrough', baseExp: 10, description: '突破境界' },
    ],
    skills: [
      { level: 1, name: '剑气初现', description: '攻击力+5%', effect: { type: 'passive', special: 'attack_bonus_5' } },
      { level: 2, name: '剑意凛然', description: '暴击率+5%', effect: { type: 'passive', special: 'crit_rate_5' } },
      { level: 3, name: '剑心通明', description: '暴击伤害+20%', effect: { type: 'passive', special: 'crit_damage_20' } },
      { level: 4, name: '万剑归宗', description: '剑类功法威力+15%', effect: { type: 'passive', special: 'sword_power_15' } },
      { level: 5, name: '剑意护体', description: '被攻击时有15%概率反击', effect: { type: 'passive', special: 'counter_15' } },
      { level: 6, name: '剑破苍穹', description: '无视目标10%防御', effect: { type: 'passive', special: 'armor_pen_10' } },
      { level: 7, name: '剑域初成', description: '攻击范围伤害+20%', effect: { type: 'passive', special: 'aoe_bonus_20' } },
      { level: 8, name: '一剑破万法', description: '技能冷却-20%', effect: { type: 'passive', special: 'cd_reduce_20' } },
      { level: 9, name: '剑意化形', description: '灵根+20，悟性+10', effect: { type: 'passive', statBonus: { 灵根: 20, 悟性: 10 } } },
      { level: 10, name: '剑仙', description: '每3回合额外攻击一次', effect: { type: 'passive', special: 'extra_attack_3' } },
    ],
    ultimateAbility: {
      name: '一剑开天',
      description: '剑道至极，可斩断因果',
      effect: '攻击必定暴击'
    },
    drawbacks: ['HP上限-10%', '防御力-10%']
  },
  
  spell: {
    id: 'spell',
    name: '法修',
    description: '法力无边，呼风唤雨',
    icon: 'Sparkles',
    color: 'text-blue-500',
    primaryStat: '灵根',
    secondaryStat: '悟性',
    cultivationBonus: 12,
    breakthroughBonus: 0,
    unlockConditions: {
      level: 10,
      stats: { 灵根: 30, 悟性: 20 }
    },
    // 法修行为：法术攻击、消耗法力
    actionExp: [
      { actionType: 'spell_attack', baseExp: 3, description: '使用法术攻击' },
      { actionType: 'defeat_enemy', baseExp: 5, description: '击败敌人' },
      { actionType: 'breakthrough', baseExp: 10, description: '突破境界' },
    ],
    skills: [
      { level: 1, name: '法力初醒', description: 'MP上限+10%', effect: { type: 'passive', special: 'mp_bonus_10' } },
      { level: 2, name: '法力涌动', description: 'MP恢复+20%', effect: { type: 'passive', special: 'mp_regen_20' } },
      { level: 3, name: '法术精通', description: '法术威力+10%', effect: { type: 'passive', special: 'spell_power_10' } },
      { level: 4, name: '法力护盾', description: '受到伤害的20%由MP承担', effect: { type: 'passive', special: 'mp_shield_20' } },
      { level: 5, name: '法术连击', description: '10%概率施放两次法术', effect: { type: 'passive', special: 'double_cast_10' } },
      { level: 6, name: '法力无边', description: 'MP上限+30%', effect: { type: 'passive', special: 'mp_bonus_30' } },
      { level: 7, name: '法相天地', description: '法术威力+25%', effect: { type: 'passive', special: 'spell_power_25' } },
      { level: 8, name: '法术穿透', description: '无视目标15%法术防御', effect: { type: 'passive', special: 'spell_pen_15' } },
      { level: 9, name: '法神降世', description: '灵根+25，悟性+15', effect: { type: 'passive', statBonus: { 灵根: 25, 悟性: 15 } } },
      { level: 10, name: '法道至尊', description: '所有法术MP消耗-50%', effect: { type: 'passive', special: 'mp_cost_reduce_50' } },
    ],
    ultimateAbility: {
      name: '天地法相',
      description: '法力修炼至极，可沟通天地',
      effect: '每回合自动释放一次基础法术'
    },
    drawbacks: ['HP上限-15%', '物理防御-20%']
  },
  
  alchemy: {
    id: 'alchemy',
    name: '丹修',
    description: '丹道通神，药石济世',
    icon: 'FlaskConical',
    color: 'text-green-500',
    primaryStat: '悟性',
    secondaryStat: '幸运',
    cultivationBonus: 5,
    breakthroughBonus: 10,
    unlockConditions: {
      level: 10,
      stats: { 悟性: 25 }
    },
    // 丹修行为：炼丹成功、使用丹药
    actionExp: [
      { actionType: 'craft_success', baseExp: 8, description: '炼丹成功' },
      { actionType: 'forge_success', baseExp: 6, description: '炼器成功' },
      { actionType: 'explore', baseExp: 3, description: '探索历练发现材料' },
    ],
    skills: [
      { level: 1, name: '丹道入门', description: '炼丹成功率+10%', effect: { type: 'passive', special: 'alchemy_rate_10' } },
      { level: 2, name: '药理精通', description: '丹药效果+15%', effect: { type: 'passive', special: 'pill_effect_15' } },
      { level: 3, name: '丹心', description: '炼丹时有15%概率获得双倍产出', effect: { type: 'passive', special: 'alchemy_double_15' } },
      { level: 4, name: '灵药辨识', description: '采集材料成功率+20%', effect: { type: 'passive', special: 'gather_rate_20' } },
      { level: 5, name: '丹毒抗性', description: '丹药副作用减少50%', effect: { type: 'passive', special: 'pill_side_reduce_50' } },
      { level: 6, name: '丹道大成', description: '炼丹成功率+20%', effect: { type: 'passive', special: 'alchemy_rate_20' } },
      { level: 7, name: '丹方自创', description: '可自创简易丹方', effect: { type: 'passive', special: 'create_recipe' } },
      { level: 8, name: '炼丹圣手', description: '炼制稀有以上丹药概率+15%', effect: { type: 'passive', special: 'rare_pill_15' } },
      { level: 9, name: '丹道宗师', description: '悟性+20，幸运+15', effect: { type: 'passive', statBonus: { 悟性: 20, 幸运: 15 } } },
      { level: 10, name: '丹神', description: '炼丹必定成功', effect: { type: 'passive', special: 'alchemy_guarantee' } },
    ],
    ultimateAbility: {
      name: '万丹归宗',
      description: '丹道修炼至极，可炼制神丹',
      effect: '可炼制传说级丹药'
    },
    drawbacks: ['战斗力-15%', 'HP上限-10%']
  },
  
  demon: {
    id: 'demon',
    name: '魔修',
    description: '以魔入道，力量与代价并存',
    icon: 'Flame',
    color: 'text-red-500',
    primaryStat: '意志',
    secondaryStat: '体质',
    cultivationBonus: 15,
    breakthroughBonus: -5,
    unlockConditions: {
      level: 15,
      stats: { 意志: 35 }
    },
    // 魔修行为：濒死战斗、击败敌人
    actionExp: [
      { actionType: 'near_death', baseExp: 8, description: '濒死状态下战斗' },
      { actionType: 'defeat_enemy', baseExp: 6, description: '击败敌人' },
      { actionType: 'take_damage', baseExp: 2, description: '承受敌人伤害' },
    ],
    skills: [
      { level: 1, name: '魔气初生', description: '攻击力+10%', effect: { type: 'passive', special: 'attack_bonus_10' } },
      { level: 2, name: '魔心', description: '战斗时HP低于30%时伤害+20%', effect: { type: 'passive', special: 'low_hp_bonus_20' } },
      { level: 3, name: '血祭', description: '可消耗HP换取攻击力', effect: { type: 'active', special: 'blood_sacrifice' } },
      { level: 4, name: '魔威', description: '被攻击时有10%概率恐惧敌人', effect: { type: 'passive', special: 'fear_10' } },
      { level: 5, name: '嗜血', description: '击杀敌人恢复15%HP', effect: { type: 'passive', special: 'kill_regen_15' } },
      { level: 6, name: '魔道纵横', description: '攻击力+20%', effect: { type: 'passive', special: 'attack_bonus_20' } },
      { level: 7, name: '魔意冲天', description: '暴击率+15%', effect: { type: 'passive', special: 'crit_rate_15' } },
      { level: 8, name: '血魔之躯', description: '受到伤害的30%转化为攻击力（临时）', effect: { type: 'passive', special: 'damage_to_attack_30' } },
      { level: 9, name: '魔主', description: '意志+25，体质+15', effect: { type: 'passive', statBonus: { 意志: 25, 体质: 15 } } },
      { level: 10, name: '魔神', description: '攻击时吸取目标10%HP', effect: { type: 'passive', special: 'lifesteal_10' } },
    ],
    ultimateAbility: {
      name: '魔神降临',
      description: '魔道修炼至极，化身魔神',
      effect: '濒死时化身魔神，全属性翻倍持续3回合（每场战斗一次）'
    },
    drawbacks: ['心魔概率+10%', '修炼时可能走火入魔']
  }
};

// 流派等级经验配置
export const PATH_LEVEL_CONFIG = {
  maxLevel: 10,
  baseExp: 100,
  expMultiplier: 2.0, // 每级所需经验倍率
};

// 计算流派升级所需经验
export function getPathLevelExp(level: number): number {
  return Math.floor(PATH_LEVEL_CONFIG.baseExp * Math.pow(PATH_LEVEL_CONFIG.expMultiplier, level - 1));
}

// 检查是否满足流派解锁条件
export function checkPathUnlockConditions(
  path: CultivationPath,
  playerLevel: number,
  playerStats: LegacyStats
): { canUnlock: boolean; reason: string } {
  const config = CULTIVATION_PATHS[path];
  
  if (playerLevel < config.unlockConditions.level) {
    return { canUnlock: false, reason: `需要等级${config.unlockConditions.level}` };
  }
  
  for (const [stat, value] of Object.entries(config.unlockConditions.stats)) {
    const statKey = stat as StatKey;
    if ((playerStats[statKey] || 0) < (value || 0)) {
      return { canUnlock: false, reason: `需要${stat}达到${value}` };
    }
  }
  
  return { canUnlock: true, reason: '' };
}

// 获取流派当前激活的技能
export function getActivePathSkills(path: CultivationPath | null, pathLevel: number): PathSkill[] {
  if (!path || pathLevel < 1) return [];
  return CULTIVATION_PATHS[path].skills.filter(skill => skill.level <= pathLevel);
}

// 计算流派加成后的属性
export function calculatePathStatBonus(
  path: CultivationPath | null,
  pathLevel: number
): Partial<LegacyStats> {
  if (!path || pathLevel < 1) return {};
  
  const skills = getActivePathSkills(path, pathLevel);
  const bonus: Partial<LegacyStats> = {};
  
  for (const skill of skills) {
    if (skill.effect.statBonus) {
      for (const [stat, value] of Object.entries(skill.effect.statBonus)) {
        const statKey = stat as StatKey;
        bonus[statKey] = (bonus[statKey] || 0) + (value || 0);
      }
    }
  }
  
  return bonus;
}
