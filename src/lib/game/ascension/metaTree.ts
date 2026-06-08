/**
 * 飞升元进程树
 *
 * 飞升后获得传承点数，解锁永久性新机制。
 * 分为三个分支：战斗之道、修炼之道、探索之道，每个分支 5 层。
 */

// ============================================
// 类型定义
// ============================================

/** 分支类型 */
export type MetaBranch = 'combat' | 'cultivation' | 'exploration';

/** 节点效果类型 */
export type MetaEffect =
  | { type: 'elemental_mastery'; bonus: number }   // 元素克制伤害提升
  | { type: 'crit_boost'; rate: number }             // 暴击率提升
  | { type: 'cultivation_speed'; multiplier: number } // 修炼收益倍率
  | { type: 'offline_boost'; multiplier: number }     // 离线收益提升
  | { type: 'exploration_vision'; range: number }     // 迷雾可视范围增加
  | { type: 'treasure_sense'; rate: number }         // 宝箱发现率提升
  | { type: 'guaranteed_breakthrough'; level: number } // 必定突破（某等级前）
  | { type: 'resource_efficiency'; rate: number }     // 资源消耗降低
  | { type: 'unlock_technique_slot'; count: number }  // 解锁额外招式槽位
  | { type: 'elemental_immunity'; element: string };  // 元素免疫

/** 元进程树节点 */
export interface MetaNode {
  /** 节点 ID */
  id: string;
  /** 节点名称 */
  name: string;
  /** 所属分支 */
  branch: MetaBranch;
  /** 层级 (1-5) */
  tier: number;
  /** 解锁所需点数 */
  cost: number;
  /** 前置节点 ID（同分支上一级，tier=1 时为 null） */
  prerequisite: string | null;
  /** 节点效果 */
  effects: MetaEffect[];
  /** 节点描述 */
  description: string;
}

/** 元进程状态 */
export interface MetaProgress {
  /** 当前可用点数 */
  totalPoints: number;
  /** 已解锁节点 ID 列表 */
  unlockedNodes: string[];
  /** 元进程版本号 */
  treeVersion: number;
}

// ============================================
// 元进程树定义（15 个节点）
// ============================================

