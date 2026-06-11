/**
 * 冒险战斗系统 - 新战斗系统集成
 * 
 * 这个模块提供了与 adventure.ts 兼容的战斗接口，
 * 内部使用新的战斗策略系统实现。
 */

import {
  calculateEnemyHp,
  calculateEnemyAttack,
  calculateEnemyDefense,
  calculateBattleExp,
  calculateBattleSpiritStones,
} from '@/modules/progression/logic/balanceConfig';
import { 
  createBattleState,
  createBattleStatistics,
  startBattle,
  settleBattle,
  ExtendedBattleState,
  BattleStatistics,
  Enemy,
  PlayerData,
} from '@/modules/combat/logic/battle';
import {  executeAutoTurn } from '@/modules/combat/logic/battle/battleController';
import { 
  calculatePlayerCombatPower,
  calculateEnemyCombatPower,
} from '@/modules/combat/logic/combatPower';
import {  GAME_CONSTANTS } from '@/shared/utils/constants';
import { 
  calculateEnemyEnhancement,
  applyEnemyEnhancement,
} from '@/modules/combat/logic/enemy/enemyEnhancement';
import { 
  generateEnemyTechniquesAndEquipments,
  calculateTechniqueBonus,
  calculateEquipmentBonus,
} from '@/modules/combat/logic/enemy/enemyTechniqueEquipment';
import { 
  generateRandomEquipment,
} from '@/modules/equipment/logic/equipment';
import { 
  generateFragmentDrop,
  FragmentDropResult,
} from '@/modules/crafting/logic/fragmentSystem';
import { 
  getRandomItem,
  spiritStoneItems,
  breakthroughItems,
} from '@/modules/equipment/logic/items';
import { 
  getEnemyAttributes,
} from '@/modules/combat/logic/restraintSystem';
import { 
  generateRandomTechnique,
} from '@/modules/techniques/logic/technique';
import {
  FlatStats,
  Protagonist,
  CellType,
  DungeonConfig,
  BattleResult,
  BattleState,
  BattleLog,
  CharacterStats,
  InventoryItem,
  Technique,
  Equipment,
  EnemyTier,
  WorldType,
  getFinalStats,
} from '@/core/types';
import { 
  getEnemyTierFromCellType,
  getEnemyTierConfig,
} from '@/modules/identity/data/worldData';
import { 
  createInventoryItem,
} from '@/core/types';
import {  clamp } from '@/shared/utils/numberUtils';

// 随机工具
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// ============================================
// 类型定义
// ============================================

/** 战斗输入参数 */
export interface BattleInput {
  protagonist: Protagonist;
  cellType: CellType;
  enemyContent: string;
  config: DungeonConfig;
}

/** 战斗输出结果 */
export interface BattleOutput {
  result: BattleResult;
  battleState: BattleState;
  statistics?: BattleStatistics;
}

// ============================================
// 敌人创建
// ============================================

/**
 * 解析敌人信息
 * 
 * 支持格式：
 * - 【精英】火灵兽 Lv.15
 * - 火灵兽 Lv.15
 * - 火灵兽(Lv.15)
 * - 【Boss】魔尊 Lv.50
 */
export function parseEnemyInfo(content: string): { name: string; level: number } {
  // 尝试匹配：可选前缀 + 名字 + 可选空格 + (Lv.X 或 Lv.X)
  const match = content.match(/(?:【[^】]+】)?(.+?)\s*\(?\s*Lv\.(\d+)\s*\)?/);
  if (match) {
    return { name: match[1].trim(), level: parseInt(match[2]) };
  }
  return { name: content, level: 1 };
}

/**
 * 创建敌人数据（含真实功法和装备）
 */
