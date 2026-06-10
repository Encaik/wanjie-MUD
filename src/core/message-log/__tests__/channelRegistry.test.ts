/**
 * ChannelRegistry 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';

import {
  ChannelRegistry,
  ChannelAlreadyExistsError,
} from '../channelRegistry';
import { PRESET_CHANNELS } from '../types';

describe('ChannelRegistry', () => {
  let registry: ChannelRegistry;

  beforeEach(() => {
    registry = new ChannelRegistry();
  });

  // ============================================
  // 注册
  // ============================================

  describe('register', () => {
    it('应成功注册新通道', () => {
      registry.register({ name: 'auction', description: '拍卖行消息' });
      expect(registry.has('auction')).toBe(true);
    });

    it('应能查询已注册通道的完整配置', () => {
      registry.register({ name: 'trade', description: '交易消息' });
      const config = registry.get('trade');
      expect(config).toEqual({ name: 'trade', description: '交易消息' });
    });

    it('重复注册同名通道应抛出 ChannelAlreadyExistsError', () => {
      registry.register({ name: 'combat' });
      expect(() => registry.register({ name: 'combat' })).toThrow(
        ChannelAlreadyExistsError
      );
    });

    it('使用 overwrite=true 可覆盖已存在的通道', () => {
      registry.register({ name: 'combat', description: '老配置' });
      registry.register(
        { name: 'combat', description: '新配置' },
        true
      );
      expect(registry.get('combat')?.description).toBe('新配置');
    });
  });

  // ============================================
  // 查询
  // ============================================

  describe('get', () => {
    it('查询不存在的通道应返回 undefined', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('未注册的通道应返回 false', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });

    it('已注册的通道应返回 true', () => {
      registry.register({ name: 'test' });
      expect(registry.has('test')).toBe(true);
    });
  });

  // ============================================
  // 列表
  // ============================================

  describe('list', () => {
    it('空注册表应返回空数组', () => {
      expect(registry.list()).toEqual([]);
    });

    it('应返回所有已注册通道', () => {
      registry.register({ name: 'a' });
      registry.register({ name: 'b' });
      expect(registry.list()).toHaveLength(2);
    });
  });

  // ============================================
  // 移除
  // ============================================

  describe('remove', () => {
    it('移除已注册通道应返回 true', () => {
      registry.register({ name: 'temp' });
      expect(registry.remove('temp')).toBe(true);
      expect(registry.has('temp')).toBe(false);
    });

    it('移除不存在的通道应返回 false', () => {
      expect(registry.remove('nonexistent')).toBe(false);
    });
  });

  // ============================================
  // 预设通道
  // ============================================

  describe('registerPresets', () => {
    it('应注册所有预设通道', () => {
      registry.registerPresets();
      for (const name of PRESET_CHANNELS) {
        expect(registry.has(name)).toBe(true);
      }
    });

    it('重复调用不应抛出错误', () => {
      registry.registerPresets();
      expect(() => registry.registerPresets()).not.toThrow();
    });
  });
});
