/**
 * 消息通道注册表
 *
 * 管理所有游戏消息通道的注册、查询和生命周期。
 * 新通道通过 register() 注册后即可使用，无需修改核心代码。
 *
 * @module core/message-log
 */

import { PRESET_CHANNELS } from './types';

import type { MessageChannel, ChannelConfig } from './types';

// ============================================
// 错误类型
// ============================================

/** 通道已存在错误 */
export class ChannelAlreadyExistsError extends Error {
  constructor(channelName: string) {
    super(`消息通道 "${channelName}" 已存在`);
    this.name = 'ChannelAlreadyExistsError';
  }
}

// ============================================
// ChannelRegistry 类
// ============================================

/**
 * 消息通道注册表
 *
 * 维护所有已注册消息通道的配置映射。支持注册、查询、列表和移除操作。
 *
 * @example
 * const registry = new ChannelRegistry();
 * registry.register({ name: 'auction', description: '拍卖行消息' });
 * registry.has('auction'); // true
 */
export class ChannelRegistry {
  /** 通道名 → 通道配置 */
  private channels: Map<MessageChannel, ChannelConfig> = new Map();

  /**
   * 注册新通道
   *
   * @param config - 通道配置
   * @param overwrite - 是否覆盖已存在的同名通道（默认 false）
   * @throws {ChannelAlreadyExistsError} 当通道已存在且 overwrite 为 false
   */
  register(config: ChannelConfig, overwrite = false): void {
    if (this.channels.has(config.name) && !overwrite) {
      throw new ChannelAlreadyExistsError(config.name);
    }
    this.channels.set(config.name, { ...config });
  }

  /**
   * 查询通道配置
   *
   * @param name - 通道名称
   * @returns 通道配置，不存在则返回 undefined
   */
  get(name: MessageChannel): ChannelConfig | undefined {
    return this.channels.get(name);
  }

  /**
   * 检查通道是否已注册
   *
   * @param name - 通道名称
   * @returns 是否已注册
   */
  has(name: MessageChannel): boolean {
    return this.channels.has(name);
  }

  /**
   * 列出所有已注册通道
   *
   * @returns 通道配置数组
   */
  list(): ChannelConfig[] {
    return Array.from(this.channels.values());
  }

  /**
   * 移除通道
   *
   * @param name - 通道名称
   * @returns 是否成功移除（通道不存在时返回 false）
   */
  remove(name: MessageChannel): boolean {
    return this.channels.delete(name);
  }

  /**
   * 注册预设通道
   *
   * 在初始化时调用，自动注册 system、combat、cultivation、
   * exploration、economy 五个内置通道。
   */
  registerPresets(): void {
    const presets: ChannelConfig[] = [
      { name: PRESET_CHANNELS[0], description: '系统消息' },
      { name: PRESET_CHANNELS[1], description: '战斗消息' },
      { name: PRESET_CHANNELS[2], description: '修炼消息' },
      { name: PRESET_CHANNELS[3], description: '探索消息' },
      { name: PRESET_CHANNELS[4], description: '经济消息' },
      { name: PRESET_CHANNELS[5], description: '奖励消息' },
    ];

    for (const config of presets) {
      if (!this.has(config.name)) {
        this.register(config);
      }
    }
  }
}
