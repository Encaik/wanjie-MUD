/**
 * 每周Boss系统
 * 
 * 根据 comprehensive-optimization-design.md 设计文档实现
 * 管理：每周Boss生成、战斗记录、奖励发放
 */

import { 
  WeeklyBoss, 
  WeeklyBossAbility, 
  WeeklyBossReward,
  WeeklyBossDamageRecord,
  WeeklyBossBattleState,
  Element
} from './types';

// ============================================
// Boss模板配置
// ============================================

/** Boss名称池 */
const BOSS_NAMES: Record<Element, string[]> = {
  fire: ['炎魔领主', '烈焰霸王', '焚天魔尊', '炽炎君主'],
  ice: ['冰霜巨龙', '寒冰女王', '凛冬暴君', '霜寒魔神'],
  thunder: ['雷鸣战神', '天雷尊者', '电光魔君', '雷霆霸主'],
  earth: ['大地守护者', '岩石巨人', '山岳魔尊', '地脉龙王'],
  wind: ['风暴领主', '疾风战神', '飓风魔君', '苍穹霸主'],
  light: ['圣光天使', '光明审判', '辉耀神尊', '白昼君王'],
  dark: ['暗夜魔王', '深渊领主', '虚空吞噬者', '黑暗君王']
};

/** Boss称号池 */
const BOSS_TITLES: string[] = [
  '世界守护者',
  '飞升守门人',
  '界域霸主',
  '虚空行者',
  '混沌化身',
  '远古巨兽',
  '天灾使者',
  '永恒守望者'
];

/** Boss描述模板 */
const BOSS_DESCRIPTIONS: string[] = [
  '来自异界的强大存在，守护着通往更高境界的道路',
  '千年难遇的绝世凶兽，拥有毁灭世界的力量',
  '上古遗迹的守护者，拥有无尽的力量和智慧',
  '天地法则的化身，考验着挑战者的实力',
  '穿越时空而来的恐怖存在，为了某种目的而停留于此'
];

/** 特殊能力模板 */
const ABILITY_TEMPLATES: WeeklyBossAbility[] = [
  {
    id: 'rage',
    name: '狂暴',
    description: 'HP低于50%时攻击力提升30%',
    trigger: 'hp_threshold',
    effect: { type: 'buff', target: 'self', stat: 'attack', value: 30 },
    cooldown: 0
  },
  {
    id: 'summon_minions',
    name: '召唤仆从',
    description: '每5回合召唤小怪',
    trigger: 'turn_count',
    effect: { type: 'summon', value: 2 },
    cooldown: 5
  },
  {
    id: 'aoe_attack',
    name: '范围攻击',
    description: '回合开始时造成范围伤害',
    trigger: 'round_start',
    effect: { type: 'aoe_damage', value: 0.15, target: 'player' },
    cooldown: 3
  },
  {
    id: 'regeneration',
    name: '生命回复',
    description: '每回合恢复HP',
    trigger: 'round_start',
    effect: { type: 'heal', target: 'self', value: 0.02 },
    cooldown: 0
  },
  {
    id: 'counter_attack',
    name: '反击',
    description: '受到攻击时有概率反击',
    trigger: 'round_start',
    effect: { type: 'damage', target: 'player', value: 0.5 },
    cooldown: 1
  }
];

// ============================================
// 每周Boss生成
// ============================================

export class WeeklyBossGenerator {
  /**
   * 获取当前周数
   */
  static getCurrentWeekNumber(): number {
    const now = Date.now();
    const weekStart = new Date(now).setHours(0, 0, 0, 0);
    const dayOfWeek = new Date(now).getDay();
    const weekNumber = Math.floor((weekStart - dayOfWeek * 86400000) / (7 * 86400000));
    return Math.abs(weekNumber);
  }
  
