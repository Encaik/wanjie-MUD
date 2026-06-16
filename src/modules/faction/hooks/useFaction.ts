// @ts-nocheck — TODO: 统一物品系统迁移后重构
/**
 * useGameFaction - 势力系统 Hook（V2 重构版）
 * 
 * 管理势力相关操作：加入/退出势力、任务轮次、委托、捐献、晋升等
 */

'use client';

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { ACHIEVEMENTS } from '@/modules/collection/data/achievementData';
import { getFactionById, calculateFactionBonuses } from '@/modules/faction/data/factionData';
import { 
  getRanksByFactionType,
  getTaskConfig,
  DAILY_TASK_ROUND,
  WEEKLY_TASK_ROUND,
  checkRankPromotion,
  calculateDailySalary,
  generateCommission,
  COMMISSION_QUALITY_CONFIG,
  CommissionQuality,
  FactionCommissionConfig,
} from '@/modules/faction/data/factionProgressData';
import { getStatisticValue } from '@/modules/collection/logic/achievement/achievementUtils';
import { statisticsManager } from '@/modules/collection/logic/statistics/statisticsSystem';
import { 
  GameState, 
  MessageRecord,
  InventoryItem,
  createInventoryItem,
  CultivationPath,
} from '@/core/types';
import { 
  FactionProgress, 
  TaskRoundState, 
  TaskProgress,
  CommissionState,
  CommissionProgress,
  createDefaultFactionProgress,
  createDefaultDailyRoundState,
  createDefaultWeeklyRoundState,
  createDefaultCommissionState,
} from '@/core/types';



interface UseGameFactionProps {
  setGameState: Dispatch<SetStateAction<GameState>>;
  addMessageInternal: (
    messages: MessageRecord[],
    type: MessageRecord['type'],
    title: string,
    content: string,
    details?: string,
    rewards?: MessageRecord['rewards']
  ) => MessageRecord[];
  addToInventory: (inventory: InventoryItem[], newItem: InventoryItem) => InventoryItem[];
}

export interface UseGameFactionReturn {
  // 势力基础操作
  joinFaction: (factionId: string) => void;
  leaveFaction: () => void;
  
  // 任务轮次系统（V2）
  acceptTask: (taskId: string, roundType: 'daily' | 'weekly') => { success: boolean; message: string };
  submitTask: (taskId: string, roundType: 'daily' | 'weekly') => { success: boolean; message: string };
  checkAndResetRounds: () => void;
  
  // 委托系统（V2）
  acceptCommission: (commissionId: string) => { success: boolean; message: string };
  submitCommission: (commissionId: string) => { success: boolean; message: string };
  refreshCommissions: (useFree: boolean) => { success: boolean; message: string };
  checkAndResetCommissions: () => void;
  
  // 其他操作
  handleDonate: (amount: number) => { success: boolean; message: string };
  handlePromoteRank: () => { success: boolean; message: string };
  handleClaimDailySalary: () => { success: boolean; amount: number };
  
  // 势力加成
  getFactionBonuses: () => Record<string, number>;
  
  // 回调包装函数
  claimAchievementReward: (achievementId: string) => void;
  handleSelectCultivationPath: (path: CultivationPath) => void;
  handlePerformEnhanceEquipment: (equipmentId: string) => { success: boolean; message: string };
  handlePerformRefineEquipment: (equipmentId: string) => { success: boolean; message: string };
  handleClaimTaskReward: (taskId: string) => { success: boolean; message: string };
  handleAcceptTask: (taskId: string, roundType?: 'daily' | 'weekly') => { success: boolean; message: string };
  handleSubmitTask: (taskId: string, roundType?: 'daily' | 'weekly') => { success: boolean; message: string };
  handleRefreshTasks: () => { success: boolean; message: string };
}

/**
 * 势力系统 Hook（V2）
 */
