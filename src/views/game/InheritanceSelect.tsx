'use client';

import { useState, useMemo } from 'react';

import { 
  ScrollText, Shield, Diamond, Sparkles,
  Check, X, ChevronRight
} from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Progress } from '@/shared/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Slider } from '@/shared/ui/slider';
import { ASCENSION_CONFIG } from '@/modules/ascension/data/ascensionData';
import { Protagonist, Technique, Equipment, InventoryItem } from '@/core/types';
import { InheritanceChoice } from '@/core/types';

interface InheritanceSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protagonist: Protagonist;
  ascensionCount: number;
  onConfirm: (choice: InheritanceChoice) => void;
  onSkip: () => void;
}

export function InheritanceSelect({
  open,
  onOpenChange,
  protagonist,
  ascensionCount,
  onConfirm,
  onSkip,
}: InheritanceSelectProps) {
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [spiritStonesPercent, setSpiritStonesPercent] = useState(50);

  // 检查是否有额外传承槽位
  const hasExtraSlots = ascensionCount >= ASCENSION_CONFIG.inheritance.extraSlots.ascensionRequired;
  const maxTechniques = hasExtraSlots ? 2 : 1;
  const maxEquipments = hasExtraSlots ? 2 : 1;

  // 获取灵石数量
  const spiritStones = useMemo(() => {
    const item = protagonist.inventory.find(
      item => item.definition.id === 'spirit_stone' || item.definition.name === '灵石'
    );
    return item?.quantity ?? 0;
  }, [protagonist.inventory]);

  // 筛选可传承的功法
  const techniques = useMemo(() => {
    const rarityOrder: Record<string, number> = { '传说': 0, '史诗': 1, '稀有': 2, '普通': 3 };
    return protagonist.techniques
      .filter(t => t.rarity === '史诗' || t.rarity === '传说')
      .sort((a, b) => {
        return (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99);
      });
  }, [protagonist.techniques]);

  // 筛选可传承的装备
  const equipments = useMemo(() => {
    const rarityOrder: Record<string, number> = { '传说': 0, '史诗': 1, '稀有': 2, '普通': 3 };
    return protagonist.equipments
      .filter(e => e.rarity === '史诗' || e.rarity === '传说')
      .sort((a, b) => {
        return (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99);
      });
  }, [protagonist.equipments]);

  // 处理确认
  const handleConfirm = () => {
    onConfirm({
      techniqueId: selectedTechniqueId,
      equipmentId: selectedEquipmentId,
      spiritStonesPercent: spiritStonesPercent / 100,
    });
  };

  // 处理跳过
  const handleSkip = () => {
    onSkip();
  };

  const carriedStones = Math.floor(spiritStones * (spiritStonesPercent / 100));

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <span>命运抉择</span>
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </DialogTitle>
          <DialogDescription className="text-center">
            突破世界壁垒之际，你可选择带走部分传承...
            {hasExtraSlots && (
              <Badge className="ml-2 bg-purple-500">永恒存在：双传承</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 传承功法选择 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-purple-500" />
              <span className="font-medium">传承功法</span>
              <Badge variant="outline" className="text-xs">
                最多 {maxTechniques} 本
              </Badge>
              {selectedTechniqueId && (
                <Badge className="bg-green-500 text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  已选
                </Badge>
              )}
            </div>
            
            {techniques.length > 0 ? (
              <RadioGroup 
                value={selectedTechniqueId ?? 'none'} 
                onValueChange={setSelectedTechniqueId}
                className="grid gap-2"
              >
                <div className="flex items-center space-x-2 p-2 rounded border bg-muted/30">
                  <RadioGroupItem value="none" id="tech-none" />
                  <Label htmlFor="tech-none" className="text-muted-foreground text-sm">
                    不传承功法
                  </Label>
                </div>
                {techniques.slice(0, 6).map(tech => (
                  <div 
                    key={tech.id} 
                    className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={tech.id} id={`tech-${tech.id}`} />
                    <Label htmlFor={`tech-${tech.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{tech.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={tech.rarity === '传说' ? 'default' : 'secondary'}
                            className={tech.rarity === '传说' ? 'bg-yellow-500' : ''}
                          >
                            {tech.rarity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Lv.{tech.level}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tech.type === 'attack' ? '攻击' : '防御'}功法 · 威力 {tech.power}
                      </p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                没有可传承的功法（需史诗及以上品质）
              </div>
            )}
          </div>

          {/* 传承装备选择 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="font-medium">传承装备</span>
              <Badge variant="outline" className="text-xs">
                最多 {maxEquipments} 件
              </Badge>
              {selectedEquipmentId && (
                <Badge className="bg-green-500 text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  已选
                </Badge>
              )}
            </div>
            
            {equipments.length > 0 ? (
              <RadioGroup 
                value={selectedEquipmentId ?? 'none'} 
                onValueChange={setSelectedEquipmentId}
                className="grid gap-2"
              >
                <div className="flex items-center space-x-2 p-2 rounded border bg-muted/30">
                  <RadioGroupItem value="none" id="eq-none" />
                  <Label htmlFor="eq-none" className="text-muted-foreground text-sm">
                    不传承装备
                  </Label>
                </div>
                {equipments.slice(0, 6).map(eq => (
                  <div 
                    key={eq.id} 
                    className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={eq.id} id={`eq-${eq.id}`} />
                    <Label htmlFor={`eq-${eq.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{eq.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={eq.rarity === '传说' ? 'default' : 'secondary'}
                            className={eq.rarity === '传说' ? 'bg-yellow-500' : ''}
                          >
                            {eq.rarity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Lv.{eq.level}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {eq.slot === 'melee' ? '近战' : 
                         eq.slot === 'ranged' ? '远程' : 
                         eq.slot === 'head' ? '头部' :
                         eq.slot === 'body' ? '身体' :
                         eq.slot === 'legs' ? '腿部' : '脚部'}
                        {eq.attackBonus > 0 && ` · 攻击+${eq.attackBonus}`}
                        {eq.defenseBonus > 0 && ` · 防御+${eq.defenseBonus}`}
                      </p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                没有可传承的装备（需史诗及以上品质）
              </div>
            )}
          </div>

          {/* 携带灵石 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Diamond className="w-5 h-5 text-cyan-500" />
              <span className="font-medium">携带灵石</span>
              <Badge variant="outline" className="text-xs">
                最高 50%
              </Badge>
            </div>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">当前灵石</span>
                <span className="font-bold text-cyan-600">{spiritStones.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">携带数量</span>
                <span className="font-bold text-green-600">{carriedStones.toLocaleString()}</span>
              </div>
              <div className="py-2">
                <Slider
                  value={[spiritStonesPercent]}
                  onValueChange={([value]) => setSpiritStonesPercent(value)}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{spiritStonesPercent}%</span>
                <span>50%</span>
              </div>
            </Card>
          </div>

          {/* 总结 */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4">
            <div className="text-sm font-medium mb-2">传承总结</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                {selectedTechniqueId && selectedTechniqueId !== 'none' ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span>传承功法：{techniques.find(t => t.id === selectedTechniqueId)?.name}</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">不传承功法</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedEquipmentId && selectedEquipmentId !== 'none' ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span>传承装备：{equipments.find(e => e.id === selectedEquipmentId)?.name}</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">不传承装备</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {carriedStones > 0 ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span>携带灵石：{carriedStones.toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">不携带灵石</span>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleSkip}>
            跳过传承
          </Button>
          <Button onClick={handleConfirm} className="bg-gradient-to-r from-purple-600 to-blue-600">
            确认选择
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
