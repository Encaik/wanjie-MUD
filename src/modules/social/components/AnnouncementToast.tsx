/**
 * 公告 Toast 组件
 */

'use client';

import { useEffect, useState } from 'react';

import { X } from 'lucide-react';

import { Card } from '@/shared/ui/card';
import { ANNOUNCEMENT_TYPE_CONFIG, ANNOUNCEMENT_PRIORITY_CONFIG } from '@/modules/social/logic/announcement/config';
import { cn } from '@/shared/utils';
import type { Announcement } from '@/modules/social/announcementTypes';

/** Props */
interface AnnouncementToastProps {
  /** 公告数据 */
  announcement: Announcement;
  /** 关闭回调 */
  onClose?: () => void;
  /** 类名 */
  className?: string;
}

/**
 * 单条公告 Toast
 */
export function AnnouncementToast({
  announcement,
  onClose,
  className,
}: AnnouncementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const typeConfig = ANNOUNCEMENT_TYPE_CONFIG[announcement.type];
  const priorityConfig = ANNOUNCEMENT_PRIORITY_CONFIG[announcement.priority];

  // 进入动画
  useEffect(() => {
    const enterTimer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(enterTimer);
  }, []);

  // 自动关闭
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, priorityConfig.duration);

    return () => clearTimeout(timer);
  }, [priorityConfig.duration]);

  // 关闭处理
  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  // 动画类名
  const animationClass = cn(
    'transition-all duration-300 ease-out',
    isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
  );

  // 特殊动画
  const specialAnimation = cn(
    priorityConfig.animation === 'pulse' && 'animate-pulse',
    priorityConfig.animation === 'glow' && 'animate-[glow_2s_ease-in-out_infinite]'
  );

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-l-4 backdrop-blur-sm shadow-lg',
        typeConfig.bgClass,
        'border-l-[var(--announcement-color)]',
        animationClass,
        specialAnimation,
        className
      )}
      style={{
        '--announcement-color': typeConfig.color,
      } as React.CSSProperties}
    >
      {/* 关闭按钮 */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </button>

      {/* 内容 */}
      <div className="p-4 pr-8">
        {/* 标题行 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{announcement.icon}</span>
          <span className={cn('font-semibold', typeConfig.textClass)}>
            {announcement.title}
          </span>
        </div>

        {/* 内容 */}
        <p className="text-sm text-foreground/90 leading-relaxed">
          {announcement.content}
        </p>

        {/* 时间 */}
        <div className="text-xs text-muted-foreground mt-2">
          {new Date(announcement.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* 进度条 */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-primary/30 transition-all"
        style={{
          animation: `shrink ${priorityConfig.duration}ms linear forwards`,
        }}
      />
    </Card>
  );
}

// 添加全局样式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 10px var(--announcement-color); }
      50% { box-shadow: 0 0 25px var(--announcement-color); }
    }
  `;
  document.head.appendChild(style);
}

export default AnnouncementToast;
