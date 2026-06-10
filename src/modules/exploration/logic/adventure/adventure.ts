/**
 * 机缘探索系统
 *
 * @note 本模块使用 Math.random() 进行随机生成。计划在后续专项变更中
 * 改造为 seed-based RNG（使用 createRng 工具函数），以提高可测试性。
 * 参见 openspec/changes/archive/2026-06-08-architecture-code-quality-refactor/
 */
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
  calculateDamage,
  calculateCritRate,
  calculateDodgeRate,
  calculateRestHeal,
  COMBAT_CONFIG,
  EXPERIENCE_CONFIG,
  RESOURCE_CONFIG,
  BREAKTHROUGH_CONFIG,
} from '@/modules/progression/logic/balanceConfig';
import {  calculatePlayerCombatPower, calculateEnemyCombatPower } from '@/modules/combat/logic/combatPower';
import {  GAME_CONSTANTS } from '@/shared/utils/constants';
import { 
  handleEventCell,
  quickHandleEvent,
  executeEvent,
  getEventTriggerService,
  DungeonEvent,
  EventExecutionContext,
} from '../dungeon';
import { 
  calculateEnemyEnhancement,
  applyEnemyEnhancement,
  getEnemyEnhancementShortDesc,
} from '@/modules/combat/logic/enemy/enemyEnhancement';
import {  generateRandomEquipment } from '@/modules/equipment/logic/equipment';
import {  
  generateFragmentDrop, 
  addFragmentToInventory,
  FragmentInventory,
  FragmentDropResult 
} from '@/modules/crafting/logic/fragmentSystem';
import {  getRandomItem, getItemById, spiritStoneItems, breakthroughItems } from '@/modules/equipment/logic/items';
import {  getAvailableDifficulties as getRealmDifficulties } from '@/modules/progression/logic/realmSystem';
import {  getTerminology, getDungeonInfo } from '@/modules/narrative/logic/terminology';
import { FlatStats, CellType, AdventureCell, BattleResult, CharacterStats, Protagonist, BattleState, BattleLog, ActiveEffect, InventoryItem, DungeonConfig, WorldType, Technique, Equipment, EnemyTier, createInventoryItem, getFinalStats } from '@/core/types';
import type { DifficultyLevel } from '@/modules/identity/data/worldData';
import type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
import {  getEnemyTierFromCellType, getEnemyTierConfig, ENEMY_TIER_CONFIG } from '@/modules/identity/data/worldData';
import {  generateRandomTechnique } from '@/modules/techniques/logic/technique';
import {  getEnemyNames } from '@/modules/combat/data/enemies';
import {  getDungeonInfo as getDataDungeonInfo } from '@/modules/narrative/data/terminology';
// 克制关系系统
import { 
  getEnemyAttributes,
  getNormalAttackAttributes,
  getTechniqueAttackAttributes,
  getDefenseAttributes,
  calculateRestraintResult,
  formatRestraintDescription,
  getElementIcon,
  getWeaponCategoryIcon,
  ELEMENT_NAMES,
  WEAPON_CATEGORY_NAMES,
  RestraintResult,
  EnemyAttributes,
} from '@/modules/combat/logic/restraintSystem';
// 地牢随机事件系统

// 数值约束工具
import {  clamp, clampNonNegative, applyDamage, applyHeal } from '@/shared/utils/numberUtils';
// 碎片系统

// 随机工具
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// 获取秘境信息（使用统一术语系统）
export function getDungeonNames(worldType: WorldType): { name: string; desc: string; location: string } {
  return getDungeonInfo(worldType);
}

// 根据玩家等级获取可选难度 - 使用统一境界系统
export function getAvailableDifficulties(
  playerLevel: number, 
  worldType: WorldType = '修仙',
  hasCompletedNoviceAdventure: boolean = true,
  isPlayerNewbie: boolean = true // 是否是新手（有未完成的新手任务）
): DungeonConfig[] {
  const difficulties = getRealmDifficulties(worldType, playerLevel);
  
  const result: DungeonConfig[] = difficulties
    .filter(d => d.level <= playerLevel + 20)
    .map(d => {
      // 根据 multiplier 确定难度级别
      let difficultyLevel: 'easy' | 'normal' | 'hard' | 'nightmare';
      if (d.multiplier <= 1.0) {
        difficultyLevel = 'easy';
      } else if (d.multiplier <= 1.5) {
        difficultyLevel = 'normal';
      } else if (d.multiplier <= 2.0) {
        difficultyLevel = 'hard';
      } else {
        difficultyLevel = 'nightmare';
      }
      
      // ========================================
      // 新手友好：低等级区域敌人等级范围更窄
      // ========================================
      let enemyLevelMin: number;
      let enemyLevelMax: number;
      
      if (d.level <= 10) {
        // 低等级区域：敌人等级范围更窄，更容易
        enemyLevelMin = Math.max(1, d.level - 2);
        enemyLevelMax = d.level + 2;
      } else if (d.level <= 30) {
        // 中等级区域：正常范围
        enemyLevelMin = Math.max(1, d.level - 5);
        enemyLevelMax = d.level + 5;
      } else {
        // 高等级区域：更大范围
        enemyLevelMin = Math.max(1, d.level - 8);
        enemyLevelMax = d.level + 8;
      }
      
      return {
        rows: Math.max(5, Math.min(30, 5 + Math.floor(d.level / 5))),
        cols: Math.max(5, Math.min(30, 5 + Math.floor(d.level / 5))),
        difficulty: d.level,
        realmName: d.realmName,
        enemyLevelMin,
        enemyLevelMax,
        rewardMultiplier: d.multiplier,
        portalCount: Math.min(5, Math.floor(d.level / 20) + 1),
        difficultyLevel
      };
    });

  // ========================================
  // 新手难度机缘：首次机缘时添加引导难度
  // 当新手任务全部完成后（isNewbie=false），隐藏新手难度
  // ========================================
  if (!hasCompletedNoviceAdventure && isPlayerNewbie) {
    const noviceLevel = Math.max(1, playerLevel - 2);
    const noviceDifficulty: DungeonConfig = {
      rows: 5,
      cols: 5,
      difficulty: noviceLevel,
      realmName: '【新手引导】初试机缘',
      enemyLevelMin: Math.max(1, noviceLevel - 1),
      enemyLevelMax: noviceLevel + 1,
      rewardMultiplier: 0.8, // 奖励略低
      portalCount: 1,
      difficultyLevel: 'easy',
      isNovice: true // 标记为新手难度
    };
    
    // 将新手难度插入到列表最前面
    result.unshift(noviceDifficulty);
  }
  
  return result;
}

