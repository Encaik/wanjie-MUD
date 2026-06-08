/**
 * 货币调节服务
 * 
 * 根据玩家等级和其他因素调节货币产出
 * 解决后期货币通胀问题
 */

import {
  CurrencyRegulationConfig,
  CurrencyRewardParams,
  CURRENCY_REGULATIONS,
  SPIRIT_STONE_REGULATION,
  ASCENSION_MARK_REGULATION,
} from './types';
import { CurrencyType } from '../shop/types';

/**
 * 货币调节服务
 */
export class CurrencyRegulator {
  /**
   * 根据玩家等级调整货币奖励
   */
  static adjustCurrencyReward(params: CurrencyRewardParams): number {
    const { baseReward, currencyType, playerLevel } = params;
    const regulation = CURRENCY_REGULATIONS[currencyType];

    if (!regulation) {
      // 没有调节配置的货币类型，原样返回
      return baseReward;
    }

    let multiplier = regulation.productionMultiplier;

    // 应用后期调节阈值
    for (const threshold of regulation.lateGameThresholds) {
      if (playerLevel >= threshold.level) {
        multiplier = threshold.multiplier;
      }
    }

    // 对于灵石：后期减少产出
    if (currencyType === 'spirit_stone') {
      if (playerLevel >= 100) {
        multiplier = Math.min(multiplier, 0.5);
      } else if (playerLevel >= 80) {
        multiplier = Math.min(multiplier, 0.7);
      } else if (playerLevel >= 60) {
        multiplier = Math.min(multiplier, 0.85);
      }
    }

    // 对于飞升印记：后期增加产出
    if (currencyType === 'ascension_mark') {
      if (playerLevel >= 100) {
        multiplier = Math.max(multiplier, 1.5);
      }
    }

    return Math.floor(baseReward * multiplier);
  }

  /**
   * 获取货币调节倍率（用于UI显示）
   */
  static getMultiplier(currencyType: CurrencyType, playerLevel: number): number {
    const regulation = CURRENCY_REGULATIONS[currencyType];
    if (!regulation) return 1.0;

    let multiplier = regulation.productionMultiplier;

    for (const threshold of regulation.lateGameThresholds) {
      if (playerLevel >= threshold.level) {
        multiplier = threshold.multiplier;
      }
    }

    return multiplier;
  }

  /**
   * 获取货币调节说明
   */
  static getRegulationDescription(currencyType: CurrencyType, playerLevel: number): string {
    const multiplier = this.getMultiplier(currencyType, playerLevel);

    if (currencyType === 'spirit_stone') {
      if (multiplier < 1) {
        return `灵石产出减少 ${(1 - multiplier) * 100}%（高等级调节）`;
      }
    }

    if (currencyType === 'ascension_mark') {
      if (multiplier > 1) {
        return `飞升印记产出增加 ${(multiplier - 1) * 100}%（飞升后增益）`;
      }
    }

    return '';
  }

  /**
   * 批量调整多种货币奖励
   */
  static adjustMultipleRewards(
    rewards: Array<{ type: CurrencyType; amount: number }>,
    playerLevel: number
  ): Array<{ type: CurrencyType; amount: number; originalAmount: number }> {
    return rewards.map(({ type, amount }) => ({
      type,
      originalAmount: amount,
      amount: this.adjustCurrencyReward({
        baseReward: amount,
        currencyType: type,
        playerLevel,
      }),
    }));
  }

  /**
   * 获取推荐消耗提示
   */
  static getConsumptionTip(spiritStone: number, playerLevel: number): string | null {
    if (spiritStone > 100000) {
      return '灵石过剩，建议进行装备重铸或功法突破';
    }
    if (spiritStone > 50000 && playerLevel >= 30) {
      return '灵石较多，可以考虑突破辅助或属性重置';
    }
    return null;
  }
}

/**
 * 战斗奖励调节器
 */
