/**
 * modules/fortune/logic/nodeResolver.ts — 节点解析器
 *
 * 纯函数模块：根据节点类型分发处理逻辑。
 * 战斗类节点返回 BattleEncounter 数据（由 Hook 层交给 combat 引擎），
 * 其他节点直接计算并返回结果。
 */

import type {
  FortuneNode,
  FortuneSession,
  FortuneMap,
  NodeResult,
  BattleEncounter,
  FortuneLoot,
  FortuneEventTemplate,
} from '../types';
import { getNodeTypeConfig } from '../data/nodeTypeConfig';
import { calculateNodeReward } from './rewardCalculator';
import { fortuneEventRegistry, selectRandomEvent } from './eventEngine';

/** 节点解析上下文 */
export interface NodeResolveContext {
  /** 玩家最大 HP（用于计算 HP 变化） */
  playerMaxHp: number;
  /** 玩家最大 MP */
  playerMaxMp: number;
  /** 随机数生成函数 */
  rng: () => number;
}

/**
 * 解析节点——根据类型分发处理
 *
 * @param node - 要处理的节点
 * @param session - 当前机缘会话
 * @param context - 解析上下文
 * @returns 节点处理结果
 */
export function resolveNode(
  node: FortuneNode,
  session: FortuneSession,
  context: NodeResolveContext
): NodeResult {
  const nodeConfig = getNodeTypeConfig(node.type);

  if (!nodeConfig) {
    return {
      success: false,
      nodeType: node.type,
      message: '未知节点类型',
      requiresBattle: false,
    };
  }

  switch (node.category) {
    case 'combat':
      return resolveCombatNode(node, nodeConfig, session);
    case 'resource':
      return resolveResourceNode(node, nodeConfig, session);
    case 'interactive':
      return resolveInteractiveNode(node, nodeConfig, session, context);
    case 'special':
      return resolveSpecialNode(node, nodeConfig, session, context);
    default:
      return {
        success: true,
        nodeType: node.type,
        message: '这里什么都没有。',
        requiresBattle: false,
      };
  }
}

// ============================================
// 战斗类节点
// ============================================

function resolveCombatNode(
  node: FortuneNode,
  _nodeConfig: ReturnType<typeof getNodeTypeConfig>,
  _session: FortuneSession
): NodeResult {
  const enemyContent = node.content as { name?: string; level?: number; tier?: string } | undefined;
  const tier = (enemyContent?.tier || mapNodeTypeToEnemyTier(node.type)) as BattleEncounter['enemyTier'];

  const battleData: BattleEncounter = {
    enemyName: enemyContent?.name || getDefaultEnemyName(node.type),
    enemyLevel: enemyContent?.level || 1,
    enemyTier: tier,
    nodeType: node.type,
  };

  return {
    success: true,
    nodeType: node.type,
    message: `遭遇了${battleData.enemyName}！`,
    requiresBattle: true,
    battleData,
  };
}

function mapNodeTypeToEnemyTier(nodeType: string): BattleEncounter['enemyTier'] {
  switch (nodeType) {
    case 'enemy': return 'normal';
    case 'elite': return 'elite';
    case 'miniboss': return 'miniboss';
    case 'guardian':
    case 'challenge': return 'boss';
    default: return 'normal';
  }
}

function getDefaultEnemyName(nodeType: string): string {
  switch (nodeType) {
    case 'elite': return '精英妖兽';
    case 'miniboss': return '妖兽统领';
    case 'guardian': return '楼层守卫';
    case 'challenge': return '试炼守护者';
    default: return '妖兽';
  }
}

// ============================================
// 资源类节点
// ============================================

function resolveResourceNode(
  node: FortuneNode,
  _nodeConfig: ReturnType<typeof getNodeTypeConfig>,
  session: FortuneSession
): NodeResult {
  const reward = calculateNodeReward(
    node.type,
    session.currentDepth,
    session.fortuneType,
    node.rewardMultiplier
  );

  const directRewards: FortuneLoot = {
    spiritStones: reward.spiritStones,
    items: [],
    fragments: reward.fragments,
    experience: reward.experience,
  };

  const typeNames: Record<string, string> = {
    treasure: '宝箱',
    mineral_vein: '矿脉',
    herb: '药草',
    scroll_fragment: '残卷',
  };

  const typeName = typeNames[node.type] || node.type;
  let message = `发现了${typeName}！`;

  if (reward.spiritStones > 0) {
    message += ` 获得 ${reward.spiritStones} 灵石`;
  }
  if (reward.experience > 0) {
    message += `、${reward.experience} 经验`;
  }
  if (reward.fragments.length > 0) {
    message += `、碎片×${reward.fragments.reduce((s, f) => s + f.count, 0)}`;
  }
  message += '。';

  return {
    success: true,
    nodeType: node.type,
    message,
    requiresBattle: false,
    directRewards,
  };
}

