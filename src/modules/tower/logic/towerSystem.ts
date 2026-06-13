/**
 * 爬塔系统核心逻辑
 * 
 * 设计原则：
 * 1. 敌人使用与玩家相同的属性计算公式
 * 2. 难度随层数递增
 * 3. 战利品存入掉落池，供挂机使用
 */

import { calcPlayerMaxMp } from '@/core/calculation';
import { calculateEnemyHp, calculateEnemyAttack, calculateEnemyDefense } from '@/modules/progression/logic/balanceConfig';
import {
  TowerEnemy,
  TowerRewards,
  TowerProgress,
  DropPool,
  DropPoolItem,
  FragmentDrop,
  MaterialDrop,
  TOWER_CONFIG,
  createEmptyDropPool,
  createDefaultTowerProgress,
} from '@/modules/tower/logic/types';
import { Enemy } from '@/modules/combat/logic/enemy/types';
import { EnemyGroup } from '@/modules/combat/logic/enemy/types';
import { getTerminology } from '@/modules/narrative/logic/terminology';
import { WorldType, WorldBalanceStats, ItemRarity, EnemyTier } from '@/core/types';

// ============================================
// 工具函数
// ============================================

/**
 * 获取世界术语
 */
function getWorldTerms(worldType: WorldType) {
  const term = getTerminology(worldType);
  return {
    power: term.power,
    energy: term.energy,
  };
}

/**
 * 生成唯一ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// 敌人生成
// ============================================

/**
 * 计算塔层敌人难度系数
 * 
 * 【平衡性修改 v4】使用塔层专用敌人配置
 * 
 * 难度曲线设计：
 * - 第1-5层：1.0-1.5 (有一定挑战，需要策略)
 * - 第6-15层：1.5-2.5 (需要升级功法装备)
 * - 第16-40层：2.5-4.0 (需要较好装备和功法)
 * - 第41-80层：4.0-6.5 (需要高级装备和功法)
 * - 第81-100层：6.5-8.5 (极限挑战)
 * - 第100+层：8.5+ (神仙难度)
 * 
 * 设计理念：
 * - 塔层普通敌人基础倍率: HP 1.3, 攻击 1.25, 防御 1.2
 * - 已经比有初始装备的玩家(约1.2-1.3倍)略强
 * - 难度系数在基础配置上额外叠加
 */
export function calculateTowerDifficulty(floor: number): number {
  let difficulty: number;
  
  if (floor <= 5) {
    // 入门区：有一定挑战，1.1 -> 1.6
    // 注意：塔层难度从1.1开始，避免与新手区域配置冲突
    difficulty = 1.1 + (floor - 1) * 0.125;
  } else if (floor <= 15) {
    // 中低层：明显提升，1.5 -> 2.5
    difficulty = 1.5 + (floor - 5) * 0.1;
  } else if (floor <= 40) {
    // 中层：明显挑战，2.5 -> 4.0
    difficulty = 2.5 + (floor - 15) * 0.06;
  } else if (floor <= 80) {
    // 高层：较大挑战，4.0 -> 6.5
    difficulty = 4.0 + (floor - 40) * 0.0625;
  } else if (floor <= 100) {
    // 顶层：极限挑战，6.5 -> 8.5
    difficulty = 6.5 + (floor - 80) * 0.1;
  } else {
    // 神仙难度：8.5 -> 10.0
    difficulty = 8.5 + Math.min((floor - 100) * 0.015, 1.5);
  }
  
  return Math.max(1.0, Math.min(10.0, difficulty));
}

/**
 * 获取敌人类型
 */
export function getEnemyType(floor: number): EnemyTier {
  if (floor % TOWER_CONFIG.bossFloorInterval === 0) {
    return 'boss';
  }
  if (floor % TOWER_CONFIG.bossFloorInterval >= 8) {
    return 'elite';
  }
  return 'normal';
}

/**
 * 计算敌人等级
 */
export function calculateEnemyLevel(playerLevel: number, floor: number): number {
  return Math.max(1, playerLevel + Math.floor(floor / 5));
}

