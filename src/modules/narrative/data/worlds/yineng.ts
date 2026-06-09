/**
 * 异能世界观文案定义
 */

import { WorldTextDefinition } from './types';

export const yinengTexts: WorldTextDefinition = {
  name: '异能',
  description: '觉醒异能，现代都市中的超能力者',

  terminology: {
    resource: '源能石',
    power: '异能',
    energy: '能量',
    practice: '觉醒',
    core: '异能核心',
    breakthrough: '觉醒',
    enemy: '变异者',
    dungeon: '禁区',
    pill: '强化剂',
    treasure: '强化物',
    dungeonDesc: '区',
    dungeonLocation: '城市边缘',
    breakthroughPill: '觉醒药剂',
    cultivationPill: '能量补充剂',
  },

  stats: {
    body: '体魄',
    talent: '潜能',
    wisdom: '悟性',
    luck: '运气',
    will: '意志',
  },

  combat: {
    victory: '击败{enemyName}，获得{exp}点经验',
    defeat: '败给{enemyName}，异能压制',
    damageDeal: '对{enemyName}造成{damage}点伤害',
    damageReceive: '受到{damage}点伤害',
    damageCrit: '异能爆发！对{enemyName}造成{damage}点伤害',
    dodge: '{targetName}规避了攻击',
    round: '第{round}回合',
    start: '遭遇变异者{enemyName}！',
    end: '战斗结束',
  },

  cultivation: {
    success: '觉醒强化，异能更加精纯',
    failure: '觉醒受阻，潜能不足',
    breakthrough: '觉醒成功！异能等级提升至{newRealm}',
    breakthroughFail: '觉醒失败，核心不稳',
    overflowWarning: '能量已溢出{overflowExp}点，可以进行觉醒',
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
    exit: '撤出{dungeonName}',
    clear: '清除{dungeonName}！获得：{rewards}',
    sweep: '搜查{dungeonName}，获得{resource}×{amount}',
    staminaCost: '消耗{stamina}点行动点',
    powerRequire: '推荐战力：{power}',
  },

  ui: {
    level: '等级 {level}',
    realm: '{realm}',
    combatPower: '战力 {power}',
    exp: '经验 {current}/{max}',
    hp: '生命 {current}/{max}',
    mp: '异能 {current}/{max}',
    stamina: '行动点 {current}/{max}',
  },

  breakthrough: {
    success: '觉醒成功！',
    fail: '觉醒失败，需要更多潜能',
    rate: '觉醒成功率：{rate}%',
    pillBonus: '使用{pill}，成功率+{bonus}%',
  },

  message: {
    offlineTitle: '待机收益',
    offlineContent: '待机{duration}，获得{resource}×{amount}',
  },

  paths: {
    body: {
      id: 'body',
      name: '强化系',
      description: '肉体强化，力量惊人，防御无敌',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '钢铁之躯',
        description: '强化系异能至极，成为不灭战士',
        effect: '免疫致命伤害一次（每场战斗）',
      },
    },
    sword: {
      id: 'sword',
      name: '战斗系',
      description: '战斗本能，精准打击，致命一击',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '必杀一击',
        description: '战斗系异能至极，一击必杀',
        effect: '攻击必定暴击',
      },
    },
    spell: {
      id: 'spell',
      name: '元素系',
      description: '元素操控，远程打击，范围毁灭',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '元素风暴',
        description: '元素系异能至极，可操控所有元素',
        effect: '每回合自动释放一次基础技能',
      },
    },
    alchemy: {
      id: 'alchemy',
      name: '辅助系',
      description: '辅助能力，治疗恢复，支援队友',
      primaryStatKey: 'wisdom',
      secondaryStatKey: 'luck',
      ultimateAbility: {
        name: '绝对领域',
        description: '辅助系异能至极，可创造绝对领域',
        effect: '可制造传说级辅助物品',
      },
    },
    demon: {
      id: 'demon',
      name: '狂暴系',
      description: '狂暴之力，力量暴增，代价惨重',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '终极狂暴',
        description: '狂暴系异能至极，化身毁灭者',
        effect: '濒死时触发终极狂暴，全属性翻倍持续3回合（每场战斗一次）',
      },
    },
  },
};
