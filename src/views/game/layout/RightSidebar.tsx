'use client';

import { Bell } from 'lucide-react';

import { MessageRecord } from '@/core/types';
import { MessageItem } from '@/shared/components/MessageItem';
import { Badge } from '@/shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/data-display/card';
import { Empty, EmptyContent } from '@/shared/ui/feedback/empty';
import { ScrollArea } from '@/shared/ui/layout/scroll-area';

interface RightSidebarProps {
  /** 系统消息（MessageRecord[]，来自 gameState） */
  messages: MessageRecord[];
  /** 消息总数 */
  totalMessageCount?: number;
}

export function RightSidebar({
  messages,
  totalMessageCount,
}: RightSidebarProps) {
  const displayTotal = totalMessageCount || messages.length;
  // 只显示最近的消息
  const recentMessages = messages.slice(0, 50);

  return (
    <div className="hidden lg:flex lg:col-span-3 flex-col h-full overflow-hidden">
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
          {recentMessages.length === 0 ? (
            <Empty>
              <EmptyContent>
                <p className="text-xs text-muted-foreground font-serif">暂无消息记录</p>
              </EmptyContent>
            </Empty>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-1.5 pr-1">
                {recentMessages.map((msg) => (
                  <MessageItem key={msg.id} msg={msg} compact={false} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
