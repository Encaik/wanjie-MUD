/**
 * 地牢事件触发服务
 * 
 * 负责事件触发判断、事件选择、结果执行
 * 根据 comprehensive-optimization-design.md 设计文档实现
 */

import {
  DUNGEON_EVENTS,
  getAvailableEvents,
  EVENTS_BY_ID,
} from './eventConfigs';
import {
  DungeonEvent,
  DungeonChoice,
  DungeonOutcome,
  EventTriggerConfig,
  DEFAULT_TRIGGER_CONFIG,
  EventExecutionContext,
  EventExecutionResult,
  EventStatistics,
  ChoiceRequirements,
  RequirementCheckResult,
  EventEffect,
  DungeonEventType,
} from './types';
import { Protagonist, InventoryItem, CharacterStats, getFinalStats, StatKey } from '@/core/types';

// ============================================
// 需求检查
// ============================================

/**
 * 检查玩家是否满足选择的需求条件
 */
export function checkRequirements(
  requirements: ChoiceRequirements | undefined,
  player: Protagonist
): RequirementCheckResult {
  if (!requirements) {
    return { satisfied: true, missingReqs: [] };
  }

  const missingReqs: string[] = [];

  // 等级检查
  if (requirements.minLevel !== undefined && player.level < requirements.minLevel) {
    missingReqs.push(`需要等级 ${requirements.minLevel}`);
  }
  if (requirements.maxLevel !== undefined && player.level > requirements.maxLevel) {
    missingReqs.push(`等级不能超过 ${requirements.maxLevel}`);
  }

  // HP百分比检查
  if (requirements.minHpPercent !== undefined) {
    const hpPercent = (player.currentHp / Math.max(1, player.maxHp)) * 100;
    if (hpPercent < requirements.minHpPercent) {
      missingReqs.push(`需要生命值 ${requirements.minHpPercent}%`);
    }
  }

  // MP百分比检查
  if (requirements.minMpPercent !== undefined) {
    const mpPercent = (player.currentMp / Math.max(1, player.maxMp)) * 100;
    if (mpPercent < requirements.minMpPercent) {
      missingReqs.push(`需要法力值 ${requirements.minMpPercent}%`);
    }
  }

  // 灵石检查
  if (requirements.spiritStones !== undefined) {
    const spiritStoneItem = player.inventory.find(
      item => item.definition.id === 'spirit_stone' || item.definition.type === '灵石'
    );
    const spiritStones = spiritStoneItem?.quantity || 0;
    if (spiritStones < requirements.spiritStones) {
      missingReqs.push(`需要 ${requirements.spiritStones} 灵石`);
    }
  }

  // 物品检查
  if (requirements.itemId !== undefined) {
    const hasItem = player.inventory.some(
      item => item.definition.id === requirements.itemId
    );
    if (!hasItem) {
      missingReqs.push(`需要特定物品`);
    }
  }

  // 属性检查
  if (requirements.stats) {
    const stats = getFinalStats(player.stats);
    for (const [stat, value] of Object.entries(requirements.stats)) {
      const statKey = stat as StatKey;
      const playerStat = stats[statKey] || 0;
      if (playerStat < (value || 0)) {
        missingReqs.push(`需要 ${stat} ${value}`);
      }
    }
  }

  // 功法检查
  if (requirements.techniqueId !== undefined) {
    const hasTechnique = player.techniques.some(
      tech => tech.id === requirements.techniqueId
    );
    if (!hasTechnique) {
      missingReqs.push(`需要特定功法`);
    }
  }

  return {
    satisfied: missingReqs.length === 0,
    missingReqs,
  };
}

/**
 * 获取选择是否可用
 */
export function isChoiceAvailable(
  choice: DungeonChoice,
  player: Protagonist
): { available: boolean; missingReqs: string[] } {
  const result = checkRequirements(choice.requirements, player);
  return {
    available: result.satisfied,
    missingReqs: result.missingReqs,
  };
}

// ============================================
// 事件触发服务
// ============================================

/**
 * 事件触发服务
 * 
 * 负责判断是否触发事件、选择事件、执行选择
 */