// 获取世界类型对应的敌人名称
function getEnemyNamesForWorld(worldType: WorldType): { low: string[]; mid: string[]; high: string[]; boss: string[] } {
  return getEnemyNames(worldType);
}

// 计算战斗增益
function calculateCombatBoost(activeEffects: ActiveEffect[]): number {
  let totalBoost = 0;
  for (const effect of activeEffects) {
    if (effect.type === 'combat_boost') {
      totalBoost += effect.value;
    }
  }
  return totalBoost;
}

// 生成机缘冒险地图
export function generateAdventureGrid(config: DungeonConfig, worldType: WorldType = '修仙'): AdventureCell[][] {
  const { rows, cols, portalCount, difficulty } = config;
  const grid: AdventureCell[][] = [];
  const enemies = getEnemyNamesForWorld(worldType);
  
  // 计算可分配的格子数（排除第一行和Boss位置）
  const totalCells = rows * cols;
  const firstRowCells = cols; // 第一行都是空格
  const bossCell = 1; // Boss位置
  const distributableCells = totalCells - firstRowCells - bossCell;
  
  // 固定比例配置（基础比例，难度会微调）
  const baseRatios = {
    treasure: 0.10,      // 10% 宝箱
    miniboss: 0.02,      // 2% 小Boss
    elite: 0.05,         // 5% 精英
    enemy: 0.15,         // 15% 普通敌人
    event: 0.15,         // 15% 事件
    rest: 0.12,          // 12% 休息
    empty: 0.41,         // 41% 空格
  };
  
  // 根据难度微调敌人比例（难度越高，敌人越多，空格越少）
  const difficultyBonus = difficulty * 0.0005; // 每点难度增加0.05%敌人
  const adjustedRatios = {
    treasure: baseRatios.treasure,
    miniboss: baseRatios.miniboss + difficultyBonus * 2, // 难度对小Boss影响更大
    elite: baseRatios.elite + difficultyBonus * 3,
    enemy: baseRatios.enemy + difficultyBonus * 5,
    event: baseRatios.event,
    rest: baseRatios.rest,
    empty: Math.max(0.20, baseRatios.empty - difficultyBonus * 10), // 空格最少20%
  };
  
  // 根据比例计算每种类型的数量
  const counts: { [key: string]: number } = {
    treasure: Math.round(distributableCells * adjustedRatios.treasure),
    miniboss: Math.round(distributableCells * adjustedRatios.miniboss),
    elite: Math.round(distributableCells * adjustedRatios.elite),
    enemy: Math.round(distributableCells * adjustedRatios.enemy),
    event: Math.round(distributableCells * adjustedRatios.event),
    rest: Math.round(distributableCells * adjustedRatios.rest),
    empty: 0, // 初始化为0，后面计算
  };
  
  // 确保关键格子类型至少有最小数量（确保每种类型都存在）
  const minCounts = {
    treasure: 1,     // 至少1个宝箱
    miniboss: 1,     // 至少1个小Boss
    elite: 1,        // 至少1个精英
    event: 1,        // 至少1个事件格
    rest: 1,         // 至少1个休息格
    enemy: 2,        // 至少2个敌人
  };
  
  // 应用最小数量保证
  counts.treasure = Math.max(counts.treasure, minCounts.treasure);
  counts.miniboss = Math.max(counts.miniboss, minCounts.miniboss);
  counts.elite = Math.max(counts.elite, minCounts.elite);
  counts.event = Math.max(counts.event, minCounts.event);
  counts.rest = Math.max(counts.rest, minCounts.rest);
  counts.enemy = Math.max(counts.enemy, minCounts.enemy);
  
  // 计算空格数量（剩余的都是空格）
  counts.empty = distributableCells - counts.treasure - counts.miniboss - counts.elite - counts.enemy - counts.event - counts.rest;
  
  // 如果空格为负数，优先从空格中扣除，然后从敌人数量中扣除
  if (counts.empty < 0) {
    // 先尝试减少敌人数量，但保持最小值
    const excess = -counts.empty;
    if (counts.enemy > minCounts.enemy) {
      const reduce = Math.min(excess, counts.enemy - minCounts.enemy);
      counts.enemy -= reduce;
      counts.empty += reduce;
    }
    // 如果还是负数，就设为0，接受格子总数可能略少的情况
    if (counts.empty < 0) {
      counts.empty = 0;
    }
  }
  
  // 创建格子类型数组
  const cellTypes: CellType[] = [];
  Object.entries(counts).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      cellTypes.push(type as CellType);
    }
  });
  
  // 打乱顺序
  for (let i = cellTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cellTypes[i], cellTypes[j]] = [cellTypes[j], cellTypes[i]];
  }
  
  // 填充网格
  let cellIndex = 0;
  for (let row = 0; row < rows; row++) {
    const rowCells: AdventureCell[] = [];
    for (let col = 0; col < cols; col++) {
      let type: CellType;
      
      if (row === 0) {
        // 第一行都是空格（起点）
        type = 'empty';
      } else if (row === rows - 1 && col === Math.floor(cols / 2)) {
        // Boss位置
        type = 'boss';
      } else {
        // 从打乱的数组中取类型
        type = cellTypes[cellIndex++] || 'empty'; // 默认为空格
      }
      
      rowCells.push({
        type,
        cleared: false,
        content: getCellContent(type, row, rows, config, enemies),
        visited: false
      });
    }
    grid.push(rowCells);
  }
  
  // 只在地图足够大时（9x9=81格以上）添加传送门
  // 小地图不需要传送门，避免浪费格子空间
  // 同时，低难度机缘（difficulty <= 20）也不生成传送门，保持简单
  if (totalCells >= 81 && config.difficulty > 20 && !config.isNovice) {
    addPortals(grid, portalCount);
  }
  grid[0][Math.floor(cols / 2)].visited = true;
  
  return grid;
}

