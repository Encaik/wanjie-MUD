/**
 * 阶段三：心魔炼化（phase3_battle）
 *
 * MVP 版本：自动模拟炼化战斗过程。
 * 基于玩家 CoreStats 计算击中/错过弱点的概率，生成战斗日志。
 * 后续阶段2将替换为点击交互。
 *
 * @module modules/progression/logic/demonBreakthrough
 */

import type {
  RefineBattleParams,
  RefineBattleResult,
  WeaknessType,
  WeaknessHit,
} from './types';

// ============================================
// 弱点配置
// ============================================

/** 弱点类型权重配置 */
interface WeaknessConfig {
  type: WeaknessType;
  /** 出现权重 */
  weight: number;
  /** 基础伤害 */
  baseDamage: number;
  /** 是否为正面效果 */
  positive: boolean;
}

const WEAKNESS_CONFIGS: WeaknessConfig[] = [
  { type: 'physical', weight: 40, baseDamage: 10, positive: true },
  { type: 'special', weight: 35, baseDamage: 12, positive: true },
  { type: 'critical', weight: 5, baseDamage: 25, positive: true },
  { type: 'recovery', weight: 10, baseDamage: 0, positive: true },
  { type: 'trap', weight: 10, baseDamage: -10, positive: false },
];

const totalWeaknessWeight = WEAKNESS_CONFIGS.reduce((s, c) => s + c.weight, 0);

// ============================================
// 主模拟函数
// ============================================

/**
 * 模拟阶段三的心魔炼化战斗过程
 *
 * 计算逻辑：
 * 1. 根据 speed 确定弱点出现总次数
 * 2. 根据 perception 确定玩家的命中率
 * 3. 逐个弱点判定击中/错过
 * 4. 积累炼化进度或损失心境护盾
 * 5. 心境护盾归零即失败，进度满即成功
 *
 * @param params - 炼化战斗参数
 * @returns 炼化战斗结果
 */
// eslint-disable-next-line complexity
export function simulateRefineBattle(params: RefineBattleParams): RefineBattleResult {
  const {
    physicalATK,
    specialATK,
    speed,
    perception,
    mindShield: initialMindShield,
    items,
    finalSkillAvailable,
    pathType,
  } = params;

  const result: RefineBattleResult = {
    progress: 0,
    mindShield: Math.max(0, initialMindShield),
    hits: [],
    weaknessesHit: 0,
    weaknessesMissed: 0,
    perfectTriggered: false,
    itemsUsed: [],
    finalSkillUsed: false,
    battleLog: [],
  };

  // 计算弱点总数（speed 影响，15-30次）
  const totalWeaknesses = Math.floor(15 + speed * 2.5);
  const maxWeaknesses = Math.min(totalWeaknesses, 30);

  // 命中率（perception 影响，0.3-0.9）
  const hitRate = clamp(0.3, 0.9, 0.3 + perception * 0.015);

  // 暴击率（perception 高时有额外暴击机会）
  const critBonus = perception > 80 ? 0.10 : 0;

  // 是否使用道具（简化：前3个自动使用）
  const availableItems = [...items];
  let shieldPotionUsed = false;
  let powerElixirUsed = false;

  // 游戏循环：逐个弱点处理
  for (let i = 0; i < maxWeaknesses; i++) {
    // 检查失败条件
    if (result.mindShield <= 0) {
      result.battleLog.push('心境护盾破碎！心魔趁虚而入……');
      break;
    }

    // 检查成功条件
    if (result.progress >= 100) {
      result.battleLog.push('炼化进度已满！心魔即将被炼化！');
      break;
    }

    // 自动使用道具
    if (!shieldPotionUsed && result.mindShield < 30 && availableItems.includes('清心丹')) {
      result.mindShield = Math.min(100, result.mindShield + 30);
      result.itemsUsed.push('清心丹');
      shieldPotionUsed = true;
      result.battleLog.push('使用了清心丹！心境护盾恢复30点。');
    }
    if (!powerElixirUsed && result.progress > 50 && result.progress < 80 && availableItems.includes('破魔符')) {
      result.progress += 20;
      result.itemsUsed.push('破魔符');
      powerElixirUsed = true;
      result.battleLog.push('使用了破魔符！炼化进度+20。');
    }

    // 流派终结技（进度>60时自动使用）
    if (finalSkillAvailable && !result.finalSkillUsed && result.progress > 60) {
      const skillDamage = applyFinalSkill(pathType, result);
      result.battleLog.push(skillDamage);
    }

    // 判定是否命中
    const hitRoll = Math.random(); // 阶段三允许真随机，这是操作感的核心
    const isHit = hitRoll < hitRate;

    if (!isHit) {
      result.weaknessesMissed++;
      // 未命中时心魔攻击
      const demonAttack = 3 + Math.floor(Math.random() * 5);
      result.mindShield = Math.max(0, result.mindShield - demonAttack);
      continue;
    }

    // 判定弱点类型
    const weakness = rollWeakness();
    result.weaknessesHit++;

    // 处理陷阱
    if (weakness.type === 'trap') {
      result.mindShield = Math.max(0, result.mindShield + weakness.baseDamage); // baseDamage is negative
      result.battleLog.push(`触发了心魔陷阱！心境 -${Math.abs(weakness.baseDamage)}`);
      continue;
    }

    // 处理恢复
    if (weakness.type === 'recovery') {
      result.mindShield = Math.min(100, result.mindShield + 15);
      result.battleLog.push('击中了恢复弱点！心境护盾 +15');
      continue;
    }

    // 计算伤害
    const isCrit = Math.random() < (0.05 + critBonus);
    let damage = weakness.baseDamage;

    // 攻击力加成
    if (weakness.type === 'physical') {
      damage += Math.floor(physicalATK * 0.5);
    } else if (weakness.type === 'special') {
      damage += Math.floor(specialATK * 0.6);
    } else if (weakness.type === 'critical') {
      damage += Math.floor((physicalATK + specialATK) * 0.8);
      damage = Math.floor(damage * 2.0); // critical弱点总是暴击
    }

    if (isCrit) {
      damage = Math.floor(damage * 2.0);
    }

    const hit: WeaknessHit = {
      type: weakness.type,
      damage,
      critical: isCrit,
    };
    result.hits.push(hit);
    result.progress = Math.min(100, result.progress + damage);

    // 完美炼化判定
    if (!result.perfectTriggered && perception >= 60 && Math.random() < 0.03) {
      result.perfectTriggered = true;
      result.progress = 100;
      result.battleLog.push('⚡ 完美炼化！一击毙命！');
      break;
    }

    // 心魔反击（每次命中后心魔小额反击）
    result.mindShield = Math.max(0, result.mindShield - Math.floor(Math.random() * 2));
  }

  return result;
}

