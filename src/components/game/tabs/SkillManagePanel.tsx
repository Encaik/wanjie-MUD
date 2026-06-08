'use client';

import React, { useMemo, useState } from 'react';

import { 
  Zap, 
  Lock, 
  Plus, 
  X, 
  Star,
  Flame,
  Snowflake,
  Zap as Thunder,
  Wind,
  Mountain,
  Sun,
  Moon,
  Swords,
  ArrowUpDown
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Element, WeaponCategory, ELEMENT_NAMES, WEAPON_CATEGORY_NAMES } from '@/lib/game/utils/restraintSystem';
import { 
  getUnlockedSkills, 
  getEquippedSkills,
  getUnlockedTechniques,
  getEquippedTechniques,
  equipSkill,
  unequipSkill,
  equipTechnique,
  unequipTechnique,
  quickEquipSkill,
  quickEquipTechnique,
} from '@/lib/game/skill/skillEquipSystem';
import { TechniqueSkill, WeaponTechnique } from '@/lib/game/skill/skillTypes';
import { Technique, Equipment } from '@/lib/game/types';

// ============================================
// 类型定义
// ============================================

interface SkillManagePanelProps {
  /** 功法对象（用于功法技能管理） */
  technique?: Technique;
  /** 武器对象（用于武器技巧管理） */
  equipment?: Equipment;
  /** 技能变更回调 */
  onChange?: () => void;
}

// ============================================
// 元素图标映射
// ============================================

const ElementIcons: Record<Element, React.ReactNode> = {
  fire: <Flame className="w-4 h-4 text-orange-500" />,
  ice: <Snowflake className="w-4 h-4 text-cyan-500" />,
  thunder: <Thunder className="w-4 h-4 text-yellow-500" />,
  wind: <Wind className="w-4 h-4 text-green-500" />,
  earth: <Mountain className="w-4 h-4 text-amber-700" />,
  light: <Sun className="w-4 h-4 text-yellow-300" />,
  dark: <Moon className="w-4 h-4 text-purple-500" />,
};

// ============================================
// 功法技能管理组件
// ============================================

