/**
 * 飞升系统核心逻辑
 *
 * @note 本模块使用 Math.random() 进行随机生成。计划在后续专项变更中
 * 改造为 seed-based RNG（使用 createRng 工具函数），以提高可测试性。
 */

import { 
  ASCENSION_CONFIG,
  WORLD_GUARDIANS,
  WORLD_NAME_GENERATORS,
  WORLD_FEATURES,
  ASCENSION_MILESTONES,
  TITLE_SYSTEM,
  getGuardianConfig,
  getWorldName,
  getWorldFeatures,
  getAscensionMilestone,
  calculateWorldWeights,
  weightedRandom,
} from '@/modules/ascension/data/ascensionData';
import { FlatStats, WorldType, CharacterStats, BattleState, BattleLog, Protagonist, Technique, Equipment, getFinalStats, GrowthStats } from '@/core/types';
import { 
  AscensionMark,
  GuardianBattleState,
  AscensionChallengeResult,
  NewWorldInfo,
  InheritanceChoice,
  DEFAULT_ASCENSION_MARK,
  DEFAULT_GUARDIAN_BATTLE_STATE,
} from '@/core/types';

// ============================================
// 成功率计算
// ============================================

/**
 * 计算飞升成功率
 */
export function calculateSuccessRate(protagonist: Protagonist): number {
  let rate = ASCENSION_CONFIG.baseSuccessRate;
  const bonuses = ASCENSION_CONFIG.successRateBonuses;
  
  // 心境加成
  const stability = protagonist.mentalState?.stability ?? 70;
  if (stability >= 90) {
    rate += bonuses.mentalStability90;
  } else if (stability >= 70) {
    rate += bonuses.mentalStability70;
  }
  
  // 流派加成
  const pathLevel = protagonist.pathLevel ?? 0;
  if (pathLevel >= 8) {
    rate += bonuses.pathLevel8;
  } else if (pathLevel >= 5) {
    rate += bonuses.pathLevel5;
  }
  
  // 装备加成
  const legendaryCount = protagonist.equipments.filter(
    eq => eq.rarity === '传说'
  ).length;
  if (legendaryCount >= 6) {
    rate += bonuses.fullLegendaryEquipment;
  }
  
  // 上限95%
  return Math.min(0.95, rate);
}

/**
 * 检查飞升条件
 */
export function checkAscensionRequirements(protagonist: Protagonist): {
  canChallenge: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // 等级检查
  if (protagonist.level < 100) {
    reasons.push(`等级不足：需要100级，当前${protagonist.level}级`);
  }
  
  // HP检查
  if (protagonist.currentHp < protagonist.maxHp) {
    reasons.push('生命值未满');
  }
  
  // MP检查
  if (protagonist.currentMp < protagonist.maxMp) {
    reasons.push('法力值未满');
  }
  
  // 冷却检查
  const cooldownUntil = protagonist.guardianBattle?.cooldownUntil;
  if (cooldownUntil && Date.now() < cooldownUntil) {
    const remainingHours = Math.ceil((cooldownUntil - Date.now()) / (1000 * 60 * 60));
    reasons.push(`冷却中：还需等待${remainingHours}小时`);
  }
  
  return {
    canChallenge: reasons.length === 0,
    reasons,
  };
}

// ============================================
// 守卫战斗逻辑
// ============================================

/**
 * 创建守卫战斗状态
 */
export function createGuardianBattleState(protagonist: Protagonist): GuardianBattleState {
  const worldType = protagonist.world.type;
  const config = getGuardianConfig(worldType);
  
  // 计算玩家战力相关属性
  const playerAttack = calculatePlayerAttack(protagonist);
  const playerDefense = calculatePlayerDefense(protagonist);
  const playerMaxHp = protagonist.maxHp;
  
  return {
    guardianName: config.name,
    guardianTitle: config.title,
    guardianMaxHp: Math.floor(playerMaxHp * config.hpMultiplier),
    guardianCurrentHp: Math.floor(playerMaxHp * config.hpMultiplier),
    guardianAttack: Math.floor(playerAttack * config.attackMultiplier),
    guardianDefense: Math.floor(playerDefense * config.defenseMultiplier),
    currentPhase: 1,
    totalPhases: config.phases,
    cooldownUntil: protagonist.guardianBattle?.cooldownUntil ?? null,
    consecutiveFailures: protagonist.guardianBattle?.consecutiveFailures ?? 0,
  };
}

