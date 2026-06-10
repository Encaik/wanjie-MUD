/**
 * 商店任务系统
 * 
 * 定义商店相关的日常/周常任务
 * 注：此模块独立于任务系统架构，简化实现
 */

import { Protagonist, GameStatistics } from '@/core/types';

// ============================================
// 商店任务类型定义
// ============================================

export type ShopTaskType = 'daily' | 'weekly';

/**
 * 任务奖励
 */
export interface ShopTaskReward {
  spiritStones?: number;
  contribution?: number;
  items?: { id: string; name: string; quantity: number }[];
  message: string;
}

/**
 * 商店任务
 */
export interface ShopTask {
  id: string;
  name: string;
  description: string;
  type: ShopTaskType;
  hint?: string;
  reward: ShopTaskReward;
  check: (shopData: ShopTaskCheckData) => boolean;
}

/**
 * 商店任务检查数据
 */
export interface ShopTaskCheckData {
  todayPurchaseCount: number;
  todaySpent: number;
  weeklySpent: number;
  purchasedCategories: string[];
  blackmarketPurchases: number;
  salePurchases: number;
}

/**
 * 任务状态
 */
export interface ShopTaskState {
  completedTaskIds: string[];
  claimedTaskIds: string[];
  lastDailyReset: number;
}

// ============================================
// 商店任务列表
// ============================================

export const SHOP_TASKS: ShopTask[] = [
  // ========== 日常任务 ==========
  {
    id: 'shop_daily_first_purchase',
    name: '初次消费',
    description: '在商店购买任意商品',
    type: 'daily',
    hint: '进入商店购买一件商品即可完成',
    reward: {
      spiritStones: 100,
      message: '欢迎光临！获得新手奖励！',
    },
    check: (data) => data.todayPurchaseCount >= 1,
  },
  {
    id: 'shop_daily_shopping',
    name: '日常采购',
    description: '在商店购买3件商品',
    type: 'daily',
    reward: {
      spiritStones: 50,
      items: [{ id: 'discount_coupon', name: '折扣券', quantity: 1 }],
      message: '采购完成！获得折扣券！',
    },
    check: (data) => data.todayPurchaseCount >= 3,
  },
  {
    id: 'shop_daily_pill_lover',
    name: '丹药爱好者',
    description: '购买任意丹药类商品',
    type: 'daily',
    reward: {
      contribution: 50,
      message: '获得贡献点奖励！',
    },
    check: (data) => data.purchasedCategories.includes('consumable'),
  },
  {
    id: 'shop_daily_material_buyer',
    name: '材料收集者',
    description: '购买任意材料类商品',
    type: 'daily',
    reward: {
      spiritStones: 30,
      message: '材料收集完成！',
    },
    check: (data) => data.purchasedCategories.includes('material'),
  },
  {
    id: 'shop_daily_big_spender',
    name: '大客户',
    description: '单日消费500灵石',
    type: 'daily',
    reward: {
      contribution: 100,
      spiritStones: 50,
      message: '感谢您的支持！',
    },
    check: (data) => data.todaySpent >= 500,
  },
  {
    id: 'shop_daily_blackmarket_visitor',
    name: '黑市淘金',
    description: '在黑市购买商品',
    type: 'daily',
    reward: {
      spiritStones: 200,
      message: '黑市淘到宝贝了！',
    },
    check: (data) => data.blackmarketPurchases >= 1,
  },
  {
    id: 'shop_daily_sale_hunter',
    name: '特卖猎人',
    description: '购买限时特卖商品',
    type: 'daily',
    reward: {
      spiritStones: 150,
      message: '抢到特卖商品了！',
    },
    check: (data) => data.salePurchases >= 1,
  },

  // ========== 周常任务 ==========
  {
    id: 'shop_weekly_shopping_spree',
    name: '购物狂欢',
    description: '本周消费5000灵石',
    type: 'weekly',
    reward: {
      spiritStones: 500,
      contribution: 200,
      message: '感谢您的支持！获得丰厚奖励！',
    },
    check: (data) => data.weeklySpent >= 5000,
  },
  {
    id: 'shop_weekly_collector',
    name: '收藏家',
    description: '本周购买所有类型商品各一件',
    type: 'weekly',
    hint: '购买丹药、材料各一件',
    reward: {
      items: [{ id: 'rare_box', name: '稀有宝箱', quantity: 1 }],
      message: '收藏家成就达成！',
    },
    check: (data) => {
      const required = ['consumable', 'material'];
      return required.every(cat => data.purchasedCategories.includes(cat));
    },
  },
  {
    id: 'shop_weekly_vip',
    name: 'VIP体验',
    description: '本周消费达到10000灵石',
    type: 'weekly',
    reward: {
      contribution: 500,
      spiritStones: 1000,
      message: 'VIP待遇！感谢您的慷慨！',
    },
    check: (data) => data.weeklySpent >= 10000,
  },
];

