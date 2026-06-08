/**
 * 公告历史组件
 */

'use client';

import { Bell, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ANNOUNCEMENT_TYPE_CONFIG } from '@/lib/game/announcement/config';
import { cn } from '@/utils';
import type { Announcement } from '@/types/announcement';

/** Props */
interface AnnouncementHistoryProps {
  /** 公告历史 */
  announcements: Announcement[];
  /** 最大显示数量 */
  maxItems?: number;
  /** 类名 */
  className?: string;
  /** 点击公告回调 */
  onClick?: (announcement: Announcement) => void;
}

/**
 * 公告历史面板
 */
export function AnnouncementHistory({
  announcements,
  maxItems = 20,
  className,
  onClick,
}: AnnouncementHistoryProps) {
  // 只显示最近的公告
  const displayAnnouncements = announcements.slice(0, maxItems);

  return (
    <Card className={cn('w-full flex flex-col h-full', className)}>
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          公告历史
          {announcements.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {announcements.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {displayAnnouncements.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              暂无公告
            </div>
          ) : (
            <div className="space-y-2 p-4 pt-0">
              {displayAnnouncements.map((announcement) => {
                const typeConfig = ANNOUNCEMENT_TYPE_CONFIG[announcement.type];
                
                return (
                  <div
                    key={announcement.id}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-colors',
                      'hover:bg-muted/50',
                      typeConfig.bgClass
                    )}
                    onClick={() => onClick?.(announcement)}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0">
                        {announcement.icon}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('font-medium text-sm', typeConfig.textClass)}>
                            {announcement.title}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {announcement.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {announcement.content}
                        </p>
                        
                        <div className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(announcement.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default AnnouncementHistory;
