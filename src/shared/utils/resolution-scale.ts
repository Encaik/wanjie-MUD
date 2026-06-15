'use client';

import { useLayoutEffect, useState } from 'react';

// ============================================
// 分辨率缩放 — 纯函数
// ============================================

/**
 * 根据视口宽度计算缩放系数
 *
 * 基准为 1920px（1080p 桌面），在 1366px ~ 2560px+ 范围内
 * 输出 0.7 ~ 1.15 的缩放系数，确保背景特效在不同分辨率下视觉一致。
 *
 * @param width - 视口宽度（CSS 像素）
 * @returns 缩放系数
 */
export function computeScaleFactor(width: number): number {
  if (width < 1400) return 0.7;   // 1366×768 笔记本
  if (width < 2000) return 0.85;  // 1680×1050 等中等分辨率
  if (width < 2400) return 1.0;   // 1920×1080 基准桌面
  return 1.15;                     // 2560×1440+ 2K/4K
}

// ============================================
// 分辨率缩放 — React Hook
// ============================================

/**
 * 响应式分辨率缩放 Hook
 *
 * 使用 `useLayoutEffect` 在浏览器绘制前同步检测视口宽度，
 * 避免首次渲染闪烁。服务端默认返回 1.0（基准缩放）。
 *
 * @returns 当前视口对应的缩放系数（SSR 安全，默认 1.0）
 */
export function useResolutionScale(): number {
  const [scaleFactor, setScaleFactor] = useState(1.0);

  useLayoutEffect(() => {
    /** 更新缩放系数 */
    function update() {
      setScaleFactor(computeScaleFactor(window.innerWidth));
    }

    update();

    // 监听窗口大小变化
    const mql = window.matchMedia('(min-width: 0px)');
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return scaleFactor;
}
