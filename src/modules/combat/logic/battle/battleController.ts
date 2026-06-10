/**
 * 战斗流程控制器
 * 
 * 职责：
 * 1. 管理战斗状态生命周期
 * 2. 协调技能、决策、事件三大系统
 * 3. 提供统一的战斗接口
 * 4. 处理战斗结算
 * 5. 支持多敌人战斗
 */

import { 
  getAvailableDecisions, 
  executePlayerAction, 
  executeEnemyAction, 
  executeTurn,
  executeAutoTurn,
} from './decisionSystem';
import {
  checkBattleEvents,
  applyEventEffect,
  updateBuffDurations,
  calculateBuffBonuses,
  generateRandomBattleEvent,
  applyRandomEventEffect,
  recordBattleEvent,
  formatEventMessages,
} from './eventSystem';
import { BattleSkill, generateSkillsFromEquippedTechniques, generateCombatSkillsFromEquippedWeapons } from './skillSystem';
import {
  ExtendedBattleState,
  BattleAction,
  BattleActionResult,
  TurnResult,
  BattleStatistics,
  BattlePhase,
  BattleConfig,
  BATTLE_CONSTANTS,
  BattleActionRecord,
  DecisionOption,
  TriggeredEvent,
  PlayerData,
} from './types';
import { calculateDamage, COMBAT_CONFIG } from '@/modules/progression/logic/balanceConfig';
import { EnemyGroup, Enemy } from '@/modules/combat/logic/enemy/types';
import { getDefenseAttributes } from '@/modules/combat/logic/restraintSystem';
import { 
  Technique, 
  Equipment, 
  InventoryItem, 
  ItemRarity,
  EnemyTier,
  Protagonist,
} from '@/core/types';
import {
  BattleEnemy,
  TurnOrderEntry,
  createBattleEnemy,
  getAliveEnemies,
  getAliveEnemyCount,
  areAllEnemiesDefeated,
  calculateTurnOrder,
  getNextActor,
  resetTurnOrder,
} from './enemyState';
import { applyDamage, applyHeal, clamp, clampNonNegative } from '@/shared/utils/numberUtils';

import type { BattleSkillType } from './types';

// ============================================
// 战斗状态创建
// ============================================

/**
 * 创建战斗状态
 * 
 * 整合所有子系统，初始化战斗状态
 * 
 * 重要：必须使用 player 传入的实际属性值（maxHp, maxMp, attack, defense），
 * 而不是重新计算。这样可以确保战斗中显示的血量/法力与玩家面板一致。
 */
