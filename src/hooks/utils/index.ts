/**
 * 工具函数模块
 * 包含非Hook的纯函数工具
 */

// 背包操作
export {
  addToInventory,
  removeFromInventory,
  getSpiritStoneCount,
  hasEnoughItems,
  addItemsToInventory,
} from './inventoryUtils';

// 游戏状态工具
export {
  initialGameState,
  addMessageToState,
} from './gameStateUtils';