/**
 * 计算玩家攻击力
 */
function calculatePlayerAttack(protagonist: Protagonist): number {
  const stats = getFinalStats(protagonist.stats);
  let baseAttack = 10 + protagonist.level * 2;
  
  // 属性加成
  baseAttack += stats.体质 * 1;
  baseAttack += stats.灵根 * 0.5;
  
  // 装备加成
  const melee = protagonist.equippedMelee;
  const ranged = protagonist.equippedRanged;
  if (melee) baseAttack += melee.attackBonus;
  if (ranged) baseAttack += ranged.attackBonus;
  
  // 功法加成
  protagonist.equippedAttackTechniques.forEach(tech => {
    if (tech) baseAttack *= (1 + tech.bonus / 100);
  });
  
  return Math.floor(baseAttack);
}

/**
 * 计算玩家防御力
 */
function calculatePlayerDefense(protagonist: Protagonist): number {
  const stats = getFinalStats(protagonist.stats);
  let baseDefense = 5 + protagonist.level * 1;
  
  // 属性加成
  baseDefense += stats.意志 * 0.8;
  
  // 装备加成
  const slots = [
    protagonist.equippedHead,
    protagonist.equippedBody,
    protagonist.equippedLegs,
    protagonist.equippedFeet,
  ];
  slots.forEach(eq => {
    if (eq) baseDefense += eq.defenseBonus;
  });
  
  // 功法加成
  protagonist.equippedDefenseTechniques.forEach(tech => {
    if (tech) baseDefense *= (1 + tech.bonus / 100);
  });
  
  return Math.floor(baseDefense);
}

/**
 * 计算当前阶段
 */
export function calculatePhase(hpPercent: number): number {
  if (hpPercent <= 0.2) return 3;
  if (hpPercent <= 0.5) return 2;
  return 1;
}

/**
 * 执行战斗回合
 */
