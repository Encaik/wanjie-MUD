/**
 * 消息记录系统类型定义
 *
 * 定义游戏消息记录系统的核心类型：消息通道、消息模板、通道配置、
 * 装饰器配置等。与 core/types 中的 MessageRecord 配合使用。
 *
 * @module core/message-log
 */

import type { MessageRecord } from '@/core/types';

// ============================================
// 消息通道
// ============================================

/** 消息通道标识（字符串别名，支持业务域自定义） */
export type MessageChannel = string;

/** 内置预设通道名称 */
export const PRESET_CHANNELS = [
  'system',
  'combat',
  'cultivation',
  'exploration',
  'economy',
] as const;

/** 预设通道名称的联合类型 */
export type PresetChannel = (typeof PRESET_CHANNELS)[number];

// ============================================
// 通道配置
// ============================================

/** 消息通道配置 */
export interface ChannelConfig {
  /** 通道名称（唯一标识） */
  name: MessageChannel;
  /** 通道描述 */
  description?: string;
}

// ============================================
// 消息模板
// ============================================

/**
 * 消息内容生成器
 *
 * 接收事件 payload 作为参数，返回消息文本。
 * 用于将游戏事件数据转化为玩家可读的消息内容。
 */
export type MessageContentGenerator = (payload: Record<string, unknown>) => string;

/** 消息标题生成器 */
export type MessageTitleGenerator = (payload: Record<string, unknown>) => string;

/**
 * 事件到消息的转换模板
 *
 * 注册后，当匹配的游戏事件触发时，MessageManager 自动调用
 * 生成器函数创建 MessageRecord 并广播。
 */
export interface MessageTemplate {
  /** 匹配的事件类型（支持 'namespace:*' 通配符和精确匹配） */
  eventType: string;
  /** 目标消息通道 */
  channel: MessageChannel;
  /** 消息级别 */
  level: MessageRecord['type'];
  /** 标题生成器（接收 payload，返回标题文本） */
  title: string | MessageTitleGenerator;
  /** 内容生成器（接收 payload，返回内容文本） */
  content: string | MessageContentGenerator;
  /** 优先级（数值小的先匹配，默认 0） */
  priority?: number;
}

// ============================================
// 装饰器配置
// ============================================

/**
 * @GameMessage 方法装饰器配置
 *
 * 装饰的方法成功返回时，自动根据配置从参数和返回值
 * 生成游戏消息并通过 MessageManager 广播。
 */
export interface GameMessageOptions {
  /** 消息通道 */
  channel: MessageChannel;
  /** 消息标题（静态字符串或根据参数/返回值动态生成） */
  title: string | ((args: unknown[], result: unknown) => string);
  /** 消息内容（静态字符串或根据参数/返回值动态生成） */
  content: string | ((args: unknown[], result: unknown) => string);
  /** 消息级别，默认 'info' */
  level?: MessageRecord['type'];
}

/**
 * @GameMessageClass 类装饰器配置
 */
export interface GameMessageClassOptions {
  /** 默认消息通道 */
  channel: MessageChannel;
  /** 默认消息级别 */
  level?: MessageRecord['type'];
  /** 排除的方法名列表（不生成消息） */
  exclude?: string[];
}

// ============================================
// 消息管理器接口
// ============================================

/** 消息缓冲最大容量 */
export const MESSAGE_BUFFER_LIMIT = 200;
