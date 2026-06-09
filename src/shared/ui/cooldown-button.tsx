'use client';

import { useState, useEffect, useCallback } from 'react';

import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils';

interface CooldownButtonProps extends React.ComponentProps<'button'> {
  cooldown: number; // 冷却时间（毫秒）
  lastTriggerTime: number; // 上次触发的时间戳（0表示无CD）
  onCooldownComplete?: () => void;
}

export function CooldownButton({
  cooldown,
  lastTriggerTime,
  onCooldownComplete,
  children,
  disabled,
  className,
  onClick,
  ...props
}: CooldownButtonProps) {
  const [now, setNow] = useState(Date.now());
  
  // 每100ms更新一次
  useEffect(() => {
    if (lastTriggerTime === 0) return;
    
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 100);
    
    return () => clearInterval(interval);
  }, [lastTriggerTime]);
  
  const elapsed = now - lastTriggerTime;
  const remaining = Math.max(0, cooldown - elapsed);
  const progress = Math.min(1, elapsed / cooldown);
  const isOnCooldown = lastTriggerTime > 0 && remaining > 0;
  
  // CD结束时触发回调
  useEffect(() => {
    if (lastTriggerTime > 0 && !isOnCooldown) {
      onCooldownComplete?.();
    }
  }, [isOnCooldown, lastTriggerTime, onCooldownComplete]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (isOnCooldown || disabled) return;
    onClick?.(e);
  }, [isOnCooldown, disabled, onClick]);

  return (
    <Button
      {...props}
      className={cn('relative overflow-hidden', className)}
      disabled={disabled || isOnCooldown}
      onClick={handleClick}
    >
      {/* CD蒙层 - 从左到右的进度条 */}
      {isOnCooldown && (
        <div 
          className="absolute inset-0 bg-black/60 pointer-events-none z-10"
          style={{
            clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`
          }}
        />
      )}
      
      {/* 按钮内容 */}
      <span className={cn(
        "flex items-center justify-center gap-1.5 transition-opacity",
        isOnCooldown && "opacity-30"
      )}>
        {children}
      </span>
      
      {/* CD时间显示 */}
      {isOnCooldown && (
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm z-20 drop-shadow-md">
          {(remaining / 1000).toFixed(1)}s
        </span>
      )}
    </Button>
  );
}
