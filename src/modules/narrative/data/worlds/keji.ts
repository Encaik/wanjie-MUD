/**
 * 科技世界观文案定义
 */

import { WorldTextDefinition } from './types';

export const kejiTexts: WorldTextDefinition = {
  name: '科技',
  description: '未来科技世界，基因进化与科技融合',

  terminology: {
    resource: '能量块',
    power: '能量',
    energy: '能源',
    practice: '强化',
    core: '核心',
    breakthrough: '进化',
    enemy: '变异体',
    dungeon: '遗迹',
    pill: '强化剂',
    treasure: '装备',
    dungeonDesc: '区',
    dungeonLocation: '废弃都市',
    breakthroughPill: '进化药剂',
    cultivationPill: '能量补充剂',
  },

  stats: {
    body: '体魄',
    talent: '基因',
    wisdom: '智力',
    luck: '运气',
    will: '意志',
  },

  combat: {
    victory: '消灭{enemyName}，获得{exp}点经验数据',
    defeat: '被{enemyName}击败，系统受损',
    damageDeal: '对{enemyName}造成{damage}点伤害',
    damageReceive: '受到{damage}点伤害',
    damageCrit: '致命打击！对{enemyName}造成{damage}点伤害',
    dodge: '{targetName}规避了攻击',
    round: '第{round}回合',
    start: '侦测到{enemyName}！',
    end: '战斗结束',
  },

  cultivation: {
    success: '强化成功，机体性能提升',
    failure: '强化失败，资源不足',
    breakthrough: '进化成功！机体等级提升至{newRealm}',
    breakthroughFail: '进化失败，基因不稳定',
    overflowWarning: '能量溢出{overflowExp}点，可以进行进化',
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
    clear: '探索完成{dungeonName}！获得：{rewards}',
    sweep: '扫描{dungeonName}，获得{resource}×{amount}',
    staminaCost: '消耗{stamina}点行动点',
    powerRequire: '推荐战力：{power}',
  },

  ui: {
    level: '等级 {level}',
    realm: '{realm}',
    combatPower: '战力 {power}',
    exp: '经验 {current}/{max}',
    hp: '生命 {current}/{max}',
    mp: '能量 {current}/{max}',
    stamina: '行动点 {current}/{max}',
  },

  breakthrough: {
    success: '进化成功！',
    fail: '进化失败，需要更多能量',
    rate: '进化成功率：{rate}%',
    pillBonus: '使用{pill}，成功率+{bonus}%',
  },

  message: {
    offlineTitle: '待机收益',
    offlineContent: '待机{duration}，获得{resource}×{amount}',
  },

  paths: {
    body: {
      id: 'body',
      name: '改造系',
      description: '机械改造，钢铁之躯，防御无敌',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '钢铁堡垒',
        description: '改造至极，成为不灭的钢铁战士',
        effect: '免疫致命伤害一次（每场战斗）',
      },
    },
    sword: {
      id: 'sword',
      name: '格斗系',
      description: '格斗技巧，精准打击，致命一击',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '致命打击',
        description: '格斗技巧至极，一击必杀',
        effect: '攻击必定暴击',
      },
    },
    spell: {
      id: 'spell',
      name: '能量系',
      description: '能量操控，远程打击，范围毁灭',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '能量风暴',
        description: '能量操控至极，可释放毁灭性能量',
        effect: '每回合自动释放一次基础技能',
      },
    },
    alchemy: {
      id: 'alchemy',
      name: '医疗系',
      description: '医疗科技，纳米修复，快速恢复',
      primaryStatKey: 'wisdom',
      secondaryStatKey: 'luck',
      ultimateAbility: {
        name: '纳米再生',
        description: '医疗科技至极，可瞬间修复重伤',
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
        description: '变异至极，成为超级生命体',
        effect: '濒死时触发终极变异，全属性翻倍持续3回合（每场战斗一次）',
      },
    },
  },
};
