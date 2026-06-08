'use client';

import { useState, useMemo } from 'react';

import { Flame, Snowflake, Zap, Wind, Mountain, Sun, Moon, Sword, Swords, Hand, Target, Crosshair, BookOpen, Shield, Sparkles, Lock, CheckCircle, Flame as FireIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BONDS, 
  BOND_LEVELS, 
  getBondsByType, 
  getBondLevelInfo, 
  getNextLevelRequired,
  calculateBondRewards,
  BondTypeNames,
  ElementNames,
  WeaponNames
} from '@/lib/data/bondData';
import { Technique, Equipment, ItemRarity } from '@/lib/game/types';
import { GameStatistics } from '@/lib/game/types';

interface CollectionPanelProps {
  techniques: Technique[];
  equipments: Equipment[];
  statistics: GameStatistics;
}

// 元素图标
const ElementIcons: Record<string, React.ReactNode> = {
  fire: <Flame className="w-4 h-4 text-orange-500" />,
  ice: <Snowflake className="w-4 h-4 text-cyan-400" />,
  thunder: <Zap className="w-4 h-4 text-yellow-400" />,
  wind: <Wind className="w-4 h-4 text-green-400" />,
  earth: <Mountain className="w-4 h-4 text-amber-600" />,
  light: <Sun className="w-4 h-4 text-yellow-300" />,
  dark: <Moon className="w-4 h-4 text-purple-500" />,
};

// 武器图标
const WeaponIcons: Record<string, React.ReactNode> = {
  sword: <Sword className="w-4 h-4 text-blue-400" />,
  blade: <Swords className="w-4 h-4 text-red-400" />,
  fist: <Hand className="w-4 h-4 text-orange-400" />,
  bow: <Target className="w-4 h-4 text-green-400" />,
  spear: <Crosshair className="w-4 h-4 text-purple-400" />,
};

// 稀有度颜色
const rarityColors: Record<ItemRarity, string> = {
  '普通': 'text-gray-500 dark:text-gray-400',
  '稀有': 'text-blue-500 dark:text-blue-400',
  '史诗': 'text-purple-500 dark:text-purple-400',
  '传说': 'text-yellow-500 dark:text-yellow-400',
  '神话': 'text-red-500 dark:text-red-400',
};

const rarityBgColors: Record<ItemRarity, string> = {
  '普通': 'bg-gray-500/10 dark:bg-gray-500/15 border-gray-500/30 dark:border-gray-500/30',
  '稀有': 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/30 dark:border-blue-500/30',
  '史诗': 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/30 dark:border-purple-500/30',
  '传说': 'bg-yellow-500/10 dark:bg-yellow-500/15 border-yellow-500/30 dark:border-yellow-500/30',
  '神话': 'bg-red-500/10 dark:bg-red-500/15 border-red-500/30 dark:border-red-500/30',
};

