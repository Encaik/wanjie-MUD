'use client';

import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';

import { Bell, CheckCircle, XCircle, Info, AlertTriangle, Loader2, ChevronUp } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { MessageRecord, ItemRarity } from '@/core/types';
import type { FragmentDropData } from '@/modules/crafting/logic/fragmentSystem';


interface MessagePanelProps {
  messages: MessageRecord[];
  compact?: boolean;
  totalMessageCount?: number;
  hasMoreMessages?: boolean;
  isLoadingMessages?: boolean;
  onLoadMore?: () => Promise<boolean>;
}

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
  failure: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
};

// 物品品质颜色
const rarityColors: Record<ItemRarity, string> = {
  '普通': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  '稀有': 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  '史诗': 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
  '传说': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400',
  '神话': 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 单条消息组件
const MessageItem = memo(({ msg, compact }: { msg: MessageRecord; compact: boolean }) => {
  const config = typeConfig[msg.type];
  const Icon = config.icon;

  return (
    <div
      className={`p-1.5 rounded ${config.bg} [content-visibility:auto]`}
    >
      <div className="flex items-start gap-1.5">
        <Icon className={`w-3 h-3 ${config.color} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-medium">{msg.title}</span>
            <span className="text-[9px] text-muted-foreground shrink-0">
              {formatTime(msg.timestamp)}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-pre-wrap">
            {msg.content}
          </div>
          {msg.rewards && !compact && (
            <div className="mt-1.5 space-y-1">
              {/* 属性变化 */}
              {(() => {
                // 计算实际有变化的属性
                let statBadges: React.ReactNode[] = [];
                if (msg.rewards.statDetails) {
                  statBadges = msg.rewards.statDetails
                    .filter(({ base, boost }) => base !== 0 || boost !== 0)
                    .map(({ stat, base, boost }) => {
                      // 根据实际值动态显示
                      let displayValue = '';
                      if (base > 0 && boost > 0) {
                        displayValue = `${base}+${boost}`;
                      } else if (base > 0) {
                        displayValue = `+${base}`;
                      } else if (boost > 0) {
                        displayValue = `+${boost}`;
                      }
                      return (
                        <Badge key={stat} variant="outline" className="text-[9px] h-4">
                          {stat} {displayValue}
                        </Badge>
                      );
                    });
                } else if (msg.rewards.stats) {
                  statBadges = Object.entries(msg.rewards.stats)
                    .filter(([, value]) => Number(value) !== 0)
                    .map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-[9px] h-4">
                        {key}{Number(value) > 0 ? '+' : ''}{value}
                      </Badge>
                    ));
                }
                // 只有有实际属性变化时才显示
                return statBadges.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] text-muted-foreground">属性:</span>
                    {statBadges}
                  </div>
                ) : null;
              })()}
              {/* 获得物品 */}
              {msg.rewards.items && msg.rewards.items.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-muted-foreground">物品:</span>
                  {msg.rewards.items.map((item, idx) => {
                    const itemName = item.definition?.name || '未知物品';
                    const displayText = item.quantity > 1 ? `${itemName} x${item.quantity}` : itemName;
                    return (
                      <Badge 
                        key={idx} 
                        className={`text-[9px] h-4 ${item.definition?.rarity ? rarityColors[item.definition.rarity] || '' : ''}`}
                      >
                        {displayText}
                      </Badge>
                    );
                  })}
                </div>
              )}
              {/* 获得功法 */}
              {msg.rewards.technique && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-muted-foreground">功法:</span>
                  <Badge className={`text-[9px] h-4 ${rarityColors[msg.rewards.technique.rarity] || 'bg-gray-100 text-gray-600'}`}>
                    「{msg.rewards.technique.name}」
                  </Badge>
                </div>
              )}
              {/* 获得装备 */}
              {msg.rewards.equipment && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-muted-foreground">装备:</span>
                  <Badge className={`text-[9px] h-4 ${rarityColors[msg.rewards.equipment.rarity] || 'bg-gray-100 text-gray-600'}`}>
                    「{msg.rewards.equipment.name}」
                  </Badge>
                </div>
              )}
              {/* 获得碎片 */}
              {msg.rewards.fragments && msg.rewards.fragments.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-muted-foreground">碎片:</span>
                  {(() => {
                    // 合并同类型碎片
                    const fragmentMap = new Map<string, { 
                      name: string; 
                      rarity: ItemRarity; 
                      count: number;
                      type: 'technique' | 'equipment';
                    }>();
                    
                    for (const fragment of msg.rewards.fragments as FragmentDropData[]) {
                      const key = fragment.sourceName || `${fragment.rarity}-${fragment.type}`;
                      const existing = fragmentMap.get(key);
                      if (existing) {
                        existing.count += fragment.count;
                      } else {
                        fragmentMap.set(key, {
                          name: fragment.sourceName || `${fragment.rarity}${fragment.type === 'technique' ? '功法' : '装备'}残片`,
                          rarity: fragment.rarity,
                          count: fragment.count,
                          type: fragment.type,
                        });
                      }
                    }
                    
                    return Array.from(fragmentMap.values()).map((frag, idx) => (
                      <Badge 
                        key={idx} 
                        className={`text-[9px] h-4 ${rarityColors[frag.rarity] || ''}`}
                      >
                        「{frag.name}」{frag.count > 1 ? `x${frag.count}` : ''}
                      </Badge>
                    ));
                  })()}
                </div>
              )}
              {/* 获得经验 */}
              {msg.rewards.experience && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-muted-foreground">经验:</span>
                  <Badge variant="outline" className="text-[9px] h-4">
                    +{msg.rewards.experience}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

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
          <div className="text-xs text-muted-foreground text-center py-4">
            暂无消息记录
          </div>
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