export class EventTriggerService {
  private triggeredEvents: Set<string> = new Set();
  private consecutiveMisses: number = 0;
  private statistics: EventStatistics = {
    totalTriggers: 0,
    triggersByType: {} as Record<DungeonEventType, number>,
    triggersByEventId: {},
    lastTriggerTime: 0,
    triggeredOneTimeEvents: new Set(),
  };

  constructor() {
    // 初始化统计数据
    const eventTypes: DungeonEventType[] = [
      'treasure', 'mystery', 'trap', 'merchant', 
      'shrine', 'hidden_room', 'elite_guardian', 'blessing'
    ];
    for (const type of eventTypes) {
      this.statistics.triggersByType[type] = 0;
    }
  }

  /**
   * 检查是否应该触发事件
   */
  shouldTriggerEvent(
    cellType: string,
    player: Protagonist,
    config: EventTriggerConfig = DEFAULT_TRIGGER_CONFIG
  ): boolean {
    // 只有空格子和事件类型格子可以触发随机事件
    if (!['empty', 'event'].includes(cellType)) {
      return false;
    }

    // 【修复】event 类型格子应该100%触发事件，不进行概率判断
    // 这是地图上明确标记的事件格子，玩家踩上去就应该触发
    if (cellType === 'event') {
      return true;
    }

    // empty 类型格子使用概率触发
    let probability = config.baseProbability;

    // 低血量修正 - 血量低于30%时提高触发率
    const hpPercent = player.currentHp / Math.max(1, player.maxHp);
    if (hpPercent < 0.3) {
      probability *= config.modifiers.lowHp;
    }

    // 高等级修正 - 等级>=50时降低触发率
    if (player.level >= 50) {
      probability *= config.modifiers.highLevel;
    }

    // 连续未触发修正 - 每次未触发增加概率
    probability *= Math.pow(config.modifiers.consecutiveMiss, this.consecutiveMisses);

    const triggered = Math.random() < probability;

    if (triggered) {
      this.consecutiveMisses = 0;
    } else {
      this.consecutiveMisses++;
    }

    return triggered;
  }

  /**
   * 随机选择一个事件
   */
  selectRandomEvent(
    player: Protagonist,
    difficulty: number
  ): DungeonEvent | null {
    const hpPercent = (player.currentHp / Math.max(1, player.maxHp)) * 100;
    
    // 过滤符合条件的事件
    const availableEvents = getAvailableEvents(player.level, hpPercent, difficulty)
      .filter(event => {
        // 检查一次性事件是否已触发
        if (event.conditions?.oneTimeOnly && this.statistics.triggeredOneTimeEvents.has(event.id)) {
          return false;
        }
        return true;
      });

    if (availableEvents.length === 0) {
      return null;
    }

    // 加权随机选择
    const totalWeight = availableEvents.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;

    for (const event of availableEvents) {
      random -= event.weight;
      if (random <= 0) {
        return event;
      }
    }

    return availableEvents[0];
  }

  /**
   * 执行事件选择
   */
  executeChoice(
    event: DungeonEvent,
    choiceId: string,
    player: Protagonist
  ): DungeonOutcome {
    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) {
      throw new Error(`Choice ${choiceId} not found in event ${event.id}`);
    }

    // 检查需求条件
    const reqResult = checkRequirements(choice.requirements, player);
    if (!reqResult.satisfied) {
      throw new Error(`Requirements not satisfied: ${reqResult.missingReqs.join(', ')}`);
    }

    // 按概率选择结果
    const random = Math.random();
    let cumulative = 0;

    for (const outcome of choice.outcomes) {
      cumulative += outcome.probability;
      if (random < cumulative) {
        return outcome;
      }
    }

