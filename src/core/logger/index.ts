/**
 * 系统运行日志 — 核心模块导出
 *
 * 提供面向开发者的分级日志记录器，输出到浏览器 F12 控制台。
 * 与 core/message-log/（玩家游戏消息）明确分工。
 *
 * @module core/logger
 */

export type { Logger, LogFn } from './types';

export { LogLevel } from './types';
export { createLogger, setLogLevel, getLogLevel } from './logger';
