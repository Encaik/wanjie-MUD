'use client';

import { useMemo } from 'react';

import { createRng } from '@/shared/utils/rng';

// ============================================
// 类型
// ============================================

/** 背景场景变体 */
export type BgVariant = 'runes' | 'stars' | 'destiny' | 'fated';

/** 粒子强度 */
export type BgIntensity = 'subtle' | 'full';

/** 单个粒子的静态属性 */
interface Particle {
  /** 水平位置百分比 */
  left: string;
  /** 垂直位置百分比 */
  top: string;
  /** 宽度 (px) */
  width: number;
  /** 高度 (px) */
  height: number;
  /** 动画延迟 (s) */
  delay: string;
  /** 动画时长 (s) */
  duration: string;
  /** 额外颜色类 */
  colorClass: string;
}

/** 星座连线 */
interface ConstellationLine {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  opacity: number;
}

interface MysticalBackgroundProps {
  /** 场景变体 */
  variant?: BgVariant;
  /** 粒子强度 */
  intensity?: BgIntensity;
  /** 水印文字（覆盖默认值） */
  watermarkText?: string;
}

// ============================================
// 静态配置
// ============================================

/** 首页浮动符文 */
const FLOATING_RUNES = [
  { char: '道', x: '8%', y: '18%', delay: '0s', dur: '7s' },
  { char: '法', x: '88%', y: '12%', delay: '1.2s', dur: '8s' },
  { char: '修', x: '12%', y: '78%', delay: '0.6s', dur: '6.5s' },
  { char: '仙', x: '82%', y: '72%', delay: '2s', dur: '7.5s' },
  { char: '灵', x: '48%', y: '8%', delay: '1.8s', dur: '9s' },
  { char: '气', x: '52%', y: '88%', delay: '0.3s', dur: '7.2s' },
  { char: '天', x: '93%', y: '42%', delay: '2.5s', dur: '8.5s' },
  { char: '地', x: '4%', y: '52%', delay: '1.5s', dur: '6.8s' },
];

/** 首页光点 */
const LIGHT_DOTS = [
  { x: '20%', y: '30%', delay: '0s', size: '2px' },
  { x: '70%', y: '25%', delay: '0.8s', size: '3px' },
  { x: '35%', y: '65%', delay: '1.6s', size: '2px' },
  { x: '65%', y: '70%', delay: '2.2s', size: '1.5px' },
  { x: '25%', y: '85%', delay: '0.4s', size: '2.5px' },
  { x: '75%', y: '15%', delay: '1.2s', size: '2px' },
  { x: '55%', y: '55%', delay: '2.8s', size: '1.5px' },
  { x: '15%', y: '40%', delay: '3.2s', size: '3px' },
];

/** 默认水印文字映射 */
const DEFAULT_WATERMARKS: Record<BgVariant, string> = {
  runes: '万界',
  stars: '万象',
  destiny: '命运',
  fated: '宿命',
};

// ============================================
// 粒子生成（确定性，使用 seed）
// ============================================

/** 金色/琥珀色系粒子颜色 */
const STAR_COLORS = [
  'bg-amber-400/50',
  'bg-amber-300/40',
  'bg-yellow-400/45',
  'bg-amber-200/55',
  'bg-amber-500/35',
  'bg-red-400/25',   // 朱砂暖红点缀
  'bg-amber-400/60',
  'bg-yellow-300/50',
];

/**
 * 从种子确定性生成粒子数组
 */
function generateParticles(
  seed: string,
  count: number,
  minSize: number,
  maxSize: number,
): Particle[] {
  const rng = createRng(seed);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const size = minSize + rng() * (maxSize - minSize);
    particles.push({
      left: `${rng() * 94 + 3}%`,
      top: `${rng() * 94 + 3}%`,
      width: Math.round(size * 10) / 10,
      height: Math.round(size * 10) / 10,
      delay: `${(rng() * 4).toFixed(1)}s`,
      duration: `${(2 + rng() * 2).toFixed(1)}s`,
      colorClass: STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)],
    });
  }
  return particles;
}

/** 生成星座连线 */
function generateConstellationLines(
  seed: string,
  count: number,
  minOpacity: number,
  maxOpacity: number,
): ConstellationLine[] {
  const rng = createRng(seed + '_lines');
  const lines: ConstellationLine[] = [];
  for (let i = 0; i < count; i++) {
    lines.push({
      x1: `${rng() * 90 + 5}%`,
      y1: `${rng() * 90 + 5}%`,
      x2: `${rng() * 90 + 5}%`,
      y2: `${rng() * 90 + 5}%`,
      opacity: minOpacity + rng() * (maxOpacity - minOpacity),
    });
  }
  return lines;
}

// ============================================
// 组件
// ============================================

/**
 * 东方玄幻氛围背景系统
 *
 * 从首页提取的通用背景组件，支持四种场景变体：
 * - runes：浮动汉字 + 光点 + 万界水印（首页）
 * - stars：星点粒子 + 星座连线 + 万象水印（世界选择）
 * - destiny：密集金色光点 + 命运之线 + 命运水印（人物选择）
 * - fated：金色光点 + 宿命水印（故事背景）
 *
 * 所有粒子位置通过 seed 确定性生成，确保 SSR 一致。
 */
