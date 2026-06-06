/**
 * 功能模块统一导出
 * 
 * 所有功能模块从这里导出，实现统一的模块边界
 */

// 修炼模块
export {
  CultivationPanel,
  AutoCultivateToggle,
  PathInfoCard,
  getPathIconName,
  getPathColor,
  type CultivationPanelProps,
} from './cultivation';

// 势力模块
export {
  FactionPanel,
  type FactionPanelProps,
} from './faction';

// 机缘模块
export {
  AdventurePanel,
  type AdventurePanelProps,
} from './adventure';

// 商店模块
export { ShopPanel } from './shop';

// 功法模块
export { TechniquePanel } from './technique';

// 装备模块
export { EquipmentPanel } from './equipment';

// 成就模块
export { AchievementPanel } from './achievement';

// 图鉴模块
export { CollectionPanel } from './collection';
