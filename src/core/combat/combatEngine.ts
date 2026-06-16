/**
 * ATB 时间条战斗引擎
 *
 * 非纯回合制——速度决定行动频率。速度快的单位可在对方行动前多次出手。
 *
 * 时间条机制：
 *   - 每个单位有 actionTime, 每 tick 增加 speed
 *   - actionTime >= THRESHOLD(100) 时行动
 *   - 行动后 actionTime 扣除 THRESHOLD, 余量保留（连续行动可能）
 *
 * 示例：speed=95 每 ~1.05 tick 行动一次, speed=3 每 ~33 tick 行动一次
 *       速度 95 的单位可以行动 30+ 次后速度 3 的单位才行动 1 次！
 *
 * @module core/combat
 */

import type { EngagementType, CombatUnit, CombatSkill, CombatMode, CombatResult, CombatRoundLog, SessionState, PendingAction } from './types';
import type { EquipmentModifier } from './types';
import type { CoreStatValues } from '@/core/world/calculateCoreStats';

// ============================================
// 时间条常量
// ============================================

/** 行动阈值（达到此值即可行动） */
const ACTION_THRESHOLD = 100;

/** 最大 tick 数（防止死循环） */
const MAX_TICKS = 10000;

// ============================================
// 开场类型
// ============================================

const ENGAGEMENT_CONFIG: Record<EngagementType, { speedMult: number; firstStrike: boolean; defHpBonus: number }> = {
  encounter: { speedMult: 1.0, firstStrike: false, defHpBonus: 0 },
  ambush:    { speedMult: 1.0, firstStrike: true,  defHpBonus: 0 },
  surprise:  { speedMult: 1.5, firstStrike: false, defHpBonus: 0 },
  defense:   { speedMult: 1.0, firstStrike: false, defHpBonus: 0.1 },
};

// ============================================
// RNG
// ============================================

let _seed = 0;
function rng(): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
export function setCombatSeed(seed: number): void { _seed = seed; }

// ============================================
// 伤害计算
// ============================================

/**
 * 宝可梦式伤害公式
 * Damage = floor(((2L+10)/250 × ATK/DEF × power + 2) × random(0.85~1.0) × crit)
 */
export function calculateDamage(
  level: number, atk: number, def: number, power: number, weaponMod = 0,
): { damage: number; isCritical: boolean } {
  const d = Math.max(1, def);
  const p = power + weaponMod;
  const base = (2 * level + 10) / 250 * (atk / d) * Math.max(1, p) + 2;
  const rand = 0.85 + rng() * 0.15;
  const crit = rng() < 0.05;
  const dmg = Math.max(1, Math.floor(base * rand * (crit ? 1.5 : 1)));
  return { damage: dmg, isCritical: crit };
}

// ============================================
// 装备修正
// ============================================

export function applyEquipmentModifiers(
  stats: CoreStatValues, mods: EquipmentModifier[],
  isFirstAction: boolean, hpRatio: number,
): CoreStatValues {
  const r = { ...stats };
  for (const m of mods) {
    const active = !m.condition || m.condition === 'always'
      || (m.condition === 'first_round' && isFirstAction)
      || (m.condition === 'hp_below_50' && hpRatio < 0.5)
      || (m.condition === 'hp_below_25' && hpRatio < 0.25);
    if (!active) continue;
    if (m.type === 'flat') r[m.target] = (r[m.target] ?? 0) + m.value;
    else r[m.target] = (r[m.target] ?? 0) * m.value;
  }
  return r;
}

// ============================================
// 技能选择
// ============================================

function pickSkill(unit: InternalUnit): CombatSkill | null {
  const avail = unit.skills.filter(s => s.currentCooldown <= 0);
  if (!avail.length) return null;
  return avail.reduce((a, b) => a.power > b.power ? a : b, avail[0]);
}

// ============================================
// 内部运行时
// ============================================

interface InternalUnit {
  name: string;
  isPlayer: boolean;
  level: number;
  coreStats: CoreStatValues;
  skills: CombatSkill[];
  currentHp: number;
  maxHp: number;
  actionTime: number;
  equipmentModifiers?: EquipmentModifier[];
  firstAction: boolean;
}

