/**
 * StyleLoader — 动态样式注入管理器
 *
 * 单例类，管理 CSS <style> 标签的生命周期（注入、追踪、移除）。
 * 支持按 Mod ID 追踪注入的样式，支持优先级排序和 SSR 安全守卫。
 *
 * 完整实现在 Section 3 中完成。
 *
 * @module modules/theme/logic
 */

import type { StyleLoadCallback, StyleErrorCallback, StyleUnloadCallback } from '../types';

/** 注入的样式元素元数据 */
interface InjectedStyle {
  element: HTMLStyleElement;
  priority: number;
}

export class StyleLoader {
  private static instance: StyleLoader | null = null;

  /** 已注入的样式映射表（Mod ID → 样式元数据） */
  private styles: Map<string, InjectedStyle> = new Map();

  /** 回调 */
  private loadCallbacks: StyleLoadCallback[] = [];
  private errorCallbacks: StyleErrorCallback[] = [];
  private unloadCallbacks: StyleUnloadCallback[] = [];

  private constructor() {}

  /** 获取单例实例 */
  static getInstance(): StyleLoader {
    if (!StyleLoader.instance) {
      StyleLoader.instance = new StyleLoader();
    }
    return StyleLoader.instance;
  }

  /** 检查是否在浏览器环境 */
  private isBrowser(): boolean {
    return typeof document !== 'undefined';
  }

  /**
   * 注册回调
   */
  onStylesLoaded(callback: StyleLoadCallback): void {
    this.loadCallbacks.push(callback);
  }

  onStylesError(callback: StyleErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  onStylesUnloaded(callback: StyleUnloadCallback): void {
    this.unloadCallbacks.push(callback);
  }

  /**
   * 注入 Mod 样式
   *
   * @param modId - Mod 标识符
   * @param cssContent - CSS 文本内容
   * @param priority - 优先级（数字越大越后加载，覆盖优先级越高）
   */
  injectModStyles(modId: string, cssContent: string, priority: number = 3): void {
    if (!this.isBrowser()) return;

    // 移除旧样式（如果存在）
    this.removeModStyles(modId);

    // 创建新样式标签
    const style = document.createElement('style');
    style.setAttribute('data-mod', modId);
    style.setAttribute('data-priority', String(priority));
    style.textContent = cssContent;

    // 按优先级插入到正确位置
    const existingStyles = document.head.querySelectorAll('style[data-mod]');
    let inserted = false;

    for (const existing of existingStyles) {
      const existingPriority = parseInt(existing.getAttribute('data-priority') || '0', 10);
      if (priority > existingPriority) {
        document.head.insertBefore(style, existing);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      document.head.appendChild(style);
    }

    // 追踪
    this.styles.set(modId, { element: style, priority });

    // 触发回调
    for (const cb of this.loadCallbacks) {
      cb(modId);
    }
  }

  /**
   * 移除 Mod 样式
   *
   * @param modId - Mod 标识符
   */
  removeModStyles(modId: string): void {
    if (!this.isBrowser()) return;

    const injected = this.styles.get(modId);
    if (injected) {
      injected.element.remove();
      this.styles.delete(modId);

      for (const cb of this.unloadCallbacks) {
        cb(modId);
      }
    }
  }

  /**
   * 获取已注入的样式元素
   *
   * @param modId - Mod 标识符
   * @returns HTMLStyleElement 或 undefined
   */
  getStyleElement(modId: string): HTMLStyleElement | undefined {
    return this.styles.get(modId)?.element;
  }

  /**
   * 获取所有已注入的 Mod ID
   */
  getLoadedModIds(): string[] {
    return Array.from(this.styles.keys());
  }

  /**
   * 触发错误回调（供外部调用，如 ModLoader 在 fetch 失败时使用）
   *
   * @param modId - Mod 标识符
   * @param error - 错误对象
   */
  triggerError(modId: string, error: Error): void {
    for (const cb of this.errorCallbacks) {
      try {
        cb(modId, error);
      } catch {
        // 回调自身错误不影响其他回调
      }
    }
  }

  /**
   * 移除所有 Mod 样式（用于重置）
   */
  removeAllModStyles(): void {
    for (const modId of this.getLoadedModIds()) {
      this.removeModStyles(modId);
    }
  }
}
