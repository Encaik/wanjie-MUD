/**
 * 世界数据注册中心 — 桶导出
 *
 * @module core/registry
 */

export {
  WorldDataRegistry,
  asWorldType,
  assertWorldType,
  getAllWorldTypeValues,
  getWorldVisualConfig,
  DEFAULT_VISUAL_CONFIG,
} from './WorldDataRegistry';

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
  // 旧类型（过渡期）
  WorldTypeData,
  WorldVisualConfig,
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
} from './WorldDataRegistry';
