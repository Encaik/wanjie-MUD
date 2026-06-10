/**
 * Logger 单元测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { createLogger, setLogLevel, getLogLevel } from '../logger';
import { LogLevel } from '../types';

describe('Logger', () => {
  // 在每个测试前重置日志级别并 mock console
  beforeEach(() => {
    setLogLevel(LogLevel.DEBUG);
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // 每个测试后恢复所有 mock，避免状态泄漏
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // createLogger
  // ============================================

  describe('createLogger', () => {
    it('应返回包含 debug/info/warn/error 方法的 Logger 对象', () => {
      const log = createLogger('Test');
      expect(typeof log.debug).toBe('function');
      expect(typeof log.info).toBe('function');
      expect(typeof log.warn).toBe('function');
      expect(typeof log.error).toBe('function');
    });

    it('应自动添加模块命名空间前缀', () => {
      const log = createLogger('ModLoader');
      log.info('加载完成');
      expect(console.info).toHaveBeenCalledWith(
        '[INFO] [ModLoader]',
        '加载完成'
      );
    });

    it('应支持额外的参数传递', () => {
      const log = createLogger('Test');
      log.debug('详情', { count: 5 }, 'extra');
      expect(console.debug).toHaveBeenCalledWith(
        '[DEBUG] [Test]',
        '详情',
        { count: 5 },
        'extra'
      );
    });

    it('不同模块的 logger 应有不同的命名空间前缀', () => {
      const logA = createLogger('A');
      const logB = createLogger('B');

      logA.info('消息A');
      logB.info('消息B');

      expect(console.info).toHaveBeenNthCalledWith(1, '[INFO] [A]', '消息A');
      expect(console.info).toHaveBeenNthCalledWith(2, '[INFO] [B]', '消息B');
    });

    it('应使用正确的 console 方法对应日志级别', () => {
      const log = createLogger('Test');
      log.debug('debug msg');
      log.info('info msg');
      log.warn('warn msg');
      log.error('error msg');

      expect(console.debug).toHaveBeenCalledWith('[DEBUG] [Test]', 'debug msg');
      expect(console.info).toHaveBeenCalledWith('[INFO] [Test]', 'info msg');
      expect(console.warn).toHaveBeenCalledWith('[WARN] [Test]', 'warn msg');
      expect(console.error).toHaveBeenCalledWith('[ERROR] [Test]', 'error msg');
    });
  });

  // ============================================
  // 日志级别过滤
  // ============================================

  describe('日志级别过滤', () => {
    it('WARN 级别下应抑制 debug 和 info', () => {
      setLogLevel(LogLevel.WARN);
      const log = createLogger('Test');

      log.debug('不应输出');
      log.info('不应输出');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
    });

    it('WARN 级别下 warn 和 error 应正常输出', () => {
      setLogLevel(LogLevel.WARN);
      const log = createLogger('Test');

      log.warn('警告消息');
      log.error('错误消息');

      expect(console.warn).toHaveBeenCalledWith('[WARN] [Test]', '警告消息');
      expect(console.error).toHaveBeenCalledWith('[ERROR] [Test]', '错误消息');
    });

    it('ERROR 级别下应抑制 debug/info/warn', () => {
      setLogLevel(LogLevel.ERROR);
      const log = createLogger('Test');

      log.debug('x');
      log.info('x');
      log.warn('x');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('ERROR 级别下 error 应正常输出', () => {
      setLogLevel(LogLevel.ERROR);
      const log = createLogger('Test');

      log.error('严重错误');

      expect(console.error).toHaveBeenCalledWith('[ERROR] [Test]', '严重错误');
    });
  });

  // ============================================
  // setLogLevel / getLogLevel
  // ============================================

  describe('setLogLevel / getLogLevel', () => {
    it('setLogLevel 后 getLogLevel 应返回对应值', () => {
      setLogLevel(LogLevel.WARN);
      expect(getLogLevel()).toBe(LogLevel.WARN);

      setLogLevel(LogLevel.DEBUG);
      expect(getLogLevel()).toBe(LogLevel.DEBUG);
    });

    it('SILENT 级别应抑制所有日志输出', () => {
      setLogLevel(LogLevel.SILENT);
      const log = createLogger('Test');

      log.debug('x');
      log.info('x');
      log.warn('x');
      log.error('x');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // 默认级别
  // ============================================

  describe('默认级别', () => {
    it('getLogLevel 应返回有效值', () => {
      const level = getLogLevel();
      expect([LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.SILENT]).toContain(level);
    });
  });
});
