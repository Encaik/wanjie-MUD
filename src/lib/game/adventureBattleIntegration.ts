/**
 * 冒险战斗集成层
 * 
 * 职责：
 * 1. 将新的战斗系统集成到冒险模式
 * 2. 提供数据适配器
 * 3. 保持与原有接口的兼容性
 */

import { parseEnemyInfo } from './adventure';
import { 
  calculatePlayerMaxHp,
  calculatePlayerMaxMp,
  calculatePlayerAttack,
  calculatePlayerDefense,
  calculateEnemyHp,
  calculateEnemyAttack,
  calculateEnemyDefense,
  calculateBattleExp,
  calculateBattleSpiritStones,
} from './balanceConfig';
import {
  createBattleState,
  createBattleStateFromGroup,
  createBattleStatistics,
  startBattle,
  getCurrentDecisions,
  executePlayerTurn,
  executeAutoPlayerTurn,
  settleBattle,
  getBattleStatusSummary,
  ExtendedBattleState,
  BattleStatistics,
  BattleAction,
  TurnResult,
  DecisionOption,
  BattleConfig,
  TriggeredEvent,
  Enemy,
} from './battle';
import { calculatePlayerCombatPower, calculateEnemyCombatPower } from './combatPower';
import { calculateEnemyEnhancement, applyEnemyEnhancement } from './enemyEnhancement';
import { 
  generateEnemyTechniquesAndEquipments,
  calculateTechniqueBonus,
  calculateEquipmentBonus,
} from './enemyTechniqueEquipment';
import { 
  getEnemyAttributes,
  calculateRestraintResult,
  getElementIcon,
  getWeaponCategoryIcon,
  ELEMENT_NAMES,
  WEAPON_CATEGORY_NAMES,
} from './restraintSystem';
import { generateTowerEnemyGroup, convertTowerEnemyToEnemy } from './tower/towerSystem';
import { TowerEnemy } from './tower/types';
import { 
  Protagonist, 
  CellType, 
  DungeonConfig,
  BattleResult,
  BattleState,
  BattleLog,
  EnemyTier,
  Technique,
  Equipment,
  WorldType,
  getFinalStats,
} from './types';
import { 
  getEnemyTierFromCellType, 
  getEnemyTierConfig 
} from '../data/worldData';

import type { EnemyGroup } from './enemy/types';


// ============================================
// 类型适配器
// ============================================

/**
 * 将 Protagonist 转换为 PlayerData 格式
 * 
 * 重要：必须使用玩家实际的属性值，而不是重新计算
 * 这样可以确保战斗中显示的血量/法力与玩家面板一致
 */
function convertToPlayerData(protagonist: Protagonist): any {
  // 计算攻击力和防御力（包含装备和功法加成）
  const playerAttack = calculatePlayerAttackWithBonuses(protagonist);
  const playerDefense = calculatePlayerDefenseWithBonuses(protagonist);
  
  return {
    name: protagonist.character.name,
    level: protagonist.level,
    attributes: protagonist.stats,
    // 使用玩家实际的HP/MP值
    health: protagonist.currentHp,
    mana: protagonist.currentMp,
    maxHp: protagonist.maxHp,
    maxMp: protagonist.maxMp,
    attack: playerAttack,
    defense: playerDefense,
    techniques: [
      ...(protagonist.equippedAttackTechniques || []),
      ...(protagonist.equippedDefenseTechniques || []),
    ],
    inventory: protagonist.inventory,
    equippedMelee: protagonist.equippedMelee,
    equippedRanged: protagonist.equippedRanged,
  };
}

/**
 * 计算玩家攻击力（包含装备和功法加成）
 */
function calculatePlayerAttackWithBonuses(protagonist: Protagonist): number {
  const stats = getFinalStats(protagonist.stats);
  let attack = calculatePlayerAttack(
    stats.体质,
    stats.灵根,
    protagonist.level,
    protagonist.world.type
  );
  
  // 应用功法加成
  const attackTechniques = protagonist.equippedAttackTechniques || [];
  let techniqueBonus = 0;
  for (const technique of attackTechniques) {
    if (technique) {
      techniqueBonus += technique.bonus;
    }
  }
  if (techniqueBonus > 0) {
    attack = Math.floor(attack * (1 + techniqueBonus / 100));
  }
  
  // 应用装备加成
  if (protagonist.equippedMelee) {
    attack = Math.floor(attack * (1 + protagonist.equippedMelee.attackBonus / 100));
  }
  if (protagonist.equippedRanged) {
    attack = Math.floor(attack * (1 + protagonist.equippedRanged.attackBonus / 100));
  }
  
  return attack;
}

