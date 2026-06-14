/**
 * 模块① 身份创建 — 对外契约
 *
 * 职责：角色模板生成（V3）、主角适配器、世界数据访问
 */

// —— 角色模板生成（Seed 驱动，V3） ——
export {
  generateCharacterTemplates,
  createCharacterSeed,
} from './logic/characterTemplates';
export type { CharacterTemplate } from './logic/characterTemplates';

// —— 主角适配器（V3 → Protagonist 桥接） ——
export { createProtagonistFromSaved } from './logic/protagonistAdapter';

// —— 世界数据 ——
export { getStatDisplayName } from './data/statDisplayNames';
export {
  calculateWorldDifficultyCoefficient,
  getWorldDifficultyFromCoefficient,
  calculateWorldRewardCoefficient,
  getWorldBaseCoefficient,
} from './data/worldSystem';
