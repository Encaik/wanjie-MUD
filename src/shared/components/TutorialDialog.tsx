/**
 * TutorialDialog — 引导弹窗复用组件
 *
 * 用于新手引导流程中的玩法说明弹窗。
 * 支持三种视觉风格：welcome（欢迎页）、system-intro（系统介绍）、default（默认）。
 *
 * @module shared/components
 */

'use client';

import { Sparkles, BookOpen, Lightbulb } from 'lucide-react';

import { CardCornerDecorations } from '@/shared/components';
import { Button } from '@/shared/ui/actions/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/overlay/dialog';

// ============================================
// Props
// ============================================

interface TutorialDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 弹窗标题 */
  title: string;
  /** 弹窗正文（支持 \n 换行） */
  content: string;
  /** 弹窗风格 */
  variant?: 'welcome' | 'system-intro' | 'default';
  /** 确认按钮文字 */
  confirmText?: string;
  /** 确认回调（关闭前触发） */
  onConfirm?: () => void;
}

// ============================================
// 配置映射
// ============================================

const VARIANT_CONFIG = {
  welcome: {
    icon: Sparkles,
    iconClass: 'text-amber-400',
    containerClass: 'bg-gradient-to-b from-game-cultivation/10 via-background to-background',
    titleClass: 'text-lg font-bold text-game-cultivation',
    size: 'sm:max-w-lg' as const,
  },
  'system-intro': {
    icon: BookOpen,
    iconClass: 'text-game-mental',
    containerClass: 'bg-gradient-to-b from-game-mental/10 via-background to-background',
    titleClass: 'text-base font-bold text-game-mental',
    size: 'sm:max-w-md' as const,
  },
  default: {
    icon: Lightbulb,
    iconClass: 'text-muted-foreground',
    containerClass: '',
    titleClass: 'text-base font-semibold',
    size: 'sm:max-w-md' as const,
  },
} as const;

// ============================================
// 组件
// ============================================

export function TutorialDialog({
  open,
  onOpenChange,
  title,
  content,
  variant = 'default',
  confirmText = '知道了',
  onConfirm,
}: TutorialDialogProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  // 将 content 按 \n 分段渲染
  const paragraphs = content.split('\n');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${config.size} relative overflow-hidden`}>
        <CardCornerDecorations />

        <DialogHeader className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-5 h-5 ${config.iconClass}`} />
            <DialogTitle className={config.titleClass}>{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className={`relative z-10 px-1 ${config.containerClass}`}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            {paragraphs.map((para, i) => {
              // 处理粗体标记 **text**
              const formatted = para.replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="text-foreground font-semibold">$1</strong>',
              );

              if (para.trim() === '') {
                return <div key={i} className="h-1" />;
              }

              return (
                <p
                  key={i}
                  dangerouslySetInnerHTML={{ __html: formatted }}
                />
              );
            })}
          </div>
        </div>

        <DialogFooter className="relative z-10">
          <Button
            onClick={handleConfirm}
            variant={variant === 'welcome' ? 'default' : 'outline'}
            className={variant === 'welcome' ? 'bg-game-cultivation hover:bg-game-cultivation/80' : ''}
          >
            {confirmText}
          </Button>
        </DialogFooter>

        {/* 渐变背景装饰（welcome 风格） */}
        {variant === 'welcome' && (
          <div className="absolute inset-0 bg-gradient-to-br from-game-cultivation/5 via-transparent to-game-mental/5 pointer-events-none" />
        )}
      </DialogContent>
    </Dialog>
  );
}
