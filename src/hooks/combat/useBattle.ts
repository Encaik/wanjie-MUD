/**
 * Hook: useBattle
 *
 * 职责：管理手动回合制战斗状态机生命周期
 * 依赖：useGameState、combat/battleMachine 纯函数、restraintSystem
 */
'use client';

import { useCallback, useRef, useState } from 'react';
import type { Element, WeaponCategory } from '@/lib/game/utils/restraintSystem';
import { calculateElementMultiplier, calculateWeaponMultiplier } from '@/lib/game/utils/restraintSystem';
import {
  createManualBattleState,
  executeBattleAction,
  validateTechniqueUse,
  decideAIAction,
  buildBattleResult,
} from '@/lib/game/combat/battleMachine';
import type {
  BattleAction,
  ManualBattleState,
  CombatTechniqueSlot,
  AutoBattleStrategy,
} from '@/lib/game/combat/types';
import type { Protagonist, Technique } from '@/lib/game/types';
import { getFinalStats } from '@/lib/game/types';
import {
  calculatePlayerMaxHp,
  calculatePlayerMaxMp,
  calculatePlayerAttack,
  calculatePlayerDefense,
} from '@/lib/game/utils/balanceConfig';

/** 战斗初始化参数 */
export interface BattleInitParams {
  protagonist: Protagonist;
  enemyName: string;
  enemyLevel: number;
  enemyMaxHp: number;
  enemyAttack: number;
  enemyDefense: number;
  enemySpeed: number;
  enemyElement: Element;
  enemyWeapon: WeaponCategory | null;
  enemyRealm: string;
  cellType: string;
}

/** Hook 返回值 */
export interface UseBattleReturn {
  battleState: ManualBattleState | null;
  isActive: boolean;
  isAuto: boolean;
  autoStrategy: AutoBattleStrategy;
  executeAction: (action: BattleAction) => void;
  toggleAuto: () => void;
  setAutoStrategy: (strategy: AutoBattleStrategy) => void;
  initBattle: (params: BattleInitParams) => void;
  endBattle: () => ManualBattleState | null;
  getAvailableTechniques: () => CombatTechniqueSlot[];
}

/**
 * 从玩家的装备招式中构建战斗可用招式列表
 */
function buildCombatTechniques(
  protagonist: Protagonist,
  enemyElement: Element,
  enemyWeapon: WeaponCategory | null
): CombatTechniqueSlot[] {
  const techniques: CombatTechniqueSlot[] = [];
  const playerWeapon = protagonist.equippedMelee?.weaponCategory ?? null;

  // 收集装备的攻击和防御功法
  const allTechs: Technique[] = [];
  for (const tech of protagonist.equippedAttackTechniques) {
    if (tech) allTechs.push(tech);
  }
  for (const tech of protagonist.equippedDefenseTechniques) {
    if (tech) allTechs.push(tech);
  }

  for (const tech of allTechs) {
    const mpCost = tech.mpCost ?? tech.baseMpCost ?? 5;
    const elementStatus = tech.element
      ? (calculateElementMultiplier(tech.element, enemyElement) > 1.0
        ? 'advantage' as const
        : calculateElementMultiplier(tech.element, enemyElement) < 1.0
          ? 'disadvantage' as const
          : 'neutral' as const)
      : 'neutral' as const;

    techniques.push({
      techniqueId: tech.id,
      name: tech.name,
      mpCost,
      powerMultiplier: tech.power / 100 || 1.2,
      element: tech.element,
      compatibleWeapon: tech.compatibleWeapon,
      isOnCooldown: false,
      cooldownRemaining: 0,
      isAvailable: true, // 初始都可用
      elementalStatus: elementStatus,
    });
  }

  return techniques;
}

/** 种子计数器，用于保持伪随机 */
let seedCounter = Date.now();