export function MysticalBackground({
  variant = 'runes',
  intensity = 'full',
  watermarkText,
}: MysticalBackgroundProps) {
  const watermark = watermarkText ?? DEFAULT_WATERMARKS[variant];

  // 粒子密度系数
  const densityMul = intensity === 'subtle' ? 0.6 : 1.0;

  /** 是否为密集粒子风格（destiny / fated） */
  const isDenseStyle = variant === 'destiny' || variant === 'fated';

  // 确定性生成粒子（使用固定的页面级 seed）
  const starParticles = useMemo(() => {
    const baseCount = isDenseStyle ? 90 : variant === 'stars' ? 70 : 0;
    return generateParticles(
      `bg-${variant}-stars`,
      Math.round(baseCount * densityMul),
      isDenseStyle ? 1 : 1.5,
      isDenseStyle ? 3 : 4,
    );
  }, [variant, densityMul, isDenseStyle]);

  const constellationLines = useMemo(() => {
    if (variant === 'runes') return [];
    const baseCount = isDenseStyle ? 14 : 10;
    const lineCount = Math.round(baseCount * densityMul);
    return generateConstellationLines(
      `bg-${variant}-lines`,
      lineCount,
      isDenseStyle ? 0.06 : 0.12,
      isDenseStyle ? 0.12 : 0.25,
    );
  }, [variant, densityMul, isDenseStyle]);

  // 是否显示符文和首页光点
  const showRunes = variant === 'runes';
  const showLightDots = variant === 'runes';

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* ========== 第 1 层：柔光团 ========== */}
      <div
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl"
        style={{
          transform: 'translate(-50%, -50%)',
          animation: showRunes ? 'pulse-glow 4s ease-in-out infinite' : 'pulse-glow 5s ease-in-out infinite',
        }}
      />

      {/* ========== 第 2 层：旋转光晕环 ========== */}
      {showRunes && (
        <div
          className="absolute top-1/2 left-1/2 w-[650px] h-[650px] rounded-full border border-primary/[0.04]"
          style={{ animation: 'glow-rotate 12s linear infinite' }}
        />
      )}

      {/* ========== 第 3 层：浮动符文（runes 专属） ========== */}
      {showRunes &&
        FLOATING_RUNES.map((rune) => (
          <span
            key={rune.char}
            className="absolute font-serif text-4xl sm:text-5xl text-primary/20"
            style={{
              left: rune.x,
              top: rune.y,
              animation: `float ${rune.dur} ease-in-out infinite`,
              animationDelay: rune.delay,
            }}
          >
            {rune.char}
          </span>
        ))}

      {/* ========== 第 4 层：首页光点（runes 专属） ========== */}
      {showLightDots &&
        LIGHT_DOTS.map((dot, i) => (
          <span
            key={`dot-${i}`}
            className="absolute rounded-full bg-primary/40"
            style={{
              left: dot.x,
              top: dot.y,
              width: dot.size,
              height: dot.size,
              animation: `pulse-glow ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: dot.delay,
            }}
          />
        ))}

      {/* ========== 第 5 层：星点粒子（stars / destiny 专属） ========== */}
      {starParticles.map((p, i) => (
        <span
          key={`star-${i}`}
          className={`absolute rounded-full ${p.colorClass}`}
          style={{
            left: p.left,
            top: p.top,
            width: `${p.width}px`,
            height: `${p.height}px`,
            animation: `star-twinkle ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* ========== 第 6 层：星座连线（stars / destiny 专属） ========== */}
      {constellationLines.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ animation: 'constellation-fade 1.5s ease-out forwards' }}
        >
          {constellationLines.map((line, i) => (
            <line
              key={`cline-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="currentColor"
              className="text-amber-400/20"
              strokeWidth="0.5"
              opacity={line.opacity}
            />
          ))}
        </svg>
      )}

      {/* ========== 第 7 层：水印大字 ========== */}
      {watermark && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <span
            className="absolute text-[75vw] font-bold text-nowrap text-muted-foreground/[0.10] font-serif tracking-wider"
            style={{ animation: 'pulse-glow 5s ease-in-out infinite' }}
          >
            {watermark}
          </span>
        </div>
      )}

      {/* ========== 第 8 层：柔光团（stars/destiny 多点柔光） ========== */}
      {!showRunes && (
        <>
          <div
            className="absolute w-[300px] h-[300px] rounded-full bg-amber-400/[0.05] blur-3xl"
            style={{ top: '15%', left: '20%', animation: 'pulse-glow 6s ease-in-out infinite' }}
          />
          <div
            className="absolute w-[300px] h-[300px] rounded-full bg-amber-400/[0.05] blur-3xl"
            style={{ top: '55%', left: '65%', animation: 'pulse-glow 7s ease-in-out infinite', animationDelay: '1.5s' }}
          />
        </>
      )}
    </div>
  );
}
