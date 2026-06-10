/**
 * 系统日志记录器
 *
 * 提供 createLogger() 工厂函数创建带命名空间的日志实例，
 * 以及 setLogLevel()/getLogLevel() 运行时级别控制。
 *
 * @module core/logger
 */

import { LogLevel } from './types';

import type { Logger, LogFn } from './types';

// ============================================
// 内部工具
// ============================================

/** 当前全局日志级别 */
let currentLevel: LogLevel =
  process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;

/** 级别 → console 方法映射 */
const CONSOLE_METHODS: Record<keyof Logger, keyof Console> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

/** 级别 → 日志前缀映射 */
const LEVEL_PREFIX: Record<keyof Logger, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

/** 级别名 → LogLevel 值映射（用于级别过滤） */
const LEVEL_THRESHOLD: Record<keyof Logger, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

/**
 * 创建单个日志方法
 *
 * @param moduleName - 模块命名空间
 * @param method - 日志级别（debug/info/warn/error）
 * @returns 绑定命名空间和级别的日志函数
 */
function createLogMethod(moduleName: string, method: keyof Logger): LogFn {
  const consoleMethod = CONSOLE_METHODS[method];
  const prefix = `[${LEVEL_PREFIX[method]}] [${moduleName}]`;
  const threshold = LEVEL_THRESHOLD[method];

  return (message: string, ...args: unknown[]): void => {
    if (currentLevel <= threshold) {
      (console[consoleMethod] as (...data: unknown[]) => void)(prefix, message, ...args);
    }
  };
}

// ============================================
// 公开 API
// ============================================

/**
 * 创建带命名空间的日志记录器
 *
 * 每个模块在文件顶部调用一次，后续使用返回的 logger 实例记录日志。
 * 所有输出自动携带 `[ModuleName]` 前缀，方便在控制台中过滤。
 *
 * @param name - 模块命名空间（建议使用模块名或文件名）
 * @returns Logger 实例
 *
 * @example
 * const log = createLogger('ModLoader');
 * log.info('加载完成', { modCount: 5 });
 * // 输出: [INFO] [ModLoader] 加载完成 { modCount: 5 }
 */
export function createLogger(name: string): Logger {
  return {
    debug: createLogMethod(name, 'debug'),
    info: createLogMethod(name, 'info'),
    warn: createLogMethod(name, 'warn'),
    error: createLogMethod(name, 'error'),
  };
}

/**
 * 设置全局日志级别
 *
 * 可以在浏览器控制台中调用以动态调整日志输出：
 * `setLogLevel(LogLevel.DEBUG)` 开启所有日志。
 *
 * @param level - 目标日志级别
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * 获取当前全局日志级别
 *
 * @returns 当前生效的 LogLevel 值
 */
export function getLogLevel(): LogLevel {
  return currentLevel;
}
