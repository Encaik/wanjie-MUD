'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DeathState, DEFAULT_DEATH_STATE } from '@/lib/game/typesExtension';
import { Skull, Heart, Sparkles } from 'lucide-react';

interface DeathDialogProps {
  deathState: DeathState | undefined;
  onClose: () => void;
  recoveryHp?: number;
}

/**
 * 死亡弹窗组件
 * 
 * 设计原则：
 * 1. 优雅的文言风大标题，体现修仙氛围
 * 2. 小字解释死亡原因和侥幸存活的原因
 * 3. 显示恢复后的HP
 * 4. 点击"重整旗鼓"按钮关闭弹窗继续游戏
 */
export function DeathDialog({ deathState, onClose, recoveryHp }: DeathDialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const isDead = deathState?.isDead ?? false;
  const title = deathState?.title ?? '身陨道消';
  const subtitle = deathState?.subtitle ?? '你遭遇了不测，但侥幸存活了下来...';
  const hp = recoveryHp ?? deathState?.recoveryHp ?? 1;
  
  useEffect(() => {
    if (isDead) {
      // 延迟显示，增加戏剧性
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setIsAnimating(false);
    }
  }, [isDead]);
  
  const handleClose = () => {
    setIsAnimating(false);
    // 延迟关闭，让动画完成
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  if (!isDead) {
    return null;
  }
  
  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-md border-destructive/30 bg-gradient-to-b from-card via-card to-destructive/5"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* 无障碍标题和描述 */}
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{subtitle}</DialogDescription>
        
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          {/* 血迹效果 */}
          <div 
            className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)' }}
          />
        </div>
        
        <div className="relative flex flex-col items-center text-center py-6">
          {/* 骷髅图标 */}
          <div 
            className={`mb-4 transition-all duration-500 ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="relative">
              <Skull className="w-16 h-16 text-destructive" />
              <div 
                className="absolute inset-0 animate-ping opacity-20"
                style={{ animationDuration: '2s' }}
              >
                <Skull className="w-16 h-16 text-destructive" />
              </div>
            </div>
          </div>
          
          {/* 大标题 */}
          <h2 
            className={`text-3xl font-bold text-destructive mb-4 tracking-widest transition-all duration-500 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            style={{ 
              fontFamily: 'var(--font-serif, serif)',
              textShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
              transitionDelay: '400ms',
            }}
          >
            {title}
          </h2>
          
          {/* 分隔线 */}
          <div 
            className={`w-24 h-px bg-gradient-to-r from-transparent via-destructive/50 to-transparent mb-4 transition-all duration-500 ${isAnimating ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}
            style={{ transitionDelay: '600ms' }}
          />
          
          {/* 小字（原因描述） */}
          <p 
            className={`text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs whitespace-pre-line transition-all duration-500 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '800ms' }}
          >
            {subtitle}
          </p>
          
          {/* 恢复状态 */}
          <div 
            className={`flex items-center gap-2 text-sm text-muted-foreground mb-6 transition-all duration-500 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '1000ms' }}
          >
            <Heart className="w-4 h-4 text-red-500" />
            <span>生命值恢复至</span>
            <span className="text-red-500 font-medium">{hp}</span>
          </div>
          
          {/* 按钮 */}
          <div 
            className={`transition-all duration-500 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '1200ms' }}
          >
            <Button 
              onClick={handleClose}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
            >
              <Sparkles className="w-4 h-4" />
              重整旗鼓
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 触发死亡状态的辅助函数
 */
export function triggerDeathState(
  cause: DeathState['cause'],
  maxHp: number
): DeathState {
  const { getDeathMessage } = require('@/lib/game/typesExtension');
  const { title, subtitle } = getDeathMessage(cause!);
  
  // 恢复30%HP
  const recoveryHp = Math.max(1, Math.floor(maxHp * 0.3));
  
  return {
    isDead: true,
    cause,
    title,
    subtitle,
    recoveryHp,
    timestamp: Date.now(),
  };
}