export function useGameFaction({
  setGameState,
  addMessageInternal,
  addToInventory,
}: UseGameFactionProps): UseGameFactionReturn {
  
  // ============================================
  // 势力基础操作
  // ============================================
  
  const joinFaction = useCallback((factionId: string) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      if (prev.protagonist.factionId) return prev;
      
      const faction = getFactionById(factionId);
      const ranks = getRanksByFactionType(faction?.type || 'sect');
      const initialRank = ranks.length > 0 ? ranks[0].id : 'servant';
      
      const initialProgress = createDefaultFactionProgress(factionId);
      initialProgress.rank = initialRank;
      
      const newStatistics = { ...prev.statistics, factionJoined: true };
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          factionId,
          factionJoinTime: Date.now(),
          factionProgress: initialProgress,
          currencies: {
            ...prev.protagonist.currencies,
            contribution: prev.protagonist.currencies?.contribution ?? 0,
          },
        },
        currentFactionId: factionId,
        factionProgress: initialProgress,
        statistics: newStatistics,
        messages: addMessageInternal(prev.messages, 'success', '加入势力', `成功加入「${faction?.name || factionId}」！`),
      };
    });
  }, [setGameState, addMessageInternal]);

  const leaveFaction = useCallback(() => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.protagonist.factionId) return prev;
      
      const faction = getFactionById(prev.protagonist.factionId);
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          factionId: null,
          factionJoinTime: undefined,
          factionProgress: undefined,
        },
        currentFactionId: null,
        factionProgress: null,
        messages: addMessageInternal(prev.messages, 'info', '退出势力', `已退出「${faction?.name || '势力'}」`),
      };
    });
  }, [setGameState, addMessageInternal]);

  // ============================================
  // 任务轮次系统（V2）
  // ============================================
  
  /**
   * 接取任务
   */
  const acceptTask = useCallback((taskId: string, roundType: 'daily' | 'weekly'): { success: boolean; message: string } => {
    let result = { success: false, message: '未知错误' };
    
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.protagonist.factionProgress) {
        result = { success: false, message: '未加入势力' };
        return prev;
      }
      
      const progress = prev.protagonist.factionProgress;
      const round = roundType === 'daily' ? progress.dailyRound : progress.weeklyRound;
      const config = roundType === 'daily' ? DAILY_TASK_ROUND : WEEKLY_TASK_ROUND;
      
      // 确保使用有效的轮次上限
      const effectiveRoundLimit = round.roundLimit || config.maxTasksPerRound;
      
      // 检查轮次是否在CD中
      if (round.roundCooldownEnd && Date.now() < round.roundCooldownEnd) {
        result = { success: false, message: '轮次冷却中，请等待冷却结束' };
        return prev;
      }
      
      // 检查是否达到轮次上限
      if (round.completedInRound >= effectiveRoundLimit) {
        result = { success: false, message: `本轮已完成${round.completedInRound}个任务，上限为${effectiveRoundLimit}个，请等待轮次重置` };
        return prev;
      }
      
      // 检查任务是否可用
      if (!round.availableTasks.includes(taskId)) {
        result = { success: false, message: '该任务当前不可接取' };
        return prev;
      }
      
      // 检查是否已接取
      if (round.acceptedTasks[taskId]?.accepted && !round.acceptedTasks[taskId].submitted) {
        result = { success: false, message: '已经接取了该任务' };
        return prev;
      }
      
      // 获取任务配置
      const taskConfig = getTaskConfig(taskId);
      if (!taskConfig) {
        result = { success: false, message: '任务配置不存在' };
        return prev;
      }
      
      // 创建任务进度
      const newTaskProgress: TaskProgress = {
        taskId,
        current: 0,
        target: taskConfig.requirements[0]?.count || 1,
        accepted: true,
        completed: false,
        submitted: false,
        acceptedTime: Date.now(),
        lastUpdateTime: Date.now(),
      };
      
      // 更新轮次状态
      const newRound: TaskRoundState = {
        ...round,
        availableTasks: round.availableTasks.filter(id => id !== taskId),
        acceptedTasks: {
          ...round.acceptedTasks,
          [taskId]: newTaskProgress,
        },
      };
      
      const newProgress: FactionProgress = {
        ...progress,
        [roundType === 'daily' ? 'dailyRound' : 'weeklyRound']: newRound,
      };
      
      result = { success: true, message: `成功接取任务「${taskConfig.name}」` };
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          factionProgress: newProgress,
        },
        factionProgress: newProgress,
        messages: addMessageInternal(prev.messages, 'success', '接取任务', result.message),
      };
    });
    
    return result;
  }, [setGameState, addMessageInternal]);

  /**
   * 提交任务
   */
  const submitTask = useCallback((taskId: string, roundType: 'daily' | 'weekly'): { success: boolean; message: string } => {
    let result = { success: false, message: '未知错误' };
    
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.protagonist.factionProgress) {
        result = { success: false, message: '未加入势力' };
        return prev;
      }
      
      const progress = prev.protagonist.factionProgress;
      const round = roundType === 'daily' ? progress.dailyRound : progress.weeklyRound;
      const config = roundType === 'daily' ? DAILY_TASK_ROUND : WEEKLY_TASK_ROUND;
      
      const taskProgress = round.acceptedTasks[taskId];
      
      if (!taskProgress) {
        result = { success: false, message: '任务不存在' };
        return prev;
      }
      
      if (!taskProgress.accepted) {
        result = { success: false, message: '请先接取该任务' };
        return prev;
      }
      
      if (!taskProgress.completed) {
        result = { success: false, message: '任务目标尚未完成' };
        return prev;
      }
      
      if (taskProgress.submitted) {
        result = { success: false, message: '任务已经提交过了' };
        return prev;
      }
      
      // 获取任务奖励
      const taskConfig = getTaskConfig(taskId);
      const rewards = taskConfig?.rewards || { reputation: 0, contribution: 0 };
      
      // 更新任务状态
      const newAcceptedTasks = { ...round.acceptedTasks, [taskId]: { ...taskProgress, submitted: true } };
      
      // 增加轮次完成数
      const newCompletedInRound = round.completedInRound + 1;
      
      // 检查是否达到轮次上限
      let newCooldownEnd = round.roundCooldownEnd;
      if (newCompletedInRound >= round.roundLimit) {
        newCooldownEnd = Date.now() + config.roundCooldown;
      }
      
      const newRound: TaskRoundState = {
        ...round,
        acceptedTasks: newAcceptedTasks,
        completedInRound: newCompletedInRound,
        completedTaskIdsInRound: [...round.completedTaskIdsInRound, taskId],
        roundCooldownEnd: newCooldownEnd,
      };
      
      const newProgress: FactionProgress = {
        ...progress,
        [roundType === 'daily' ? 'dailyRound' : 'weeklyRound']: newRound,
        reputation: progress.reputation + rewards.reputation,
        contribution: progress.contribution + rewards.contribution,
        tasksCompleted: progress.tasksCompleted + 1,
      };
      
      result = { 
        success: true, 
        message: `任务完成！获得 ${rewards.reputation} 声望，${rewards.contribution} 贡献点` 
      };
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          factionProgress: newProgress,
          currencies: {
            ...prev.protagonist.currencies,
            contribution: (prev.protagonist.currencies?.contribution ?? 0) + rewards.contribution,
          },
        },
        factionProgress: newProgress,
        messages: addMessageInternal(prev.messages, 'success', '任务完成', result.message),
      };
    });
    
    return result;
  }, [setGameState, addMessageInternal]);

  /**
   * 检查并重置轮次
   */
  const checkAndResetRounds = useCallback(() => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.protagonist.factionProgress) return prev;
      
      const progress = prev.protagonist.factionProgress;
      const now = Date.now();
      let updated = false;
      const newProgress = { ...progress };
      
      // 检查日常轮次
      if (progress.dailyRound.roundCooldownEnd && now >= progress.dailyRound.roundCooldownEnd) {
        newProgress.dailyRound = createDefaultDailyRoundState();
        updated = true;
      }
      
      // 检查周常轮次
      if (progress.weeklyRound.roundCooldownEnd && now >= progress.weeklyRound.roundCooldownEnd) {
        newProgress.weeklyRound = createDefaultWeeklyRoundState();
        updated = true;
      }
      
      if (!updated) return prev;
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          factionProgress: newProgress,
        },
        factionProgress: newProgress,
      };
    });
  }, [setGameState]);

  // ============================================
  // 委托系统（V2）
  // ============================================
  
  /**
   * 接取委托
   */
  const acceptCommission = useCallback((commissionId: string): { success: boolean; message: string } => {
    let result = { success: false, message: '未知错误' };
    
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.protagonist.factionProgress) {
        result = { success: false, message: '未加入势力' };
        return prev;
      }
      
      const progress = prev.protagonist.factionProgress;
      const commissions = progress.commissions;
      
      // 检查委托是否存在
      const commissionProgress = commissions.commissions[commissionId];
      if (!commissionProgress) {
        result = { success: false, message: '委托不存在' };
        return prev;
      }
      
      if (commissionProgress.accepted) {
        result = { success: false, message: '已经接取了该委托' };
        return prev;
      }
      
      // 更新委托状态
      const newCommissionProgress: CommissionProgress = {
        ...commissionProgress,
        accepted: true,
        acceptedTime: Date.now(),
      };
      
      const newCommissions: CommissionState = {
        ...commissions,
        commissions: {
          ...commissions.commissions,
          [commissionId]: newCommissionProgress,
        },
      };
      
      const newProgress: FactionProgress = {
        ...progress,
        commissions: newCommissions,
      };
      
      result = { success: true, message: '成功接取委托' };
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          factionProgress: newProgress,
        },
        factionProgress: newProgress,
        messages: addMessageInternal(prev.messages, 'success', '接取委托', result.message),
      };
    });
    
    return result;
  }, [setGameState, addMessageInternal]);

  /**
   * 提交委托
   */
  const submitCommission = useCallback((commissionId: string): { success: boolean; message: string } => {
    let result = { success: false, message: '未知错误' };
    
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.protagonist.factionProgress) {
        result = { success: false, message: '未加入势力' };
        return prev;
      }
      
      const progress = prev.protagonist.factionProgress;
      const commissions = progress.commissions;
      
      const commissionProgress = commissions.commissions[commissionId];
      
      if (!commissionProgress) {
        result = { success: false, message: '委托不存在' };
        return prev;
      }
      
      if (!commissionProgress.accepted) {
        result = { success: false, message: '请先接取该委托' };
        return prev;
      }
      
      if (!commissionProgress.completed) {
        result = { success: false, message: '委托目标尚未完成' };
        return prev;
      }
      
      if (commissionProgress.submitted) {
        result = { success: false, message: '委托已经提交过了' };
        return prev;
      }
      
      // 计算奖励（基于品质）
      // 这里简化处理，实际应该从委托配置获取
      const baseContribution = 100;
      const baseReputation = 50;
      
      // 更新委托状态
      const newCommissionsState = { ...commissions.commissions };
      newCommissionsState[commissionId] = { ...commissionProgress, submitted: true };
      
      const newCommissions: CommissionState = {
        ...commissions,
        commissions: newCommissionsState,
        todayCompleted: commissions.todayCompleted + 1,
      };
      
      const newProgress: FactionProgress = {
        ...progress,
        commissions: newCommissions,
        reputation: progress.reputation + baseReputation,
        contribution: progress.contribution + baseContribution,
        commissionsCompleted: progress.commissionsCompleted + 1,
      };
      
      result = { 
        success: true, 
        message: `委托完成！获得 ${baseReputation} 声望，${baseContribution} 贡献点` 
      };
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          factionProgress: newProgress,
          currencies: {
            ...prev.protagonist.currencies,
            contribution: (prev.protagonist.currencies?.contribution ?? 0) + baseContribution,
          },
        },
        factionProgress: newProgress,
        messages: addMessageInternal(prev.messages, 'success', '委托完成', result.message),
      };
    });
    
    return result;
  }, [setGameState, addMessageInternal]);

  /**
   * 刷新委托列表
   */
  const refreshCommissions = useCallback((useFree: boolean): { success: boolean; message: string } => {
    let result = { success: false, message: '未知错误' };
    
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.protagonist.factionProgress) {
        result = { success: false, message: '未加入势力' };
        return prev;
      }
      
      const progress = prev.protagonist.factionProgress;
      const commissions = progress.commissions;
      
      // 检查免费刷新次数
      if (useFree && commissions.dailyFreeRefresh <= commissions.todayRefreshUsed) {
        result = { success: false, message: '今日免费刷新次数已用完' };
        return prev;
      }
      
      // 生成新的委托（3个）
      const newCommissionsList: Record<string, CommissionProgress> = {};
      const rank = progress.rank;
      
      for (let i = 0; i < 3; i++) {
        const commission = generateCommission(undefined, rank);
        newCommissionsList[commission.id] = {
          commissionId: commission.id,
          current: 0,
          target: commission.requirements[0]?.count || 1,
          accepted: false,
          completed: false,
          submitted: false,
          acceptedTime: 0,
          expiresAt: commission.timeLimit > 0 ? Date.now() + commission.timeLimit : null,
        };
      }
      
      const newCommissions: CommissionState = {
        ...commissions,
        commissions: newCommissionsList,
        lastRefreshTime: Date.now(),
        todayRefreshUsed: useFree ? commissions.todayRefreshUsed + 1 : commissions.todayRefreshUsed,
      };
      
      const newProgress: FactionProgress = {
        ...progress,
        commissions: newCommissions,
      };
      
      result = { success: true, message: '委托列表已刷新' };
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          factionProgress: newProgress,
        },
        factionProgress: newProgress,
        messages: addMessageInternal(prev.messages, 'success', '刷新委托', result.message),
      };
    });
    
    return result;
  }, [setGameState, addMessageInternal]);

  /**
   * 检查并重置委托（每日）
   */
  const checkAndResetCommissions = useCallback(() => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.protagonist.factionProgress) return prev;
      
      const progress = prev.protagonist.factionProgress;
      const commissions = progress.commissions;
      const now = Date.now();
      
      // 检查是否需要重置（新的一天）
      const lastRefresh = new Date(commissions.lastRefreshTime);
      const today = new Date();
      
      if (lastRefresh.getDate() !== today.getDate() || 
          lastRefresh.getMonth() !== today.getMonth() ||
          lastRefresh.getFullYear() !== today.getFullYear()) {
        
        // 重置每日委托
        const newCommissions: CommissionState = {
          ...createDefaultCommissionState(),
          lastRefreshTime: now,
        };
        
        // 生成初始委托
        const rank = progress.rank;
        for (let i = 0; i < 3; i++) {
          const commission = generateCommission(undefined, rank);
          newCommissions.commissions[commission.id] = {
            commissionId: commission.id,
            current: 0,
            target: commission.requirements[0]?.count || 1,
            accepted: false,
            completed: false,
            submitted: false,
            acceptedTime: 0,
            expiresAt: commission.timeLimit > 0 ? now + commission.timeLimit : null,
          };
        }
        
        const newProgress: FactionProgress = {
          ...progress,
          commissions: newCommissions,
        };
        
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            factionProgress: newProgress,
          },
          factionProgress: newProgress,
        };
      }
      
      // 检查委托是否过期
      let hasExpired = false;
      const updatedCommissions: Record<string, CommissionProgress> = {};
      
      for (const [id, cp] of Object.entries(commissions.commissions)) {
        if (cp.expiresAt && now > cp.expiresAt && !cp.submitted) {
          // 委托已过期，不保留
          hasExpired = true;
        } else {
          updatedCommissions[id] = cp;
        }
      }
      
      if (!hasExpired) return prev;
      
      const newCommissions: CommissionState = {
        ...commissions,
        commissions: updatedCommissions,
      };
      
      const newProgress: FactionProgress = {
        ...progress,
        commissions: newCommissions,
      };
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          factionProgress: newProgress,
        },
        factionProgress: newProgress,
      };
    });
  }, [setGameState]);

  // ============================================
  // 其他操作
  // ============================================
  
  const handleDonate = useCallback((amount: number): { success: boolean; message: string } => {
    let result = { success: false, message: '未知错误' };
    
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.protagonist.factionProgress) {
        result = { success: false, message: '未加入势力' };
        return prev;
      }
      
      if (amount <= 0) {
        result = { success: false, message: '捐献数量必须大于0' };
        return prev;
      }
      
      const spiritStoneItem = prev.protagonist.inventory.find(i => i.definition.id === 'spirit_stone');
      const currentSpiritStones = spiritStoneItem?.quantity ?? 0;
      
      if (currentSpiritStones < amount) {
        result = { success: false, message: '灵石不足' };
        return { ...prev, messages: addMessageInternal(prev.messages, 'failure', '捐献失败', '灵石不足') };
      }
      
      const newInventory = prev.protagonist.inventory.map(i =>
        i.definition.id === 'spirit_stone' ? { ...i, quantity: i.quantity - amount } : i
      ).filter(i => i.quantity > 0);
      
      const newProgress: FactionProgress = {
        ...prev.protagonist.factionProgress,
        contribution: prev.protagonist.factionProgress.contribution + amount,
        totalDonated: prev.protagonist.factionProgress.totalDonated + amount,
      };
      
      result = { success: true, message: `成功捐献${amount}灵石，获得${amount}贡献点` };
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          inventory: newInventory,
          factionProgress: newProgress,
          currencies: { 
            ...prev.protagonist.currencies, 
            contribution: (prev.protagonist.currencies?.contribution ?? 0) + amount 
          },
        },
        factionProgress: newProgress,
        messages: addMessageInternal(prev.messages, 'success', '捐献成功', result.message),
      };
    });
    
    return result;
  }, [setGameState, addMessageInternal]);

  const handlePromoteRank = useCallback((): { success: boolean; message: string } => {
    let result = { success: false, message: '未知错误' };
    
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.protagonist.factionProgress) {
        result = { success: false, message: '未加入势力' };
        return prev;
      }
      
      const faction = getFactionById(prev.protagonist.factionId || '');
      if (!faction) {
        result = { success: false, message: '势力不存在' };
        return prev;
      }
      
      const promotionResult = checkRankPromotion(
        prev.protagonist.factionProgress.rank,
        prev.protagonist.factionProgress.reputation,
        faction.type
      );
      
      if (!promotionResult.canPromote || !promotionResult.newRank) {
        result = { success: false, message: promotionResult.message };
        return { ...prev, messages: addMessageInternal(prev.messages, 'warning', '晋升失败', promotionResult.message) };
      }
      
      const ranks = getRanksByFactionType(faction.type);
      const newRankName = ranks.find(r => r.id === promotionResult.newRank)?.name || promotionResult.newRank;
      
      result = { success: true, message: `恭喜晋升为${newRankName}！` };
      
      const newProgress: FactionProgress = {
        ...prev.protagonist.factionProgress,
        rank: promotionResult.newRank,
        lastRankPromotion: Date.now(),
      };
      
      return {
        ...prev,
        protagonist: { 
          ...prev.protagonist, 
          factionProgress: newProgress 
        },
        factionProgress: newProgress,
        messages: addMessageInternal(prev.messages, 'success', '晋升成功', result.message),
      };
    });
    
    return result;
  }, [setGameState, addMessageInternal]);

  const handleClaimDailySalary = useCallback((): { success: boolean; amount: number } => {
    let result = { success: false, amount: 0 };
    
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.protagonist.factionProgress) {
        result = { success: false, amount: 0 };
        return prev;
      }
      
      const today = new Date().setHours(0, 0, 0, 0);
      if (prev.protagonist.factionProgress.lastDailyReward && prev.protagonist.factionProgress.lastDailyReward >= today) {
        result = { success: false, amount: 0 };
        return { ...prev, messages: addMessageInternal(prev.messages, 'info', '每日工资', '今天已领取过工资') };
      }
      
      const faction = getFactionById(prev.protagonist.factionId || '');
      const salary = calculateDailySalary(prev.protagonist.factionProgress.rank, faction?.type || 'sect');
      
      if (salary <= 0) {
        result = { success: false, amount: 0 };
        return prev;
      }
      
      result = { success: true, amount: salary };
      
      const spiritStoneItem = prev.protagonist.inventory.find(i => i.definition.id === 'spirit_stone');
      let newInventory;
      if (spiritStoneItem) {
        newInventory = prev.protagonist.inventory.map(i =>
          i.definition.id === 'spirit_stone' ? { ...i, quantity: i.quantity + salary } : i
        );
      } else {
        newInventory = [...prev.protagonist.inventory, createInventoryItem(spiritStoneItems[0], salary)];
      }
      
      const newProgress: FactionProgress = {
        ...prev.protagonist.factionProgress,
        lastDailyReward: Date.now(),
      };
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          inventory: newInventory,
          factionProgress: newProgress,
        },
        factionProgress: newProgress,
        messages: addMessageInternal(prev.messages, 'success', '每日工资', `领取了${salary}灵石的每日工资`),
      };
    });
    
    return result;
  }, [setGameState, addMessageInternal]);

  /**
   * 获取势力加成
   */
  const getFactionBonuses = useCallback((): Record<string, number> => {
    // 这个函数需要在组件中调用，这里只返回空对象
    // 实际使用时需要从 gameState 中获取 factionId
    return {};
  }, []);

  // ============================================
  // 回调包装函数
  // ============================================

  /**
   * 领取成就奖励
   */
  const claimAchievementReward = useCallback((achievementId: string) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      // 检查是否已领取
      if (prev.claimedAchievementIds?.includes(achievementId)) {
        return {
          ...prev,
          messages: addMessageInternal(prev.messages, 'warning', '领取失败', '该成就奖励已领取过'),
        };
      }
      
      // 获取成就配置
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (!achievement) {
        return {
          ...prev,
          messages: addMessageInternal(prev.messages, 'failure', '领取失败', '成就不存在'),
        };
      }
      
      // 检查是否满足解锁条件
      const progress = getStatisticValue(prev.statistics, achievementId);
      if (progress < achievement.target) {
        return {
          ...prev,
          messages: addMessageInternal(prev.messages, 'warning', '领取失败', `尚未达成成就条件 (${progress}/${achievement.target})`),
        };
      }
      
      // 发放奖励
      let newInventory = [...(prev.protagonist.inventory || [])];
      const rewards: string[] = [];
      
      // 经验奖励
      if (achievement.rewards.experience) {
        rewards.push(`${achievement.rewards.experience} 经验`);
      }
      
      // 物品奖励
      if (achievement.rewards.items) {
        for (const item of achievement.rewards.items) {
          newInventory = addToInventory(newInventory, item);
          rewards.push(`${item.definition.name} x${item.quantity}`);
        }
      }
      
      // 属性奖励
      if (achievement.rewards.stats) {
        rewards.push('属性提升');
      }
      
      // 更新已领取成就列表
      const newClaimedIds = [...(prev.claimedAchievementIds || []), achievementId];
      // 更新已解锁成就列表（如果尚未添加）
      const newUnlockedIds = prev.unlockedAchievementIds.includes(achievementId)
        ? prev.unlockedAchievementIds
        : [...prev.unlockedAchievementIds, achievementId];
      
      const rewardsText = rewards.length > 0 ? rewards.join('、') : '无';
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          inventory: newInventory,
          // 如果有经验奖励，加到经验值
          experience: prev.protagonist.experience + (achievement.rewards.experience || 0),
        },
        statistics: statisticsManager.processEvent(prev.statistics, 'achievement_claimed'),
        unlockedAchievementIds: newUnlockedIds,
        claimedAchievementIds: newClaimedIds,
        messages: addMessageInternal(
          prev.messages, 
          'success', 
          '成就奖励', 
          `领取「${achievement.name}」奖励：${rewardsText}`,
          undefined,
          { 
            experience: achievement.rewards.experience,
            items: achievement.rewards.items,
            stats: achievement.rewards.stats as Record<string, number>,
          }
        ),
      };
    });
  }, [setGameState, addMessageInternal]);

  /**
   * 选择修炼路径
   * 更新主角的修炼流派，并初始化流派等级和经验
   */
  const handleSelectCultivationPath = useCallback((path: CultivationPath) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      // 检查是否已经选择过流派
      if (prev.protagonist.cultivationPath) {
        console.warn('已经选择过修炼流派，无法更改');
        return prev;
      }
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          cultivationPath: path,
          pathLevel: 1,
          pathExp: 0,
        },
        messages: addMessageInternal(
          prev.messages, 
          'success', 
          '流派选择', 
          `你选择了修炼流派，从此踏上独特的修行之路。`
        ),
      };
    });
  }, [setGameState, addMessageInternal]);

  /**
   * 装备强化（回调包装）
   */
  const handlePerformEnhanceEquipment = useCallback((equipmentId: string): { success: boolean; message: string } => {
    // TODO: 实现装备强化
    return { success: false, message: '功能暂未实现' };
  }, []);

  /**
   * 装备精炼（回调包装）
   */
  const handlePerformRefineEquipment = useCallback((equipmentId: string): { success: boolean; message: string } => {
    // TODO: 实现装备精炼
    return { success: false, message: '功能暂未实现' };
  }, []);

  /**
   * 领取任务奖励（回调包装）
   */
  const handleClaimTaskReward = useCallback((taskId: string): { success: boolean; message: string } => {
    return submitTask(taskId, 'daily');
  }, [submitTask]);

  /**
   * 接取任务（回调包装）
   */
  const handleAcceptTask = useCallback((taskId: string, roundType: 'daily' | 'weekly' = 'daily'): { success: boolean; message: string } => {
    return acceptTask(taskId, roundType);
  }, [acceptTask]);

  /**
   * 提交任务（回调包装）
   */
  const handleSubmitTask = useCallback((taskId: string, roundType: 'daily' | 'weekly' = 'daily'): { success: boolean; message: string } => {
    return submitTask(taskId, roundType);
  }, [submitTask]);

  /**
   * 刷新任务（回调包装 - 使用委托刷新）
   */
  const handleRefreshTasks = useCallback((): { success: boolean; message: string } => {
    return refreshCommissions(true);
  }, [refreshCommissions]);

  return {
    joinFaction,
    leaveFaction,
    acceptTask,
    submitTask,
    checkAndResetRounds,
    acceptCommission,
    submitCommission,
    refreshCommissions,
    checkAndResetCommissions,
    handleDonate,
    handlePromoteRank,
    handleClaimDailySalary,
    getFactionBonuses,
    // 回调包装
    claimAchievementReward,
    handleSelectCultivationPath,
    handlePerformEnhanceEquipment,
    handlePerformRefineEquipment,
    handleClaimTaskReward,
    handleAcceptTask,
    handleSubmitTask,
    handleRefreshTasks,
  };
}