export function createBattleState(
  player: PlayerData,
  enemy: Enemy,
  config: Partial<BattleConfig> = {}
): ExtendedBattleState {
  // 优先使用玩家传入的属性值，如果没有则使用备选计算
  // 注意：convertToPlayerData 已传递正确的属性值
  const playerMaxHp = player.maxHp ?? Math.floor(100 + player.attributes.体质 * 10 + player.level * 5);
  const playerMaxMp = player.maxMp ?? Math.floor(50 + player.attributes.灵根 * 5 + player.level * 3);
  const playerAttack = player.attack ?? Math.floor(10 + player.attributes.体质 * 2 + player.level);
  const playerDefense = player.defense ?? Math.floor(5 + player.attributes.意志 + player.level * 0.5);
  
  // 从已装备的功法生成法技（使用装备的技能槽位）
  const techniques = player.techniques?.filter((t): t is Technique => t !== null) || [];
  const techniqueSkills = generateSkillsFromEquippedTechniques(techniques);
  
  // 从已装备的武器生成斗技（使用装备的技巧槽位）
  const equippedWeapons: (Equipment | null)[] = [
    player.equippedMelee ?? null,
    player.equippedRanged ?? null,
  ];
  const combatSkills = generateCombatSkillsFromEquippedWeapons(equippedWeapons);
  
  // 合并所有技能
  const skills = [...techniqueSkills, ...combatSkills];
  
  // 注意：不再把基础攻击/防御加入 availableSkills
  // 基础攻击和防御是固定选项，在 decisionSystem 中单独处理
  
  // 获取可用物品
  const availableItems = (player.inventory || [])
    .filter(item => 
      item.definition.effects?.some(e => 
        ['restore_hp', 'restore_mp', 'stat_boost'].includes(e.type)
      )
    );
  
  // 敌人属性 - 使用 enemy/types.ts 中的 Enemy 类型
  const enemyAttributes = {
    element: enemy.preferredElement || null,
    weaponCategory: null as any,
    defenseElement: null as any,
    defenseWeaponCategory: null as any,
  };
  
  // 构建状态
  const state: ExtendedBattleState = {
    // 玩家基础属性 - 使用传入的实际值
    playerLevel: player.level,
    playerCurrentHp: player.health ?? playerMaxHp,
    playerMaxHp: playerMaxHp,
    playerCurrentMp: player.mana ?? playerMaxMp,
    playerMaxMp: playerMaxMp,
    playerAttack: playerAttack,
    playerDefense: playerDefense,
    playerLuck: player.attributes.幸运,
    
    // 敌人基础属性
    enemyName: enemy.name,
    enemyLevel: enemy.level,
    enemyCurrentHp: enemy.currentHp,
    enemyMaxHp: enemy.maxHp,
    enemyAttack: enemy.stats.attack,
    enemyDefense: enemy.stats.defense,
    enemyTier: enemy.tier,
    enemyAttributes,
    // 敌人技能系统（新增）
    enemySkills: enemy.skills || [],
    enemySkillCooldowns: enemy.skillCooldowns ? new Map(Object.entries(enemy.skillCooldowns)) : new Map<string, number>(),
    enemyCurrentMp: enemy.currentMp ?? enemy.maxMp ?? 0,
    enemyMaxMp: enemy.maxMp ?? 0,
    
    // 战斗配置
    battleConfig: {
      maxRounds: 50,
      battleType: config.battleType || 'normal',
      canFlee: config.canFlee !== false && enemy.tier !== 'boss',
      autoPlay: config.autoPlay || false,
      difficulty: 'normal',
      enableEvents: true,
    },
    
    // 技能系统
    availableSkills: skills,
    skillCooldowns: new Map<string, number>(),
    
    // 决策系统
    availableItems,
    itemCooldowns: new Map<string, number>(),
    
    // 事件系统
    playerBuffs: [],
    playerIsDefending: false,
    enemyStunned: false,
    enemyStunRounds: 0,
    enemyBuffs: [],
    activeEvents: [],
    
    // 战斗状态
    currentRound: 1,
    phase: 'preparing',
    isOver: false,
    victory: false,
    
    // 历史记录
    actionHistory: [],
    eventHistory: [],
    
    // 必要字段
    logs: [],
    enemyRealm: '',
    enemyCombatPower: 0,
    playerCombatPower: 0,
    
    // 多敌人系统 - 从单个敌人创建
    enemies: [createBattleEnemyFromEnemy(enemy)],
    turnOrder: [],
    currentTurnIndex: 0,
    selectedEnemyIndex: 0,
  };
  
  // 回复玩家状态
  state.playerCurrentHp = Math.min(state.playerCurrentHp, state.playerMaxHp);
  state.playerCurrentMp = Math.min(state.playerCurrentMp, state.playerMaxMp);
  
  // 初始化行动顺序
  state.turnOrder = calculateTurnOrder(10 + player.level * 0.5, state.enemies);
  
  return state;
}

/**
 * 从 Enemy 创建 BattleEnemy
 */
function createBattleEnemyFromEnemy(enemy: Enemy): BattleEnemy {
  const attributes = {
    element: enemy.preferredElement || null,
    weaponCategory: null as any,
    defenseElement: null as any,
    defenseWeaponCategory: null as any,
  };
  
  return createBattleEnemy(
    enemy.id,
    enemy.name,
    enemy.level,
    enemy.tier,
    enemy.maxHp,
    enemy.stats.attack,
    enemy.stats.defense,
    enemy.skills || [],
    attributes,
    enemy.maxMp || 0
  );
}

