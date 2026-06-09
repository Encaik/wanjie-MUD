/**
 * 手动回合制战斗状态机
 *
 * 纯函数实现：接收当前战斗状态和玩家动作，返回新的战斗状态。
 * 战斗流程：玩家行动 → 判定结果 → 敌人行动 → 回合结束 → 检查胜负
 */

import type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
import { calculateElementMultiplier, calculateWeaponMultiplier } from '@/modules/combat/logic/restraintSystem';
import type {
  BattleAction,
  ManualBattleState,
  TurnResult,
  ManualBattleResult,
  AIDecision,
  AutoBattleStrategy,
} from './types';

// ============================================
// 配置常量
// ============================================

/** 防御伤害减免比例 */
const DEFEND_DAMAGE_REDUCTION = 0.4;

/** 防御时真气恢复比例（最大真气的百分比） */
const DEFEND_MP_RESTORE_RATE = 0.05;

/** 单次伤害上限（目标最大HP的比例） */
const MAX_DAMAGE_CAP_RATE = 0.6;

/** 基础暴击率 */
const BASE_CRIT_RATE = 0.05;

/** 暴击伤害倍率 */
const CRIT_DAMAGE_MULTIPLIER = 1.5;

/** 基础闪避率 */
const BASE_DODGE_RATE = 0.03;

/** 伤害随机浮动范围 */
const DAMAGE_VARIANCE = 0.15;

/** 领域展开全属性加成比例 */
const DOMAIN_BONUS_RATE = 0.2;

// ============================================
// 工具函数
// ============================================