/**
 * 生成爬塔敌人
 * 
 * 【平衡性修改】使用标准的敌人属性计算函数
 */
export function generateTowerEnemy(
  floor: number,
  playerLevel: number,
  worldStats: WorldBalanceStats,
  worldTypeForDisplay: WorldType = '修仙'
): TowerEnemy {
  // 敌人等级：低层与玩家持平，高层逐渐高出
  const enemyLevel = calculateEnemyLevel(playerLevel, floor);
  
  // 敌人类型
  const enemyType = getEnemyType(floor);
  const isBoss = enemyType === 'boss';
  
  // 塔层难度系数（通过 difficultyValue 控制）
  const towerDifficulty = calculateTowerDifficulty(floor);
  
  // 使用标准的敌人属性计算函数
  // 注意：difficultyValue 会影响敌人分级配置的选择
  const maxHp = calculateEnemyHp(
    enemyLevel,
    enemyType,
    'normal',
    worldStats,
    false,
    towerDifficulty
  );

  const attack = calculateEnemyAttack(
    enemyLevel,
    enemyType,
    'normal',
    worldStats,
    false,
    towerDifficulty
  );

  const defense = calculateEnemyDefense(
    enemyLevel,
    enemyType,
    'normal',
    worldStats,
    false,
    towerDifficulty
  );
  
  // MP 使用简化计算
  const baseSpiritualRoot = 50;
  const maxMp = calcPlayerMaxMp(baseSpiritualRoot, enemyLevel);
  
  // 生成敌人名字
  const name = generateEnemyName(floor, enemyType, worldTypeForDisplay);

  // 生成功法（根据类型）
  const techniques = generateEnemyTechniques(enemyLevel, enemyType, worldTypeForDisplay);
  
  // 计算奖励
  const rewards = calculateFloorRewards(floor, enemyType);
  
  return {
    id: generateId('tower_enemy'),
    name,
    level: enemyLevel,
    type: enemyType,
    floor,
    maxHp,
    currentHp: maxHp,
    maxMp,
    currentMp: maxMp,
    attack,
    defense,
    techniques,
    isBoss,
    rewards,
  };
}

/**
 * 生成敌人名字
 */
function generateEnemyName(floor: number, enemyType: EnemyTier, worldType: WorldType): string {
  const terms = getWorldTerms(worldType);
  
  // 根据层数生成不同名字
  const floorIndex = floor % 100;
  
  // 前缀
  const prefixes: Record<EnemyTier, string[]> = {
    boss: ['守护者', '统领', '霸主', '王者', '巨擘'],
    elite: ['精英', '强者', '高手', '精锐'],
    miniboss: ['小Boss'],
    normal: ['守卫', '喽啰', '弟子', '学徒'],
  };
  
  // 元素/属性
  const elements = ['火', '水', '风', '雷', '土', '金', '木', '冰', '暗', '光'];
  const element = elements[floorIndex % elements.length];
  
  const prefix = prefixes[enemyType][floorIndex % prefixes[enemyType].length];
  
  if (enemyType === 'boss') {
    return `第${floor}层·${element}${prefix}`;
  }
  return `${element}${prefix}`;
}

/**
 * 生成敌人功法
 */
function generateEnemyTechniques(level: number, enemyType: EnemyTier, worldType: WorldType): string[] {
  // 简化实现：根据类型返回不同数量的功法
  const techniqueCount = enemyType === 'boss' ? 3 : enemyType === 'elite' ? 2 : 1;
  
  const terms = getWorldTerms(worldType);
  const techniques: string[] = [];
  
  const baseNames = ['基础攻击', '防御术', '恢复术', '强化术', '突刺', '格挡'];
  
  for (let i = 0; i < techniqueCount && i < baseNames.length; i++) {
    techniques.push(baseNames[i]);
  }
  
  return techniques;
}

// ============================================
// 奖励计算
// ============================================

/**
 * 根据层数计算固定品质
 * 每20层提升一个品质档次
 */
