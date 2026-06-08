/**
 * 敌人AI决策系统
 * 
 * 核心职责：
 * 1. 根据敌人行为模式做出战斗决策
 * 2. 选择合适的技能和目标
 * 3. 支持多种行为策略
 */

import { BattleSkill } from '../../battle/types';
import { Enemy, EnemyBehaviorType, AIDecision, SkillPriority } from '../types';

// ============================================
// 决策上下文
// ============================================

/**
 * 战斗状态信息
 */
export interface BattleContext {
  // 玩家信息
  playerLevel: number;
  playerCurrentHp: number;
  playerMaxHp: number;
  playerCurrentMp: number;
  playerMaxMp: number;
  
  // 敌人组信息
  currentEnemy: Enemy;
  
  // 回合信息
  turnNumber: number;
}

/**
 * 技能评分结果
 */
interface SkillScore {
  skill: BattleSkill;
  score: number;
  reason: string;
}

// ============================================
// 行为策略
// ============================================

/**
 * 激进型策略：优先使用高伤害技能
 */
function aggressiveStrategy(
  enemy: Enemy,
  context: BattleContext
): AIDecision {
  const availableSkills = getAvailableSkills(enemy);
  
  if (availableSkills.length === 0) {
    return { action: 'attack', skill: null };
  }
  
  // 按伤害排序
  const skillScores = availableSkills.map(skill => {
    const damage = skill.effect?.damageMultiplier || 1;
    const mpEfficiency = skill.mpCost > 0 ? damage / skill.mpCost : damage;
    const score = damage * 2 + mpEfficiency;
    
    return {
      skill,
      score,
      reason: `伤害倍率${damage.toFixed(1)}, MP效率${mpEfficiency.toFixed(2)}`,
    };
  });
  
  skillScores.sort((a, b) => b.score - a.score);
  
  const best = skillScores[0];
  
  if (!canUseSkill(enemy, best.skill)) {
    return { action: 'attack', skill: null };
  }
  
  return {
    action: 'skill',
    skill: best.skill,
    reason: best.reason,
  };
}

/**
 * 防御型策略：优先治疗和防御
 */
function defensiveStrategy(
  enemy: Enemy,
  context: BattleContext
): AIDecision {
  const hpRatio = enemy.currentHp / enemy.stats.maxHp;
  const availableSkills = getAvailableSkills(enemy);
  
  // HP低时优先治疗
  if (hpRatio < 0.3) {
    const healSkills = availableSkills.filter(
      s => s.type === 'defense' && s.effect?.healing
    );
    
    if (healSkills.length > 0) {
      const best = healSkills.reduce((a, b) => 
        (b.effect?.healing || 0) > (a.effect?.healing || 0) ? b : a
      );
      
      if (canUseSkill(enemy, best)) {
        return {
          action: 'skill',
          skill: best,
          reason: `HP低(${Math.floor(hpRatio * 100)}%), 使用治疗技能`,
        };
      }
    }
  }
  
  // 有防御技能时使用
  const defenseSkills = availableSkills.filter(s => s.type === 'defense');
  if (defenseSkills.length > 0 && Math.random() > 0.5) {
    const best = defenseSkills[0];
    if (canUseSkill(enemy, best)) {
      return {
        action: 'skill',
        skill: best,
        reason: '使用防御技能',
      };
    }
  }
  
  // 否则普通攻击
  return { action: 'attack', skill: null };
}

/**
 * 均衡型策略：根据情况选择攻击或防御
 */
function balancedStrategy(
  enemy: Enemy,
  context: BattleContext
): AIDecision {
  const hpRatio = enemy.currentHp / enemy.stats.maxHp;
  const mpRatio = enemy.currentMp / enemy.stats.maxMp;
  const playerHpRatio = context.playerCurrentHp / context.playerMaxHp;
  
  // HP低时倾向防御
  if (hpRatio < 0.3) {
    return defensiveStrategy(enemy, context);
  }
  
  // MP充足且玩家HP低时激进攻击
  if (mpRatio > 0.5 && playerHpRatio < 0.3) {
    return aggressiveStrategy(enemy, context);
  }
  
  // 随机选择
  const availableSkills = getAvailableSkills(enemy);
  if (availableSkills.length > 0 && Math.random() > 0.4) {
    // 随机选择一个可用技能
    const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
    if (canUseSkill(enemy, skill)) {
      return {
        action: 'skill',
        skill,
        reason: '均衡策略随机选择技能',
      };
    }
  }
  
  return { action: 'attack', skill: null };
}

/**
 * 战略型策略：智能决策
 */
function strategicStrategy(
  enemy: Enemy,
  context: BattleContext
): AIDecision {
  const hpRatio = enemy.currentHp / enemy.stats.maxHp;
  const mpRatio = enemy.currentMp / enemy.stats.maxMp;
  const playerHpRatio = context.playerCurrentHp / context.playerMaxHp;
  const availableSkills = getAvailableSkills(enemy);
  
  // 濒危时全力防御
  if (hpRatio < 0.2) {
    return defensiveStrategy(enemy, context);
  }
  
  // 有终结机会时全力攻击
  if (playerHpRatio < 0.2 && mpRatio > 0.3) {
    return aggressiveStrategy(enemy, context);
  }
  
  // 计算最佳技能
  const skillScores = availableSkills.map(skill => scoreSkill(skill, enemy, context));
  skillScores.sort((a, b) => b.score - a.score);
  
  // 如果有高评分技能
  if (skillScores.length > 0 && skillScores[0].score > 50) {
    const best = skillScores[0];
    if (canUseSkill(enemy, best.skill)) {
      return {
        action: 'skill',
        skill: best.skill,
        reason: best.reason,
      };
    }
  }
  
  // 根据HP比例决定
  if (hpRatio < 0.5) {
    return balancedStrategy(enemy, context);
  }
  
  return aggressiveStrategy(enemy, context);
}

