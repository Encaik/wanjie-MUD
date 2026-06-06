'use client';

import { useEffect, useState } from 'react';
import { 
  CriticalHealthLevel, 
  getCriticalHealthLevel, 
  getCriticalHealthEffect 
} from '@/lib/game/typesExtension';

interface CriticalHealthOverlayProps {
  currentHp: number;
  maxHp: number;
}

/**
 * 残血视觉蒙层组件
 * 
 * 设计原则：
 * 1. 从页面边缘开始渐变的暗红色光晕
 * 2. 光晕强度随HP百分比降低而增强
 * 3. 危险等级时有脉冲动画增强警示感
 * 4. 不阻挡游戏操作，仅作为视觉提示
 */
export function CriticalHealthOverlay({ currentHp, maxHp }: CriticalHealthOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  
  // 计算HP百分比
  const hpPercent = maxHp > 0 ? (currentHp / maxHp) * 100 : 100;
  const level = getCriticalHealthLevel(hpPercent);
  const effect = getCriticalHealthEffect(level);
  
  useEffect(() => {
    // 只有在warning及以上等级才显示
    const shouldShow = level !== 'normal';
    setIsVisible(shouldShow);
    
    // critical等级启用脉冲动画
    setIsPulsing(level === 'critical' || level === 'danger');
  }, [level]);
  
  if (!isVisible) {
    return null;
  }
  
  // 根据残血等级计算边框宽度（从边缘向中心扩散）
  const borderWidths: Record<CriticalHealthLevel, string> = {
    normal: 'inset 0 0 0 0',
    warning: 'inset 0 0 100px 50px',
    danger: 'inset 0 0 150px 75px',
    critical: 'inset 0 0 200px 100px',
  };
  
  const borderWidth = borderWidths[level];
  
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-40"
      style={{
        boxShadow: `${borderWidth} ${effect.glowColor}`,
        animation: isPulsing ? `pulse-glow ${effect.pulseSpeed}ms ease-in-out infinite` : 'none',
      }}
    >
      {/* 危险等级时添加微弱的屏幕震动效果 */}
      {level === 'critical' && (
        <div 
          className="absolute inset-0"
          style={{
            animation: 'subtle-shake 0.5s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}

/**
 * 残血警告文字提示（可选显示）
 */
export function CriticalHealthWarning({ currentHp, maxHp }: CriticalHealthOverlayProps) {
  const hpPercent = maxHp > 0 ? (currentHp / maxHp) * 100 : 100;
  const level = getCriticalHealthLevel(hpPercent);
  
  if (level === 'normal' || level === 'warning') {
    return null;
  }
  
  const warningText = level === 'critical' ? '濒死' : '危险';
  
  return (
    <div 
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
      style={{
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <span 
        className="text-red-500/50 text-6xl font-bold tracking-widest"
        style={{
          textShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
        }}
      >
        {warningText}
      </span>
    </div>
  );
}
