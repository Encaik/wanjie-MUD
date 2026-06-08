'use client';

import { RefreshCw, Swords, BookOpen, Shield, Compass } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { impactLevelToQuality, getQualityClasses } from '@/lib/game/utils/quality';
import { getAttributeNames } from '@/lib/game/utils/terminology';
import { Character, CharacterStats, ImpactLevel, StatImpact } from '@/lib/game/types';
import { cn } from '@/utils';

interface CharacterSelectProps {
  characters: Character[];
  onSelect: (character: Character) => void;
  onRefresh?: () => void;
}

// 性别样式配置
const genderStyles = {
  '男': {
    cardBorder: 'border-blue-400',
    badge: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  },
  '女': {
    cardBorder: 'border-pink-400',
    badge: 'bg-pink-500/15 text-pink-600 border-pink-500/30',
  },
};

// 品质图例
const qualityLegend = [
  { level: 'legendary' as ImpactLevel, label: '传说' },
  { level: 'epic' as ImpactLevel, label: '史诗' },
  { level: 'rare' as ImpactLevel, label: '稀有' },
  { level: 'uncommon' as ImpactLevel, label: '优秀' },
  { level: 'common' as ImpactLevel, label: '普通' },
];

// 维度配置
const DIMENSIONS = [
  { key: 'combat' as const, label: '战斗', icon: Swords, color: 'bg-red-500', gradient: 'from-red-500 to-orange-500' },
  { key: 'cultivation' as const, label: '修炼', icon: BookOpen, color: 'bg-blue-500', gradient: 'from-blue-500 to-purple-500' },
  { key: 'survival' as const, label: '生存', icon: Shield, color: 'bg-green-500', gradient: 'from-green-500 to-emerald-500' },
  { key: 'exploration' as const, label: '探索', icon: Compass, color: 'bg-amber-500', gradient: 'from-amber-500 to-yellow-500' },
];

// 定位标签样式
const ARCHETYPE_STYLES: Record<string, { badge: string; icon: string }> = {
  'combat_warrior': { badge: 'bg-red-100 text-red-700 border-red-300', icon: '⚔️' },
  'cultivation_genius': { badge: 'bg-blue-100 text-blue-700 border-blue-300', icon: '📚' },
  'survival_master': { badge: 'bg-green-100 text-green-700 border-green-300', icon: '🛡️' },
  'fortune_seeker': { badge: 'bg-amber-100 text-amber-700 border-amber-300', icon: '✨' },
  'balanced': { badge: 'bg-gray-100 text-gray-700 border-gray-300', icon: '⚖️' },
  'specialist': { badge: 'bg-purple-100 text-purple-700 border-purple-300', icon: '🎯' },
};

// 维度评分条组件
function DimensionBar({ 
  label, 
  score, 
  Icon, 
  gradient 
}: { 
  label: string; 
  score: number; 
  Icon: React.ElementType;
  gradient: string;
}) {
  const percentage = Math.min(100, Math.max(0, score));
  
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-[10px] text-muted-foreground w-6 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full bg-gradient-to-r", gradient, "transition-all duration-500")}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] font-medium tabular-nums w-6 text-right shrink-0">
        {score}
      </span>
    </div>
  );
}

// 词条详情组件
function TraitDetail({ 
  label, 
  trait, 
  attrNames
}: { 
  label: string; 
  trait: { name: string; description: string; level: ImpactLevel; impact: StatImpact; totalImpact: number };
  attrNames: Record<string, string>;
}) {
  const quality = impactLevelToQuality(trait.level);
  const classes = getQualityClasses(quality);
  
  // 生成具体属性影响描述
  const impacts: string[] = [];
  for (const [stat, value] of Object.entries(trait.impact)) {
    if (value !== undefined && value !== 0) {
      const statName = attrNames[stat] || stat;
      impacts.push(`${statName}${value >= 0 ? '+' : ''}${value}`);
    }
  }
  
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground w-8 shrink-0">{label}</span>
        <Badge 
          variant="outline" 
          className={cn("text-xs px-2 truncate max-w-[100px]", classes.badge)}
        >
          {trait.name}
        </Badge>
      </div>
      {impacts.length > 0 && (
        <div className="text-[10px] text-muted-foreground pl-8">
          {impacts.join('，')}
        </div>
      )}
    </div>
  );
}

// 计算多个影响的总和
function sumImpacts(impacts: StatImpact[]): StatImpact {
  const result: StatImpact = { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 };
  for (const impact of impacts) {
    result.体质 = (result.体质 || 0) + (impact.体质 || 0);
    result.灵根 = (result.灵根 || 0) + (impact.灵根 || 0);
    result.悟性 = (result.悟性 || 0) + (impact.悟性 || 0);
    result.幸运 = (result.幸运 || 0) + (impact.幸运 || 0);
    result.意志 = (result.意志 || 0) + (impact.意志 || 0);
  }
  return result;
}