  /**
   * 获取本周开始和结束时间
   */
  static getWeekTimeRange(): { start: number; end: number } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 7);
    sunday.setHours(23, 59, 59, 999);
    
    return {
      start: monday.getTime(),
      end: sunday.getTime()
    };
  }
  
  /**
   * 生成每周Boss
   */
  static generateWeeklyBoss(playerLevel: number): WeeklyBoss {
    const weekNumber = this.getCurrentWeekNumber();
    const timeRange = this.getWeekTimeRange();
    
    // 使用周数作为随机种子（伪随机）
    const seed = weekNumber;
    const random = this.seededRandom(seed);
    
    // 随机选择元素
    const elements: Element[] = ['fire', 'ice', 'thunder', 'earth', 'wind', 'light', 'dark'];
    const element = elements[Math.floor(random() * elements.length)];
    
    // 随机选择名称
    const names = BOSS_NAMES[element];
    const name = names[Math.floor(random() * names.length)];
    
    // 随机选择称号
    const title = BOSS_TITLES[Math.floor(random() * BOSS_TITLES.length)];
    
    // 随机选择描述
    const description = BOSS_DESCRIPTIONS[Math.floor(random() * BOSS_DESCRIPTIONS.length)];
    
    // 根据等级计算属性
    const level = Math.max(1, playerLevel + Math.floor(random() * 5) - 2);
    const hp = Math.floor(50000 * (1 + level * 0.1) * (1 + random() * 0.2));
    const attack = Math.floor(500 * (1 + level * 0.08) * (1 + random() * 0.2));
    const defense = Math.floor(200 * (1 + level * 0.05) * (1 + random() * 0.2));
    
    // 随机选择特殊能力
    const abilityIndex = Math.floor(random() * ABILITY_TEMPLATES.length);
    const specialAbility = { ...ABILITY_TEMPLATES[abilityIndex] };
    
    // 生成奖励
    const rewards: WeeklyBossReward[] = [
      {
        type: 'first_kill',
        rewards: {
          ascensionMarks: 30 + level * 2,
          items: []
        }
      },
      {
        type: 'daily_damage',
        threshold: hp * 0.1,
        rewards: {
          ascensionMarks: 5 + level,
          items: []
        }
      },
      {
        type: 'ranking',
        threshold: 1,
        rewards: {
          ascensionMarks: 100 + level * 5
        }
      },
      {
        type: 'ranking',
        threshold: 3,
        rewards: {
          ascensionMarks: 50 + level * 3
        }
      },
      {
        type: 'ranking',
        threshold: 10,
        rewards: {
          ascensionMarks: 25 + level * 2
        }
      }
    ];
    
    return {
      id: `weekly_boss_${weekNumber}`,
      name,
      description: `[${title}] ${description}`,
      element,
      level,
      hp,
      attack,
      defense,
      specialAbility,
      rewards,
      availableFrom: timeRange.start,
      availableUntil: timeRange.end,
      weekNumber
    };
  }
  
  /**
   * 带种子的伪随机数生成器
   */
  private static seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }
}

// ============================================
// 每周Boss服务
// ============================================

export class WeeklyBossService {
  // 当前Boss缓存
  private static currentBoss: WeeklyBoss | null = null;
  
  // 玩家伤害记录
  private static damageRecords: Map<string, WeeklyBossDamageRecord> = new Map();
  
  // 首杀记录
  private static firstKills: Set<string> = new Set();
  
  /**
   * 获取当前每周Boss
   */
  static getCurrentBoss(playerLevel: number): WeeklyBoss {
    const weekNumber = WeeklyBossGenerator.getCurrentWeekNumber();
    
    // 如果缓存过期或不存在，生成新Boss
    if (!this.currentBoss || this.currentBoss.weekNumber !== weekNumber) {
      this.currentBoss = WeeklyBossGenerator.generateWeeklyBoss(playerLevel);
      this.damageRecords.clear();
      this.firstKills.clear();
    }
    
    return this.currentBoss;
  }
  
