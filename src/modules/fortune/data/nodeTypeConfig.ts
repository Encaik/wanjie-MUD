/**
 * modules/fortune/data/nodeTypeConfig.ts — 节点类型配置表
 *
 * 定义 15 种节点的分类、基础奖励、出现条件和深度限制。
 */

import type { NodeType, NodeCategory } from '../types';

/** 节点配置 */
export interface NodeTypeConfigEntry {
  /** 节点类型 */
  type: NodeType;
  /** 分类 */
  category: NodeCategory;
  /** 中文名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 最小出现深度 */
  minDepth: number;
  /** 最大出现深度（undefined=无限制） */
  maxDepth?: number;
  /** 出现权重（基础值，会被地形和主题修正） */
  baseWeight: number;
  /** 是否需要战斗 */
  requiresBattle: boolean;
  /** 基础灵石奖励 */
  baseSpiritStones: number;
  /** 基础经验奖励 */
  baseExperience: number;
  /** 图标 emoji */
  icon: string;
}

/** 节点类型配置表 */
export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfigEntry> = {
  // ─── 战斗类 ───
  enemy: {
    type: 'enemy',
    category: 'combat',
    name: '普通敌人',
    description: '遇到的普通修炼者或妖兽',
    minDepth: 1,
    baseWeight: 20,
    requiresBattle: true,
    baseSpiritStones: 10,
    baseExperience: 15,
    icon: '⚔️',
  },
  elite: {
    type: 'elite',
    category: 'combat',
    name: '精英敌人',
    description: '实力较强的对手，掉落更好',
    minDepth: 1,
    baseWeight: 5,
    requiresBattle: true,
    baseSpiritStones: 25,
    baseExperience: 35,
    icon: '🔥',
  },
  miniboss: {
    type: 'miniboss',
    category: 'combat',
    name: '小头目',
    description: '区域中的小头目，击败可获得较多行动力',
    minDepth: 2,
    baseWeight: 2,
    requiresBattle: true,
    baseSpiritStones: 50,
    baseExperience: 60,
    icon: '👹',
  },
  guardian: {
    type: 'guardian',
    category: 'combat',
    name: '守卫',
    description: '镇守楼层出口的强大存在，必须击败才能推进',
    minDepth: 1,
    maxDepth: undefined,
    baseWeight: 0, // 不由权重放置，由生成器保证出现
    requiresBattle: true,
    baseSpiritStones: 80,
    baseExperience: 100,
    icon: '💀',
  },

  // ─── 资源类 ───
  treasure: {
    type: 'treasure',
    category: 'resource',
    name: '宝箱',
    description: '内含随机灵石和物品',
    minDepth: 1,
    baseWeight: 10,
    requiresBattle: false,
    baseSpiritStones: 30,
    baseExperience: 10,
    icon: '💎',
  },
  mineral_vein: {
    type: 'mineral_vein',
    category: 'resource',
    name: '矿脉',
    description: '富含灵石的矿脉，可大量采集',
    minDepth: 1,
    baseWeight: 8,
    requiresBattle: false,
    baseSpiritStones: 60,
    baseExperience: 5,
    icon: '⛏️',
  },
  herb: {
    type: 'herb',
    category: 'resource',
    name: '药草',
    description: '珍贵的灵草，可用于炼丹',
    minDepth: 1,
    baseWeight: 8,
    requiresBattle: false,
    baseSpiritStones: 5,
    baseExperience: 8,
    icon: '🌿',
  },
  scroll_fragment: {
    type: 'scroll_fragment',
    category: 'resource',
    name: '残卷',
    description: '记载着功法或装备碎片的上古残卷',
    minDepth: 1,
    baseWeight: 8,
    requiresBattle: false,
    baseSpiritStones: 0,
    baseExperience: 20,
    icon: '📜',
  },

  // ─── 交互类 ───
  event: {
    type: 'event',
    category: 'interactive',
    name: '奇遇事件',
    description: '未知的事件，你的选择将决定结果',
    minDepth: 1,
    baseWeight: 12,
    requiresBattle: false,
    baseSpiritStones: 0,
    baseExperience: 15,
    icon: '❓',
  },
  merchant: {
    type: 'merchant',
    category: 'interactive',
    name: '游商',
    description: '在秘境中游走的商人，以随机价格出售物品',
    minDepth: 2,
    baseWeight: 3,
    requiresBattle: false,
    baseSpiritStones: 0,
    baseExperience: 0,
    icon: '🛒',
  },
  altar: {
    type: 'altar',
    category: 'interactive',
    name: '祭坛',
    description: '古老的祭坛，消耗灵石可获得临时祝福',
    minDepth: 2,
    baseWeight: 3,
    requiresBattle: false,
    baseSpiritStones: 0,
    baseExperience: 5,
    icon: '🕯️',
  },
  challenge: {
    type: 'challenge',
    category: 'interactive',
    name: '试炼碑',
    description: '刻有上古试炼的石碑，在限制条件下战斗获取丰厚奖励',
    minDepth: 2,
    baseWeight: 3,
    requiresBattle: true,
    baseSpiritStones: 100,
    baseExperience: 80,
    icon: '⚡',
  },

  // ─── 特殊类 ───
  portal: {
    type: 'portal',
    category: 'special',
    name: '传送阵',
    description: '可将你传送到地图另一处',
    minDepth: 2,
    baseWeight: 2,
    requiresBattle: false,
    baseSpiritStones: 0,
    baseExperience: 0,
    icon: '🔮',
  },
  trap: {
    type: 'trap',
    category: 'special',
    name: '陷阱',
    description: '隐藏的陷阱，触发后会受伤或中负面效果',
    minDepth: 1,
    baseWeight: 5,
    requiresBattle: false,
    baseSpiritStones: 0,
    baseExperience: 2,
    icon: '☠️',
  },
  fog: {
    type: 'fog',
    category: 'special',
    name: '迷雾',
    description: '被迷雾笼罩的区域，进入后才能知道里面是什么',
    minDepth: 3,
    baseWeight: 5,
    requiresBattle: false,
    baseSpiritStones: 0,
    baseExperience: 0,
    icon: '🌫️',
  },
};

/** 获取节点配置 */
export function getNodeTypeConfig(type: NodeType): NodeTypeConfigEntry {
  return NODE_TYPE_CONFIG[type];
}

/** 按分类获取节点类型列表 */
export function getNodeTypesByCategory(category: NodeCategory): NodeType[] {
  return Object.values(NODE_TYPE_CONFIG)
    .filter(c => c.category === category)
    .map(c => c.type);
}

/** 获取节点图标 */
export function getNodeIcon(type: NodeType): string {
  return NODE_TYPE_CONFIG[type]?.icon || '❓';
}
