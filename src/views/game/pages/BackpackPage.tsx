/**
 * BackpackPage — 背包面板页面
 *
 * 使用统一物品系统的 InventoryPanel，通过 Hook 自行获取全局状态。
 */

'use client';

import { InventoryPanel } from '@/modules/item/components/InventoryPanel';

export function BackpackPage() {
  return <InventoryPanel />;
}
