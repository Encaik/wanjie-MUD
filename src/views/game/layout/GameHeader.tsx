'use client';

import { Clock, Gem, Globe, Settings } from 'lucide-react';

import { formatGameTimeShort } from '@/core/time';
import type { TimeState } from '@/core/time';
import { Badge } from '@/shared/ui/data-display/badge';

interface GameHeaderProps {
  /** 世界基本信息（名称、类型） */
  world: { name: string; type: string };
  /** 灵石数量 */
  spiritStones: number;
  /** 货币显示名称（世界相关） */
  currencyName: string;
  /** 游戏时间 */
  timeSystem?: TimeState;
  /** 活跃状态文本（如"自动修炼中"、"炼丹中"、"炼器中"），null/undefined 时不显示 */
  activeStatus?: string | null;
  /** 点击设置按钮 */
  onSettings?: () => void;
}

/**
 * GameHeader — 游戏顶栏
 *
 * 定位为"世界上下文 + 全局资源 + 活跃状态"，与左侧 StatusPanel（角色详情）互补。
 * 不再显示 HP/MP/EXP/境界/等级/流派/心境/飞升次数/角色名（这些在 StatusPanel 完整展示）。
 */
export function GameHeader({
  world,
  spiritStones,
  currencyName,
  timeSystem,
  activeStatus,
  onSettings,
}: GameHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      {/* ====== 移动端布局（< sm） ====== */}
      <div className="flex flex-col gap-1 sm:hidden">
        {/* 第一行：世界名 + 世界类型 */}
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-[11px] font-medium font-serif tracking-wider truncate">{world.name}</span>
          <Badge variant="outline" className="text-[9px] px-1 shrink-0">{world.type}</Badge>
        </div>

        {/* 第二行：游戏时间 + 灵石 */}
        <div className="flex items-center gap-2">
          {timeSystem && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
              <span className="tabular-nums">{formatGameTimeShort(timeSystem)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
            <Gem className="w-3 h-3 text-cyan-500 shrink-0" />
            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">{spiritStones.toLocaleString()}</span>
          </div>
        </div>

        {/* 第三行：活跃状态 + 设置 */}
        <div className="flex items-center gap-2">
          {activeStatus && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-[10px] text-muted-foreground">{activeStatus}</span>
            </div>
          )}
          <div className="flex-1" />
          {onSettings && (
            <button
              onClick={onSettings}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground shrink-0"
              title="偏好设置"
              aria-label="打开偏好设置"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ====== 桌面端布局（≥ sm）：单行左右分散 ====== */}
      <div className="hidden sm:flex sm:items-center sm:gap-4">
        {/* 左侧：世界上下文 | 时间 | 灵石 */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          {/* 世界上下文 */}
          <div className="flex items-center gap-2 shrink-0">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-serif font-medium tracking-wider truncate max-w-[140px]">{world.name}</span>
            <Badge variant="outline" className="text-[10px] shrink-0">{world.type}</Badge>
          </div>

          {/* 渐变分隔线 */}
          <div className="w-px h-5 bg-gradient-to-b from-transparent via-border to-transparent shrink-0" />

          {/* 游戏时间 */}
          {timeSystem && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs text-muted-foreground tabular-nums">{formatGameTimeShort(timeSystem)}</span>
            </div>
          )}

          {/* 渐变分隔线 */}
          <div className="w-px h-5 bg-gradient-to-b from-transparent via-border to-transparent shrink-0" />

          {/* 灵石 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 shrink-0">
            <Gem className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-serif tracking-wider">{currencyName}</span>
              <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300 tabular-nums">{spiritStones.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 弹性空白 —— 分隔左右 */}
        <div className="flex-1 min-w-0" />

        {/* 右侧：活跃状态 | 设置 */}
        <div className="flex items-center gap-3 shrink-0">
          {/* 活跃状态指示器 */}
          {activeStatus && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-[10px] text-muted-foreground">{activeStatus}</span>
            </div>
          )}

          {/* 设置 */}
          {onSettings && (
            <button
              onClick={onSettings}
              className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground shrink-0"
              title="偏好设置"
              aria-label="打开偏好设置"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
