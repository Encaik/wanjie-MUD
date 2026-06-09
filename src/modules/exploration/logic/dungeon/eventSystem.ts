/**
 * 地牢随机事件系统主入口
 * 
 * 整合事件触发、执行、效果应用等功能
 * 根据 comprehensive-optimization-design.md 设计文档实现
 */

import {
  DUNGEON_EVENTS,
  getEventById,
  getAvailableEvents,
} from './eventConfigs';
import {
  EventTriggerService,
  getEventTriggerService,
  checkRequirements,
  getAvailableChoices,
  getRecommendedChoice,
} from './eventTrigger';
import {
  DungeonEvent,
  DungeonChoice,
  DungeonOutcome,
  EventExecutionContext,
  EventExecutionResult,
  EventEffect,
  EventPreview,
  EventLogEntry,
  DEFAULT_TRIGGER_CONFIG,
  EventTriggerConfig,
} from './types';
import { generateRandomEquipment } from '@/modules/equipment/logic/equipment';
import { getRandomItem, spiritStoneItems } from '@/modules/equipment/logic/items';
import { generateRandomTechnique } from '@/modules/techniques/logic/technique';
import { Protagonist, InventoryItem, CharacterStats, createInventoryItem, ItemDefinition, ActiveEffect, LegacyStats } from '@/shared/lib/types';

// ============================================
// 效果应用
// ============================================

/**
 * 应用事件效果到玩家
 */
export function applyEffect(
  effect: EventEffect,
  player: Protagonist,
  dungeonDifficulty: number
): {
  hpChange?: number;
  mpChange?: number;
  spiritStonesChange?: number;
  expChange?: number;
  itemsGained?: InventoryItem[];
  itemsLost?: InventoryItem[];
  statsGained?: Partial<LegacyStats>;
  buffsGained?: ActiveEffect[];
  triggeredBattle?: { enemyName: string; enemyLevel: number; enemyTier: 'elite' | 'miniboss' };
} {
  const result: ReturnType<typeof applyEffect> = {};

  switch (effect.type) {
    case 'heal':
      result.hpChange = Math.min(effect.value || 0, player.maxHp - player.currentHp);
      break;

    case 'damage':
      result.hpChange = -Math.min(effect.value || 0, player.currentHp);
      break;

    case 'restore_mp':
      result.mpChange = Math.min(effect.value || 0, player.maxMp - player.currentMp);
      break;

    case 'drain_mp':
      result.mpChange = -Math.min(effect.value || 0, player.currentMp);
      break;

    case 'gain_spirit_stones':
      result.spiritStonesChange = effect.value || 0;
      break;

    case 'lose_spirit_stones':
      result.spiritStonesChange = -(effect.value || 0);
      break;

    case 'gain_exp':
      result.expChange = effect.value || 0;
      break;

    case 'gain_item':
      // 根据地牢难度生成随机物品
      const item = getRandomItem(dungeonDifficulty);
      if (item) {
        result.itemsGained = [createInventoryItem(item, effect.value || 1)];
      }
      break;

    case 'lose_item':
      // 暂不实现物品丢失
      break;

    case 'gain_stat':
      if (effect.stat) {
        result.statsGained = { [effect.stat]: effect.value || 0 };
      }
      break;

    case 'lose_stat':
      if (effect.stat) {
        result.statsGained = { [effect.stat]: -(effect.value || 0) };
      }
      break;

    case 'gain_buff':
    case 'gain_debuff':
      if (effect.buff) {
        result.buffsGained = [{
          itemId: `event_${Date.now()}`,
          itemName: '事件效果',
          ...effect.buff,
        }];
      }
      break;

    case 'trigger_battle':
      if (effect.battleConfig) {
        result.triggeredBattle = effect.battleConfig;
      }
      break;
  }

  return result;
}

/**
 * 合并多个效果结果
 */