    // 兜底：返回最后一个结果
    return choice.outcomes[choice.outcomes.length - 1];
  }

  /**
   * 记录事件触发
   */
  recordTrigger(event: DungeonEvent): void {
    this.triggeredEvents.add(event.id);
    this.statistics.totalTriggers++;
    this.statistics.triggersByType[event.type]++;
    this.statistics.triggersByEventId[event.id] = 
      (this.statistics.triggersByEventId[event.id] || 0) + 1;
    this.statistics.lastTriggerTime = Date.now();

    if (event.conditions?.oneTimeOnly) {
      this.statistics.triggeredOneTimeEvents.add(event.id);
    }
  }

  /**
   * 获取统计数据
   */
  getStatistics(): EventStatistics {
    return {
      ...this.statistics,
      triggeredOneTimeEvents: new Set(this.statistics.triggeredOneTimeEvents),
    };
  }

  /**
   * 重置统计
   */
  resetStatistics(): void {
    this.triggeredEvents.clear();
    this.consecutiveMisses = 0;
    this.statistics = {
      totalTriggers: 0,
      triggersByType: {} as Record<DungeonEventType, number>,
      triggersByEventId: {},
      lastTriggerTime: 0,
      triggeredOneTimeEvents: new Set(),
    };
    
    // 重新初始化类型统计
    const eventTypes: DungeonEventType[] = [
      'treasure', 'mystery', 'trap', 'merchant', 
      'shrine', 'hidden_room', 'elite_guardian', 'blessing'
    ];
    for (const type of eventTypes) {
      this.statistics.triggersByType[type] = 0;
    }
  }
}

// ============================================
// 全局单例
// ============================================

let globalEventService: EventTriggerService | null = null;

/**
 * 获取全局事件触发服务实例
 */
export function getEventTriggerService(): EventTriggerService {
  if (!globalEventService) {
    globalEventService = new EventTriggerService();
  }
  return globalEventService;
}

/**
 * 重置全局事件触发服务
 */
export function resetEventTriggerService(): void {
  globalEventService = null;
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取玩家可用的事件选择列表
 */
export function getAvailableChoices(
  event: DungeonEvent,
  player: Protagonist
): Array<{
  choice: DungeonChoice;
  isAvailable: boolean;
  missingReqs: string[];
}> {
  return event.choices.map(choice => {
    const result = isChoiceAvailable(choice, player);
    return {
      choice,
      isAvailable: result.available,
      missingReqs: result.missingReqs,
    };
  });
}

/**
 * 计算事件的期望收益（用于AI决策）
 */
export function calculateExpectedValue(
  choice: DungeonChoice,
  playerLevel: number
): number {
  let expectedValue = 0;

  for (const outcome of choice.outcomes) {
    let outcomeValue = 0;

    for (const effect of outcome.effects) {
      switch (effect.type) {
        case 'heal':
          outcomeValue += (effect.value || 0) * 0.5;
          break;
        case 'damage':
          outcomeValue -= (effect.value || 0) * 1.5;
          break;
        case 'gain_spirit_stones':
          outcomeValue += (effect.value || 0) * 0.1;
          break;
        case 'lose_spirit_stones':
          outcomeValue -= (effect.value || 0) * 0.1;
          break;
        case 'gain_exp':
          outcomeValue += (effect.value || 0) * 0.2;
          break;
        case 'gain_stat':
          outcomeValue += (effect.value || 0) * 50;
          break;
        case 'lose_stat':
          outcomeValue -= (effect.value || 0) * 50;
          break;
        case 'gain_item':
          outcomeValue += 30;
          break;
        case 'gain_buff':
          outcomeValue += 20;
          break;
        case 'gain_debuff':
          outcomeValue -= 20;
          break;
        case 'trigger_battle':
          outcomeValue -= 40;
          break;
      }
    }

    expectedValue += outcomeValue * outcome.probability;
  }

  return expectedValue;
}

/**
 * 获取推荐选择（AI辅助）
 */
export function getRecommendedChoice(
  event: DungeonEvent,
  player: Protagonist
): DungeonChoice | null {
  const availableChoices = getAvailableChoices(event, player)
    .filter(c => c.isAvailable)
    .map(c => c.choice);

  if (availableChoices.length === 0) {
    return null;
  }

  // 计算每个选择的期望值
  let bestChoice: DungeonChoice | null = null;
  let bestValue = -Infinity;

  for (const choice of availableChoices) {
    // 跳过"离开"选项，除非是唯一选择
    if (choice.id === 'leave' && availableChoices.length > 1) {
      continue;
    }

    const value = calculateExpectedValue(choice, player.level);
    if (value > bestValue) {
      bestValue = value;
      bestChoice = choice;
    }
  }

  // 如果没有找到好的选择，返回"离开"选项
  if (!bestChoice) {
    bestChoice = availableChoices.find(c => c.id === 'leave') || availableChoices[0];
  }

  return bestChoice;
}