  /**
   * 检查Boss是否可用
   */
  static isBossAvailable(boss: WeeklyBoss): boolean {
    const now = Date.now();
    return now >= boss.availableFrom && now <= boss.availableUntil;
  }
  
  /**
   * 获取剩余时间（毫秒）
   */
  static getRemainingTime(boss: WeeklyBoss): number {
    const now = Date.now();
    return Math.max(0, boss.availableUntil - now);
  }
  
  /**
   * 记录伤害
   */
  static recordDamage(
    playerId: string,
    playerName: string,
    boss: WeeklyBoss,
    damage: number
  ): WeeklyBossDamageRecord {
    const key = `${playerId}_${boss.weekNumber}`;
    let record = this.damageRecords.get(key);
    
    if (!record) {
      record = {
        playerId,
        playerName,
        bossId: boss.id,
        weekNumber: boss.weekNumber,
        totalDamage: 0,
        bestDamage: 0,
        attempts: 0,
        firstKill: false,
        lastAttemptAt: Date.now()
      };
      this.damageRecords.set(key, record);
    }
    
    record.totalDamage += damage;
    record.bestDamage = Math.max(record.bestDamage, damage);
    record.attempts += 1;
    record.lastAttemptAt = Date.now();
    
    return record;
  }
  
  /**
   * 获取玩家伤害记录
   */
  static getPlayerRecord(
    playerId: string,
    weekNumber: number
  ): WeeklyBossDamageRecord | null {
    const key = `${playerId}_${weekNumber}`;
    return this.damageRecords.get(key) || null;
  }
  
  /**
   * 获取排行榜
   */
  static getDamageLeaderboard(weekNumber: number, limit: number = 10): WeeklyBossDamageRecord[] {
    const records = Array.from(this.damageRecords.values())
      .filter(r => r.weekNumber === weekNumber)
      .sort((a, b) => b.totalDamage - a.totalDamage);
    
    return records.slice(0, limit);
  }
  
  /**
   * 检查并记录首杀
   */
  static checkFirstKill(boss: WeeklyBoss): boolean {
    const key = boss.weekNumber.toString();
    if (this.firstKills.has(key)) {
      return false;
    }
    
    this.firstKills.add(key);
    return true;
  }
  
  /**
   * 是否已首杀
   */
  static hasFirstKill(weekNumber: number): boolean {
    return this.firstKills.has(weekNumber.toString());
  }
  
  /**
   * 计算奖励
   */
  static calculateRewards(
    boss: WeeklyBoss,
    playerId: string,
    totalDamage: number,
    rank: number
  ): WeeklyBossReward[] {
    const eligibleRewards: WeeklyBossReward[] = [];
    
    for (const reward of boss.rewards) {
      switch (reward.type) {
        case 'first_kill':
          if (this.checkFirstKill(boss)) {
            eligibleRewards.push(reward);
          }
          break;
          
        case 'daily_damage':
          if (totalDamage >= (reward.threshold || 0)) {
            eligibleRewards.push(reward);
          }
          break;
          
        case 'ranking':
          if (rank <= (reward.threshold || 0)) {
            eligibleRewards.push(reward);
          }
          break;
      }
    }
    
    return eligibleRewards;
  }
  
  /**
   * 创建战斗状态
   */
  static createBattleState(boss: WeeklyBoss): WeeklyBossBattleState {
    return {
      boss,
      bossCurrentHp: boss.hp,
      currentRound: 0,
      isOver: false,
      victory: false,
      totalDamageDealt: 0
    };
  }
  
  /**
   * 计算Boss伤害
   */
  static calculateBossDamage(
    boss: WeeklyBoss,
    playerDefense: number
  ): number {
    const baseDamage = boss.attack;
    const damageReduction = playerDefense / (playerDefense + 100);
    const finalDamage = Math.floor(baseDamage * (1 - damageReduction));
    return Math.max(1, finalDamage);
  }
  
