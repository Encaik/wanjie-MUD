'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { Protagonist, InventoryItem, ActiveEffect } from '@/lib/game/types';
import type { CultivationPath, MentalState, FactionProgress } from '@/lib/game/typesExtension';

/**
 * Protagonist Context
 * 用于减少 MainGame 到子组件的 props 传递
 */

// 主角基础信息类型
export interface ProtagonistContextValue {
  // 基础数据
  protagonist: Protagonist;
  timeSystem?: {
    realTime: { exploreCooldown?: { startTime: number; duration: number } };
    gameTime: { age: number; cultivationTime: number };
  } | null;
  
  // 计算属性
  isInCooldown: boolean;
  cooldownRemaining: number;
}

// 创建 Context
const ProtagonistContext = createContext<ProtagonistContextValue | null>(null);

// Provider Props
interface ProtagonistProviderProps {
  children: ReactNode;
  protagonist: Protagonist;
  timeSystem?: {
    realTime: { exploreCooldown?: { startTime: number; duration: number } };
    gameTime: { age: number; cultivationTime: number };
  } | null;
  lastExploreTime: number;
}

/**
 * Protagonist Provider
 * 封装主角相关的状态和方法
 */
export function ProtagonistProvider({
  children,
  protagonist,
  timeSystem,
  lastExploreTime,
}: ProtagonistProviderProps) {
  // 计算冷却状态
  const cooldownDuration = 30000; // 30秒冷却
  const cooldownRemaining = Math.max(0, cooldownDuration - (Date.now() - lastExploreTime));
  const isInCooldown = cooldownRemaining > 0;

  const value: ProtagonistContextValue = {
    protagonist,
    timeSystem,
    isInCooldown,
    cooldownRemaining,
  };

  return (
    <ProtagonistContext.Provider value={value}>
      {children}
    </ProtagonistContext.Provider>
  );
}

/**
 * 使用 Protagonist Context
 */
export function useProtagonistContext() {
  const context = useContext(ProtagonistContext);
  if (!context) {
    throw new Error('useProtagonistContext must be used within ProtagonistProvider');
  }
  return context;
}

/**
 * 便捷 Hook: 获取主角
 */
export function useProtagonist() {
  const { protagonist } = useProtagonistContext();
  return protagonist;
}

/**
 * 便捷 Hook: 获取背包
 */
export function useInventory() {
  const { protagonist } = useProtagonistContext();
  return protagonist.inventory;
}

/**
 * 便捷 Hook: 获取当前活跃效果
 */
export function useActiveEffects() {
  const { protagonist } = useProtagonistContext();
  return protagonist.activeEffects;
}

/**
 * 便捷 Hook: 获取修炼路径
 */
export function useCultivationPath() {
  const { protagonist } = useProtagonistContext();
  return protagonist.cultivationPath;
}

/**
 * 便捷 Hook: 获取心境状态
 */
export function useMentalState() {
  const { protagonist } = useProtagonistContext();
  return protagonist.mentalState;
}

/**
 * 便捷 Hook: 获取势力进度
 */
export function useFactionProgress() {
  const { protagonist } = useProtagonistContext();
  return protagonist.factionProgress;
}

/**
 * 便捷 Hook: 检查是否在历练冷却中
 */
export function useExploreCooldown() {
  const { isInCooldown, cooldownRemaining } = useProtagonistContext();
  return { isInCooldown, cooldownRemaining };
}
