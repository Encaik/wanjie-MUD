'use client';

import { Heart, Shield, Sparkles, Swords, Zap } from 'lucide-react';

import type { AttributeTemplate } from '@/core/types';
import type { CharacterTemplate } from '@/modules/identity/hooks';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { cn } from '@/shared/utils';

// ============================================
// 常量
// ============================================

/** 天赋稀有度配色 */
const RARITY: Record<string, { bg: string; text: string; border: string; label: string }> = {
  common:    { bg: 'bg-muted/30',       text: 'text-muted-foreground',           border: 'border-border',            label: '普通' },
  uncommon:  { bg: 'bg-emerald-500/8',  text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', label: '稀有' },
  rare:      { bg: 'bg-blue-500/8',     text: 'text-blue-600 dark:text-blue-400',      border: 'border-blue-500/30',    label: '罕见' },
  epic:      { bg: 'bg-purple-500/8',   text: 'text-purple-600 dark:text-purple-400',  border: 'border-purple-500/30',  label: '史诗' },
  legendary: { bg: 'bg-amber-500/8',    text: 'text-amber-600 dark:text-amber-400',    border: 'border-amber-500/30',   label: '传说' },
};

/** 核心值图标 */
const CORE_ICONS: Record<string, { icon: typeof Heart; color: string; label: string }> = {
  maxHp:       { icon: Heart,  color: 'text-red-400',    label: '生命' },
  physicalATK: { icon: Swords, color: 'text-orange-400', label: '物攻' },
  specialATK:  { icon: Zap,    color: 'text-amber-400',  label: '特攻' },
  speed:       { icon: Shield, color: 'text-sky-400',    label: '速度' },
};

// ============================================
// 子组件
// ============================================

/**
 * 命星之镜 — 圆形装饰锚点
 *
 * 铜镜质感径向渐变 + 金色边框，居中显示性别符号和种族名。
 * hover 时触发金边辉光。
 */
function DestinyMirror({ gender, raceName, isMale }: {
  gender: string;
  raceName?: string;
  isMale: boolean;
}) {
  return (
    <div className="flex justify-center">
      <div
        className={cn(
          'relative w-16 h-16 rounded-full flex flex-col items-center justify-center',
          'border-2 transition-shadow duration-300',
          'group-hover:shadow-[0_0_25px_0_rgba(251,191,36,0.3)]',
          isMale
            ? 'border-amber-400/50 bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.15),rgba(180,120,40,0.08),rgba(80,60,30,0.05))]'
            : 'border-slate-300/50 bg-[radial-gradient(circle_at_50%_40%,rgba(200,210,220,0.15),rgba(150,160,170,0.08),rgba(100,110,120,0.05))]',
        )}
        aria-hidden="true"
      >
        <span className={cn('text-lg leading-none', isMale ? 'text-blue-400/70' : 'text-pink-400/70')}>
          {gender === '男' ? '♂' : '♀'}
        </span>
        {raceName && (
          <span className="text-[8px] text-muted-foreground/60 font-serif mt-0.5">{raceName}</span>
        )}
      </div>
    </div>
  );
}

/** 经脉图属性条 */
function MeridianBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 50;
  const isHigh = value >= 12;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-9 shrink-0 truncate font-serif">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isHigh
              ? 'bg-gradient-to-r from-amber-400 to-amber-200'
              : 'bg-gradient-to-r from-amber-400/60 to-amber-100/40',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn(
        'text-[10px] font-semibold tabular-nums w-4 text-right',
        isHigh ? 'text-amber-500' : 'text-foreground/60',
      )}>
        {value}
      </span>
    </div>
  );
}

/** 印章风格天赋徽章 */
function TalentSeal({ talent }: { talent: { id: string; name: string; description: string; rarity: string } }) {
  const s = RARITY[talent.rarity] ?? RARITY.common;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          'inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-serif cursor-help shrink-0',
          'border-[1.5px] rounded-sm -rotate-1 tracking-wider',
          s.border, s.text, s.bg,
        )}>
          {talent.rarity === 'legendary' && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
          {talent.name}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] p-2">
        <div className="flex items-center gap-1 mb-0.5">
          <span className={cn('text-[10px] px-1 py-px rounded border-[1px] font-serif', s.border, s.text)}>
            {s.label}
          </span>
          <span className="font-medium text-xs">{talent.name}</span>
        </div>
        <div className="text-[10px] text-muted-foreground">{talent.description}</div>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================
// 主组件
// ============================================

interface CharacterCardProps {
  character: CharacterTemplate;
  index: number;
  onSelect: (index: number) => void;
  visualConfig?: { icon: string; accentColor: string; gradientClass: string; borderColor: string; bgGradient: string; colorGradient: string };
  attributeDefinitions?: AttributeTemplate[];
}

/**
 * 角色卡牌 — 命星
 *
 * 每个角色是一颗"命星"，包含：
 * - 命星之镜（圆形铜镜装饰）
 * - 经脉图属性条（金色渐变填充）
 * - 印章风格天赋徽章
 * - 核心值展示
 * - 选定按钮
 */