// ============================================
// 主战斗流程
// ============================================

/**
 * 执行 ATB 时间条战斗
 *
 * @param attacker 攻击方
 * @param defender 防御方
 * @param engagement 开场类型
 * @returns 战斗结果（含完整时间线日志）
 */
export function executeCombat(
  attacker: CombatUnit,
  defender: CombatUnit,
  engagement: EngagementType = 'encounter',
  _mode: CombatMode = 'auto',
): CombatResult {
  const cfg = ENGAGEMENT_CONFIG[engagement];

  function toInternal(u: CombatUnit, speedMult: number): InternalUnit {
    const stats = { ...u.coreStats };
    stats.speed = Math.max(1, Math.floor(stats.speed * speedMult));
    const eq = u.equipmentModifiers;
    if (eq) {
      const modified = applyEquipmentModifiers(stats, eq, true, u.currentHp / stats.maxHp);
      Object.assign(stats, modified);
    }
    return {
      name: u.name, isPlayer: u.isPlayer, level: u.level,
      coreStats: stats, skills: u.skills.map(s => ({ ...s })),
      currentHp: u.currentHp, maxHp: stats.maxHp,
      actionTime: 0, equipmentModifiers: eq, firstAction: true,
    };
  }

  const a = toInternal(attacker, cfg.speedMult);
  const d = toInternal(defender, 1.0);

  // ambush: 攻击方首轮立即行动
  if (cfg.firstStrike) a.actionTime = ACTION_THRESHOLD;

  // defense: 防御方临时血量
  if (cfg.defHpBonus > 0) d.currentHp = Math.ceil(d.currentHp * (1 + cfg.defHpBonus));

  const logs: CombatRoundLog[] = [];
  let sequence = 0;
  let tick = 0;

  while (tick < MAX_TICKS && a.currentHp > 0 && d.currentHp > 0) {
    // 双方同时推进时间条（按各自速度）
    a.actionTime += a.coreStats.speed;
    d.actionTime += d.coreStats.speed;

    // 检查谁能行动（速度快的一方可能先达到阈值）
    // 如果双方都达到阈值，速度快者先
    const aReady = a.actionTime >= ACTION_THRESHOLD;
    const dReady = d.actionTime >= ACTION_THRESHOLD;

    if (aReady || dReady) {
      // 决定谁先：速度高者优先，同等速度则攻击方先
      let first: InternalUnit, second: InternalUnit | null = null;
      if (aReady && dReady) {
        if (a.coreStats.speed >= d.coreStats.speed) { first = a; second = d; }
        else { first = d; second = a; }
      } else if (aReady) {
        first = a;
      } else {
        first = d;
      }

      // 先手行动
      sequence++;
      const target1 = first === a ? d : a;
      const skill1 = pickSkill(first);
      if (skill1) {
        logs.push(doAction(first, target1, skill1, tick, sequence));
        if (target1.currentHp <= 0 || first.currentHp <= 0) break;
      }
      first.actionTime -= ACTION_THRESHOLD;
      first.firstAction = false;

      // CD 自然衰减（仅行动者）
      tickCooldown(first, tick);

      // 后手行动（如果也准备好了）
      if (second && second.actionTime >= ACTION_THRESHOLD) {
        sequence++;
        const target2 = second === a ? d : a;
        const skill2 = pickSkill(second);
        if (skill2) {
          logs.push(doAction(second, target2, skill2, tick, sequence));
          if (target2.currentHp <= 0 || second.currentHp <= 0) break;
        }
        second.actionTime -= ACTION_THRESHOLD;
        second.firstAction = false;
        tickCooldown(second, tick);
      }
    }

    tick++;
  }

  return {
    victory: d.currentHp <= 0,
    logs,
    totalRounds: sequence,
    attackerRemainingHp: a.currentHp,
    defenderRemainingHp: d.currentHp,
  };
}

