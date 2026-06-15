'use client';

import { Sparkles } from 'lucide-react';

import type { AttributeTemplate } from '@/core/types';
import type { CharacterTemplate } from '@/modules/identity/hooks';
import type { RadarAxis, RadarSeries } from '@/shared/components/RadarChart';
import { Badge } from '@/shared/ui/data-display/badge';
import { Button } from '@/shared/ui/actions/button';
import { RadarChart } from '@/shared/components/RadarChart';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/overlay/tooltip';
import { cn, useDebounce } from '@/shared/utils';

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

/** 经脉属性轴线色 */
const MERIDIAN_LABEL_COLORS = [
  'oklch(0.55 0.14 55)',   // 琥珀 → 体质(土)
  'oklch(0.50 0.12 145)',  // 翠绿 → 灵根(木)
  'oklch(0.50 0.12 240)',  // 天蓝 → 悟性(水)
  'oklch(0.50 0.14 300)',  // 紫色 → 幸运(火)
  'oklch(0.55 0.14 25)',   // 玫红 → 意志(金)
];

/** 核心值轴线色 */
const CORE_LABEL_COLORS = [
  'oklch(0.50 0.15 20)',   // 红 → 生命
  'oklch(0.50 0.14 50)',   // 橙 → 物攻
  'oklch(0.50 0.14 80)',   // 黄 → 特攻
  'oklch(0.50 0.12 200)',  // 蓝 → 速度
];

/** 核心值内部键 → 显示名 */
const CORE_LABELS: Record<string, string> = {
  maxHp: '生命', physicalATK: '物攻', specialATK: '特攻', speed: '速度',
};
const CORE_KEYS = ['maxHp', 'physicalATK', 'specialATK', 'speed'] as const;

// ============================================
// 子组件
// ============================================