// 羁绊卡片
function BondCard({ 
  bond, 
  collectedCount 
}: { 
  bond: { id: string; name: string; type: string; description: string; keywords: string[]; rewards: { level: number; stats: Record<string, number> }[] };
  collectedCount: number;
}) {
  const levelInfo = getBondLevelInfo(collectedCount);
  const nextRequired = getNextLevelRequired(collectedCount);
  const currentReward = levelInfo ? calculateBondRewards(bond as any, collectedCount) : null;
  
  // 获取图标
  const getIcon = () => {
    if (bond.type === 'element') {
      const elementKey = Object.keys(ElementNames).find(key => 
        bond.id === `bond_${key}`
      );
      return elementKey ? ElementIcons[elementKey] : <Sparkles className="w-4 h-4" />;
    }
    if (bond.type === 'weapon') {
      const weaponKey = Object.keys(WeaponNames).find(key => 
        bond.id === `bond_${key}`
      );
      return weaponKey ? WeaponIcons[weaponKey] : <Sword className="w-4 h-4" />;
    }
    return <Sparkles className="w-4 h-4" />;
  };
  
  // 获取显示名称
  const getDisplayName = () => {
    if (bond.type === 'element') {
      const elementKey = Object.keys(ElementNames).find(key => 
        bond.id === `bond_${key}`
      );
      return elementKey ? ElementNames[elementKey] : bond.name;
    }
    if (bond.type === 'weapon') {
      const weaponKey = Object.keys(WeaponNames).find(key => 
        bond.id === `bond_${key}`
      );
      return weaponKey ? WeaponNames[weaponKey] : bond.name;
    }
    return bond.name;
  };
  
  const maxLevel = BOND_LEVELS.length;
  const currentLevel = levelInfo?.level ?? 0;
  const progressPercent = nextRequired 
    ? Math.min((collectedCount / nextRequired) * 100, 100)
    : 100;
  
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      levelInfo 
        ? 'bg-primary/5 border-primary/30' 
        : 'bg-muted/30 border-border'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 p-2 rounded-lg ${
          levelInfo ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium ${levelInfo ? 'text-primary' : 'text-foreground'}`}>
              {getDisplayName()}
            </h4>
            {levelInfo && (
              <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30 text-primary">
                Lv.{currentLevel}
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mb-2">
            {bond.description}
          </p>
          
          {/* 进度 */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>已收集: {collectedCount}件</span>
              {nextRequired ? (
                <span>下一级: {nextRequired}件</span>
              ) : (
                <span className="text-primary">已满级</span>
              )}
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
          
          {/* 当前加成 */}
          {currentReward && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(currentReward.stats).map(([stat, value]) => (
                <Badge key={stat} variant="secondary" className="text-[9px]">
                  {stat} +{value}
                </Badge>
              ))}
            </div>
          )}
          
          {/* 关键词提示 */}
          <div className="mt-2 flex flex-wrap gap-1">
            {bond.keywords.slice(0, 4).map((keyword, idx) => (
              <span key={idx} className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {keyword}
              </span>
            ))}
            {bond.keywords.length > 4 && (
              <span className="text-[9px] text-muted-foreground">
                +{bond.keywords.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 图鉴物品卡片
function CollectionItemCard({
  name,
  type,
  rarity
}: {
  name: string;
  type: 'technique' | 'equipment';
  rarity: ItemRarity;
}) {
  return (
    <div className={`p-2 rounded-lg border ${rarityBgColors[rarity]}`}>
      <div className="flex items-center gap-2">
        <div className="shrink-0 text-muted-foreground">
          {type === 'technique' ? <BookOpen className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-xs font-medium truncate ${rarityColors[rarity]}`}>
            {name}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {type === 'technique' ? '功法' : '装备'}
          </div>
        </div>
      </div>
    </div>
  );
}

