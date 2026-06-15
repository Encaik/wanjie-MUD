/**
 * 文案统一管理系统 - 游戏状态集成 Hook
 * 
 * 从游戏状态中获取实时数据，自动注入到文案中
 */

import { useCallback, useMemo } from 'react';

import { useGameStore } from '@/views/game/state/GameStore';
import { calculatePlayerCombatPower } from '@/modules/combat/logic/combatPower';
import { WorldType } from '@/core/types';

import { textResolver } from '@/modules/narrative/logic/textResolver';
import { getWorldTerminology, getWorldStatNames } from '@/modules/narrative/data/worlds';
import { TextKey, ValueContext, UseTextResult } from '@/modules/narrative/types';

import { useText } from './useText';

export function useGameText(): UseTextResult {
  const { gameState } = useGameStore();
  const protagonist = gameState.protagonist;
  const worldType = protagonist?.world.type || '修仙';

  const context: ValueContext = useMemo(() => ({
    gameState,
    protagonist,
    worldType: worldType as WorldType,
  }), [gameState, protagonist, worldType]);
  
  // 解析方法
  const t = useCallback((
    key: TextKey,
    params?: Record<string, any>
  ): string => {
    // 获取当前世界观的术语和属性名
    const terminology = getWorldTerminology(worldType as WorldType);
    const statNames = getWorldStatNames(worldType as WorldType);
    
    // 合并自动计算的值和手动参数
    const mergedParams = {
      // 自动计算战力
      combatPower: protagonist ? formatPower(calculatePlayerCombatPower(
        protagonist,
        protagonist.techniques || [],
        protagonist.equipments || [],
        protagonist.activeEffects || []
      )) : 0,
      
      // 自动从状态获取
      playerLevel: protagonist?.level,
      playerName: protagonist?.character?.name,
      realm: protagonist?.realm,
      currentHp: protagonist?.currentHp,
      maxHp: protagonist?.maxHp,
      currentMp: protagonist?.currentMp,
      maxMp: protagonist?.maxMp,
      stamina: protagonist?.stamina,
      maxStamina: protagonist?.maxStamina,
      exp: protagonist?.experience,
      
      // 自动从术语系统获取
      ...terminology,
      ...statNames,
      
      // 手动参数覆盖
      ...params,
    };
    
    return textResolver.resolve(key, mergedParams, context);
  }, [context, protagonist, worldType]);
  
  return {
    t,
    worldType: worldType as WorldType,
    isReady: !!protagonist,
  };
}

/**
 * 格式化战力数值
 */
function formatPower(power: number): string {
  if (power >= 1000000) {
    return `${(power / 1000000).toFixed(1)}M`;
  }
  if (power >= 1000) {
    return `${(power / 1000).toFixed(1)}K`;
  }
  return power.toString();
}

/**
 * 简化版 Hook - 仅获取术语
 * 
 * 用于不需要游戏状态的场景
 */
export function useGameTerminology() {
  const { gameState } = useGameStore();
  const worldType = gameState.protagonist?.world.type || '修仙';
  
  return useMemo(() => ({
    ...getWorldTerminology(worldType as WorldType),
    ...getWorldStatNames(worldType as WorldType),
  }), [worldType]);
}

/**
 * 导出原有的 useText 作为轻量级替代
 */
export { useText } from './useText';
