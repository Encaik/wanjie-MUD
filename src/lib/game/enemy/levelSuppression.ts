/**
 * 等级压制系统
 * 
 * 核心设计：
 * 1. 等级差距过大时，高等级敌人显示骷髅头警告
 * 2. 达到秒杀阈值时，敌人攻击直接秒杀玩家
 * 3. 等级差影响伤害修正
 */

import { 
  SuppressionLevel, 
  LevelSuppressionConfig, 
  LEVEL_SUPPRESSION 
} from './types';

// ============================================
// 等级压制计算
// ============================================

/**
 * 计算等级压制状态
 */
export function calculateSuppressionLevel(
  playerLevel: number,
  enemyLevel: number
): SuppressionLevel {
  const levelDiff = enemyLevel - playerLevel;
  
  if (levelDiff >= LEVEL_SUPPRESSION.instantKillThreshold) {
    return 'instant_kill';
  }
  if (levelDiff >= LEVEL_SUPPRESSION.dangerThreshold) {
    return 'danger';
  }
  if (levelDiff >= LEVEL_SUPPRESSION.warningThreshold) {
    return 'warning';
  }
  return 'none';
}

/**
 * 等级压制伤害修正结果
 */
export interface LevelDiffModifier {
  playerDamageDealt: number;      // 玩家造成伤害系数
  playerDamageReceived: number;   // 玩家受到伤害系数
  enemyDamageDealt: number;       // 敌人造成伤害系数
  enemyDamageReceived: number;    // 敌人受到伤害系数
}

/**
 * 计算等级差伤害修正
 * 
 * 玩家等级更高：玩家造成更多伤害，受到更少伤害
 * 敌人等级更高：玩家造成更少伤害，受到更多伤害
 */
export function calculateLevelDiffModifier(
  playerLevel: number,
  enemyLevel: number
): LevelDiffModifier {
  const levelDiff = enemyLevel - playerLevel;
  
  // 每级差5%修正，最大50%
  const modifier = Math.min(
    Math.abs(levelDiff) * LEVEL_SUPPRESSION.levelDiffModifier,
    LEVEL_SUPPRESSION.maxLevelDiffModifier
  );
  
  if (levelDiff > 0) {
    // 敌人等级高：玩家不利
    return {
      playerDamageDealt: Math.max(0.5, 1 - modifier),      // 造成伤害减少，最低50%
      playerDamageReceived: Math.min(1.5, 1 + modifier),   // 受到伤害增加，最高150%
      enemyDamageDealt: Math.min(1.5, 1 + modifier),       // 敌人造成伤害增加
      enemyDamageReceived: Math.max(0.5, 1 - modifier),    // 敌人受到伤害减少
    };
  } else if (levelDiff < 0) {
    // 玩家等级高：玩家有利
    const positiveMod = Math.min(Math.abs(levelDiff) * LEVEL_SUPPRESSION.levelDiffModifier, 0.3); // 玩家优势上限30%
    return {
      playerDamageDealt: Math.min(1.3, 1 + positiveMod),   // 造成伤害增加
      playerDamageReceived: Math.max(0.7, 1 - positiveMod),// 受到伤害减少
      enemyDamageDealt: Math.max(0.7, 1 - positiveMod),    // 敌人造成伤害减少
      enemyDamageReceived: Math.min(1.3, 1 + positiveMod), // 敌人受到伤害增加
    };
  }
  
  // 等级相同
  return {
    playerDamageDealt: 1,
    playerDamageReceived: 1,
    enemyDamageDealt: 1,
    enemyDamageReceived: 1,
  };
}

// ============================================
// 秒杀判定
// ============================================

/**
 * 检查是否触发秒杀
 * 
 * 当等级差达到秒杀阈值时，敌人的攻击直接造成等于玩家最大HP的伤害
 */
export function shouldInstantKill(
  playerLevel: number,
  enemyLevel: number
): boolean {
  const suppression = calculateSuppressionLevel(playerLevel, enemyLevel);
  return suppression === 'instant_kill';
}

/**
 * 计算秒杀伤害
 */
export function calculateInstantKillDamage(
  playerMaxHp: number
): number {
  return playerMaxHp;
}

// ============================================
// 战斗开始检查
// ============================================

/**
 * 战斗开始时的等级压制检查结果
 */
export interface LevelSuppressionCheckResult {
  canFight: boolean;
  suppression: SuppressionLevel;
  levelDiff: number;
  message?: string;
  warningType?: 'info' | 'warning' | 'danger' | 'fatal';
}

/**
 * 战斗开始时的等级压制检查
 */
export function checkLevelSuppressionAtBattleStart(
  playerLevel: number,
  enemyLevel: number,
  enemyName: string
): LevelSuppressionCheckResult {
  const suppression = calculateSuppressionLevel(playerLevel, enemyLevel);
  const levelDiff = enemyLevel - playerLevel;
  
  switch (suppression) {
    case 'instant_kill':
      return {
        canFight: true, // 允许挑战，但给予警告
        suppression,
        levelDiff,
        message: `☠️ 警告：${enemyName}比你高${levelDiff}级，极可能被秒杀！是否继续挑战？`,
        warningType: 'fatal',
      };
      
    case 'danger':
      return {
        canFight: true,
        suppression,
        levelDiff,
        message: `⚠️ 危险：${enemyName}比你高${levelDiff}级，战斗将非常艰难！`,
        warningType: 'danger',
      };
      
    case 'warning':
      return {
        canFight: true,
        suppression,
        levelDiff,
        message: `⚡ 提示：${enemyName}比你高${levelDiff}级，建议提升等级后再挑战。`,
        warningType: 'warning',
      };
      
    default:
      return {
        canFight: true,
        suppression,
        levelDiff,
      };
  }
}

// ============================================
// UI辅助函数
// ============================================

/**
 * 获取等级压制显示文本
 */
export function getSuppressionDisplayText(suppression: SuppressionLevel): string {
  switch (suppression) {
    case 'instant_kill':
      return '☠️ 极度危险';
    case 'danger':
      return '🔴 危险';
    case 'warning':
      return '🟡 警告';
    default:
      return '';
  }
}

/**
 * 获取等级压制CSS类名
 */
export function getSuppressionClassName(suppression: SuppressionLevel): string {
  switch (suppression) {
    case 'instant_kill':
      return 'suppression-instant-kill';
    case 'danger':
      return 'suppression-danger';
    case 'warning':
      return 'suppression-warning';
    default:
      return '';
  }
}

/**
 * 判断是否显示骷髅头图标
 */
export function shouldShowSkullIcon(
  playerLevel: number,
  enemyLevel: number
): boolean {
  return calculateSuppressionLevel(playerLevel, enemyLevel) === 'instant_kill';
}

// ============================================
// 综合伤害计算
// ============================================

/**
 * 应用等级压制后的最终伤害计算
 */
export function applyLevelSuppressionToDamage(
  baseDamage: number,
  attackerType: 'player' | 'enemy',
  playerLevel: number,
  enemyLevel: number
): number {
  const modifier = calculateLevelDiffModifier(playerLevel, enemyLevel);
  
  if (attackerType === 'player') {
    return Math.floor(baseDamage * modifier.playerDamageDealt);
  } else {
    // 敌人攻击
    if (shouldInstantKill(playerLevel, enemyLevel)) {
      // 秒杀：返回一个标记值，在战斗系统中处理
      // 实际伤害由战斗系统根据玩家最大HP计算
      return -1; // 特殊标记
    }
    return Math.floor(baseDamage * modifier.enemyDamageDealt);
  }
}