/**
 * 创建多敌人战斗状态
 * 
 * 新系统：支持敌人组
 */
export function createBattleStateFromGroup(
  player: PlayerData,
  enemyGroup: EnemyGroup,
  config: Partial<BattleConfig> = {}
): ExtendedBattleState {
  // 优先使用玩家传入的属性值
  const playerMaxHp = player.maxHp ?? Math.floor(100 + player.attributes.体质 * 10 + player.level * 5);
  const playerMaxMp = player.maxMp ?? Math.floor(50 + player.attributes.灵根 * 5 + player.level * 3);
  const playerAttack = player.attack ?? Math.floor(10 + player.attributes.体质 * 2 + player.level);
  const playerDefense = player.defense ?? Math.floor(5 + player.attributes.意志 + player.level * 0.5);
  
  // 从已装备的功法生成法技
  const techniques = player.techniques?.filter((t): t is Technique => t !== null) || [];
  const techniqueSkills = generateSkillsFromEquippedTechniques(techniques);
  
  // 从已装备的武器生成斗技
  const equippedWeapons: (Equipment | null)[] = [
    player.equippedMelee ?? null,
    player.equippedRanged ?? null,
  ];
  const combatSkills = generateCombatSkillsFromEquippedWeapons(equippedWeapons);
  
  // 合并所有技能
  const skills = [...techniqueSkills, ...combatSkills];
  
  // 获取可用物品
  const availableItems = (player.inventory || [])
    .filter(item => 
      item.definition.effects?.some(e => 
        ['restore_hp', 'restore_mp', 'stat_boost'].includes(e.type)
      )
    );
  
  // 转换敌人组为战斗敌人列表
  const battleEnemies: BattleEnemy[] = enemyGroup.enemies.map(enemy => 
    createBattleEnemyFromEnemy(enemy)
  );
  
  // 获取第一个敌人的属性（用于向后兼容）
  const firstEnemy = battleEnemies[0];
  
  // 构建状态
  const state: ExtendedBattleState = {
    // 玩家基础属性
    playerLevel: player.level,
    playerCurrentHp: player.health ?? playerMaxHp,
    playerMaxHp: playerMaxHp,
    playerCurrentMp: player.mana ?? playerMaxMp,
    playerMaxMp: playerMaxMp,
    playerAttack: playerAttack,
    playerDefense: playerDefense,
    playerLuck: player.attributes.幸运,
    
    // 敌人基础属性（向后兼容，使用第一个敌人）
    enemyName: firstEnemy?.name || '未知敌人',
    enemyLevel: firstEnemy?.level || 1,
    enemyCurrentHp: firstEnemy?.currentHp || 0,
    enemyMaxHp: firstEnemy?.maxHp || 0,
    enemyAttack: firstEnemy?.attack || 0,
    enemyDefense: firstEnemy?.defense || 0,
    enemyTier: firstEnemy?.tier || 'normal',
    enemyAttributes: firstEnemy?.attributes || {
      element: null,
      weaponCategory: null,
      defenseElement: null,
      defenseWeaponCategory: null,
    },
    
    // 战斗配置
    battleConfig: {
      maxRounds: 50,
      battleType: config.battleType || 'normal',
      canFlee: config.canFlee !== false,
      autoPlay: config.autoPlay || false,
      difficulty: 'normal',
      enableEvents: true,
    },
    
    // 技能系统
    availableSkills: skills,
    skillCooldowns: new Map<string, number>(),
    
    // 决策系统
    availableItems,
    itemCooldowns: new Map<string, number>(),
    
    // 事件系统
    playerBuffs: [],
    playerIsDefending: false,
    enemyBuffs: [],
    activeEvents: [],
    
    // 战斗状态
    currentRound: 1,
    phase: 'preparing',
    isOver: false,
    victory: false,
    
    // 历史记录
    actionHistory: [],
    eventHistory: [],
    
    // 必要字段
    logs: [],
    enemyRealm: '',
    enemyCombatPower: 0,
    playerCombatPower: 0,
    
    // 多敌人系统
    enemies: battleEnemies,
    turnOrder: calculateTurnOrder(10 + player.level * 0.5, battleEnemies),
    currentTurnIndex: 0,
    selectedEnemyIndex: 0,
  };
  
  // 回复玩家状态
  state.playerCurrentHp = Math.min(state.playerCurrentHp, state.playerMaxHp);
  state.playerCurrentMp = Math.min(state.playerCurrentMp, state.playerMaxMp);
  
  return state;
}

