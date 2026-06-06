/**
 * 机缘行动力系统
 * 
 * 核心设计原则：
 * 1. 冷却时间限制频繁进出（30秒）
 * 2. 行动力限制移动次数，行动力为0无法移动
 * 3. 战斗胜利恢复行动力（鼓励战斗）
 * 4. 提前退出惩罚（丢失部分奖励）
 * 
 * 数值设计：
 * - 初始行动力：基础值5 + 玩家等级加成（每5级+1）
 * - 每次移动消耗1点
 * - 战斗恢复：普通+1，精英+2，小Boss+3，Boss+5
 * - 冷却时间：30秒（防止频繁进出）
 */

import { EnemyTier, CellType, DungeonConfig, Protagonist, AdventureSessionState } from './types';

// ============================================
// 常量配置
// ============================================

/** 行动力配置 */
export const STAMINA_CONFIG = {
  /** 基础行动力 */
  BASE_STAMINA: 5,
  /** 每5级增加的行动力 */
  STAMINA_PER_5_LEVELS: 1,
  /** 最大行动力上限 */
  MAX_STAMINA: 30,
  
  /** 每次移动消耗 */
  MOVE_COST: 1,
  
  /** 战斗胜利恢复量 */
  BATTLE_STAMINA_REWARD: {
    normal: 1,      // 普通敌人
    elite: 2,       // 精英敌人
    miniboss: 3,    // 小Boss
    boss: 5,        // Boss
  } as const,
  
  /** 退出冷却时间（毫秒） */
  EXIT_COOLDOWN_MS: 30 * 1000, // 30秒
  
  /** 提前退出惩罚：丢失奖励比例 */
  EARLY_EXIT_PENALTY: 0.5, // 丢失50%奖励
  
  /** 探索完成奖励加成 */
  COMPLETION_BONUS: 0.2, // 额外20%奖励
} as const;

// ============================================
// 核心计算函数
// ============================================

/**
 * 计算玩家的最大行动力
 */
export function calculateMaxStamina(playerLevel: number): number {
  const base = STAMINA_CONFIG.BASE_STAMINA;
  const levelBonus = Math.floor(playerLevel / 5) * STAMINA_CONFIG.STAMINA_PER_5_LEVELS;
  return Math.min(base + levelBonus, STAMINA_CONFIG.MAX_STAMINA);
}

/**
 * 计算战斗胜利恢复的行动力
 */
export function calculateBattleStaminaReward(enemyTier: EnemyTier): number {
  return STAMINA_CONFIG.BATTLE_STAMINA_REWARD[enemyTier] || 1;
}

/**
 * 根据格子类型获取敌人等级
 */
export function getEnemyTierFromType(cellType: CellType): EnemyTier | null {
  switch (cellType) {
    case 'enemy':
      return 'normal';
    case 'elite':
      return 'elite';
    case 'miniboss':
      return 'miniboss';
    case 'boss':
      return 'boss';
    default:
      return null;
  }
}

/**
 * 检查是否可以进入机缘
 * 
 * 限制条件：
 * - 冷却时间（硬性限制）
 * - 等级要求
 */
export function canEnterAdventure(
  protagonist: Protagonist,
  config: DungeonConfig,
  lastExitTime: number
): { canEnter: boolean; reason?: string; cooldownRemaining?: number } {
  // 检查冷却时间
  const now = Date.now();
  const cooldownRemaining = lastExitTime + STAMINA_CONFIG.EXIT_COOLDOWN_MS - now;
  if (cooldownRemaining > 0) {
    return { 
      canEnter: false, 
      reason: `需要等待 ${Math.ceil(cooldownRemaining / 1000)} 秒后才能再次进入`,
      cooldownRemaining
    };
  }
  
  // 检查机缘是否解锁（等级要求）
  if (config.difficulty > protagonist.level + 20) {
    return { 
      canEnter: false, 
      reason: `等级不足，需要达到 ${config.difficulty - 20} 级` 
    };
  }
  
  return { canEnter: true };
}

/**
 * 创建新的机缘会话状态
 */
export function createAdventureSession(
  protagonist: Protagonist,
  lastExitTime: number = 0
): AdventureSessionState {
  return {
    isActive: true,
    currentStamina: calculateMaxStamina(protagonist.level),
    maxStamina: calculateMaxStamina(protagonist.level),
    enterTime: Date.now(),
    lastExitTime,
    enemiesDefeated: 0,
    bossDefeated: false,
  };
}

/**
 * 创建默认的机缘会话状态（不在机缘中）
 */