export class BattleRewardRegulator {
  /**
   * 调整战斗获得的灵石奖励
   */
  static adjustBattleSpiritStone(
    baseReward: number,
    playerLevel: number,
    enemyLevel: number,
    enemyTier: string
  ): number {
    // 基础调节
    let reward = CurrencyRegulator.adjustCurrencyReward({
      baseReward,
      currencyType: 'spirit_stone',
      playerLevel,
    });

    // 等级差调节：高等级打低等级敌人，减少奖励
    const levelDiff = playerLevel - enemyLevel;
    if (levelDiff > 10) {
      reward = Math.floor(reward * Math.max(0.3, 1 - levelDiff * 0.03));
    }

    // 敌人等级加成：低等级打高等级敌人，增加奖励
    if (levelDiff < -5) {
      reward = Math.floor(reward * (1 + Math.abs(levelDiff) * 0.02));
    }

    return Math.max(1, reward);
  }

  /**
   * 计算战斗总奖励
   */
  static calculateBattleRewards(
    baseSpiritStone: number,
    baseExp: number,
    playerLevel: number,
    enemyLevel: number,
    enemyTier: string,
    isAscended: boolean
  ): {
    spiritStone: number;
    experience: number;
    ascensionMark: number;
  } {
    const spiritStone = this.adjustBattleSpiritStone(
      baseSpiritStone,
      playerLevel,
      enemyLevel,
      enemyTier
    );

    const experience = Math.floor(baseExp * (playerLevel >= 100 ? 0.5 : 1));

    // 飞升后获得飞升印记
    let ascensionMark = 0;
    if (isAscended) {
      ascensionMark = CurrencyRegulator.adjustCurrencyReward({
        baseReward: enemyTier === 'boss' ? 10 : enemyTier === 'elite' ? 3 : 1,
        currencyType: 'ascension_mark',
        playerLevel,
      });
    }

    return { spiritStone, experience, ascensionMark };
  }
}

/**
 * 任务奖励调节器
 */
export class QuestRewardRegulator {
  /**
   * 调整任务奖励
   */
  static adjustQuestReward(
    rewards: {
      spiritStone?: number;
      experience?: number;
      contribution?: number;
      ascensionMark?: number;
    },
    playerLevel: number
  ): {
    spiritStone: number;
    experience: number;
    contribution: number;
    ascensionMark: number;
  } {
    return {
      spiritStone: CurrencyRegulator.adjustCurrencyReward({
        baseReward: rewards.spiritStone || 0,
        currencyType: 'spirit_stone',
        playerLevel,
      }),
      experience: Math.floor((rewards.experience || 0) * (playerLevel >= 100 ? 0.5 : 1)),
      contribution: rewards.contribution || 0,
      ascensionMark: CurrencyRegulator.adjustCurrencyReward({
        baseReward: rewards.ascensionMark || 0,
        currencyType: 'ascension_mark',
        playerLevel,
      }),
    };
  }
}

/**
 * 地牢探索奖励调节器
 */
export class DungeonRewardRegulator {
  /**
   * 调整宝箱奖励
   */
  static adjustTreasureReward(
    baseSpiritStone: number,
    playerLevel: number,
    dungeonLevel: number
  ): number {
    let reward = CurrencyRegulator.adjustCurrencyReward({
      baseReward: baseSpiritStone,
      currencyType: 'spirit_stone',
      playerLevel,
    });

    // 地牢等级加成
    if (dungeonLevel > playerLevel) {
      reward = Math.floor(reward * (1 + (dungeonLevel - playerLevel) * 0.05));
    }

    return reward;
  }

  /**
   * 计算地牢通关奖励
   */
  static calculateDungeonCompletionReward(
    playerLevel: number,
    dungeonLevel: number,
    clearedRooms: number,
    totalRooms: number
  ): {
    spiritStone: number;
    experience: number;
    bonusMultiplier: number;
  } {
    // 基础奖励
    const baseSpiritStone = dungeonLevel * 50;
    const baseExp = dungeonLevel * 100;

    // 探索率加成
    const explorationRate = clearedRooms / totalRooms;
    const bonusMultiplier = 1 + explorationRate * 0.5;

    const spiritStone = CurrencyRegulator.adjustCurrencyReward({
      baseReward: Math.floor(baseSpiritStone * bonusMultiplier),
      currencyType: 'spirit_stone',
      playerLevel,
    });

    const experience = Math.floor(baseExp * bonusMultiplier * (playerLevel >= 100 ? 0.5 : 1));

    return { spiritStone, experience, bonusMultiplier };
  }
}