// ============================================
// 交互类节点
// ============================================

function resolveInteractiveNode(
  node: FortuneNode,
  _nodeConfig: ReturnType<typeof getNodeTypeConfig>,
  session: FortuneSession,
  _context: NodeResolveContext
): NodeResult {
  switch (node.type) {
    case 'event': {
      // 查询匹配的事件
      const events = fortuneEventRegistry.query(
        undefined, // worldType - 从 session 扩展
        session.fortuneType,
        session.currentDepth
      );

      const selected = selectRandomEvent(events, _context.rng);

      if (!selected) {
        return {
          success: true,
          nodeType: 'event',
          message: '这里似乎有什么发生过，但已经消散了……',
          requiresBattle: false,
        };
      }

      // 返回事件信息，由 UI 层展示选择
      return {
        success: true,
        nodeType: 'event',
        message: selected.title,
        requiresBattle: false,
        directRewards: {
          spiritStones: 0,
          items: [],
          fragments: [],
          experience: 0,
        },
      };
    }

    case 'merchant': {
      const spiritStones = Math.floor(20 + session.currentDepth * 10);
      return {
        success: true,
        nodeType: 'merchant',
        message: `遇到了一位游商！他以折扣价出售物品。`,
        requiresBattle: false,
        directRewards: {
          spiritStones: 0,
          items: [],
          fragments: [],
          experience: 0,
        },
      };
    }

    case 'altar': {
      return {
        success: true,
        nodeType: 'altar',
        message: '发现了一座古老的祭坛，可以消耗灵石换取临时祝福。',
        requiresBattle: false,
        directRewards: {
          spiritStones: 0,
          items: [],
          fragments: [],
          experience: 10,
        },
      };
    }

    case 'challenge': {
      // 试炼碑：限制条件战斗
      const enemyContent = node.content as { name?: string; level?: number } | undefined;
      const battleData: BattleEncounter = {
        enemyName: enemyContent?.name || '试炼守护者',
        enemyLevel: enemyContent?.level || (session.currentDepth * 3 + 5),
        enemyTier: 'boss',
        nodeType: 'challenge',
      };

      return {
        success: true,
        nodeType: 'challenge',
        message: `试炼碑上浮现出文字："击败守护者，可得我之传承。"`,
        requiresBattle: true,
        battleData,
      };
    }

    default:
      return {
        success: true,
        nodeType: node.type,
        message: '这里什么都没有。',
        requiresBattle: false,
      };
  }
}

// ============================================
// 特殊类节点
// ============================================

function resolveSpecialNode(
  node: FortuneNode,
  _nodeConfig: ReturnType<typeof getNodeTypeConfig>,
  session: FortuneSession,
  context: NodeResolveContext
): NodeResult {
  switch (node.type) {
    case 'portal': {
      return {
        success: true,
        nodeType: 'portal',
        message: '传送阵启动了！你被传送到了地图的另一处。',
        requiresBattle: false,
      };
    }

    case 'trap': {
      const dmgRatio = 0.05 + context.rng() * 0.1; // 5%-15% HP
      const hpLoss = Math.floor(context.playerMaxHp * dmgRatio);
      return {
        success: true,
        nodeType: 'trap',
        message: `触发了陷阱！你受到了 ${hpLoss} 点伤害。`,
        requiresBattle: false,
        hpChange: -hpLoss,
      };
    }

    case 'fog': {
      // 迷雾：揭示后随机变成其他节点类型
      const possibleTypes = ['enemy', 'treasure', 'event', 'trap'] as const;
      const revealedType = possibleTypes[Math.floor(context.rng() * possibleTypes.length)];

      // 递归解析揭示的节点
      const fakeNode: FortuneNode = {
        ...node,
        type: revealedType,
        category: getNodeTypeConfig(revealedType).category,
      };

      const result = resolveNode(fakeNode, session, context);
      result.message = `迷雾散去……${result.message}`;
      return result;
    }

    default:
      return {
        success: true,
        nodeType: node.type,
        message: '这里什么都没有。',
        requiresBattle: false,
      };
  }
}
