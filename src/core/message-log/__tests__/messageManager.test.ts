/**
 * MessageManager 单元测试
 */
import { describe, it, expect, afterEach } from 'vitest';

import {
  getMessageManager,
  resetMessageManager,
} from '../messageManager';
import { MESSAGE_BUFFER_LIMIT } from '../types';

// 每个测试后重置单例
afterEach(() => {
  resetMessageManager();
});

describe('MessageManager', () => {
  // ============================================
  // 单例
  // ============================================

  describe('getMessageManager', () => {
    it('应返回相同的实例', () => {
      const a = getMessageManager();
      const b = getMessageManager();
      expect(a).toBe(b);
    });

    it('resetMessageManager 后应创建新实例', () => {
      const a = getMessageManager();
      resetMessageManager();
      const b = getMessageManager();
      expect(a).not.toBe(b);
    });
  });

  // ============================================
  // broadcast
  // ============================================

  describe('broadcast', () => {
    it('应生成一条游戏消息并存入缓冲', () => {
      const mm = getMessageManager();
      mm.broadcast({
        channel: 'combat',
        title: '战斗胜利',
        content: '击败了妖兽',
        level: 'success',
      });

      const messages = mm.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].channel).toBe('combat');
      expect(messages[0].title).toBe('战斗胜利');
      expect(messages[0].content).toBe('击败了妖兽');
      expect(messages[0].type).toBe('success');
    });

    it('每条消息应有唯一的 id', () => {
      const mm = getMessageManager();
      mm.broadcast({ channel: 'system', title: 'A', content: 'a' });
      mm.broadcast({ channel: 'system', title: 'B', content: 'b' });

      const messages = mm.getMessages();
      expect(messages[0].id).not.toBe(messages[1].id);
    });

    it('每条消息应有有效的时间戳', () => {
      const mm = getMessageManager();
      const before = Date.now();
      mm.broadcast({ channel: 'system', title: '测试', content: '内容' });
      const after = Date.now();

      const msg = mm.getMessages()[0];
      expect(msg.timestamp).toBeGreaterThanOrEqual(before);
      expect(msg.timestamp).toBeLessThanOrEqual(after);
    });

    it('未指定 level 时默认使用 info', () => {
      const mm = getMessageManager();
      mm.broadcast({ channel: 'system', title: 'T', content: 'C' });
      expect(mm.getMessages()[0].type).toBe('info');
    });
  });

  // ============================================
  // 缓冲上限
  // ============================================

  describe('buffer limit', () => {
    it('缓冲超过上限时应移除最旧的消息', () => {
      const mm = getMessageManager();

      // 添加超过上限的消息
      for (let i = 0; i < MESSAGE_BUFFER_LIMIT + 10; i++) {
        mm.broadcast({
          channel: 'system',
          title: `消息 ${i}`,
          content: `内容 ${i}`,
        });
      }

      const messages = mm.getMessages();
      expect(messages.length).toBeLessThanOrEqual(MESSAGE_BUFFER_LIMIT);
      // 第一条应为第 10 条（最早的 10 条已移除）
      expect(messages[0].title).toBe('消息 10');
    });
  });

  // ============================================
  // 缓冲查询
  // ============================================

  describe('getMessages', () => {
    it('应返回缓冲的副本', () => {
      const mm = getMessageManager();
      mm.broadcast({ channel: 'system', title: 'T', content: 'C' });

      const messages = mm.getMessages();
      messages.push({} as never);

      // 原缓冲不应被修改
      expect(mm.getMessages()).toHaveLength(1);
    });
  });

  describe('getRecentMessages', () => {
    it('应返回最近 N 条消息', () => {
      const mm = getMessageManager();
      for (let i = 0; i < 10; i++) {
        mm.broadcast({ channel: 'system', title: `T${i}`, content: `C${i}` });
      }

      const recent = mm.getRecentMessages(3);
      expect(recent).toHaveLength(3);
      expect(recent[0].title).toBe('T7');
      expect(recent[1].title).toBe('T8');
      expect(recent[2].title).toBe('T9');
    });
  });

  describe('clearMessages', () => {
    it('应清空缓冲', () => {
      const mm = getMessageManager();
      mm.broadcast({ channel: 'system', title: 'T', content: 'C' });
      mm.clearMessages();
      expect(mm.getMessages()).toHaveLength(0);
    });
  });

  // ============================================
  // 模板
  // ============================================

  describe('registerTemplate / getTemplates', () => {
    it('应成功注册模板并查询', () => {
      const mm = getMessageManager();
      mm.registerTemplate({
        eventType: 'combat:monster_killed',
        channel: 'combat',
        level: 'success',
        title: '击杀',
        content: () => '击败了怪物',
      });

      const templates = mm.getTemplates();
      expect(templates).toHaveLength(1);
      expect(templates[0].eventType).toBe('combat:monster_killed');
    });

    it('按通道筛选模板', () => {
      const mm = getMessageManager();
      mm.registerTemplate({
        eventType: 'combat:a',
        channel: 'combat',
        level: 'info',
        title: 'A',
        content: 'a',
      });
      mm.registerTemplate({
        eventType: 'cultivation:b',
        channel: 'cultivation',
        level: 'info',
        title: 'B',
        content: 'b',
      });

      expect(mm.getTemplates('combat')).toHaveLength(1);
      expect(mm.getTemplates('cultivation')).toHaveLength(1);
      expect(mm.getTemplates('nonexistent')).toHaveLength(0);
    });
  });

  // ============================================
  // 通道管理
  // ============================================

  describe('通道管理', () => {
    it('初始化时应注册预设通道', () => {
      const mm = getMessageManager();
      expect(mm.hasChannel('system')).toBe(true);
      expect(mm.hasChannel('combat')).toBe(true);
      expect(mm.hasChannel('cultivation')).toBe(true);
      expect(mm.hasChannel('exploration')).toBe(true);
      expect(mm.hasChannel('economy')).toBe(true);
    });

    it('应能注册新通道', () => {
      const mm = getMessageManager();
      mm.registerChannel({ name: 'auction', description: '拍卖行' });
      expect(mm.hasChannel('auction')).toBe(true);
    });

    it('应能列出所有通道', () => {
      const mm = getMessageManager();
      // 至少包含 5 个预设 + 自定义
      mm.registerChannel({ name: 'custom' });
      const channels = mm.listChannels();
      expect(channels.length).toBeGreaterThanOrEqual(6);
    });

    it('应能移除通道', () => {
      const mm = getMessageManager();
      mm.registerChannel({ name: 'temp' });
      expect(mm.removeChannel('temp')).toBe(true);
      expect(mm.hasChannel('temp')).toBe(false);
    });
  });
});
