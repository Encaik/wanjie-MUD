/**
 * 主题事件处理器
 *
 * 监听游戏事件（世界切换等），触发主题切换。
 * 通过 EventBus 订阅相关事件。
 *
 * @module modules/theme
 */

import type { GameEvent } from '@/core/events';
import { eventRegistry, on } from '@/core/events';
import type { WorldType } from '@/core/types';

// ============================================
// 事件注册（声明式——无需修改 core）
// ============================================

/**
 * 世界/主题事件命名空间和定义
 *
 * 使用方式：
 * - 触发事件：`emit(worldEvents.events.world_changed, { worldType: '...', ... })`
 * - 订阅事件：`on(worldEvents.events.world_changed, handler)`
 */
export const worldEvents = eventRegistry.registerModule('world', {
  world_changed: { description: '世界切换' },
  new_game_started: { description: '新游戏开始，清除旧世界主题' },
});

/** 世界事件类型 */
export type WorldEventType = keyof typeof worldEvents.events;

/**
 * 应用世界主题 — 设置 data-world 属性（用于 CSS 兜底，如 Mod 样式）
 *
 * @param worldType - 世界类型
 */
export function applyWorldTheme(worldType: WorldType): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-world', worldType);
}

/**
 * 清除世界主题属性
 */
export function clearWorldTheme(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.removeAttribute('data-world');
}

/** 世界切换回调类型（ThemeProvider 注入） */
let onWorldChangedCallback: ((worldviewId: string) => void) | null = null;

/**
 * 注册世界切换回调（由 ThemeProvider 调用）
 */
export function setOnWorldChanged(cb: ((worldviewId: string) => void) | null): void {
  onWorldChangedCallback = cb;
}

/** 新游戏开始回调类型（ThemeProvider 注入） */
let onNewGameStartedCallback: (() => void) | null = null;

/**
 * 注册新游戏开始回调（由 ThemeProvider 调用）
 */
export function setOnNewGameStarted(cb: (() => void) | null): void {
  onNewGameStartedCallback = cb;
}

/**
 * 处理世界变更事件 — 调用 ThemeProvider 注入的回调
 */
function handleWorldChanged(event: GameEvent): void {
  const { worldviewId, worldType } = event.payload;
  // 保留 data-world 属性（CSS 兜底）
  if (worldType) {
    applyWorldTheme(worldType as WorldType);
  }
  // 通知 ThemeProvider 加载主题
  if (onWorldChangedCallback) {
    onWorldChangedCallback((worldviewId as string) || (worldType as string));
  }
}

/**
 * 处理新游戏开始事件 — 清除旧世界主题
 */
function handleNewGameStarted(): void {
  // 清除 data-world 属性
  clearWorldTheme();
  // 清除 localStorage 中的世界主题缓存
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('world_theme_cache');
    } catch {
      // 静默失败
    }
  }
  // 通知 ThemeProvider 清除状态和 CSS 变量
  if (onNewGameStartedCallback) {
    onNewGameStartedCallback();
  }
}

/** 取消订阅函数引用 */
let unsubscribeWorldChanged: (() => void) | null = null;
let unsubscribeNewGameStarted: (() => void) | null = null;

/**
 * 订阅主题相关事件
 *
 * 在应用初始化时调用一次。
 */
export function subscribeThemeEvents(): void {
  if (unsubscribeWorldChanged) return; // 已订阅

  unsubscribeWorldChanged = on(
    worldEvents.events.world_changed,
    handleWorldChanged,
  );
  unsubscribeNewGameStarted = on(
    worldEvents.events.new_game_started,
    handleNewGameStarted,
  );
}

/**
 * 取消订阅主题相关事件
 *
 * 在应用卸载或主题模块销毁时调用。
 */
export function unsubscribeThemeEvents(): void {
  if (unsubscribeWorldChanged) {
    unsubscribeWorldChanged();
    unsubscribeWorldChanged = null;
  }
  if (unsubscribeNewGameStarted) {
    unsubscribeNewGameStarted();
    unsubscribeNewGameStarted = null;
  }
}
