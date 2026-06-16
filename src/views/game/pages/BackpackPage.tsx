/**
 * BackpackPage — 背包面板页面
 *
 * 复用 InventoryPanel，使用全局状态模式自行获取数据。
 */

'use client';

import { InventoryPanel } from '@/modules/equipment/components/InventoryPanel';

export function BackpackPage() {
  return <InventoryPanel useGlobalState />;
}
