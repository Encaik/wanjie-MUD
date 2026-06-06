'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Zap, Lock, Check, Sword, Sparkles, Droplets } from 'lucide-react';
import { TechniqueSkill, WeaponTechnique } from '@/lib/game/skillTypes';

interface SkillUnlockInfo {
  id: string;
  name: string;
  description?: string;
  unlockLevel: number;
  currentLevel: number;
  mpCost?: number;
  cooldown?: number;
  triggerType?: string;
}

interface SkillsUnlockDialogProps {
  /** 技能列表 */
  skills: SkillUnlockInfo[];
  /** 来源名称 */
  sourceName: string;
  /** 来源类型 */
  sourceType: 'technique' | 'equipment';
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void;
}

/**
 * 技能解锁弹窗
 * 显示功法法技或装备斗技的解锁条件
 */
export function SkillsUnlockDialog({
  skills,
  sourceName,
  sourceType,
  open,
  onOpenChange,
}: SkillsUnlockDialogProps) {
  const unlockedCount = skills.filter(s => s.unlockLevel <= s.currentLevel).length;
  const totalCount = skills.length;
  const isTechnique = sourceType === 'technique';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            {isTechnique ? (
              <Sparkles className="w-4 h-4 text-purple-500" />
            ) : (
              <Sword className="w-4 h-4 text-orange-500" />
            )}
            {isTechnique ? '法技解锁' : '斗技解锁'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* 来源信息 */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">来源：{sourceName}</span>
            <Badge variant="outline" className="text-[10px]">
              已解锁 {unlockedCount}/{totalCount}
            </Badge>
          </div>
          
          {/* 技能列表 */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {skills.map((skill) => {
              const isUnlocked = skill.unlockLevel <= skill.currentLevel;
              
              return (
                <div
                  key={skill.id}
                  className={`p-2.5 rounded-lg border transition-all ${
                    isUnlocked
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-muted/30 border-border opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isUnlocked ? (
                          <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className={`text-xs font-medium truncate ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {skill.name}
                        </span>
                      </div>
                      
                      {skill.description && (
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                          {skill.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                        {skill.mpCost !== undefined && (
                          <span className="text-blue-500 flex items-center gap-0.5">
                            <Droplets className="w-2.5 h-2.5" />
                            {skill.mpCost}
                          </span>
                        )}
                        {skill.cooldown !== undefined && (
                          <span className="text-orange-500">冷却 {skill.cooldown}回合</span>
                        )}
                        {skill.triggerType && (
                          <span className="text-cyan-500">{skill.triggerType}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="shrink-0 text-right">
                      {isUnlocked ? (
                        <Badge variant="outline" className="text-[9px] bg-primary/10 border-primary text-primary">
                          <Check className="w-2.5 h-2.5 mr-0.5" />
                          已解锁
                        </Badge>
                      ) : (
                        <div className="text-[10px] text-muted-foreground">
                          <div>需要</div>
                          <div className="font-medium text-orange-500">Lv.{skill.unlockLevel}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 提示信息 */}
          {unlockedCount < totalCount && (
            <div className="text-[10px] text-muted-foreground text-center pt-1 border-t">
              提升等级可解锁更多技能
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 触发类型名称映射
const TRIGGER_TYPE_NAMES: Record<string, string> = {
  'on_attack': '攻击触发',
  'on_hit': '受击触发',
  'on_kill': '击杀触发',
  'on_crit': '暴击触发',
  'passive': '被动',
  'active': '主动',
};

/**
 * 将功法技能转换为统一格式
 */
export function convertTechniqueSkills(
  skills: TechniqueSkill[],
  currentLevel: number
): SkillUnlockInfo[] {
  return skills.map(skill => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    unlockLevel: skill.unlockLevel,
    currentLevel,
    mpCost: skill.mpCost,
    cooldown: skill.cooldown,
  }));
}

/**
 * 将装备技能转换为统一格式
 */
export function convertEquipmentSkills(
  skills: WeaponTechnique[],
  currentLevel: number
): SkillUnlockInfo[] {
  return skills.map(skill => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    unlockLevel: skill.unlockLevel,
    currentLevel,
    triggerType: TRIGGER_TYPE_NAMES[skill.trigger.type] || skill.trigger.type,
  }));
}