/**
 * 创建战斗统计
 */
export function createBattleStatistics(): BattleStatistics {
  return {
    totalRounds: 0,
    playerTotalDamage: 0,
    enemyTotalDamage: 0,
    critCount: 0,
    dodgeCount: 0,
    skillUseCount: 0,
    itemUseCount: 0,
    maxDamageDealt: 0,
    maxDamageReceived: 0,
    turnsPlayed: 0,
    defendCount: 0,
  };
}

// ============================================
// 战斗流程管理
// ============================================

/**
 * 开始战斗
 */
export function startBattle(state: ExtendedBattleState): void {
  state.phase = 'player_turn';
  state.currentRound = 1;
}

/**
 * 获取当前可用决策
 */
export function getCurrentDecisions(state: ExtendedBattleState): DecisionOption[] {
  if (state.phase !== 'player_turn' || state.isOver) {
    return [];
  }
  
  return getAvailableDecisions({ state, round: state.currentRound });
}

/**
 * 执行玩家回合
 */
export function executePlayerTurn(
  action: BattleAction,
  state: ExtendedBattleState,
  statistics: BattleStatistics
): TurnResult {
  if (state.phase !== 'player_turn') {
    return {
      events: [],
      battleOver: false,
      playerResult: {
        action,
        success: false,
        message: '当前不是玩家回合',
        failReason: 'invalid_phase',
      },
    };
  }
  
  // 更新统计
  statistics.turnsPlayed = (statistics.turnsPlayed || 0) + 1;
  
  // 执行回合
  const result = executeTurn(action, state, statistics);
  
  // 检查随机事件
  const randomEvent = generateRandomBattleEvent(state);
  if (randomEvent) {
    result.events.push(randomEvent);
    applyRandomEventEffect(randomEvent, state);
    recordBattleEvent(state, randomEvent, state.currentRound);
  }
  
  // 更新Buff
  const expiredBuffs = updateBuffDurations(state);
  if (expiredBuffs.length > 0) {
    result.events.push({
      type: 'buff_expire',
      message: `${expiredBuffs.map(b => b.name).join('、')}效果结束`,
      data: { buffs: expiredBuffs },
    });
  }
  
  // 进入下一回合
  if (!result.battleOver) {
    state.currentRound++;
    state.phase = 'player_turn';
  }
  
  return result;
}

/**
 * 执行自动战斗回合
 */
export function executeAutoPlayerTurn(
  state: ExtendedBattleState,
  statistics: BattleStatistics
): TurnResult {
  return executeAutoTurn(state, statistics);
}

/**
 * 快速战斗（多回合自动进行）
 */
export function* quickBattle(
  state: ExtendedBattleState,
  statistics: BattleStatistics,
  maxTurns: number = 50
): Generator<TurnResult, void, unknown> {
  let turns = 0;
  
  while (!state.isOver && turns < maxTurns) {
    const result = executeAutoTurn(state, statistics);
    yield result;
    turns++;
  }
  
  if (!state.isOver) {
    state.isOver = true;
    state.victory = false;
    state.phase = 'battle_end';
  }
}

