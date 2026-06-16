/**
 * 回合制战斗引擎
 *
 * 基于核心值系统的统一战斗引擎。消费 CoreStatValues，
 * 不依赖旧属性系统。支持手动/自动模式。
 *
 * 战斗流程：
 *   1. 开场类型 → 速度修正 → 出手顺序
 *   2. 回合循环 → 选技能 → 伤害计算 → HP扣除 → CD更新
 *   3. 一方全灭 → 返回结果
 *
 * 伤害公式 (宝可梦式):
 *   Damage = floor(((2×L+10)/250 × ATK/DEF × Power + 2) × random(0.85~1.0))
 *
 * @module core/combat
 */

import type {
  EngagementType,
  CombatUnit,
  CombatSkill,
  CombatMode,
  CombatResult,
  CombatRoundLog,
} from './types';

// ============================================
// 开场类型配置
// ============================================

const ENGAGEMENT_CONFIG: Record<EngagementType, {
  attackerSpeedMult: number;
  firstStrike: boolean;
  defPhysDefBonus: number;
  defSpecDefBonus: number;
}> = {
  encounter: { attackerSpeedMult: 1.0, firstStrike: false, defPhysDefBonus: 0, defSpecDefBonus: 0 },
  ambush:    { attackerSpeedMult: 1.0, firstStrike: true,  defPhysDefBonus: 0, defSpecDefBonus: 0 },
  surprise:  { attackerSpeedMult: 1.5, firstStrike: false, defPhysDefBonus: 0, defSpecDefBonus: 0 },
  defense:   { attackerSpeedMult: 1.0, firstStrike: false, defPhysDefBonus: 0.5, defSpecDefBonus: 0.5 },
};

// ============================================
// RNG (seeded)
// ============================================

let _seed = 0;
function seededRandom(): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
export function setCombatSeed(seed: number): void {
  _seed = seed;
}

// ============================================
// 伤害计算
// ============================================

/**
 * 宝可梦式伤害公式
 *
 * Damage = floor(((2×level+10)/250 × ATK/DEF × power + 2) × random(0.85, 1.0))
 *
 * @param level - 攻击方等级
 * @param atk - 攻击方攻击值
 * @param def - 防御方防御值
 * @param power - 技能威力
 * @param weaponMod - 武器修正
 */
export function calculateDamage(
  level: number,
  atk: number,
  def: number,
  power: number,
  weaponMod: number = 0,
): { damage: number; isCritical: boolean } {
  const effectiveDef = Math.max(1, def);
  const effectivePower = power + weaponMod;
  const baseRatio = (2 * level + 10) / 250;
  const atkDefRatio = atk / effectiveDef;
  const baseDamage = baseRatio * atkDefRatio * Math.max(1, effectivePower) + 2;

  // 随机波动 0.85 ~ 1.0
  const randomFactor = 0.85 + seededRandom() * 0.15;

  // 暴击判定 5%
  const isCritical = seededRandom() < 0.05;
  const critMultiplier = isCritical ? 1.5 : 1.0;

  const damage = Math.max(1, Math.floor(baseDamage * randomFactor * critMultiplier));
  return { damage, isCritical };
}

// ============================================
// 技能选择
// ============================================

/** 自动模式：选择可用中威力最高的技能 */
function autoSelectSkill(skills: CombatSkill[]): CombatSkill | null {
  const available = skills.filter(s => s.currentCooldown <= 0);
  if (available.length === 0) return null;
  return available.reduce((best, s) => s.power > best.power ? s : best, available[0]);
}

/** 手动模式：使用指定技能（需检查冷却） */
function manualSelectSkill(skills: CombatSkill[], skillId: string): CombatSkill | null {
  const skill = skills.find(s => s.id === skillId);
  if (!skill || skill.currentCooldown > 0) return null;
  return skill;
}

// ============================================
// 出手顺序
// ============================================

/** 计算出手顺序 */
function getTurnOrder(
  attacker: CombatUnit,
  defender: CombatUnit,
  engagement: EngagementType,
  isFirstRound: boolean,
): [CombatUnit, CombatUnit] {
  const config = ENGAGEMENT_CONFIG[engagement];

  // ambush 首轮先手
  if (config.firstStrike && isFirstRound) {
    return [attacker, defender];
  }

  // 计算有效速度
  const attackerSpeed = attacker.coreStats.speed * config.attackerSpeedMult;
  const defenderSpeed = defender.coreStats.speed;

  if (attackerSpeed >= defenderSpeed) {
    return [attacker, defender];
  }
  return [defender, attacker];
}

// ============================================
// 装备修正
// ============================================

import type { EquipmentModifier } from './types';
import type { CoreStatValues } from '@/core/world/calculateCoreStats';

/** 应用装备修正到核心值 */
export function applyEquipmentModifiers(
  coreStats: CoreStatValues,
  modifiers: EquipmentModifier[],
  isFirstRound: boolean,
  hpRatio: number,
): CoreStatValues {
  const result = { ...coreStats };
  for (const mod of modifiers) {
    // 条件判断
    const active =
      !mod.condition || mod.condition === 'always' ||
      (mod.condition === 'first_round' && isFirstRound) ||
      (mod.condition === 'hp_below_50' && hpRatio < 0.5) ||
      (mod.condition === 'hp_below_25' && hpRatio < 0.25);
    if (!active) continue;

    const key = mod.target as keyof CoreStatValues;
    if (mod.type === 'flat') {
      result[key] = (result[key] ?? 0) + mod.value;
    } else if (mod.type === 'multiplier') {
      result[key] = (result[key] ?? 0) * mod.value;
    }
  }
  return result;
}

