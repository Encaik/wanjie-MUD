/**
 * 世界数据注册中心 — 桶导出
 *
 * @module shared/lib/registry
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
} from './WorldDataRegistry';
