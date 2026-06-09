/**
 * 魔幻世界观文案定义
 */

import { WorldTextDefinition } from './types';

export const mohuanTexts: WorldTextDefinition = {
  name: '魔幻',
  description: '魔法与剑的奇幻世界',

  terminology: {
    resource: '魔晶',
    power: '魔力',
    energy: '魔法元素',
    practice: '修行',
    core: '魔力核心',
    breakthrough: '晋升',
    enemy: '魔兽',
    dungeon: '地下城',
    pill: '药剂',
    treasure: '神器',
    dungeonDesc: '层',
    dungeonLocation: '大陆边境',
    breakthroughPill: '晋升药剂',
    cultivationPill: '魔力药剂',
  },

  stats: {
    body: '体魄',
    talent: '魔力',
    wisdom: '悟性',
    luck: '运势',
    will: '意志',
  },

  combat: {
    victory: '击败{enemyName}，获得{exp}点经验',
    defeat: '败给{enemyName}，实力相差悬殊',
    damageDeal: '对{enemyName}造成{damage}点伤害',
    damageReceive: '受到{damage}点伤害',
    damageCrit: '暴击！对{enemyName}造成{damage}点伤害',
    dodge: '{targetName}躲避了攻击',
    round: '第{round}回合',
    start: '遭遇{enemyName}！',
    end: '战斗结束',
  },

  cultivation: {
    success: '修行有成，魔力更加充盈',
    failure: '修行受阻，需要更多感悟',
    breakthrough: '晋升成功！踏入{newRealm}境界',
    breakthroughFail: '晋升失败，魔力不足',
    overflowWarning: '魔力已溢出{overflowExp}点，可以尝试晋升',
    cost: '消耗{resource}×{amount}',
  },

  resource: {
    gain: '获得{resource}×{amount}',
    spend: '消耗{resource}×{amount}',
    insufficient: '{resource}不足',
  },

  item: {
    use: '使用{itemName}，{effect}',
    obtain: '获得{itemName}×{amount}',
    sell: '出售{itemName}，获得{resource}×{amount}',
  },

  dungeon: {
    enter: '进入{dungeonName}',
    exit: '离开{dungeonName}',
    clear: '征服{dungeonName}！获得：{rewards}',
    sweep: '扫荡{dungeonName}，获得{resource}×{amount}',
    staminaCost: '消耗{stamina}点体力',
    powerRequire: '推荐等级：{level}',
  },

  ui: {
    level: '等级 {level}',
    realm: '{realm}',
    combatPower: '战力 {power}',
    exp: '经验 {current}/{max}',
    hp: '生命 {current}/{max}',
    mp: '魔力 {current}/{max}',
    stamina: '体力 {current}/{max}',
  },

  breakthrough: {
    success: '晋升成功！',
    fail: '晋升失败，需要积累更多魔力',
    rate: '晋升成功率：{rate}%',
    pillBonus: '使用{pill}，成功率+{bonus}%',
  },

  message: {
    offlineTitle: '历练所得',
    offlineContent: '历练{duration}，获得{resource}×{amount}',
  },

  paths: {
    body: {
      id: 'body',
      name: '战士',
      description: '钢铁意志，不屈之躯，近战之王',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '钢铁之躯',
        description: '战士修炼至极，成为不朽战神',
        effect: '免疫致命伤害一次（每场战斗）',
      },
    },
    sword: {
      id: 'sword',
      name: '剑士',
      description: '剑术精湛，致命打击，一击必杀',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '致命剑舞',
        description: '剑术至极，可斩断一切',
        effect: '攻击必定暴击',
      },
    },
    spell: {
      id: 'spell',
      name: '法师',
      description: '魔法无边，元素掌控，范围毁灭',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '元素之主',
        description: '魔法修炼至极，可掌控所有元素',
        effect: '每回合自动释放一次基础魔法',
      },
    },
    alchemy: {
      id: 'alchemy',
      name: '炼金师',
      description: '炼金术士，药剂大师，辅助之王',
      primaryStatKey: 'wisdom',
      secondaryStatKey: 'luck',
      ultimateAbility: {
        name: '贤者之石',
        description: '炼金术至极，可点石成金',
        effect: '可制造传说级药剂',
      },
    },
    demon: {
      id: 'demon',
      name: '暗黑法师',
      description: '黑暗魔法，禁术之力，代价高昂',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '黑暗降临',
        description: '黑暗魔法至极，可召唤深渊之力',
        effect: '濒死时召唤黑暗之力，全属性翻倍持续3回合（每场战斗一次）',
      },
    },
  },
};