export function useBattle(): UseBattleReturn {
  const [battleState, setBattleState] = useState<ManualBattleState | null>(null);
  const [isAuto, setIsAuto] = useState(true);
  const [autoStrategy, setAutoStrategy] = useState<AutoBattleStrategy>('balanced');
  const seedRef = useRef(seedCounter);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive = battleState !== null && !battleState.isOver;

  const getAvailableTechniques = useCallback((): CombatTechniqueSlot[] => {
    if (!battleState) return [];
    // 根据当前真气更新可用性
    return battleState.availableTechniques.map(t => ({
      ...t,
      isAvailable: !t.isOnCooldown && t.mpCost <= battleState.playerCurrentMp,
    }));
  }, [battleState]);

  const initBattle = useCallback((params: BattleInitParams) => {
    const { protagonist } = params;
    const finalStats = getFinalStats(protagonist.stats);

    const worldType = protagonist.world.type;
    const maxHp = calculatePlayerMaxHp(finalStats.体质, protagonist.level, worldType);
    const maxMp = calculatePlayerMaxMp(finalStats.灵根, protagonist.level, worldType);
    const attack = calculatePlayerAttack(finalStats.体质, finalStats.灵根, protagonist.level, worldType);
    const defense = calculatePlayerDefense(finalStats.意志, protagonist.level, worldType);
    const speed = 10 + protagonist.level;

    const techs = buildCombatTechniques(
      protagonist,
      params.enemyElement,
      params.enemyWeapon
    );

    const state = createManualBattleState({
      playerMaxHp: maxHp,
      playerCurrentHp: protagonist.currentHp,
      playerMaxMp: maxMp,
      playerCurrentMp: protagonist.currentMp,
      playerAttack: attack,
      playerDefense: defense,
      playerSpeed: speed,
      playerElement: protagonist.equippedMelee?.element ?? 'fire',
      playerWeapon: protagonist.equippedMelee?.weaponCategory ?? null,
      availableTechniques: techs,
      enemyName: params.enemyName,
      enemyMaxHp: params.enemyMaxHp,
      enemyCurrentHp: params.enemyMaxHp,
      enemyAttack: params.enemyAttack,
      enemyDefense: params.enemyDefense,
      enemySpeed: params.enemySpeed,
      enemyLevel: params.enemyLevel,
      enemyElement: params.enemyElement,
      enemyWeapon: params.enemyWeapon,
      enemyRealm: params.enemyRealm,
      autoStrategy,
    });

    setBattleState(state);
    seedRef.current = Date.now();

    // 自动战斗模式：启动定时器
    if (isAuto) {
      startAutoBattle(state);
    }
  }, [autoStrategy, isAuto]);

  const executeAction = useCallback((action: BattleAction) => {
    setBattleState(prev => {
      if (!prev || prev.isOver) return prev;
      seedRef.current = seedRef.current + 1;
      return executeBattleAction(prev, action, seedRef.current);
    });
  }, []);

  const toggleAuto = useCallback(() => {
    setIsAuto(prev => {
      const newAuto = !prev;
      if (newAuto && battleState && !battleState.isOver) {
        startAutoBattle(battleState);
      } else {
        stopAutoBattle();
      }
      return newAuto;
    });
  }, [battleState]);

  const startAutoBattle = useCallback((state: ManualBattleState) => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      setBattleState(prev => {
        if (!prev || prev.isOver) {
          if (autoTimerRef.current) clearInterval(autoTimerRef.current);
          return prev;
        }
        seedRef.current = seedRef.current + 1;
        const aiDecision = decideAIAction(prev, autoStrategy, seedRef.current);
        return executeBattleAction(prev, aiDecision.action, seedRef.current);
      });
    }, 1500); // 1.5秒一回合
  }, [autoStrategy]);

  const stopAutoBattle = useCallback(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const endBattle = useCallback((): ManualBattleState | null => {
    stopAutoBattle();
    const result = battleState;
    setBattleState(null);
    return result;
  }, [battleState, stopAutoBattle]);

  return {
    battleState,
    isActive,
    isAuto,
    autoStrategy,
    executeAction,
    toggleAuto,
    setAutoStrategy,
    initBattle,
    endBattle,
    getAvailableTechniques,
  };
}
