/**
 * 世界观文案定义类型
 *
 * 每个世界观都遵循相同的结构，方便复制和修改
 * 添加新世界观只需复制一个文件然后修改内容
 *
 * **迁移说明**：核心类型定义已迁移到 @/core/registry/WorldDataRegistry。
 * 本文件保留为 barrel re-export，过渡期后删除。
 */

// 从 core/registry 重导出所有世界观文本类型
export type {
  WorldTerminology,
  WorldStatNames,
  WorldCombatTexts,
  WorldCultivationTexts,
  WorldResourceTexts,
  WorldItemTexts,
  WorldDungeonTexts,
  WorldUITexts,
  WorldBreakthroughTexts,
  WorldMessageTexts,
  PathTypeId,
  StatKey,
  PathTextDefinition,
  WorldPathTexts,
  WorldTextDefinition,
} from '@/core/registry';

export type { WorldType } from '@/core/types';

/**
 * 世界观文案映射表
 * Partial 以支持逐步添加，未定义的世界观使用默认修仙文案
 */
export type WorldTextsMap = Partial<Record<import('@/core/types').WorldType, import('@/core/registry').WorldTextDefinition>>;