function createEnemyData(
  cellType: CellType,
  enemyName: string,
  enemyLevel: number,
  config: DungeonConfig,
  worldType: WorldType,
  playerLevel: number = 1
): Enemy {
  const tier = getEnemyTierFromCellType(cellType);
  const tierConfig = getEnemyTierConfig(tier);
  const difficultyLevel = config.difficultyLevel || 'normal';

  // 计算敌人基础属性
  let hp = calculateEnemyHp(enemyLevel, tier, difficultyLevel, worldType, true, config.difficulty);
  let attack = calculateEnemyAttack(enemyLevel, tier, difficultyLevel, worldType, true, config.difficulty);
  let defense = calculateEnemyDefense(enemyLevel, tier, difficultyLevel, worldType, true, config.difficulty);

  // 生成敌人的真实功法和装备
  const techniqueEquipment = generateEnemyTechniquesAndEquipments(
    enemyLevel,
    tier,
    playerLevel,
    worldType
  );
  
  // 应用功法和装备的属性加成
  hp += techniqueEquipment.totalHpBonus;
  attack += techniqueEquipment.totalAttackBonus;
  defense += techniqueEquipment.totalDefenseBonus;

  // 应用敌人增强（保留原有系统作为额外加成）
  const enhancement = calculateEnemyEnhancement(enemyLevel, tier, config.difficulty);
  const enhanced = applyEnemyEnhancement(hp, attack, defense, enhancement);

  // 获取敌人属性
  const attrs = getEnemyAttributes(enemyName, tier === 'boss');

  // 创建符合新 Enemy 类型的对象
  return {
    id: `enemy_${Date.now()}`,
    name: enemyName,
    description: `等级${enemyLevel}的${tierConfig.name}敌人`,
    level: enemyLevel,
    tier,
    templateId: `cell_${cellType}`,
    
    // 属性
    stats: {
      maxHp: enhanced.hp,
      attack: enhanced.attack,
      defense: enhanced.defense,
      speed: 10 + enemyLevel * 0.5,
      maxMp: techniqueEquipment.maxMp,
    },
    
    // 战斗状态
    currentHp: enhanced.hp,
    maxHp: enhanced.hp,
    currentMp: techniqueEquipment.maxMp,
    maxMp: techniqueEquipment.maxMp,
    
    // 功法装备
    techniques: techniqueEquipment.techniques,
    equipments: techniqueEquipment.equipments,
    
    // 技能
    skills: techniqueEquipment.skills,
    skillCooldowns: {},
    
    // AI
    behaviorType: 'aggressive',
    
    // 难度系数
    difficultyMultiplier: 1.0,
    
    // 元素
    preferredElement: attrs.element || 'fire',
    
    // 掉落
    dropRateMultiplier: 1.0,
    expMultiplier: 1.0,
    
    // 奖励
    expReward: calculateBattleExp(enemyLevel, tier, difficultyLevel, worldType),
    goldReward: calculateBattleSpiritStones(enemyLevel, tier, difficultyLevel, worldType),
  };
}

// ============================================
// 玩家数据转换
// ============================================

/**
 * 将 Protagonist 转换为 PlayerData
 */
function convertToPlayerData(protagonist: Protagonist): PlayerData {
  return {
    name: protagonist.character.name,
    level: protagonist.level,
    attributes: getFinalStats(protagonist.stats),
    health: protagonist.currentHp,
    mana: protagonist.currentMp,
    techniques: [
      ...(protagonist.equippedAttackTechniques || []),
      ...(protagonist.equippedDefenseTechniques || []),
    ],
    inventory: protagonist.inventory,
    equippedMelee: protagonist.equippedMelee,
    equippedRanged: protagonist.equippedRanged,
  };
}

// ============================================
// 战斗执行
// ============================================

/**
 * 执行战斗 - 使用新战斗系统
 * 
 * 替换原有的 calculateBattleWithLogs 函数
 */
export function executeBattleNew(input: BattleInput): BattleOutput {
  const { protagonist, cellType, enemyContent, config } = input;
  const worldType = protagonist.world.type;

  // 解析敌人信息
  const { name: enemyName, level: enemyLevel } = parseEnemyInfo(enemyContent);

  // 创建敌人数据（传入玩家等级限制稀有度）
  const enemy = createEnemyData(cellType, enemyName, enemyLevel, config, worldType, protagonist.level);

  // 创建玩家数据
  const playerData = convertToPlayerData(protagonist);

  // 创建战斗状态
  const battleConfig = {
    battleType: cellType === 'boss' ? 'boss' as const : 'normal' as const,
    canFlee: cellType !== 'boss' && cellType !== 'miniboss',
  };

  const state = createBattleState(playerData, enemy, battleConfig);
  const statistics = createBattleStatistics();

  // 开始战斗
  startBattle(state);

  // 自动战斗直到结束
  const maxRounds = 100;
  let rounds = 0;

  while (!state.isOver && rounds < maxRounds) {
    executeAutoTurn(state, statistics);
    rounds++;
  }

  // 超时判定
  if (!state.isOver) {
    state.isOver = true;
    const playerHpPercent = state.playerCurrentHp / state.playerMaxHp;
    const enemyHpPercent = state.enemyCurrentHp / state.enemyMaxHp;

    state.victory = playerHpPercent >= enemyHpPercent;
  }

  // 结算
  const settlement = settleBattle(state, statistics, enemy);

  // 转换为旧格式 BattleResult
  const result = convertToBattleResult(
    settlement.victory,
    state,
    statistics,
    protagonist,
    cellType,
    config,
    enemyLevel,
    enemy
  );

  // 创建旧格式的 battleState
  const battleState = createLegacyBattleState(state, enemy, config);

  return { result, battleState, statistics };
}

