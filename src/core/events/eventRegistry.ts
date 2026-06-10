/**
 * 事件注册中心
 *
 * 各功能模块通过注册中心声明式注册自有事件类型，无需修改 core/events/ 中的任何代码。
 * 注册后自动生成命名空间前缀的事件名常量，并提供类型安全的 emit 方法。
 *
 * @module core/events
 */

import { createLogger } from '@/core/logger';

import type { EventType } from './types';

/** EventRegistry 日志记录器 */
const log = createLogger('EventRegistry');

// ============================================
// 类型定义
// ============================================

/** 单个事件定义 */
export interface EventDef {
  /** 事件描述（便于调试和文档） */
  description: string;
}

/** 模块事件定义对象 */
export type ModuleEventDefs = Record<string, EventDef>;

/** 事件名常量映射 */
export type EventNameConstants<T extends ModuleEventDefs> = {
  [K in keyof T & string]: `${string}:${K}`;
};

/**
 * 模块事件发射器
 *
 * 注册模块后返回此对象，提供类型安全的事件名常量和 emit 方法。
 */
export interface ModuleEventEmitter<T extends ModuleEventDefs> {
  /** 命名空间前缀 */
  namespace: string;
  /** 类型安全的事件名常量映射 */
  events: EventNameConstants<T>;
  /**
   * 获取完整事件名字符串
   *
   * @param eventKey - 该模块注册的事件键名
   * @returns 完整的事件类型字符串（含命名空间前缀）
   */
  getEventType: (eventKey: keyof T & string) => EventType;
}

// ============================================
// EventRegistry 类
// ============================================

/**
 * 事件注册中心（单例）
 *
 * 负责管理所有模块的事件注册，确保命名空间隔离。
 */
export class EventRegistry {
  private static instance: EventRegistry | null = null;

  /** 已注册的命名空间 → 事件定义映射 */
  private namespaces: Map<string, ModuleEventDefs> = new Map();

  private constructor() {}

  /** 获取单例 */
  static getInstance(): EventRegistry {
    if (!EventRegistry.instance) {
      EventRegistry.instance = new EventRegistry();
    }
    return EventRegistry.instance;
  }

  /**
   * 注册模块事件
   *
   * @param namespace - 命名空间（如 'combat'、'collection'）
   * @param eventDefs - 事件定义对象
   * @returns 模块事件发射器，包含事件名常量和 getEventType 方法
   *
   * @example
   * const combatEmitter = eventRegistry.registerModule('combat', {
   *   monster_killed: { description: '击杀怪物' },
   *   boss_killed: { description: '击杀Boss' },
   * });
   * // combatEmitter.events.monster_killed === 'combat:monster_killed'
   */
  registerModule<T extends ModuleEventDefs>(
    namespace: string,
    eventDefs: T
  ): ModuleEventEmitter<T> {
    // 重复注册保护：合并而非覆盖
    if (this.namespaces.has(namespace)) {
      log.warn(
        `命名空间 "${namespace}" 已被注册，将合并新事件定义（不覆盖已有事件）`
      );
      const existing = this.namespaces.get(namespace)!;
      // 只添加不存在的事件
      for (const key of Object.keys(eventDefs)) {
        if (!(key in existing)) {
          (existing as Record<string, EventDef>)[key] = eventDefs[key];
        }
      }
    } else {
      this.namespaces.set(namespace, { ...eventDefs });
    }

    return this.createEmitter(namespace, eventDefs);
  }

  /**
   * 创建模块事件发射器
   */
  private createEmitter<T extends ModuleEventDefs>(
    namespace: string,
    eventDefs: T
  ): ModuleEventEmitter<T> {
    // 生成事件名常量
    const events = {} as EventNameConstants<T>;
    for (const key of Object.keys(eventDefs)) {
      (events as Record<string, string>)[key] = `${namespace}:${key}`;
    }

    return {
      namespace,
      events,
      getEventType: (eventKey: keyof T & string): EventType => {
        return `${namespace}:${eventKey}`;
      },
    };
  }

  /**
   * 获取某个命名空间下注册的所有事件定义
   *
   * @param namespace - 命名空间
   * @returns 事件定义对象，如果命名空间未注册返回 undefined
   */
  getModuleEvents(namespace: string): ModuleEventDefs | undefined {
    return this.namespaces.get(namespace);
  }

  /**
   * 获取所有已注册的命名空间
   *
   * @returns 命名空间列表
   */
  getAllNamespaces(): string[] {
    return Array.from(this.namespaces.keys());
  }
}

// 导出单例
export const eventRegistry = EventRegistry.getInstance();
