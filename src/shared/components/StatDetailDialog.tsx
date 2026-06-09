'use client';

import { useState, useMemo, useCallback } from 'react';

import {
  Heart,
  Zap,
  Shield,
  Activity,
  User,
  Swords,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Info,
  BookOpen,
  Coins,
  Leaf,
  X,
} from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
  getStatDetailService,
  StatDetailBreakdown,
  StatBonusSource,
  AllStatBreakdowns,
} from '@/shared/lib/calculation/services/statDetailService';
import { Protagonist } from '@/shared/lib/types';

// ============================================
// 类型定义
// ============================================

interface StatDetailDialogProps {
  protagonist: Protagonist;
  trigger?: React.ReactNode;
}

// 属性图标配置
const STAT_ICONS: Record<string, React.ElementType> = {
  '体质': Heart,
  '灵根': Zap,
  '意志': Shield,
  '悟性': Activity,
  '幸运': User,
  '攻击力': Swords,
  '防御力': ShieldCheck,
  '生命上限': Heart,
  '法力上限': Zap,
  '暴击几率': Sparkles,
  '暴击伤害': Swords,
  '闪避几率': Activity,
  '修炼效率': BookOpen,
  '突破几率': TrendingUp,
  '功法领悟': BookOpen,
  '经验获取': Coins,
  '灵石获取': Coins,
  '掉落几率': Coins,
  '稀有加成': Sparkles,
  '运势': User,
};

// 分类图标配置
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  innate: User,
  cultivation: BookOpen,
  equipment: Shield,
  technique: BookOpen,
  faction: Leaf,
  buff: Sparkles,
  world: Activity,
  other: Info,
};

// 分类颜色配置
const CATEGORY_COLORS: Record<string, string> = {
  innate: 'text-gray-600 dark:text-gray-400',
  cultivation: 'text-purple-600 dark:text-purple-400',
  equipment: 'text-blue-600 dark:text-blue-400',
  technique: 'text-cyan-600 dark:text-cyan-400',
  faction: 'text-green-600 dark:text-green-400',
  buff: 'text-yellow-600 dark:text-yellow-400',
  world: 'text-orange-600 dark:text-orange-400',
  other: 'text-muted-foreground',
};

// ============================================
// 主组件
// ============================================

