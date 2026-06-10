'use client';

import { useState, useMemo, useEffect } from 'react';

import { Sparkles, Sword, Shield, ChevronUp, Info } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { getRarityStyle } from '@/shared/ui/item-tooltip';
import { Progress } from '@/shared/ui/progress';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { 
  Technique, 
  Equipment, 
  UpgradeMaterial, 
  ItemRarity,
  UPGRADE_CONFIG 
} from '@/core/types';
import {
  getExpToNextLevel,
  getMaterialExpValue,
  techniqueToMaterial,
  equipmentToMaterial,
  getUpgradeProgress,
} from '@/modules/equipment/logic/upgradeSystem';


// 可升级物品的联合类型
type UpgradeableItem = Technique | Equipment;

// 判断是否是功法
function isTechnique(item: UpgradeableItem): item is Technique {
  return 'type' in item;
}

// 判断是否是装备
function isEquipment(item: UpgradeableItem): item is Equipment {
  return 'slot' in item;
}

interface UpgradePanelProps {
  // 待升级的物品
  targetItem: Technique | Equipment | null;
  // 同类型的所有物品（包括目标物品）
  allItems: (Technique | Equipment)[];
  // 关闭面板的回调
  onClose: () => void;
  // 确认升级的回调（返回升级后的物品数据）
  onConfirm: (targetId: string, materialIds: string[], type: 'technique' | 'equipment') => { upgradedItem: Technique | Equipment } | null;
}