// 添加传送门
function addPortals(grid: AdventureCell[][], portalCount: number) {
  const rows = grid.length;
  const cols = grid[0].length;
  
  const availableCells: { row: number; col: number }[] = [];
  for (let row = 1; row < rows - 1; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col].type === 'empty' || grid[row][col].type === 'event') {
        availableCells.push({ row, col });
      }
    }
  }
  
  for (let i = 0; i < portalCount && availableCells.length >= 2; i++) {
    const idx1 = random(0, availableCells.length - 1);
    const pos1 = availableCells[idx1];
    availableCells.splice(idx1, 1);
    
    const idx2 = random(0, availableCells.length - 1);
    const pos2 = availableCells[idx2];
    availableCells.splice(idx2, 1);
    
    grid[pos1.row][pos1.col] = {
      type: 'portal',
      cleared: false,
      content: `传送门→(${pos2.row + 1},${pos2.col + 1})`,
      portalTarget: pos2,
      visited: false
    };
    
    grid[pos2.row][pos2.col] = {
      type: 'portal',
      cleared: false,
      content: `传送门→(${pos1.row + 1},${pos1.col + 1})`,
      portalTarget: pos1,
      visited: false
    };
  }
}

// 获取格子内容描述
function getCellContent(
  type: CellType, 
  row: number, 
  totalRows: number, 
  config: DungeonConfig,
  enemies: { low: string[]; mid: string[]; high: string[]; boss: string[] }
): string {
  const { enemyLevelMin, enemyLevelMax } = config;
  
  switch (type) {
    case 'treasure':
      return '宝箱';
      
    case 'enemy':
    case 'elite':
    case 'miniboss':
      const progressRatio = row / totalRows;
      let namePool: string[];
      let levelRange: [number, number];
      
      // 根据进度选择敌人池
      if (progressRatio < 0.4) {
        namePool = enemies.low;
        levelRange = [enemyLevelMin, Math.floor((enemyLevelMin + enemyLevelMax) / 2)];
      } else if (progressRatio < 0.7) {
        namePool = enemies.mid;
        levelRange = [Math.floor((enemyLevelMin + enemyLevelMax) / 2), enemyLevelMax];
      } else {
        namePool = enemies.high;
        levelRange = [enemyLevelMax - 2, enemyLevelMax + 2];
      }
      
      // 根据敌人类型调整等级
      let levelBonus = 0;
      let prefix = '';
      
      if (type === 'elite') {
        levelBonus = 2;
        prefix = '【精英】';
      } else if (type === 'miniboss') {
        levelBonus = 5;
        prefix = '【小Boss】';
        // 小Boss使用Boss名字池
        namePool = enemies.boss;
      }
      
      const enemyName = randomItem(namePool);
      const enemyLevel = random(levelRange[0], levelRange[1]) + levelBonus;
      return `${prefix}${enemyName} Lv.${enemyLevel}`;
      
    case 'boss':
      const bossName = randomItem(enemies.boss);
      // Boss等级计算 - 新手友好优化
      // 低难度机缘(<=10)：Boss等级仅比最高敌人高2级，确保新手可击败
      // 中等难度(11-30)：Boss等级比最高敌人高5级
      // 高难度(>30)：Boss等级比最高敌人高8级（原设计）
      let bossLevelBonus: number;
      if (config.difficulty <= 10) {
        bossLevelBonus = 2; // 新手区域：Boss等级 = enemyLevelMax + 2
      } else if (config.difficulty <= 30) {
        bossLevelBonus = 5; // 中等难度
      } else {
        bossLevelBonus = 8; // 高难度：保持原设计
      }
      const bossLevel = enemyLevelMax + bossLevelBonus;
      return `【Boss】${bossName} Lv.${bossLevel}`;
      
    case 'event':
      return '神秘事件';
    case 'rest':
      return '休息点';
    case 'portal':
      return '传送门';
    default:
      return '';
  }
}

// 解析敌人信息
export function parseEnemyInfo(content: string): { name: string; level: number } {
  // 支持多种格式：
  // - 【精英】XXX Lv.Y
  // - 【Boss】XXX Lv.Y
  // - XXX Lv.Y
  // - XXX(Lv.Y)
  const match = content.match(/(?:【[^】]+】)?(.+?)\s*\(?\s*Lv\.(\d+)\s*\)?/);
  if (match) {
    return { name: match[1].trim(), level: parseInt(match[2]) };
  }
  return { name: content, level: 1 };
}

