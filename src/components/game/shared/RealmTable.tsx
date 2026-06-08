'use client';

import { useState } from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

import { RealmSystem } from '@/lib/data/realmData';
import { cn } from '@/utils';

interface RealmTableProps {
  realmSystem: RealmSystem | undefined;
  currentLevel?: number;
  className?: string;
  compact?: boolean; // 紧凑模式，只显示大境界列表
  showHeader?: boolean; // 是否显示表头
}

/**
 * 境界对照表组件
 * 显示大境界、小境界、对应等级的对照关系
 * 支持大境界折叠功能
 */
export function RealmTable({ realmSystem, currentLevel, className, compact = false, showHeader = true }: RealmTableProps) {
  // 默认折叠所有大境界，除非有当前等级所在的大境界
  const [expandedTiers, setExpandedTiers] = useState<Set<number>>(() => {
    if (currentLevel !== undefined && realmSystem) {
      const tierIndex = realmSystem.tiers.findIndex(
        tier => currentLevel >= tier.levelRange[0] && currentLevel <= tier.levelRange[1]
      );
      if (tierIndex >= 0) {
        return new Set([tierIndex]);
      }
    }
    return new Set<number>(); // 默认全部折叠
  });

  if (!realmSystem || !realmSystem.tiers || realmSystem.tiers.length === 0) {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        暂无境界信息
      </div>
    );
  }

  const toggleTier = (tierIndex: number) => {
    setExpandedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tierIndex)) {
        next.delete(tierIndex);
      } else {
        next.add(tierIndex);
      }
      return next;
    });
  };

  const isCurrentLevel = (level: number) => {
    return currentLevel !== undefined && currentLevel === level;
  };

  const isPassedLevel = (level: number) => {
    return currentLevel !== undefined && level < currentLevel;
  };

  // 紧凑模式：只显示大境界列表
  if (compact) {
    return (
      <div className={cn("text-[10px]", className)}>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {realmSystem.tiers.map((tier, tierIndex) => {
            const hasCurrentLevel = currentLevel !== undefined && 
              currentLevel >= tier.levelRange[0] && 
              currentLevel <= tier.levelRange[1];
            
            return (
              <span 
                key={tierIndex}
                className={cn(
                  "cursor-pointer hover:text-foreground",
                  hasCurrentLevel ? "text-primary font-medium" : "text-muted-foreground"
                )}
                title={`${tier.name}: 等级 ${tier.levelRange[0]}-${tier.levelRange[1]}`}
                onClick={() => toggleTier(tierIndex)}
              >
                {tier.name}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("text-xs", className)}>
      {/* 表头 */}
      {showHeader && (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-1 mb-1 font-medium text-muted-foreground border-b border-border pb-1">
          <span>大境界</span>
          <span>小境界</span>
          <span className="text-right w-10">等级</span>
        </div>
      )}
      
      {/* 境界列表 */}
      <div className="space-y-0.5">
        {realmSystem.tiers.map((tier, tierIndex) => {
          const isExpanded = expandedTiers.has(tierIndex);
          const hasCurrentLevel = currentLevel !== undefined && 
            currentLevel >= tier.levelRange[0] && 
            currentLevel <= tier.levelRange[1];
          
          return (
            <div key={tierIndex}>
              {/* 大境界行（可折叠） */}
              <div 
                className={cn(
                  "grid grid-cols-[1fr_1fr_auto] gap-1 py-0.5 px-1 rounded cursor-pointer hover:bg-muted/50",
                  hasCurrentLevel && "bg-primary/10"
                )}
                onClick={() => toggleTier(tierIndex)}
              >
                <span className="flex items-center gap-1">
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 shrink-0" />
                  )}
                  <span className={cn(
                    "font-medium",
                    hasCurrentLevel && "text-primary"
                  )}>
                    {tier.name}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {tier.subRealms[0]} ~ {tier.subRealms[tier.subRealms.length - 1]}
                </span>
                <span className="text-muted-foreground text-right w-10">
                  {tier.levelRange[0]}-{tier.levelRange[1]}
                </span>
              </div>
              
              {/* 小境界详情（展开时显示） */}
              {isExpanded && (
                <div className="ml-4 pl-2 border-l border-border/50">
                  {tier.subRealms.map((subRealm, subIndex) => {
                    const level = tier.levelRange[0] + subIndex;
                    const isCurrent = isCurrentLevel(level);
                    const isPassed = isPassedLevel(level);
                    
                    return (
                      <div 
                        key={subIndex}
                        className={cn(
                          "grid grid-cols-[1fr_1fr_auto] gap-1 py-0.5 px-1",
                          isCurrent && "bg-primary/15 rounded font-medium text-primary",
                          isPassed && "text-muted-foreground/60"
                        )}
                      >
                        <span></span>
                        <span className={cn(isCurrent && "text-primary")}>{subRealm}</span>
                        <span className={cn(
                          "text-right w-10",
                          isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                        )}>
                          {level}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* 体系说明 */}
      <div className="mt-2 pt-1 border-t border-border/50 text-[10px] text-muted-foreground/70">
        <span className="font-medium">{realmSystem.mainRealmName}</span>
        <span className="mx-1">·</span>
        <span>{realmSystem.subRealmName}</span>
      </div>
    </div>
  );
}
