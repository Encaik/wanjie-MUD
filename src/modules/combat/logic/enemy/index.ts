/**
 * 敌人系统模块
 * 
 * 核心功能：
 * - 敌人模板和生成
 * - 敌人组管理
 * - AI决策
 * - 等级压制
 * - 功法装备生成
 */

// 类型导出
export * from './types';

// 功法装备生成
export * from './techniqueEquipment';

// 敌人功法装备（冒险战斗用）
export {
  ENEMY_TECHNIQUE_COUNT,
  ENEMY_EQUIPMENT_COUNT,
  ENEMY_RARITY_WEIGHTS,
  getEnemyRarityRange,
  calculateTechniqueBonus,
  calculateEquipmentBonus,
  generateEnemyTechniquesAndEquipments,
  selectEnemySkill,
  calculateEnemySkillDamage,
} from './enemyTechniqueEquipment';
export type { EnemyTechniqueEquipmentResult } from './techniqueEquipment';

// 等级压制
export * from './levelSuppression';

// 模板
export * from './templates';

// 敌人生成
export * from './generator';

// 敌人组生成
export * from './groupGenerator';

// AI决策
export * from './ai';
