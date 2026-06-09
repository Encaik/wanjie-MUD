'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

import type { 
  AscensionFlowState, 
  InheritanceChoice, 
  NewWorldInfo, 
  DiscoveredWorld,
  AscensionChallengeResult,
} from '@/shared/lib/typesExtension';
import { DEFAULT_ASCENSION_FLOW_STATE } from '@/shared/lib/typesExtension';

/**
 * Ascension Context
 * 用于封装飞升流程状态，减少状态分散和回调层层传递
 */

// Context 值类型
export interface AscensionContextValue {
  // 状态
  ascensionFlow: AscensionFlowState;
  
  // 计算属性
  isInAscension: boolean;
  isInBattle: boolean;
  isInInheritance: boolean;
  isInWorldReveal: boolean;
  isComplete: boolean;
  
  // 操作方法
  startBattle: () => void;
  endBattle: (result: AscensionChallengeResult) => void;
  setInheritanceChoice: (choice: InheritanceChoice) => void;
  setNewWorld: (world: NewWorldInfo) => void;
  addDiscoveredWorld: (world: NewWorldInfo) => void;
  confirmInheritance: (choice: InheritanceChoice) => void;
  skipInheritance: () => void;
  confirmWorld: (newWorld?: NewWorldInfo) => void;
  rerollWorld: () => void;
  reset: () => void;
}

// 创建 Context
const AscensionContext = createContext<AscensionContextValue | null>(null);

// Provider Props
interface AscensionProviderProps {
  children: ReactNode;
  initialState?: AscensionFlowState;
  // 回调函数
  onBattleStart?: () => void;
  onBattleEnd?: (result: AscensionChallengeResult) => void;
  onInheritanceConfirm?: (choice: InheritanceChoice) => void;
  onInheritanceSkip?: () => void;
  onWorldConfirm?: (newWorld?: NewWorldInfo) => void;
  onWorldReroll?: () => void;
}

/**
 * Ascension Provider
 * 封装飞升流程状态和操作
 */
export function AscensionProvider({
  children,
  initialState,
  onBattleStart,
  onBattleEnd,
  onInheritanceConfirm,
  onInheritanceSkip,
  onWorldConfirm,
  onWorldReroll,
}: AscensionProviderProps) {
  const [ascensionFlow, setAscensionFlow] = useState<AscensionFlowState>(
    initialState || DEFAULT_ASCENSION_FLOW_STATE
  );

  // 计算属性
  const isInAscension = ascensionFlow.phase !== 'none' && ascensionFlow.phase !== 'complete';
  const isInBattle = ascensionFlow.phase === 'battle';
  const isInInheritance = ascensionFlow.phase === 'inheritance';
  const isInWorldReveal = ascensionFlow.phase === 'world_reveal';
  const isComplete = ascensionFlow.phase === 'complete';

  // 操作方法
  const startBattle = useCallback(() => {
    setAscensionFlow(prev => ({
      ...prev,
      phase: 'battle',
    }));
    onBattleStart?.();
  }, [onBattleStart]);

  const endBattle = useCallback((result: AscensionChallengeResult) => {
    setAscensionFlow(prev => ({
      ...prev,
      phase: 'inheritance',
      battleResult: result,
    }));
    onBattleEnd?.(result);
  }, [onBattleEnd]);

  const setInheritanceChoice = useCallback((choice: InheritanceChoice) => {
    setAscensionFlow(prev => ({
      ...prev,
      inheritanceChoice: choice,
    }));
  }, []);

  const setNewWorld = useCallback((world: NewWorldInfo) => {
    setAscensionFlow(prev => ({
      ...prev,
      newWorld: world,
    }));
  }, []);

  const addDiscoveredWorld = useCallback((world: NewWorldInfo) => {
    // 生成一个唯一 ID
    const worldId = `world-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // 转换为 DiscoveredWorld 格式
    const discoveredWorld: DiscoveredWorld = {
      id: worldId,
      info: world,
      visited: false,
      ascensionCount: 0,
      discoveredAt: Date.now(),
    };
    
    setAscensionFlow(prev => {
      // 检查是否已存在（通过 info 名称匹配）
      const exists = prev.discoveredWorlds.some(w => w.info.name === world.name);
      if (exists) return prev;
      return {
        ...prev,
        discoveredWorlds: [...prev.discoveredWorlds, discoveredWorld],
      };
    });
  }, []);

  const confirmInheritance = useCallback((choice: InheritanceChoice) => {
    setAscensionFlow(prev => ({
      ...prev,
      phase: 'world_reveal',
      inheritanceChoice: choice,
    }));
    onInheritanceConfirm?.(choice);
  }, [onInheritanceConfirm]);

  const skipInheritance = useCallback(() => {
    setAscensionFlow(prev => ({
      ...prev,
      phase: 'world_reveal',
      inheritanceChoice: undefined,
    }));
    onInheritanceSkip?.();
  }, [onInheritanceSkip]);

  const confirmWorld = useCallback((newWorld?: NewWorldInfo) => {
    if (newWorld) {
      addDiscoveredWorld(newWorld);
    }
    setAscensionFlow(prev => ({
      ...prev,
      phase: 'complete',
      newWorld: newWorld || prev.newWorld,
    }));
    onWorldConfirm?.(newWorld);
  }, [addDiscoveredWorld, onWorldConfirm]);

  const rerollWorld = useCallback(() => {
    // 清除当前世界，触发重新生成
    setAscensionFlow(prev => ({
      ...prev,
      newWorld: undefined,
    }));
    onWorldReroll?.();
  }, [onWorldReroll]);

  const reset = useCallback(() => {
    setAscensionFlow(DEFAULT_ASCENSION_FLOW_STATE);
  }, []);

  const value: AscensionContextValue = {
    ascensionFlow,
    isInAscension,
    isInBattle,
    isInInheritance,
    isInWorldReveal,
    isComplete,
    startBattle,
    endBattle,
    setInheritanceChoice,
    setNewWorld,
    addDiscoveredWorld,
    confirmInheritance,
    skipInheritance,
    confirmWorld,
    rerollWorld,
    reset,
  };

  return (
    <AscensionContext.Provider value={value}>
      {children}
    </AscensionContext.Provider>
  );
}

/**
 * 使用 Ascension Context
 */
export function useAscensionContext() {
  const context = useContext(AscensionContext);
  if (!context) {
    throw new Error('useAscensionContext must be used within AscensionProvider');
  }
  return context;
}

// 便捷 Hooks

/**
 * 获取飞升流程状态
 */
export function useAscensionFlow() {
  const { ascensionFlow } = useAscensionContext();
  return ascensionFlow;
}

/**
 * 获取是否正在进行飞升
 */
export function useIsInAscension() {
  const { isInAscension, isInBattle, isInInheritance, isInWorldReveal } = useAscensionContext();
  return { isInAscension, isInBattle, isInInheritance, isInWorldReveal };
}

/**
 * 飞升操作
 */
export function useAscensionActions() {
  const { startBattle, endBattle, confirmInheritance, skipInheritance, confirmWorld, rerollWorld } = useAscensionContext();
  return {
    startBattle,
    endBattle,
    confirmInheritance,
    skipInheritance,
    confirmWorld,
    rerollWorld,
  };
}
