/**
 * 消息管理器 — 游戏消息记录系统核心
 *
 * 单例模式，负责消息缓冲、广播、事件→消息模板匹配。
 * 与 GameEventManager 深度集成：初始化时订阅事件总线，
 * 匹配已注册的模板自动生成游戏消息。
 *
 * @module core/message-log
 */

import { gameEventBus } from '@/core/events';
import type { MessageRecord } from '@/core/types';

import { ChannelRegistry } from './channelRegistry';
import { MESSAGE_BUFFER_LIMIT } from './types';

import type {
  MessageChannel,
  MessageTemplate,
  ChannelConfig,
} from './types';

// ============================================
// 工具函数
// ============================================

/** 生成唯一消息 ID */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 检查事件类型是否匹配模板的 eventType
 *
 * 支持三种匹配方式：
 * - 精确匹配：'combat:monster_killed' === 'combat:monster_killed'
 * - 命名空间通配符：'combat:*' 匹配 'combat:monster_killed'
 * - 全通配符：'*' 匹配所有事件
 */
function matchEventType(actualType: string, templateType: string): boolean {
  if (templateType === '*') return true;
  if (templateType.endsWith(':*')) {
    const prefix = templateType.slice(0, -2);
    return actualType.startsWith(prefix + ':');
  }
  return actualType === templateType;
}

/**
 * 将模板中的 title/content（字符串或生成器函数）转换为字符串
 */
function resolveTemplateValue(
  value: string | ((payload: Record<string, unknown>) => string),
  payload: Record<string, unknown>
): string {
  return typeof value === 'function' ? value(payload) : value;
}

// ============================================
// MessageManager 类
// ============================================

/**
 * 游戏消息管理器（单例）
 *
 * 职责：
 * 1. 管理消息缓冲（内存中最多 200 条）
 * 2. 广播消息并发射 message:new / message:overflow 事件
 * 3. 管理消息模板，监听 GameEventManager 自动转换事件→消息
 * 4. 管理消息通道注册表
 *
 * @example
 * const mm = getMessageManager();
 * mm.broadcast({ channel: 'combat', title: '战斗胜利', content: '...', level: 'success' });
 *
 * // 注册事件→消息模板
 * mm.registerTemplate({
 *   eventType: 'combat:monster_killed',
 *   channel: 'combat',
 *   title: (p) => `击败 ${p.monsterName}`,
 *   content: (p) => `获得 ${p.experience} 经验`,
 *   level: 'success',
 * });
 */
export class MessageManager {
  /** 消息缓冲（内存中） */
  private buffer: MessageRecord[] = [];

  /** 消息模板列表 */
  private templates: MessageTemplate[] = [];

  /** 通道注册表 */
  private channelRegistry: ChannelRegistry;

  /** 是否已初始化（已订阅事件总线） */
  private initialized = false;

  constructor() {
    this.channelRegistry = new ChannelRegistry();
    this.channelRegistry.registerPresets();
  }

  // ============================================
  // 初始化
  // ============================================

  /**
   * 初始化：订阅 GameEventManager，监听游戏事件
   *
   * 在首次调用 getMessageManager() 时自动调用。
   * 多次调用安全（幂等）。
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // 订阅所有游戏事件，通配符 '*' 匹配一切
    gameEventBus.on('*', (event) => {
      this.handleEvent(event.type, event.payload as Record<string, unknown>);
    });
  }

  // ============================================
  // 消息广播
  // ============================================

  /**
   * 广播一条游戏消息
   *
   * 消息存入缓冲，并通过 GameEventManager 发射 message:new 事件。
   * 缓冲超过上限时，移除最旧消息并发射 message:overflow 事件。
   *
   * @param params - 消息参数（不含 id 和 timestamp，由系统自动生成）
   */
  broadcast(params: {
    channel: MessageChannel;
    title: string;
    content: string;
    level?: MessageRecord['type'];
  }): void {
    const record: MessageRecord = {
      id: generateMessageId(),
      timestamp: Date.now(),
      type: params.level || 'info',
      title: params.title,
      content: params.content,
      channel: params.channel,
    };

    // 添加到缓冲
    this.buffer.push(record);

    // 检查缓冲上限
    let overflowed = false;
    while (this.buffer.length > MESSAGE_BUFFER_LIMIT) {
      this.buffer.shift();
      overflowed = true;
    }

    // 发射消息事件
    gameEventBus.emit('message:new', record);

    if (overflowed) {
      gameEventBus.emit('message:overflow', {
        bufferLimit: MESSAGE_BUFFER_LIMIT,
        currentSize: this.buffer.length,
      });
    }
  }