export function CharacterCard({
  character, index, onSelect, visualConfig, attributeDefinitions,
}: CharacterCardProps) {
  const numericAttrs = Object.entries(character.attributes)
    .filter(([, v]) => typeof v === 'number')
    .sort(([, a], [, b]) => (b as number) - (a as number)) as [string, number][];

  const maxAttr = Math.max(...numericAttrs.map(([, v]) => v), 1);
  const isMale = character.gender === '男';
  const getAttrLabel = (key: string) => attributeDefinitions?.find(a => a.key === key)?.displayName ?? key;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden cursor-pointer',
        'border-2 rounded-xl transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-1',
        'bg-card',
        visualConfig?.borderColor ?? 'border-border',
      )}
      style={{ animation: `fade-in-up 0.5s ease-out ${index * 0.08}s both` }}
      onClick={() => onSelect(character.index)}
    >
      {/* ===== 四角隅饰 ===== */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400/30 rounded-tl-sm opacity-50 group-hover:opacity-80 transition-opacity" aria-hidden="true" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400/30 rounded-tr-sm opacity-50 group-hover:opacity-80 transition-opacity" aria-hidden="true" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400/30 rounded-bl-sm opacity-50 group-hover:opacity-80 transition-opacity" aria-hidden="true" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400/30 rounded-br-sm opacity-50 group-hover:opacity-80 transition-opacity" aria-hidden="true" />

      {/* ===== 世界观渐变背景 ===== */}
      {visualConfig && (
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity duration-300',
          'group-hover:opacity-35',
          visualConfig.gradientClass,
        )} />
      )}

      <div className="p-3 flex flex-col flex-1 relative gap-2.5">
        {/* ===== 命星之镜 ===== */}
        <DestinyMirror
          gender={character.gender}
          raceName={character.race?.name}
          isMale={isMale}
        />

        {/* ===== 名字 + 装饰线 ===== */}
        <div className="text-center space-y-1">
          <span className="text-sm font-bold text-foreground font-serif tracking-[0.15em]">
            {character.name}
          </span>
          <div className="flex items-center gap-1 justify-center">
            <span className="h-px w-6 bg-gradient-to-r from-transparent via-border/30 to-transparent" />
            <span className="text-[8px] text-muted-foreground/20">◆</span>
            <span className="h-px w-6 bg-gradient-to-r from-transparent via-border/30 to-transparent" />
          </div>
        </div>

        {/* ===== 种族/性别标签 ===== */}
        <div className="flex items-center justify-center gap-1 flex-wrap">
          <Badge variant="outline" className={cn('text-[9px] px-1.5 font-serif', isMale
            ? 'border-blue-400/30 text-blue-500'
            : 'border-pink-400/30 text-pink-500',
          )}>
            {character.gender}
          </Badge>
          {character.race && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-[9px] px-1.5 cursor-help font-serif">
                  {character.race.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] p-2">
                <span className="text-[10px] text-muted-foreground">{character.race.description}</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ===== 天赋（印章风格） ===== */}
        <div className="flex items-center justify-center gap-1 flex-wrap min-h-[22px]">
          {character.talents && character.talents.length > 0 ? (
            character.talents.map(t => <TalentSeal key={t.id} talent={t} />)
          ) : (
            <span className="text-[9px] text-muted-foreground/25 italic font-serif">无特殊天赋</span>
          )}
        </div>

        {/* ===== 经脉图属性条 ===== */}
        <div className="rounded-lg border border-border/30 bg-muted/10 p-2.5 space-y-1.5">
          <div className="text-[9px] text-muted-foreground/50 tracking-wide font-serif text-center mb-0.5">
            经脉资质
          </div>
          {numericAttrs.slice(0, 5).map(([key, value]) => (
            <MeridianBar key={key} label={getAttrLabel(key)} value={value} max={maxAttr} />
          ))}
        </div>

        {/* ===== 核心值 ===== */}
        <div className="flex justify-center gap-3 flex-wrap mt-auto">
          {Object.entries(CORE_ICONS).map(([key, { icon: Icon, color, label }]) => {
            const val = character.coreStats[key as keyof typeof character.coreStats];
            if (val === undefined) return null;
            return (
              <div key={key} className="flex items-center gap-1 text-[10px]">
                <Icon className={cn('w-3 h-3', color)} />
                <span className="text-muted-foreground/60 font-serif">{label}</span>
                <span className="font-semibold tabular-nums text-foreground">{Math.round(val as number)}</span>
              </div>
            );
          })}
        </div>

        {/* ===== 选定按钮 ===== */}
        <Button
          className={cn(
            'w-full font-serif tracking-[0.15em] text-xs h-9',
            'transition-all duration-300',
            'group-hover:shadow-md group-hover:shadow-primary/10',
          )}
          size="sm"
        >
          <Sparkles className="w-3 h-3 mr-1.5 opacity-70" />
          选定此身
        </Button>
      </div>
    </div>
  );
}
