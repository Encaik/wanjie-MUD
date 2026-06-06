'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ControlledTabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Technique, Equipment } from '@/lib/game/types';
import { TechniqueSkillPanel, WeaponTechniquePanel } from './SkillManagePanel';

interface SkillManageDialogProps {
  /** 功法对象 */
  technique?: Technique;
  /** 武器对象 */
  equipment?: Equipment;
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 技能变更回调 */
  onChange?: () => void;
}

/**
 * 技能管理对话框
 * 用于管理功法法技和武器斗技的装备
 */
export function SkillManageDialog({
  technique,
  equipment,
  open,
  onOpenChange,
  onChange,
}: SkillManageDialogProps) {
  const handleChange = () => {
    onChange?.();
  };

  // 判断显示模式
  const hasTechnique = technique && !technique.isFragment;
  const hasEquipment = equipment && !equipment.isFragment && 
    (equipment.slot === 'melee' || equipment.slot === 'ranged');
  const showTabs = hasTechnique && hasEquipment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-sm">
            技能管理
          </DialogTitle>
        </DialogHeader>
        
        {showTabs ? (
          <ControlledTabs defaultTab="technique" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="technique" className="text-xs">
                法技
              </TabsTrigger>
              <TabsTrigger value="weapon" className="text-xs">
                斗技
              </TabsTrigger>
            </TabsList>
            <TabsContent value="technique" className="flex-1 overflow-hidden mt-2">
              <TechniqueSkillPanel technique={technique} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="weapon" className="flex-1 overflow-hidden mt-2">
              <WeaponTechniquePanel equipment={equipment} onChange={handleChange} />
            </TabsContent>
          </ControlledTabs>
        ) : hasTechnique ? (
          <div className="flex-1 overflow-hidden">
            <TechniqueSkillPanel technique={technique} onChange={handleChange} />
          </div>
        ) : hasEquipment ? (
          <div className="flex-1 overflow-hidden">
            <WeaponTechniquePanel equipment={equipment} onChange={handleChange} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            无法管理技能
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
