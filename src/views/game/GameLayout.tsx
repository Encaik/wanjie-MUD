/**
 * 游戏布局组件
 * 
 * 负责游戏页面的三栏布局：
 * - 左侧：状态信息栏
 * - 中间：功能Tab区域
 * - 右侧：消息面板
 */

'use client';

import { ReactNode } from 'react';

import { ScrollArea } from '@/shared/ui/layout/scroll-area';

interface GameLayoutProps {
  /** 左侧边栏内容（状态信息） */
  leftSidebar: ReactNode;
  /** 中间主内容区域（Tab功能） */
  mainContent: ReactNode;
  /** 右侧边栏内容（消息面板） */
  rightSidebar?: ReactNode;
  /** 顶部标题栏 */
  header?: ReactNode;
}

export function GameLayout({
  leftSidebar,
  mainContent,
  rightSidebar,
  header,
}: GameLayoutProps) {
  return (
    <div className="min-h-dvh md:h-dvh flex flex-col bg-background">
      {/* 顶部标题栏 */}
      {header && (
        <header className="shrink-0 z-10 bg-gradient-to-r from-card via-muted/80 to-card border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4">
            {header}
          </div>
        </header>
      )}

      {/* 移动端布局：内容依次平铺，整体可滚动 */}
      <main className="flex-1 md:hidden overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full p-3 space-y-3">
          {/* 个人信息面板 */}
          {leftSidebar}
          
          {/* 主内容区域 */}
          {mainContent}
        </div>
      </main>

      {/* 桌面端布局：三栏布局 */}
      <main className="hidden md:block flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full p-3">
          <div className="grid grid-cols-12 gap-3 h-full">
            {/* 左侧：状态面板 */}
            <div className="col-span-3 h-full overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-1">
                  {leftSidebar}
                </div>
              </ScrollArea>
            </div>

            {/* 中间：操作面板 */}
            <div className="col-span-6 h-full overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-1">
                  {mainContent}
                </div>
              </ScrollArea>
            </div>

            {/* 右侧：消息面板 */}
            <div className="col-span-3 h-full overflow-hidden">
              {rightSidebar}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
