/**
 * 事件模式匹配器
 *
 * 纯函数集合，负责判断事件类型字符串是否匹配给定的匹配模式。
 * 支持三种匹配器类型：
 * 1. 精确字符串匹配 — 'combat:monster_killed'
 * 2. 通配符匹配 — 'combat:*'
 * 3. 自定义过滤函数 — (type) => boolean
 */

import type { EventMatcher, EventType } from './types';

/**
 * 检查给定的匹配器是否为通配符模式
 *
 * 通配符模式是以 `*` 结尾的字符串。
 *
 * @param matcher - 事件匹配器
 * @returns 是否为通配符模式
 */
export function isWildcardPattern(matcher: EventMatcher): matcher is string {
  return typeof matcher === 'string' && matcher.endsWith('*');
}

/**
 * 提取通配符模式的前缀部分
 *
 * @param pattern - 通配符模式字符串（如 'combat:*'）
 * @returns 前缀字符串（如 'combat:'），如果不是通配符模式返回 null
 */
export function getWildcardPrefix(pattern: string): string | null {
  if (!pattern.endsWith('*')) return null;
  return pattern.slice(0, -1); // 去掉最后的 '*'
}

/**
 * 判断事件类型是否匹配给定的匹配器
 *
 * @param eventType - 事件类型字符串（如 'combat:monster_killed'）
 * @param matcher - 匹配器（精确字符串、通配符模式或过滤函数）
 * @returns 是否匹配
 *
 * @example
 * matchPattern('combat:monster_killed', 'combat:monster_killed')    // true
 * matchPattern('combat:monster_killed', 'combat:*')                 // true
 * matchPattern('collection:item_collected', 'combat:*')             // false
 * matchPattern('combat:boss_killed', t => t.includes('killed'))     // true
 */
export function matchPattern(eventType: EventType, matcher: EventMatcher): boolean {
  // 1. 函数匹配器：直接调用
  if (typeof matcher === 'function') {
    return matcher(eventType);
  }

  // 2. 通配符模式：检查前缀
  if (isWildcardPattern(matcher)) {
    const prefix = getWildcardPrefix(matcher)!;
    return eventType.startsWith(prefix);
  }

  // 3. 精确字符串匹配
  return eventType === matcher;
}

/**
 * 从多个监听器条目中筛选出匹配给定事件类型的条目
 *
 * @param eventType - 事件类型字符串
 * @param entries - 监听器条目列表（每个条目包含 matcher 和 listener）
 * @returns 匹配的条目列表（按优先级排序：精确匹配优先于通配符匹配）
 */
export function findMatchingEntries<T>(
  eventType: EventType,
  entries: Array<{ matcher: EventMatcher; listener: T; priority: number; order: number }>
): Array<{ listener: T; priority: number; order: number }> {
  const matched: Array<{ listener: T; priority: number; order: number; isExact: boolean }> = [];

  for (const entry of entries) {
    if (matchPattern(eventType, entry.matcher)) {
      matched.push({
        listener: entry.listener,
        priority: entry.priority,
        order: entry.order,
        isExact: typeof entry.matcher === 'string' && !isWildcardPattern(entry.matcher),
      });
    }
  }

  // 排序规则：
  // 1. 先按 priority 升序（数字小的先执行）
  // 2. 同 priority 时，精确匹配优先于通配符匹配
  // 3. 同类型同 priority，按订阅先后顺序（order 升序）
  matched.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.isExact !== b.isExact) return a.isExact ? -1 : 1;
    return a.order - b.order;
  });

  return matched;
}
