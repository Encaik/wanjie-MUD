'use client';

import { useState } from 'react';

import { MessageCircle, Bell, Trophy, Newspaper } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RealmSystem } from '@/lib/data/realmData';
import { getRealmName } from '@/lib/data/realmData';
import { MessageRecord } from '@/lib/game/types';
import type { Announcement } from '@/types/announcement';
import type { AllLeaderboards } from '@/types/multiplayer';

import { AnnouncementHistory } from '../announcement';
import { LeaderboardPanel } from '../leaderboard';
import { ChatRoom } from '../shared/ChatRoom';
import { MessagePanel } from '../shared/MessagePanel';




interface RightSidebarProps {
  protagonistId: number;
  protagonistName: string;
  protagonistLevel: number;
  realmSystem: RealmSystem;
  messages: MessageRecord[];
  totalMessageCount?: number;
  hasMoreMessages?: boolean;
  isLoadingMessages?: boolean;
  onLoadMoreMessages?: () => Promise<boolean>;
  // 多人游戏相关
  leaderboards?: AllLeaderboards | null;
  onlineCount?: number;
  announcements?: Announcement[];
  // 活跃模式控制
  setActiveMode?: (active: boolean) => void;
}

export function RightSidebar({
  protagonistId,
  protagonistName,
  protagonistLevel,
  realmSystem,
  messages,
  totalMessageCount,
  hasMoreMessages,
  isLoadingMessages,
  onLoadMoreMessages,
  leaderboards,
  onlineCount,
  announcements = [],
  setActiveMode,
}: RightSidebarProps) {
  // 聊天群是否有新消息
  const [hasChatNewMessage, setHasChatNewMessage] = useState(false);
  // 内部 tab 状态 - 避免重新渲染时重置
  const [sidebarTab, setSidebarTab] = useState<string>('messages');
  
  // Tab 切换时控制活跃模式
  const handleTabChange = (value: string) => {
    setSidebarTab(value);
    // 排行榜 tab 激活时启用活跃模式（5秒刷新）
    setActiveMode?.(value === 'leaderboard');
  };
  
  return (
    <div className="hidden lg:flex lg:col-span-3 flex-col h-full overflow-hidden">
      <Tabs value={sidebarTab} onValueChange={handleTabChange} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-4 shrink-0">
          <TabsTrigger value="chat" className="text-xs relative">
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            聊天
            {hasChatNewMessage && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] animate-pulse">
                •
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-xs">
            <Bell className="w-3.5 h-3.5 mr-1" />
            消息
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs">
            <Trophy className="w-3.5 h-3.5 mr-1" />
            排行
          </TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs relative">
            <Newspaper className="w-3.5 h-3.5 mr-1" />
            公告
            {announcements.filter(a => !a.read).length > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                {announcements.filter(a => !a.read).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="flex-1 mt-2 overflow-hidden">
          <ChatRoom 
            playerId={`player-${protagonistId}`}
            playerName={protagonistName}
            playerLevel={protagonistLevel}
            playerRealm={getRealmName(realmSystem, protagonistLevel)}
            onNewMessage={setHasChatNewMessage}
          />
        </TabsContent>
        <TabsContent value="messages" className="flex-1 mt-2 overflow-hidden">
          <MessagePanel 
            messages={messages}
            totalMessageCount={totalMessageCount}
            hasMoreMessages={hasMoreMessages}
            isLoadingMessages={isLoadingMessages}
            onLoadMore={onLoadMoreMessages}
          />
        </TabsContent>
        <TabsContent value="leaderboard" className="flex-1 mt-2 overflow-hidden">
          <LeaderboardPanel
            leaderboards={leaderboards || null}
            currentPlayerId={`player-${protagonistId}`}
            onlineCount={onlineCount}
          />
        </TabsContent>
        <TabsContent value="announcements" className="flex-1 mt-2 overflow-hidden">
          <AnnouncementHistory
            announcements={announcements}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
