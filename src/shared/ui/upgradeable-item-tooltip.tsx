'use client';

import { ReactNode } from 'react';

import type { ItemRarity } from '@/core/types';
import { Badge } from '@/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { getRarityStyle, getStatColor } from '@/shared/utils/rarityStyles';

/** 可升级物品tooltip属性 */
interface UpgradeableItemTooltipProps {
  children: ReactNode;
  name: string;
  rarity: ItemRarity;
  type: string;
  description?: string;
  stats?: { label: string; value: string | number; color?: string }[];
  element?: ReactNode;
  compatibleWeapon?: {
    name: string;
    bonus: number;
    element?: ReactNode;
    compatibleTechnique?: { name: string; bonus: number };
  };
  compatibleElement?: { name: string; bonus: number };
  weaponCategory?: ReactNode;
  techniqueSkills?: Array<{ name: string; unlockLevel: number; description?: string }>;
  weaponTechniques?: Array<{ name: string; unlockLevel: number; description?: string }>;
  skillSlots?: { current: number; max: number };
  techniqueSlots?: { current: number; max: number };
  currentLevel?: number;
  level?: number;
  exp?: number;
  maxLevel?: number;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

/** 计算升级所需经验 */
function getExpToNext(lvl: number): number {
  return Math.floor(100 * Math.pow(1.5, lvl - 1));
}

/** 可升级物品tooltip — 带等级进度条、专属属性、技能列表、升级按钮 */
export function UpgradeableItemTooltip({
  children, name, rarity, type, description, stats = [],
  element, compatibleWeapon, compatibleElement, weaponCategory,
  techniqueSkills, weaponTechniques, skillSlots, techniqueSlots,
  currentLevel, level, exp = 0, maxLevel = 10,
  showUpgrade = false, onUpgrade, side = 'top', className = '',
}: UpgradeableItemTooltipProps) {
  const expToNext = level && level < maxLevel ? getExpToNext(level) : 0;
  const progressPercent = level && level < maxLevel
    ? Math.min(100, Math.floor((exp / expToNext) * 100)) : 100;
  const skills = techniqueSkills || weaponTechniques || [];
  const effectiveLevel = currentLevel ?? level ?? 1;
  const hasSpecialAttributes = element || compatibleWeapon || compatibleElement || weaponCategory;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        data-slot="upgradeable-item-tooltip-content"
        className={`min-w-[280px] max-w-[320px] bg-popover text-popover-foreground border-2 border-border shadow-lg ${className}`}
      >
        <div className="space-y-1.5">
          {/* 名称 */}
          <div className={`font-medium text-sm font-serif ${getRarityStyle(rarity, 'text')}`}>
            {name}
          </div>

          {/* 类型和稀有度 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-serif">{type}</span>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-0 font-serif ${getRarityStyle(rarity, 'badge')}`}>
              {rarity}
            </Badge>
            {level !== undefined && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-serif">
                Lv.{level}{level >= maxLevel ? ' (满级)' : ''}
              </Badge>
            )}
          </div>

          {/* 等级进度条 */}
          {level !== undefined && level < maxLevel && (
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-muted-foreground font-serif">
                <span>经验</span>
                <span>{exp}/{expToNext}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          {/* 描述 */}
          {description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed font-serif">{description}</p>
          )}

          {/* 专属属性区域（功法/武器特有属性） */}
          {hasSpecialAttributes && (
            <div className="pt-1 space-y-1">
              <div className="bg-gradient-to-r from-transparent via-border to-transparent h-px mb-1" />
              {element && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-serif">元素</span>
                  <div className="flex items-center gap-1 text-foreground">{element}</div>
                </div>
              )}
              {compatibleWeapon && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-serif">契合武器</span>
                    <div className="flex items-center gap-1 text-quality-uncommon">
                      <span className="font-serif">{compatibleWeapon.name}</span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-quality-uncommon/20 text-quality-uncommon border-0 font-serif">
                        +{Math.round(compatibleWeapon.bonus * 100)}%
                      </Badge>
                    </div>
                  </div>
                  {compatibleWeapon.element && (
                    <div className="flex items-center gap-2 pl-3 text-[10px]">
                      <span className="text-muted-foreground font-serif">武器元素</span>
                      <div className="flex items-center gap-1">{compatibleWeapon.element}</div>
                    </div>
                  )}
                  {compatibleWeapon.compatibleTechnique && (
                    <div className="flex items-center justify-between pl-3 text-[10px]">
                      <span className="text-muted-foreground font-serif">契合功法</span>
                      <div className="flex items-center gap-1 text-quality-legendary">
                        <span className="font-serif">{compatibleWeapon.compatibleTechnique.name}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-quality-legendary/20 text-quality-legendary border-0 font-serif">
                          +{Math.round(compatibleWeapon.compatibleTechnique.bonus * 100)}%
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {compatibleElement && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-serif">契合元素</span>
                  <div className="flex items-center gap-1 text-quality-rare">
                    <span className="font-serif">{compatibleElement.name}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-quality-rare/20 text-quality-rare border-0 font-serif">
                      +{Math.round(compatibleElement.bonus * 100)}%
                    </Badge>
                  </div>
                </div>
              )}
              {weaponCategory && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-serif">武器类型</span>
                  <div className="flex items-center gap-1 text-foreground">{weaponCategory}</div>
                </div>
              )}
            </div>
          )}

          {/* 属性加成 */}
          {stats.length > 0 && (
            <div className="pt-1 space-y-0.5">
              <div className="bg-gradient-to-r from-transparent via-border to-transparent h-px mb-1" />
              {stats.map((stat, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-serif">{stat.label}</span>
                  <span className={`font-serif ${getStatColor(stat.color)}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* 技能/技巧列表 */}
          {skills.length > 0 && (
            <div className="pt-1 space-y-0.5">
              <div className="bg-gradient-to-r from-transparent via-border to-transparent h-px mb-1" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-medium font-serif">
                  {techniqueSkills ? '法技' : '斗技'}列表
                </span>
                {skillSlots && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-quality-uncommon/20 text-quality-uncommon border-0 font-serif">
                    槽位 {skillSlots.current}/{skillSlots.max}
                  </Badge>
                )}
                {techniqueSlots && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-quality-uncommon/20 text-quality-uncommon border-0 font-serif">
                    槽位 {techniqueSlots.current}/{techniqueSlots.max}
                  </Badge>
                )}
                {skills.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-serif">
                    {effectiveLevel >= skills[0].unlockLevel
                      ? skills.filter(s => effectiveLevel >= s.unlockLevel).length : 0}/{skills.length}
                  </span>
                )}
              </div>
              {skills.map((skill, index) => {
                const isUnlocked = effectiveLevel >= skill.unlockLevel;
                return (
                  <div key={index} className={`flex items-center justify-between text-[10px] font-serif ${isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                    <span className={isUnlocked ? '' : 'line-through'}>{skill.name}</span>
                    <span className="flex items-center gap-1">
                      {isUnlocked ? (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-quality-common/20 text-quality-common border-0 font-serif">已解锁</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-muted text-muted-foreground border-0 font-serif">Lv.{skill.unlockLevel}解锁</Badge>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 升级按钮 */}
          {showUpgrade && onUpgrade && (
            <div className="pt-1.5">
              <div className="bg-gradient-to-r from-transparent via-border to-transparent h-px mb-1.5" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onUpgrade(); }}
                className="w-full text-xs text-center py-1.5 px-2 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-serif"
              >
                升级
              </button>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
