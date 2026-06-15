'use client';

import { useMemo } from 'react';

import { createRng } from '@/shared/utils/rng';

// ============================================
// 类型
// ============================================

export type BgVariant = 'runes' | 'stars' | 'destiny' | 'fated';
export type BgIntensity = 'subtle' | 'full';

interface Particle {
  left: string; top: string; width: number; height: number;
  delay: string; duration: string; colorClass: string;
}

interface Mote {
  left: string; top: string; size: number;
  delay: string; duration: string; drift: string;
}

interface ConstellationLine {
  x1: string; y1: string; x2: string; y2: string; opacity: number;
}

interface MysticalBackgroundProps {
  variant?: BgVariant;
  intensity?: BgIntensity;
  watermarkText?: string;
  scaleFactor?: number;
  /** 轻量模式：减少粒子/符文/光环数量，用于首页等首屏关键路径 */
  minimal?: boolean;
}

// ============================================
// 静态配置
// ============================================

const FLOATING_RUNES = [
  { char: '道', x: '8%', y: '15%', delay: '0s', dur: '7.5s', opacity: 0.18 },
  { char: '法', x: '85%', y: '10%', delay: '1.2s', dur: '8.5s', opacity: 0.15 },
  { char: '修', x: '10%', y: '75%', delay: '0.6s', dur: '7s', opacity: 0.20 },
  { char: '仙', x: '80%', y: '68%', delay: '2s', dur: '8s', opacity: 0.16 },
  { char: '灵', x: '45%', y: '6%', delay: '1.8s', dur: '9s', opacity: 0.14 },
  { char: '气', x: '55%', y: '90%', delay: '0.3s', dur: '7.8s', opacity: 0.17 },
  { char: '天', x: '92%', y: '38%', delay: '2.5s', dur: '9.5s', opacity: 0.13 },
  { char: '地', x: '4%', y: '48%', delay: '1.5s', dur: '7.2s', opacity: 0.19 },
  { char: '玄', x: '40%', y: '45%', delay: '3s', dur: '11s', opacity: 0.10 },
  { char: '真', x: '60%', y: '55%', delay: '2.2s', dur: '10s', opacity: 0.09 },
];

const DEFAULT_WATERMARKS: Record<BgVariant, string> = {
  runes: '万界', stars: '万象', destiny: '命运', fated: '宿命',
};

// 粒子色彩方案 — 暖金/琥珀光谱
const STAR_COLORS = [
  'bg-amber-400/55', 'bg-amber-300/45', 'bg-yellow-400/50',
  'bg-amber-200/60', 'bg-amber-500/40', 'bg-amber-400/65',
  'bg-yellow-300/55', 'bg-orange-400/30', 'bg-amber-300/35',
  'bg-yellow-200/50', 'bg-amber-400/30', 'bg-amber-500/25',
];

// 微尘色彩（更淡）
const MOTE_COLORS = [
  'bg-amber-300/30', 'bg-amber-200/25', 'bg-yellow-300/30',
  'bg-amber-400/20', 'bg-stone-300/20', 'bg-amber-200/35',
];

// ============================================
// 确定性生成器
// ============================================

function generateParticles(
  seed: string, count: number, minSize: number, maxSize: number,
): Particle[] {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => {
    const size = minSize + rng() * (maxSize - minSize);
    return {
      left: `${rng() * 94 + 3}%`, top: `${rng() * 94 + 3}%`,
      width: Math.round(size * 10) / 10, height: Math.round(size * 10) / 10,
      delay: `${(rng() * 4).toFixed(1)}s`,
      duration: `${(2 + rng() * 3).toFixed(1)}s`,
      colorClass: STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)],
    };
  });
}

/** 生成微尘 — 极小的缓慢漂浮光点，营造空气质感 */
function generateMotes(seed: string, count: number): Mote[] {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => ({
    left: `${rng() * 96 + 2}%`,
    top: `${rng() * 96 + 2}%`,
    size: 1 + rng() * 2.5,
    delay: `${(rng() * 6).toFixed(1)}s`,
    duration: `${(8 + rng() * 12).toFixed(1)}s`,
    drift: `${((rng() - 0.5) * 30).toFixed(0)}px`,
  }));
}

function generateConstellationLines(
  seed: string, count: number, minO: number, maxO: number,
): ConstellationLine[] {
  const rng = createRng(seed + '_lines');
  return Array.from({ length: count }, () => ({
    x1: `${rng() * 90 + 5}%`, y1: `${rng() * 90 + 5}%`,
    x2: `${rng() * 90 + 5}%`, y2: `${rng() * 90 + 5}%`,
    opacity: minO + rng() * (maxO - minO),
  }));
}

// ============================================
// 组件
// ============================================