function mergeEffectResults(
  results: ReturnType<typeof applyEffect>[]
): ReturnType<typeof applyEffect> {
  const merged: ReturnType<typeof applyEffect> = {};

  for (const result of results) {
    if (result.hpChange !== undefined) {
      merged.hpChange = (merged.hpChange || 0) + result.hpChange;
    }
    if (result.mpChange !== undefined) {
      merged.mpChange = (merged.mpChange || 0) + result.mpChange;
    }
    if (result.spiritStonesChange !== undefined) {
      merged.spiritStonesChange = (merged.spiritStonesChange || 0) + result.spiritStonesChange;
    }
    if (result.expChange !== undefined) {
      merged.expChange = (merged.expChange || 0) + result.expChange;
    }
    if (result.itemsGained) {
      merged.itemsGained = [...(merged.itemsGained || []), ...result.itemsGained];
    }
    if (result.itemsLost) {
      merged.itemsLost = [...(merged.itemsLost || []), ...result.itemsLost];
    }
    if (result.statsGained) {
      merged.statsGained = {
        ...merged.statsGained,
        ...result.statsGained,
      };
    }
    if (result.buffsGained) {
      merged.buffsGained = [...(merged.buffsGained || []), ...result.buffsGained];
    }
    if (result.triggeredBattle) {
      merged.triggeredBattle = result.triggeredBattle;
    }
  }

  return merged;
}

// ============================================
// 事件执行
// ============================================

/**
 * 执行事件并返回结果
 */
export function executeEvent(
  event: DungeonEvent,
  choiceId: string,
  context: EventExecutionContext
): EventExecutionResult {
  const service = getEventTriggerService();
  
  try {
    // 执行选择，获取结果
    const outcome = service.executeChoice(event, choiceId, context.player);
    
    // 应用所有效果
    const effectResults = outcome.effects.map(effect =>
      applyEffect(effect, context.player, context.dungeonConfig.difficulty)
    );
    
    const appliedEffects = mergeEffectResults(effectResults);
    
    // 记录事件触发
    service.recordTrigger(event);
    
    return {
      success: true,
      outcome,
      appliedEffects,
      message: outcome.message,
    };
  } catch (error) {
    return {
      success: false,
      outcome: {
        id: 'error',
        probability: 1,
        effects: [],
        message: error instanceof Error ? error.message : '未知错误',
      },
      appliedEffects: {},
      message: error instanceof Error ? error.message : '执行事件时发生错误',
    };
  }
}

/**
 * 处理事件格子
 * 
 * 主入口函数，用于处理冒险中的事件格子
 */
export function handleEventCell(
  player: Protagonist,
  cellType: string,
  dungeonConfig: { difficulty: number; rows: number; cols: number },
  position: { row: number; col: number },
  isFirstVisit: boolean
): {
  triggered: boolean;
  event: DungeonEvent | null;
  shouldShowEventUI: boolean;
} {
  const service = getEventTriggerService();
  
  // 检查是否触发随机事件
  const triggered = service.shouldTriggerEvent(cellType, player);
  
  if (!triggered) {
    return {
      triggered: false,
      event: null,
      shouldShowEventUI: false,
    };
  }
  
  // 选择随机事件
  const event = service.selectRandomEvent(player, dungeonConfig.difficulty);
  
  if (!event) {
    return {
      triggered: true,
      event: null,
      shouldShowEventUI: false,
    };
  }
  
  // 记录触发
  service.recordTrigger(event);
  
  return {
    triggered: true,
    event,
    shouldShowEventUI: true,
  };
}

/**
 * 获取事件预览信息
 */
export function getEventPreview(
  eventId: string,
  player: Protagonist
): EventPreview | null {
  const event = getEventById(eventId);
  if (!event) {
    return null;
  }
  
  const availableChoices = getAvailableChoices(event, player);
  
  return {
    event,
    availableChoices,
  };
}

/**
 * 自动执行事件（AI决策）
 */
