/**
 * 战斗事件系统
 * 
 * 职责：
 * 1. 处理战斗中的随机事件
 * 2. 管理事件链和组合事件
 * 3. 触发剧情事件
 * 4. 管理Buff/Debuff
 */

import {
  TriggeredEvent,
  BattleEventType,
  BuffEvent,
  ComboEvent,
  ExtendedBattleState,
  BATTLE_CONSTANTS,
  BattleAction,
  BattleActionResult,
  BattlePhase,
  BattleEventOptions,
  StatBuff,
  SpecialEffectType,
} from './types';
import { clamp, clampNonNegative } from '../utils/numberUtils';

// 随机工具
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

// ============================================
// 事件生成配置
// ============================================

/** 事件触发概率配置 */
const EVENT_TRIGGER_CONFIG = {
  // 暴击事件（暴击时触发）
  crit: {
    baseChance: 1.0, // 暴击必触发
    minDamageBonus: 1.5,
    maxDamageBonus: 2.0,
  },
  
  // 闪避事件
  dodge: {
    baseChance: 0.05, // 基础闪避率
    luckBonus: 0.002, // 每点幸运增加的概率
  },
  
  // 反击事件
  counter: {
    baseChance: 0.1,
    hpThreshold: 0.5, // HP低于50%时增加概率
    hpBonus: 0.1, // 低血量增加的概率
  },
  
  // 连击事件
  combo: {
    baseChance: 0.08,
    attackBonus: 0.001, // 每点攻击增加的概率
    maxCombo: 3,
  },
  
  // 护盾事件
  shield: {
    baseChance: 0.05,
    hpThreshold: 0.3, // HP低于30%时触发
  },
  
  // 吸血事件
  lifesteal: {
    baseChance: 0.1,
    percent: 15, // 回复伤害的15%
  },
  
  // 狂暴事件（低血量高伤害）
  berserk: {
    hpThreshold: 0.25,
    damageBonus: 1.5,
    defensePenalty: 0.8, // 防御降低20%
    duration: 3,
  },
};

/** Buff配置 */
const BUFF_CONFIG = {
  maxDuration: 5,
  maxStacks: 5,
};

// ============================================
// 事件触发检测
// ============================================

/**
 * 检测并生成战斗事件
 */
export function checkBattleEvents(
  state: ExtendedBattleState,
  options: BattleEventOptions = {}
): TriggeredEvent[] {
  const events: TriggeredEvent[] = [];
  
  // 1. 暴击事件（由伤害计算触发，这里不重复检测）
  
  // 2. 闪避事件
  if (options.checkDodge && Math.random() < calculateDodgeChance(state)) {
    events.push({
      type: 'dodge',
      message: '你灵巧地闪避了攻击！',
      data: {},
    });
  }
  
  // 3. 反击事件
  if (options.checkCounter && Math.random() < calculateCounterChance(state)) {
    events.push({
      type: 'counter',
      message: '抓住破绽，发动反击！',
      data: {
        damageMultiplier: 0.7, // 反击伤害70%
      },
    });
  }
  
  // 4. 连击事件
  if (options.checkCombo && Math.random() < calculateComboChance(state)) {
    events.push({
      type: 'combo',
      message: '攻击连贯流畅，触发连击！',
      data: {
        comboCount: Math.floor(Math.random() * 2) + 2, // 2-3连击
      },
    });
  }
  
  // 5. 低血量护盾事件
  const hpPercent = state.playerCurrentHp / state.playerMaxHp;
  if (hpPercent < EVENT_TRIGGER_CONFIG.shield.hpThreshold && 
      Math.random() < EVENT_TRIGGER_CONFIG.shield.baseChance) {
    events.push({
      type: 'shield',
      message: '危急时刻，护盾自动触发！',
      data: {
        amount: Math.floor(state.playerMaxHp * 0.15),
      },
    });
  }
  
  // 6. 狂暴事件（低血量）
  if (hpPercent < EVENT_TRIGGER_CONFIG.berserk.hpThreshold && 
      !state.playerBuffs.some(b => b.id === 'berserk')) {
    events.push({
      type: 'berserk',
      message: '生死边缘，你爆发出了惊人的力量！',
      data: {
        damageBonus: EVENT_TRIGGER_CONFIG.berserk.damageBonus,
        defensePenalty: EVENT_TRIGGER_CONFIG.berserk.defensePenalty,
        duration: EVENT_TRIGGER_CONFIG.berserk.duration,
      },
    });
  }
  
  // 7. 元素克制事件（如果伤害结果中有克制信息）
  if (options.restraint && options.restraint.restraintType !== 'neutral') {
    events.push({
      type: 'restraint',
      message: `元素克制！伤害提升！`,
      data: {
        multiplier: options.restraint.damageMultiplier,
      },
    });
  }
  
  return events;
}

