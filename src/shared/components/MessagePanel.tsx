'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

import { Bell, Loader2, ChevronUp } from 'lucide-react';

import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { ScrollArea } from '@/shared/ui/layout/scroll-area';
import { Empty, EmptyContent } from '@/shared/ui/feedback/empty';
import { MessageRecord } from '@/core/types';
import { MessageItem } from '@/shared/components/MessageItem';

interface MessagePanelProps {
  /** 系统消息（MessageRecord[]，来自 gameState） */
  messages: MessageRecord[];
  /** 紧凑模式（显示更少的消息） */
  compact?: boolean;
  /** 消息总数 */
  totalMessageCount?: number;
  /** 是否有更多远程消息 */
  hasMoreMessages?: boolean;
  /** 是否正在加载远程消息 */
  isLoadingMessages?: boolean;
  /** 加载更多远程消息的回调 */
  onLoadMore?: () => Promise<boolean>;
}

const BATCH_SIZE = 20;

export function MessagePanel({
  messages,
  compact = false,
  totalMessageCount = 0,
  hasMoreMessages = false,
  isLoadingMessages = false,
  onLoadMore,
}: MessagePanelProps) {
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // 显示的消息（虚拟分页）
  const displayMessages = useMemo(() => {
    if (compact) {
      return messages.slice(0, 5);
    }
    return messages.slice(0, displayCount);
  }, [messages, compact, displayCount]);

  // 是否还有更多本地消息可显示
  const hasMoreLocal = displayCount < messages.length;

  // 是否可以加载更多
  const canLoadMore = !compact && (hasMoreLocal || hasMoreMessages);

  // 显示总数
  const displayTotal = totalMessageCount || messages.length;

  const showFooter = !compact && messages.length > 0;

  // 加载更多消息
  const handleLoadMore = useCallback(async () => {
    if (isLoadingRef.current || !canLoadMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    try {
      // 先显示更多本地消息
      if (hasMoreLocal) {
        setDisplayCount(prev => Math.min(prev + BATCH_SIZE, messages.length + BATCH_SIZE));
      }
      // 本地消息显示完了，从服务器加载更多
      else if (hasMoreMessages && onLoadMore) {
        await onLoadMore();
        setDisplayCount(prev => prev + BATCH_SIZE);
      }
    } finally {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [canLoadMore, hasMoreLocal, hasMoreMessages, messages.length, onLoadMore]);

  // 滚动监听
  useEffect(() => {
    if (compact) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    const handleScroll = () => {
      if (isLoadingRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = viewport;

      // 距离底部 100px 时触发加载更多
      if (scrollHeight - scrollTop - clientHeight < 100) {
        handleLoadMore();
      }
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [compact, handleLoadMore]);

  // 重置显示数量
  useEffect(() => {
    setDisplayCount(BATCH_SIZE);
  }, [messages.length]);

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-1 pt-2 shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="w-4 h-4" />
          消息记录
          {displayTotal > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {displayTotal}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-1 flex-1 min-h-0 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <Empty>
            <EmptyContent>
              <p className="text-xs text-muted-foreground font-serif">暂无消息记录</p>
            </EmptyContent>
          </Empty>
        ) : (
          <div ref={scrollContainerRef} className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-1.5 pr-1">
                {displayMessages.map((msg) => (
                  <MessageItem key={msg.id} msg={msg} compact={compact} />
                ))}

                {/* 加载更多指示器 */}
                {showFooter && canLoadMore && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore || isLoadingMessages}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {(isLoadingMore || isLoadingMessages) ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          加载中...
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          加载更多消息
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* 没有更多消息提示 */}
                {showFooter && !canLoadMore && (
                  <div className="text-center py-2">
                    <span className="text-[10px] text-muted-foreground">
                      已显示全部 {displayTotal} 条消息
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
