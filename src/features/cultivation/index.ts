/**
 * 修炼模块
 * 
 * 包含修炼、突破、流派选择等功能
 */

// 类型定义
export type { CultivationPanelProps } from './types';

// 主面板组件
export { CultivationPanel } from '@/components/game/tabs';

// 子组件
export { AutoCultivateToggle } from './components/AutoCultivateToggle';
export { PathInfoCard } from './components/PathInfoCard';

// 工具函数
export { getPathIconName, getPathColor } from './utils/pathStyles';