/**
 * 计算闪避概率
 */
function calculateDodgeChance(state: ExtendedBattleState): number {
  let chance = EVENT_TRIGGER_CONFIG.dodge.baseChance;
  chance += state.playerLuck * EVENT_TRIGGER_CONFIG.dodge.luckBonus;
  
  // 检查是否有闪避Buff
  state.playerBuffs.forEach(buff => {
    if (buff.id === 'dodge') {
      chance += buff.percent || 0;
    }
  });
  
  return clamp(chance, 0, 0.3); // 最高30%闪避
}

/**
 * 计算反击概率
 */
function calculateCounterChance(state: ExtendedBattleState): number {
  let chance = EVENT_TRIGGER_CONFIG.counter.baseChance;
  
  const hpPercent = state.playerCurrentHp / state.playerMaxHp;
  if (hpPercent < EVENT_TRIGGER_CONFIG.counter.hpThreshold) {
    chance += EVENT_TRIGGER_CONFIG.counter.hpBonus;
  }
  
  return clamp(chance, 0, 0.25); // 最高25%
}

/**
 * 计算连击概率
 */
function calculateComboChance(state: ExtendedBattleState): number {
  let chance = EVENT_TRIGGER_CONFIG.combo.baseChance;
  chance += state.playerAttack * EVENT_TRIGGER_CONFIG.combo.attackBonus;
  
  return clamp(chance, 0, 0.2); // 最高20%
}

// ============================================
// 事件效果应用
// ============================================

/**
 * 应用事件效果
 */
export function applyEventEffect(
  event: TriggeredEvent,
  state: ExtendedBattleState
): void {
  switch (event.type) {
    case 'shield':
      // 添加护盾（简化实现，实际应该有护盾系统）
      const shieldAmount = event.data.amount || 0;
      state.playerCurrentHp = Math.min(state.playerMaxHp, state.playerCurrentHp + shieldAmount);
      break;
    
    case 'berserk':
      // 添加狂暴Buff
      state.playerBuffs.push({
        id: 'berserk',
        name: '狂暴',
        stat: 'all',
        value: 0,
        percent: event.data.damageBonus,
        remainingCount: event.data.duration,
        source: 'event',
        icon: '🔥',
      });
      // 降低防御
      state.playerDefense = Math.floor(state.playerDefense * event.data.defensePenalty);
      break;
    
    case 'combo':
      // 连击效果在伤害计算时处理
      break;
    
    case 'counter':
      // 反击效果在伤害计算时处理
      break;
  }
}

// ============================================
// Buff管理
// ============================================

/**
 * 添加Buff
 */
export function addBuff(
  state: ExtendedBattleState,
  buff: Omit<StatBuff, 'remainingCount'> & { duration?: number }
): void {
  const newBuff: StatBuff = {
    ...buff,
    remainingCount: buff.duration || BUFF_CONFIG.maxDuration,
  };
  
  // 检查是否已有相同Buff
  const existingIndex = state.playerBuffs.findIndex(b => b.id === buff.id);
  
  if (existingIndex >= 0) {
    // 刷新持续时间
    state.playerBuffs[existingIndex].remainingCount = newBuff.remainingCount;
    
    // 可叠加的Buff增加层数
    if (buff.stacks && state.playerBuffs[existingIndex].stacks) {
      state.playerBuffs[existingIndex].stacks = Math.min(
        (state.playerBuffs[existingIndex].stacks || 0) + (buff.stacks || 0),
        BUFF_CONFIG.maxStacks
      );
    }
  } else {
    state.playerBuffs.push(newBuff);
  }
}