export function UpgradePanel({
  targetItem,
  allItems,
  onClose,
  onConfirm,
}: UpgradePanelProps) {
  // 选中的材料ID列表
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<string>>(new Set());
  
  // 升级后是否已确认（用于控制升级结果显示）
  const [upgradeResult, setUpgradeResult] = useState<{ previousLevel: number; newLevel: number } | null>(null);
  
  // 从 allItems 中获取最新的目标物品数据（解决升级后显示经验为0的问题）
  const currentTargetItem = useMemo(() => {
    if (!targetItem) return null;
    return allItems.find(item => item.id === targetItem.id) || targetItem;
  }, [targetItem, allItems]);
  
  // 清除升级结果的 effect
  useEffect(() => {
    // 当选择的材料改变时，清除升级结果
    setUpgradeResult(null);
  }, [selectedMaterialIds]);

  // 物品类型
  const itemType = currentTargetItem ? (isTechnique(currentTargetItem) ? 'technique' : 'equipment') : null;

  // 过滤出同名且非目标物品的材料
  const availableMaterials = useMemo(() => {
    if (!currentTargetItem) return [];
    
    return allItems.filter(item => 
      item.id !== currentTargetItem.id && 
      item.name === currentTargetItem.name
    );
  }, [currentTargetItem, allItems]);

  // 将物品转换为材料格式
  const materials = useMemo(() => {
    return availableMaterials.map(item => {
      if (isTechnique(item)) {
        return techniqueToMaterial(item);
      } else {
        return equipmentToMaterial(item);
      }
    });
  }, [availableMaterials]);

  // 计算选中的材料提供的总经验值
  const totalExp = useMemo(() => {
    return materials
      .filter(m => selectedMaterialIds.has(m.id))
      .reduce((sum, m) => sum + m.expValue, 0);
  }, [materials, selectedMaterialIds]);

  // 目标物品的升级进度
  const progress = currentTargetItem ? getUpgradeProgress(currentTargetItem.level, currentTargetItem.exp) : null;

  // 预计升级后的等级
  const predictedLevel = useMemo(() => {
    if (!currentTargetItem) return 0;
    let level = currentTargetItem.level;
    let exp = currentTargetItem.exp + totalExp;
    
    while (level < UPGRADE_CONFIG.maxLevel) {
      const needed = getExpToNextLevel(level);
      if (exp >= needed) {
        exp -= needed;
        level++;
      } else {
        break;
      }
    }
    return level;
  }, [currentTargetItem, totalExp]);

  // 切换材料选中状态
  const toggleMaterial = (id: string) => {
    setSelectedMaterialIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 全选/取消全选
  const toggleAll = () => {
    if (selectedMaterialIds.size === materials.length) {
      setSelectedMaterialIds(new Set());
    } else {
      setSelectedMaterialIds(new Set(materials.map(m => m.id)));
    }
  };

  // 确认升级
  const handleConfirm = () => {
    if (!currentTargetItem || !itemType || selectedMaterialIds.size === 0) return;
    const previousLevel = currentTargetItem.level;
    const result = onConfirm(currentTargetItem.id, Array.from(selectedMaterialIds), itemType);
    if (result?.upgradedItem) {
      setUpgradeResult({ previousLevel, newLevel: result.upgradedItem.level });
    }
    setSelectedMaterialIds(new Set());
  };

  if (!currentTargetItem) {
    return null;
  }

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader className="pb-2 pt-3 shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ChevronUp className="w-4 h-4 text-primary" />
          升级{itemType === 'technique' ? '功法' : '装备'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden pt-2">
        {/* 目标物品信息 */}
        <div className={`p-3 rounded-lg border ${getRarityStyle(currentTargetItem.rarity, 'border')} ${getRarityStyle(currentTargetItem.rarity, 'bg')}`}>
          <div className="flex items-center gap-2 mb-2">
            {isTechnique(currentTargetItem) ? (
              <Sparkles className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Sword className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={`font-medium ${getRarityStyle(currentTargetItem.rarity, 'text')}`}>
              {currentTargetItem.name}
            </span>
            <Badge variant="outline" className="ml-auto text-xs">
              Lv.{currentTargetItem.level}
              {currentTargetItem.level >= UPGRADE_CONFIG.maxLevel && ' (满级)'}
            </Badge>
          </div>
          
          {/* 经验进度条 */}
          {currentTargetItem.level < UPGRADE_CONFIG.maxLevel && progress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>经验值</span>
                <span>{progress.current} / {progress.required}</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
          )}
          
          {/* 升级结果显示 */}
          {upgradeResult && upgradeResult.newLevel > upgradeResult.previousLevel && (
            <div className="mt-2 text-xs text-green-500 flex items-center gap-1 font-medium">
              <Info className="w-3 h-3" />
              升级成功! Lv.{upgradeResult.previousLevel} → Lv.{upgradeResult.newLevel}
            </div>
          )}
          
          {/* 属性预览 */}
          {!upgradeResult && predictedLevel > currentTargetItem.level && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              升级后: Lv.{currentTargetItem.level} → Lv.{predictedLevel}
            </div>
          )}
        </div>

        {/* 底部信息栏和升级按钮 - 放在材料区上面 */}
        <div className="shrink-0 py-2 border-t border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">总经验值:</span>
            <span className="text-sm font-medium text-primary">+{totalExp}</span>
          </div>
          <Button
            className="w-full"
            disabled={selectedMaterialIds.size === 0 || currentTargetItem.level >= UPGRADE_CONFIG.maxLevel}
            onClick={handleConfirm}
          >
            {currentTargetItem.level >= UPGRADE_CONFIG.maxLevel 
              ? '已满级' 
              : `消耗 ${selectedMaterialIds.size} 个材料升级`}
          </Button>
        </div>

        {/* 材料选择区域 */}
        <div className="shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">可选材料 ({materials.length})</span>
            {materials.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={toggleAll}>
                {selectedMaterialIds.size === materials.length ? '取消全选' : '全选'}
              </Button>
            )}
          </div>
          
          {materials.length === 0 ? (
            <div className="h-16 flex items-center justify-center text-sm text-muted-foreground">
              没有同名的材料可用于升级
            </div>
          ) : (
            <ScrollArea className="h-[180px]">
              <div className="space-y-1.5 pr-2">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedMaterialIds.has(material.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => toggleMaterial(material.id)}
                  >
                    <Checkbox
                      checked={selectedMaterialIds.has(material.id)}
                      onCheckedChange={() => toggleMaterial(material.id)}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${getRarityStyle(material.rarity, 'text')}`}>
                        {material.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Lv.{material.level}</span>
                        <span className={getRarityStyle(material.rarity, 'text')}>
                          {material.rarity}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      +{material.expValue} 经验
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
