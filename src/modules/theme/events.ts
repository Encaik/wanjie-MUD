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
import { WORLD_DATA_ATTR_MAP } from './data/defaultTheme';
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
});

/** 世界事件类型 */
export type WorldEventType = keyof typeof worldEvents.events;

/**
 * 处理世界切换事件 — 更新 <html> 上的 data-world 属性
 *
 * @param worldType - 新的世界类型
 */
export function applyWorldTheme(worldType: WorldType): void {
  if (typeof document === 'undefined') return;

  const dataValue = WORLD_DATA_ATTR_MAP[worldType] || 'cultivation';
  document.documentElement.setAttribute('data-world', dataValue);
}

/**
 * 清除世界主题 — 回退到默认样式
 */
export function clearWorldTheme(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.removeAttribute('data-world');
}

/**
 * 处理世界变更事件
 */
function handleWorldChanged(event: GameEvent): void {
  const { worldType } = event.payload;
  applyWorldTheme(worldType as WorldType);
}

/** 取消订阅函数引用 */
let unsubscribeWorldChanged: (() => void) | null = null;

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
}
