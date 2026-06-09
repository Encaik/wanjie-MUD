/**
 * 主题事件处理器
 *
 * 监听游戏事件（世界切换等），触发主题切换。
 * 通过 gameEventManager 订阅相关事件。
 *
 * @module modules/theme
 */

import { gameEventManager, GameEventType, type GameEvent } from '@/shared/lib/events/eventManager';
import { WORLD_DATA_ATTR_MAP } from './data/defaultTheme';
import type { WorldType } from '@/shared/lib/types';

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
function handleWorldChanged(event: GameEvent<GameEventType.WORLD_CHANGED>): void {
  const { worldType } = event.payload;
  applyWorldTheme(worldType);
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

  unsubscribeWorldChanged = gameEventManager.addListener(
    GameEventType.WORLD_CHANGED,
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
