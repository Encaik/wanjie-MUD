/**
 * 类型定义统一导出入口
 * 所有类型从单一入口导出，简化导入路径
 */

// 基础类型
export * from './base';

// 角色相关
export * from './character';

// 世界相关
export * from './world';

// 道具相关
export * from './item';

// 战斗相关
export * from './combat';

// 功法相关
export * from './technique';

// 装备相关
export * from './equipment';

// 游戏状态相关
export * from './game';

// 扩展类型（从原位置重新导出，保持兼容）
export type {
  FactionProgress,
  ReputationLevel,
  TaskProgress,
  ProficiencyLevel,
  CultivationPathProgress,
  MentalState,
} from '@/lib/game/typesExtension';

// 势力任务进度重新导出
export type { DifficultyLevel } from '@/lib/data/worldData';