  /**
   * 应用Boss特殊能力
   */
  static applySpecialAbility(
    state: WeeklyBossBattleState,
    playerHp: number,
    playerMaxHp: number
  ): { message: string; damageToPlayer: number; healToBoss: number } {
    const ability = state.boss.specialAbility;
    let message = '';
    let damageToPlayer = 0;
    let healToBoss = 0;
    
    // 检查触发条件
    let triggered = false;
    switch (ability.trigger) {
      case 'hp_threshold':
        const hpPercent = state.bossCurrentHp / state.boss.hp;
        triggered = hpPercent <= (ability.triggerValue || 0.5);
        break;
        
      case 'round_start':
        triggered = state.currentRound > 0;
        break;
        
      case 'turn_count':
        triggered = state.currentRound % (ability.cooldown || 5) === 0;
        break;
        
      default:
        triggered = false;
    }
    
    if (triggered) {
      switch (ability.effect.type) {
        case 'buff':
          message = `${state.boss.name} 发动 ${ability.name}！属性提升！`;
          break;
          
        case 'damage':
          damageToPlayer = Math.floor(playerMaxHp * (ability.effect.value || 0.1));
          message = `${state.boss.name} 发动 ${ability.name}！造成 ${damageToPlayer} 点伤害！`;
          break;
          
        case 'aoe_damage':
          damageToPlayer = Math.floor(playerMaxHp * (ability.effect.value || 0.1));
          message = `${state.boss.name} 发动 ${ability.name}！造成范围伤害 ${damageToPlayer}！`;
          break;
          
        case 'heal':
          healToBoss = Math.floor(state.boss.hp * (ability.effect.value || 0.02));
          message = `${state.boss.name} 发动 ${ability.name}！恢复 ${healToBoss} HP！`;
          break;
          
        case 'summon':
          message = `${state.boss.name} 发动 ${ability.name}！召唤了小怪！`;
          break;
      }
    }
    
    return { message, damageToPlayer, healToBoss };
  }
  
  /**
   * 获取Boss提示信息
   */
  static getBossTips(boss: WeeklyBoss): string[] {
    const tips: string[] = [];
    
    // 元素弱点提示
    const weaknesses = this.getElementalWeaknesses(boss.element);
    if (weaknesses.length > 0) {
      tips.push(`Boss属性为${this.getElementName(boss.element)}，建议使用${weaknesses.map(e => this.getElementName(e)).join('、')}属性攻击`);
    }
    
    // 特殊能力提示
    tips.push(`特殊能力：${boss.specialAbility.name} - ${boss.specialAbility.description}`);
    
    // 等级提示
    if (boss.level > 50) {
      tips.push('Boss等级较高，建议组队挑战');
    }
    
    return tips;
  }
  
  /**
   * 获取元素克制关系
   */
  private static getElementalWeaknesses(element: Element): Element[] {
    const weaknessMap: Record<Element, Element[]> = {
      fire: ['ice', 'earth'],
      ice: ['fire', 'thunder'],
      thunder: ['earth', 'wind'],
      earth: ['wind', 'ice'],
      wind: ['thunder', 'fire'],
      light: ['dark'],
      dark: ['light']
    };
    return weaknessMap[element] || [];
  }
  
  /**
   * 获取元素名称
   */
  private static getElementName(element: Element): string {
    const names: Record<Element, string> = {
      fire: '火', ice: '冰', thunder: '雷', earth: '土',
      wind: '风', light: '光', dark: '暗'
    };
    return names[element] || element;
  }
  
  /**
   * 清除所有数据（用于测试）
   */
  static clearAll(): void {
    this.currentBoss = null;
    this.damageRecords.clear();
    this.firstKills.clear();
  }
}

// ============================================
// 导出
// ============================================

export const WeeklyBossSystem = {
  Generator: WeeklyBossGenerator,
  Service: WeeklyBossService
};