export function StatDetailDialog({ protagonist, trigger }: StatDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [expandedStats, setExpandedStats] = useState<Set<string>>(new Set());

  // 解析属性详情
  const breakdowns = useMemo(() => {
    if (!open) return null;
    try {
      const service = getStatDetailService();
      return service.analyzeProtagonistStats(protagonist);
    } catch (error) {
      console.error('解析属性详情失败:', error);
      return null;
    }
  }, [protagonist, open]);

  // 切换展开状态
  const toggleStat = useCallback((statName: string) => {
    setExpandedStats(prev => {
      const next = new Set(prev);
      if (next.has(statName)) {
        next.delete(statName);
      } else {
        next.add(statName);
      }
      return next;
    });
  }, []);

  if (!breakdowns) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="sm" className="gap-1">
              <Info className="w-4 h-4" />
              详情
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>属性详情</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            {open ? '正在解析属性...' : '打开查看详情'}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1">
            <Info className="w-4 h-4" />
            详情
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            修行详情
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="base" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="base" className="text-xs">五维</TabsTrigger>
            <TabsTrigger value="combat" className="text-xs">战斗</TabsTrigger>
            <TabsTrigger value="economy" className="text-xs">机缘</TabsTrigger>
            <TabsTrigger value="cultivation" className="text-xs">修炼</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[50vh] mt-2">
            <TabsContent value="base" className="space-y-2 mt-0">
              <StatCategorySection
                title="天赋属性"
                description="由出身决定的天赋，以及通过修炼获得的成长"
                stats={breakdowns.baseStats}
                expandedStats={expandedStats}
                onToggle={toggleStat}
              />
            </TabsContent>
            
            <TabsContent value="combat" className="space-y-2 mt-0">
              <StatCategorySection
                title="战斗属性"
                description="影响战斗表现的核心属性"
                stats={breakdowns.combatStats}
                expandedStats={expandedStats}
                onToggle={toggleStat}
              />
            </TabsContent>
            
            <TabsContent value="economy" className="space-y-2 mt-0">
              <StatCategorySection
                title="机缘属性"
                description="影响资源获取和掉落的属性"
                stats={breakdowns.economyStats}
                expandedStats={expandedStats}
                onToggle={toggleStat}
              />
            </TabsContent>
            
            <TabsContent value="cultivation" className="space-y-2 mt-0">
              <StatCategorySection
                title="修炼属性"
                description="影响修炼进度和突破的属性"
                stats={breakdowns.cultivationStats}
                expandedStats={expandedStats}
                onToggle={toggleStat}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        {/* 底部统计 */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span>共 {breakdowns.totalEffects} 项效果生效中</span>
          <span>更新于 {new Date(breakdowns.timestamp).toLocaleTimeString()}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 子组件
// ============================================

interface StatCategorySectionProps {
  title: string;
  description: string;
  stats: StatDetailBreakdown[];
  expandedStats: Set<string>;
  onToggle: (statName: string) => void;
}

function StatCategorySection({
  title,
  description,
  stats,
  expandedStats,
  onToggle,
}: StatCategorySectionProps) {
  if (stats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无相关属性
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="px-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      
      {stats.map(stat => (
        <StatItemCard
          key={stat.statId}
          stat={stat}
          isExpanded={expandedStats.has(stat.statName)}
          onToggle={() => onToggle(stat.statName)}
        />
      ))}
    </div>
  );
}

interface StatItemCardProps {
  stat: StatDetailBreakdown;
  isExpanded: boolean;
  onToggle: () => void;
}

function StatItemCard({ stat, isExpanded, onToggle }: StatItemCardProps) {
  const Icon = STAT_ICONS[stat.statName] || Info;
  const hasBonuses = stat.bonuses.length > 0;
  
  return (
    <div className="rounded-lg border bg-card">
      {/* 主行 */}
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 flex items-center gap-3 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium">{stat.statName}</span>
                {hasBonuses && (
                  <Badge variant="secondary" className="text-[10px]">
                    {stat.bonuses.length}项加成
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {stat.summary}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold">{stat.finalValue}</div>
              {stat.totalBonus !== 0 && (
                <div className={`text-xs flex items-center justify-end gap-0.5 ${
                  stat.totalBonus > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.totalBonus > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.totalBonus > 0 ? '+' : ''}{stat.totalBonus.toFixed(1)}
                </div>
              )}
            </div>
            
            {hasBonuses && (
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`} />
            )}
          </button>
        </CollapsibleTrigger>
        
        {hasBonuses && (
          <CollapsibleContent>
            <Separator />
            <div className="p-3 space-y-1.5 bg-muted/30">
              {/* 数值构成 */}
              <div className="text-xs font-medium text-muted-foreground mb-2">数值构成</div>
              
              {stat.baseValue > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">天赋基础</span>
                  <span className="font-medium">{stat.baseValue}</span>
                </div>
              )}
              
              {stat.growthValue > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">修炼成长</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    +{stat.growthValue}
                  </span>
                </div>
              )}
              
              {/* 加成来源 */}
              {stat.bonuses.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <div className="text-xs font-medium text-muted-foreground mb-2">加成来源</div>
                  
                  {stat.bonuses.map((bonus, index) => (
                    <BonusSourceItem key={index} bonus={bonus} />
                  ))}
                </>
              )}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

interface BonusSourceItemProps {
  bonus: StatBonusSource;
}

function BonusSourceItem({ bonus }: BonusSourceItemProps) {
  const CategoryIcon = CATEGORY_ICONS[bonus.category] || Info;
  const colorClass = CATEGORY_COLORS[bonus.category] || 'text-muted-foreground';
  
  const isPositive = bonus.value > 0;
  const displayValue = bonus.isPercentage
    ? `${isPositive ? '+' : ''}${(bonus.value * 100).toFixed(1)}%`
    : `${isPositive ? '+' : ''}${bonus.value.toFixed(1)}`;
  
  return (
    <div className="flex items-center gap-2 py-1">
      <CategoryIcon className={`w-3.5 h-3.5 ${colorClass}`} />
      
      <div className="flex-1">
        <span className="text-sm">{bonus.name}</span>
        {bonus.sourceDetail && (
          <span className="text-xs text-muted-foreground ml-1">
            ({bonus.sourceDetail})
          </span>
        )}
      </div>
      
      <span className={`text-sm font-medium ${
        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}>
        {displayValue}
      </span>
    </div>
  );
}

// ============================================
// 导出
// ============================================

export default StatDetailDialog;
