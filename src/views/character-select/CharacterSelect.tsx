'use client';

import type { WorldType, AttributeTemplate } from '@/core/types';
import type { CharacterTemplate } from '@/modules/identity/hooks';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { cn } from '@/shared/utils';

import { WorldInfoBar } from './WorldInfoBar';

interface CharacterSelectProps {
  characters: CharacterTemplate[];
  onSelect: (index: number) => void;
  worldType?: WorldType;
  worldName?: string;
  visualConfig?: { icon: string; accentColor: string; gradientClass: string; borderColor: string; bgGradient: string; colorGradient: string };
  /** V3：属性完整定义（模板，用于动态渲染属性面板） */
  attributeDefinitions?: AttributeTemplate[];
  attributeCount?: number;
  loading?: boolean;
  error?: string | null;
  onBack?: () => void;
}

export function CharacterSelect({
  characters,
  onSelect,
  worldType = '修仙',
  worldName,
  visualConfig,
  attributeDefinitions,
  loading,
  error,
  onBack,
}: CharacterSelectProps) {
  const maleCount = characters.filter(c => c.gender === '男').length;
  const femaleCount = characters.filter(c => c.gender === '女').length;

  // 获取属性显示名
  const getAttrDisplayName = (key: string) => {
    const def = attributeDefinitions?.find(a => a.key === key);
    return def?.displayName ?? key;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-muted-foreground">正在生成角色...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive">生成失败: {error}</p>
        {onBack && <button onClick={onBack} className="text-sm text-primary underline">返回世界选择</button>}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        {/* 世界信息条 */}
        {worldName && visualConfig && onBack && (
          <WorldInfoBar worldName={worldName} visualConfig={visualConfig} onBack={onBack} />
        )}

        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif">命运之契 · 谁将踏入此界</h1>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            天道推演，八位命运之子静待抉择
            <span className="ml-2">
              （男 {maleCount} 人，女 {femaleCount} 人）
            </span>
          </p>
          
        </div>

        {/* 角色网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {characters.map((character) => {
            // 提取数值型属性用于展示
            const numericAttrs = Object.entries(character.attributes)
              .filter(([, v]) => typeof v === 'number')
              .sort(([, a], [, b]) => (b as number) - (a as number));

            // 核心值摘要
            const coreKeys = ['maxHp', 'physicalATK', 'specialATK', 'speed'] as const;
            const coreLabels: Record<string, string> = {
              maxHp: 'HP', physicalATK: '物攻', specialATK: '特攻', speed: '速度',
            };

            return (
              <Card
                key={character.index}
                className="cursor-pointer transition-all duration-200 hover:shadow-md border-2 hover:border-primary/50"
                onClick={() => onSelect(character.index)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* 头部 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-semibold">{character.name}</h3>
                      <Badge variant="outline" className={character.gender === '男'
                        ? 'bg-blue-500/15 text-blue-600'
                        : 'bg-pink-500/15 text-pink-600'}>
                        {character.gender}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{character.raceId}</Badge>
                    </div>
                  </div>

                  {/* 属性（动态渲染） */}
                  <div className="pt-2 border-t space-y-1">
                    <div className="text-[10px] text-muted-foreground">属性</div>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      {numericAttrs.slice(0, 6).map(([key, value]) => (
                        <div key={key} className="space-y-0.5">
                          <div className="text-[9px] text-muted-foreground">
                            {getAttrDisplayName(key)}
                          </div>
                          <div className="text-xs font-medium tabular-nums">{value as number}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 核心值摘要 */}
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex gap-2 flex-wrap">
                      {coreKeys.map(k => {
                        const val = character.coreStats[k as keyof typeof character.coreStats];
                        return val !== undefined ? (
                          <Badge key={k} variant="secondary" className="text-[9px] px-1">
                            {coreLabels[k]}: {Math.round(val)}
                          </Badge>
                        ) : null;
                      })}
                    </div>
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