export function createDefaultAdventureSession(): AdventureSessionState {
  return {
    isActive: false,
    currentStamina: STAMINA_CONFIG.BASE_STAMINA,
    maxStamina: STAMINA_CONFIG.BASE_STAMINA,
    enterTime: 0,
    lastExitTime: 0,
    enemiesDefeated: 0,
    bossDefeated: false,
  };
}

/**
 * 检查是否可以移动
 */
export function canMoveInAdventure(session: AdventureSessionState | null | undefined): { canMove: boolean; reason?: string } {
  if (!session || !session.isActive) {
    return { canMove: false, reason: '当前不在机缘中' };
  }
  
  if (session.currentStamina < STAMINA_CONFIG.MOVE_COST) {
    return { canMove: false, reason: `行动力不足（当前 ${session.currentStamina}/${session.maxStamina}）` };
  }
  
  return { canMove: true };
}

/**
 * 消耗行动力移动
 */
export function consumeStaminaForMove(session: AdventureSessionState): { success: boolean; staminaRemaining: number } {
  if (session.currentStamina < STAMINA_CONFIG.MOVE_COST) {
    return { success: false, staminaRemaining: session.currentStamina };
  }
  
  session.currentStamina -= STAMINA_CONFIG.MOVE_COST;
  
  return { 
    success: true, 
    staminaRemaining: session.currentStamina 
  };
}

/**
 * 战斗胜利后恢复行动力
 */
export function recoverStaminaFromBattle(
  session: AdventureSessionState, 
  enemyTier: EnemyTier
): { staminaBefore: number; staminaAfter: number; recovery: number } {
  const recovery = calculateBattleStaminaReward(enemyTier);
  const staminaBefore = session.currentStamina;
  
  session.currentStamina = Math.min(
    session.currentStamina + recovery,
    session.maxStamina
  );
  
  // 记录击败数量
  session.enemiesDefeated++;
  if (enemyTier === 'boss') {
    session.bossDefeated = true;
  }
  
  return {
    staminaBefore,
    staminaAfter: session.currentStamina,
    recovery
  };
}

/**
 * 结束机缘会话（设置退出时间）
 */
export function endAdventureSession(session: AdventureSessionState): AdventureSessionState {
  return {
    ...session,
    isActive: false,
    lastExitTime: Date.now(),
  };
}

/**
 * 检查行动力状态并返回提示
 */
export function getStaminaStatus(session: AdventureSessionState | null | undefined): {
  status: 'ok' | 'low' | 'critical' | 'exhausted';
  message: string;
  canContinue: boolean;
} {
  if (!session) {
    return {
      status: 'ok',
      message: '',
      canContinue: true,
    };
  }
  
  const ratio = session.currentStamina / session.maxStamina;
  
  if (session.currentStamina === 0) {
    return {
      status: 'exhausted',
      message: '行动力耗尽！必须击败敌人恢复行动力，或退出机境',
      canContinue: false,
    };
  }
  
  if (ratio <= 0.2) {
    return {
      status: 'critical',
      message: `行动力严重不足（${session.currentStamina}/${session.maxStamina}），建议寻找敌人战斗恢复`,
      canContinue: true,
    };
  }
  
  if (ratio <= 0.4) {
    return {
      status: 'low',
      message: `行动力不足（${session.currentStamina}/${session.maxStamina}），注意寻找战斗机会`,
      canContinue: true,
    };
  }
  
  return {
    status: 'ok',
    message: `行动力充足（${session.currentStamina}/${session.maxStamina}）`,
    canContinue: true,
  };
}

/**
 * 获取战斗恢复行动力的提示
 */
export function getBattleStaminaRewardHint(enemyTier: EnemyTier): string {
  const reward = calculateBattleStaminaReward(enemyTier);
  const tierNames: Record<EnemyTier, string> = {
    normal: '普通敌人',
    elite: '精英敌人',
    miniboss: '小Boss',
    boss: 'Boss',
  };
  return `击败${tierNames[enemyTier]}可恢复 ${reward} 行动力`;
}

/**
 * 获取冷却剩余时间（秒）
 */
export function getCooldownRemaining(lastExitTime: number): number {
  const now = Date.now();
  const remaining = lastExitTime + STAMINA_CONFIG.EXIT_COOLDOWN_MS - now;
  return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * 检查冷却是否结束
 */
export function isCooldownFinished(lastExitTime: number): boolean {
  return getCooldownRemaining(lastExitTime) === 0;
}