export function executeBattleRound(
  battleState: BattleState,
  guardianState: GuardianBattleState,
  playerAction: 'attack' | 'skill' | 'defend',
  devInvincible: boolean = false
): {
  battleState: BattleState;
  guardianState: GuardianBattleState;
  log: BattleLog;
  guardianLog?: BattleLog;
  isOver: boolean;
  victory?: boolean;
} {
  const logs: BattleLog[] = [];
  const newGuardianState = { ...guardianState };
  const newBattleState = { ...battleState };
  
  // 玩家行动
  let playerDamage = 0;
  let playerHeal = 0;
  
  const playerAttack = newBattleState.playerAttack;
  const guardianDefense = newGuardianState.guardianDefense;
  
  switch (playerAction) {
    case 'attack':
      playerDamage = Math.max(1, Math.floor(playerAttack - guardianDefense * 0.5 + Math.random() * 10));
      newGuardianState.guardianCurrentHp -= playerDamage;
      logs.push({
        round: newBattleState.currentRound,
        attacker: 'player',
        action: '普通攻击',
        damage: playerDamage,
      });
      break;
      
    case 'skill':
      // 技能攻击，伤害更高但消耗MP
      if (newBattleState.playerCurrentMp >= 20) {
        playerDamage = Math.max(1, Math.floor(playerAttack * 1.5 - guardianDefense * 0.3 + Math.random() * 15));
        newGuardianState.guardianCurrentHp -= playerDamage;
        newBattleState.playerCurrentMp -= 20;
        logs.push({
          round: newBattleState.currentRound,
          attacker: 'player',
          action: '技能攻击',
          damage: playerDamage,
        });
      } else {
        // MP不足，普通攻击
        playerDamage = Math.max(1, Math.floor(playerAttack - guardianDefense * 0.5 + Math.random() * 10));
        newGuardianState.guardianCurrentHp -= playerDamage;
        logs.push({
          round: newBattleState.currentRound,
          attacker: 'player',
          action: '普通攻击（MP不足）',
          damage: playerDamage,
        });
      }
      break;
      
    case 'defend':
      // 防御，恢复少量HP和MP
      playerHeal = Math.floor(newBattleState.playerMaxHp * 0.05);
      const mpRecover = Math.floor(newBattleState.playerMaxMp * 0.1);
      newBattleState.playerCurrentHp = Math.min(
        newBattleState.playerMaxHp,
        newBattleState.playerCurrentHp + playerHeal
      );
      newBattleState.playerCurrentMp = Math.min(
        newBattleState.playerMaxMp,
        newBattleState.playerCurrentMp + mpRecover
      );
      logs.push({
        round: newBattleState.currentRound,
        attacker: 'player',
        action: '防御',
        heal: playerHeal,
      });
      break;
  }
  
  // 检查守卫是否死亡
  if (newGuardianState.guardianCurrentHp <= 0) {
    newGuardianState.guardianCurrentHp = 0;
    return {
      battleState: newBattleState,
      guardianState: newGuardianState,
      log: logs[0],
      isOver: true,
      victory: true,
    };
  }
  
  // 更新守卫阶段
  const hpPercent = newGuardianState.guardianCurrentHp / newGuardianState.guardianMaxHp;
  newGuardianState.currentPhase = calculatePhase(hpPercent);
  
  // 守卫反击
  const guardianAttack = newGuardianState.guardianAttack;
  const playerDefense = newBattleState.playerDefense;
  
  // 根据阶段调整攻击强度
  const phaseMultiplier = 1 + (newGuardianState.currentPhase - 1) * 0.2;
  const guardianDamage = devInvincible ? 1 : Math.max(1, Math.floor(
    (guardianAttack * phaseMultiplier - playerDefense * 0.5 + Math.random() * 10) *
    (playerAction === 'defend' ? 0.5 : 1)
  ));
  
  newBattleState.playerCurrentHp -= guardianDamage;
  
  const guardianLog: BattleLog = {
    round: newBattleState.currentRound,
    attacker: 'enemy',
    action: `${newGuardianState.guardianName}攻击`,
    damage: guardianDamage,
  };
  
  // 检查玩家是否死亡
  if (newBattleState.playerCurrentHp <= 0) {
    newBattleState.playerCurrentHp = 0;
    return {
      battleState: newBattleState,
      guardianState: newGuardianState,
      log: logs[0],
      guardianLog,
      isOver: true,
      victory: false,
    };
  }
  
  // 回合数增加
  newBattleState.currentRound++;
  
  // 检查回合上限
  if (newBattleState.currentRound > ASCENSION_CONFIG.battle.maxTurns) {
    return {
      battleState: newBattleState,
      guardianState: newGuardianState,
      log: logs[0],
      guardianLog,
      isOver: true,
      victory: false,
    };
  }
  
  return {
    battleState: newBattleState,
    guardianState: newGuardianState,
    log: logs[0],
    guardianLog,
    isOver: false,
  };
}

// ============================================
// 战斗结算
// ============================================

/**
 * 计算战斗奖励
 */