// 执行单回合战斗 - 使用新的伤害计算
function executeBattleRound(
  state: BattleState,
  playerAttack: number,
  playerDefense: number,
  playerLuck: number,
  enemyAttributes: EnemyAttributes,
  playerMeleeWeapon: Equipment | null,
  playerRangedWeapon: Equipment | null
): BattleLog[] {
  const logs: BattleLog[] = [];
  const isBoss = state.enemyMaxHp > 200;
  const attackTechniques = (state as any).attackTechniques || [];
  
  // ========================================
  // 玩家普通攻击 - 使用武器属性
  // ========================================
  const critRate = calculateCritRate(playerLuck);
  const isCrit = Math.random() < critRate;
  const levelDiff = state.enemyLevel - (state as any).playerLevel || 1;
  
  let playerDamage = calculateDamage(playerAttack, state.enemyDefense, -levelDiff);
  if (isCrit) {
    playerDamage = Math.floor(playerDamage * COMBAT_CONFIG.critDamageMultiplier);
  }
  
  // 计算克制关系 - 普通攻击使用武器属性
  const weaponAttrs = getNormalAttackAttributes(playerMeleeWeapon, playerRangedWeapon);
  const normalAttackRestraint = calculateRestraintResult(
    weaponAttrs.element,
    enemyAttributes.element,
    weaponAttrs.weaponCategory,
    enemyAttributes.weaponCategory
  );
  
  // 应用克制效果
  playerDamage = Math.floor(playerDamage * normalAttackRestraint.damageMultiplier);
  
  // 伤害上限机制 - 防止一击必杀
  let maxDamageRatio = COMBAT_CONFIG.maxDamageRatioToHp;
  if (isBoss) {
    maxDamageRatio *= COMBAT_CONFIG.bossDamageRatioModifier;
  }
  if (isCrit) {
    maxDamageRatio *= COMBAT_CONFIG.critDamageRatioModifier;
  }
  const maxDamage = Math.floor(state.enemyMaxHp * maxDamageRatio);
  const minDamage = Math.floor(playerAttack * COMBAT_CONFIG.minimumDamageRatio);
  
  playerDamage = Math.min(playerDamage, maxDamage);
  playerDamage = Math.max(playerDamage, minDamage);
  
  // 应用伤害
  state.enemyCurrentHp = applyDamage(state.enemyCurrentHp, playerDamage, state.enemyMaxHp);
  
  // 构建战斗日志
  let actionText = isCrit ? `你发动暴击攻击！` : `你发动攻击`;
  if (normalAttackRestraint.restraintType !== 'neutral') {
    const restraintText = formatRestraintDescription(normalAttackRestraint, '你', state.enemyName);
    actionText += ` ${restraintText}`;
  }
  
  logs.push({
    round: state.currentRound,
    attacker: 'player',
    action: actionText,
    damage: playerDamage,
    special: isCrit ? 'crit' : (normalAttackRestraint.restraintType === 'counter' ? 'restraint_counter' : 
                normalAttackRestraint.restraintType === 'countered' ? 'restraint_countered' :
                normalAttackRestraint.restraintType === 'mutual' ? 'restraint_mutual' : undefined)
  });
  
  // ========================================
  // 功法触发检查 - 使用功法属性
  // ========================================
  for (const technique of attackTechniques) {
    if (state.playerCurrentMp < technique.mpCost) {
      continue;
    }
    
    if (Math.random() < GAME_CONSTANTS.TECHNIQUE_TRIGGER_RATE) {
      state.playerCurrentMp = Math.max(0, state.playerCurrentMp - technique.mpCost);
      
      let techniqueDamage = Math.floor(playerAttack * (1 + technique.power / 100) * (1 + technique.bonus / 100));
      
      // 计算克制关系 - 功法攻击使用功法属性
      const techniqueAttrs = getTechniqueAttackAttributes(technique);
      const techniqueRestraint = calculateRestraintResult(
        techniqueAttrs.element,
        enemyAttributes.element,
        techniqueAttrs.weaponCategory,
        enemyAttributes.weaponCategory
      );
      
      // 应用克制效果
      techniqueDamage = Math.floor(techniqueDamage * techniqueRestraint.damageMultiplier);
      
      const techniqueMaxDamage = Math.floor(state.enemyMaxHp * maxDamageRatio * 1.2);
      techniqueDamage = Math.min(techniqueDamage, techniqueMaxDamage);
      
      state.enemyCurrentHp = applyDamage(state.enemyCurrentHp, techniqueDamage, state.enemyMaxHp);
      
      // 构建功法日志
      let techniqueAction = `功法「${technique.name}」触发！消耗${technique.mpCost}法力`;
      if (techniqueRestraint.restraintType !== 'neutral') {
        const restraintText = formatRestraintDescription(techniqueRestraint, technique.name, state.enemyName);
        techniqueAction += ` ${restraintText}`;
      }
      
      logs.push({
        round: state.currentRound,
        attacker: 'player',
        action: techniqueAction,
        damage: techniqueDamage,
        special: techniqueRestraint.restraintType === 'counter' ? 'restraint_counter' : 
                 techniqueRestraint.restraintType === 'countered' ? 'restraint_countered' :
                 techniqueRestraint.restraintType === 'mutual' ? 'restraint_mutual' : 'technique'
      });
    }
  }
  
  if (state.enemyCurrentHp <= 0) {
    state.isOver = true;
    state.victory = true;
    logs.push({
      round: state.currentRound,
      attacker: 'player',
      action: `击败了${state.enemyName}！`,
      special: 'victory'
    });
    return logs;
  }
  
  // ========================================
  // 敌人反击
  // ========================================
  const dodgeRate = calculateDodgeRate(playerLuck);
  const isDodge = Math.random() < dodgeRate;
  
  if (isDodge) {
    logs.push({
      round: state.currentRound,
      attacker: 'enemy',
      action: `${state.enemyName}发动攻击，你闪避成功！`,
      damage: 0,
      special: 'dodge'
    });
  } else {
    let enemyDamage = calculateDamage(state.enemyAttack, playerDefense, levelDiff);
    
    // 计算克制关系 - 玩家防御使用武器属性
    const defenseAttrs = getDefenseAttributes(playerMeleeWeapon, playerRangedWeapon);
    const defenseRestraint = calculateRestraintResult(
      enemyAttributes.element,
      defenseAttrs.element,
      enemyAttributes.weaponCategory,
      defenseAttrs.weaponCategory
    );
    
    // 敌人攻击时使用 receivedMultiplier（玩家视角）
    enemyDamage = Math.floor(enemyDamage * defenseRestraint.receivedMultiplier);
    
    const enemyMaxDamage = Math.floor(state.playerMaxHp * COMBAT_CONFIG.maxDamageRatioToHp);
    enemyDamage = Math.min(enemyDamage, enemyMaxDamage);
    
    state.playerCurrentHp = applyDamage(state.playerCurrentHp, enemyDamage, state.playerMaxHp);
    
    // 构建敌人反击日志
    let enemyAction = `${state.enemyName}反击`;
    if (defenseRestraint.restraintType !== 'neutral') {
      // 反转克制描述
      if (defenseRestraint.restraintType === 'counter') {
        // 玩家武器克制敌人，但这是敌人攻击玩家，所以是玩家被克
        enemyAction += `，你的属性被克制！`;
      } else if (defenseRestraint.restraintType === 'countered') {
        enemyAction += `，你的属性克制敌人！`;
      } else if (defenseRestraint.restraintType === 'mutual') {
        enemyAction += `，光暗对决！双方伤害+20%`;
      }
    }
    
    logs.push({
      round: state.currentRound,
      attacker: 'enemy',
      action: enemyAction,
      damage: enemyDamage
    });
    
    if (state.playerCurrentHp <= 0) {
      state.isOver = true;
      state.victory = false;
      logs.push({
        round: state.currentRound,
        attacker: 'enemy',
        action: `你被${state.enemyName}击败了！`,
        special: 'defeat'
      });
    }
  }
  
  return logs;
}

