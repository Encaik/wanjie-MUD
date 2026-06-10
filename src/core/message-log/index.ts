/**
 * 游戏消息记录系统 — 核心模块导出
 *
 * 提供统一的消息创建、分发和模板注册接口。
 * 与 GameEventManager 深度集成，支持装饰器简化消息生成。
 *
 * @module core/message-log
 */

// 类型
export type {
  MessageChannel,
  MessageTemplate,
  ChannelConfig,
  GameMessageOptions,
  GameMessageClassOptions,
  MessageContentGenerator,
  MessageTitleGenerator,
  PresetChannel,
} from './types';

export {
  PRESET_CHANNELS,
  MESSAGE_BUFFER_LIMIT,
} from './types';

// 通道注册
export {
  ChannelRegistry,
  ChannelAlreadyExistsError,
} from './channelRegistry';

// 消息管理器
export {
  MessageManager,
  getMessageManager,
  resetMessageManager,
} from './messageManager';

// 装饰器
export {
  GameMessage,
  GameMessageAsync,
  GameMessageClass,
} from './decorators';
