'use client';

import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ItemRarity } from '@/lib/game/types';

// 统一的稀有度样式配置
export const RARITY_STYLES: Record<ItemRarity, { border: string; bg: string; text: string; badge: string }> = {
  '普通': {
    border: 'border-gray-400 dark:border-gray-500',
    bg: 'bg-gray-500/10',
    text: 'text-gray-700 dark:text-gray-300',
    badge: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
  '稀有': {
    border: 'border-blue-400 dark:border-blue-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-300',
  },
  '史诗': {
    border: 'border-purple-400 dark:border-purple-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-300',
  },
  '传说': {
    border: 'border-amber-400 dark:border-amber-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-300',
  },
  '神话': {
    border: 'border-red-400 dark:border-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-300',
  },
};

// 获取稀有度样式
export function getRarityStyle(rarity: ItemRarity, type: 'border' | 'bg' | 'text' | 'badge' = 'border') {
  return RARITY_STYLES[rarity]?.[type] || RARITY_STYLES['普通'][type];
}

// 统一tooltip属性接口
interface ItemTooltipProps {
  children: ReactNode;
  name: string;
  rarity: ItemRarity;
  type: string;         // 类型：如"攻击功法"、"近战武器"、"丹药"等
  description?: string;
  stats?: {             // 属性加成列表
    label: string;
    value: string | number;
    color?: string;     // 颜色：如 "red"、"blue"、"orange"等
  }[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

// 统一物品tooltip组件
export function ItemTooltip({
  children,
  name,
  rarity,
  type,
  description,
  stats = [],
  side = 'top',  // 默认上方
  className = '',
}: ItemTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        className={`max-w-[200px] bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700 ${className}`}
      >
        <div className="space-y-1.5">
          {/* 名称 */}
          <div className={`font-medium text-sm ${getRarityStyle(rarity, 'text')}`}>
            {name}
          </div>
          
          {/* 类型和稀有度 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-700 dark:text-amber-300">{type}</span>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-0 ${getRarityStyle(rarity, 'badge')}`}>
              {rarity}
            </Badge>
          </div>
          
          {/* 描述 */}
          {description && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
              {description}
            </p>
          )}
          
          {/* 属性加成 */}
          {stats.length > 0 && (
            <div className="pt-1 space-y-0.5 border-t border-amber-200 dark:border-amber-800">
              {stats.map((stat, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-amber-600 dark:text-amber-400">{stat.label}</span>
                  <span className={stat.color ? `text-${stat.color}-500` : 'text-amber-800 dark:text-amber-200'}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// 空槽位组件
interface EmptySlotCardProps {
  label: string;
  icon: ReactNode;
}

export function EmptySlotCard({ label, icon }: EmptySlotCardProps) {
  return (
    <div className="p-2 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <div className="shrink-0 text-muted-foreground">{icon}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// 背包区域标题
interface BackpackHeaderProps {
  icon: ReactNode;
  title: string;
  count: number;
}

export function BackpackHeader({ icon, title, count }: BackpackHeaderProps) {
  return (
    <div className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
      {icon}
      {title} ({count})
    </div>
  );
}

// 空背包提示
export function EmptyBackpackHint({ message = '暂无物品' }: { message?: string }) {
  return (
    <div className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">
      {message}
    </div>
  );
}

// 可升级物品的tooltip（带升级按钮）
interface UpgradeableItemTooltipProps {
  children: ReactNode;
  name: string;
  rarity: ItemRarity;
  type: string;
  description?: string;
  stats?: {
    label: string;
    value: string | number;
    color?: string;
  }[];
  /** 元素属性（功法用）：显示元素图标和名称 */
  element?: ReactNode;
  /** 契合武器（功法用）：显示契合武器类型、加成、元素和契合功法 */
  compatibleWeapon?: {
    name: string;
    bonus: number;
    /** 武器的元素属性（图标+名称） */
    element?: ReactNode;
    /** 武器的契合功法名称和加成 */
    compatibleTechnique?: {
      name: string;
      bonus: number;
    };
  };
  /** 契合元素（武器用）：显示契合元素类型和加成 */
  compatibleElement?: {
    name: string;
    bonus: number;
  };
  /** 武器类别（武器用）：显示武器类型图标和名称 */
  weaponCategory?: ReactNode;
  /** 法技列表（功法用）：技能名称和对应解锁等级 */
  techniqueSkills?: Array<{ name: string; unlockLevel: number; description?: string }>;
  /** 斗技列表（武器用）：技巧名称和对应解锁等级 */
  weaponTechniques?: Array<{ name: string; unlockLevel: number; description?: string }>;
  /** 技能槽位信息（功法用）：已解锁槽位数/最大槽位数 */
  skillSlots?: {
    current: number;
    max: number;
  };
  /** 技巧槽位信息（武器用）：已解锁槽位数/最大槽位数 */
  techniqueSlots?: {
    current: number;
    max: number;
  };
  /** 当前等级（用于判断技能是否已解锁） */
  currentLevel?: number;
  level?: number;
  exp?: number;
  maxLevel?: number;
  showUpgrade?: boolean;  // 是否显示升级按钮
  onUpgrade?: () => void; // 点击升级的回调
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

// 可升级物品tooltip组件
export function UpgradeableItemTooltip({
  children,
  name,
  rarity,
  type,
  description,
  stats = [],
  element,
  compatibleWeapon,
  compatibleElement,
  weaponCategory,
  techniqueSkills,
  weaponTechniques,
  skillSlots,
  techniqueSlots,
  currentLevel,
  level,
  exp = 0,
  maxLevel = 10,
  showUpgrade = false,
  onUpgrade,
  side = 'top',
  className = '',
}: UpgradeableItemTooltipProps) {
  // 计算升级所需经验
  const getExpToNext = (lvl: number) => Math.floor(100 * Math.pow(1.5, lvl - 1));
  const expToNext = level && level < maxLevel ? getExpToNext(level) : 0;
  const progressPercent = level && level < maxLevel ? Math.min(100, Math.floor((exp / expToNext) * 100)) : 100;
  
  // 合并技能列表（功法用法技，武器用斗技）
  const skills = techniqueSkills || weaponTechniques || [];
  // 使用currentLevel或level作为当前等级判断技能是否解锁
  const effectiveLevel = currentLevel ?? level ?? 1;
  
  // 判断是否有专属属性区域（功法有元素和契合武器，武器有契合元素和武器类别）
  const hasSpecialAttributes = element || compatibleWeapon || compatibleElement || weaponCategory;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        className={`min-w-[280px] max-w-[320px] bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700 ${className}`}
      >
        <div className="space-y-1.5">
          {/* 名称 */}
          <div className={`font-medium text-sm ${getRarityStyle(rarity, 'text')}`}>
            {name}
          </div>
          
          {/* 类型和稀有度 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-700 dark:text-amber-300">{type}</span>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-0 ${getRarityStyle(rarity, 'badge')}`}>
              {rarity}
            </Badge>
            {level !== undefined && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                Lv.{level}{level >= maxLevel ? ' (满级)' : ''}
              </Badge>
            )}
          </div>
          
          {/* 等级进度条 */}
          {level !== undefined && level < maxLevel && (
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-amber-600 dark:text-amber-400">
                <span>经验</span>
                <span>{exp}/{expToNext}</span>
              </div>
              <div className="h-1.5 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 dark:bg-amber-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          
          {/* 描述 */}
          {description && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
              {description}
            </p>
          )}
          
          {/* 专属属性区域（功法/武器特有属性） */}
          {hasSpecialAttributes && (
            <div className="pt-1 space-y-1 border-t border-amber-200 dark:border-amber-800">
              {/* 元素属性 */}
              {element && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-600 dark:text-amber-400">元素</span>
                  <div className="flex items-center gap-1 text-amber-800 dark:text-amber-200">
                    {element}
                  </div>
                </div>
              )}
              
              {/* 契合武器（功法） */}
              {compatibleWeapon && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-600 dark:text-amber-400">契合武器</span>
                    <div className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                      <span>{compatibleWeapon.name}</span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-0">
                        +{Math.round(compatibleWeapon.bonus * 100)}%
                      </Badge>
                    </div>
                  </div>
                  {/* 武器元素属性 */}
                  {compatibleWeapon.element && (
                    <div className="flex items-center gap-2 pl-3 text-[10px]">
                      <span className="text-amber-500 dark:text-amber-500">武器元素</span>
                      <div className="flex items-center gap-1">
                        {compatibleWeapon.element}
                      </div>
                    </div>
                  )}
                  {/* 武器契合功法 */}
                  {compatibleWeapon.compatibleTechnique && (
                    <div className="flex items-center justify-between pl-3 text-[10px]">
                      <span className="text-amber-500 dark:text-amber-500">契合功法</span>
                      <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <span>{compatibleWeapon.compatibleTechnique.name}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-0">
                          +{Math.round(compatibleWeapon.compatibleTechnique.bonus * 100)}%
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 契合元素（武器） */}
              {compatibleElement && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-600 dark:text-amber-400">契合元素</span>
                  <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                    <span>{compatibleElement.name}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-0">
                      +{Math.round(compatibleElement.bonus * 100)}%
                    </Badge>
                  </div>
                </div>
              )}
              
              {/* 武器类别（武器） */}
              {weaponCategory && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-600 dark:text-amber-400">武器类型</span>
                  <div className="flex items-center gap-1 text-amber-800 dark:text-amber-200">
                    {weaponCategory}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 属性加成 */}
          {stats.length > 0 && (
            <div className="pt-1 space-y-0.5 border-t border-amber-200 dark:border-amber-800">
              {stats.map((stat, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-amber-600 dark:text-amber-400">{stat.label}</span>
                  <span className={stat.color ? `text-${stat.color}-500` : 'text-amber-800 dark:text-amber-200'}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* 技能/技巧列表 */}
          {skills.length > 0 && (
            <div className="pt-1 space-y-0.5 border-t border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  {techniqueSkills ? '法技' : '斗技'}列表
                </span>
                {/* 槽位信息 */}
                {skillSlots && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-0">
                    槽位 {skillSlots.current}/{skillSlots.max}
                  </Badge>
                )}
                {techniqueSlots && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-0">
                    槽位 {techniqueSlots.current}/{techniqueSlots.max}
                  </Badge>
                )}
                {/* 技能解锁统计 */}
                {skills.length > 0 && (
                  <span className="text-[10px] text-amber-500 dark:text-amber-500">
                    {effectiveLevel >= skills[0].unlockLevel ? skills.filter(s => effectiveLevel >= s.unlockLevel).length : 0}/{skills.length}
                  </span>
                )}
              </div>
              {skills.map((skill, index) => {
                const isUnlocked = effectiveLevel >= skill.unlockLevel;
                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between text-[10px] ${isUnlocked ? 'text-amber-700 dark:text-amber-300' : 'text-amber-400/60 dark:text-amber-500/60'}`}
                  >
                    <span className={isUnlocked ? '' : 'line-through'}>
                      {skill.name}
                    </span>
                    <span className="flex items-center gap-1">
                      {isUnlocked ? (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                          已解锁
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-muted text-muted-foreground border-0">
                          Lv.{skill.unlockLevel}解锁
                        </Badge>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* 升级按钮 */}
          {showUpgrade && onUpgrade && (
            <div className="pt-1.5 border-t border-amber-200 dark:border-amber-800">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpgrade();
                }}
                className="w-full text-xs text-center py-1.5 px-2 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
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