export const META_TREE: Record<string, MetaNode> = {
  // === 战斗之道 ===
  combat_t1_elemental_eye: {
    id: 'combat_t1_elemental_eye',
    name: '元素之眼',
    branch: 'combat',
    tier: 1,
    cost: 3,
    prerequisite: null,
    effects: [{ type: 'elemental_mastery', bonus: 0.10 }],
    description: '战斗时可看到敌人的元素弱点，元素克制伤害+10%。',
  },
  combat_t2_crit_strike: {
    id: 'combat_t2_crit_strike',
    name: '致命一击',
    branch: 'combat',
    tier: 2,
    cost: 3,
    prerequisite: 'combat_t1_elemental_eye',
    effects: [{ type: 'crit_boost', rate: 0.05 }],
    description: '暴击率永久+5%。',
  },
  combat_t3_extra_slot: {
    id: 'combat_t3_extra_slot',
    name: '万法归宗',
    branch: 'combat',
    tier: 3,
    cost: 5,
    prerequisite: 'combat_t2_crit_strike',
    effects: [{ type: 'unlock_technique_slot', count: 1 }],
    description: '额外解锁 1 个招式槽位。',
  },
  combat_t4_elemental_mastery: {
    id: 'combat_t4_elemental_mastery',
    name: '元素通感',
    branch: 'combat',
    tier: 4,
    cost: 5,
    prerequisite: 'combat_t3_extra_slot',
    effects: [{ type: 'elemental_mastery', bonus: 0.15 }],
    description: '元素克制伤害额外+15%（累计+25%）。',
  },
  combat_t5_elemental_immunity: {
    id: 'combat_t5_elemental_immunity',
    name: '战之至尊',
    branch: 'combat',
    tier: 5,
    cost: 8,
    prerequisite: 'combat_t4_elemental_mastery',
    effects: [{ type: 'elemental_immunity', element: 'all' }],
    description: '元素免疫！不再被任何元素克制。获得称号「战之至尊」。',
  },

  // === 修炼之道 ===
  cult_t1_stone_efficiency: {
    id: 'cult_t1_stone_efficiency',
    name: '灵石聚纳',
    branch: 'cultivation',
    tier: 1,
    cost: 1,
    prerequisite: null,
    effects: [{ type: 'offline_boost', multiplier: 0.5 }],
    description: '离线期间灵石获取速度+50%。',
  },
  cult_t2_cultivation_speed: {
    id: 'cult_t2_cultivation_speed',
    name: '修炼加速',
    branch: 'cultivation',
    tier: 2,
    cost: 3,
    prerequisite: 'cult_t1_stone_efficiency',
    effects: [{ type: 'cultivation_speed', multiplier: 0.2 }],
    description: '修炼收益倍率+20%。',
  },
  cult_t3_resource_saver: {
    id: 'cult_t3_resource_saver',
    name: '资源节约',
    branch: 'cultivation',
    tier: 3,
    cost: 3,
    prerequisite: 'cult_t2_cultivation_speed',
    effects: [{ type: 'resource_efficiency', rate: 0.2 }],
    description: '修炼资源消耗-20%。',
  },
  cult_t4_guaranteed_breakthrough: {
    id: 'cult_t4_guaranteed_breakthrough',
    name: '天道眷顾',
    branch: 'cultivation',
    tier: 4,
    cost: 5,
    prerequisite: 'cult_t3_resource_saver',
    effects: [{ type: 'guaranteed_breakthrough', level: 30 }],
    description: '30 级之前的突破必定成功！',
  },
  cult_t5_perfect_cultivation: {
    id: 'cult_t5_perfect_cultivation',
    name: '修之至尊',
    branch: 'cultivation',
    tier: 5,
    cost: 8,
    prerequisite: 'cult_t4_guaranteed_breakthrough',
    effects: [{ type: 'cultivation_speed', multiplier: 0.5 }, { type: 'resource_efficiency', rate: 0.3 }],
    description: '修炼收益+50%，资源消耗-30%。获得称号「修之至尊」。',
  },

  // === 探索之道 ===
  expl_t1_vision_range: {
    id: 'expl_t1_vision_range',
    name: '天机感应',
    branch: 'exploration',
    tier: 1,
    cost: 2,
    prerequisite: null,
    effects: [{ type: 'exploration_vision', range: 1 }],
    description: '迷雾中的相邻格有 30% 概率显示模糊内容提示。',
  },
  expl_t2_treasure_sense: {
    id: 'expl_t2_treasure_sense',
    name: '寻宝直觉',
    branch: 'exploration',
    tier: 2,
    cost: 3,
    prerequisite: 'expl_t1_vision_range',
    effects: [{ type: 'treasure_sense', rate: 0.1 }],
    description: '宝箱发现率+10%。',
  },
  expl_t3_deep_vision: {
    id: 'expl_t3_deep_vision',
    name: '全景视野',
    branch: 'exploration',
    tier: 3,
    cost: 4,
    prerequisite: 'expl_t2_treasure_sense',
    effects: [{ type: 'exploration_vision', range: 1 }],
    description: '迷雾可视范围额外+1（累计 2 格外可见）。',
  },
  expl_t4_treasure_mastery: {
    id: 'expl_t4_treasure_mastery',
    name: '财源滚滚',
    branch: 'exploration',
    tier: 4,
    cost: 5,
    prerequisite: 'expl_t3_deep_vision',
    effects: [{ type: 'treasure_sense', rate: 0.15 }],
    description: '宝箱发现率额外+15%（累计+25%），宝箱奖励翻倍。',
  },
  expl_t5_full_vision: {
    id: 'expl_t5_full_vision',
    name: '探之至尊',
    branch: 'exploration',
    tier: 5,
    cost: 8,
    prerequisite: 'expl_t4_treasure_mastery',
    effects: [{ type: 'exploration_vision', range: 99 }],
    description: '全图透视！进入秘境时全部地图可见。获得称号「探之至尊」。',
  },
};