export function autoExecuteEvent(
  eventId: string,
  context: EventExecutionContext
): EventExecutionResult {
  const event = getEventById(eventId);
  if (!event) {
    return {
      success: false,
      outcome: {
        id: 'error',
        probability: 1,
        effects: [],
        message: '事件不存在',
      },
      appliedEffects: {},
      message: '事件不存在',
    };
  }
  
  // 获取推荐选择
  const recommendedChoice = getRecommendedChoice(event, context.player);
  
  if (!recommendedChoice) {
    // 如果没有可用选择，返回一个默认结果
    return {
      success: true,
      outcome: {
        id: 'no_choice',
        probability: 1,
        effects: [],
        message: '你决定不冒险，继续前进。',
      },
      appliedEffects: {},
      message: '你决定不冒险，继续前进。',
    };
  }
  
  // 执行推荐选择
  return executeEvent(event, recommendedChoice.id, context);
}

// ============================================
// 事件日志
// ============================================

const eventLogs: EventLogEntry[] = [];

/**
 * 记录事件日志
 */
export function logEvent(
  eventId: string,
  eventName: string,
  choiceId: string,
  outcomeId: string,
  message: string
): void {
  eventLogs.push({
    eventId,
    eventName,
    choiceId,
    outcomeId,
    message,
    timestamp: Date.now(),
  });
  
  // 限制日志数量
  if (eventLogs.length > 100) {
    eventLogs.shift();
  }
}

/**
 * 获取事件日志
 */
export function getEventLogs(): EventLogEntry[] {
  return [...eventLogs];
}

/**
 * 清除事件日志
 */
export function clearEventLogs(): void {
  eventLogs.length = 0;
}

// ============================================
// 快捷方法
// ============================================

/**
 * 快速处理事件格子（返回简单的结果描述）
 */
export function quickHandleEvent(
  player: Protagonist,
  dungeonConfig: { difficulty: number; rows: number; cols: number },
  cellType: 'event' | 'empty' = 'event'  // 【修复】添加 cellType 参数，默认为 'event'
): {
  triggered: boolean;
  message: string;
  rewards?: {
    hpChange?: number;
    mpChange?: number;
    spiritStonesChange?: number;
    expChange?: number;
  };
} {
  const service = getEventTriggerService();
  
  // 检查是否触发事件（传入正确的 cellType）
  const triggered = service.shouldTriggerEvent(cellType, player);
  
  if (!triggered) {
    return {
      triggered: false,
      message: cellType === 'event' 
        ? '这里发生了一些有趣的事情，但你没有受到影响。'
        : '这里没有任何特别的事情发生。',
    };
  }
  
  // 选择并自动执行事件
  const event = service.selectRandomEvent(player, dungeonConfig.difficulty);
  
  if (!event) {
    return {
      triggered: true,
      message: '这里发生了一些事情，但你没有受到影响。',
    };
  }
  
  // 自动执行
  const context: EventExecutionContext = {
    player,
    dungeonConfig,
    position: { row: 0, col: 0 },
    cellType: 'event',
    isFirstVisit: true,
  };
  
  const result = autoExecuteEvent(event.id, context);
  
  // 记录日志
  logEvent(
    event.id,
    event.name,
    result.outcome.id,
    result.outcome.id,
    result.message
  );
  
  return {
    triggered: true,
    message: result.message,
    rewards: {
      hpChange: result.appliedEffects.hpChange,
      mpChange: result.appliedEffects.mpChange,
      spiritStonesChange: result.appliedEffects.spiritStonesChange,
      expChange: result.appliedEffects.expChange,
    },
  };
}

// ============================================
// 导出
// ============================================

export {
  DUNGEON_EVENTS,
  getEventById,
  getAvailableEvents,
};

export {
  EventTriggerService,
  getEventTriggerService,
  checkRequirements,
  getAvailableChoices,
  getRecommendedChoice,
};

export type {
  DungeonEvent,
  DungeonChoice,
  DungeonOutcome,
  EventExecutionContext,
  EventExecutionResult,
  EventPreview,
};
