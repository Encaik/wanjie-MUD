/**
 * 克制关系显示组件
 * 
 * 显示元素克制和武器克制关系
 */

'use client';

import { ArrowRight, AlertTriangle, Check, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  calculateRestraintResult,
  getElementIcon,
  getWeaponCategoryIcon,
  ELEMENT_NAMES,
  WEAPON_CATEGORY_NAMES,
  ELEMENT_COUNTER_MAP,
  WEAPON_COUNTER_MAP,
} from '@/lib/game/restraintSystem';
import type { EnemyAttributes } from '@/lib/game/restraintSystem';
import { Element, WeaponCategory } from '@/lib/game/types';

interface RestraintDisplayProps {
  playerElement: Element | null;
  playerWeaponCategory: WeaponCategory | null;
  enemyAttributes: EnemyAttributes;
}

export function RestraintDisplay({
  playerElement,
  playerWeaponCategory,
  enemyAttributes,
}: RestraintDisplayProps) {
  // 计算元素克制
  const elementRestraint = calculateRestraintResult(
    playerElement,
    enemyAttributes.element,
    null,
    null
  );

  // 计算武器克制
  const weaponRestraint = calculateRestraintResult(
    null,
    null,
    playerWeaponCategory,
    enemyAttributes.weaponCategory
  );

  // 是否有克制关系
  const hasElementRestraint = elementRestraint.restraintType !== 'neutral';
  const hasWeaponRestraint = weaponRestraint.restraintType !== 'neutral';

  if (!hasElementRestraint && !hasWeaponRestraint) {
    return null;
  }

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-2">
        <div className="flex items-center gap-4 text-xs">
          {/* 元素克制 */}
          {enemyAttributes.element && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">元素:</span>
              <RestraintBadge
                type="element"
                restraint={elementRestraint.restraintType}
                multiplier={elementRestraint.damageMultiplier}
                playerValue={playerElement}
                enemyValue={enemyAttributes.element}
              />
            </div>
          )}

          {/* 武器克制 */}
          {enemyAttributes.weaponCategory && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">武器:</span>
              <RestraintBadge
                type="weapon"
                restraint={weaponRestraint.restraintType}
                multiplier={weaponRestraint.damageMultiplier}
                playerValue={playerWeaponCategory}
                enemyValue={enemyAttributes.weaponCategory}
              />
            </div>
          )}
        </div>

        {/* 克制提示 */}
        <div className="mt-1 text-[10px] text-muted-foreground">
          {hasElementRestraint && elementRestraint.restraintType === 'counter' && (
            <span className="text-green-600">元素克制！伤害提升</span>
          )}
          {hasElementRestraint && elementRestraint.restraintType === 'countered' && (
            <span className="text-red-600">被克制！伤害降低</span>
          )}
          {hasWeaponRestraint && weaponRestraint.restraintType === 'counter' && (
            <span className="text-green-600 ml-2">武器克制！伤害提升</span>
          )}
          {hasWeaponRestraint && weaponRestraint.restraintType === 'countered' && (
            <span className="text-red-600 ml-2">被克制！伤害降低</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** 克制标记组件 */
interface RestraintBadgeProps {
  type: 'element' | 'weapon';
  restraint: 'counter' | 'countered' | 'mutual' | 'neutral';
  multiplier: number;
  playerValue: Element | WeaponCategory | null;
  enemyValue: Element | WeaponCategory;
}

function RestraintBadge({
  type,
  restraint,
  multiplier,
  playerValue,
  enemyValue,
}: RestraintBadgeProps) {
  const getIcon = (value: Element | WeaponCategory | null) => {
    if (!value) return '?';
    return type === 'element' ? getElementIcon(value as Element) : getWeaponCategoryIcon(value as WeaponCategory);
  };

  const getName = (value: Element | WeaponCategory | null) => {
    if (!value) return '未知';
    return type === 'element' 
      ? (ELEMENT_NAMES[value as Element] || value) 
      : (WEAPON_CATEGORY_NAMES[value as WeaponCategory] || value);
  };

  const badgeVariant = restraint === 'counter' 
    ? 'default' 
    : restraint === 'countered' 
      ? 'destructive' 
      : 'secondary';

  return (
    <div className="flex items-center gap-1">
      {/* 玩家属性 */}
      <Badge variant="outline" className="text-[10px]">
        {getIcon(playerValue)} {getName(playerValue)}
      </Badge>

      <ArrowRight className="w-3 h-3 text-muted-foreground" />

      {/* 敌人属性 */}
      <Badge variant={badgeVariant} className="text-[10px]">
        {getIcon(enemyValue)} {getName(enemyValue)}
      </Badge>

      {/* 克制效果 */}
      {restraint === 'counter' && (
        <span className="text-green-600 font-medium ml-1">
          +{Math.round((multiplier - 1) * 100)}%
        </span>
      )}
      {restraint === 'countered' && (
        <span className="text-red-600 font-medium ml-1">
          {Math.round((1 - multiplier) * 100)}%
        </span>
      )}
      {restraint === 'mutual' && (
        <span className="text-purple-600 font-medium ml-1">
          ±20%
        </span>
      )}
    </div>
  );
}

/** 元素克制循环图 */
export function ElementRestraintCycle() {
  const elements = Object.keys(ELEMENT_COUNTER_MAP) as Element[];

  return (
    <div className="p-4">
      <div className="text-sm font-medium mb-2">元素克制循环</div>
      <div className="flex flex-wrap gap-2">
        {elements.map((element) => {
          const countered = ELEMENT_COUNTER_MAP[element];
          return (
            <div key={element} className="flex items-center gap-1 text-xs">
              <Badge variant="outline">
                {getElementIcon(element)} {ELEMENT_NAMES[element]}
              </Badge>
              <ArrowRight className="w-3 h-3" />
              <Badge variant="secondary">
                {getElementIcon(countered)} {ELEMENT_NAMES[countered]}
              </Badge>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-muted-foreground mt-2">
        光暗互克：光↔暗，双方伤害+20%
      </div>
    </div>
  );
}

/** 武器克制循环图 */
export function WeaponRestraintCycle() {
  const weapons = Object.keys(WEAPON_COUNTER_MAP) as WeaponCategory[];

  return (
    <div className="p-4">
      <div className="text-sm font-medium mb-2">武器克制循环</div>
      <div className="flex flex-wrap gap-2">
        {weapons.map((weapon) => {
          const countered = WEAPON_COUNTER_MAP[weapon];
          return (
            <div key={weapon} className="flex items-center gap-1 text-xs">
              <Badge variant="outline">
                {getWeaponCategoryIcon(weapon)} {WEAPON_CATEGORY_NAMES[weapon]}
              </Badge>
              <ArrowRight className="w-3 h-3" />
              <Badge variant="secondary">
                {getWeaponCategoryIcon(countered)} {WEAPON_CATEGORY_NAMES[countered]}
              </Badge>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-muted-foreground mt-2">
        克制加成：+25%伤害，被克制：-15%伤害
      </div>
    </div>
  );
}
