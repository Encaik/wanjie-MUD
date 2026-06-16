/**
 * 商店核心服务 — 商品查询、购买验证、交易处理
 *
 * 适配统一物品系统，所有商品和货币都是 Item。
 */

import type { ItemInstance } from '@/modules/item/types';
import type { ShopProduct, PurchaseResult } from '../types';
import { getTemplate } from '@/modules/item/data/index';
import { hasEnough, getItemCount } from '@/modules/item/logic/itemManager';

/**
 * 检查是否可以购买
 */
export function canPurchase(
  items: ItemInstance[],
  product: ShopProduct,
  purchaseCount: number = 1
): { canBuy: boolean; reason?: string } {
  // 检查等级
  // (实际等级检查由调用方处理，此处只做物品层面的检查)

  // 检查货币是否足够
  for (const [currencyId, unitPrice] of Object.entries(product.price)) {
    const totalCost = unitPrice * purchaseCount;
    if (!hasEnough(items, currencyId, totalCost)) {
      const currencyName = getTemplate(currencyId).name;
      return { canBuy: false, reason: `${currencyName}不足：需要 ${totalCost}，当前 ${getItemCount(items, currencyId)}` };
    }
  }

  return { canBuy: true };
}

/**
 * 获取商品显示信息
 */
export function getProductDisplay(product: ShopProduct) {
  const template = getTemplate(product.templateId);

  const priceDisplay = Object.entries(product.price)
    .map(([currencyId, amount]) => {
      const currencyTpl = getTemplate(currencyId);
      const actual = product.discount ? Math.floor(amount * (1 - product.discount)) : amount;
      return `${actual} ${currencyTpl.name}`;
    })
    .join(' + ');

  return {
    name: template.name,
    description: template.description,
    rarity: template.rarity,
    category: template.category,
    priceDisplay,
  };
}

/**
 * 执行购买（返回需要从背包中扣除和增加的物品信息）
 *
 * 这是纯函数，不修改任何状态。调用方负责应用结果。
 */
export function calculatePurchase(
  items: ItemInstance[],
  product: ShopProduct,
  purchaseCount: number = 1
): {
  success: boolean;
  message: string;
  currencyToRemove: { templateId: string; amount: number }[];
  templateToAdd: string;
  quantityToAdd: number;
} {
  const check = canPurchase(items, product, purchaseCount);
  if (!check.canBuy) {
    return {
      success: false,
      message: check.reason || '无法购买',
      currencyToRemove: [],
      templateToAdd: product.templateId,
      quantityToAdd: 0,
    };
  }

  const currencyToRemove = Object.entries(product.price).map(([currencyId, unitPrice]) => ({
    templateId: currencyId,
    amount: (product.discount ? Math.floor(unitPrice * (1 - product.discount)) : unitPrice) * purchaseCount,
  }));

  return {
    success: true,
    message: `成功购买 ${getTemplate(product.templateId).name} x${product.quantity * purchaseCount}`,
    currencyToRemove,
    templateToAdd: product.templateId,
    quantityToAdd: product.quantity * purchaseCount,
  };
}