export function MysticalBackground({
  variant = 'runes',
  intensity = 'full',
  watermarkText,
  scaleFactor = 1.0,
  minimal = false,
}: MysticalBackgroundProps) {
  const watermark = watermarkText ?? DEFAULT_WATERMARKS[variant];
  const densityMul = intensity === 'subtle' ? 0.5 : 1.0;
  const isDenseStyle = variant === 'destiny' || variant === 'fated';
  const showRunes = variant === 'runes';

  // 分辨率动态尺寸
  const watermarkBaseSize = watermark.length <= 2 ? 62 : 42;
  const ringOuter = Math.round(720 * scaleFactor);
  const ringInner = Math.round(480 * scaleFactor);
  const glowLarge = Math.round(600 * scaleFactor);
  const glowMedium = Math.round(350 * scaleFactor);
  const glowSmall = Math.round(180 * scaleFactor);

  // 粒子
  const starParticles = useMemo(() => {
    const baseCount = isDenseStyle ? 100 : variant === 'stars' ? 80 : 0;
    return generateParticles(
      `bg-${variant}-v2`,
      Math.round(baseCount * densityMul),
      isDenseStyle ? 1 : 1.5,
      isDenseStyle ? 3.5 : 4.5,
    );
  }, [variant, densityMul, isDenseStyle]);

  // 微尘（全部变体通用，minimal 模式减少 67%）
  const motes = useMemo(() => {
    if (minimal) return generateMotes(`motes-${variant}-minimal`, 15);
    return generateMotes(`motes-${variant}-v2`, Math.round((showRunes ? 45 : 35) * densityMul));
  }, [variant, densityMul, showRunes, minimal]);

  // 星座连线
  const lines = useMemo(() => {
    if (showRunes) return [];
    const baseCount = isDenseStyle ? 16 : 12;
    return generateConstellationLines(
      `cl-${variant}-v2`, Math.round(baseCount * densityMul),
      isDenseStyle ? 0.05 : 0.10, isDenseStyle ? 0.13 : 0.22,
    );
  }, [variant, densityMul, showRunes, isDenseStyle]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">

      {/* ===== 第 1 层：多点柔光（无模糊，纯半透明色块） ===== */}
      {/* 主光 — 画面中央偏上（GPU 合成层提升） */}
      <div
        className="absolute rounded-full bg-amber-300/4"
        style={{
          width: `${glowLarge}px`, height: `${glowLarge}px`,
          top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)',
          willChange: 'transform, opacity',
          animationName: 'pulse-glow',
          animationDuration: '5s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
        }}
      />
      {/* 辅光 — 左下（minimal 模式跳过） */}
      {!minimal && (
        <div
          className="absolute rounded-full bg-amber-400/3"
          style={{
            width: `${glowMedium}px`, height: `${glowMedium}px`,
            top: '72%', left: '18%',
            animationName: 'pulse-glow',
            animationDuration: '7s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: '1.5s',
          }}
        />
      )}
      {/* 辅光 — 右上（minimal 模式跳过） */}
      {!minimal && (
        <div
          className="absolute rounded-full bg-primary/4"
          style={{
            width: `${glowMedium}px`, height: `${glowMedium}px`,
            top: '18%', left: '78%',
            animationName: 'pulse-glow',
            animationDuration: '6s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: '3s',
          }}
        />
      )}

      {/* ===== 第 2 层：旋转光晕环（runes 专属，minimal 模式跳过） ===== */}
      {showRunes && !minimal && (
        <>
          <div
            className="absolute rounded-full border border-primary/5"
            style={{
              width: `${ringOuter}px`, height: `${ringOuter}px`,
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              animationName: 'glow-rotate',
              animationDuration: '14s',
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          />
          <div
            className="absolute rounded-full border border-amber-300/6"
            style={{
              width: `${ringInner}px`, height: `${ringInner}px`,
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%) rotate(180deg)',
              animationName: 'glow-rotate',
              animationDuration: '10s',
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDirection: 'reverse',
            }}
          />
        </>
      )}

      {/* ===== 第 3 层：浮动符文（runes 专属，minimal 只显示 3 个） ===== */}
      {showRunes &&
        (minimal ? FLOATING_RUNES.slice(0, 3) : FLOATING_RUNES).map((rune) => (
          <span
            key={rune.char}
            className="absolute font-serif text-primary"
            style={{
              left: rune.x, top: rune.y,
              fontSize: `${2.5 * scaleFactor}rem`,
              opacity: rune.opacity,
              animationName: 'float',
              animationDuration: rune.dur,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: rune.delay,
            }}
          >
            {rune.char}
          </span>
        ))}

      {/* ===== 第 4 层：微尘 — 极小的光点缓慢漂浮 ===== */}
      {motes.map((m, i) => (
        <span
          key={`mote-${i}`}
          className="absolute rounded-full bg-amber-300/25"
          style={{
            left: m.left, top: m.top,
            width: `${m.size}px`, height: `${m.size}px`,
            animationName: 'spirit-rise',
            animationDuration: m.duration,
            animationTimingFunction: 'ease-out',
            animationIterationCount: 'infinite',
            animationDelay: m.delay,
          }}
        />
      ))}

      {/* ===== 第 5 层：星点粒子（非 runes 专属） ===== */}
      {starParticles.map((p, i) => (
        <span
          key={`star-${i}`}
          className={`absolute rounded-full ${p.colorClass}`}
          style={{
            left: p.left, top: p.top,
            width: `${p.width}px`, height: `${p.height}px`,
            animationName: 'star-twinkle',
            animationDuration: p.duration,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* ===== 第 6 层：星座连线（非 runes 专属，无模糊） ===== */}
      {lines.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ animation: 'constellation-fade 2s ease-out forwards' }}
        >
          {lines.map((line, i) => (
            <line
              key={`cl-${i}`}
              x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
              stroke="currentColor"
              className="text-amber-400/20"
              strokeWidth="0.5"
              opacity={line.opacity}
            />
          ))}
        </svg>
      )}

      {/* ===== 第 7 层：水印大字 ===== */}
      {watermark && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <span
            className="absolute font-bold text-nowrap text-muted-foreground/8 font-serif tracking-wider select-none"
            style={{
              fontSize: `${watermarkBaseSize * scaleFactor}vw`,
              animation: 'pulse-glow 6s ease-in-out infinite',
            }}
          >
            {watermark}
          </span>
        </div>
      )}

    </div>
  );
}
