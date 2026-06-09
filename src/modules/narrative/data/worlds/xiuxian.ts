/**
 * 修仙世界观文案定义
 * 
 * 复制此文件并修改内容即可创建新世界观
 */

import { WorldTextDefinition } from './types';

export const xiuxianTexts: WorldTextDefinition = {
  name: '修仙',
  description: '传统修仙世界，追求长生大道',

  // ============================================
  // 术语定义 - 核心概念词
  // ============================================
  terminology: {
    resource: '灵石',
    power: '灵力',
    energy: '灵气',
    practice: '修炼',
    core: '丹田',
    breakthrough: '突破',
    enemy: '妖兽',
    dungeon: '秘境',
    pill: '丹药',
    treasure: '法宝',
    dungeonDesc: '境',
    dungeonLocation: '深山之中',
    breakthroughPill: '破境丹',
    cultivationPill: '聚气丹',
  },

  // ============================================
  // 属性名称
  // ============================================
  stats: {
    body: '肉身',
    talent: '灵根',
    wisdom: '悟性',
    luck: '气运',
    will: '道心',
  },

  // ============================================
  // 战斗文案
  // ============================================
  combat: {
    victory: '斩杀了{enemyName}，获得{exp}点修为',
    defeat: '败于{enemyName}之手，实力不足',
    damageDeal: '对{enemyName}造成{damage}点伤害',
    damageReceive: '受到{damage}点伤害',
    damageCrit: '会心一击！对{enemyName}造成{damage}点伤害',
    dodge: '{targetName}身法敏捷，避开了攻击',
    round: '第{round}回合',
    start: '遭遇了{enemyName}！',
    end: '战斗结束',
  },

  // ============================================
  // 修炼文案
  // ============================================
  cultivation: {
    success: '{practice}有成，{power}精纯了几分',
    failure: '{practice}受阻，需静心凝神',
    breakthrough: '{breakthrough}成功！踏入{newRealm}境界',
    breakthroughFail: '{breakthrough}失败，根基尚浅',
    overflowWarning: '修为已溢出{overflowExp}点，可尝试{breakthrough}',
    cost: '消耗{resource}×{amount}',
  },

  // ============================================
  // 资源文案
  // ============================================
  resource: {
    gain: '获得{resource}×{amount}',
    spend: '消耗{resource}×{amount}',
    insufficient: '{resource}不足',
  },

  // ============================================
  // 物品文案
  // ============================================
  item: {
    use: '服用{itemName}，{effect}',
    obtain: '获得{itemName}×{amount}',
    sell: '出售{itemName}，获得{resource}×{amount}',
  },

  // ============================================
  // 秘境文案
  // ============================================
  dungeon: {
    enter: '踏入{dungeonName}',
    exit: '离开{dungeonName}',
    clear: '通关{dungeonName}！获得：{rewards}',
    sweep: '扫荡{dungeonName}，获得{resource}×{amount}',
    staminaCost: '消耗{stamina}点体力',
    powerRequire: '推荐境界：{realm}',
  },

  // ============================================
  // UI文案
  // ============================================
  ui: {
    level: '境界 {level}',
    realm: '{realm}',
    combatPower: '战力 {power}',
    exp: '修为 {current}/{max}',
    hp: '生命 {current}/{max}',
    mp: '法力 {current}/{max}',
    stamina: '体力 {current}/{max}',
  },

  // ============================================
  // 突破文案
  // ============================================
  breakthrough: {
    success: '{breakthrough}成功！',
    fail: '{breakthrough}失败，根基不稳',
    rate: '{breakthrough}成功率：{rate}%',
    pillBonus: '服用{pill}，成功率+{bonus}%',
  },

  // ============================================
  // 消息文案
  // ============================================
  message: {
    offlineTitle: '闭关所得',
    offlineContent: '闭关{duration}，获得{resource}×{amount}',
  },

  // ============================================
  // 流派文案
  // ============================================
  paths: {
    body: {
      id: 'body',
      name: '体修',
      description: '以肉身证道，金刚不坏，力能扛鼎',
      primaryStatKey: 'body',
      secondaryStatKey: 'will',
      ultimateAbility: {
        name: '金刚圣体',
        description: '肉身修炼至极，可硬抗天劫',
        effect: '免疫致命伤害一次（每场战斗）',
      },
    },
    sword: {
      id: 'sword',
      name: '剑修',
      description: '剑心通明，一剑破万法',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '一剑开天',
        description: '剑道至极，可斩断因果',
        effect: '攻击必定暴击',
      },
    },
    spell: {
      id: 'spell',
      name: '法修',
      description: '法力无边，呼风唤雨',
      primaryStatKey: 'talent',
      secondaryStatKey: 'wisdom',
      ultimateAbility: {
        name: '天地法相',
        description: '法力修炼至极，可沟通天地',
        effect: '每回合自动释放一次基础法术',
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
