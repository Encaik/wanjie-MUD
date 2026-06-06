/**
 * 测试辅助函数
 * 提供创建测试状态的通用方法
 */

import type { GameState, Protagonist, World, Character, ImpactfulTrait, StatImpact, WorldImpact } from '@/lib/game/types';
import type { RealmSystem } from '@/lib/data/realmData';
import { createInventoryItem } from '@/lib/game/types';
import { spiritStoneItems, cultivationPillItems } from '@/lib/game/items';

// 创建空的带影响特性
const emptyImpact: StatImpact = { 体质: 0, 灵根: 0, 悟性: 0, 意志: 0, 幸运: 0 };
const emptyWorldImpact: WorldImpact = { description: '', impact: emptyImpact, impactDescription: '' };
const emptyTrait: ImpactfulTrait = {
  name: '无',
  description: '无影响',
  impact: emptyImpact,
  totalImpact: 0,
  level: 'common',
};

// 标准测试用境界系统
export const testRealmSystem: RealmSystem = {
  mainRealmName: '大境界',
  subRealmName: '小境界',
  tiers: [
    { name: '凡人', levelRange: [1, 9], subRealms: ['初期', '中期', '后期'] },
    { name: '炼气', levelRange: [10, 19], subRealms: ['初期', '中期', '后期'] },
    { name: '筑基', levelRange: [20, 29], subRealms: ['初期', '中期', '后期'] },
    { name: '金丹', levelRange: [30, 39], subRealms: ['初期', '中期', '后期'] },
    { name: '元婴', levelRange: [40, 49], subRealms: ['初期', '中期', '后期'] },
    { name: '化神', levelRange: [50, 59], subRealms: ['初期', '中期', '后期'] },
    { name: '炼虚', levelRange: [60, 69], subRealms: ['初期', '中期', '后期'] },
    { name: '合体', levelRange: [70, 79], subRealms: ['初期', '中期', '后期'] },
    { name: '大乘', levelRange: [80, 89], subRealms: ['初期', '中期', '后期'] },
    { name: '渡劫', levelRange: [90, 99], subRealms: ['初期', '中期', '后期'] },
  ],
};

// 标准测试用世界
export const testWorld: World = {
  id: 1,
  name: '测试世界',
  type: '修仙',
  description: '测试世界描述',
  powerSystem: '灵气',
  realmSystem: testRealmSystem,
  majorForces: '',
  factions: [],
  worldCoefficient: 1.0,
  difficulty: '普通',
  dangers: emptyWorldImpact,
  opportunities: emptyWorldImpact,
};

// 标准测试用角色
export const testCharacter: Character = {
  id: 1,
  name: '测试角色',
  gender: '男',
  age: 20,
  origin: emptyTrait,
  trait: emptyTrait,
  personality: emptyTrait,
  talent: emptyTrait,
  background: '测试背景',
  stats: {
    base: { 体质: 50, 灵根: 50, 悟性: 50, 意志: 50, 幸运: 50 },
    growth: { 体质: 0, 灵根: 0, 悟性: 0, 意志: 0, 幸运: 0 }
  },
  totalPower: 250,
};

// 标准测试用主角
export const testProtagonist: Protagonist = {
  character: testCharacter,
  world: testWorld,
  backstory: '测试背景',
  level: 1,
  realm: '凡人',
  stats: {
    base: { 体质: 50, 灵根: 50, 悟性: 50, 意志: 50, 幸运: 50 },
    growth: { 体质: 0, 灵根: 0, 悟性: 0, 意志: 0, 幸运: 0 }
  },
  statCapBonuses: {},
  inventory: [
    createInventoryItem(spiritStoneItems[0], 100),
    createInventoryItem(cultivationPillItems[0], 3),
  ],
  activeEffects: [],
  experience: 0,
  overflowExperience: 0,
  currentHp: 80,
  maxHp: 100,
  currentMp: 30,
  maxMp: 50,
  techniques: [],
  equippedAttackTechniques: [null, null, null],
  equippedDefenseTechniques: [null, null, null],
  equipments: [],
  equippedMelee: null,
  equippedRanged: null,
  equippedHead: null,
  equippedBody: null,
  equippedLegs: null,
  equippedFeet: null,
  factionId: null,
};

// 创建测试游戏状态
export function createTestGameState(overrides?: Partial<GameState>): GameState {
  return {
    phase: 'playing',
    characters: [],
    worlds: [],
    selectedCharacter: null,
    selectedWorld: null,
    protagonist: testProtagonist,
    currentEvent: null,
    lastActionResult: null,
    adventureGrid: null,
    adventurePosition: null,
    adventureConfig: null,
    adventurePhase: 'select',
    adventureLoot: [],
    adventureExperience: 0,
    currentTab: 'cultivation',
    battleState: null,
    messages: [],
    totalMessageCount: 0,
    autoCultivating: false,
    lastExploreTime: 0,
    crafting: null,
    forging: null,
    statistics: {
      maxLevel: 1,
      totalEnemiesKilled: 0,
      totalBossKilled: 0,
      totalEliteKilled: 0,
      totalTechniquesCollected: 0,
      totalEquipmentsCollected: 0,
      totalAdventuresCompleted: 0,
      clearedDifficulties: [], // 已通关的机缘难度等级列表
      totalCultivations: 0,
      totalBreakthroughs: 0,
      legendaryItemsObtained: 0,
      hasFullEquipment: false,
      maxLevelTechniques: 0,
      maxLevelEquipments: 0,
      collectedTechniqueNames: [],
      collectedEquipmentNames: [],
      pathSelected: false,
      pathLevel: 0,
      techniqueProficiencyXiaocheng: 0,
      techniqueProficiencyDacheng: 0,
      techniqueProficiencyHuajing: 0,
      bondsActivated: 0,
      bondLevel3Activated: false,
      maxEnhancementLevel: 0,
      factionJoined: false,
      reputationFriendly: false,
      reputationHonored: false,
      reputationExalted: false,
    },
    unlockedAchievementIds: [],
    claimedAchievementIds: [],
    ...overrides,
  } as GameState;
}
