/**
 * 仙侠世界观文案定义
 */

import { WorldTextDefinition } from './types';

export const xianxiaTexts: WorldTextDefinition = {
  name: '仙侠',
  description: '剑与仙的玄幻世界，追求飞升成仙',

  terminology: {
    resource: '仙石',
    power: '仙力',
    energy: '仙气',
    practice: '修炼',
    core: '仙府',
    breakthrough: '突破',
    enemy: '妖魔',
    dungeon: '仙境',
    pill: '仙丹',
    treasure: '仙宝',
    dungeonDesc: '境',
    dungeonLocation: '仙山福地',
    breakthroughPill: '破境仙丹',
    cultivationPill: '聚气仙丹',
  },

  stats: {
    body: '仙体',
    talent: '仙骨',
    wisdom: '悟性',
    luck: '仙缘',
    will: '道心',
  },

  combat: {
    victory: '斩妖除魔，击杀{enemyName}，获得{exp}点仙力',
    defeat: '败于{enemyName}，仙法不精',
    damageDeal: '对{enemyName}造成{damage}点伤害',
    damageReceive: '受到{damage}点伤害',
    damageCrit: '剑气纵横！对{enemyName}造成{damage}点伤害',
    dodge: '{targetName}身法飘逸，避开攻击',
    round: '第{round}回合',
    start: '遭遇妖魔{enemyName}！',
    end: '战斗结束',
  },

  cultivation: {
    success: '修炼有成，仙力更加精纯',
    failure: '修炼受阻，需静心感悟',
    breakthrough: '突破成功！踏入{newRealm}境界',
    breakthroughFail: '突破失败，仙缘未至',
    overflowWarning: '仙力已溢出{overflowExp}点，可尝试突破',
    cost: '消耗{resource}×{amount}',
  },

  resource: {
    gain: '获得{resource}×{amount}',
    spend: '消耗{resource}×{amount}',
    insufficient: '{resource}不足',
  },

  item: {
    use: '服下{itemName}，{effect}',
    obtain: '获得{itemName}×{amount}',
    sell: '出售{itemName}，获得{resource}×{amount}',
  },

  dungeon: {
    enter: '踏入{dungeonName}',
    exit: '离开{dungeonName}',
    clear: '征服{dungeonName}！获得：{rewards}',
    sweep: '搜刮{dungeonName}，获得{resource}×{amount}',
    staminaCost: '消耗{stamina}点体力',
    powerRequire: '推荐境界：{realm}',
  },

  ui: {
    level: '境界 {level}',
    realm: '{realm}',
    combatPower: '战力 {power}',
    exp: '仙力 {current}/{max}',
    hp: '生命 {current}/{max}',
    mp: '仙力 {current}/{max}',
    stamina: '体力 {current}/{max}',
  },

  breakthrough: {
    success: '突破成功！',
    fail: '突破失败，仙缘未到',
    rate: '突破成功率：{rate}%',
    pillBonus: '服下{pill}，成功率+{bonus}%',
  },

  message: {
    offlineTitle: '闭关所得',
    offlineContent: '闭关{duration}，获得{resource}×{amount}',
  },

  paths: {
    body: {
      id: 'body',
      name: '体修',
      description: '肉身成圣，金刚不坏，力能扛鼎',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '不灭金身',
        description: '肉身修炼至极，可硬抗天劫',
        effect: '免疫致命伤害一次（每场战斗）',
      },
    },
    sword: {
      id: 'sword',
      name: '剑仙',
      description: '剑道通神，一剑破万法',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '剑开天门',
        description: '剑道至极，可斩断因果',
        effect: '攻击必定暴击',
      },
    },
    spell: {
      id: 'spell',
      name: '法修',
      description: '仙力无边，呼风唤雨',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '天地法相',
        description: '仙力修炼至极，可沟通天地',
        effect: '每回合自动释放一次基础仙术',
      },
    },
    alchemy: {
      id: 'alchemy',
      name: '丹仙',
      description: '丹道通神，药石济世',
      primaryStatKey: 'wisdom',
      secondaryStatKey: 'luck',
      ultimateAbility: {
        name: '九转金丹',
        description: '丹道修炼至极，可炼制神丹',
        effect: '可炼制传说级仙丹',
      },
    },
    demon: {
      id: 'demon',
      name: '魔修',
      description: '以魔入道，力量与代价并存',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '魔神降世',
        description: '魔道修炼至极，化身魔神',
        effect: '濒死时化身魔神，全属性翻倍持续3回合（每场战斗一次）',
      },
    },
  },
};
