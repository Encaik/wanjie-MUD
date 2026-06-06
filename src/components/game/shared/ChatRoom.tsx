'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChatMessage, OnlinePlayer } from '@/types/chat';
import { MessageCircle, Send, Users, Crown, Sparkles, Bell, ChevronDown, AlertTriangle } from 'lucide-react';

interface ChatRoomProps {
  playerId: string;
  playerName: string;
  playerLevel: number;
  playerRealm: string;
  /** 新消息回调，用于通知父组件有新消息 */
  onNewMessage?: (hasNew: boolean) => void;
}

// 表情快捷输入
const QUICK_INPUTS = [
  { emoji: '👋', text: '道友好' },
  { emoji: '🙏', text: '多谢指教' },
  { emoji: '💪', text: '共同进步' },
  { emoji: '🌟', text: '修为大涨' },
  { emoji: '⚔️', text: '切磋一下' },
  { emoji: '🛡️', text: '稳扎稳打' },
  { emoji: '💊', text: '丹药求购' },
  { emoji: '📚', text: '功法交流' },
  { emoji: '🎁', text: '福利分享' },
  { emoji: '🔥', text: '燃起来了' },
];

// 境界颜色
const getRealmColor = (level: number): string => {
  if (level >= 50) return 'text-purple-500';
  if (level >= 40) return 'text-red-500';
  if (level >= 30) return 'text-orange-500';
  if (level >= 20) return 'text-blue-500';
  if (level >= 10) return 'text-green-500';
  return 'text-gray-500';
};

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function ChatRoom({ playerId, playerName, playerLevel, playerRealm, onNewMessage }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [showOnlineList, setShowOnlineList] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [spamWarning, setSpamWarning] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTimestampRef = useRef<number>(0);
  const messageIdsRef = useRef<Set<string>>(new Set());

  // 获取新消息（增量更新）
  const fetchNewMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        playerId,
        playerName,
        playerLevel: String(playerLevel),
        playerRealm,
      });
      
      // 只获取上次之后的新消息
      if (lastTimestampRef.current > 0) {
        params.set('after', String(lastTimestampRef.current));
      }
      
      const response = await fetch(`/api/chat?${params}`);
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        // 更新最新时间戳
        const newTimestamp = Math.max(...data.messages.map((m: ChatMessage) => m.timestamp));
        lastTimestampRef.current = Math.max(lastTimestampRef.current, newTimestamp);
        
        // 过滤掉已存在的消息
        const newMessages = data.messages.filter((m: ChatMessage) => !messageIdsRef.current.has(m.id));
        
        if (newMessages.length > 0) {
          // 添加新消息ID到集合
          newMessages.forEach((m: ChatMessage) => messageIdsRef.current.add(m.id));
          
          // 追加新消息
          setMessages(prev => {
            const combined = [...prev, ...newMessages];
            // 保留最近200条
            return combined.slice(-200);
          });
          
          // 如果不在底部，显示新消息提示
          if (!isAtBottom) {
            setHasNewMessage(true);
          }
        }
      }
      
      setOnlinePlayers(data.onlinePlayers || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [playerId, playerName, playerLevel, playerRealm, isAtBottom]);

  // 初始化加载
  useEffect(() => {
    // 初始获取消息
    fetchNewMessages();
    // 每3秒轮询新消息
    const interval = setInterval(fetchNewMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchNewMessages]);

  // 通知父组件有新消息
  useEffect(() => {
    onNewMessage?.(hasNewMessage);
  }, [hasNewMessage, onNewMessage]);

  // 发送消息
  const sendMessage = async () => {
    const content = inputValue.trim();
    if (!content || isLoading) return;
    
    // 清空警告
    setSpamWarning(false);
    
    // 先清空输入框，保持焦点
    setInputValue('');
    inputRef.current?.focus();
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: playerId,
          senderName: playerName,
          senderLevel: playerLevel,
          senderRealm: playerRealm,
          content
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.message) {
        // 乐观更新：直接添加到本地消息列表
        const newMsg = data.message;
        messageIdsRef.current.add(newMsg.id);
        lastTimestampRef.current = Math.max(lastTimestampRef.current, newMsg.timestamp);
        
        setMessages(prev => {
          const combined = [...prev, newMsg];
          return combined.slice(-200);
        });
      } else if (data.spamWarning) {
        // 显示刷屏警告
        setSpamWarning(true);
        setTimeout(() => setSpamWarning(false), 3000);
        // 恢复输入内容
        setInputValue(content);
      } else {
        // 其他错误，恢复输入内容
        setInputValue(content);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setInputValue(content);
    } finally {
      setIsLoading(false);
      // 确保输入框保持焦点
      inputRef.current?.focus();
    }
  };

  // 快捷输入
  const insertQuickInput = (item: typeof QUICK_INPUTS[0]) => {
    setInputValue(prev => prev + item.emoji + ' ');
    inputRef.current?.focus();
  };

  // 处理回车发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
    setHasNewMessage(false);
    setIsAtBottom(true);
  }, []);

  // 监听滚动
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    
    const viewport = container.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(isBottom);
      if (isBottom) {
        setHasNewMessage(false);
      }
    };
    
    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, []);

  // 新消息自动滚动到底部（如果用户已在底部）
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      setTimeout(scrollToBottom, 50);
    }
  }, [messages.length, isAtBottom, scrollToBottom]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-1 pt-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageCircle className="w-4 h-4 text-primary" />
            万界聊天群
            {hasNewMessage && !isAtBottom && (
              <Badge variant="destructive" className="text-[9px] h-4 px-1 animate-pulse">
                新消息
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-6 px-2 ${showOnlineList ? 'bg-primary/10' : ''}`}
                  onClick={() => setShowOnlineList(!showOnlineList)}
                >
                  <Users className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">{onlinePlayers.length}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>在线道友</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-2 overflow-hidden pt-0 pb-2">
        {/* 在线玩家列表 */}
        {showOnlineList && (
          <div className="shrink-0 p-2 rounded-lg bg-muted/50 border border-border max-h-16 overflow-hidden">
            <div className="flex flex-wrap gap-1">
              {onlinePlayers.slice(0, 10).map((player) => (
                <Badge 
                  key={player.id} 
                  variant="outline" 
                  className={`text-[10px] h-5 cursor-default ${getRealmColor(player.level)}`}
                >
                  <span className="font-medium">{player.name}</span>
                  <span className="ml-1 opacity-70">Lv.{player.level}</span>
                </Badge>
              ))}
              {onlinePlayers.length > 10 && (
                <Badge variant="outline" className="text-[10px] h-5">
                  +{onlinePlayers.length - 10}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* 消息列表 */}
        <div className="flex-1 relative overflow-hidden">
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="space-y-1 pr-1">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`p-1.5 rounded text-[11px] ${
                    msg.type === 'system' 
                      ? 'bg-blue-500/10 border-l-2 border-blue-500' 
                      : msg.type === 'announcement'
                      ? 'bg-yellow-500/10 border-l-2 border-yellow-500'
                      : msg.senderId === playerId
                      ? 'bg-primary/5'
                      : 'bg-muted/30'
                  }`}
                >
                  {msg.type === 'system' && (
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="text-blue-600 dark:text-blue-400">{msg.content}</span>
                    </div>
                  )}
                  
                  {msg.type === 'announcement' && (
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3 h-3 text-yellow-500 shrink-0" />
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">{msg.content}</span>
                    </div>
                  )}
                  
                  {msg.type === 'player' && (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-medium ${getRealmColor(msg.senderLevel)}`}>
                          Lv.{msg.senderLevel}
                        </span>
                        <span className="font-medium text-primary">{msg.senderName}</span>
                        {msg.senderRealm && (
                          <span className="text-muted-foreground text-[9px]">({msg.senderRealm})</span>
                        )}
                        <span className="text-muted-foreground text-[9px] ml-auto">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-foreground pl-1 whitespace-pre-wrap break-all">
                        {msg.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-4">
                  <Sparkles className="w-5 h-5 mx-auto mb-1 opacity-50" />
                  <p>暂无消息</p>
                  <p className="text-[10px]">发送第一条消息开始聊天</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* 新消息提示 */}
          {hasNewMessage && !isAtBottom && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 left-1/2 -translate-x-1/2 h-6 text-[10px] shadow-md"
              onClick={scrollToBottom}
            >
              <ChevronDown className="w-3 h-3 mr-1" />
              新消息
            </Button>
          )}
        </div>
        
        {/* 刷屏警告 */}
        {spamWarning && (
          <div className="flex items-center gap-1.5 p-1.5 bg-destructive/10 rounded text-destructive text-[10px]">
            <AlertTriangle className="w-3 h-3" />
            <span>发言过于频繁，请稍后再试</span>
          </div>
        )}
        
        {/* 快捷输入栏 */}
        <div className="shrink-0 flex gap-0.5 overflow-x-auto pb-0.5">
          {QUICK_INPUTS.map((item, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-xs shrink-0"
                  onClick={() => insertQuickInput(item)}
                >
                  {item.emoji}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.text}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        
        {/* 输入区域 */}
        <div className="shrink-0 flex gap-1.5">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter发送)"
            className="flex-1 h-8 text-xs"
            maxLength={200}
            disabled={isLoading}
          />
          <Button
            size="sm"
            className="h-8 px-3"
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        {/* 输入提示 */}
        <div className="text-[9px] text-muted-foreground text-center">
          按 Enter 发送 · 最多200字 · 30秒内限20条
        </div>
      </CardContent>
    </Card>
  );
}
