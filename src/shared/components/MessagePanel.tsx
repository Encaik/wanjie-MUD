'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

import { Bell, Loader2, ChevronUp, MessageCircle, Newspaper } from 'lucide-react';

import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { ScrollArea } from '@/shared/ui/layout/scroll-area';
import { Empty, EmptyContent } from '@/shared/ui/feedback/empty';
import { MessageRecord } from '@/core/types';
import type { ChatMessage } from '@/modules/social/chatTypes';
import type { Announcement } from '@/modules/social/announcementTypes';
import { chatToMessageRecord, announcementToMessageRecord } from '@/shared/utils/messageAdapters';
import { MessageItem } from '@/shared/components/MessageItem';

/** 消息筛选类型 */
export type MessageFilter = 'all' | 'system' | 'chat' | 'announcement';

/** 筛选选项配置 */
const FILTER_OPTIONS: { key: MessageFilter; label: string; icon?: React.ReactNode }[] = [
  { key: 'all', label: '全部' },
  { key: 'system', label: '系统' },
  { key: 'chat', label: '聊天', icon: <MessageCircle className="w-3 h-3" /> },
  { key: 'announcement', label: '公告', icon: <Newspaper className="w-3 h-3" /> },
];

/** 系统消息 channels（来自 core/message-log 预设通道 + 未设置 channel 的消息） */
const SYSTEM_CHANNELS = new Set(['system', 'combat', 'cultivation', 'exploration', 'economy', undefined]);


interface MessagePanelProps {
  /** 系统消息（MessageRecord[]，来自 gameState） */
  messages: MessageRecord[];
  compact?: boolean;
  totalMessageCount?: number;
  hasMoreMessages?: boolean;
  isLoadingMessages?: boolean;
  onLoadMore?: () => Promise<boolean>;
  /** 聊天消息（WebSocket 实时消息） */
  chatMessages?: ChatMessage[];
  /** 服务器公告 */
  announcements?: Announcement[];
  /** 消息类型筛选（受控模式） */
  messageFilter?: MessageFilter;
  /** 筛选变更回调 */
  onMessageFilterChange?: (filter: MessageFilter) => void;
  /** 是否有未读聊天消息 */
  hasChatUnread?: boolean;
  /** 用户查看聊天后清除未读 */
  onChatViewed?: () => void;
}

const BATCH_SIZE = 20;

export function MessagePanel({
  messages,
  compact = false,
  totalMessageCount = 0,
  hasMoreMessages = false,
  isLoadingMessages = false,
  onLoadMore,
  chatMessages = [],
  announcements = [],
  messageFilter: controlledFilter,
  onMessageFilterChange,
  hasChatUnread = false,
  onChatViewed,
}: MessagePanelProps) {
  // 内部筛选状态（非受控模式）
  const [internalFilter, setInternalFilter] = useState<MessageFilter>('all');
  const messageFilter = controlledFilter ?? internalFilter;

  const handleFilterChange = useCallback((filter: MessageFilter) => {
    if (onMessageFilterChange) {
      onMessageFilterChange(filter);
    } else {
      setInternalFilter(filter);
    }
    // 切换到聊天或全部时清除未读
    if ((filter === 'chat' || filter === 'all') && hasChatUnread && onChatViewed) {
      onChatViewed();
    }
  }, [onMessageFilterChange, hasChatUnread, onChatViewed]);

  // 将聊天和公告适配为 MessageRecord 并合并
  const allMessages = useMemo(() => {
    const adaptedChat = chatMessages.map(chatToMessageRecord);
    const adaptedAnnouncements = announcements.map(announcementToMessageRecord);
    return [...messages, ...adaptedChat, ...adaptedAnnouncements]
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [messages, chatMessages, announcements]);

  // 根据筛选过滤
  const filteredMessages = useMemo(() => {
    if (messageFilter === 'all') return allMessages;
    if (messageFilter === 'system') return allMessages.filter(m => SYSTEM_CHANNELS.has(m.channel));
    return allMessages.filter(m => m.channel === messageFilter);
  }, [allMessages, messageFilter]);

  // 是否有多类消息（决定是否显示筛选器）
  const hasMultipleSources = (chatMessages.length > 0 || announcements.length > 0);
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  
  // 显示的消息（虚拟分页，基于过滤后的消息）
  const displayMessages = useMemo(() => {
    if (compact) {
      return filteredMessages.slice(0, 5);
    }
    return filteredMessages.slice(0, displayCount);
  }, [filteredMessages, compact, displayCount]);

  // 是否还有更多本地消息可显示
  const hasMoreLocal = displayCount < filteredMessages.length;

  // 是否可以加载更多
  const canLoadMore = !compact && (hasMoreLocal || hasMoreMessages);

  // 显示总数
  const displayTotal = totalMessageCount || messages.length;

  const showFooter = !compact && filteredMessages.length > 0;

  // 加载更多消息
  const handleLoadMore = useCallback(async () => {
    if (isLoadingRef.current || !canLoadMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    try {
      // 先显示更多本地消息
      if (hasMoreLocal) {
        setDisplayCount(prev => Math.min(prev + BATCH_SIZE, filteredMessages.length + BATCH_SIZE));
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
  }, [canLoadMore, hasMoreLocal, hasMoreMessages, filteredMessages.length, onLoadMore]);

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
  }, [filteredMessages.length]);

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
      {/* 消息类型筛选器（仅有多类消息时显示） */}
      {hasMultipleSources && (
        <div className="px-3 pb-1 shrink-0">
          <div className="flex gap-1 bg-muted/50 rounded-md p-0.5">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-sm text-[10px] font-medium transition-colors relative ${
                  messageFilter === opt.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => handleFilterChange(opt.key)}
              >
                {opt.icon}
                {opt.label}
                {opt.key === 'chat' && hasChatUnread && messageFilter !== 'chat' && messageFilter !== 'all' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      <CardContent className="pt-0 pb-1 flex-1 min-h-0 overflow-hidden flex flex-col">
        {filteredMessages.length === 0 ? (
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