export function CharacterSelect({ characters, onSelect, onRefresh }: CharacterSelectProps) {
  const defaultWorldType: '修仙' = '修仙';
  const attrNames = getAttributeNames(defaultWorldType);
  const statKeys = ['体质', '灵根', '悟性', '幸运', '意志'] as const;
  
  const maleCount = characters.filter(c => c.gender === '男').length;
  const femaleCount = characters.filter(c => c.gender === '女').length;
  
  // 基础属性 (新结构)
  const baseStats: CharacterStats = { 
    base: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 },
    growth: { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 }
  };

  return (
    <div className="min-h-dvh bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">选择你的化身</h1>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                刷新
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            八位命运之子，各有不同的人生轨迹
            <span className="ml-2">
              （男 {maleCount} 人，女 {femaleCount} 人）
            </span>
          </p>
          
          {/* 品质图例 */}
          <div className="flex items-center justify-center gap-3 text-xs flex-wrap">
            <span className="text-muted-foreground">词条品质：</span>
            {qualityLegend.map((item) => {
              const classes = getQualityClasses(impactLevelToQuality(item.level));
              return (
                <Badge key={item.level} variant="outline" className={cn("text-[10px] px-1.5", classes.badge)}>
                  {item.label}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* 角色网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {characters.map((character) => {
            // 计算属性总影响
            const totalImpact = sumImpacts([
              character.origin.impact,
              character.trait.impact,
              character.personality.impact,
              character.talent.impact
            ]);
            
            // 计算最终属性
            const finalStats = {
              体质: baseStats.base.体质 + (totalImpact.体质 || 0),
              灵根: baseStats.base.灵根 + (totalImpact.灵根 || 0),
              悟性: baseStats.base.悟性 + (totalImpact.悟性 || 0),
              幸运: baseStats.base.幸运 + (totalImpact.幸运 || 0),
              意志: baseStats.base.意志 + (totalImpact.意志 || 0),
            };
            
            // 找出最高和最低属性
            const sortedStats = Object.entries(finalStats).sort((a, b) => b[1] - a[1]);
            const maxStat = sortedStats[0];
            const minStat = sortedStats[sortedStats.length - 1];
            
            // 获取维度评分和定位
            const scores = character.dimensionScores;
            const archetype = character.archetype;
            const synergies = character.synergies || [];
            const archetypeStyle = archetype ? ARCHETYPE_STYLES[archetype.archetype] : ARCHETYPE_STYLES.balanced;
            
            return (
              <Card 
                key={character.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30",
                  genderStyles[character.gender].cardBorder
                )}
                onClick={() => onSelect(character)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* 头部：姓名 + 性别 + 年龄 + 定位标签 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground">{character.name}</h3>
                      <Badge variant="outline" className={cn("text-[10px]", genderStyles[character.gender].badge)}>
                        {character.gender}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {character.age}岁
                      </Badge>
                    </div>
                    {archetype && (
                      <Badge 
                        variant="outline" 
                        className={cn("text-[10px] px-1.5 shrink-0", archetypeStyle.badge)}
                      >
                        {archetypeStyle.icon} {archetype.label}
                      </Badge>
                    )}
                  </div>

                  {/* 词条列表 */}
                  <div className="space-y-1.5">
                    <TraitDetail label="出身" trait={character.origin} attrNames={attrNames} />
                    <TraitDetail label="特性" trait={character.trait} attrNames={attrNames} />
                    <TraitDetail label="性格" trait={character.personality} attrNames={attrNames} />
                    <TraitDetail label="天赋" trait={character.talent} attrNames={attrNames} />
                  </div>

                  {/* 多维度评分 */}
                  {scores && (
                    <div className="pt-2 border-t space-y-1.5">
                      <div className="text-[10px] text-muted-foreground mb-1">能力评估</div>
                      {DIMENSIONS.map((dim) => (
                        <DimensionBar
                          key={dim.key}
                          label={dim.label}
                          score={scores[dim.key]}
                          Icon={dim.icon}
                          gradient={dim.gradient}
                        />
                      ))}
                      
                      {/* 协同效果提示 */}
                      {synergies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {synergies.map((synergy) => (
                            <Badge 
                              key={synergy.id} 
                              variant="secondary" 
                              className="text-[9px] px-1 py-0 h-4 bg-amber-100 text-amber-700 border-amber-200"
                            >
                              {synergy.name}+{synergy.bonus}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 属性总览 + 推荐玩法 */}
                  <div className="pt-2 border-t space-y-2">
                    {/* 属性条 */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground">属性</div>
                      <div className="grid grid-cols-5 gap-1 text-center">
                        {statKeys.map((key) => {
                          const bonus = totalImpact[key] || 0;
                          const value = finalStats[key];
                          const isMax = key === maxStat[0];
                          const isMin = key === minStat[0];
                          
                          return (
                            <div key={key} className="space-y-0.5">
                              <div className={cn(
                                "text-[9px]",
                                isMax ? "text-emerald-600 font-medium" :
                                isMin ? "text-red-500" : "text-muted-foreground"
                              )}>
                                {attrNames[key]}
                              </div>
                              <div className="text-xs font-medium tabular-nums">
                                <span className={cn(
                                  isMax && "text-emerald-600",
                                  isMin && "text-red-500"
                                )}>{value}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* 推荐玩法 */}
                    {archetype && (
                      <div className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
                        <span className="text-amber-700">推荐：</span>
                        {archetype.recommendedPlaystyle.split('，')[0]}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* 底部提示 */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          点击卡片选择角色开始游戏
        </div>
      </div>
    </div>
  );
}
