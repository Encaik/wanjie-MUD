/**
 * 机缘系统测试辅助函数
 */
import { DungeonConfig, AdventureCell, ItemDefinition, Protagonist, fromOldStats } from '@/lib/game/types';

/**
 * 创建完整的 DungeonConfig 用于测试
 */
export function createTestDungeonConfig(overrides: Partial<DungeonConfig> = {}): DungeonConfig {
  return {
    rows: 5,
    cols: 5,
    difficulty: 1,
    realmName: '测试秘境',
    enemyLevelMin: 1,
    enemyLevelMax: 5,
    rewardMultiplier: 1,
    portalCount: 1,
    ...overrides,
  };
}

/**
 * 创建完整的 AdventureCell 用于测试
 */
export function createTestCell(type: AdventureCell['type'], overrides: Partial<AdventureCell> = {}): AdventureCell {
  return {
    type,
    cleared: false,
    visited: false,
    ...overrides,
  };
}

/**
 * 创建完整的 ItemDefinition 用于测试
 */
export function createTestItemDefinition(overrides: Partial<ItemDefinition> = {}): ItemDefinition {
  return {
    id: 'test_item',
    name: '测试物品',
    type: '丹药',
    rarity: '普通',
    description: '测试用物品',
    effects: [],
    stackable: true,
    maxStack: 99,
    ...overrides,
  };
}

/**
 * 创建测试用的主角数据
 */
export function createTestProtagonist(overrides: Partial<Protagonist> = {}): Protagonist {
  const defaultStats = fromOldStats({ 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 });
  return {
    id: 'test_protagonist',
    character: { id: 'test_char', name: '测试角色', description: '', avatar: '', type: '修仙者', stats: defaultStats, traits: [], backstory: '' },
    level: 10,
    experience: 0,
    realm: '练气期',
    stats: defaultStats,
    maxHp: 200,
    maxMp: 100,
    currentHp: 200,
    currentMp: 100,
    stamina: 100,
    maxStamina: 100,
    inventory: [],
    techniques: [],
    equipments: [],
    activeEffects: [],
    world: { 
      id: 1,
      type: '修仙', 
      realmSystem: { mainRealmName: '修仙', subRealmName: '阶段', tiers: [] }, 
      name: '修仙界', 
      description: '修仙世界', 
      difficulty: '普通',
      powerSystem: '修仙',
      majorForces: '',
      factions: [],
      worldCoefficient: 1.0,
      dangers: { type: '妖兽', impact: '低' },
      opportunities: { type: '灵气', impact: '高' }
    },
    mentalState: { stability: 100, demonChance: 0 },
    ...overrides,
  } as Protagonist;
}