/**
 * 计算玩家防御力（包含装备和功法加成）
 */
function calculatePlayerDefenseWithBonuses(protagonist: Protagonist): number {
  const stats = getFinalStats(protagonist.stats);
  let defense = calculatePlayerDefense(
    stats.意志,
    protagonist.level,
    protagonist.world.type
  );
  
  // 应用功法加成
  const defenseTechniques = protagonist.equippedDefenseTechniques || [];
  let techniqueBonus = 0;
  for (const technique of defenseTechniques) {
    if (technique) {
      techniqueBonus += technique.bonus;
    }
  }
  if (techniqueBonus > 0) {
    defense = Math.floor(defense * (1 + techniqueBonus / 100));
  }
  
  // 应用装备加成
  if (protagonist.equippedHead) {
    defense = Math.floor(defense * (1 + protagonist.equippedHead.defenseBonus / 100));
  }
  if (protagonist.equippedBody) {
    defense = Math.floor(defense * (1 + protagonist.equippedBody.defenseBonus / 100));
  }
  if (protagonist.equippedLegs) {
    defense = Math.floor(defense * (1 + protagonist.equippedLegs.defenseBonus / 100));
  }
  if (protagonist.equippedFeet) {
    defense = Math.floor(defense * (1 + protagonist.equippedFeet.defenseBonus / 100));
  }
  
  return defense;
}

/**
 * 创建 Enemy 对象（含真实功法和装备）
 */
function createEnemyFromCell(
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
    expReward: calculateBattleExp(enemyLevel, tier),
    goldReward: calculateBattleSpiritStones(enemyLevel, tier),
  };
}

// ============================================
// 战斗结果转换
// ============================================

/**
 * 将 TurnResult 转换为 BattleLog 数组
 */
function convertToBattleLogs(result: TurnResult): BattleLog[] {
  const logs: BattleLog[] = [];
  
  // 玩家行动
  if (result.playerResult) {
    logs.push({
      round: result.playerResult.action ? 1 : 0,
      attacker: 'player',
      action: result.playerResult.message || '',
      damage: result.playerResult.damage,
      special: result.playerResult.critical ? 'crit' : 
               result.playerResult.restraint?.restraintType === 'counter' ? 'restraint_counter' :
               result.playerResult.restraint?.restraintType === 'countered' ? 'restraint_countered' :
               result.playerResult.restraint?.restraintType === 'mutual' ? 'restraint_mutual' :
               result.playerResult.skill ? 'technique' : undefined,
    });
  }
  
  // 敌人行动
  if (result.enemyResult) {
    logs.push({
      round: 1,
      attacker: 'enemy',
      action: result.enemyResult.message || '',
      damage: result.enemyResult.damage,
      special: result.enemyResult.restraint?.restraintType === 'counter' ? 'restraint_countered' :
               result.enemyResult.restraint?.restraintType === 'countered' ? 'restraint_counter' :
               result.enemyResult.restraint?.restraintType === 'mutual' ? 'restraint_mutual' : undefined,
    });
  }
  
  // 事件
  result.events.forEach((event: TriggeredEvent) => {
    logs.push({
      round: 1,
      attacker: 'player', // 事件日志统一使用 player 作为 attacker
      action: `[事件] ${event.message}`,
      special: event.type as any,
    });
  });
  
  return logs;
}

/**
 * 将新系统状态转换为旧格式 BattleResult
 */
function convertToBattleResult(
  settlement: ReturnType<typeof settleBattle>,
  battleState: ExtendedBattleState,
  statistics: BattleStatistics
): BattleResult {
  const result: BattleResult = {
    victory: settlement.victory,
    message: settlement.victory ? '战斗胜利！' : '战斗失败',
    playerHpAfter: settlement.playerRemainingHp,
    playerMpAfter: settlement.playerRemainingMp,
    rewards: {
      experience: settlement.rewards?.experience || 0,
      items: settlement.rewards?.items?.map(i => ({
        id: i.id,
        definitionId: '',
        quantity: 1,
        definition: {} as any,
      })),
    },
  };
  
  return result;
}

// ============================================
// 主要战斗函数
// ============================================

/**
 * 自动战斗（用于冒险模式的快速战斗）
 */
