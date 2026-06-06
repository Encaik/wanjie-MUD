/**
 * 公告容器组件
 * 
 * 管理公告队列和显示
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/types/announcement';
import { AnnouncementToast } from './AnnouncementToast';

/** Props */
interface AnnouncementContainerProps {
  /** 新公告 */
  announcement?: Announcement | null;
  /** 最大显示数量 */
  maxVisible?: number;
  /** 队列最大长度 */
  maxQueue?: number;
  /** 位置 */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** 类名 */
  className?: string;
}

/**
 * 公告容器
 */
export function AnnouncementContainer({
  announcement,
  maxVisible = 3,
  maxQueue = 10,
  position = 'top-right',
  className,
}: AnnouncementContainerProps) {
  const [visibleAnnouncements, setVisibleAnnouncements] = useState<Announcement[]>([]);
  const queueRef = useRef<Announcement[]>([]);
  const processingRef = useRef(false);

  // 处理队列
  const processQueue = useCallback(() => {
    if (processingRef.current) return;
    if (queueRef.current.length === 0) return;
    if (visibleAnnouncements.length >= maxVisible) return;

    processingRef.current = true;

    // 从队列取出下一个公告
    const next = queueRef.current.shift();
    if (next) {
      setVisibleAnnouncements(prev => [...prev, next]);
    }

    processingRef.current = false;
  }, [maxVisible, visibleAnnouncements.length]);

  // 添加新公告到队列
  useEffect(() => {
    if (!announcement) return;

    // 检查队列是否已满
    if (queueRef.current.length >= maxQueue) {
      queueRef.current.shift(); // 移除最旧的
    }

    queueRef.current.push(announcement);
    processQueue();
  }, [announcement, maxQueue, processQueue]);

  // 处理队列
  useEffect(() => {
    const interval = setInterval(processQueue, 500);
    return () => clearInterval(interval);
  }, [processQueue]);

  // 移除公告
  const handleRemove = useCallback((id: string) => {
    setVisibleAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  // 位置样式
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  // 排序方向
  const directionClass = position.startsWith('top') ? 'flex-col' : 'flex-col-reverse';

  return (
    <div
      className={cn(
        'fixed z-50 flex gap-2 pointer-events-none',
        positionClasses[position],
        directionClass,
        className
      )}
      style={{ maxWidth: '400px' }}
    >
      {visibleAnnouncements.map((a) => (
        <div key={a.id} className="pointer-events-auto">
          <AnnouncementToast
            announcement={a}
            onClose={() => handleRemove(a.id)}
          />
        </div>
      ))}
    </div>
  );
}

export default AnnouncementContainer;