// ============================================
// 战斗结算
// ============================================

interface BattleReward {
  experience: number;
  gold: number;
  items: Array<{ id: string; quantity: number }>;
  fragments?: Array<{ id: string; quantity: number }>;
  score?: number;
}

interface BattleSettlement {
  victory: boolean;
  playerRemainingHp: number;
  playerRemainingMp: number;
  enemyDefeated: Enemy;
  rounds: number;
  statistics: BattleStatistics;
  rewards?: BattleReward;
  deathPenalty?: {
    expLoss: number;
    goldLoss: number;
  };
}

/**
 * 结算战斗
 *
 * @param rng - 可选随机数生成器，默认使用 Math.random（向后兼容）
 */
export function settleBattle(
  state: ExtendedBattleState,
  statistics: BattleStatistics,
  enemy: Enemy,
  rng: () => number = Math.random
): BattleSettlement {
  const settlement: BattleSettlement = {
    victory: state.victory ?? false,
    playerRemainingHp: state.playerCurrentHp,
    playerRemainingMp: state.playerCurrentMp,
    enemyDefeated: enemy,
    rounds: state.currentRound,
    statistics,
  };
  
  if (state.victory) {
    settlement.rewards = calculateRewards(state, enemy, statistics, rng);
  } else {
    settlement.deathPenalty = calculateDeathPenalty(state);
  }
  
  return settlement;
}

/**
 * 计算战斗奖励
 */
function calculateRewards(
  state: ExtendedBattleState,
  enemy: Enemy,
  statistics: BattleStatistics,
  rng: () => number = Math.random
): BattleReward {
  const rewards: BattleReward = {
    experience: enemy.expReward || 0,
    gold: enemy.goldReward || 0,
    items: [],
  };
  
  // 敌人等级加成
  const levelDiff = state.playerLevel - enemy.level;
  const levelMultiplier = Math.max(0.5, 1 - levelDiff * 0.1);
  
  rewards.experience = Math.floor(rewards.experience * levelMultiplier);
  rewards.gold = Math.floor(rewards.gold * levelMultiplier);
  
  // Boss额外奖励
  if (enemy.tier === 'boss') {
    rewards.experience = Math.floor(rewards.experience * 2);
    rewards.gold = Math.floor(rewards.gold * 2);
    rewards.score = Math.floor(statistics.playerTotalDamage * 1.5 + (statistics.critCount * 100));
  }
  
  // 效率奖励（快速结束）
  const avgDamage = statistics.turnsPlayed && statistics.turnsPlayed > 0 
    ? statistics.playerTotalDamage / statistics.turnsPlayed 
    : statistics.playerTotalDamage;
  const expectedRounds = Math.ceil(enemy.maxHp / avgDamage);
  if (state.currentRound < expectedRounds * 0.8) {
    rewards.experience = Math.floor(rewards.experience * 1.1);
    rewards.gold = Math.floor(rewards.gold * 1.1);
  }
  
  // 掉落物品
  if (enemy.drops && enemy.drops.length > 0) {
    enemy.drops.forEach(drop => {
      if (rng() < drop.chance) {
        const quantity = drop.minQuantity && drop.maxQuantity
          ? Math.floor(rng() * (drop.maxQuantity - drop.minQuantity + 1)) + drop.minQuantity
          : 1;
        rewards.items.push({ id: drop.itemId, quantity });
      }
    });
  }
  
  // 碎片掉落（Boss和精英）
  if (enemy.tier === 'boss' || enemy.tier === 'elite') {
    rewards.fragments = [];
    // TODO: 根据敌人类型掉落碎片
  }
  
  return rewards;
}

/**
 * 计算死亡惩罚
 */
function calculateDeathPenalty(state: ExtendedBattleState): { expLoss: number; goldLoss: number } {
  // 死亡损失10%经验和5%金钱
  const expLoss = Math.floor(state.playerLevel * 100 * 0.1);
  const goldLoss = Math.floor(state.playerLevel * 50 * 0.05);
  
  return { expLoss, goldLoss };
}