export function calculateBattleReward(
  victory: boolean,
  turnsUsed: number,
  remainingHpPercent: number,
  phasesCleared: number,
  ascensionCount: number
): AscensionChallengeResult {
  if (!victory) {
    // 失败惩罚
    const consecutiveFailures = Math.min(3, phasesCleared === 0 ? 1 : 0);
    const cooldownHours = Math.min(
      ASCENSION_CONFIG.penalty.cooldownMaxHours,
      ASCENSION_CONFIG.penalty.cooldownBaseHours * Math.pow(2, consecutiveFailures)
    );
    
    // 阶段减免
    const reduction = phasesCleared * 0.1;
    
    return {
      success: false,
      penalty: {
        hpLoss: ASCENSION_CONFIG.penalty.hpLossPercent * (1 - reduction),
        mpLoss: ASCENSION_CONFIG.penalty.mpLossPercent * (1 - reduction),
        mentalDrop: Math.floor(ASCENSION_CONFIG.penalty.mentalDrop * (1 - reduction)),
        demonChanceAdd: ASCENSION_CONFIG.penalty.demonChanceAdd,
        cooldownHours,
        phasesCleared,
      },
    };
  }
  
  // 胜利奖励
  const bonusRewards: { type: string; name: string; bonus: number }[] = [];
  let bonusMultiplier = 1.0;
  
  // 快速通关
  if (turnsUsed <= 8) {
    bonusMultiplier += 0.2;
    bonusRewards.push({ type: 'speed', name: '速战速决', bonus: 0.2 });
  }
  
  // 低损通关
  if (remainingHpPercent >= 0.7) {
    bonusMultiplier += 0.15;
    bonusRewards.push({ type: 'low_damage', name: '游刃有余', bonus: 0.15 });
  } else if (remainingHpPercent >= 0.5) {
    bonusMultiplier += 0.1;
    bonusRewards.push({ type: 'solid_win', name: '稳操胜券', bonus: 0.1 });
  }
  
  // 计算属性加成
  const milestone = getAscensionMilestone(ascensionCount + 1);
  const baseBonus = milestone?.statBonus ?? { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 };
  
  const statBonus: Partial<FlatStats> = {};
  for (const [stat, value] of Object.entries(baseBonus)) {
    statBonus[stat as keyof FlatStats] = Math.floor(value! * bonusMultiplier);
  }
  
  return {
    success: true,
    reward: {
      statBonus,
      bonusRewards,
      bonusMultiplier,
    },
  };
}

// ============================================
// 世界生成
// ============================================

/**
 * 生成新世界信息
 */
export function generateNewWorld(ascensionCount: number, currentWorldType: WorldType): NewWorldInfo {
  // 计算权重
  const weights = calculateWorldWeights(ascensionCount);
  
  // 排除当前世界
  const availableTypes = (['修仙', '高武', '科技', '魔幻', '异能', '仙侠', '武侠', '末世'] as WorldType[])
    .filter(t => t !== currentWorldType);
  
  // 随机选择世界类型
  const selectedType = weightedRandom(availableTypes, weights);
  
  // 生成世界名称
  const worldName = getWorldName(selectedType);
  
  // 选择世界特性 (1-3个)
  const featureCount = Math.random() > 0.7 ? 3 : Math.random() > 0.4 ? 2 : 1;
  const features = getWorldFeatures(selectedType, featureCount);
  
  // 计算难度系数
  const difficulty = 1.0 + (ascensionCount * 0.1);
  
  // 随机资源丰富度
  const resourceAbundance = 0.8 + Math.random() * 0.4;
  
  // 危险等级
  const dangerLevels = ['安全', '普通', '危险', '高危', '死亡之地'];
  const dangerIndex = Math.min(4, Math.floor(difficulty - 1 + Math.random() * 2));
  
  return {
    type: selectedType,
    name: worldName,
    description: generateWorldDescription(selectedType, worldName, features),
    difficulty,
    specialFeatures: features,
    resourceAbundance,
    danger: dangerLevels[dangerIndex],
  };
}

/**
 * 生成世界描述
 */
function generateWorldDescription(worldType: WorldType, worldName: string, features: string[]): string {
  const typeDescriptions: Record<WorldType, string> = {
    '修仙': '灵气充沛的修仙世界',
    '高武': '武道昌盛的强者世界',
    '科技': '科技发达的未来世界',
    '魔幻': '魔法充盈的奇幻世界',
    '异能': '异能觉醒的现代世界',
    '仙侠': '剑气纵横的仙侠世界',
    '武侠': '恩怨情仇的武侠世界',
    '末世': '文明崩塌的末世废土',
  };
  
  return `${worldName} - ${typeDescriptions[worldType]}。特性：${features.join('、')}。`;
}