/** 命星之镜 — 圆形装饰锚点 */
function DestinyMirror({ gender, raceName, isMale }: {
  gender: string;
  raceName?: string;
  isMale: boolean;
}) {
  return (
    <div className="flex justify-center">
      <div
        className={cn(
          'relative w-12 h-12 rounded-full flex flex-col items-center justify-center',
          'border-2 transition-all duration-500',
          'group-hover:shadow-[0_0_30px_0_rgba(251,191,36,0.25)] group-hover:scale-105',
          isMale
            ? 'border-amber-400/40 bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.12),rgba(180,120,40,0.06),rgba(80,60,30,0.03))]'
            : 'border-slate-300/40 bg-[radial-gradient(circle_at_50%_40%,rgba(200,210,220,0.12),rgba(150,160,170,0.06),rgba(100,110,120,0.03))]',
        )}
        aria-hidden="true"
      >
        <span className={cn('text-base leading-none', isMale ? 'text-blue-400/60' : 'text-pink-400/60')}>
          {gender === '男' ? '♂' : '♀'}
        </span>
        {raceName && (
          <span className="text-[8px] text-muted-foreground/50 font-serif mt-0.5 tracking-wider">{raceName}</span>
        )}
      </div>
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
          'transition-all duration-200 hover:scale-105',
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
 * - 命星之镜（圆形铜镜装饰，hover 辉光）
 * - 双雷达图（经脉五维 + 核心四维，固定轴序）
 * - 印章风格天赋徽章
 * - 选定按钮
 */
export function CharacterCard({
  character, index, onSelect, visualConfig, attributeDefinitions,
}: CharacterCardProps) {
  const isMale = character.gender === '男';
  const getAttrLabel = (key: string) => attributeDefinitions?.find(a => a.key === key)?.displayName ?? key;
  const handleSelect = useDebounce(() => onSelect(character.index), 600);

  // ---- 经脉雷达图（attributeDefinitions 固定顺序） ----
  const numericAttrDefs = (attributeDefinitions ?? [])
    .filter(d => d.type === 'numeric');
  const meridianEntries = numericAttrDefs
    .map(d => [d.key, (character.attributes[d.key] as number) || 0] as const);
  const meridianValues = meridianEntries.map(([, v]) => v);
  const meridianMax = Math.max(...meridianValues, 1);

  const meridianAxes: RadarAxis[] = meridianEntries.map(([,], i) => ({
    label: getAttrLabel(numericAttrDefs[i].key),
    color: MERIDIAN_LABEL_COLORS[i % MERIDIAN_LABEL_COLORS.length],
  }));

  const meridianIndices = meridianAxes.map((_, i) => i);
  const meridianSeries: RadarSeries = {
    values: meridianValues.map(v => v / meridianMax),
    rawValues: meridianValues,
    axisIndices: meridianIndices,
    fillColor: 'oklch(0.65 0.14 55)',
    strokeColor: 'oklch(0.55 0.14 55)',
  };

  // ---- 核心值雷达图（固定轴序：CORE_KEYS） ----
  const coreValues = CORE_KEYS.map(k => (character.coreStats[k as keyof typeof character.coreStats] as number) || 0);
  const coreMax = Math.max(...coreValues, 1);

  const coreAxes: RadarAxis[] = CORE_KEYS.map((k, i) => ({
    label: CORE_LABELS[k],
    color: CORE_LABEL_COLORS[i],
  }));

  const coreSeries: RadarSeries = {
    values: coreValues.map(v => v / coreMax),
    rawValues: coreValues,
    axisIndices: [0, 1, 2, 3],
    fillColor: 'oklch(0.55 0.12 260)',
    strokeColor: 'oklch(0.50 0.14 260)',
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden',
        'border-2 rounded-xl transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-1',
        'bg-card',
        visualConfig?.borderColor ?? 'border-border',
      )}
      style={{ animation: `fade-in-up 0.5s ease-out ${index * 0.08}s both` }}
    >
      {/* ===== 四角隅饰 ===== */}
      {(['top-0 left-0 border-t-2 border-l-2 rounded-tl-sm',
        'top-0 right-0 border-t-2 border-r-2 rounded-tr-sm',
        'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm',
        'bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm',
      ] as const).map((pos, i) => (
        <span
          key={i}
          className={cn(
            'absolute w-3.5 h-3.5 border-amber-400/20 opacity-30',
            'transition-opacity duration-500 group-hover:opacity-70',
            pos,
          )}
          aria-hidden="true"
        />
      ))}

      {/* ===== 世界观渐变背景 ===== */}
      {visualConfig && (
        <div className={cn(
          'absolute inset-0 bg-linear-to-br opacity-15 transition-opacity duration-500',
          'group-hover:opacity-30',
          visualConfig.gradientClass,
        )} />
      )}

      {/* ===== 顶部氛围光 ===== */}
      <div className={cn(
        'absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px',
        'bg-linear-to-r from-transparent via-amber-400/30 to-transparent',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-500',
      )} />

      <div className="p-2.5 flex flex-col flex-1 relative gap-1.5">
        {/* ===== 命星之镜 ===== */}
        <DestinyMirror
          gender={character.gender}
          raceName={character.race?.name}
          isMale={isMale}
        />

        {/* ===== 名字 ===== */}
        <div className="text-center space-y-0.5">
          <span className="text-xs font-bold text-foreground font-serif tracking-[0.15em]">
            {character.name}
          </span>
          <div className="flex items-center gap-1 justify-center">
            <span className="h-px w-6 bg-linear-to-r from-transparent via-border/25 to-transparent" />
            <span className="text-[6px] text-muted-foreground/15">◆</span>
            <span className="h-px w-6 bg-linear-to-r from-transparent via-border/25 to-transparent" />
          </div>
        </div>

        {/* ===== 种族/性别 ===== */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-2 py-0.5 font-serif font-medium tracking-wide',
              'transition-all duration-200',
              isMale
                ? 'border-blue-400/30 text-blue-500 bg-blue-500/5'
                : 'border-pink-400/30 text-pink-500 bg-pink-500/5',
            )}
          >
            {character.gender}
          </Badge>
          {character.race && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 cursor-help font-serif font-medium tracking-wide">
                  {character.race.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] p-2">
                <span className="text-[10px] text-muted-foreground">{character.race.description}</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ===== 天赋 ===== */}
        <div className="flex items-center justify-center gap-1 flex-wrap min-h-[18px]">
          {character.talents && character.talents.length > 0 ? (
            character.talents.map(t => <TalentSeal key={t.id} talent={t} />)
          ) : (
            <span className="text-[9px] text-muted-foreground/20 italic font-serif">无特殊天赋</span>
          )}
        </div>

        {/* ===== 双雷达图 ===== */}
        <div className="flex justify-center items-start gap-2">
          {/* 经脉五维 */}
          <div className="flex flex-col items-center gap-0.5 flex-1">
            <RadarChart
              axes={meridianAxes}
              series={[meridianSeries]}
              size={130}
              className="w-full max-w-[105px]"
            />
            <span className="text-[9px] text-muted-foreground/50 font-serif tracking-wider">
              经脉资质
            </span>
          </div>

          {/* 核心四维 */}
          <div className="flex flex-col items-center gap-0.5 flex-1">
            <RadarChart
              axes={coreAxes}
              series={[coreSeries]}
              size={120}
              className="w-full max-w-[95px]"
            />
            <span className="text-[9px] text-muted-foreground/50 font-serif tracking-wider">
              核心值
            </span>
          </div>
        </div>

        {/* ===== 选定按钮 ===== */}
        <Button
          onClick={handleSelect}
          className={cn(
            'w-full font-serif tracking-[0.15em] text-xs h-7 mt-auto',
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