/**
 * 策略型策略：专注于特定目标
 */
function tacticalStrategy(
  enemy: Enemy,
  context: BattleContext
): AIDecision {
  // 类似战略型，但更注重技能组合
  return strategicStrategy(enemy, context);
}

// ============================================
// 技能评分
// ============================================

/**
 * 评估技能得分
 */
function scoreSkill(
  skill: BattleSkill,
  enemy: Enemy,
  context: BattleContext
): SkillScore {
  let score = 0;
  let reason = '';
  
  // 基础分数
  const damageMultiplier = skill.effect?.damageMultiplier || 1;
  const healing = skill.effect?.healing || 0;
  const mpCost = skill.mpCost;
  
  // 伤害技能评分
  if (skill.type === 'attack') {
    // 伤害倍率加成
    score += damageMultiplier * 30;
    
    // MP效率
    if (mpCost > 0) {
      score += (damageMultiplier / mpCost) * 20;
    }
    
    // 击杀机会加分
    const estimatedDamage = enemy.stats.attack * damageMultiplier;
    if (estimatedDamage >= context.playerCurrentHp) {
      score += 100; // 可以击杀
    }
    
    reason = `伤害倍率${damageMultiplier.toFixed(1)}, 预估伤害${Math.floor(estimatedDamage)}`;
  }
  
  // 防御技能评分
  if (skill.type === 'defense') {
    const hpRatio = enemy.currentHp / enemy.stats.maxHp;
    
    // 治疗量加成
    score += healing * 2;
    
    // HP低时治疗加分
    if (hpRatio < 0.3) {
      score += 50;
    } else if (hpRatio < 0.5) {
      score += 30;
    }
    
    reason = `治疗量${healing}, HP比例${Math.floor(hpRatio * 100)}%`;
  }
  
  // 冷却惩罚
  if (skill.cooldown > 3) {
    score -= skill.cooldown * 2;
  }
  
  // MP不足惩罚
  if (mpCost > enemy.currentMp) {
    score -= 1000;
  }
  
  return { skill, score, reason };
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取可用技能列表
 */
function getAvailableSkills(enemy: Enemy): BattleSkill[] {
  return enemy.skills.filter(skill => {
    // 检查MP
    if (skill.mpCost > enemy.currentMp) return false;
    
    // 检查冷却
    if (enemy.skillCooldowns[skill.id] && enemy.skillCooldowns[skill.id] > 0) {
      return false;
    }
    
    return true;
  });
}

/**
 * 检查是否可以使用技能
 */
function canUseSkill(enemy: Enemy, skill: BattleSkill): boolean {
  // 检查MP
  if (skill.mpCost > enemy.currentMp) return false;
  
  // 检查冷却
  if (enemy.skillCooldowns[skill.id] && enemy.skillCooldowns[skill.id] > 0) {
    return false;
  }
  
  return true;
}

// ============================================
// 主决策函数
// ============================================

/**
 * 行为策略映射
 */
const BEHAVIOR_STRATEGIES: Record<EnemyBehaviorType, (enemy: Enemy, context: BattleContext) => AIDecision> = {
  aggressive: aggressiveStrategy,
  defensive: defensiveStrategy,
  balanced: balancedStrategy,
  strategic: strategicStrategy,
  tactical: tacticalStrategy,
};

/**
 * 敌人AI决策
 * 
 * 根据敌人的行为类型和当前战斗状态，决定下一步行动
 */
export function makeAIDecision(
  enemy: Enemy,
  context: BattleContext
): AIDecision {
  const strategy = BEHAVIOR_STRATEGIES[enemy.behaviorType] || balancedStrategy;
  return strategy(enemy, context);
}

/**
 * 批量决策（为多个敌人做决策）
 */
export function makeAIDecisions(
  enemies: Enemy[],
  context: Omit<BattleContext, 'currentEnemy'>
): Array<{ enemy: Enemy; decision: AIDecision }> {
  return enemies.map(enemy => ({
    enemy,
    decision: makeAIDecision(enemy, { ...context, currentEnemy: enemy }),
  }));
}

// ============================================
// 技能优先级配置
// ============================================

/**
 * 默认技能优先级配置
 */
export const DEFAULT_SKILL_PRIORITY: SkillPriority = {
  attack: 0.6,
  defense: 0.3,
  heal: 0.1,
};

/**
 * 获取技能优先级
 */
export function getSkillPriority(
  behaviorType: EnemyBehaviorType
): SkillPriority {
  const priorities: Record<EnemyBehaviorType, SkillPriority> = {
    aggressive: { attack: 0.8, defense: 0.1, heal: 0.1 },
    defensive: { attack: 0.3, defense: 0.4, heal: 0.3 },
    balanced: { attack: 0.5, defense: 0.3, heal: 0.2 },
    strategic: { attack: 0.4, defense: 0.3, heal: 0.3 },
    tactical: { attack: 0.5, defense: 0.25, heal: 0.25 },
  };
  
  return priorities[behaviorType] || DEFAULT_SKILL_PRIORITY;
}

// ============================================
// 导出
// ============================================

export {
  aggressiveStrategy,
  defensiveStrategy,
  balancedStrategy,
  strategicStrategy,
  tacticalStrategy,
};
