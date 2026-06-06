/**
 * 流派样式工具函数
 */

import { Shield, Swords, Sparkles, Zap, Flame } from 'lucide-react';

/**
 * 获取流派图标组件名称
 */
export function getPathIconName(pathType: string): string {
  switch (pathType) {
    case 'body': return 'Shield';
    case 'sword': return 'Swords';
    case 'spell': return 'Sparkles';
    case 'alchemy': return 'Zap';
    case 'demon': return 'Flame';
    default: return 'Sparkles';
  }
}

/**
 * 获取流派颜色类名
 */
export function getPathColor(pathType: string): string {
  switch (pathType) {
    case 'body': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 border-orange-300';
    case 'sword': return 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300';
    case 'spell': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 border-blue-300';
    case 'alchemy': return 'text-green-600 bg-green-100 dark:bg-green-900/30 border-green-300';
    case 'demon': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 border-purple-300';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 border-gray-300';
  }
}