// ============================================
// 内部辅助
// ============================================

function doAction(
  actor: InternalUnit, target: InternalUnit,
  skill: CombatSkill, tick: number, seq: number,
): CombatRoundLog {
  const isPhys = skill.damageType === 'physical';
  const atk = isPhys ? actor.coreStats.physicalATK : actor.coreStats.specialATK;
  const def = isPhys ? target.coreStats.physicalDEF : target.coreStats.specialDEF;
  const { damage, isCritical } = calculateDamage(actor.level, atk, def, skill.power, skill.weaponModifier);
  target.currentHp = Math.max(0, target.currentHp - damage);

  // 冷却
  skill.currentCooldown = skill.cooldownSeconds;

  return {
    round: seq,
    attackerName: actor.name,
    defenderName: target.name,
    skillName: skill.name,
    damage,
    attackerHpAfter: actor.currentHp,
    defenderHpAfter: target.currentHp,
    isCritical,
    speed: actor.coreStats.speed,
    tick,
  };
}

function tickCooldown(unit: InternalUnit, _tick: number): void {
  for (const s of unit.skills) {
    if (s.currentCooldown > 0) {
      const decay = Math.max(1, Math.floor(unit.coreStats.speed / 20));
      s.currentCooldown = Math.max(0, s.currentCooldown - decay);
    }
  }
}

// ============================================
// CombatSession — 暂停式手动战斗
// ============================================

/**
 * 战斗会话（支持暂停、手动选技能、tick-by-tick 推进）
 *
 * 用法：
 *   const session = new CombatSession(attacker, defender, 'encounter');
 *   while (session.state !== 'finished') {
 *     session.tick();  // 推进一个 tick
 *     if (session.state === 'pending_input') {
 *       // 调用 session.performAction(skillId) 手动选择技能
 *     }
 *   }
 *   const result = session.getResult();
 */
export class CombatSession {
  private a: InternalUnit;
  private d: InternalUnit;
  private cfg: { speedMult: number; firstStrike: boolean; defHpBonus: number };
  public logs: CombatRoundLog[] = [];
  public state: SessionState = 'running';
  public pendingAction: PendingAction | null = null;
  private seq = 0;
  private tickCount = 0;
  private waitingUnit: InternalUnit | null = null;
  private waitingTarget: InternalUnit | null = null;

  constructor(
    attacker: CombatUnit,
    defender: CombatUnit,
    engagement: EngagementType = 'encounter',
  ) {
    this.cfg = ENGAGEMENT_CONFIG[engagement];

    const toInternal = (u: CombatUnit, speedMult: number): InternalUnit => {
      const stats = { ...u.coreStats };
      stats.speed = Math.max(1, Math.floor(stats.speed * speedMult));
      if (u.equipmentModifiers) {
        Object.assign(stats, applyEquipmentModifiers(stats, u.equipmentModifiers, true, u.currentHp / stats.maxHp));
      }
      return {
        name: u.name, isPlayer: u.isPlayer, level: u.level,
        coreStats: stats, skills: u.skills.map(s => ({ ...s })),
        currentHp: u.currentHp, maxHp: stats.maxHp,
        actionTime: 0, equipmentModifiers: u.equipmentModifiers, firstAction: true,
      };
    };

    this.a = toInternal(attacker, this.cfg.speedMult);
    this.d = toInternal(defender, 1.0);

    if (this.cfg.firstStrike) this.a.actionTime = ACTION_THRESHOLD;
    if (this.cfg.defHpBonus > 0) this.d.currentHp = Math.ceil(this.d.currentHp * (1 + this.cfg.defHpBonus));
  }

