/**
 * 事件驱动双人战斗引擎
 *
 * 非 tick 模型——每次循环 = 一次行动事件。通过速度衰减和保底计数器
 * 控制行动顺序，天然适应 speed 数值膨胀。
 *
 * 核心机制：
 *   - 比较双方当前有效 speed，高者获得本次行动权
 *   - 行动后行动方 speed *= DECAY（衰减）
 *   - 对方行动后，行动方 speed 恢复为原始值
 *   - 同一方连续行动 ≥ PITY_MAX 次 → 强制切换（保底）
 *
 * 示例：
 *   speed 10 vs 5:   基本交替，3-5轮多出手一次
 *   speed 100k vs 10k: 高者连续行动3-4次后衰减到低于对手或触发保底
 *   speed 100k vs 50k: 比10:5差异更明显（绝对值放大衰减差距）
 *
 * @module core/combat
 */

import type { EngagementType, CombatUnit, CombatSkill, CombatMode, CombatResult, CombatRoundLog, SessionState, PendingAction } from './types';
import type { EquipmentModifier } from './types';
import type { CoreStatValues } from '@/core/world/calculateCoreStats';

// ============================================
// 战斗常量
// ============================================

/** 每次行动后速度衰减系数（0~1，越小衰减越狠） */
const SPEED_DECAY = 0.5;

/** 连续行动次数上限（触发保底强制切换） */
const PITY_MAX = 4;

/** 总行动次数上限（防止死循环） */
const ACTION_CAP = 50;

// ============================================
// 开场类型配置
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
// 伤害计算（宝可梦公式，不变）
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
// 装备修正（不变）
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
  /** 原始 speed（用于对方行动后恢复） */
  baseSpeed: number;
  skills: CombatSkill[];
  currentHp: number;
  maxHp: number;
  equipmentModifiers?: EquipmentModifier[];
  firstAction: boolean;
}

// ============================================
// 主战斗流程（事件驱动）
// ============================================

/**
 * 执行事件驱动双人战斗
 *
 * @param attacker 攻击方
 * @param defender 防御方
 * @param engagement 开场类型
 * @returns 战斗结果（含完整行动日志）
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
      coreStats: stats,
      baseSpeed: stats.speed,
      skills: u.skills.map(s => ({ ...s })),
      currentHp: u.currentHp, maxHp: stats.maxHp,
      equipmentModifiers: eq, firstAction: true,
    };
  }

  const a = toInternal(attacker, cfg.speedMult);
  const d = toInternal(defender, 1.0);

  // defense: 防御方临时血量
  if (cfg.defHpBonus > 0) d.currentHp = Math.ceil(d.currentHp * (1 + cfg.defHpBonus));

  const logs: CombatRoundLog[] = [];
  let sequence = 0;
  let lastActor: 'a' | 'd' | null = null;
  let consecutiveCount = 0;
  let totalActions = 0;

  // ── ambush: 攻击方首轮强制先手 ──
  if (cfg.firstStrike) {
    sequence++;
    const skill = pickSkill(a);
    if (skill) {
      logs.push(doAction(a, d, skill, sequence));
      if (d.currentHp <= 0) return buildResult(logs, sequence, a.currentHp, a.maxHp, d.currentHp, d.maxHp, totalActions);
    }
    decaySpeed(a);
    tickCooldown(a);
    a.firstAction = false;
    lastActor = 'a';
    consecutiveCount = 1;
    totalActions++;
  }

  // ── 事件驱动主循环 ──
  while (a.currentHp > 0 && d.currentHp > 0 && totalActions < ACTION_CAP) {

    let actor: 'a' | 'd';

    // ① 保底检查
    if (consecutiveCount >= PITY_MAX) {
      actor = lastActor === 'a' ? 'd' : 'a';
      // 恢复双方速度
      a.coreStats.speed = a.baseSpeed;
      d.coreStats.speed = d.baseSpeed;
      consecutiveCount = 0;
    } else {
      // ② 正常速度比较
      const aSpd = a.coreStats.speed;
      const dSpd = d.coreStats.speed;

      if (aSpd > dSpd) {
        actor = 'a';
      } else if (dSpd > aSpd) {
        actor = 'd';
      } else {
        // 平局：刚动过的让给对方；无历史时攻击方优先
        actor = lastActor === 'a' ? 'd' : lastActor === 'd' ? 'a' : 'a';
      }
    }

    // ③ 执行行动
    sequence++;
    const activeUnit = actor === 'a' ? a : d;
    const targetUnit = actor === 'a' ? d : a;
    const skill = pickSkill(activeUnit);
    if (skill) {
      logs.push(doAction(activeUnit, targetUnit, skill, sequence));
      if (targetUnit.currentHp <= 0) break;
    }

    // ④ 行动后衰减
    decaySpeed(activeUnit);
    activeUnit.firstAction = false;

    // ⑤ CD 衰减（按自身行动次数）
    tickCooldown(activeUnit);

    // ⑥ 更新连续计数 + 对方恢复速度
    if (actor === lastActor) {
      consecutiveCount++;
    } else {
      consecutiveCount = 1;
      // 切换了行动方：上一次行动方（即当前等待方）的速度恢复
      if (lastActor !== null) {
        const waiting = lastActor === 'a' ? a : d;
        waiting.coreStats.speed = waiting.baseSpeed;
      }
    }

    lastActor = actor;
    totalActions++;
  }

  return buildResult(logs, sequence, a.currentHp, a.maxHp, d.currentHp, d.maxHp, totalActions);
}

// ============================================
// 内部辅助
// ============================================

/** 衰减行动方的有效速度 */
function decaySpeed(unit: InternalUnit): void {
  unit.coreStats.speed = Math.max(1, Math.floor(unit.coreStats.speed * SPEED_DECAY));
}

