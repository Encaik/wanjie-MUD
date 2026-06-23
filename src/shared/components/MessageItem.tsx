/**
 * 消息项渲染组件 — 支持新旧物品格式兼容
 */

'use client';

import { memo } from 'react';

import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

import type { MessageRecord, ItemRarity } from '@/core/types';
import { resolveItem } from '@/modules/item/logic';
import type { ItemInstance } from '@/modules/item/types';
import { getRarityStyle } from '@/modules/theme/data/rarityStyles';
import { Badge } from '@/shared/ui/data-display/badge';

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
                    // 兼容新旧物品格式：新格式有 templateId，旧格式有 definition
                    const raw = item as unknown as Record<string, unknown>;
                    let itemName: string;
                    let itemRarity: ItemRarity = '普通';
                    let quantity: number = 1;

                    if (raw.templateId) {
                      // 新格式 ItemInstance
                      const resolved = resolveItem(item as unknown as ItemInstance);
                      itemName = resolved.name;
                      quantity = resolved.quantity;
                      // Rarity (英文) → ItemRarity (中文) 映射
                      const rarityMap: Record<string, ItemRarity> = {
                        mythic: '神话', legendary: '传说', epic: '史诗',
                        rare: '稀有', uncommon: '稀有', common: '普通',
                        poor: '普通', basic: '普通',
                      };
                      itemRarity = rarityMap[resolved.rarity] || '普通';
                    } else if ((raw as { definition?: { name?: string; rarity?: ItemRarity } }).definition) {
                      // 旧格式 InventoryItem
                      const def = (raw as { definition: { name?: string; rarity?: ItemRarity } }).definition;
                      itemName = def.name || '未知物品';
                      itemRarity = def.rarity || '普通';
                      quantity = (raw as { quantity?: number }).quantity || 1;
                    } else {
                      itemName = '未知物品';
                    }
                    const displayText = quantity > 1 ? `${itemName} x${quantity}` : itemName;
                    return (
                      <Badge
                        key={idx}
                        className={`text-[9px] h-4 ${getRarityStyle(itemRarity, 'badge')}`}
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
                      type: string;
                    }>();
                    for (const fragment of msg.rewards.fragments as Array<Record<string, unknown>>) {
                      const sourceName = (fragment.sourceName || fragment.name) as string || '';
                      const rarity = (fragment.rarity || '普通') as ItemRarity;
                      const count = (fragment.count || fragment.quantity || 1) as number;
                      const type = (fragment.type || fragment.sourceCategory || '') as string;
                      const key = sourceName || `${rarity}-${type}`;
                      const existing = fragmentMap.get(key);
                      if (existing) {
                        existing.count += count;
                      } else {
                        fragmentMap.set(key, {
                          name: sourceName || `${rarity}${type ? ` ${type}` : ''}残片`,
                          rarity,
                          count,
                          type,
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
