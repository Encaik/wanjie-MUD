/**
 * 克制关系图组件
 * 
 * 使用循环图形式展示克制关系，紧凑且直观
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Element,
  WeaponCategory,
  ELEMENT_NAMES,
  WEAPON_CATEGORY_NAMES,
} from '@/lib/game/types';
import {
  ELEMENT_COUNTER_MAP,
  WEAPON_COUNTER_MAP,
  getElementIcon,
  getWeaponCategoryIcon,
} from '@/lib/game/restraintSystem';
import { Flame, Swords, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/util/utils';

// 元素颜色映射
const ELEMENT_COLORS: Record<Element, string> = {
  fire: 'text-orange-500 bg-orange-500/20 border-orange-400',
  ice: 'text-cyan-400 bg-cyan-400/20 border-cyan-300',
  thunder: 'text-yellow-500 bg-yellow-500/20 border-yellow-400',
  wind: 'text-green-400 bg-green-400/20 border-green-300',
  earth: 'text-amber-600 bg-amber-600/20 border-amber-500',
  light: 'text-yellow-300 bg-yellow-300/20 border-yellow-200',
  dark: 'text-purple-400 bg-purple-400/20 border-purple-300',
};

// 武器颜色映射
const WEAPON_COLORS: Record<WeaponCategory, string> = {
  sword: 'text-blue-400 bg-blue-400/20 border-blue-300',
  blade: 'text-red-400 bg-red-400/20 border-red-300',
  fist: 'text-orange-400 bg-orange-400/20 border-orange-300',
  bow: 'text-green-400 bg-green-400/20 border-green-300',
  spear: 'text-purple-400 bg-purple-400/20 border-purple-300',
};

// 元素克制顺序（循环）
const ELEMENT_ORDER: Element[] = ['fire', 'ice', 'thunder', 'wind', 'earth'];

// 武器克制顺序（循环）
const WEAPON_ORDER: WeaponCategory[] = ['sword', 'blade', 'fist', 'bow', 'spear'];

/**
 * 元素克制循环图
 */
export function ElementRestraintChart({ className }: { className?: string }) {
  return (
    <Card className={cn('border-border/50', className)}>
      <CardHeader className="py-1.5 px-3">
        <CardTitle className="text-xs flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          元素克制
          <span className="text-muted-foreground font-normal text-[9px]">(+25%伤害)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-2">
        {/* 主循环克制 */}
        <div className="flex items-center justify-center gap-0.5 flex-wrap">
          {ELEMENT_ORDER.map((element, index) => (
            <div key={element} className="flex items-center gap-0.5">
              <div
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]',
                  ELEMENT_COLORS[element]
                )}
              >
                <span>{getElementIcon(element)}</span>
                <span className="font-medium">{ELEMENT_NAMES[element]}</span>
              </div>
              {index < ELEMENT_ORDER.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
              )}
              {index === ELEMENT_ORDER.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
          {/* 回到第一个 */}
          <div
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]',
              ELEMENT_COLORS[ELEMENT_ORDER[0]]
            )}
          >
            <span>{getElementIcon(ELEMENT_ORDER[0])}</span>
            <span className="font-medium">{ELEMENT_NAMES[ELEMENT_ORDER[0]]}</span>
          </div>
        </div>
        
        {/* 光暗互克 */}
        <div className="flex items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-border/30">
          <div
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]',
              ELEMENT_COLORS['light']
            )}
          >
            <span>{getElementIcon('light')}</span>
            <span className="font-medium">{ELEMENT_NAMES['light']}</span>
          </div>
          <ArrowLeftRight className="w-3 h-3 text-yellow-400 shrink-0" />
          <div
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]',
              ELEMENT_COLORS['dark']
            )}
          >
            <span>{getElementIcon('dark')}</span>
            <span className="font-medium">{ELEMENT_NAMES['dark']}</span>
          </div>
          <span className="text-[9px] text-muted-foreground ml-1">互克 ±20%</span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 武器克制循环图
 */
export function WeaponRestraintChart({ className }: { className?: string }) {
  return (
    <Card className={cn('border-border/50', className)}>
      <CardHeader className="py-1.5 px-3">
        <CardTitle className="text-xs flex items-center gap-2">
          <Swords className="w-3.5 h-3.5 text-blue-400" />
          武器克制
          <span className="text-muted-foreground font-normal text-[9px]">(+25%伤害)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-2">
        {/* 循环克制 */}
        <div className="flex items-center justify-center gap-0.5 flex-wrap">
          {WEAPON_ORDER.map((weapon, index) => (
            <div key={weapon} className="flex items-center gap-0.5">
              <div
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]',
                  WEAPON_COLORS[weapon]
                )}
              >
                <span>{getWeaponCategoryIcon(weapon)}</span>
                <span className="font-medium">{WEAPON_CATEGORY_NAMES[weapon]}</span>
              </div>
              {index < WEAPON_ORDER.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
              )}
              {index === WEAPON_ORDER.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
          {/* 回到第一个 */}
          <div
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]',
              WEAPON_COLORS[WEAPON_ORDER[0]]
            )}
          >
            <span>{getWeaponCategoryIcon(WEAPON_ORDER[0])}</span>
            <span className="font-medium">{WEAPON_CATEGORY_NAMES[WEAPON_ORDER[0]]}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 保留兼容导出
export const RestraintChart = ElementRestraintChart;
