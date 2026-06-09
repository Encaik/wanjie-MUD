/**
 * 末世世界观文案定义
 */

import { WorldTextDefinition } from './types';

export const moshiTexts: WorldTextDefinition = {
  name: '末世',
  description: '末日废土，生存与进化',

  terminology: {
    resource: '补给点',
    power: '异能',
    energy: '进化能',
    practice: '进化',
    core: '进化核',
    breakthrough: '进化',
    enemy: '感染者',
    dungeon: '废墟',
    pill: '强化剂',
    treasure: '物资',
    dungeonDesc: '区',
    dungeonLocation: '废土深处',
    breakthroughPill: '进化药剂',
    cultivationPill: '恢复剂',
  },

  stats: {
    body: '体魄',
    talent: '进化',
    wisdom: '智力',
    luck: '运气',
    will: '意志',
  },

  combat: {
    victory: '消灭{enemyName}，获得{exp}点生存经验',
    defeat: '败给{enemyName}，实力悬殊',
    damageDeal: '对{enemyName}造成{damage}点伤害',
    damageReceive: '受到{damage}点伤害',
    damageCrit: '致命一击！对{enemyName}造成{damage}点伤害',
    dodge: '{targetName}躲避了攻击',
    round: '第{round}回合',
    start: '遭遇感染者{enemyName}！',
    end: '战斗结束',
  },

  cultivation: {
    success: '进化成功，机体更加完善',
    failure: '进化受阻，基因不稳定',
    breakthrough: '进化成功！生存等级提升至{newRealm}',
    breakthroughFail: '进化失败，基因崩溃',
    overflowWarning: '能量已溢出{overflowExp}点，可以进行进化',
    cost: '消耗{resource}×{amount}',
  },

  resource: {
    gain: '获得{resource}×{amount}',
    spend: '消耗{resource}×{amount}',
    insufficient: '{resource}储备不足',
  },

  item: {
    use: '使用{itemName}，{effect}',
    obtain: '获得{itemName}×{amount}',
    sell: '出售{itemName}，获得{resource}×{amount}',
  },

  dungeon: {
    enter: '进入{dungeonName}',
    exit: '撤出{dungeonName}',
    clear: '清理{dungeonName}！获得：{rewards}',
    sweep: '搜索{dungeonName}，获得{resource}×{amount}',
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
    success: '进化成功！',
    fail: '进化失败，需要更多能量',
    rate: '进化成功率：{rate}%',
    pillBonus: '使用{pill}，成功率+{bonus}%',
  },

  message: {
    offlineTitle: '生存收益',
    offlineContent: '生存{duration}，获得{resource}×{amount}',
  },

  paths: {
    body: {
      id: 'body',
      name: '强化系',
      description: '肉体进化，防御惊人，生存力强',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '钢铁堡垒',
        description: '肉体进化至极，成为不灭堡垒',
        effect: '免疫致命伤害一次（每场战斗）',
      },
    },
    sword: {
      id: 'sword',
      name: '猎杀者',
      description: '战斗技巧，精准打击，致命一击',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '致命猎杀',
        description: '战斗技巧至极，一击必杀',
        effect: '攻击必定暴击',
      },
    },
    spell: {
      id: 'spell',
      name: '异能系',
      description: '异能觉醒，远程打击，范围毁灭',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '异能风暴',
        description: '异能进化至极，可释放毁灭性能量',
        effect: '每回合自动释放一次基础技能',
      },
    },
    alchemy: {
      id: 'alchemy',
      name: '医疗系',
      description: '医疗科技，快速恢复，支援队友',
      primaryStatKey: 'wisdom',
      secondaryStatKey: 'luck',
      ultimateAbility: {
        name: '纳米再生',
        description: '医疗技术至极，可瞬间修复重伤',
        effect: '可制造传说级医疗物品',
      },
    },
    demon: {
      id: 'demon',
      name: '变异系',
      description: '基因变异，力量暴增，代价惨重',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '终极变异',
        description: '变异进化至极，成为超级生命体',
        effect: '濒死时触发终极变异，全属性翻倍持续3回合（每场战斗一次）',
      },
    },
  },
};