function getRarityByFloor(floor: number): ItemRarity {
  if (floor >= 200) return '神话';
  if (floor >= 150) return '传说';
  if (floor >= 100) return '史诗';
  if (floor >= 50) return '稀有';
  return '普通';
}

/**
 * 计算爬塔战利品（固定奖励）
 * 奖励基于层数和敌人类型确定，不是随机的
 */
export function calculateFloorRewards(
  floor: number,
  enemyType: EnemyTier,
  isFirstClear: boolean = false
): TowerRewards {
  // 敌人类型倍率
  const typeMultiplier = enemyType === 'boss' ? 3.0 : 
                         enemyType === 'elite' ? 1.5 : 1.0;
  
  // 首通倍率
  const bonusMultiplier = isFirstClear ? 1.5 : 1.0;
  
  // 灵石奖励（固定）
  const baseSpiritStone = TOWER_CONFIG.spiritStoneBase + floor * TOWER_CONFIG.spiritStonePerFloor;
  const spiritStones = Math.floor(baseSpiritStone * typeMultiplier * bonusMultiplier);
  
  // 经验奖励（固定）
  const experience = Math.floor((10 + floor * 5) * typeMultiplier * bonusMultiplier);
  
  // 碎片奖励（固定，基于层数确定品质）
  const fragments: FragmentDrop[] = [];
  const rarity = getRarityByFloor(floor);
  
  // 普通敌人：1个碎片
  // 精英敌人：2个碎片
  // Boss：3个碎片
  const fragmentCount = enemyType === 'boss' ? 3 : enemyType === 'elite' ? 2 : 1;
  
  // 交替给予功法碎片和装备碎片
  for (let i = 0; i < fragmentCount; i++) {
    fragments.push({
      type: i % 2 === 0 ? 'technique' : 'equipment',
      rarity,
      quantity: 1,
    });
  }
  
  // 材料奖励（固定，每5层给一个材料）
  const materials: MaterialDrop[] = [];
  if (floor % 5 === 0 || enemyType === 'boss') {
    const materialRarity = getRarityByFloor(Math.floor(floor / 2));
    materials.push({
      id: `material_${materialRarity}_${floor}`,
      rarity: materialRarity,
      quantity: enemyType === 'boss' ? 2 : 1,
    });
  }
  
  return {
    spiritStones,
    fragments,
    materials,
    experience,
    isFirstClear,
  };
}

// ============================================
// 序列化辅助
// ============================================

/**
 * 序列化爬塔进度（用于存档）
 */
export function serializeTowerProgress(progress: TowerProgress): string {
  return JSON.stringify({
    ...progress,
    clearedFloors: Array.from(progress.clearedFloors),
  });
}

/**
 * 反序列化爬塔进度（用于加载存档）
 */
export function deserializeTowerProgress(data: string | null | undefined): TowerProgress {
  if (!data) {
    return createDefaultTowerProgress();
  }
  
  try {
    const parsed = JSON.parse(data);
    return {
      ...createDefaultTowerProgress(),
      ...parsed,
      clearedFloors: new Set(parsed.clearedFloors || []),
    };
  } catch {
    return createDefaultTowerProgress();
  }
}

// ============================================
// 多敌人系统适配
// ============================================

/**
 * 将 TowerEnemy 转换为 Enemy 类型
 */