// 执行完整战斗 - 使用统一数值系统
export function calculateBattleWithLogs(
  protagonist: Protagonist,
  cellType: CellType,
  enemyName: string,
  enemyLevel: number,
  config: DungeonConfig
): { result: BattleResult; battleState: BattleState } {
  const stats = getFinalStats(protagonist.stats);
  const enemyTier = getEnemyTierFromCellType(cellType);
  const tierConfig = getEnemyTierConfig(enemyTier);
  const worldType = protagonist.world.type;
  const difficultyLevel = config.difficultyLevel || 'normal';
  
  // 使用统一的数值计算
  let playerAttack = calculatePlayerAttack(stats.体质, stats.灵根, protagonist.level, worldType);
  let playerDefense = calculatePlayerDefense(stats.意志, protagonist.level, worldType);
  
  // 应用功法加成（支持多槽位）
  const attackTechniques = protagonist.equippedAttackTechniques || [];
  const defenseTechniques = protagonist.equippedDefenseTechniques || [];
  
  let techniqueAttackBonus = 0;
  for (const technique of attackTechniques) {
    if (technique) {
      techniqueAttackBonus += technique.bonus;
    }
  }
  if (techniqueAttackBonus > 0) {
    playerAttack = Math.floor(playerAttack * (1 + techniqueAttackBonus / 100));
  }
  
  let techniqueDefenseBonus = 0;
  for (const technique of defenseTechniques) {
    if (technique) {
      techniqueDefenseBonus += technique.bonus;
    }
  }
  if (techniqueDefenseBonus > 0) {
    playerDefense = Math.floor(playerDefense * (1 + techniqueDefenseBonus / 100));
  }
  
  // 应用装备加成
  if (protagonist.equippedMelee) {
    playerAttack = Math.floor(playerAttack * (1 + protagonist.equippedMelee.attackBonus / 100));
  }
  if (protagonist.equippedRanged) {
    playerAttack = Math.floor(playerAttack * (1 + protagonist.equippedRanged.attackBonus / 100));
  }
  if (protagonist.equippedHead) {
    playerDefense = Math.floor(playerDefense * (1 + protagonist.equippedHead.defenseBonus / 100));
  }
  if (protagonist.equippedBody) {
    playerDefense = Math.floor(playerDefense * (1 + protagonist.equippedBody.defenseBonus / 100));
  }
  if (protagonist.equippedLegs) {
    playerDefense = Math.floor(playerDefense * (1 + protagonist.equippedLegs.defenseBonus / 100));
  }
  if (protagonist.equippedFeet) {
    playerDefense = Math.floor(playerDefense * (1 + protagonist.equippedFeet.defenseBonus / 100));
  }
  
  const playerMaxHp = protagonist.maxHp || calculatePlayerMaxHp(stats.体质, protagonist.level, worldType);
  // 使用玩家当前HP（如果有机缘中受伤），并确保在有效范围内
  const playerCurrentHp = clamp(protagonist.currentHp || playerMaxHp, 0, playerMaxHp);
  
  const playerMaxMp = protagonist.maxMp || calculatePlayerMaxMp(stats.灵根, protagonist.level, worldType);
  const playerCurrentMp = clamp(protagonist.currentMp || playerMaxMp, 0, playerMaxMp);
  
  // 敌人数值 - 使用敌人分级系统
  // 传入 difficultyValue 用于新手Boss判断
  let enemyMaxHp = calculateEnemyHp(enemyLevel, enemyTier, difficultyLevel, worldType, true, config.difficulty);
  let enemyAttack = calculateEnemyAttack(enemyLevel, enemyTier, difficultyLevel, worldType, true, config.difficulty);
  let enemyDefense = calculateEnemyDefense(enemyLevel, enemyTier, difficultyLevel, worldType, true, config.difficulty);
  
  // 应用敌人增强系统（虚拟功法+装备）
  // 传入 difficultyValue 用于新手区域判断
  const enemyEnhancement = calculateEnemyEnhancement(enemyLevel, enemyTier, config.difficulty);
  const enhancedStats = applyEnemyEnhancement(enemyMaxHp, enemyAttack, enemyDefense, enemyEnhancement);
  enemyMaxHp = enhancedStats.hp;
  enemyAttack = enhancedStats.attack;
  enemyDefense = enhancedStats.defense;
  
  // 获取敌人等级名称
  const tierName = tierConfig.name;
  
  // 敌人增强描述（用于战斗日志）
  const enhancementDesc = getEnemyEnhancementShortDesc(enemyEnhancement);
  
  // 计算战力
  const playerCombatPower = calculatePlayerCombatPower(
    protagonist,
    protagonist.techniques,
    protagonist.equipments,
    protagonist.activeEffects
  );
  const enemyCombatPower = calculateEnemyCombatPower(
    enemyMaxHp,
    enemyAttack,
    enemyDefense,
    enemyLevel,
    enemyTier
  );
  
  const battleState: BattleState = {
    enemyName: `${tierName !== '普通' ? `【${tierName}】` : ''}${enemyName}`,
    enemyMaxHp,
    enemyCurrentHp: enemyMaxHp,
    enemyAttack,
    enemyDefense,
    enemyLevel,
    enemyRealm: config.realmName,
    enemyTier,
    enemyCombatPower,
    playerMaxHp,
    playerCurrentHp,
    playerMaxMp,
    playerCurrentMp,
    playerAttack,
    playerDefense,
    playerCombatPower,
    logs: [],
    currentRound: 0,
    isOver: false,
    victory: undefined
  };
  
  // 存储玩家等级和功法信息用于战斗计算
  (battleState as any).playerLevel = protagonist.level;
  (battleState as any).attackTechniques = attackTechniques.filter((t): t is Technique => t !== null);
  
  // 获取敌人属性（用于克制关系判定）
  const enemyAttrs = getEnemyAttributes(enemyName, enemyTier === 'boss');
  (battleState as any).enemyAttributes = enemyAttrs;
  
  // 如果敌人有属性，在战斗开始时显示
  if (enemyAttrs.element || enemyAttrs.weaponCategory) {
    const attrParts: string[] = [];
    if (enemyAttrs.element) {
      attrParts.push(`${getElementIcon(enemyAttrs.element)}${ELEMENT_NAMES[enemyAttrs.element]}属性`);
    }
    if (enemyAttrs.weaponCategory) {
      attrParts.push(`${getWeaponCategoryIcon(enemyAttrs.weaponCategory)}${WEAPON_CATEGORY_NAMES[enemyAttrs.weaponCategory]}类`);
    }
    battleState.logs.push({
      round: 0,
      attacker: 'enemy',
      action: `${enemyName}散发着${attrParts.join('、')}的气息`,
      special: 'enemy_attributes'
    });
  }
  
  // 如果敌人有增强，添加开场描述
  if (enhancementDesc) {
    battleState.logs.push({
      round: 0,
      attacker: 'enemy',
      action: `${enemyName}散发强大气息：${enhancementDesc}`,
      special: 'enemy_enhancement'
    });
  }
  
  // 战斗循环
  while (!battleState.isOver && battleState.currentRound < COMBAT_CONFIG.maxRounds) {
    battleState.currentRound++;
    const roundLogs = executeBattleRound(
      battleState, 
      playerAttack, 
      playerDefense, 
      stats.幸运,
      (battleState as any).enemyAttributes,
      protagonist.equippedMelee,
      protagonist.equippedRanged
    );
    battleState.logs.push(...roundLogs);
  }
  
  // 超时判定 - 使用 HP 百分比（修复 BUG-004）
  if (!battleState.isOver) {
    battleState.isOver = true;
    
    // 计算双方剩余 HP 百分比
    const playerHpPercent = clamp(battleState.playerCurrentHp / Math.max(1, battleState.playerMaxHp), 0, 1);
    const enemyHpPercent = clamp(battleState.enemyCurrentHp / Math.max(1, battleState.enemyMaxHp), 0, 1);
    
    // 百分比高者获胜，相同时使用战力判定
    if (playerHpPercent > enemyHpPercent) {
      battleState.victory = true;
    } else if (playerHpPercent < enemyHpPercent) {
      battleState.victory = false;
    } else {
      // 百分比相同，使用战力比较
      battleState.victory = battleState.playerCombatPower >= battleState.enemyCombatPower;
    }
    
    battleState.logs.push({
      round: battleState.currentRound,
      attacker: 'player',
      action: battleState.victory 
        ? `战斗僵持，你略占上风！(HP: ${Math.floor(playerHpPercent * 100)}% vs ${Math.floor(enemyHpPercent * 100)}%)`
        : `战斗僵持，敌人更强！(HP: ${Math.floor(playerHpPercent * 100)}% vs ${Math.floor(enemyHpPercent * 100)}%)`,
      special: 'draw'
    });
  }
  
  const result = calculateBattleRewards(protagonist, cellType, battleState.victory!, config, enemyLevel);
  result.battleState = battleState;
  
  // ========================================
  // 修复：确保HP在有效范围内 [0, maxHp]
  // ========================================
  battleState.playerCurrentHp = Math.max(0, Math.min(battleState.playerCurrentHp, playerMaxHp));
  
  // 保存战斗后的HP和MP
  result.playerHpAfter = battleState.playerCurrentHp;
  result.playerMpAfter = battleState.playerCurrentMp;
  
  return { result, battleState };
}