// ============================================
// 操作函数
// ============================================

/** 传承点数计算用的成就统计 */
export interface AscensionCompletionStats {
  /** 飞升时等级 */
  level: number;
  /** 击败 Boss 次数 */
  bossesKilled: number;
  /** 完成事件链数量 */
  eventChainsCompleted: number;
  /** 门派声望等级（0-5） */
  factionReputationLevel: number;
  /** 已收集的功法数 */
  techniquesCollected: number;
  /** 已收集的装备数 */
  equipmentsCollected: number;
}

/**
 * 计算飞升后获得的传承点数
 *
 * @param stats - 成就统计
 * @returns 传承点数
 */
export function calculateMetaPoints(stats: AscensionCompletionStats): number {
  let points = 5; // 基础点数

  // 等级奖励（每 10 级 +1，最多 +8）
  points += Math.min(Math.floor(stats.level / 10), 8);

  // Boss 击败奖励
  if (stats.bossesKilled >= 5) points += 1;
  if (stats.bossesKilled >= 20) points += 1;

  // 事件链奖励
  points += Math.min(stats.eventChainsCompleted, 3);

  // 门派声望奖励
  if (stats.factionReputationLevel >= 4) points += 1;

  // 收集奖励
  if (stats.techniquesCollected >= 10) points += 1;
  if (stats.equipmentsCollected >= 10) points += 1;

  return Math.min(points, 15); // 最多 15 点
}

/**
 * 检查节点是否可解锁
 *
 * @param nodeId - 节点 ID
 * @param progress - 当前元进程状态
 * @returns 是否可解锁
 */
export function canUnlockNode(nodeId: string, progress: MetaProgress): boolean {
  const node = META_TREE[nodeId];
  if (!node) return false;
  if (progress.unlockedNodes.includes(nodeId)) return false; // 已解锁
  if (progress.totalPoints < node.cost) return false; // 点数不足
  if (node.prerequisite && !progress.unlockedNodes.includes(node.prerequisite)) return false; // 前置未解锁
  return true;
}

/**
 * 解锁节点并应用效果
 *
 * @param nodeId - 要解锁的节点 ID
 * @param progress - 当前元进程状态
 * @returns 更新后的元进程状态，或 null 表示解锁失败
 */
export function unlockMetaNode(nodeId: string, progress: MetaProgress): MetaProgress | null {
  if (!canUnlockNode(nodeId, progress)) return null;

  return {
    totalPoints: progress.totalPoints - META_TREE[nodeId].cost,
    unlockedNodes: [...progress.unlockedNodes, nodeId],
    treeVersion: progress.treeVersion,
  };
}

/**
 * 获取节点的所有效果
 *
 * @param nodeIds - 已解锁的节点 ID 列表
 * @returns 所有效果的合并列表
 */
export function getActiveMetaEffects(nodeIds: string[]): MetaEffect[] {
  const effects: MetaEffect[] = [];
  for (const id of nodeIds) {
    const node = META_TREE[id];
    if (node) effects.push(...node.effects);
  }
  return effects;
}

/** localStorage 键名 */
export const META_PROGRESS_KEY = 'wanjie_meta_progress';

/**
 * 从 localStorage 读取元进程
 */
export function loadMetaProgress(): MetaProgress {
  try {
    const raw = localStorage.getItem(META_PROGRESS_KEY);
    if (raw) return JSON.parse(raw) as MetaProgress;
  } catch { /* 忽略解析错误 */ }
  return { totalPoints: 0, unlockedNodes: [], treeVersion: 1 };
}

/**
 * 保存元进程到 localStorage
 */
export function saveMetaProgress(progress: MetaProgress): void {
  try {
    localStorage.setItem(META_PROGRESS_KEY, JSON.stringify(progress));
  } catch { /* 忽略存储错误 */ }
}
