/**
 * 战斗者信息面板组件
 * 
 * 紧凑设计：简化血条，移除冗余信息
 */

'use client';

import { 
  Heart, Zap, Swords, Shield, User, Skull, 
  Crown, Star
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatBuff } from '@/lib/game/battle';
import { 
  getElementIcon, 
  getWeaponCategoryIcon, 
  ELEMENT_NAMES, 
  WEAPON_CATEGORY_NAMES,
  EnemyAttributes,
} from '@/lib/game/restraintSystem';
import { Technique, Equipment, EnemyTier } from '@/lib/game/types';
import { Element, WeaponCategory } from '@/lib/game/types';

/** 敌人类型显示配置 */
const TIER_CONFIG: Record<EnemyTier, { name: string; icon: React.ReactNode; color: string }> = {
  normal: { name: '', icon: null, color: '' },
  elite: { name: '精英', icon: <Star className="w-2.5 h-2.5" />, color: 'text-yellow-500' },
  miniboss: { name: '小Boss', icon: <Crown className="w-2.5 h-2.5" />, color: 'text-orange-500' },
  boss: { name: 'Boss', icon: <Crown className="w-2.5 h-2.5" />, color: 'text-red-500' },
};

interface CombatantPanelProps {
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  attack: number;
  defense: number;
  isPlayer: boolean;
  buffs?: StatBuff[];
  attributes?: EnemyAttributes;
  /** 玩家功法（仅玩家显示） */
  techniques?: Technique[];
  /** 玩家武器（仅玩家显示） */
  weapons?: { melee: Equipment | null; ranged: Equipment | null };
  /** 敌人类型（仅敌人显示） */
  tier?: EnemyTier;
  /** 是否存活 */
  isAlive?: boolean;
  /** 是否被选中（多敌人战斗） */
  isSelected?: boolean;
}

export function CombatantPanel({
  name,
  level,
  currentHp,
  maxHp,
  currentMp,
  maxMp,
  attack,
  defense,
  isPlayer,
  buffs = [],
  attributes,
  tier,
  isAlive = true,
  isSelected = false,
}: CombatantPanelProps) {
  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  const mpPercent = maxMp > 0 ? Math.max(0, Math.min(100, (currentMp / maxMp) * 100)) : 0;
  
  // 获取敌人类型配置
  const tierConfig = tier ? TIER_CONFIG[tier] : null;

  return (
    <div className={`p-2 rounded-lg border text-xs transition-all ${
      !isAlive 
        ? 'opacity-40 grayscale' 
        : isSelected
          ? 'ring-2 ring-primary bg-primary/5'
          : isPlayer 
            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/50' 
            : 'bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/50'
    }`}>
      {/* 头部：名称 + 等级 + 类型 */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1 min-w-0">
          {isPlayer ? (
            <User className="w-3 h-3 text-blue-500 flex-shrink-0" />
          ) : !isAlive ? (
            <Skull className="w-3 h-3 text-gray-400 flex-shrink-0" />
          ) : tierConfig?.icon ? (
            <span className={tierConfig.color + ' flex-shrink-0'}>{tierConfig.icon}</span>
          ) : (
            <Skull className="w-3 h-3 text-red-500 flex-shrink-0" />
          )}
          <span className={`font-medium truncate ${
            !isAlive ? 'text-gray-400 line-through' :
            isPlayer ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'
          }`}>
            {name}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge variant="outline" className="text-[9px] h-4 px-1">
            Lv.{level}
          </Badge>
          {tierConfig && tier !== 'normal' && (
            <Badge variant="secondary" className={`text-[9px] h-4 px-1 ${tierConfig.color}`}>
              {tierConfig.name}
            </Badge>
          )}
        </div>
      </div>

      {/* HP条 - 简化为一行 */}
      <div className="flex items-center gap-1.5 mb-1">
        <Heart className="w-3 h-3 text-red-500 flex-shrink-0" />
        <Progress value={hpPercent} className="h-2 flex-1" />
        <span className="text-[10px] font-medium tabular-nums w-16 text-right">
          {Math.max(0, currentHp)}/{maxHp}
        </span>
      </div>

      {/* MP条 - 简化为一行 */}
      {maxMp > 0 && (
        <div className="flex items-center gap-1.5 mb-1">
          <Zap className="w-3 h-3 text-blue-500 flex-shrink-0" />
          <Progress
            value={mpPercent}
            className="h-2 flex-1 bg-blue-100 dark:bg-blue-950 [&>div]:bg-blue-500"
          />
          <span className="text-[10px] font-medium tabular-nums w-16 text-right">
            {currentMp}/{maxMp}
          </span>
        </div>
      )}

      {/* 属性值 - 简化为一行 */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Swords className="w-2.5 h-2.5" /> {attack}
        </span>
        <span className="flex items-center gap-0.5">
          <Shield className="w-2.5 h-2.5" /> {defense}
        </span>
        {/* 敌人元素属性 */}
        {attributes?.element && !isPlayer && (
          <Badge variant="outline" className="text-[9px] h-4 px-1">
            {getElementIcon(attributes.element)}
          </Badge>
        )}
        {/* Buff */}
        {buffs.length > 0 && buffs.slice(0, 2).map((buff, index) => (
          <Badge
            key={buff.id || index}
            variant="outline"
            className="text-[9px] h-4 px-1"
          >
            {buff.icon || buff.name || buff.stat}
          </Badge>
        ))}
        {buffs.length > 2 && (
          <span className="text-[9px] text-muted-foreground">+{buffs.length - 2}</span>
        )}
      </div>
    </div>
  );
}