/**
 * 移除Buff
 */
export function removeBuff(state: ExtendedBattleState, buffId: string): void {
  const index = state.playerBuffs.findIndex(b => b.id === buffId);
  if (index >= 0) {
    state.playerBuffs.splice(index, 1);
  }
}

/**
 * 更新Buff持续时间
 */
export function updateBuffDurations(state: ExtendedBattleState): StatBuff[] {
  const expired: StatBuff[] = [];
  const remaining: StatBuff[] = [];
  
  state.playerBuffs.forEach(buff => {
    const currentCount = buff.remainingCount ?? buff.duration ?? 0;
    buff.remainingCount = currentCount - 1;
    
    if (buff.remainingCount <= 0) {
      expired.push(buff);
    } else {
      remaining.push(buff);
    }
  });
  
  state.playerBuffs = remaining;
  return expired;
}

/**
 * 计算Buff属性加成
 */
export function calculateBuffBonuses(
  state: ExtendedBattleState
): {
  attackBonus: number;
  defenseBonus: number;
  speedBonus: number;
  critBonus: number;
} {
  let attackBonus = 0;
  let defenseBonus = 0;
  let speedBonus = 0;
  let critBonus = 0;
  
  state.playerBuffs.forEach(buff => {
    const value = buff.percent ? buff.percent : buff.value / 100;
    const stacks = buff.stacks || 1;
    
    switch (buff.stat) {
      case 'attack':
        attackBonus += value * stacks;
        break;
      case 'defense':
        defenseBonus += value * stacks;
        break;
      case 'speed':
        speedBonus += value * stacks;
        break;
      case 'crit':
        critBonus += value * stacks;
        break;
      case 'all':
        attackBonus += value * stacks * 0.5;
        defenseBonus += value * stacks * 0.5;
        break;
    }
  });
  
  return { attackBonus, defenseBonus, speedBonus, critBonus };
}

// ============================================
// 特殊事件处理
// ============================================

/**
 * 处理技能特殊效果
 */
export function processSkillSpecialEffect(
  effect: SpecialEffectType,
  state: ExtendedBattleState,
  damage: number
): TriggeredEvent[] {
  const events: TriggeredEvent[] = [];
  
  switch (effect.type) {
    case 'life_steal':
      const healAmount = Math.floor(damage * effect.percent / 100);
      state.playerCurrentHp = Math.min(
        state.playerMaxHp,
        state.playerCurrentHp + healAmount
      );
      events.push({
        type: 'lifesteal',
        message: `吸血效果恢复${healAmount}点生命！`,
        data: { amount: healAmount },
      });
      break;
    
    case 'ignore_defense':
      // 无视防御效果在伤害计算时处理
      events.push({
        type: 'ignore_defense',
        message: `无视${effect.percent}%防御！`,
        data: { percent: effect.percent },
      });
      break;
    
    case 'multi_hit':
      events.push({
        type: 'multi_hit',
        message: `${effect.count}连击！`,
        data: { count: effect.count },
      });
      break;
    
    case 'stun':
      state.enemyStunned = true;
      state.enemyStunRounds = effect.rounds;
      events.push({
        type: 'stun',
        message: `敌人被眩晕${effect.rounds}回合！`,
        data: { rounds: effect.rounds },
      });
      break;
    
    case 'shield':
      state.playerCurrentHp = Math.min(
        state.playerMaxHp,
        state.playerCurrentHp + effect.amount
      );
      events.push({
        type: 'shield',
        message: `获得${effect.amount}点护盾！`,
        data: { amount: effect.amount },
      });
      break;
  }
  
  return events;
}

