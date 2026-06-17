/**
 * 主角适配器
 *
 * 从新系统（Attribute/CoreStat）保存的角色数据创建 Protagonist，
 * 桥接新旧系统直到旧类型完全迁移。
 *
 * @module modules/identity
 */

import type { World, Protagonist, CharacterStats } from '@/core/types';
import { DEFAULT_PROTAGONIST_EXTENSION } from '@/core/types/typesExtension';
import type { StoredCharacter } from '@/app/api/v1/characters/store';

/**
 * 从保存的角色数据 + 世界数据创建 Protagonist
 *
 * V3: 属性值从 characters 表的 JSON 字段读取，核心值从 coreStats 读取。
 */
export function createProtagonistFromSaved(
  character: StoredCharacter,
  world: World,
): Protagonist {
  // 生命值和专项资源
  const maxHp = Math.round(character.coreStats.maxHp || 50);
  const maxMp = Math.round(character.coreStats.specialResourceCap || 0);

  // 构建旧格式 CharacterStats（过渡兼容，待属性系统迁移后移除）
  const legacyStats: CharacterStats = {
    base: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 },
    growth: { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 },
  };

  const extension = DEFAULT_PROTAGONIST_EXTENSION;

  /** 初始物品由新手引导阶段 0 发放，此处不再硬编码 */
  const initialItems: Protagonist['items'] = [];

  const protagonist: Protagonist = {
    character: {
      id: 0,
      name: character.name,
      gender: character.gender as '男' | '女',
      age: 20,
      origin: { name: character.raceId, description: '', level: 'common', impact: {}, totalImpact: 0 },
      trait: { name: '', description: '', level: 'common', impact: {}, totalImpact: 0 },
      personality: { name: '', description: '', level: 'common', impact: {}, totalImpact: 0 },
      talent: { name: '', description: '', level: 'common', impact: {}, totalImpact: 0 },
      background: '',
      stats: legacyStats,
      totalPower: 0,
    },
    world,
    backstory: `万界之中，${character.name}踏上了修行之路...`,
    level: 1,
    realm: '凡人',
    stats: legacyStats,
    statCapBonuses: {},
    currentHp: maxHp,
    maxHp,
    currentMp: maxMp,
    maxMp,
    // 新物品系统字段
    items: initialItems,
    slots: {},
    maxSlotCounts: {},
    // 旧字段（过渡兼容，待所有消费方迁移后清理）
    inventory: [],
    activeEffects: [],
    experience: 0,
    overflowExperience: 0,
    techniques: [],
    equippedAttackTechniques: [],
    equippedDefenseTechniques: [],
    equipments: [],
    equippedMelee: null,
    equippedRanged: null,
    equippedHead: null,
    equippedBody: null,
    equippedLegs: null,
    equippedFeet: null,
    factionId: null,
    cultivationPath: null,
    pathExp: 0,
    pathLevel: 0,
    mentalState: extension.mentalState,
    factionProgress: extension.factionProgress,
    currencies: extension.currencies,
    stamina: 100,
    maxStamina: 100,
    // V3: 存储新格式属性供后续使用
    v3Attributes: character.attributes,
    v3CoreStats: character.coreStats as Record<string, number>,
    v3RaceId: character.raceId,
    v3TalentIds: character.talentIds,
  };

  return protagonist;
}