  /** 推进一个 tick。返回当前状态。 */
  tick(): SessionState {
    if (this.state === 'finished') return 'finished';
    if (this.state === 'pending_input') return 'pending_input';

    this.tickCount++;

    this.a.actionTime += this.a.coreStats.speed;
    this.d.actionTime += this.d.coreStats.speed;

    const aReady = this.a.actionTime >= ACTION_THRESHOLD;
    const dReady = this.d.actionTime >= ACTION_THRESHOLD;

    if (!aReady && !dReady) return 'running';

    // 确定谁先出手
    const first = aReady && dReady
      ? (this.a.coreStats.speed >= this.d.coreStats.speed ? this.a : this.d)
      : aReady ? this.a : this.d;
    const second = (first === this.a && dReady) ? this.d
      : (first === this.d && aReady) ? this.a : null;

    // ── 处理先手 ──
    if (first.isPlayer) {
      this.waitingUnit = first;
      this.waitingTarget = first === this.a ? this.d : this.a;
      this.state = 'pending_input';
      this.pendingAction = {
        unitId: first === this.a ? 'attacker' : 'defender',
        unitName: first.name,
        availableSkills: first.skills.filter(s => s.currentCooldown <= 0),
      };
      return 'pending_input';
    }
    this.doAutoAction(first, first === this.a ? this.d : this.a);
    if (this.state === 'finished') return 'finished';

    // ── 处理后手 ──
    if (this.state === 'pending_input') return 'pending_input'; // 先手可能是玩家的第二个单位
    if (second) {
      if (second.isPlayer) {
        this.waitingUnit = second;
        this.waitingTarget = second === this.a ? this.d : this.a;
        this.state = 'pending_input';
        this.pendingAction = {
          unitId: second === this.a ? 'attacker' : 'defender',
          unitName: second.name,
          availableSkills: second.skills.filter(s => s.currentCooldown <= 0),
        };
        return 'pending_input';
      }
      this.doAutoAction(second, second === this.a ? this.d : this.a);
    }

    this.checkFinished();
    return this.state;
  }

  /** 手动选择技能执行 */
  performAction(skillId: string): CombatRoundLog | null {
    if (this.state !== 'pending_input' || !this.waitingUnit || !this.waitingTarget) return null;

    const skill = this.waitingUnit.skills.find(s => s.id === skillId && s.currentCooldown <= 0);
    if (!skill) return null;

    const log = doAction(this.waitingUnit, this.waitingTarget, skill, this.tickCount, ++this.seq);
    this.logs.push(log);
    this.waitingUnit.actionTime -= ACTION_THRESHOLD;
    this.waitingUnit.firstAction = false;
    tickCooldown(this.waitingUnit, this.tickCount);

    this.waitingUnit = null;
    this.waitingTarget = null;
    this.pendingAction = null;
    this.state = 'running';

    // 处理敌方等待中的行动
    this.processAiActions();
    this.checkFinished();
    return log;
  }

  getResult(): CombatResult {
    return {
      victory: this.d.currentHp <= 0,
      logs: this.logs,
      totalRounds: this.seq,
      attackerRemainingHp: this.a.currentHp,
      defenderRemainingHp: this.d.currentHp,
    };
  }

  /** 自动推进到结束或需要输入 */
  autoAdvance(): void {
    while (this.state === 'running') this.tick();
  }

  private doAutoAction(actor: InternalUnit, target: InternalUnit): void {
    const skill = pickSkill(actor);
    if (skill) {
      const log = doAction(actor, target, skill, this.tickCount, ++this.seq);
      this.logs.push(log);
      if (target.currentHp <= 0) { this.state = 'finished'; return; }
    }
    actor.actionTime -= ACTION_THRESHOLD;
    actor.firstAction = false;
    tickCooldown(actor, this.tickCount);
  }

  private checkFinished(): void {
    if (this.a.currentHp <= 0 || this.d.currentHp <= 0) this.state = 'finished';
  }

  /** 处理所有就绪的 AI 行动 */
  private processAiActions(): void {
    while (this.state === 'running') {
      const aReady = this.a.actionTime >= ACTION_THRESHOLD && !this.a.isPlayer;
      const dReady = this.d.actionTime >= ACTION_THRESHOLD && !this.d.isPlayer;
      if (!aReady && !dReady) break;

      const actor = aReady ? this.a : this.d;
      const target = actor === this.a ? this.d : this.a;
      this.doAutoAction(actor, target);
    }
  }
}