// ============================================
// 随机事件生成
// ============================================

/**
 * 生成随机战斗事件
 * 
 * 用于增加战斗趣味性
 */
export function generateRandomBattleEvent(
  state: ExtendedBattleState
): TriggeredEvent | null {
  // 5%概率触发随机事件
  if (Math.random() > 0.05) {
    return null;
  }
  
  const randomEvents: Array<{ weight: number; event: TriggeredEvent }> = [
    {
      weight: 3,
      event: {
        type: 'random',
        message: '一道神秘光芒闪过，你感觉力量涌动！',
        data: { mpRecovery: Math.floor(state.playerMaxMp * 0.1) },
      },
    },
    {
      weight: 2,
      event: {
        type: 'random',
        message: '战场上的灵气聚集，你恢复了些许法力！',
        data: { mpRecovery: Math.floor(state.playerMaxMp * 0.05) },
      },
    },
    {
      weight: 2,
      event: {
        type: 'random',
        message: '你的攻击激起了敌人的怒火！',
        data: { enemyEnraged: true },
      },
    },
    {
      weight: 1,
      event: {
        type: 'random',
        message: '敌人露出了破绽！',
        data: { enemyVulnerable: true, duration: 1 },
      },
    },
    {
      weight: 1,
      event: {
        type: 'random',
        message: '天地异象，双方都受到了影响！',
        data: { everyoneWeakened: true },
      },
    },
  ];
  
  const totalWeight = randomEvents.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const { weight, event } of randomEvents) {
    random -= weight;
    if (random <= 0) {
      return event;
    }
  }
  
  return null;
}

/**
 * 应用随机事件效果
 */
export function applyRandomEventEffect(
  event: TriggeredEvent,
  state: ExtendedBattleState
): void {
  if (event.data.mpRecovery) {
    state.playerCurrentMp = Math.min(
      state.playerMaxMp,
      state.playerCurrentMp + event.data.mpRecovery
    );
  }
  
  if (event.data.enemyEnraged) {
    state.enemyAttack = Math.floor(state.enemyAttack * 1.2);
  }
  
  if (event.data.enemyVulnerable) {
    state.enemyDefense = Math.floor(state.enemyDefense * 0.8);
  }
  
  if (event.data.everyoneWeakened) {
    state.playerAttack = Math.floor(state.playerAttack * 0.9);
    state.enemyAttack = Math.floor(state.enemyAttack * 0.9);
  }
}

// ============================================
// 事件消息格式化
// ============================================

/**
 * 格式化事件消息
 */
export function formatEventMessage(event: TriggeredEvent): string {
  const icons: Record<string, string> = {
    dodge: '💨',
    counter: '⚔️',
    combo: '🔥',
    shield: '🛡️',
    berserk: '😈',
    lifesteal: '❤️',
    stun: '💫',
    crit: '💥',
    restraint: '⚡',
    random: '✨',
  };
  
  const icon = icons[event.type] || '📌';
  return `${icon} ${event.message}`;
}

/**
 * 批量格式化事件消息
 */
export function formatEventMessages(events: TriggeredEvent[]): string[] {
  return events.map(formatEventMessage);
}

// ============================================
// 事件历史记录
// ============================================

/**
 * 记录战斗事件
 */
export function recordBattleEvent(
  state: ExtendedBattleState,
  event: TriggeredEvent,
  round: number
): void {
  state.eventHistory.push({
    ...event,
    round,
    timestamp: Date.now(),
  });
}

/**
 * 获取最近的事件
 */
export function getRecentEvents(
  state: ExtendedBattleState,
  count: number = 5
): TriggeredEvent[] {
  return state.eventHistory.slice(-count);
}

/**
 * 按类型筛选事件
 */
export function filterEventsByType(
  state: ExtendedBattleState,
  type: BattleEventType
): TriggeredEvent[] {
  return state.eventHistory.filter(e => e.type === type);
}