/** 从种子生成伪随机数 [0, 1) */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** 在范围内随机整数 */
function randomInt(min: number, max: number, seed: number): number {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

/** 取两个种子，生成下一个种子 */
function nextSeed(seed: number, step: number): number {
  return seed + step * 7919;
}

/** 限制伤害不超过目标最大HP的比例 */
function clampDamage(damage: number, targetMaxHp: number): number {
  return Math.min(Math.max(0, Math.floor(damage)), Math.floor(targetMaxHp * MAX_DAMAGE_CAP_RATE));
}

// ============================================
// 核心战斗函数
// ============================================

/**
 * 执行单个战斗动作并推进一个回合
 *
 * 处理流程：
 * 1. 验证动作合法性
 * 2. 执行玩家动作（攻击/防御/逃跑）
 * 3. 执行敌人动作（攻击）
 * 4. 更新回合状态
 * 5. 检查战斗结束条件
 *
 * @param state - 当前战斗状态
 * @param action - 玩家选择的动作
 * @param seed - 随机种子（确保纯函数特性）
 * @returns 更新后的战斗状态
 */
export function executeBattleAction(
  state: ManualBattleState,
  action: BattleAction,
  seed: number
): ManualBattleState {
  const newState = { ...state, turnHistory: [...state.turnHistory] };
  let s = seed;

  // 领域剩余回合递减
  if (newState.domainActive && newState.domainRemainingRounds !== undefined) {
    newState.domainRemainingRounds = newState.domainRemainingRounds - 1;
    if (newState.domainRemainingRounds <= 0) {
      newState.domainActive = false;
      newState.domainRemainingRounds = 0;
    }
  }

  // ---- 玩家行动 ----
  if (action.type === 'flee') {
    // 逃跑判定
    const fleeResult = processFlee(newState, s);
    s = nextSeed(s, 10);
    if (fleeResult.success) {
      newState.isOver = true;
      newState.fled = true;
      newState.turnHistory.push(fleeResult.turnResult);
      return newState;
    }
    // 逃跑失败：本回合不行动，敌人获得一次攻击机会
    newState.turnHistory.push(fleeResult.turnResult);
  } else if (action.type === 'defend') {
    // 防御指令
    const defendResult = processDefend(newState, s);
    s = nextSeed(s, 10);
    newState.playerCurrentMp = Math.min(
      newState.playerMaxMp,
      newState.playerCurrentMp + defendResult.mpRestored
    );
    newState.turnHistory.push(defendResult.turnResult);
  } else if (action.type === 'attack' || action.type === 'use_skill') {
    // 攻击指令
    const attackResult = processAttack(newState, action, s, 'player');
    s = nextSeed(s, 10);
    newState.enemyCurrentHp = Math.max(0, newState.enemyCurrentHp - attackResult.damage);
    newState.playerCurrentMp = Math.max(0, newState.playerCurrentMp - attackResult.mpCost);
    newState.turnHistory.push(attackResult.turnResult);
  }

  // 检查敌人是否死亡
  if (newState.enemyCurrentHp <= 0) {
    newState.isOver = true;
    newState.victory = true;
    return newState;
  }

  // ---- 敌人行动 ----
  // 检查玩家本回合是否防御（防御减免伤害）
  const playerDefended = action.type === 'defend';
  const enemyResult = processAttack(newState, { type: 'attack', source: 'ai' }, s, 'enemy');
  s = nextSeed(s, 10);
  const finalEnemyDamage = playerDefended
    ? applyDefendReduction(enemyResult.damage, true)
    : enemyResult.damage;
  const enemyTurnResult: TurnResult = {
    ...enemyResult.turnResult,
    damageDealt: finalEnemyDamage,
    description: playerDefended
      ? `${enemyResult.turnResult.description}（防御减免 ${Math.floor(DEFEND_DAMAGE_REDUCTION * 100)}%）`
      : enemyResult.turnResult.description,
  };
  newState.playerCurrentHp = Math.max(0, newState.playerCurrentHp - finalEnemyDamage);
  newState.turnHistory.push(enemyTurnResult);

  // 检查玩家是否死亡
  if (newState.playerCurrentHp <= 0) {
    newState.isOver = true;
    newState.victory = false;
    return newState;
  }

  // 回合数递增
  newState.currentRound = newState.currentRound + 1;

  // 检查是否达到最大回合数
  if (newState.currentRound >= newState.maxRounds) {
    newState.isOver = true;
    // 比较剩余HP比例决定胜负
    const playerHpPercent = newState.playerCurrentHp / newState.playerMaxHp;
    const enemyHpPercent = newState.enemyCurrentHp / newState.enemyMaxHp;
    newState.victory = playerHpPercent >= enemyHpPercent;
  }

  return newState;
}

// ============================================
// 攻击处理
// ============================================

interface AttackProcessResult {
  damage: number;
  mpCost: number;
  turnResult: TurnResult;
}

function processAttack(
  state: ManualBattleState,
  action: BattleAction,
  seed: number,
  actor: 'player' | 'enemy'
): AttackProcessResult {
  const isPlayer = actor === 'player';
  const attackerAtk = isPlayer ? state.playerAttack : state.enemyAttack;
  const attackerElement = isPlayer ? state.playerElement : state.enemyElement;
  const attackerWeapon = isPlayer ? state.playerWeapon : state.enemyWeapon;
  const defenderDef = isPlayer ? state.enemyDefense : state.playerDefense;
  const defenderElement = isPlayer ? state.enemyElement : state.playerElement;
  const defenderWeapon = isPlayer ? state.enemyWeapon : state.playerWeapon;
  const defenderMaxHp = isPlayer ? state.enemyMaxHp : state.playerMaxHp;
  const mpCost = isPlayer ? calculateMpCost(state, action) : 0;

  // 领域加成（仅玩家）
  const domainBonus = state.domainActive ? 1 + DOMAIN_BONUS_RATE : 1;

  // 基础攻击力
  const baseAtk = attackerAtk * domainBonus;

  // 防御减伤：damage * (100 / (100 + defense))
  const rawDamage = baseAtk * (100 / (100 + defenderDef));

  // 随机浮动
  const variance = (seededRandom(seed) * 2 - 1) * DAMAGE_VARIANCE;
  let damage = rawDamage * (1 + variance);

  // 元素克制修正
  const elementalMult = calculateElementMultiplier(attackerElement, defenderElement);
  // 武器克制修正
  const weaponMult = calculateWeaponMultiplier(attackerWeapon, defenderWeapon);
  damage = damage * elementalMult * weaponMult;

  // 暴击判定
  const critRate = isPlayer ? BASE_CRIT_RATE : BASE_CRIT_RATE;
  const isCrit = seededRandom(nextSeed(seed, 1)) < critRate;
  if (isCrit) {
    damage = damage * CRIT_DAMAGE_MULTIPLIER;
  }

  // 伤害上限
  damage = clampDamage(damage, defenderMaxHp);

  // 生成描述
  const elementText = elementalMult > 1.0 ? '【元素克制】' : elementalMult < 1.0 ? '【被元素克制】' : '';
  const weaponText = weaponMult > 1.0 ? '【武器克制】' : weaponMult < 1.0 ? '【被武器克制】' : '';
  const critText = isCrit ? '【暴击！】' : '';
  const actionText = isPlayer ? buildPlayerActionText(action) : '攻击';
  const description = `${actor === 'player' ? '你' : '敌人'}${actionText}，${critText}${elementText}${weaponText}造成 ${Math.floor(damage)} 点伤害`;

  return {
    damage: Math.floor(damage),
    mpCost,
    turnResult: {
      actor,
      action,
      damageDealt: Math.floor(damage),
      healDone: 0,
      elementalModifier: elementalMult,
      isCrit,
      isDodge: false,
      description,
    },
  };
}

function calculateMpCost(state: ManualBattleState, action: BattleAction): number {
  if (action.techniqueId) {
    const tech = state.availableTechniques.find(t => t.techniqueId === action.techniqueId);
    if (tech) return tech.mpCost;
  }
  // 普通攻击不耗真气
  return 0;
}

function buildPlayerActionText(action: BattleAction): string {
  if (!action.techniqueId) return '普通攻击';
  return '使用招式';
}

// ============================================
// 防御处理
// ============================================

interface DefendResult {
  mpRestored: number;
  turnResult: TurnResult;
}

function processDefend(state: ManualBattleState, seed: number): DefendResult {
  const mpRestored = Math.floor(state.playerMaxMp * DEFEND_MP_RESTORE_RATE);

  // 防御时会受到敌人攻击但伤害减少
  // 注意：伤害减免在 executeBattleAction 的敌人行动阶段自动应用
  // 这里只生成防御指令的记录

  return {
    mpRestored,
    turnResult: {
      actor: 'player',
      action: { type: 'defend', source: 'player' },
      damageDealt: 0,
      healDone: mpRestored,
      elementalModifier: 1.0,
      isCrit: false,
      isDodge: false,
      description: `你进入防御姿态，恢复 ${mpRestored} 点真气，受到的伤害减少 ${Math.floor(DEFEND_DAMAGE_REDUCTION * 100)}%`,
    },
  };
}

// ============================================
// 逃跑处理
// ============================================

interface FleeResult {
  success: boolean;
  turnResult: TurnResult;
}

function processFlee(state: ManualBattleState, seed: number): FleeResult {
  const successRate = state.playerSpeed / (state.playerSpeed + state.enemySpeed);
  const success = seededRandom(seed) < successRate;

  return {
    success,
    turnResult: {
      actor: 'player',
      action: { type: 'flee', source: 'player' },
      damageDealt: 0,
      healDone: 0,
      elementalModifier: 1.0,
      isCrit: false,
      isDodge: false,
      description: success
        ? '你成功逃跑了！'
        : '逃跑失败！你露出了破绽...',
    },
  };
}

// ============================================
// 防御减伤（在敌人攻击时应用）
// ============================================

/**
 * 对敌人伤害应用防御减免
 * 当玩家本回合使用了防御指令时调用
 *
 * @param damage - 原始伤害
 * @param playerDefended - 玩家本回合是否防御
 * @returns 减免后的伤害
 */
export function applyDefendReduction(damage: number, playerDefended: boolean): number {
  if (!playerDefended) return damage;
  return Math.floor(damage * (1 - DEFEND_DAMAGE_REDUCTION));
}

// ============================================
// 招式验证
// ============================================

/**
 * 验证招式是否可用于当前战斗状态
 *
 * @param state - 当前战斗状态
 * @param techniqueId - 要验证的招式 ID
 * @returns { valid, reason } — 是否有效及原因
 */
export function validateTechniqueUse(
  state: ManualBattleState,
  techniqueId: string
): { valid: boolean; reason?: string } {
  const tech = state.availableTechniques.find(t => t.techniqueId === techniqueId);
  if (!tech) {
    return { valid: false, reason: '招式不存在' };
  }
  if (!tech.isAvailable) {
    if (tech.isOnCooldown) {
      return { valid: false, reason: `招式冷却中（剩余 ${tech.cooldownRemaining} 回合）` };
    }
    if (tech.mpCost > state.playerCurrentMp) {
      return { valid: false, reason: `真气不足（需要 ${tech.mpCost}，当前 ${state.playerCurrentMp}）` };
    }
    return { valid: false, reason: '招式不可用' };
  }
  return { valid: true };
}

// ============================================
// AI 自动战斗策略
// ============================================

/**
 * AI 自动战斗决策
 *
 * @param state - 当前战斗状态
 * @param strategy - AI 策略
 * @param seed - 随机种子
 * @returns AI 决策（选择的行为和理由）
 */
export function decideAIAction(
  state: ManualBattleState,
  strategy: AutoBattleStrategy,
  seed: number
): AIDecision {
  const availableTechs = state.availableTechniques.filter(t => t.isAvailable);

  switch (strategy) {
    case 'aggressive':
      return decideAggressive(state, availableTechs, seed);
    case 'conservative':
      return decideConservative(state, availableTechs, seed);
    case 'balanced':
    default:
      return decideBalanced(state, availableTechs, seed);
  }
}

function decideAggressive(
  state: ManualBattleState,
  availableTechs: ManualBattleState['availableTechniques'],
  _seed: number
): AIDecision {
  // 优先使用高伤害招式（克制优先）
  const advantageTechs = availableTechs.filter(t => t.elementalStatus === 'advantage');
  const candidates = advantageTechs.length > 0 ? advantageTechs : availableTechs;

  if (candidates.length > 0) {
    // 选威力最高的
    const best = candidates.reduce((a, b) =>
      a.powerMultiplier > b.powerMultiplier ? a : b
    );
    return {
      action: { type: 'attack', techniqueId: best.techniqueId, source: 'ai' },
      reason: `激进策略：优先使用克制招式 ${best.name}`,
    };
  }

  return { action: { type: 'attack', source: 'ai' }, reason: '激进策略：普通攻击' };
}

function decideConservative(
  state: ManualBattleState,
  availableTechs: ManualBattleState['availableTechniques'],
  _seed: number
): AIDecision {
  // HP < 50% 时优先防御
  const hpPercent = state.playerCurrentHp / state.playerMaxHp;
  if (hpPercent < 0.5) {
    return { action: { type: 'defend', source: 'ai' }, reason: '保守策略：HP过低，进入防御' };
  }

  // 优先使用低消耗招式
  const lowCostTechs = availableTechs.filter(t => t.mpCost <= 5);
  if (lowCostTechs.length > 0) {
    const best = lowCostTechs.reduce((a, b) => a.mpCost < b.mpCost ? a : b);
    return {
      action: { type: 'attack', techniqueId: best.techniqueId, source: 'ai' },
      reason: `保守策略：使用低消耗招式 ${best.name}`,
    };
  }

  return { action: { type: 'attack', source: 'ai' }, reason: '保守策略：普通攻击' };
}

function decideBalanced(
  state: ManualBattleState,
  availableTechs: ManualBattleState['availableTechniques'],
  seed: number
): AIDecision {
  // HP < 30% 时防御
  const hpPercent = state.playerCurrentHp / state.playerMaxHp;
  if (hpPercent < 0.3) {
    return { action: { type: 'defend', source: 'ai' }, reason: '均衡策略：HP过低，进入防御' };
  }

  // 有可用招式时随机选择一个
  if (availableTechs.length > 0 && seededRandom(seed) < 0.7) {
    const idx = Math.floor(seededRandom(nextSeed(seed, 2)) * availableTechs.length);
    const tech = availableTechs[Math.min(idx, availableTechs.length - 1)];
    return {
      action: { type: 'attack', techniqueId: tech.techniqueId, source: 'ai' },
      reason: `均衡策略：使用招式 ${tech.name}`,
    };
  }

  return { action: { type: 'attack', source: 'ai' }, reason: '均衡策略：普通攻击' };
}

// ============================================
// 战斗初始化与结算
// ============================================

/**
 * 创建初始手动战斗状态
 *
 * @param params - 战斗参数
 * @returns 初始化后的战斗状态
 */
export function createManualBattleState(params: {
  playerMaxHp: number;
  playerCurrentHp: number;
  playerMaxMp: number;
  playerCurrentMp: number;
  playerAttack: number;
  playerDefense: number;
  playerSpeed: number;
  playerElement: Element;
  playerWeapon: WeaponCategory | null;
  availableTechniques: ManualBattleState['availableTechniques'];
  enemyName: string;
  enemyMaxHp: number;
  enemyCurrentHp: number;
  enemyAttack: number;
  enemyDefense: number;
  enemySpeed: number;
  enemyLevel: number;
  enemyElement: Element;
  enemyWeapon: WeaponCategory | null;
  enemyRealm: string;
  maxRounds?: number;
  autoStrategy?: AutoBattleStrategy;
}): ManualBattleState {
  return {
    playerMaxHp: params.playerMaxHp,
    playerCurrentHp: params.playerCurrentHp,
    playerMaxMp: params.playerMaxMp,
    playerCurrentMp: params.playerCurrentMp,
    playerAttack: params.playerAttack,
    playerDefense: params.playerDefense,
    playerSpeed: params.playerSpeed,
    playerElement: params.playerElement,
    playerWeapon: params.playerWeapon,
    availableTechniques: params.availableTechniques,
    enemyName: params.enemyName,
    enemyMaxHp: params.enemyMaxHp,
    enemyCurrentHp: params.enemyCurrentHp,
    enemyAttack: params.enemyAttack,
    enemyDefense: params.enemyDefense,
    enemySpeed: params.enemySpeed,
    enemyLevel: params.enemyLevel,
    enemyElement: params.enemyElement,
    enemyWeapon: params.enemyWeapon,
    enemyRealm: params.enemyRealm,
    currentRound: 1,
    maxRounds: params.maxRounds || 20,
    turnHistory: [],
    isOver: false,
    isAutoBattle: true,
    autoStrategy: params.autoStrategy || 'balanced',
  };
}

/**
 * 构建战斗结算结果
 *
 * @param state - 结束的战斗状态
 * @param enemyLevel - 敌人等级（用于经验计算）
 * @returns 战斗结算结果
 */
export function buildBattleResult(
  state: ManualBattleState,
  enemyLevel: number
): ManualBattleResult {
  const victory = state.victory ?? false;

  const result: ManualBattleResult = {
    victory,
    fled: state.fled,
    battleState: state,
    playerHpAfter: state.playerCurrentHp,
    playerMpAfter: state.playerCurrentMp,
  };

  if (victory) {
    // 计算奖励
    const expReward = 20 + enemyLevel * 3;
    const stoneReward = 5 + enemyLevel * 2;

    result.rewards = {
      experience: expReward,
      spiritStones: stoneReward,
    };
  }

  return result;
}

/**
 * 为防御状态下的玩家计算减伤后的敌人攻击
 */
export function calculateEnemyDamageWithDefend(
  state: ManualBattleState,
  enemyBaseDamage: number,
  playerDefendedThisTurn: boolean
): number {
  return applyDefendReduction(enemyBaseDamage, playerDefendedThisTurn);
}
