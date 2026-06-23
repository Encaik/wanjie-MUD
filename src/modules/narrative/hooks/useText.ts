/**
 * 文案统一管理系统 - React Hook
 * 
 * 提供统一的文案获取接口
 */

import { useCallback, useMemo } from 'react';

import { WorldType } from '@/core/types';
import { getWorldTerminology, getWorldStatNames } from '@/modules/narrative/data/worlds';
import { textResolver } from '@/modules/narrative/logic/textResolver';
import { TextKey, UseTextResult, ValueContext } from '@/modules/narrative/types';

/**
 * 文案 Hook
 * 
 * 使用示例：
 * ```tsx
 * function MyComponent() {
 *   const { t } = useText('修仙');
 *   
 *   return (
 *     <div>
 *       <span>{t('combat.victory', { enemyName: '妖兽', exp: 100 })}</span>
 *       <span>{t('term.resource')}</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useText(
  worldType: WorldType | string = '修仙',
  contextExtras?: Record<string, any>
): UseTextResult {
  // 构建值上下文
  const context: ValueContext = useMemo(() => ({
    worldType: worldType as WorldType,
    extras: contextExtras,
  }), [worldType, contextExtras]);
  
  // 解析方法
  const t = useCallback((
    key: TextKey,
    params?: Record<string, any>
  ): string => {
    return textResolver.resolve(key, params || {}, context);
  }, [context]);
  
  return {
    t,
    worldType: worldType as WorldType,
    isReady: true,
  };
}

/**
 * 轻量级术语 Hook
 * 
 * 仅用于获取术语，不依赖完整的游戏状态
 */
export function useTerminology(worldType: WorldType | string = '修仙') {
  return useMemo(() => ({
    // 术语
    ...getWorldTerminology(worldType as WorldType),
    // 属性名
    ...getWorldStatNames(worldType as WorldType),
  }), [worldType]);
}

/**
 * 格式化数值的辅助方法
 */
export function formatTextValue(value: number | string, type?: 'number' | 'percent'): string {
  if (typeof value === 'string') return value;
  
  switch (type) {
    case 'percent':
      return `${value}%`;
    case 'number':
    default:
      return value.toLocaleString('zh-CN');
  }
}
