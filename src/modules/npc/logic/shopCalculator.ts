/**
 * 交易价格计算引擎
 *
 * 纯函数集合，处理 NPC 商店的价格折扣、库存管理、补货逻辑。
 *
 * @module modules/npc/logic
 */

import type { NPCShopItem, AttitudeLevel } from '@/core/types';

import { getAttitudeLevel } from './attitudeCalculator';

// ============================================
// 态度折扣
// ============================================

/** 态度等级对应的价格折扣比例 */
const ATTITUDE_DISCOUNT: Record<AttitudeLevel, number> = {
  adoration: 0.40,  // 崇拜：6 折
  friendly:  0.20,  // 友好：8 折
  amiable:   0.05,  // 善意：95 折
  neutral:   0.00,  // 中立：原价
  cold:      -1.00, // 冷淡：拒绝交易（特殊标记）
  hostile:   -1.00, // 敌视：拒绝
  vengeful:  -1.00, // 仇恨：拒绝
};

/**
 * 判断态度等级是否允许交易
 *
 * @param attitudeLevel - 态度等级
 * @returns true = 允许交易
 */
export function canTrade(attitudeLevel: AttitudeLevel): boolean {
  return ATTITUDE_DISCOUNT[attitudeLevel] >= 0;
}

/**
 * 计算实际售价（基于态度等级折扣）
 *
 * @param basePrice - 基准价格
 * @param attitude - 当前态度值
 * @returns 实际价格（已取整）
 */
export function calculateShopPrice(basePrice: number, attitude: number): number {
  const level = getAttitudeLevel(attitude);
  if (!canTrade(level)) return Infinity; // 拒绝交易
  const discount = ATTITUDE_DISCOUNT[level];
  return Math.max(1, Math.round(basePrice * (1 - discount)));
}

// ============================================
// 物品可用性
// ============================================

/** 可购买的物品信息 */
export interface AvailableShopItem {
  /** 物品 ID */
  itemId: string;
  /** 基准价格 */
  basePrice: number;
  /** 实际售价 */
  actualPrice: number;
  /** 当前库存（undefined = 无限） */
  quantity?: number;
  /** 是否售罄 */
  soldOut: boolean;
  /** 是否因态度锁定 */
  attitudeLocked: boolean;
  /** 态度不足的提示 */
  lockReason?: string;
}

/**
 * 获取 NPC 当前可购买的物品列表
 *
 * @param shopItems - NPC 的商品列表
 * @param attitude - 当前态度值
 * @returns 可购买物品信息数组
 */
export function getAvailableShopItems(
  shopItems: NPCShopItem[] | undefined,
  attitude: number,
): AvailableShopItem[] {
  if (!shopItems || shopItems.length === 0) return [];

  const level = getAttitudeLevel(attitude);
  const allowTrade = canTrade(level);

  return shopItems.map(item => {
    const attitudeLocked = !allowTrade || (item.minAttitude !== undefined && attitude < item.minAttitude);
    const soldOut = !attitudeLocked && item.quantity !== undefined && item.quantity <= 0;

    let lockReason: string | undefined;
    if (!allowTrade) {
      lockReason = `需要好感度达到中立以上（当前 ${level}）`;
    } else if (attitudeLocked) {
      lockReason = `需要好感度达到 ${item.minAttitude} 方可购买`;
    }

    return {
      itemId: item.itemId,
      basePrice: item.basePrice,
      actualPrice: attitudeLocked ? item.basePrice : calculateShopPrice(item.basePrice, attitude),
      quantity: item.quantity,
      soldOut,
      attitudeLocked,
      lockReason,
    };
  });
}

// ============================================
// 购买与库存
// ============================================

/** 购买结果 */
export interface PurchaseResult {
  success: boolean;
  error?: string;
  newQuantity?: number;
}

/**
 * 购买物品并扣减库存
 *
 * @param item - 商品定义
 * @param quantity - 购买数量
 * @returns 购买结果
 */
export function purchaseItem(
  item: NPCShopItem,
  quantity: number = 1,
): PurchaseResult {
  if (quantity <= 0) {
    return { success: false, error: '购买数量必须大于 0' };
  }

  if (item.quantity !== undefined) {
    if (item.quantity < quantity) {
      return { success: false, error: `库存不足：需要 ${quantity}，当前 ${item.quantity}` };
    }
    return { success: true, newQuantity: item.quantity - quantity };
  }

  // 无限供应
  return { success: true };
}

// ============================================
// 补货
// ============================================

/**
 * 检查并执行自动补货
 *
 * @param items - 商品列表（会原地修改 quantity）
 * @param currentTimeSeconds - 当前时间（秒级时间戳）
 * @returns 补货的物品数量
 */
export function restockShopItems(
  items: NPCShopItem[] | undefined,
  currentTimeSeconds: number,
): number {
  if (!items || items.length === 0) return 0;

  let restocked = 0;

  for (const item of items) {
    if (
      item.restockIntervalSeconds !== undefined &&
      item.maxQuantity !== undefined &&
      (item.quantity === undefined || item.quantity < item.maxQuantity)
    ) {
      item.quantity = item.maxQuantity;
      restocked++;
    }
  }

  return restocked;
}