// ============================================
// 流派终结技
// ============================================

/**
 * 应用流派终结技效果
 */
function applyFinalSkill(
  pathType: string | null,
  result: RefineBattleResult,
): string {
  result.finalSkillUsed = true;
  switch (pathType) {
    case 'body':
      result.progress = Math.min(100, result.progress + 30);
      return '金刚怒目！5秒内造成30点额外炼化伤害！';
    case 'sword':
      result.progress = Math.min(100, result.progress + 50);
      return '一剑破魔！剑气贯穿心魔，造成50点炼化伤害！';
    case 'spell':
      // 法修：降速弱点移动（模拟为增加命中率）
      result.battleLog.push('万法归一！心魔弱点移动停止3秒！');
      // 额外获得3次免费命中
      for (let i = 0; i < 3; i++) {
        const bonusWeakness = rollWeakness();
        if (bonusWeakness.type !== 'trap') {
          result.progress = Math.min(100, result.progress + bonusWeakness.baseDamage);
          result.weaknessesHit++;
        }
      }
      return '万法归一！心魔弱点被定身，连续命中3次！';
    case 'alchemy':
      result.battleLog.push('丹火焚魔！持续10秒每秒自动造成伤害！');
      result.progress = Math.min(100, result.progress + 40);
      return '丹火焚魔！持续灼烧心魔，造成40点炼化伤害！';
    case 'demon':
      result.mindShield = Math.max(0, result.mindShield - 30);
      result.progress = Math.min(100, result.progress + 80);
      return '魔噬！消耗30心境护盾，对心魔造成80点毁灭性伤害！';
    default:
      result.progress = Math.min(100, result.progress + 20);
      return '终结技造成20点额外炼化伤害！';
  }
}

// ============================================
// 工具函数
// ============================================

/** 按权重随机选择弱点类型 */
function rollWeakness(): WeaknessConfig {
  let roll = Math.random() * totalWeaknessWeight;
  for (const config of WEAKNESS_CONFIGS) {
    roll -= config.weight;
    if (roll <= 0) return config;
  }
  return WEAKNESS_CONFIGS[0];
}

/** 数值限制 */
function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}
