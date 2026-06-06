/**
 * 高武世界观文案定义
 */

import { WorldTextDefinition } from './types';

export const gaowuTexts: WorldTextDefinition = {
  name: '高武',
  description: '武道通神，以武入道',

  terminology: {
    resource: '武晶',
    power: '真气',
    energy: '天地元气',
    practice: '修炼',
    core: '丹田',
    breakthrough: '突破',
    enemy: '武者',
    dungeon: '武域',
    pill: '丹药',
    treasure: '武宝',
    dungeonDesc: '域',
    dungeonLocation: '荒野深处',
    breakthroughPill: '冲脉丹',
    cultivationPill: '培元丹',
  },

  stats: {
    body: '体魄',
    talent: '血脉',
    wisdom: '武悟',
    luck: '机缘',
    will: '意志',
  },

  combat: {
    victory: '击败{enemyName}，获得{exp}点武道经验',
    defeat: '败于{enemyName}，武道修为尚浅',
    damageDeal: '对{enemyName}造成{damage}点伤害',
    damageReceive: '受到{damage}点伤害',
    damageCrit: '爆发一击！对{enemyName}造成{damage}点伤害',
    dodge: '{targetName}闪避了攻击',
    round: '第{round}回合',
    start: '遭遇武者{enemyName}！',
    end: '战斗结束',
  },

  cultivation: {
    success: '修炼有成，真气更加精纯',
    failure: '修炼受阻，需要更多感悟',
    breakthrough: '突破成功！武道境界提升至{newRealm}',
    breakthroughFail: '突破失败，根基不稳',
    overflowWarning: '经验已溢出{overflowExp}点，可以尝试突破',
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
    powerRequire: '推荐战力：{power}',
  },

  ui: {
    level: '等级 {level}',
    realm: '{realm}',
    combatPower: '战力 {power}',
    exp: '经验 {current}/{max}',
    hp: '生命 {current}/{max}',
    mp: '内力 {current}/{max}',
    stamina: '体力 {current}/{max}',
  },

  breakthrough: {
    success: '突破成功！',
    fail: '突破失败，继续积累经验',
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
      name: '体修',
      description: '以武证道，体魄无双，力能扛鼎',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '不灭武体',
        description: '武道修炼至极，肉身成圣',
        effect: '免疫致命伤害一次（每场战斗）',
      },
    },
    sword: {
      id: 'sword',
      name: '剑修',
      description: '剑心通明，以剑入武',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '剑道通神',
        description: '剑道至极，一剑破万法',
        effect: '攻击必定暴击',
      },
    },
    spell: {
      id: 'spell',
      name: '气修',
      description: '真气浩荡，气吞山河',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '气吞天下',
        description: '真气修炼至极，可调动天地之力',
        effect: '每回合自动释放一次基础技能',
      },
    },
    alchemy: {
      id: 'alchemy',
      name: '丹修',
      description: '丹道通神，药石济世',
      primaryStatKey: 'wisdom',
      secondaryStatKey: 'luck',
      ultimateAbility: {
        name: '万丹归宗',
        description: '丹道修炼至极，可炼制神丹',
        effect: '可炼制传说级丹药',
      },
    },
    demon: {
      id: 'demon',
      name: '魔修',
      description: '以魔入道，力量与代价并存',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '魔神降临',
        description: '魔道修炼至极，化身魔神',
        effect: '濒死时化身魔神，全属性翻倍持续3回合（每场战斗一次）',
      },
    },
  },
};