export function convertTowerEnemyToEnemy(
  towerEnemy: TowerEnemy,
  worldType: WorldType
): Enemy {
  return {
    id: towerEnemy.id,
    name: towerEnemy.name,
    description: `第${towerEnemy.floor}层${towerEnemy.isBoss ? 'Boss' : '敌人'}`,
    level: towerEnemy.level,
    tier: towerEnemy.type,
    templateId: `tower_${towerEnemy.floor}`,
    
    // 属性
    stats: {
      maxHp: towerEnemy.maxHp,
      attack: towerEnemy.attack,
      defense: towerEnemy.defense,
      speed: 10 + towerEnemy.level * 0.5,
      maxMp: towerEnemy.maxMp,
    },
    
    // 战斗状态
    currentHp: towerEnemy.currentHp,
    maxHp: towerEnemy.maxHp,
    currentMp: towerEnemy.currentMp,
    maxMp: towerEnemy.maxMp,
    
    // 功法装备 - 简化处理
    techniques: [],
    equipments: [],
    
    // 技能
    skills: [],
    skillCooldowns: {},
    
    // AI
    behaviorType: towerEnemy.isBoss ? 'strategic' : 'aggressive',
    
    // 难度系数
    difficultyMultiplier: 1.0,
    
    // 元素
    preferredElement: 'fire',
    
    // 掉落
    dropRateMultiplier: towerEnemy.isBoss ? 2.0 : 1.0,
    expMultiplier: towerEnemy.isBoss ? 2.0 : 1.0,
    
    // 奖励
    expReward: towerEnemy.rewards.experience,
    goldReward: towerEnemy.rewards.spiritStones,
  };
}

/**
 * 生成爬塔敌人组
 * 
 * 根据层数决定敌人数量和类型：
 * - 普通层：1个普通敌人
 * - 每5层：1个精英敌人
 * - 每10层(Boss层)：1个Boss + 2个精英
 */
export function generateTowerEnemyGroup(
  floor: number,
  playerLevel: number,
  worldStats: WorldBalanceStats
): EnemyGroup {
  const isBossFloor = floor % TOWER_CONFIG.bossFloorInterval === 0;
  const isEliteFloor = floor % 5 === 0 && !isBossFloor;
  
  const enemies: Enemy[] = [];
  let groupType: EnemyGroup['groupType'] = 'patrol';
  let totalExp = 0;
  
  if (isBossFloor) {
    groupType = 'boss';
    // Boss层：1个Boss + 2个精英
    const boss = generateTowerEnemy(floor, playerLevel, worldStats);
    const bossEnemy = convertTowerEnemyToEnemy(boss, "");
    enemies.push(bossEnemy);
    totalExp += bossEnemy.expReward;
    
    // 添加2个精英
    for (let i = 0; i < 2; i++) {
      const elite = generateTowerEnemy(floor, playerLevel, worldStats);
      elite.id = `${elite.id}_elite_${i}`;
      elite.name = `${elite.name}护卫${i + 1}`;
      elite.type = 'elite';
      elite.isBoss = false;
      // 精英属性略低
      elite.maxHp = Math.floor(elite.maxHp * 0.7);
      elite.currentHp = elite.maxHp;
      elite.attack = Math.floor(elite.attack * 0.8);
      elite.defense = Math.floor(elite.defense * 0.8);
      const eliteEnemy = convertTowerEnemyToEnemy(elite, "");
      enemies.push(eliteEnemy);
      totalExp += eliteEnemy.expReward;
    }
  } else if (isEliteFloor) {
    groupType = 'elite';
    // 精英层：1个精英敌人
    const elite = generateTowerEnemy(floor, playerLevel, worldStats);
    elite.type = 'elite';
    const eliteEnemy = convertTowerEnemyToEnemy(elite, "");
    enemies.push(eliteEnemy);
    totalExp += eliteEnemy.expReward;
  } else {
    groupType = 'patrol';
    // 普通层：1个普通敌人
    const normal = generateTowerEnemy(floor, playerLevel, worldStats);
    const normalEnemy = convertTowerEnemyToEnemy(normal, "");
    enemies.push(normalEnemy);
    totalExp += normalEnemy.expReward;
  }
  
  // 创建敌人组
  const enemyGroup: EnemyGroup = {
    enemies,
    turnOrder: enemies.map((e, i) => ({
      enemyId: e.id,
      enemyIndex: i,
      speed: e.stats.speed,
      baseSpeed: e.stats.speed,
      acted: false,
    })),
    currentTurnIndex: 0,
    groupType,
    description: isBossFloor 
      ? `第${floor}层Boss战` 
      : isEliteFloor 
        ? `第${floor}层精英战` 
        : `第${floor}层`,
    totalExp,
  };
  
  return enemyGroup;
}
