'use client';

/**
 * 世界观文案全局状态管理
 *
 * 使用方式：
 * 1. 在应用顶层包裹 WorldTextProvider
 * 2. 在组件中使用 useWorldText() hook 获取文案
 *
 * 示例：
 * ```tsx
 * const { t, statName, term } = useWorldText();
 * // 获取任意路径文案
 * const resource = t('terminology.resource'); // "灵石" / "能量块" / ...
 * // 获取属性名
 * const bodyName = statName('body'); // "体质" / "体魄" / ...
 * // 获取术语
 * const power = term('power'); // "灵力" / "能量" / ...
 * ```
 */

import React, { createContext, useContext, useMemo, useEffect } from 'react';

import { worldTextManager, WORLD_TEXT_MAP, getWorldText } from '@/lib/text/WorldTextManager';
import { WorldType } from '@/lib/game/types';
import {
  WorldTextDefinition,
  WorldStatNames,
  WorldTerminology,
  WorldPathTexts,
  PathTextDefinition,
  StatKey,
  PathTypeId,
} from '@/lib/text/worlds/types';

interface WorldTextContextValue {
  /** 当前世界观类型 */
  worldType: WorldType | null;
  /** 当前世界观文案 */
  text: WorldTextDefinition;
  /** 通过路径获取文案 */
  t: (path: string) => string;
  /** 获取属性名称 */
  statName: (statKey: StatKey) => string;
  /** 获取术语 */
  term: (termKey: keyof WorldTerminology) => string;
  /** 获取流派文案 */
  pathText: (pathId: PathTypeId) => PathTextDefinition;
  /** 切换世界观 */
  setWorldType: (worldType: WorldType) => void;
}

const WorldTextContext = createContext<WorldTextContextValue | null>(null);

interface WorldTextProviderProps {
  children: React.ReactNode;
  /** 初始世界观类型 */
  worldType?: WorldType | null;
}

export function WorldTextProvider({ children, worldType }: WorldTextProviderProps) {
  // 初始化世界观
  useEffect(() => {
    if (worldType) {
      worldTextManager.setWorld(worldType);
    }
  }, [worldType]);

  const value = useMemo<WorldTextContextValue>(() => {
    const currentText = worldType ? WORLD_TEXT_MAP[worldType] : worldTextManager.getText();

    return {
      worldType: worldType ?? null,
      text: currentText,
      t: (path: string) => {
        const keys = path.split('.');
        let result: any = currentText;
        for (const key of keys) {
          if (result && typeof result === 'object' && key in result) {
            result = result[key];
          } else {
            console.warn(`[WorldTextContext] Path not found: ${path}`);
            return path;
          }
        }
        return typeof result === 'string' ? result : path;
      },
      statName: (statKey: StatKey) => {
        return currentText.stats[statKey] || statKey;
      },
      term: (termKey: keyof WorldTerminology) => {
        return currentText.terminology[termKey] || termKey;
      },
      pathText: (pathId: PathTypeId) => {
        return currentText.paths[pathId] || currentText.paths.body;
      },
      setWorldType: (newWorldType: WorldType) => {
        worldTextManager.setWorld(newWorldType);
      },
    };
  }, [worldType]);

  return (
    <WorldTextContext.Provider value={value}>
      {children}
    </WorldTextContext.Provider>
  );
}

/**
 * 获取世界观文案的 Hook
 *
 * 使用示例：
 * ```tsx
 * function MyComponent() {
 *   const { t, statName, term, pathText } = useWorldText();
 *
 *   const resource = term('resource'); // 灵石/能量块/...
 *   const bodyStat = statName('body'); // 体质/体魄/...
 *   const bodyPath = pathText('body'); // 体修流派文案
 *
 *   return <div>{resource} - {bodyStat}</div>;
 * }
 * ```
 */
export function useWorldText(): WorldTextContextValue {
  const context = useContext(WorldTextContext);
  if (!context) {
    // 返回默认值，避免组件崩溃
    const defaultText = WORLD_TEXT_MAP['修仙'];
    return {
      worldType: null,
      text: defaultText,
      t: (path: string) => {
        const keys = path.split('.');
        let result: any = defaultText;
        for (const key of keys) {
          if (result && typeof result === 'object' && key in result) {
            result = result[key];
          } else {
            return path;
          }
        }
        return typeof result === 'string' ? result : path;
      },
      statName: (statKey: StatKey) => defaultText.stats[statKey] || statKey,
      term: (termKey: keyof WorldTerminology) => defaultText.terminology[termKey] || termKey,
      pathText: (pathId: PathTypeId) => defaultText.paths[pathId] || defaultText.paths.body,
      setWorldType: () => {},
    };
  }
  return context;
}

export { WORLD_TEXT_MAP, getWorldText };
