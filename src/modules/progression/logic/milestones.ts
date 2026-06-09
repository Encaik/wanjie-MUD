/**
 * 突破质变节点系统
 *
 * 在关键等级突破时解锁新游戏机制，给玩家质变性成长体验。
 * 替代纯数值增长，提供"解锁新玩法"的兴奋时刻。
 */

// ============================================
// 里程碑定义
// ============================================

/** 里程碑解锁内容类型 */
export type MilestoneUnlock =
  | 'technique_system'    // 招式系统
  | 'crafting_system'      // 炼制系统
  | 'companion_system'     // 道侣系统
  | 'domain_ability'       // 领域展开
  | 'clone_ability'        // 分神化身
  | 'ascension_access';    // 飞升资格

/** 里程碑定义 */
export interface Milestone {
  /** 里程碑 ID */
  id: string;
  /** 触发等级 */
  level: number;
  /** 里程碑名称 */
  name: string;
  /** 解锁的机制列表 */
  unlocks: MilestoneUnlock[];
  /** 描述文本 */
  description: string;
  /** 天地异象描述 */
  phenomenon: string;
  /** 突破失败时的进度保留比例 */
  failProgressRetention: number;
  /** 下次突破成功率加成 */
  nextAttemptBonus: number;
}

/** 突破质变里程碑注册表 */
export const BREAKTHROUGH_MILESTONES: Record<number, Milestone> = {
  10: {
    id: 'first_enlightenment',
    level: 10,
    name: '初窥门径',
    unlocks: ['technique_system'],
    description: '你的修炼之路正式开启，可以学习和装备招式了！',
    phenomenon: '天降灵光，周身经脉贯通，隐隐感受到天地间流转的力量...',
    failProgressRetention: 0.5,
    nextAttemptBonus: 15,
  },
  20: {
    id: 'mastery_entry',
    level: 20,
    name: '登堂入室',
    unlocks: ['crafting_system'],
    description: '你对修炼有了更深的理解，现在可以炼制丹药和装备了！',
    phenomenon: '丹火自生，天地灵材的奥秘在你眼前展开...',
    failProgressRetention: 0.5,
    nextAttemptBonus: 15,
  },
  30: {
    id: 'harmony',
    level: 30,
    name: '融会贯通',
    unlocks: ['companion_system'],
    description: '你的名声远播，有志同道合的道侣前来与你同行！',
    phenomenon: '远处传来若有若无的共鸣，似乎有人在寻找你...',
    failProgressRetention: 0.5,
    nextAttemptBonus: 15,
  },
  45: {
    id: 'domain_awakening',
    level: 45,
    name: '炉火纯青',
    unlocks: ['domain_ability'],
    description: '你可以展开自己的领域了！战斗中每场可使用一次领域展开，全属性+20%持续3回合。',
    phenomenon: '天地为之变色，一道无形领域以你为中心扩散开来...',
    failProgressRetention: 0.5,
    nextAttemptBonus: 15,
  },
  60: {
    id: 'soul_division',
    level: 60,
    name: '出神入化',
    unlocks: ['clone_ability'],
    description: '你可以分化出分神化身了！一边修炼一边探索，事半功倍。',
    phenomenon: '元神出窍，一道分身自体内走出，与你相视一笑...',
    failProgressRetention: 0.5,
    nextAttemptBonus: 15,
  },
  80: {
    id: 'void_touch',
    level: 80,
    name: '破碎虚空',
    unlocks: ['ascension_access'],
    description: '你已经触摸到了这一方世界的极限，飞升之门为你打开！',
    phenomenon: '天穹裂开一道缝隙，无尽的光芒倾泻而下，虚空彼岸传来召唤...',
    failProgressRetention: 0.5,
    nextAttemptBonus: 15,
  },
};

// ============================================
// 里程碑查询
// ============================================

/**
 * 检查指定等级是否为质变节点
 *
 * @param level - 要检查的等级
 * @returns 如果是质变节点则返回里程碑，否则返回 null
 */
export function getMilestoneForLevel(level: number): Milestone | null {
  return BREAKTHROUGH_MILESTONES[level] || null;
}

/**
 * 获取下一个质变节点
 *
 * @param currentLevel - 当前等级
 * @returns 下一个里程碑和剩余等级数
 */
export function getNextMilestone(currentLevel: number): { milestone: Milestone; levelsRemaining: number } | null {
  const levels = Object.keys(BREAKTHROUGH_MILESTONES).map(Number).sort((a, b) => a - b);
  for (const level of levels) {
    if (level > currentLevel) {
      return {
        milestone: BREAKTHROUGH_MILESTONES[level],
        levelsRemaining: level - currentLevel,
      };
    }
  }
  return null;
}

// ============================================
// 突破失败保护
// ============================================

/** 突破尝试记录 */
export interface BreakthroughAttempt {
  /** 目标等级 */
  targetLevel: number;
  /** 失败次数 */
  failCount: number;
  /** 累计保留进度 (0-1) */
  retainedProgress: number;
}

/**
 * 计算应用失败保护后的突破成功率
 *
 * @param baseRate - 基础成功率
 * @param attempt - 之前的尝试记录
 * @param milestone - 质变节点（如果有）
 * @returns 调整后的成功率和更新的尝试记录
 */
export function applyFailProtection(
  baseRate: number,
  attempt: BreakthroughAttempt | null,
  milestone: Milestone | null
): { adjustedRate: number; updatedAttempt: BreakthroughAttempt } {
  const failCount = attempt?.failCount ?? 0;
  const retained = attempt?.retainedProgress ?? 0;

  // 质变节点的额外加成
  const milestoneBonus = milestone ? milestone.nextAttemptBonus * Math.min(failCount, 3) : 0;

  // 最多累计 3 次必成功
  const maxBonus = 3 * (milestone?.nextAttemptBonus ?? 10);
  const adjustedRate = Math.min(100, baseRate + milestoneBonus);

  // 第 3 次失败后必定成功
  const isGuaranteed = failCount >= 3;

  return {
    adjustedRate: isGuaranteed ? 100 : adjustedRate,
    updatedAttempt: {
      targetLevel: attempt?.targetLevel ?? 0,
      failCount: failCount + (isGuaranteed ? 0 : 0), // 成功时重置，调用方处理
      retainedProgress: retained + (milestone?.failProgressRetention ?? 0),
    },
  };
}