// ============================================
// 便捷函数
// ============================================

/**
 * 获取日常任务
 */
export function getDailyShopTasks(): ShopTask[] {
  return SHOP_TASKS.filter(t => t.type === 'daily');
}

/**
 * 获取周常任务
 */
export function getWeeklyShopTasks(): ShopTask[] {
  return SHOP_TASKS.filter(t => t.type === 'weekly');
}

/**
 * 创建默认商店任务状态
 */
export function createShopTaskState(): ShopTaskState {
  return {
    completedTaskIds: [],
    claimedTaskIds: [],
    lastDailyReset: Date.now(),
  };
}

/**
 * 检查任务是否完成
 */
export function checkTaskComplete(
  task: ShopTask,
  shopData: ShopTaskCheckData
): boolean {
  return task.check(shopData);
}

/**
 * 获取任务进度文本
 */
export function getTaskProgressText(
  task: ShopTask,
  shopData: ShopTaskCheckData
): string {
  switch (task.id) {
    case 'shop_daily_first_purchase':
      return `${Math.min(shopData.todayPurchaseCount, 1)}/1`;
    case 'shop_daily_shopping':
      return `${Math.min(shopData.todayPurchaseCount, 3)}/3`;
    case 'shop_daily_big_spender':
      return `${Math.min(shopData.todaySpent, 500)}/500 灵石`;
    case 'shop_weekly_shopping_spree':
      return `${Math.min(shopData.weeklySpent, 5000)}/5000 灵石`;
    case 'shop_weekly_vip':
      return `${Math.min(shopData.weeklySpent, 10000)}/10000 灵石`;
    default:
      return '';
  }
}

/**
 * 更新任务完成状态
 */
export function updateTaskCompletion(
  state: ShopTaskState,
  shopData: ShopTaskCheckData
): ShopTaskState {
  const completedTaskIds = SHOP_TASKS
    .filter(task => task.check(shopData))
    .map(task => task.id);

  return {
    ...state,
    completedTaskIds,
  };
}

/**
 * 从localStorage加载任务状态
 */
export function loadShopTaskState(): ShopTaskState {
  try {
    const saved = localStorage.getItem('shop_task_state');
    if (saved) {
      const state = JSON.parse(saved);
      // 检查是否需要重置（每天）
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if (now - state.lastDailyReset >= dayMs) {
        // 重置日常任务
        const weeklyTaskIds = state.completedTaskIds.filter((id: string) => 
          SHOP_TASKS.find(t => t.id === id)?.type === 'weekly'
        );
        return {
          completedTaskIds: weeklyTaskIds,
          claimedTaskIds: state.claimedTaskIds.filter((id: string) => 
            SHOP_TASKS.find(t => t.id === id)?.type === 'weekly'
          ),
          lastDailyReset: now,
        };
      }
      return state;
    }
  } catch (e) {
    console.warn('Failed to load shop task state:', e);
  }
  return createShopTaskState();
}

/**
 * 保存任务状态到localStorage
 */
export function saveShopTaskState(state: ShopTaskState): void {
  try {
    localStorage.setItem('shop_task_state', JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save shop task state:', e);
  }
}