// 计算战斗奖励 - 使用敌人分级系统
// 集成碎片掉落系统
/**
 * 计算战斗奖励（平衡性重构版）
 * 
 * 【关键改动】
 * - 移除了完整功法/装备的直接掉落
 * - 只通过碎片掉落系统提供功法/装备
 * - 碎片需要收集足够数量后合成
 */
function calculateBattleRewards(
  protagonist: Protagonist,
  cellType: CellType,
  victory: boolean,
  config: DungeonConfig,
  enemyLevel: number
): BattleResult & { fragmentDrop?: FragmentDropResult } {
  const enemyTier = getEnemyTierFromCellType(cellType);
  const tierConfig = getEnemyTierConfig(enemyTier);
  const worldType = protagonist.world.type;
  const difficultyLevel = config.difficultyLevel || 'normal';
  const playerLevel = protagonist.level;
  
  if (victory) {
    const statGains: Partial<FlatStats> = {};
    const itemGains: InventoryItem[] = [];
    
    // 【关键改动】碎片掉落 - 现在是唯一的功法/装备获取途径
    // 传入 playerLevel 和 worldType 确保稀有度限制生效
    const luck = getFinalStats(protagonist.stats).幸运 || 0;
    const fragmentDrop = generateFragmentDrop(enemyLevel, enemyTier, luck, worldType, playerLevel);
    
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
    
    // 灵石奖励 - 使用敌人分级计算
    const spiritStones = calculateBattleSpiritStones(enemyLevel, enemyTier, difficultyLevel, worldType);
    itemGains.push(createInventoryItem(spiritStoneItems[0], spiritStones));
    
    // 经验奖励 - 使用敌人分级计算
    const expReward = calculateBattleExp(enemyLevel, enemyTier, difficultyLevel, worldType);
    
    // 根据敌人等级给予不同奖励
    switch (enemyTier) {
      case 'boss':
        // Boss奖励 - 最丰厚
        statGains.体质 = random(3, 5);
        statGains.意志 = random(2, 4);
        statGains.灵根 = random(2, 3);
        statGains.悟性 = random(1, 2);
        
        const breakthroughPill = breakthroughItems[Math.min(Math.floor(enemyLevel / 30), 2)];
        itemGains.push(createInventoryItem(breakthroughPill, 2));
        
        const rareItem = getRandomItem(config.difficulty);
        if (rareItem) {
          itemGains.push(createInventoryItem(rareItem, 2));
        }
        // 【已移除】完整功法直接掉落
        // 【已移除】完整装备直接掉落
        break;
        
      case 'miniboss':
        // 小Boss奖励
        statGains.体质 = random(2, 3);
        statGains.意志 = random(1, 2);
        statGains.灵根 = random(1, 2);
        
        if (Math.random() < GAME_CONSTANTS.EVENT_COMMON_RATE) {
          const pill = breakthroughItems[Math.min(Math.floor(enemyLevel / 40), 2)];
          itemGains.push(createInventoryItem(pill, 1));
        }
        // 【已移除】完整功法直接掉落
        // 【已移除】完整装备直接掉落
        break;
        
      case 'elite':
        // 精英敌人奖励
        statGains.体质 = random(1, 2);
        statGains.意志 = random(0, 1);
        
        if (Math.random() < GAME_CONSTANTS.EVENT_RARE_BASE_RATE + config.difficulty * GAME_CONSTANTS.EVENT_RARE_DIFFICULTY_FACTOR) {
          const item = getRandomItem(config.difficulty);
          if (item) {
            itemGains.push(createInventoryItem(item, 1));
          }
        }
        // 【已移除】完整功法直接掉落
        // 【已移除】完整装备直接掉落
        break;
        
      default:
        // 普通敌人奖励
        statGains.体质 = random(0, 1);
        statGains.意志 = random(0, 1);
        
        if (Math.random() < GAME_CONSTANTS.EVENT_DANGER_BASE_RATE + config.difficulty * GAME_CONSTANTS.EVENT_DANGER_DIFFICULTY_FACTOR) {
          const item = getRandomItem(config.difficulty);
          if (item) {
            itemGains.push(createInventoryItem(item, 1));
          }
        }
        // 【已移除】完整功法直接掉落
        // 【已移除】完整装备直接掉落
        break;
    }
    
    // 生成战斗胜利消息
    let message = `战斗胜利！击败了${enemyLevel}级的${tierConfig.name}敌人！`;
    
    // 掉落消息（完整物品 + 碎片）
    if (fragmentDrop.log) {
      message += `\n${fragmentDrop.log}`;
    }
    
    // 【设计说明】属性增长不再通过战斗获得
    // 属性增长应该来自修炼突破，而不是战斗胜利
    // statGains 仅用于内部计算，不再返回给调用方
    
    return {
      victory: true,
      message,
      rewards: {
        // stats: statGains, // 【已移除】属性增长通过突破获得，不再通过战斗
        items: itemGains,
        experience: expReward,
        // 【修复】将碎片放入 rewards.fragments，确保 useAdventure 能正确处理
        fragments: fragmentDrop.fragments,
        // 【新增】完整物品掉落（普通/稀有品质直接获得完整物品）
        techniques: droppedTechniques.length > 0 ? droppedTechniques : undefined,
        equipments: droppedEquipments.length > 0 ? droppedEquipments : undefined,
      },
      fragmentDrop,
    };
  } else {
    // ========================================
    // 新手保护机制（等级 1-8）
    // 扩大保护范围，确保新手能顺利通过Boss关卡
    // ========================================
    const playerLevel = protagonist.level;
    const isNewbie = playerLevel <= 8;  // 从5级扩展到8级
    
    // 失败惩罚 - 根据敌人等级调整
    const tierMultiplier = tierConfig.rewardMultiplier;
    const baseSpiritStoneLoss = Math.floor((20 + enemyLevel * 3) * tierMultiplier * 0.5);
    
    // 新手保护：等级 1-8 战斗失败不损失灵石
    const spiritStoneLoss = isNewbie ? 0 : baseSpiritStoneLoss;
    
    // 失败仍然获得少量经验（鼓励继续尝试）
    const expGain = Math.floor(5 * (1 + enemyLevel * 0.1));
    
    // 新手提示
    const message = isNewbie
      ? `战斗失败！你被${enemyLevel}级的${tierConfig.name}敌人击败。${isNewbie ? '\n\n【新手保护】等级1-8战斗失败不损失灵石，请继续努力修炼！' : ''}`
      : `战斗失败！你被${enemyLevel}级的${tierConfig.name}敌人击败，损失了${spiritStoneLoss}灵石。`;
    
    return {
      victory: false,
      message,
      rewards: {
        items: spiritStoneLoss > 0 ? [createInventoryItem(spiritStoneItems[0], -spiritStoneLoss)] : [],
        experience: expGain
      }
    };
  }
}