export function executeAutoBattle(
  protagonist: Protagonist,
  cellType: CellType,
  enemyContent: string,
  config: DungeonConfig
): { 
  result: BattleResult; 
  battleState: BattleState;
  statistics: BattleStatistics;
} {
  // 解析敌人信息
  const { name: enemyName, level: enemyLevel } = parseEnemyInfo(enemyContent);
  const worldType = protagonist.world.type;
  
  // 创建敌人（传入玩家等级限制稀有度）
  const enemy = createEnemyFromCell(cellType, enemyName, enemyLevel, config, worldType, protagonist.level);
  
  // 创建玩家数据
  const playerData = convertToPlayerData(protagonist);
  
  // 创建战斗状态
  const battleConfig: Partial<BattleConfig> = {
    battleType: cellType === 'boss' ? 'boss' : 'normal',
    canFlee: cellType !== 'boss',
    autoPlay: true,
  };
  
  const extendedState = createBattleState(playerData, enemy, battleConfig);
  const statistics = createBattleStatistics();
  
  // 开始战斗
  startBattle(extendedState);
  
  // 自动战斗直到结束
  const maxRounds = 100;
  let rounds = 0;
  
  while (!extendedState.isOver && rounds < maxRounds) {
    executeAutoPlayerTurn(extendedState, statistics);
    rounds++;
  }
  
  // 结算
  const settlement = settleBattle(extendedState, statistics, enemy);
  
  // 转换为旧格式
  const result = convertToBattleResult(settlement, extendedState, statistics);
  
  // 创建旧格式的 battleState
  const battleState: BattleState = {
    enemyName: `${getEnemyTierConfig(enemy.tier).name !== '普通' ? `【${getEnemyTierConfig(enemy.tier).name}】` : ''}${enemy.name}`,
    enemyMaxHp: enemy.maxHp,
    enemyCurrentHp: extendedState.enemyCurrentHp,
    enemyAttack: enemy.stats.attack,
    enemyDefense: enemy.stats.defense,
    enemyLevel: enemy.level,
    enemyRealm: config.realmName,
    enemyTier: enemy.tier,
    enemyCombatPower: calculateEnemyCombatPower(enemy.maxHp, enemy.stats.attack, enemy.stats.defense, enemy.level, enemy.tier),
    playerMaxHp: extendedState.playerMaxHp,
    playerCurrentHp: extendedState.playerCurrentHp,
    playerMaxMp: extendedState.playerMaxMp,
    playerCurrentMp: extendedState.playerCurrentMp,
    playerAttack: extendedState.playerAttack,
    playerDefense: extendedState.playerDefense,
    playerCombatPower: calculatePlayerCombatPower(protagonist, protagonist.techniques, protagonist.equipments, protagonist.activeEffects),
    logs: [],
    currentRound: extendedState.currentRound,
    isOver: extendedState.isOver,
    victory: extendedState.victory,
  };
  
  // 从历史记录生成日志
  extendedState.actionHistory.forEach(record => {
    battleState.logs.push({
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
  
  return { result, battleState, statistics };
}

/**
 * 交互式战斗初始化
 * 
 * 用于需要玩家手动操作的战斗
 */
export function initInteractiveBattle(
  protagonist: Protagonist,
  cellType: CellType,
  enemyContent: string,
  config: DungeonConfig
): {
  state: ExtendedBattleState;
  statistics: BattleStatistics;
  decisions: DecisionOption[];
} {
  // 解析敌人信息
  const { name: enemyName, level: enemyLevel } = parseEnemyInfo(enemyContent);
  const worldType = protagonist.world.type;
  
  // 创建敌人（传入玩家等级限制稀有度）
  const enemy = createEnemyFromCell(cellType, enemyName, enemyLevel, config, worldType, protagonist.level);
  
  // 创建玩家数据
  const playerData = convertToPlayerData(protagonist);
  
  // 创建战斗状态
  const battleConfig: Partial<BattleConfig> = {
    battleType: cellType === 'boss' ? 'boss' : 'normal',
    canFlee: cellType !== 'boss',
    autoPlay: false,
  };
  
  const state = createBattleState(playerData, enemy, battleConfig);
  const statistics = createBattleStatistics();
  
  // 开始战斗
  startBattle(state);
  
  // 获取可用决策
  const decisions = getCurrentDecisions(state);
  
  return { state, statistics, decisions };
}

/**
 * 初始化塔层战斗（支持多敌人）
 * 
 * 根据塔层配置生成敌人组：
 * - Boss层：1个Boss + 2个精英
 * - 精英层（每5层）：1个精英
 * - 普通层：1个普通敌人
 * 
 * @param protagonist 玩家数据
 * @param floor 塔层
 * @param towerEnemy 可选的塔层敌人数据（用于首通显示）
 */
export function initTowerBattle(
  protagonist: Protagonist,
  floor: number,
  towerEnemy?: TowerEnemy
): {
  state: ExtendedBattleState;
  statistics: BattleStatistics;
  decisions: DecisionOption[];
} {
  const worldType = protagonist.world.type;
  
  // 生成敌人组（包含多敌人逻辑）
  const enemyGroup = generateTowerEnemyGroup(floor, protagonist.level, worldType);
  
  // 创建玩家数据
  const playerData = convertToPlayerData(protagonist);
  
  // 创建战斗状态（使用多敌人版本）
  const battleConfig: Partial<BattleConfig> = {
    battleType: enemyGroup.groupType === 'boss' ? 'boss' : 'normal',
    canFlee: true, // 塔层允许逃跑
    autoPlay: false,
  };
  
  const state = createBattleStateFromGroup(playerData, enemyGroup, battleConfig);
  const statistics = createBattleStatistics();
  
  // 开始战斗
  startBattle(state);
  
  // 获取可用决策
  const decisions = getCurrentDecisions(state);
  
  return { state, statistics, decisions };
}

/**
 * 执行玩家回合并获取下一步决策
 */
export function performPlayerAction(
  action: BattleAction,
  state: ExtendedBattleState,
  statistics: BattleStatistics
): {
  result: TurnResult;
  state: ExtendedBattleState;
  decisions: DecisionOption[];
  statistics: BattleStatistics;
} {
  const result = executePlayerTurn(action, state, statistics);
  
  // 获取下一步决策
  const decisions = state.isOver ? [] : getCurrentDecisions(state);
  
  return { result, state, decisions, statistics };
}

// ============================================
// 辅助函数
// ============================================

/**
 * 检查是否需要手动操作
 */
export function shouldUseManualBattle(
  cellType: CellType,
  playerPreference: 'auto' | 'manual' = 'auto'
): boolean {
  // Boss战强制手动
  if (cellType === 'boss') {
    return true;
  }
  
  // 根据玩家偏好
  return playerPreference === 'manual';
}

/**
 * 预估战斗难度
 */
export function estimateBattleDifficulty(
  protagonist: Protagonist,
  cellType: CellType,
  enemyContent: string,
  config: DungeonConfig
): 'easy' | 'normal' | 'hard' | 'extreme' {
  const { name: enemyName, level: enemyLevel } = parseEnemyInfo(enemyContent);
  const tier = getEnemyTierFromCellType(cellType);
  
  const playerPower = calculatePlayerCombatPower(
    protagonist,
    protagonist.techniques,
    protagonist.equipments,
    protagonist.activeEffects
  );
  
  const enemyHp = calculateEnemyHp(enemyLevel, tier, config.difficultyLevel || 'normal', protagonist.world.type);
  const enemyAttack = calculateEnemyAttack(enemyLevel, tier, config.difficultyLevel || 'normal', protagonist.world.type);
  const enemyDefense = calculateEnemyDefense(enemyLevel, tier, config.difficultyLevel || 'normal', protagonist.world.type);
  const enemyPower = calculateEnemyCombatPower(enemyHp, enemyAttack, enemyDefense, enemyLevel, tier);
  
  const ratio = playerPower / enemyPower;
  
  if (ratio >= 2.0) return 'easy';
  if (ratio >= 1.3) return 'normal';
  if (ratio >= 0.8) return 'hard';
  return 'extreme';
}

/**
 * 获取战斗预览信息
 */
export function getBattlePreview(
  protagonist: Protagonist,
  cellType: CellType,
  enemyContent: string,
  config: DungeonConfig
): {
  enemyName: string;
  enemyLevel: number;
  enemyTier: EnemyTier;
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  recommendedActions: string[];
} {
  const { name: enemyName, level: enemyLevel } = parseEnemyInfo(enemyContent);
  const tier = getEnemyTierFromCellType(cellType);
  const difficulty = estimateBattleDifficulty(protagonist, cellType, enemyContent, config);
  
  // 获取敌人属性
  const attrs = getEnemyAttributes(enemyName, tier === 'boss');
  
  // 推荐行动
  const recommendedActions: string[] = [];
  
  if (attrs.element) {
    recommendedActions.push(`敌人具有${getElementIcon(attrs.element)}${ELEMENT_NAMES[attrs.element]}属性`);
  }
  
  if (difficulty === 'extreme') {
    recommendedActions.push('建议提升等级或装备后再战');
  } else if (difficulty === 'hard') {
    recommendedActions.push('准备充足后再战');
  }
  
  return {
    enemyName,
    enemyLevel,
    enemyTier: tier,
    difficulty,
    recommendedActions,
  };
}
