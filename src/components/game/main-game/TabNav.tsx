'use client';

import { Swords, Sparkles, Building2, ShoppingBag, Zap, Shield, Trophy, BookOpen, BarChart3, FlaskConical, Anvil } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFactionById } from '@/lib/data/factionData';
import { checkRankPromotion } from '@/lib/game/utils/expansionLogic';
import { ActionTab } from '@/lib/game/types';
import { Protagonist } from '@/lib/game/types';

interface TabNavProps {
  currentTab: ActionTab;
  onTabChange: (tab: ActionTab) => void;
  protagonist: Protagonist;
  children?: React.ReactNode;
}

export function TabNav({ currentTab, onTabChange, protagonist, children }: TabNavProps) {
  // 检查是否可以晋升
  const canPromoteRank = (() => {
    if (protagonist.factionProgress && protagonist.factionId) {
      const faction = getFactionById(protagonist.factionId);
      if (faction) {
        const promotionResult = checkRankPromotion(protagonist.factionProgress, faction.type);
        return promotionResult.canPromote;
      }
    }
    return false;
  })();

  return (
    <Tabs value={currentTab} onValueChange={(v) => onTabChange(v as ActionTab)} className="w-full">
      {/* 双行Tab布局 */}
      <div className="flex flex-col gap-1">
        {/* 第一行：修炼系统 */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground shrink-0 px-1">修炼</span>
          <TabsList className="grid grid-cols-5 h-8 flex-1">
            <TabsTrigger value="cultivation" className="flex items-center gap-1 text-xs px-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>修炼</span>
            </TabsTrigger>
            <TabsTrigger value="technique" className="flex items-center gap-1 text-xs px-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>功法</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-1 text-xs px-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>装备</span>
            </TabsTrigger>
            <TabsTrigger value="alchemy" className="flex items-center gap-1 text-xs px-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>炼丹</span>
            </TabsTrigger>
            <TabsTrigger value="forge" className="flex items-center gap-1 text-xs px-1.5">
              <Anvil className="w-3.5 h-3.5" />
              <span>炼器</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* 第二行：探索系统 */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground shrink-0 px-1">探索</span>
          <TabsList className="grid grid-cols-6 h-8 flex-1">
            <TabsTrigger value="adventure" className="flex items-center gap-1 text-xs px-1">
              <Swords className="w-3.5 h-3.5" />
              <span>机缘</span>
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-1 text-xs px-1 relative">
              <Building2 className="w-3.5 h-3.5" />
              <span>势力</span>
              {canPromoteRank && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex items-center gap-1 text-xs px-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>商店</span>
            </TabsTrigger>
            <TabsTrigger value="achievement" className="flex items-center gap-1 text-xs px-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>成就</span>
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center gap-1 text-xs px-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>图鉴</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-1 text-xs px-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>统计</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {children}
    </Tabs>
  );
}

// 导出子组件供外部使用
export { TabsContent };
export { TabsList };
export { TabsTrigger };