export function TechniqueSkillPanel({ technique, onChange }: SkillManagePanelProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  if (!technique) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          未选择功法
        </CardContent>
      </Card>
    );
  }
  
  // 残本提示
  if (technique.isFragment) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center space-y-2">
            <Lock className="w-8 h-8 mx-auto opacity-50" />
            <p>残本无法装备技能</p>
            <p className="text-xs">请先合成为完本功法</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const unlockedSkills = useMemo(() => getUnlockedSkills(technique), [technique]);
  const equippedSkills = useMemo(() => getEquippedSkills(technique), [technique]);
  const equippedSkillIds = equippedSkills.map(s => s.id);
  
  // 可装备的技能（已解锁但未装备）
  const availableSkills = unlockedSkills.filter(s => !equippedSkillIds.includes(s.id));
  
  // 处理装备
  const handleEquip = (skillId: string, slotIndex: number) => {
    const result = equipSkill(technique, skillId, slotIndex);
    if (result.success) {
      onChange?.();
    }
  };
  
  // 处理快捷装备
  const handleQuickEquip = (skillId: string) => {
    const result = quickEquipSkill(technique, skillId);
    if (result.success) {
      onChange?.();
    }
  };
  
  // 处理卸下
  const handleUnequip = (slotIndex: number) => {
    const result = unequipSkill(technique, slotIndex);
    if (result.success) {
      onChange?.();
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            法技管理
          </div>
          <Badge variant="outline" className="text-[10px]">
            {equippedSkills.length}/{technique.skillSlots} 槽位
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden flex flex-col gap-3">
        {/* 技能槽位 */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-muted-foreground font-medium">技能槽位</div>
          <div className="space-y-1">
            {Array.from({ length: technique.maxSkillSlots }).map((_, index) => {
              const isUnlocked = index < technique.skillSlots;
              const equippedSkill = technique.equippedSkills[index];
              const skill = equippedSkill ? (technique.allSkills.find(s => s.id === equippedSkill) ?? null) : null;
              // 检查技能是否已解锁
              const isSkillUnlocked = skill ? skill.unlockLevel <= technique.level : true;
              
              return (
                <SkillSlot
                  key={index}
                  index={index}
                  isUnlocked={isUnlocked}
                  isSkillUnlocked={isSkillUnlocked}
                  unlockLevel={index + 1}
                  skillUnlockLevel={skill?.unlockLevel}
                  skill={skill}
                  element={technique.element}
                  onUnequip={() => handleUnequip(index)}
                  onSelect={() => setSelectedSlot(selectedSlot === index ? null : index)}
                  isSelected={selectedSlot === index}
                />
              );
            })}
          </div>
        </div>
        
        {/* 可用技能池 */}
        <div className="flex-1 min-h-0">
          <div className="text-[10px] text-muted-foreground font-medium mb-1.5">
            可用技能（点击装备）
          </div>
          <ScrollArea className="h-full">
            <div className="space-y-1 pr-2">
              {availableSkills.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  {unlockedSkills.length === 0 ? '暂无已解锁技能' : '所有技能已装备'}
                </div>
              ) : (
                availableSkills.map(skill => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    element={technique.element}
                    currentLevel={technique.level}
                    onEquip={() => handleQuickEquip(skill.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* 未解锁技能 */}
        {technique.allSkills.some(s => s.unlockLevel > technique.level) && (
          <div className="shrink-0 border-t pt-2">
            <div className="text-[10px] text-muted-foreground font-medium mb-1.5">
              未解锁技能
            </div>
            <div className="space-y-1">
              {technique.allSkills
                .filter(s => s.unlockLevel > technique.level)
                .map(skill => (
                  <LockedSkillCard
                    key={skill.id}
                    skill={skill}
                    element={technique.element}
                  />
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// 武器技巧管理组件
// ============================================

export function WeaponTechniquePanel({ equipment, onChange }: SkillManagePanelProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  if (!equipment) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          未选择武器
        </CardContent>
      </Card>
    );
  }
  
  // 残片提示
  if (equipment.isFragment) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center space-y-2">
            <Lock className="w-8 h-8 mx-auto opacity-50" />
            <p>残片无法装备技巧</p>
            <p className="text-xs">请先重铸为完整武器</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // 非武器提示
  const isWeapon = equipment.slot === 'melee' || equipment.slot === 'ranged';
  if (!isWeapon) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center space-y-2">
            <Swords className="w-8 h-8 mx-auto opacity-50" />
            <p>只有武器才能装备技巧</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const unlockedTechniques = useMemo(() => getUnlockedTechniques(equipment), [equipment]);
  const equippedTechniques = useMemo(() => getEquippedTechniques(equipment), [equipment]);
  const equippedTechniqueIds = equippedTechniques.map(t => t.id);
  
  // 可装备的技巧
  const availableTechniques = unlockedTechniques.filter(t => !equippedTechniqueIds.includes(t.id));
  
  // 处理装备
  const handleEquip = (techniqueId: string, slotIndex: number) => {
    const result = equipTechnique(equipment, techniqueId, slotIndex);
    if (result.success) {
      onChange?.();
    }
  };
  
  // 处理快捷装备
  const handleQuickEquip = (techniqueId: string) => {
    const result = quickEquipTechnique(equipment, techniqueId);
    if (result.success) {
      onChange?.();
    }
  };
  
  // 处理卸下
  const handleUnequip = (slotIndex: number) => {
    const result = unequipTechnique(equipment, slotIndex);
    if (result.success) {
      onChange?.();
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            斗技管理
          </div>
          <Badge variant="outline" className="text-[10px]">
            {equippedTechniques.length}/{equipment.techniqueSlots} 槽位
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden flex flex-col gap-3">
        {/* 技巧槽位 */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-muted-foreground font-medium">技巧槽位</div>
          <div className="space-y-1">
            {Array.from({ length: equipment.maxTechniqueSlots }).map((_, index) => {
              const isUnlocked = index < equipment.techniqueSlots;
              const equippedTechnique = equipment.equippedTechniques[index];
              const technique = equippedTechnique ? (equipment.allTechniques.find(t => t.id === equippedTechnique) ?? null) : null;
              // 检查技巧是否已解锁
              const isTechniqueUnlocked = technique ? technique.unlockLevel <= equipment.level : true;
              
              return (
                <TechniqueSlot
                  key={index}
                  index={index}
                  isUnlocked={isUnlocked}
                  isTechniqueUnlocked={isTechniqueUnlocked}
                  unlockLevel={index + 1}
                  techniqueUnlockLevel={technique?.unlockLevel}
                  technique={technique}
                  weaponCategory={equipment.weaponCategory}
                  onUnequip={() => handleUnequip(index)}
                  onSelect={() => setSelectedSlot(selectedSlot === index ? null : index)}
                  isSelected={selectedSlot === index}
                />
              );
            })}
          </div>
        </div>
        
        {/* 可用技巧池 */}
        <div className="flex-1 min-h-0">
          <div className="text-[10px] text-muted-foreground font-medium mb-1.5">
            可用技巧（点击装备）
          </div>
          <ScrollArea className="h-full">
            <div className="space-y-1 pr-2">
              {availableTechniques.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  {unlockedTechniques.length === 0 ? '暂无已解锁技巧' : '所有技巧已装备'}
                </div>
              ) : (
                availableTechniques.map(technique => (
                  <TechniqueCard
                    key={technique.id}
                    technique={technique}
                    weaponCategory={equipment.weaponCategory}
                    currentLevel={equipment.level}
                    onEquip={() => handleQuickEquip(technique.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* 未解锁技巧 */}
        {equipment.allTechniques.some(t => t.unlockLevel > equipment.level) && (
          <div className="shrink-0 border-t pt-2">
            <div className="text-[10px] text-muted-foreground font-medium mb-1.5">
              未解锁技巧
            </div>
            <div className="space-y-1">
              {equipment.allTechniques
                .filter(t => t.unlockLevel > equipment.level)
                .map(technique => (
                  <LockedTechniqueCard
                    key={technique.id}
                    technique={technique}
                    weaponCategory={equipment.weaponCategory}
                  />
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// 子组件
// ============================================

/** 技能槽位 */
function SkillSlot({
  index,
  isUnlocked,
  isSkillUnlocked,
  unlockLevel,
  skillUnlockLevel,
  skill,
  element,
  onUnequip,
  onSelect,
  isSelected,
}: {
  index: number;
  isUnlocked: boolean;
  isSkillUnlocked: boolean;
  unlockLevel: number;
  skillUnlockLevel?: number;
  skill: TechniqueSkill | null;
  element: Element | null;
  onUnequip: () => void;
  onSelect: () => void;
  isSelected: boolean;
}) {
  // 槽位未解锁
  if (!isUnlocked) {
    return (
      <div className="flex items-center gap-2 p-2 rounded border border-dashed border-muted-foreground/30 bg-muted/30">
        <Lock className="w-4 h-4 text-muted-foreground/50" />
        <div className="text-xs text-muted-foreground">
          槽位 {index + 1} · 需要等级 {unlockLevel}
        </div>
      </div>
    );
  }
  
  // 技能未解锁 - 显示锁定状态
  if (skill && !isSkillUnlocked) {
    return (
      <div className="flex items-center justify-between gap-2 p-2 rounded border border-dashed border-orange-500/50 bg-orange-500/10">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Lock className="w-4 h-4 text-orange-500" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium truncate text-orange-600 dark:text-orange-400">
              {skill.name}
            </div>
            <div className="text-[10px] text-orange-500">
              需要功法等级 {skill.unlockLevel} 解锁
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0"
          onClick={onUnequip}
        >
          ×
        </Button>
      </div>
    );
  }
  
  // 空槽位
  if (!skill) {
    return (
      <button
        onClick={onSelect}
        className={`w-full flex items-center gap-2 p-2 rounded border border-dashed transition-colors ${
          isSelected 
            ? 'border-primary bg-primary/10' 
            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <Plus className="w-4 h-4 text-muted-foreground" />
        <div className="text-xs text-muted-foreground">槽位 {index + 1} · 空槽位</div>
      </button>
    );
  }
  
  return (
    <div className={`flex items-center justify-between gap-2 p-2 rounded border bg-muted/30 ${
      isSelected ? 'border-primary' : 'border-border'
    }`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {element && ElementIcons[element]}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate">{skill.name}</div>
          <div className="text-[10px] text-muted-foreground">
            {skill.mpCost}MP · {skill.cooldown}回合冷却
          </div>
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onUnequip}>
            <X className="w-3 h-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>卸下</TooltipContent>
      </Tooltip>
    </div>
  );
}

/** 技巧槽位 */
function TechniqueSlot({
  index,
  isUnlocked,
  isTechniqueUnlocked,
  unlockLevel,
  techniqueUnlockLevel,
  technique,
  weaponCategory,
  onUnequip,
  onSelect,
  isSelected,
}: {
  index: number;
  isUnlocked: boolean;
  isTechniqueUnlocked: boolean;
  unlockLevel: number;
  techniqueUnlockLevel?: number;
  technique: WeaponTechnique | null;
  weaponCategory: WeaponCategory | null;
  onUnequip: () => void;
  onSelect: () => void;
  isSelected: boolean;
}) {
  // 槽位未解锁
  if (!isUnlocked) {
    return (
      <div className="flex items-center gap-2 p-2 rounded border border-dashed border-muted-foreground/30 bg-muted/30">
        <Lock className="w-4 h-4 text-muted-foreground/50" />
        <div className="text-xs text-muted-foreground">
          槽位 {index + 1} · 需要等级 {unlockLevel}
        </div>
      </div>
    );
  }
  
  // 技巧未解锁 - 显示锁定状态
  if (technique && !isTechniqueUnlocked) {
    return (
      <div className="flex items-center justify-between gap-2 p-2 rounded border border-dashed border-orange-500/50 bg-orange-500/10">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Lock className="w-4 h-4 text-orange-500" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium truncate text-orange-600 dark:text-orange-400">
              {technique.name}
            </div>
            <div className="text-[10px] text-orange-500">
              需要武器等级 {technique.unlockLevel} 解锁
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0"
          onClick={onUnequip}
        >
          ×
        </Button>
      </div>
    );
  }
  
  // 空槽位
  if (!technique) {
    return (
      <button
        onClick={onSelect}
        className={`w-full flex items-center gap-2 p-2 rounded border border-dashed transition-colors ${
          isSelected 
            ? 'border-primary bg-primary/10' 
            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <Plus className="w-4 h-4 text-muted-foreground" />
        <div className="text-xs text-muted-foreground">槽位 {index + 1} · 空槽位</div>
      </button>
    );
  }
  
  return (
    <div className={`flex items-center justify-between gap-2 p-2 rounded border bg-muted/30 ${
      isSelected ? 'border-primary' : 'border-border'
    }`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Swords className="w-4 h-4 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate">{technique.name}</div>
          <div className="text-[10px] text-muted-foreground">
            {technique.trigger.type} · {technique.trigger.chance ? `${Math.round(technique.trigger.chance * 100)}%` : '被动'}
          </div>
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onUnequip}>
            <X className="w-3 h-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>卸下</TooltipContent>
      </Tooltip>
    </div>
  );
}

/** 技能卡片 */
function SkillCard({
  skill,
  element,
  currentLevel,
  onEquip,
}: {
  skill: TechniqueSkill;
  element: Element | null;
  currentLevel: number;
  onEquip: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded border border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors"
         onClick={onEquip}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {element && ElementIcons[element]}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate">
            {skill.name}
            {skill.isUltimate && <Star className="w-3 h-3 inline ml-1 text-yellow-500" />}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {skill.mpCost}MP · 冷却{skill.cooldown}回合
          </div>
        </div>
      </div>
      <Badge variant="secondary" className="text-[10px] shrink-0">
        装备
      </Badge>
    </div>
  );
}

/** 技巧卡片 */
function TechniqueCard({
  technique,
  weaponCategory,
  currentLevel,
  onEquip,
}: {
  technique: WeaponTechnique;
  weaponCategory: WeaponCategory | null;
  currentLevel: number;
  onEquip: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded border border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors"
         onClick={onEquip}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Swords className="w-4 h-4 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate">
            {technique.name}
            {technique.isUltimate && <Star className="w-3 h-3 inline ml-1 text-yellow-500" />}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {technique.trigger.type} · {technique.trigger.chance ? `${Math.round(technique.trigger.chance * 100)}%` : '被动'}
          </div>
        </div>
      </div>
      <Badge variant="secondary" className="text-[10px] shrink-0">
        装备
      </Badge>
    </div>
  );
}

/** 锁定的技能卡片 */
function LockedSkillCard({
  skill,
  element,
}: {
  skill: TechniqueSkill;
  element: Element | null;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded border border-border bg-muted/20 opacity-60">
      <Lock className="w-4 h-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium truncate">{skill.name}</div>
        <div className="text-[10px] text-muted-foreground">
          🔒 需要等级 {skill.unlockLevel}
        </div>
      </div>
    </div>
  );
}

/** 锁定的技巧卡片 */
function LockedTechniqueCard({
  technique,
  weaponCategory,
}: {
  technique: WeaponTechnique;
  weaponCategory: WeaponCategory | null;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded border border-border bg-muted/20 opacity-60">
      <Lock className="w-4 h-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium truncate">{technique.name}</div>
        <div className="text-[10px] text-muted-foreground">
          🔒 需要等级 {technique.unlockLevel}
        </div>
      </div>
    </div>
  );
}
