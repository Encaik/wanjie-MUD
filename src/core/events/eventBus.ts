/**
 * 事件总线 — 游戏事件驱动架构核心
 *
 * 单例模式，管理游戏内所有事件的发布（emit）和订阅（on/once/off）。
 * 事件类型使用字符串命名空间格式（如 'combat:monster_killed'），
 * 支持通配符模式匹配（如 'combat:*'）和自定义过滤函数。
 *
 * @module core/events
 */

import { createLogger } from '@/core/logger';

import { matchPattern, isWildcardPattern } from './patternMatcher';

import type { EventType, GameEvent, EventListener, EventBusOptions, EventMatcher } from './types';

/** EventBus 日志记录器 */
const log = createLogger('EventBus');

// ============================================
// 内部类型
// ============================================

/** 监听器存储条目 */
interface ListenerEntry {
  /** 匹配器（精确字符串、通配符模式或过滤函数） */
  matcher: EventMatcher;
  /** 监听器函数 */
  listener: EventListener;
  /** 优先级（数字小的先执行） */
  priority: number;
  /** 是否一次性订阅 */
  once: boolean;
  /** 订阅顺序（用于同优先级排序） */
  order: number;
}

// ============================================
// EventBus 类
// ============================================

/**
 * 游戏事件总线（单例）
 *
 * 负责事件的发布、订阅和管理。提供 on/once/off/emit 标准 API。
 *
 * @example
 * // 订阅事件
 * const unsub = gameEventBus.on('combat:monster_killed', (event) => {
 *   console.log(event.payload.enemyName);
 * });
 *
 * // 通配符订阅
 * gameEventBus.on('combat:*', (event) => console.log('战斗事件:', event.type));
 *
 * // 触发事件
 * gameEventBus.emit('combat:monster_killed', { enemyName: 'Demon', enemyTier: 'boss', enemyLevel: 10 });
 *
 * // 取消订阅
 * unsub();
 */
export class EventBus {
  private static instance: EventBus | null = null;

  /** 所有监听器存储：匹配器 → 监听器条目列表 */
  private listenerEntries: ListenerEntry[] = [];

  /** 事件历史记录 */
  private eventHistory: GameEvent[] = [];

  /** 历史记录最大条数 */
  private maxHistorySize = 100;

  /** 订阅顺序计数器 */
  private orderCounter = 0;

  private constructor() {}

  // ============================================
  // 单例
  // ============================================

  /** 获取单例实例 */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // ============================================
  // 订阅 API
  // ============================================

  /**
   * 订阅事件
   *
   * @param matcher - 事件匹配器（精确字符串、通配符模式或过滤函数）
   * @param listener - 事件监听器函数
   * @param opts - 订阅选项（priority 等）
   * @returns 取消订阅函数
   *
   * @example
   * // 精确匹配
   * eventBus.on('combat:monster_killed', handleKill);
   *
   * // 通配符匹配
   * eventBus.on('combat:*', handleAnyCombatEvent);
   *
   * // 过滤器匹配
   * eventBus.on(type => type.includes('killed'), handleKill);
   *
   * // 指定优先级
   * eventBus.on('combat:monster_killed', handleKill, { priority: -10 });
   */
  on<TPayload = Record<string, unknown>>(
    matcher: EventMatcher,
    listener: EventListener<TPayload>,
    opts: EventBusOptions = {}
  ): () => void {
    const entry: ListenerEntry = {
      matcher,
      listener: listener as EventListener,
      priority: opts.priority ?? 0,
      once: false,
      order: this.orderCounter++,
    };

    this.listenerEntries.push(entry);

    // 返回取消订阅函数
    return () => {
      this.removeEntry(entry);
    };
  }

  /**
   * 一次性订阅事件
   *
   * 事件触发一次后自动取消订阅。
   *
   * @param matcher - 事件匹配器
   * @param listener - 事件监听器函数
   * @returns 取消订阅函数（可在触发前手动取消）
   *
   * @example
   * eventBus.once('progression:level_up', (event) => {
   *   console.log('首次升级！');
   * });
   */
  once<TPayload = Record<string, unknown>>(
    matcher: EventMatcher,
    listener: EventListener<TPayload>
  ): () => void {
    const entry: ListenerEntry = {
      matcher,
      listener: listener as EventListener,
      priority: 0,
      once: true,
      order: this.orderCounter++,
    };

    this.listenerEntries.push(entry);

    return () => {
      this.removeEntry(entry);
    };
  }

