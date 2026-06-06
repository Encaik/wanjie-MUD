/**
 * 应用日志工具
 * 用于控制生产环境中的日志输出
 * 开发环境默认启用，生产环境默认禁用
 */

// 日志级别
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// 当前日志级别（默认开发环境启用，生产环境禁用）
const currentLevel = process.env.NODE_ENV === 'production' 
  ? LogLevel.WARN 
  : LogLevel.DEBUG;

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (currentLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (currentLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (currentLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
};