// ============================================
// 飞升印记管理
// ============================================

/**
 * 获取或创建飞升印记
 */
export function getOrCreateAscensionMark(protagonist: Protagonist): AscensionMark {
  return protagonist.ascensionMark ?? DEFAULT_ASCENSION_MARK;
}

/**
 * 更新飞升印记
 */
export function updateAscensionMark(
  currentMark: AscensionMark,
  newBonus: Partial<FlatStats>
): AscensionMark {
  const newCount = currentMark.count + 1;
  
  // 累计属性加成
  const totalStatBonus: FlatStats = {
    体质: (currentMark.totalStatBonus.体质 ?? 0) + (newBonus.体质 ?? 0),
    灵根: (currentMark.totalStatBonus.灵根 ?? 0) + (newBonus.灵根 ?? 0),
    悟性: (currentMark.totalStatBonus.悟性 ?? 0) + (newBonus.悟性 ?? 0),
    幸运: (currentMark.totalStatBonus.幸运 ?? 0) + (newBonus.幸运 ?? 0),
    意志: (currentMark.totalStatBonus.意志 ?? 0) + (newBonus.意志 ?? 0),
  };
  
  // 解锁称号和能力
  const milestone = getAscensionMilestone(newCount);
  const unlockedTitles = milestone ? [...currentMark.unlockedTitles, milestone.title] : currentMark.unlockedTitles;
  const specialAbilities = milestone ? [...currentMark.specialAbilities, milestone.ability] : currentMark.specialAbilities;
  
  return {
    count: newCount,
    totalStatBonus,
    unlockedTitles,
    specialAbilities,
    currentTitle: milestone?.title ?? currentMark.currentTitle,
    rerollAvailable: newCount === 1, // 首次飞升获得重新随机机会
  };
}

/**
 * 计算冷却时间
 */
export function calculateCooldown(consecutiveFailures: number): number {
  const baseHours = ASCENSION_CONFIG.penalty.cooldownBaseHours;
  const multiplier = Math.pow(2, consecutiveFailures);
  const maxHours = ASCENSION_CONFIG.penalty.cooldownMaxHours;
  
  return Math.min(maxHours, baseHours * multiplier) * 60 * 60 * 1000; // 转换为毫秒
}

// ============================================
// 传承处理
// ============================================

/**
 * 计算传承数据
 */
export function calculateInheritance(
  protagonist: Protagonist,
  choice: InheritanceChoice,
  ascensionCount: number
): {
  techniques: Technique[];
  equipments: Equipment[];
  spiritStones: number;
} {
  // 检查是否有额外传承槽位（飞升10次）
  const hasExtraSlots = ascensionCount >= ASCENSION_CONFIG.inheritance.extraSlots.ascensionRequired;
  const maxTechniques = hasExtraSlots ? 2 : 1;
  const maxEquipments = hasExtraSlots ? 2 : 1;
  
  // 筛选传承功法
  const techniques: Technique[] = [];
  if (choice.techniqueId) {
    const tech = protagonist.techniques.find(t => t.id === choice.techniqueId);
    if (tech) techniques.push(tech);
  }
  
  // 筛选传承装备
  const equipments: Equipment[] = [];
  if (choice.equipmentId) {
    const eq = protagonist.equipments.find(e => e.id === choice.equipmentId);
    if (eq) equipments.push(eq);
  }
  
  // 计算携带灵石
  const spiritStones = protagonist.inventory.find(
    item => item.definition.id === 'spirit_stone'
  )?.quantity ?? 0;
  const carriedStones = Math.floor(spiritStones * choice.spiritStonesPercent);
  
  return {
    techniques: techniques.slice(0, maxTechniques),
    equipments: equipments.slice(0, maxEquipments),
    spiritStones: carriedStones,
  };
}