function doAction(
  actor: InternalUnit, target: InternalUnit,
  skill: CombatSkill, seq: number,
): CombatRoundLog {
  const isPhys = skill.damageType === 'physical';
  const atk = isPhys ? actor.coreStats.physicalATK : actor.coreStats.specialATK;
  const def = isPhys ? target.coreStats.physicalDEF : target.coreStats.specialDEF;
  const { damage, isCritical } = calculateDamage(actor.level, atk, def, skill.power, skill.weaponModifier);
  target.currentHp = Math.max(0, target.currentHp - damage);

  // 冷却：每次自身行动后 CD-1（引擎层在 tickCooldown 中统一处理）
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
  };
}

/**
 * CD 衰减：每次自身行动后所有技能的 currentCooldown 减 1
 *
 * 与速度完全脱钩。速度越快 → 出手越多 → CD 自然转得快。
 */
function tickCooldown(unit: InternalUnit): void {
  for (const s of unit.skills) {
    if (s.currentCooldown > 0) {
      s.currentCooldown = Math.max(0, s.currentCooldown - 1);
    }
  }
}

/** 构建战斗结果 */
function buildResult(
  logs: CombatRoundLog[],
  sequence: number,
  aHp: number, aMaxHp: number,
  dHp: number, dMaxHp: number,
  _totalActions: number,
): CombatResult {
  // 防御方死亡 → 攻击方胜利
  if (dHp <= 0) {
    return { victory: true, logs, totalRounds: sequence, attackerRemainingHp: aHp, defenderRemainingHp: dHp };
  }
  // 攻击方死亡 → 攻击方失败
  if (aHp <= 0) {
    return { victory: false, logs, totalRounds: sequence, attackerRemainingHp: aHp, defenderRemainingHp: dHp };
  }
  // 行动次数上限 → 按血量比例判定
  const aRatio = aHp / aMaxHp;
  const dRatio = dHp / dMaxHp;
  return {
    victory: aRatio > dRatio,
    logs,
    totalRounds: sequence,
    attackerRemainingHp: aHp,
    defenderRemainingHp: dHp,
  };
}

// ============================================
// CombatSession — 暂停式手动战斗
// ============================================

