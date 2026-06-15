'use client';

import { useRef, useCallback } from 'react';

/**
 * 防抖回调 Hook
 *
 * 在指定延迟内重复调用只执行最后一次。用于防止按钮重复点击。
 *
 * @param fn - 需要防抖的回调函数
 * @param delay - 防抖延迟（毫秒），默认 500ms
 * @returns 防抖后的回调函数
 *
 * @example
 * const handleClick = useDebounce(() => {
 *   console.log('clicked');
 * }, 300);
 */
export function useDebounce<T extends (...args: never[]) => void>(
  fn: T,
  delay = 500,
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        fnRef.current(...args);
        timerRef.current = null;
      }, delay);
    },
    [delay],
  ) as T;
}

/**
 * 节流回调 Hook
 *
 * 在指定间隔内只执行一次，忽略后续调用。适用于需要即时响应但防止重复的场景。
 *
 * @param fn - 需要节流的回调函数
 * @param interval - 节流间隔（毫秒），默认 500ms
 * @returns 节流后的回调函数
 */
export function useThrottle<T extends (...args: never[]) => void>(
  fn: T,
  interval = 500,
): T {
  const lastRef = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRef.current >= interval) {
        lastRef.current = now;
        fnRef.current(...args);
      }
    },
    [interval],
  ) as T;
}