// 获取相邻可移动格子
export function getAdjacentCells(grid: AdventureCell[][], position: { row: number; col: number }): { row: number; col: number }[] {
  const adjacent: { row: number; col: number }[] = [];
  const { row, col } = position;
  
  if (row > 0) adjacent.push({ row: row - 1, col });
  if (row < grid.length - 1) adjacent.push({ row: row + 1, col });
  if (col > 0) adjacent.push({ row, col: col - 1 });
  if (col < grid[0].length - 1) adjacent.push({ row, col: col + 1 });
  
  return adjacent;
}

// 处理非战斗格子事件
export function handleCellEvent(
  protagonist: Protagonist,
  cell: AdventureCell,
  config: DungeonConfig
): BattleResult {
  switch (cell.type) {
    case 'rest':
      // 休息格：恢复HP和MP（最多恢复到上限）
      const healed = calculateRestHeal(
        protagonist.maxHp,
        protagonist.maxMp
      );
      // 实际恢复量 = 恢复量 和 (上限-当前值) 的较小值，确保不会出现负值
      const hpHealed = Math.max(0, Math.min(healed.hp, protagonist.maxHp - protagonist.currentHp));
      const mpHealed = Math.max(0, Math.min(healed.mp, protagonist.maxMp - protagonist.currentMp));
      
      // 如果没有恢复任何值，显示满状态消息
      const healMessage = hpHealed === 0 && mpHealed === 0 
        ? '在休息点休息，你的状态已经很好了。'
        : `在休息点休息，恢复了${hpHealed}点生命值${mpHealed > 0 ? `和${mpHealed}点法力值` : ''}。`;
      
      return {
        victory: true,
        message: healMessage,
        rewards: undefined, // 休息格没有奖励，不返回 rewards 对象
        hpRestored: hpHealed,
        mpRestored: mpHealed,
      };
      
    case 'treasure': {
      // 宝箱格：获得灵石、物品、碎片、功法、装备等丰富奖励
      const resourceAmount = Math.floor((random(20, 50) + config.difficulty * 2) * config.rewardMultiplier);
      const resourceName = getTerminology(protagonist.world.type).resource;
      const items: InventoryItem[] = [
        createInventoryItem(spiritStoneItems[0], resourceAmount)
      ];
      
      // 初始化碎片和完整物品掉落
      const fragments: FragmentDropResult['fragments'] = [];
      const completeItems: FragmentDropResult['completeItems'] = [];
      
      // 30%概率获得额外物品（消耗品）
      if (Math.random() < GAME_CONSTANTS.TREASURE_FIND_RATE) {
        const item = getRandomItem(config.difficulty);
        if (item) {
          items.push(createInventoryItem(item, 1));
        }
      }
      
      // 【新增】15%概率获得碎片/完整物品（参考战斗系统掉落逻辑）
      if (Math.random() < 0.15) {
        const playerLevel = protagonist.level;
        const luck = getFinalStats(protagonist.stats).幸运 || 0;
        const worldType = protagonist.world.type;
        
        // 宝箱掉落使用"精英"级别的掉落规则（比普通怪好，比Boss差）
        const fragmentDrop = generateFragmentDrop(
          config.difficulty,
          'elite', // 宝箱掉落使用精英级别
          luck,
          worldType,
          playerLevel
        );
        
        // 添加碎片
        fragments.push(...fragmentDrop.fragments);
        completeItems.push(...fragmentDrop.completeItems);
      }
      
      // 构建奖励描述
      const rewardParts: string[] = [];
      rewardParts.push(`${resourceAmount}${resourceName}`);
      if (items.length > 1) {
        rewardParts.push('其他物品');
      }
      
      // 处理碎片掉落
      if (fragments.length > 0) {
        const fragmentNames = fragments.map(f => 
          `${f.rarity}${f.type === 'technique' ? '功法残本' : '装备残片'}(${f.count}片)`
        );
        rewardParts.push(fragmentNames.join('、'));
      }
      
      // 处理完整物品掉落
      if (completeItems.length > 0) {
        const itemNames = completeItems.map(item => {
          const name = item.type === 'technique' 
            ? (item.item as Technique).name 
            : (item.item as Equipment).name;
          return `${item.rarity}${item.type === 'technique' ? '功法' : '装备'}「${name}」`;
        });
        rewardParts.push(itemNames.join('、'));
      }
      
      return {
        victory: true,
        message: `发现宝箱！获得了${rewardParts.join('、')}。`,
        rewards: {
          items,
          fragments,
          completeItems,
          experience: Math.floor(15 * config.rewardMultiplier),
        }
      };
    }
      
    case 'event':
      // 事件格：使用新的随机事件系统 + 增加碎片/物品掉落机会
      // 【修复】event 类型格子应该100%触发事件
      const eventResult = quickHandleEvent(protagonist, {
        difficulty: config.difficulty,
        rows: config.rows,
        cols: config.cols,
      }, 'event');
      
      // 初始化碎片和完整物品掉落
      const eventFragments: FragmentDropResult['fragments'] = [];
      const eventCompleteItems: FragmentDropResult['completeItems'] = [];
      
      // 【新增】10%概率获得碎片/完整物品（比宝箱略低）
      if (Math.random() < 0.10) {
        const playerLevel = protagonist.level;
        const luck = getFinalStats(protagonist.stats).幸运 || 0;
        const worldType = protagonist.world.type;
        
        // 事件掉落使用"普通"级别（比宝箱差）
        const fragmentDrop = generateFragmentDrop(
          config.difficulty,
          'normal', // 事件掉落使用普通级别
          luck,
          worldType,
          playerLevel
        );
        
        // 添加碎片
        eventFragments.push(...fragmentDrop.fragments);
        eventCompleteItems.push(...fragmentDrop.completeItems);
      }
      
      // 构建奖励描述
      let eventMessage = eventResult.message;
      if (eventFragments.length > 0 || eventCompleteItems.length > 0) {
        const extraParts: string[] = [];
        if (eventFragments.length > 0) {
          const fragmentNames = eventFragments.map(f => 
            `${f.rarity}${f.type === 'technique' ? '功法残本' : '装备残片'}(${f.count}片)`
          );
          extraParts.push(fragmentNames.join('、'));
        }
        if (eventCompleteItems.length > 0) {
          const itemNames = eventCompleteItems.map(item => {
            const name = item.type === 'technique' 
              ? (item.item as Technique).name 
              : (item.item as Equipment).name;
            return `${item.rarity}${item.type === 'technique' ? '功法' : '装备'}「${name}」`;
          });
          extraParts.push(itemNames.join('、'));
        }
        eventMessage += ` 额外获得了${extraParts.join('、')}！`;
      }
      
      // 如果触发了事件，返回事件结果
      if (eventResult.triggered) {
        return {
          victory: true,
          message: eventMessage,
          rewards: {
            experience: eventResult.rewards?.expChange || Math.floor(10 * config.rewardMultiplier),
            fragments: eventFragments.length > 0 ? eventFragments : undefined,
            completeItems: eventCompleteItems.length > 0 ? eventCompleteItems : undefined,
          },
          hpRestored: eventResult.rewards?.hpChange && eventResult.rewards.hpChange > 0 
            ? eventResult.rewards.hpChange 
            : undefined,
          mpRestored: eventResult.rewards?.mpChange && eventResult.rewards.mpChange > 0 
            ? eventResult.rewards.mpChange 
            : undefined,
        };
      }
      
      // 未触发事件，返回默认消息（但可能仍有碎片/物品奖励）
      return {
        victory: true,
        message: eventMessage,
        rewards: {
          experience: Math.floor(10 * config.rewardMultiplier),
          fragments: eventFragments.length > 0 ? eventFragments : undefined,
          completeItems: eventCompleteItems.length > 0 ? eventCompleteItems : undefined,
        }
      };
      
    case 'empty':
    default:
      // 空格：检查是否触发随机事件
      // 【修复】empty 类型格子使用概率触发（15%基础概率）
      const emptyEventResult = quickHandleEvent(protagonist, {
        difficulty: config.difficulty,
        rows: config.rows,
        cols: config.cols,
      }, 'empty');
      
      // 如果触发了事件，返回事件结果
      if (emptyEventResult.triggered) {
        return {
          victory: true,
          message: emptyEventResult.message,
          rewards: emptyEventResult.rewards?.expChange ? {
            experience: emptyEventResult.rewards.expChange,
          } : undefined,
          hpRestored: emptyEventResult.rewards?.hpChange && emptyEventResult.rewards.hpChange > 0 
            ? emptyEventResult.rewards.hpChange 
            : undefined,
          mpRestored: emptyEventResult.rewards?.mpChange && emptyEventResult.rewards.mpChange > 0 
            ? emptyEventResult.rewards.mpChange 
            : undefined,
        };
      }
      
      // 未触发事件，返回默认消息
      return {
        victory: true,
        message: '这里空无一物，继续前进吧。',
      };
  }
}
