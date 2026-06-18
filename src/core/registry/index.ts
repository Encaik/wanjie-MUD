/**
 * 世界观注册中心 — 桶导出
 *
 * @module core/registry
 */

export {
  WorldViewRegistry,
  asWorldType,
  assertWorldType,
  getAllWorldTypeValues,
  getWorldVisualConfig,
  isExtensibleWorldType,
  DEFAULT_VISUAL_CONFIG,
} from './WorldViewRegistry';

export { AttributeRegistry } from './AttributeRegistry';
export { RaceRegistry } from './RaceRegistry';
export { TalentRegistry } from './TalentRegistry';
export { NPCDataRegistry } from './NPCDataRegistry';
export { QuestRegistry } from './QuestRegistry';
export { ItemRegistry } from './ItemRegistry';

export type {
  // 世界观文本类型
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
  // 世界观定义
  WorldviewDefinition,
  // 视觉配置
  WorldVisualConfig,
  // 数据子类型
  WorldImpactData,
  TriggerConditionData,
  DangerEffectData,
  OpportunityEffectData,
  DangerData,
  OpportunityData,
  TraitDefinitionData,
  TraitPoolData,
  FactionTemplateData,
  NamePoolData,
  RealmTierData,
  RealmSystemData,
  WorldTextData,
  RewardCoefficientData,
  WorldStatsData,
} from './WorldViewRegistry';