// 羁绊类型标签页
function BondTypeTab({ 
  type, 
  collectedTechniqueNames,
  collectedEquipmentNames
}: { 
  type: 'element' | 'weapon';
  collectedTechniqueNames: string[];
  collectedEquipmentNames: string[];
}) {
  const bonds = getBondsByType(type);
  
  // 计算每个羁绊的收集数量
  const bondCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    bonds.forEach(bond => {
      let count = 0;
      
      // 检查功法
      collectedTechniqueNames.forEach(name => {
        if (bond.keywords.some(kw => name.includes(kw))) {
          count++;
        }
      });
      
      // 检查装备
      collectedEquipmentNames.forEach(name => {
        if (bond.keywords.some(kw => name.includes(kw))) {
          count++;
        }
      });
      
      counts[bond.id] = count;
    });
    
    return counts;
  }, [bonds, collectedTechniqueNames, collectedEquipmentNames]);
  
  // 按收集数量排序
  const sortedBonds = useMemo(() => {
    return [...bonds].sort((a, b) => {
      return (bondCounts[b.id] ?? 0) - (bondCounts[a.id] ?? 0);
    });
  }, [bonds, bondCounts]);
  
  const activatedCount = bonds.filter(b => (bondCounts[b.id] ?? 0) >= 2).length;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{BondTypeNames[type]}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {activatedCount}/{bonds.length} 已激活
        </Badge>
      </div>
      
      <div className="space-y-2">
        {sortedBonds.map(bond => (
          <BondCard
            key={bond.id}
            bond={bond}
            collectedCount={bondCounts[bond.id] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}

// 收集物列表标签页
function CollectionListTab({
  techniques,
  equipments,
  collectedTechniqueNames,
  collectedEquipmentNames
}: {
  techniques: Technique[];
  equipments: Equipment[];
  collectedTechniqueNames: string[];
  collectedEquipmentNames: string[];
}) {
  // 合并所有收集物并按稀有度排序
  const allItems = useMemo(() => {
    const items: { name: string; type: 'technique' | 'equipment'; rarity: ItemRarity }[] = [];
    
    // 使用 Set 去重
    const addedTechniqueNames = new Set<string>();
    const addedEquipmentNames = new Set<string>();
    
    techniques.forEach(t => {
      if (!addedTechniqueNames.has(t.name)) {
        items.push({ name: t.name, type: 'technique', rarity: t.rarity });
        addedTechniqueNames.add(t.name);
      }
    });
    
    equipments.forEach(e => {
      if (!addedEquipmentNames.has(e.name)) {
        items.push({ name: e.name, type: 'equipment', rarity: e.rarity });
        addedEquipmentNames.add(e.name);
      }
    });
    
    // 按稀有度排序
    const rarityOrder: ItemRarity[] = ['传说', '史诗', '稀有', '普通'];
    items.sort((a, b) => {
      return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
    });
    
    return items;
  }, [techniques, equipments]);
  
  // 统计
  const stats = useMemo(() => {
    const rarityCount: Record<ItemRarity, number> = {
      '传说': 0,
      '史诗': 0,
      '稀有': 0,
      '普通': 0,
      '神话': 0,
    };
    
    allItems.forEach(item => {
      rarityCount[item.rarity]++;
    });
    
    return rarityCount;
  }, [allItems]);
  
  return (
    <div className="space-y-3">
      {/* 统计信息 */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-600">
          传说: {stats['传说']}
        </Badge>
        <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-600">
          史诗: {stats['史诗']}
        </Badge>
        <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-600">
          稀有: {stats['稀有']}
        </Badge>
        <Badge variant="outline" className="text-xs bg-gray-500/10 border-gray-500/30 text-gray-600">
          普通: {stats['普通']}
        </Badge>
      </div>
      
      {/* 收集物列表 */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="grid grid-cols-2 gap-2 pr-2">
          {allItems.map((item, idx) => (
            <CollectionItemCard
              key={`${item.type}-${item.name}-${idx}`}
              name={item.name}
              type={item.type}
              rarity={item.rarity}
            />
          ))}
        </div>
        
        {allItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            暂无收集物
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function CollectionPanel({
  techniques,
  equipments,
  statistics
}: CollectionPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('element');
  
  // 计算总体收集统计
  const totalItems = statistics.totalTechniquesCollected + statistics.totalEquipmentsCollected;
  const totalBonds = BONDS.length;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            图鉴系统
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              收集: {totalItems}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="element" className="text-xs">
              元素羁绊
            </TabsTrigger>
            <TabsTrigger value="weapon" className="text-xs">
              武器羁绊
            </TabsTrigger>
            <TabsTrigger value="collection" className="text-xs">
              收集物
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 mt-2 -mx-4 px-4">
            <TabsContent value="element" className="mt-0">
              <BondTypeTab 
                type="element" 
                collectedTechniqueNames={statistics.collectedTechniqueNames}
                collectedEquipmentNames={statistics.collectedEquipmentNames}
              />
            </TabsContent>
            
            <TabsContent value="weapon" className="mt-0">
              <BondTypeTab 
                type="weapon" 
                collectedTechniqueNames={statistics.collectedTechniqueNames}
                collectedEquipmentNames={statistics.collectedEquipmentNames}
              />
            </TabsContent>
            
            <TabsContent value="collection" className="mt-0">
              <CollectionListTab 
                techniques={techniques}
                equipments={equipments}
                collectedTechniqueNames={statistics.collectedTechniqueNames}
                collectedEquipmentNames={statistics.collectedEquipmentNames}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