  // ============================================
  // 消息缓冲查询
  // ============================================

  /**
   * 获取当前消息缓冲
   *
   * @returns 消息记录数组（按时间戳升序）
   */
  getMessages(): MessageRecord[] {
    return [...this.buffer];
  }

  /**
   * 获取最近 N 条消息
   *
   * @param count - 获取数量
   * @returns 最新的消息数组
   */
  getRecentMessages(count: number): MessageRecord[] {
    return this.buffer.slice(-count);
  }

  /**
   * 清空消息缓冲
   */
  clearMessages(): void {
    this.buffer = [];
  }

  // ============================================
  // 消息模板
  // ============================================

  /**
   * 注册事件→消息的转换模板
   *
   * 注册后，当匹配的游戏事件触发时，自动调用生成器函数
   * 创建 MessageRecord 并通过 broadcast() 广播。
   *
   * @param template - 消息模板配置
   */
  registerTemplate(template: MessageTemplate): void {
    this.templates.push({ ...template, priority: template.priority ?? 0 });
    // 按优先级排序以确保匹配顺序
    this.templates.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }

  /**
   * 获取已注册的模板列表
   *
   * @param channel - 可选，按通道筛选
   * @returns 消息模板数组
   */
  getTemplates(channel?: MessageChannel): MessageTemplate[] {
    if (channel) {
      return this.templates.filter((t) => t.channel === channel);
    }
    return [...this.templates];
  }

  // ============================================
  // 事件处理（内部）
  // ============================================

  /**
   * 处理游戏事件：匹配模板并自动生成消息
   *
   * 遍历所有已注册模板，匹配的事件类型通过 broadcast() 生成消息。
   * 多个模板可匹配同一事件（如精确匹配 + 通配符），各自独立生成消息。
   *
   * @param eventType - 事件类型字符串
   * @param payload - 事件负载数据
   */
  private handleEvent(
    eventType: string,
    payload: Record<string, unknown>
  ): void {
    for (const template of this.templates) {
      if (matchEventType(eventType, template.eventType)) {
        const title = resolveTemplateValue(template.title, payload);
        const content = resolveTemplateValue(template.content, payload);

        this.broadcast({
          channel: template.channel,
          level: template.level,
          title,
          content,
        });
      }
    }
  }

  // ============================================
  // 通道管理（代理到 ChannelRegistry）
  // ============================================

  /**
   * 注册消息通道
   *
   * @param config - 通道配置
   * @param overwrite - 是否覆盖已存在的同名通道
   */
  registerChannel(config: ChannelConfig, overwrite = false): void {
    this.channelRegistry.register(config, overwrite);
  }

  /**
   * 获取通道配置
   *
   * @param name - 通道名称
   */
  getChannel(name: MessageChannel): ChannelConfig | undefined {
    return this.channelRegistry.get(name);
  }

  /**
   * 检查通道是否已注册
   */
  hasChannel(name: MessageChannel): boolean {
    return this.channelRegistry.has(name);
  }

  /**
   * 列出所有已注册通道
   */
  listChannels(): ChannelConfig[] {
    return this.channelRegistry.list();
  }

  /**
   * 移除通道
   */
  removeChannel(name: MessageChannel): boolean {
    return this.channelRegistry.remove(name);
  }
}

// ============================================
// 单例
// ============================================

let instance: MessageManager | null = null;

/**
 * 获取 MessageManager 单例
 *
 * 首次调用时自动注册预设通道并订阅事件总线。
 *
 * @returns MessageManager 实例
 */
export function getMessageManager(): MessageManager {
  if (!instance) {
    instance = new MessageManager();
    instance.init();
  }
  return instance;
}

/**
 * 重置单例（仅用于测试环境）
 *
 * 清除当前实例，下次调用 getMessageManager() 时将创建新实例。
 */
export function resetMessageManager(): void {
  instance = null;
}
