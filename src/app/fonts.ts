/**
 * 全局字体配置
 *
 * 使用 next/font/google 本地化字体：
 * - 构建时下载，同源分发，消除外部请求
 * - CSS 内联到 <head>，消除阻塞链
 * - 限制字重范围减少下载体积
 * - fallback 字体 size-adjust 匹配 Noto Serif SC 宽高比
 */
import { Noto_Serif_SC } from 'next/font/google';

/**
 * 正文字体 — 宋体/衬线
 *
 * 限定 400（常规）+ 700（粗体）两个常用字重，
 * 比全范围 200..900 减少约 75% 的字体下载量。
 */
export const serifFont = Noto_Serif_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif-next',
  fallback: [
    'Songti SC',
    'SimSun',
    'ui-serif',
    'Georgia',
    'serif',
  ],
  /*
   * size-adjust 说明：
   * Noto Serif SC 的中文方块宽度约为 100%，但我们使用 variable font，
   * next/font 自动计算合适的 size-adjust 值缩小后备字体与 web font 的差异。
   * 如需手动微调，可通过 adjustFontFallback: false 然后自定义。
   */
});

/**
 * 无衬线后备 — 用于 UI 标签等（需要区分于正文的场景）
 *
 * 目前 body 使用 font-serif，但如果将来需要 sans-serif 文本，
   * 这里预留接口，保持配置集中管理。
 */