// ============================================
// 战斗状态查询
// ============================================

/**
 * 获取战斗状态摘要
 */
export function getBattleStatusSummary(state: ExtendedBattleState): {
  phase: BattlePhase;
  round: number;
  playerHp: { current: number; max: number; percent: number };
  playerMp: { current: number; max: number; percent: number };
  enemyHp: { current: number; max: number; percent: number };
  buffs: number;
  isOver: boolean;
  victory: boolean | null;
} {
  return {
    phase: state.phase,
    round: state.currentRound,
    playerHp: {
      current: state.playerCurrentHp,
      max: state.playerMaxHp,
      percent: Math.round(state.playerCurrentHp / state.playerMaxHp * 100),
    },
    playerMp: {
      current: state.playerCurrentMp,
      max: state.playerMaxMp,
      percent: Math.round(state.playerCurrentMp / state.playerMaxMp * 100),
    },
    enemyHp: {
      current: state.enemyCurrentHp,
      max: state.enemyMaxHp,
      percent: Math.round(state.enemyCurrentHp / state.enemyMaxHp * 100),
    },
    buffs: state.playerBuffs.length,
    isOver: state.isOver,
    victory: state.isOver ? (state.victory ?? false) : null,
  };
}

/**
 * 获取技能状态
 */
export function getSkillStatus(
  skillId: string,
  state: ExtendedBattleState
): {
  cooldown: number;
  usable: boolean;
  reason?: string;
} {
  const cooldown = state.skillCooldowns.get(skillId) || 0;
  const skill = state.availableSkills.find(s => s.id === skillId);
  
  if (!skill) {
    return { cooldown, usable: false, reason: '技能不存在' };
  }
  
  if (cooldown > 0) {
    return { cooldown, usable: false, reason: `冷却中(${cooldown}回合)` };
  }
  
  if (state.playerCurrentMp < skill.mpCost) {
    return { cooldown, usable: false, reason: '法力不足' };
  }
  
  return { cooldown, usable: true };
}

/**
 * 检查是否需要紧急治疗
 */
export function isEmergencyHealNeeded(state: ExtendedBattleState): boolean {
  const hpPercent = state.playerCurrentHp / state.playerMaxHp;
  return hpPercent < BATTLE_CONSTANTS.LOW_HP_THRESHOLD;
}

/**
 * 获取推荐行动
 */
export function getRecommendedAction(state: ExtendedBattleState): BattleAction {
  const decisions = getAvailableDecisions({ state, round: state.currentRound });
  const recommended = decisions.filter(d => d.recommended && !d.disabled);
  
  if (recommended.length > 0) {
    return recommended[0].action;
  }
  
  // 默认普通攻击
  return { type: 'normal_attack' };
}

// ============================================
// 战斗序列化
// ============================================

/**
 * 序列化战斗状态（用于存档）
 */
export function serializeBattleState(state: ExtendedBattleState): string {
  const serialized = {
    ...state,
    skillCooldowns: Array.from(state.skillCooldowns.entries()),
    itemCooldowns: Array.from(state.itemCooldowns.entries()),
    actionHistory: state.actionHistory.slice(-20), // 只保留最近20条
    eventHistory: state.eventHistory.slice(-20),
  };
  
  return JSON.stringify(serialized);
}

/**
 * 反序列化战斗状态
 */
export function deserializeBattleState(json: string): ExtendedBattleState {
  const parsed = JSON.parse(json);
  
  return {
    ...parsed,
    skillCooldowns: new Map(parsed.skillCooldowns),
    itemCooldowns: new Map(parsed.itemCooldowns || []),
  };
}

// ============================================
// 导出所有子系统
// ============================================

export type { BattleSkill } from './skillSystem';
export * from './skillSystem';
export * from './decisionSystem';
export * from './eventSystem';