  /**
   * 取消订阅
   *
   * 根据匹配器和监听器函数精确取消订阅。
   *
   * @param matcher - 原始匹配器
   * @param listener - 原始监听器函数
   *
   * @example
   * eventBus.off('combat:monster_killed', handleKill);
   */
  off(matcher: EventMatcher, listener: EventListener): void {
    const idx = this.listenerEntries.findIndex(
      e => e.matcher === matcher && e.listener === listener
    );
    if (idx >= 0) {
      this.listenerEntries.splice(idx, 1);
    }
  }

  // ============================================
  // 发布 API
  // ============================================

  /**
   * 触发事件
   *
   * @param eventType - 事件类型
   * @param payload - 事件负载数据
   *
   * @example
   * eventBus.emit('combat:monster_killed', {
   *   enemyName: 'Demon King',
   *   enemyTier: 'boss',
   *   enemyLevel: 50,
   * });
   */
  emit<TPayload = Record<string, unknown>>(
    eventType: EventType,
    payload: TPayload
  ): void {
    const event: GameEvent<TPayload> = {
      type: eventType,
      timestamp: Date.now(),
      payload,
    };

    // 记录历史
    this.eventHistory.push(event as GameEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // 收集匹配的监听器并排序
    const matched: Array<{ entry: ListenerEntry; isExact: boolean }> = [];
    for (const entry of this.listenerEntries) {
      if (matchPattern(eventType, entry.matcher)) {
        matched.push({
          entry,
          isExact: typeof entry.matcher === 'string' && !entry.matcher.endsWith('*'),
        });
      }
    }

    // 排序：优先级小的先，精确匹配优先，订阅顺序靠前的优先
    matched.sort((a, b) => {
      if (a.entry.priority !== b.entry.priority) return a.entry.priority - b.entry.priority;
      if (a.isExact !== b.isExact) return a.isExact ? -1 : 1;
      return a.entry.order - b.entry.order;
    });

    // 收集需要移除的 once 条目
    const toRemove = new Set<ListenerEntry>();

    // 依次调用匹配的监听器
    for (const { entry } of matched) {
      try {
        entry.listener(event as GameEvent);
      } catch (error) {
        log.error(
          `监听器执行错误 (${eventType}):`,
          error
        );
      }

      if (entry.once) {
        toRemove.add(entry);
      }
    }

    // 移除一次性监听器
    if (toRemove.size > 0) {
      this.listenerEntries = this.listenerEntries.filter(e => !toRemove.has(e));
    }
  }

  // ============================================
  // 管理 API
  // ============================================

  /**
   * 移除指定事件类型（或所有事件）的所有监听器
   *
   * @param eventType - 可选的事件类型，不传则清除全部监听器
   */
  removeAllListeners(eventType?: EventType): void {
    if (eventType) {
      this.listenerEntries = this.listenerEntries.filter(
        e => e.matcher !== eventType || isWildcardPattern(e.matcher)
      );
    } else {
      this.listenerEntries = [];
    }
  }

  /**
   * 获取事件历史记录
   *
   * @returns 事件历史数组的浅拷贝
   */
  getHistory(): GameEvent[] {
    return [...this.eventHistory];
  }

  /**
   * 清空事件历史记录
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * 获取某个事件类型的监听器数量
   *
   * @param eventType - 事件类型
   * @returns 精确匹配该类型的监听器数量（不含通配符匹配）
   */
  getListenerCount(eventType: EventType): number {
    return this.listenerEntries.filter(
      e => e.matcher === eventType
    ).length;
  }

  // ============================================
  // 内部方法
  // ============================================

  /** 移除监听器条目（内部使用） */
  private removeEntry(entry: ListenerEntry): void {
    const idx = this.listenerEntries.indexOf(entry);
    if (idx >= 0) {
      this.listenerEntries.splice(idx, 1);
    }
  }
}

// ============================================
// 导出单例和便捷绑定
// ============================================

/** 事件总线单例实例 */
export const gameEventBus = EventBus.getInstance();

/** 便捷方法：订阅事件 */
export const on = gameEventBus.on.bind(gameEventBus);

/** 便捷方法：一次性订阅 */
export const once = gameEventBus.once.bind(gameEventBus);

/** 便捷方法：取消订阅 */
export const off = gameEventBus.off.bind(gameEventBus);

/** 便捷方法：触发事件 */
export const emit = gameEventBus.emit.bind(gameEventBus);