/**
 * 战斗会话（事件驱动版，支持暂停、手动选技能、单步推进）
 *
 * 用法：
 *   const session = new CombatSession(attacker, defender, 'encounter');
 *   while (session.state !== 'finished') {
 *     session.step();  // 推进一次行动
 *     if (session.state === 'pending_input') {
 *       session.performAction(skillId)  // 手动选择技能
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
  private lastActor: 'a' | 'd' | null = null;
  private consecutiveCount = 0;
  private totalActions = 0;
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
        coreStats: stats,
        baseSpeed: stats.speed,
        skills: u.skills.map(s => ({ ...s })),
        currentHp: u.currentHp, maxHp: stats.maxHp,
        equipmentModifiers: u.equipmentModifiers, firstAction: true,
      };
    };

    this.a = toInternal(attacker, this.cfg.speedMult);
    this.d = toInternal(defender, 1.0);

    if (this.cfg.defHpBonus > 0) this.d.currentHp = Math.ceil(this.d.currentHp * (1 + this.cfg.defHpBonus));

    // ambush: 标记首轮先手，在第一次 step() 时执行
    if (this.cfg.firstStrike) {
      this.waitingUnit = this.a;
      this.waitingTarget = this.d;
      this.state = 'pending_input';
      this.pendingAction = {
        unitId: 'attacker',
        unitName: this.a.name,
        availableSkills: this.a.skills.filter(s => s.currentCooldown <= 0),
      };
    }
  }

  /** 推进一次行动事件。返回当前状态。 */
  step(): SessionState {
    if (this.state === 'finished') return 'finished';

    // 处理等待中的 AI 行动
    if (this.state === 'running') {
      this.processNextAction();
    }

    return this.state;
  }

  /** 手动选择技能执行 */
  performAction(skillId: string): CombatRoundLog | null {
    if (this.state !== 'pending_input' || !this.waitingUnit || !this.waitingTarget) return null;

    const skill = this.waitingUnit.skills.find(s => s.id === skillId && s.currentCooldown <= 0);
    if (!skill) return null;

    const log = this.executeAction(this.waitingUnit, this.waitingTarget, skill);
    this.logs.push(log);

    this.waitingUnit = null;
    this.waitingTarget = null;
    this.pendingAction = null;

    // 处理敌方等待中的行动
    this.processAiActions();
    this.checkFinished();

    if ((this.state as SessionState) === 'finished') return log;

    return log;
  }

  getResult(): CombatResult {
    return buildResult(
      this.logs, this.seq,
      this.a.currentHp, this.a.maxHp,
      this.d.currentHp, this.d.maxHp,
      this.totalActions,
    );
  }

  /** 自动推进到结束或需要输入 */
  autoAdvance(): void {
    while (this.state === 'running') this.step();
  }

  // ── 私有方法 ──

  /** 处理一次行动事件的决策与执行 */
  private processNextAction(): void {
    if (this.a.currentHp <= 0 || this.d.currentHp <= 0) {
      this.state = 'finished';
      return;
    }
    if (this.totalActions >= ACTION_CAP) {
      this.state = 'finished';
      return;
    }

    let actor: 'a' | 'd';

    // ① 保底检查
    if (this.consecutiveCount >= PITY_MAX) {
      actor = this.lastActor === 'a' ? 'd' : 'a';
      this.a.coreStats.speed = this.a.baseSpeed;
      this.d.coreStats.speed = this.d.baseSpeed;
      this.consecutiveCount = 0;
    } else {
      // ② 正常速度比较
      const aSpd = this.a.coreStats.speed;
      const dSpd = this.d.coreStats.speed;

      if (aSpd > dSpd) {
        actor = 'a';
      } else if (dSpd > aSpd) {
        actor = 'd';
      } else {
        actor = this.lastActor === 'a' ? 'd' : this.lastActor === 'd' ? 'a' : 'a';
      }
    }

    const activeUnit = actor === 'a' ? this.a : this.d;
    const targetUnit = actor === 'a' ? this.d : this.a;

    // ③ 如果是玩家 → 暂停等待输入
    if (activeUnit.isPlayer) {
      this.waitingUnit = activeUnit;
      this.waitingTarget = targetUnit;
      this.state = 'pending_input';
      this.pendingAction = {
        unitId: actor === 'a' ? 'attacker' : 'defender',
        unitName: activeUnit.name,
        availableSkills: activeUnit.skills.filter(s => s.currentCooldown <= 0),
      };
      return;
    }

    // ④ AI 自动行动
    const skill = pickSkill(activeUnit);
    if (skill) {
      this.logs.push(this.executeAction(activeUnit, targetUnit, skill));
    }
  }

  /** 执行一次行动（公共逻辑，供手动和自动共用） */
  private executeAction(
    actor: InternalUnit, target: InternalUnit, skill: CombatSkill,
  ): CombatRoundLog {
    this.seq++;
    const log = doAction(actor, target, skill, this.seq);

    // 衰减
    decaySpeed(actor);
    actor.firstAction = false;
    tickCooldown(actor);

    // 连续计数
    const actorKey: 'a' | 'd' = actor === this.a ? 'a' : 'd';
    if (actorKey === this.lastActor) {
      this.consecutiveCount++;
    } else {
      this.consecutiveCount = 1;
      if (this.lastActor !== null) {
        const waiting = this.lastActor === 'a' ? this.a : this.d;
        waiting.coreStats.speed = waiting.baseSpeed;
      }
    }

    this.lastActor = actorKey;
    this.totalActions++;

    if (target.currentHp <= 0) this.state = 'finished';

    return log;
  }

  /** 处理所有就绪的 AI 行动 */
  private processAiActions(): void {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (this.state !== 'running') break;
      this.processNextAction();
    }
  }

  private checkFinished(): void {
    if (this.a.currentHp <= 0 || this.d.currentHp <= 0 || this.totalActions >= ACTION_CAP) {
      this.state = 'finished';
    }
  }
}