// ============================================
// 结果转换
// ============================================

/**
 * 转换为旧格式 BattleResult
 * 
 * 【平衡性改动】
 * - 移除了完整功法/装备的直接掉落
 * - 只通过碎片掉落系统提供功法/装备
 * - 碎片需要收集足够数量后合成
 */
function convertToBattleResult(
  victory: boolean,
  state: ExtendedBattleState,
  statistics: BattleStatistics,
  protagonist: Protagonist,
  cellType: CellType,
  config: DungeonConfig,
  enemyLevel: number,
  enemy: Enemy
): BattleResult {
  const tier = enemy.tier;
  const tierConfig = getEnemyTierConfig(tier);
  const worldType = protagonist.world.type;
  const playerLevel = protagonist.level;

  if (victory) {
    // 胜利奖励
    const statGains: Partial<FlatStats> = {};
    const itemGains: InventoryItem[] = [];

    // 【关键改动】碎片掉落 - 现在是唯一的功法/装备获取途径
    // 传入 playerLevel 参数确保稀有度限制生效
    const luck = getFinalStats(protagonist.stats).幸运 || 0;
    const fragmentDrop = generateFragmentDrop(enemyLevel, tier, luck, worldType, playerLevel);
    
    // 处理完整物品掉落
    const droppedTechniques: Technique[] = [];
    const droppedEquipments: Equipment[] = [];
    for (const completeItem of fragmentDrop.completeItems) {
      if (completeItem.type === 'technique') {
        droppedTechniques.push(completeItem.item as Technique);
      } else {
        droppedEquipments.push(completeItem.item as Equipment);
      }
    }

    // 灵石奖励
    const spiritStones = enemy.goldReward;
    itemGains.push(createInventoryItem(spiritStoneItems[0], spiritStones));

    // 根据敌人等级给予不同奖励
    switch (tier) {
      case 'boss':
        statGains.体质 = random(3, 5);
        statGains.意志 = random(2, 4);
        statGains.灵根 = random(2, 3);
        statGains.悟性 = random(1, 2);

        // Boss 额外掉落突破丹药
        const breakthroughPill = breakthroughItems[Math.min(Math.floor(enemyLevel / 30), 2)];
        itemGains.push(createInventoryItem(breakthroughPill, 2));

        // 稀有物品（材料、丹药等非装备/功法）
        const rareItem = getRandomItem(config.difficulty);
        if (rareItem) {
          itemGains.push(createInventoryItem(rareItem, 2));
        }
        // 【已移除】完整功法掉落
        // 【已移除】完整装备掉落
        break;

      case 'miniboss':
        statGains.体质 = random(2, 3);
        statGains.意志 = random(1, 2);
        statGains.灵根 = random(1, 2);

        // 小Boss 概率掉落丹药
        if (Math.random() < GAME_CONSTANTS.EVENT_COMMON_RATE) {
          const pill = breakthroughItems[Math.min(Math.floor(enemyLevel / 40), 2)];
          itemGains.push(createInventoryItem(pill, 1));
        }
        // 【已移除】完整功法掉落
        // 【已移除】完整装备掉落
        break;

      case 'elite':
        statGains.体质 = random(1, 2);
        statGains.意志 = random(0, 1);

        // 精英敌人概率掉落道具
        if (Math.random() < GAME_CONSTANTS.EVENT_RARE_BASE_RATE + config.difficulty * GAME_CONSTANTS.EVENT_RARE_DIFFICULTY_FACTOR) {
          const item = getRandomItem(config.difficulty);
          if (item) {
            itemGains.push(createInventoryItem(item, 1));
          }
        }
        // 【已移除】完整功法掉落
        // 【已移除】完整装备掉落
        break;

      default:
        statGains.体质 = random(0, 1);
        statGains.意志 = random(0, 1);

        // 普通敌人概率掉落道具
        if (Math.random() < GAME_CONSTANTS.EVENT_DANGER_BASE_RATE + config.difficulty * GAME_CONSTANTS.EVENT_DANGER_DIFFICULTY_FACTOR) {
          const item = getRandomItem(config.difficulty);
          if (item) {
            itemGains.push(createInventoryItem(item, 1));
          }
        }
        // 【已移除】完整功法掉落
        // 【已移除】完整装备掉落
        break;
    }

    // 生成战斗胜利消息
    let message = `战斗胜利！击败了${enemyLevel}级的${tierConfig.name}敌人！`;
    
    // 掉落消息（完整物品 + 碎片）
    if (fragmentDrop.log) {
      message += `\n${fragmentDrop.log}`;
    }

    return {
      victory: true,
      message,
      rewards: {
        stats: statGains,
        items: itemGains,
        experience: enemy.expReward,
        // 【已移除】完整功法直接掉落
        // 【已移除】完整装备直接掉落
        fragments: fragmentDrop.fragments,
        // 【新增】完整物品掉落（普通/稀有品质直接获得完整物品）
        techniques: droppedTechniques.length > 0 ? droppedTechniques : undefined,
        equipments: droppedEquipments.length > 0 ? droppedEquipments : undefined,
      },
      playerHpAfter: state.playerCurrentHp,
      playerMpAfter: state.playerCurrentMp,
      fragmentDrop,
    };
  } else {
    // 失败
    return {
      victory: false,
      message: `战斗失败！被${enemyLevel}级的${enemy.name}击败了...`,
      playerHpAfter: state.playerCurrentHp,
      playerMpAfter: state.playerCurrentMp,
    };
  }
}

