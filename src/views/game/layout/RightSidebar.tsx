'use client';

import { useState, useCallback } from 'react';

import { MessageCircle, Trophy } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/data-display/tabs';
import { RealmSystem } from '@/modules/progression/data/realmData';
import { getRealmName } from '@/modules/progression/data/realmData';
import { MessageRecord } from '@/core/types';
import type { Announcement } from '@/modules/social/announcementTypes';
import type { ChatMessage } from '@/modules/social/chatTypes';
import type { AllLeaderboards } from '@/modules/social/multiplayerTypes';

import { LeaderboardPanel } from '@/modules/social/components';
import { ChatRoom } from '@/modules/social/components/ChatRoom';
import { MessagePanel, MessageFilter } from '@/shared/components/MessagePanel';



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
  // 聊天消息状态（由 ChatRoom 回调更新）
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  // 消息筛选状态
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
  // 聊天未读标记
  const [hasChatUnread, setHasChatUnread] = useState(false);

  // ChatRoom 新消息回调
  const handleChatNewMessage = useCallback((hasNew: boolean) => {
    if (hasNew && messageFilter !== 'chat' && messageFilter !== 'all') {
      setHasChatUnread(true);
    }
  }, [messageFilter]);

  // 筛选变更时处理未读清除
  const handleFilterChange = useCallback((filter: MessageFilter) => {
    setMessageFilter(filter);
    if (filter === 'chat' || filter === 'all') {
      setHasChatUnread(false);
    }
  }, []);

  // Tab 切换时控制活跃模式
  const handleTabChange = (value: string) => {
    setActiveMode?.(value === 'leaderboard');
  };

  return (
    <div className="hidden lg:flex lg:col-span-3 flex-col h-full overflow-hidden">
      <Tabs defaultValue="messages" onValueChange={handleTabChange} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-2 shrink-0">
          <TabsTrigger value="messages" className="text-xs">
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            消息
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs">
            <Trophy className="w-3.5 h-3.5 mr-1" />
            排行
          </TabsTrigger>
        </TabsList>
        {/* 统一消息 Tab */}
        <TabsContent value="messages" className="flex-1 mt-2 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            <MessagePanel
              messages={messages}
              totalMessageCount={totalMessageCount}
              hasMoreMessages={hasMoreMessages}
              isLoadingMessages={isLoadingMessages}
              onLoadMore={onLoadMoreMessages}
              chatMessages={chatMessages}
              announcements={announcements}
              messageFilter={messageFilter}
              onMessageFilterChange={handleFilterChange}
              hasChatUnread={hasChatUnread}
              onChatViewed={() => setHasChatUnread(false)}
            />
          </div>
          {/* 聊天输入栏（compact 模式） */}
          <div className="shrink-0 mt-1.5 pt-1.5 border-t">
            <ChatRoom
              playerId={`player-${protagonistId}`}
              playerName={protagonistName}
              playerLevel={protagonistLevel}
              playerRealm={getRealmName(realmSystem, protagonistLevel)}
              onNewMessage={handleChatNewMessage}
              onMessagesUpdate={setChatMessages}
              compact
            />
          </div>
        </TabsContent>
        {/* 排行榜 Tab */}
        <TabsContent value="leaderboard" className="flex-1 mt-2 overflow-hidden">
          <LeaderboardPanel
            leaderboards={leaderboards || null}
            currentPlayerId={`player-${protagonistId}`}
            onlineCount={onlineCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
