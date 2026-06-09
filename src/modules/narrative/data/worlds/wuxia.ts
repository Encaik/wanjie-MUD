/**
 * 武侠世界观文案定义
 */

import { WorldTextDefinition } from './types';

export const wuxiaTexts: WorldTextDefinition = {
  name: '武侠',
  description: '江湖武林，侠义恩仇',

  terminology: {
    resource: '银两',
    power: '内力',
    energy: '真气',
    practice: '修炼',
    core: '气海',
    breakthrough: '突破',
    enemy: '武者',
    dungeon: '秘洞',
    pill: '丹药',
    treasure: '兵器',
    dungeonDesc: '洞',
    dungeonLocation: '江湖深处',
    breakthroughPill: '易筋丹',
    cultivationPill: '养气丹',
  },

  stats: {
    body: '内力',
    talent: '资质',
    wisdom: '悟性',
    luck: '机缘',
    will: '意志',
  },

  combat: {
    victory: '击败{enemyName}，获得{exp}点江湖经验',
    defeat: '败于{enemyName}，内功不济',
    damageDeal: '对{enemyName}造成{damage}点伤害',
    damageReceive: '受到{damage}点伤害',
    damageCrit: '内力爆发！对{enemyName}造成{damage}点伤害',
    dodge: '{targetName}轻功闪避了攻击',
    round: '第{round}回合',
    start: '遭遇{enemyName}！',
    end: '战斗结束',
  },

  cultivation: {
    success: '修炼有成，内力更加深厚',
    failure: '修炼受阻，心神不宁',
    breakthrough: '突破成功！武功境界达到{newRealm}',
    breakthroughFail: '突破失败，走火入魔',
    overflowWarning: '内力已溢出{overflowExp}点，可以尝试突破',
    cost: '消耗{resource}×{amount}',
  },

  resource: {
    gain: '获得{resource}×{amount}',
    spend: '消耗{resource}×{amount}',
    insufficient: '{resource}不足',
  },

  item: {
    use: '服用{itemName}，{effect}',
    obtain: '获得{itemName}×{amount}',
    sell: '出售{itemName}，获得{resource}×{amount}',
  },

  dungeon: {
    enter: '进入{dungeonName}',
    exit: '离开{dungeonName}',
    clear: '探索{dungeonName}！获得：{rewards}',
    sweep: '搜查{dungeonName}，获得{resource}×{amount}',
    staminaCost: '消耗{stamina}点体力',
    powerRequire: '推荐功力：{power}',
  },

  ui: {
    level: '境界 {level}',
    realm: '{realm}',
    combatPower: '功力 {power}',
    exp: '修为 {current}/{max}',
    hp: '生命 {current}/{max}',
    mp: '内力 {current}/{max}',
    stamina: '体力 {current}/{max}',
  },

  breakthrough: {
    success: '突破成功！',
    fail: '突破失败，根基不稳',
    rate: '突破成功率：{rate}%',
    pillBonus: '服用{pill}，成功率+{bonus}%',
  },

  message: {
    offlineTitle: '历练所得',
    offlineContent: '历练{duration}，获得{resource}×{amount}',
  },

  paths: {
    body: {
      id: 'body',
      name: '外家',
      description: '外家功夫，铜皮铁骨，力能扛鼎',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '金刚不坏',
        description: '外家功夫至极，可刀枪不入',
        effect: '免疫致命伤害一次（每场战斗）',
      },
    },
    sword: {
      id: 'sword',
      name: '剑客',
      description: '剑术精湛，剑走轻灵，一击必杀',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '独孤九剑',
        description: '剑术至极，无招胜有招',
        effect: '攻击必定暴击',
      },
    },
    spell: {
      id: 'spell',
      name: '内家',
      description: '内功深厚，真气浩荡，气吞山河',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '九阳神功',
        description: '内功修炼至极，真气生生不息',
        effect: '每回合自动释放一次基础武功',
      },
    },
    alchemy: {
      id: 'alchemy',
      name: '医仙',
      description: '医术通神，药石济世，妙手回春',
      primaryStatKey: 'wisdom',
      secondaryStatKey: 'luck',
      ultimateAbility: {
        name: '华佗再世',
        description: '医术修炼至极，可起死回生',
        effect: '可制造传说级丹药',
      },
    },
    demon: {
      id: 'demon',
      name: '邪派',
      description: '邪派武功，力量暴增，代价惨重',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '吸星大法',
        description: '邪派武功至极，可吸取他人内力',
        effect: '濒死时吸取敌方内力，全属性翻倍持续3回合（每场战斗一次）',
      },
    },
  },
};