// ============================================
// 主战斗流程
// ============================================

/** 最大回合数（防止死循环） */
const MAX_ROUNDS = 100;

/**
 * 执行战斗
 *
 * @param attacker - 攻击方
 * @param defender - 防御方
 * @param engagement - 开场类型
 * @param mode - 战斗模式 (manual/auto)
 * @param manualSkillCallback - 手动模式下选择技能的回调 (仅在 manual 模式下需要)
 */
export function executeCombat(
  attacker: CombatUnit,
  defender: CombatUnit,
  engagement: EngagementType = 'encounter',
  mode: CombatMode = 'auto',
  manualSkillCallback?: (turn: number, skills: CombatSkill[], availableIds: string[]) => string,
): CombatResult {
  // 深拷贝单位（避免修改原数据）
  const atk: CombatUnit = JSON.parse(JSON.stringify(attacker));
  const def: CombatUnit = JSON.parse(JSON.stringify(defender));

  // 应用装备修正（战斗前）
  if (atk.equipmentModifiers) {
    atk.coreStats = applyEquipmentModifiers(atk.coreStats, atk.equipmentModifiers, true, atk.currentHp / atk.coreStats.maxHp);
  }
  if (def.equipmentModifiers) {
    def.coreStats = applyEquipmentModifiers(def.coreStats, def.equipmentModifiers, true, def.currentHp / def.coreStats.maxHp);
  }

  // defense 开场类型：防御方首轮防御加成
  if (engagement === 'defense') {
    def.currentHp = Math.ceil(def.currentHp * 1.1); // 临时血量加成10%
  }

  const logs: CombatRoundLog[] = [];
  let round = 0;

  while (round < MAX_ROUNDS) {
    round++;
    const isFirstRound = round === 1;
    const [first, second] = getTurnOrder(atk, def, engagement, isFirstRound);

    // ── 先手方攻击 ──
    const firstSkill = selectSkill(first, atk, def, mode, manualSkillCallback, round);
    if (firstSkill) {
      const target = first === atk ? def : atk;
      const log = performAttack(first, target, firstSkill, round);
      logs.push(log);
      // CD
      firstSkill.currentCooldown = firstSkill.cooldownSeconds;
      if (target.currentHp <= 0) break;
    }

    // ── 后手方攻击 ──
    const secondSkill = selectSkill(second, atk, def, mode, manualSkillCallback, round);
    if (secondSkill) {
      const target = second === atk ? def : atk;
      const log = performAttack(second, target, secondSkill, round);
      logs.push(log);
      secondSkill.currentCooldown = secondSkill.cooldownSeconds;
      if (target.currentHp <= 0) break;
    }

    // ── CD 衰减 ──
    tickCooldowns(atk, def);
  }

  return {
    victory: def.currentHp <= 0,
    logs,
    totalRounds: round,
    attackerRemainingHp: atk.currentHp,
    defenderRemainingHp: def.currentHp,
  };
}

// ============================================
// 内部辅助
// ============================================

function selectSkill(
  unit: CombatUnit,
  attacker: CombatUnit,
  defender: CombatUnit,
  mode: CombatMode,
  callback: ((turn: number, skills: CombatSkill[], availableIds: string[]) => string) | undefined,
  round: number,
): CombatSkill | null {
  if (mode === 'auto') {
    return autoSelectSkill(unit.skills);
  }
  // manual
  if (callback) {
    const availableIds = unit.skills.filter(s => s.currentCooldown <= 0).map(s => s.id);
    const chosen = callback(round, unit.skills, availableIds);
    if (chosen) return manualSelectSkill(unit.skills, chosen);
  }
  return autoSelectSkill(unit.skills); // fallback
}

function performAttack(
  attackerUnit: CombatUnit,
  defenderUnit: CombatUnit,
  skill: CombatSkill,
  round: number,
): CombatRoundLog {
  const isPhysical = skill.damageType === 'physical';
  const atk = isPhysical ? attackerUnit.coreStats.physicalATK : attackerUnit.coreStats.specialATK;
  const def = isPhysical ? defenderUnit.coreStats.physicalDEF : defenderUnit.coreStats.specialDEF;

  const { damage, isCritical } = calculateDamage(
    attackerUnit.level, atk, def, skill.power, skill.weaponModifier,
  );

  defenderUnit.currentHp = Math.max(0, defenderUnit.currentHp - damage);

  return {
    round,
    attackerName: attackerUnit.name,
    defenderName: defenderUnit.name,
    skillName: skill.name,
    damage,
    attackerHpAfter: attackerUnit.currentHp,
    defenderHpAfter: defenderUnit.currentHp,
    isCritical,
  };
}

function tickCooldowns(atk: CombatUnit, def: CombatUnit): void {
  for (const unit of [atk, def]) {
    for (const skill of unit.skills) {
      if (skill.currentCooldown > 0) {
        // CD按速度衰减：速度越快衰减越多
        const decay = Math.max(1, Math.floor(unit.coreStats.speed / 10));
        skill.currentCooldown = Math.max(0, skill.currentCooldown - decay);
      }
    }
  }
}
