// @ts-nocheck — TODO: 统一物品系统迁移后重构
'use client';

import { memo } from 'react';

import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

import { Badge } from '@/shared/ui/data-display/badge';
import { getRarityStyle } from '@/modules/theme/data/rarityStyles';
import { MessageRecord, ItemRarity } from '@/core/types';

/** 消息类型配置 */
export const TYPE_CONFIG = {
  success: { icon: CheckCircle, color: 'text-game-recovery', bg: 'bg-game-recovery/10' },
  failure: { icon: XCircle, color: 'text-game-combat', bg: 'bg-game-combat/10' },
  info: { icon: Info, color: 'text-game-cultivation', bg: 'bg-game-cultivation/10' },
  warning: { icon: AlertTriangle, color: 'text-game-economy', bg: 'bg-game-economy/10' },
};

/** 消息来源标签颜色 */
const CHANNEL_LABEL: Record<string, { label: string; className: string }> = {
  chat: { label: '聊天', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  announcement: { label: '公告', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
};

/** 格式化时间 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 单条消息渲染组件（memo 优化）
 */
export const MessageItem = memo(({ msg, compact }: { msg: MessageRecord; compact: boolean }) => {
  const config = TYPE_CONFIG[msg.type];
  const Icon = config.icon;
  const channelInfo = msg.channel ? CHANNEL_LABEL[msg.channel] : undefined;

  return (
    <div
      className={`p-1.5 rounded ${config.bg} [content-visibility:auto]`}
    >
      <div className="flex items-start gap-1.5">
        <Icon className={`w-3 h-3 ${config.color} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[11px] font-medium truncate">{msg.title}</span>
              {channelInfo && (
                <Badge variant="outline" className={`text-[8px] h-3.5 px-1 leading-none ${channelInfo.className}`}>
                  {channelInfo.label}
                </Badge>
              )}
            </div>
            <span className="text-[9px] text-muted-foreground shrink-0">
              {formatTime(msg.timestamp)}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-pre-wrap">
            {msg.content}
          </div>
          {msg.rewards && !compact && (
            <div className="mt-1.5 space-y-1">
              {/* 属性变化 */}
              {(() => {
                let statBadges: React.ReactNode[] = [];
                if (msg.rewards.statDetails) {
                  statBadges = msg.rewards.statDetails
                    .filter(({ base, boost }) => base !== 0 || boost !== 0)
                    .map(({ stat, base, boost }) => {
                      let displayValue = '';
                      if (base > 0 && boost > 0) {
                        displayValue = `${base}+${boost}`;
                      } else if (base > 0) {
                        displayValue = `+${base}`;
                      } else if (boost > 0) {
                        displayValue = `+${boost}`;
                      }
                      return (
                        <Badge key={stat} variant="outline" className="text-[9px] h-4">
                          {stat} {displayValue}
                        </Badge>
                      );
                    });
                } else if (msg.rewards.stats) {
                  statBadges = Object.entries(msg.rewards.stats)
                    .filter(([, value]) => Number(value) !== 0)
                    .map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-[9px] h-4">
                        {key}{Number(value) > 0 ? '+' : ''}{value}
                      </Badge>
                    ));
                }
                return statBadges.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] text-muted-foreground">属性:</span>
                    {statBadges}
                  </div>
                ) : null;
              })()}
              {/* 获得物品 */}
              {msg.rewards.items && msg.rewards.items.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-muted-foreground">物品:</span>
                  {msg.rewards.items.map((item, idx) => {
                    const itemName = item.definition?.name || '未知物品';
                    const displayText = item.quantity > 1 ? `${itemName} x${item.quantity}` : itemName;
                    return (
                      <Badge
                        key={idx}
                        className={`text-[9px] h-4 ${item.definition?.rarity ? getRarityStyle(item.definition.rarity, 'badge') : ''}`}
                      >
                        {displayText}
                      </Badge>
                    );
                  })}
                </div>
              )}
              {/* 获得功法 */}
              {msg.rewards.technique && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-muted-foreground">功法:</span>
                  <Badge className={`text-[9px] h-4 ${getRarityStyle(msg.rewards.technique.rarity, 'badge')}`}>
                    「{msg.rewards.technique.name}」
                  </Badge>
                </div>
              )}
              {/* 获得装备 */}
              {msg.rewards.equipment && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-muted-foreground">装备:</span>
                  <Badge className={`text-[9px] h-4 ${getRarityStyle(msg.rewards.equipment.rarity, 'badge')}`}>
                    「{msg.rewards.equipment.name}」
                  </Badge>
                </div>
              )}
              {/* 获得碎片 */}
              {msg.rewards.fragments && msg.rewards.fragments.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-muted-foreground">碎片:</span>
                  {(() => {
                    const fragmentMap = new Map<string, {
                      name: string;
                      rarity: ItemRarity;
                      count: number;
                      type: 'technique' | 'equipment';
                    }>();
                    for (const fragment of msg.rewards.fragments as FragmentDropData[]) {
                      const key = fragment.sourceName || `${fragment.rarity}-${fragment.type}`;
                      const existing = fragmentMap.get(key);
                      if (existing) {
                        existing.count += fragment.count;
                      } else {
                        fragmentMap.set(key, {
                          name: fragment.sourceName || `${fragment.rarity}${fragment.type === 'technique' ? '功法' : '装备'}残片`,
                          rarity: fragment.rarity,
                          count: fragment.count,
                          type: fragment.type,
                        });
                      }
                    }
                    return Array.from(fragmentMap.values()).map((frag, idx) => (
                      <Badge
                        key={idx}
                        className={`text-[9px] h-4 ${getRarityStyle(frag.rarity, 'badge')}`}
                      >
                        「{frag.name}」{frag.count > 1 ? `x${frag.count}` : ''}
                      </Badge>
                    ));
                  })()}
                </div>
              )}
              {/* 获得经验 */}
              {msg.rewards.experience && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-muted-foreground">经验:</span>
                  <Badge variant="outline" className="text-[9px] h-4">
                    +{msg.rewards.experience}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