/**
 * 创建旧格式的 BattleState
 */
function createLegacyBattleState(
  state: ExtendedBattleState,
  enemy: Enemy,
  config: DungeonConfig
): BattleState {
  // 从行动历史生成日志
  const logs: BattleLog[] = [];
  state.actionHistory.forEach(record => {
    logs.push({
      round: record.round,
      attacker: record.actor,
      action: record.result.message || '',
      damage: record.result.damage,
      special: record.result.critical ? 'crit' :
               record.result.restraint?.restraintType === 'counter' ? 'restraint_counter' :
               record.result.restraint?.restraintType === 'countered' ? 'restraint_countered' :
               record.result.skill ? 'technique' : undefined,
    });
  });

  return {
    enemyName: `${getEnemyTierConfig(enemy.tier).name !== '普通' ? `【${getEnemyTierConfig(enemy.tier).name}】` : ''}${enemy.name}`,
    enemyMaxHp: enemy.maxHp,
    enemyCurrentHp: state.enemyCurrentHp,
    enemyAttack: enemy.stats.attack,
    enemyDefense: enemy.stats.defense,
    enemyLevel: enemy.level,
    enemyRealm: config.realmName,
    enemyTier: enemy.tier,
    enemyCombatPower: calculateEnemyCombatPower(enemy.maxHp, enemy.stats.attack, enemy.stats.defense, enemy.level, enemy.tier),
    playerMaxHp: state.playerMaxHp,
    playerCurrentHp: state.playerCurrentHp,
    playerMaxMp: state.playerMaxMp,
    playerCurrentMp: state.playerCurrentMp,
    playerAttack: state.playerAttack,
    playerDefense: state.playerDefense,
    playerCombatPower: state.playerCombatPower,
    logs,
    currentRound: state.currentRound,
    isOver: state.isOver,
    victory: state.victory,
  };
}

// ============================================
// 导出兼容接口
// ============================================

/**
 * 与原有 calculateBattleWithLogs 兼容的接口
 */
export function calculateBattleWithLogs(
  protagonist: Protagonist,
  cellType: CellType,
  enemyName: string,
  enemyLevel: number,
  config: DungeonConfig
): { result: BattleResult; battleState: BattleState } {
  const enemyContent = `${enemyName} Lv.${enemyLevel}`;
  const output = executeBattleNew({
    protagonist,
    cellType,
    enemyContent,
    config,
  });

  return {
    result: output.result,
    battleState: output.battleState,
  };
}
