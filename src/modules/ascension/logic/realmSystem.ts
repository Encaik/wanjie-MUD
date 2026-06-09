/**
 * 飞升境界系统
 * 
 * 根据 comprehensive-optimization-design.md 设计文档实现
 * 管理：飞升印记获取、境界升级、功能解锁
 */

import { 
  AscensionRealm, 
  AscensionMarkSource, 
  PlayerAscensionState,
  AscensionMarkGainConfig,
  AscensionMilestone,
  AscensionConfig
} from './types';

// ============================================
// 境界配置数据
// ============================================

/** 飞升境界列表 */
export const ASCENSION_REALMS: AscensionRealm[] = [
  {
    id: 'mortal',
    name: '凡人',
    description: '尚未踏入飞升之道的凡人',
    requiredMarks: 0,
    bonuses: {
      statMultiplier: 1.0,
      expMultiplier: 1.0,
      dropRateBonus: 0,
      newFeatures: []
    },
    appearance: {
      title: '凡人',
      aura: '无',
      auraColor: 'transparent'
    }
  },
  {
    id: 'awakened',
    name: '觉醒者',
    description: '刚刚觉醒飞升之力，感受到天地的奥秘',
    requiredMarks: 50,
    bonuses: {
      statMultiplier: 1.1,
      expMultiplier: 1.1,
      dropRateBonus: 0.05,
      newFeatures: ['weekly_boss']
    },
    appearance: {
      title: '觉醒者',
      aura: '微光',
      auraColor: 'lightblue'
    }
  },
  {
    id: 'transcendent',
    name: '超脱者',
    description: '超脱凡尘束缚，掌握飞升之力',
    requiredMarks: 150,
    bonuses: {
      statMultiplier: 1.25,
      expMultiplier: 1.2,
      dropRateBonus: 0.1,
      newFeatures: ['ascension_shop', 'leaderboard']
    },
    appearance: {
      title: '超脱者',
      aura: '光晕',
      auraColor: 'gold'
    }
  },
  {
    id: 'immortal',
    name: '仙人',
    description: '已然成仙，掌控天地法则',
    requiredMarks: 400,
    bonuses: {
      statMultiplier: 1.5,
      expMultiplier: 1.35,
      dropRateBonus: 0.2,
      newFeatures: ['advanced_techniques', 'special_equipment']
    },
    appearance: {
      title: '仙人',
      aura: '仙气',
      auraColor: 'purple'
    }
  },
  {
    id: 'divine',
    name: '神祇',
    description: '位登神格，威临诸天',
    requiredMarks: 1000,
    bonuses: {
      statMultiplier: 2.0,
      expMultiplier: 1.5,
      dropRateBonus: 0.35,
      newFeatures: ['divine_realm', 'custom_title']
    },
    appearance: {
      title: '神祇',
      aura: '神光',
      auraColor: 'rainbow'
    }
  }
];

/** 飞升印记获取配置 */
export const MARK_GAIN_CONFIGS: Record<AscensionMarkSource, AscensionMarkGainConfig> = {
  boss: {
    source: 'boss',
    baseAmount: 5,
    levelScaling: 0.5
  },
  weekly_boss: {
    source: 'weekly_boss',
    baseAmount: 20,
    levelScaling: 1.0
  },
  pvp: {
    source: 'pvp',
    baseAmount: 10,
    levelScaling: 0.3
  },
  achievement: {
    source: 'achievement',
    baseAmount: 15,
    levelScaling: 0
  },
  season: {
    source: 'season',
    baseAmount: 50,
    levelScaling: 0.2
  },
  challenge: {
    source: 'challenge',
    baseAmount: 25,
    levelScaling: 0.8
  }
};

/** 飞升里程碑 */
export const ASCENSION_MILESTONES: Record<number, AscensionMilestone> = {
  1: {
    statBonus: { 体质: 5 },
    title: '初窥门径',
    ability: 'none',
    description: '首次飞升成功'
  },
  3: {
    statBonus: { 体质: 10, 灵根: 5 },
    title: '飞升老手',
    ability: 'inheritance_slot',
    description: '额外传承槽位'
  },
  5: {
    statBonus: { 体质: 20, 灵根: 10, 悟性: 5 },
    title: '世界旅行者',
    ability: 'world_teleport',
    description: '世界快速传送'
  },
  10: {
    statBonus: { 体质: 50, 灵根: 25, 悟性: 10, 幸运: 5 },
    title: '飞升大师',
    ability: 'ascension_mark_boost',
    description: '印记获取+20%'
  },
  25: {
    statBonus: { 体质: 100, 灵根: 50, 悟性: 25, 幸运: 10, 意志: 5 },
    title: '传说飞升者',
    ability: 'legendary_inheritance',
    description: '传承效率提升'
  }
};

/** 飞升核心配置 */
export const ASCENSION_CORE_CONFIG: AscensionConfig = {
  baseSuccessRate: 0.5,
  
  successRateBonuses: {
    mentalStability70: 0.1,
    mentalStability90: 0.2,
    ascensionPill: 0.15,
    pathLevel5: 0.1,
    pathLevel8: 0.2,
    fullLegendaryEquipment: 0.15,
    tribulationPassed: 0.3
  },
  
  battle: {
    maxTurns: 20,
    phaseThresholds: [1.0, 0.7, 0.3]
  },
  
  penalty: {
    hpLossPercent: 0.3,
    mpLossPercent: 0.5,
    mentalDrop: 20,
    demonChanceAdd: 0.05,
    cooldownBaseHours: 24,
    cooldownMaxHours: 72
  },
  
  inheritance: {
    maxSpiritStonesPercent: 30,
    maxTechniques: 3,
    maxEquipments: 2,
    extraSlots: {
      ascensionRequired: 3,
      extraTechniques: 1,
      extraEquipments: 1
    }
  }
};

// ============================================
// 境界系统服务
// ============================================

export class RealmService {
  /**
   * 获取当前境界
   */
  static getCurrentRealm(state: PlayerAscensionState): AscensionRealm {
    // 按印记数量查找最高可达到的境界
    for (let i = ASCENSION_REALMS.length - 1; i >= 0; i--) {
      if (state.totalMarksEarned >= ASCENSION_REALMS[i].requiredMarks) {
        return ASCENSION_REALMS[i];
      }
    }
    return ASCENSION_REALMS[0];
  }
  
  /**
   * 获取下一个境界
   */
  static getNextRealm(state: PlayerAscensionState): AscensionRealm | null {
    const currentIndex = ASCENSION_REALMS.findIndex(
      r => r.id === state.currentRealmId
    );
    
    if (currentIndex === -1 || currentIndex >= ASCENSION_REALMS.length - 1) {
      return null;
    }
    
    return ASCENSION_REALMS[currentIndex + 1];
  }
  
  /**
   * 检查是否可以升级境界
   */
  static canUpgradeRealm(state: PlayerAscensionState): { canUpgrade: boolean; reason: string } {
    const nextRealm = this.getNextRealm(state);
    
    if (!nextRealm) {
      return { canUpgrade: false, reason: '已达最高境界' };
    }
    
    if (state.totalMarksEarned < nextRealm.requiredMarks) {
      return { 
        canUpgrade: false, 
        reason: `需要 ${nextRealm.requiredMarks} 飞升印记，当前 ${state.totalMarksEarned}` 
      };
    }
    
    return { canUpgrade: true, reason: '' };
  }
  
  /**
   * 升级境界
   */
  static upgradeRealm(state: PlayerAscensionState): PlayerAscensionState {
    const nextRealm = this.getNextRealm(state);
    
    if (!nextRealm || state.totalMarksEarned < nextRealm.requiredMarks) {
      return state;
    }
    
    const newUnlockedFeatures = [...state.unlockedFeatures];
    nextRealm.bonuses.newFeatures.forEach(feature => {
      if (!newUnlockedFeatures.includes(feature)) {
        newUnlockedFeatures.push(feature);
      }
    });
    
    const newUnlockedTitles = [...state.unlockedTitles];
    if (!newUnlockedTitles.includes(nextRealm.appearance.title)) {
      newUnlockedTitles.push(nextRealm.appearance.title);
    }
    
    return {
      ...state,
      currentRealmId: nextRealm.id,
      unlockedFeatures: newUnlockedFeatures,
      unlockedTitles: newUnlockedTitles,
      currentTitle: nextRealm.appearance.title
    };
  }
  
  /**
   * 计算飞升印记获取量
   */
  static calculateMarkGain(
    source: AscensionMarkSource, 
    level: number,
    bonuses: { milestoneBonus?: number; realmBonus?: number } = {}
  ): number {
    const config = MARK_GAIN_CONFIGS[source];
    let amount = config.baseAmount + (config.levelScaling * level);
    
    // 应用里程碑加成
    if (bonuses.milestoneBonus) {
      amount *= (1 + bonuses.milestoneBonus);
    }
    
    // 应用境界加成（印记获取暂时不叠加境界加成，避免滚雪球）
    
    return Math.floor(amount);
  }
  
  /**
   * 获得飞升印记
   */
  static gainMarks(
    state: PlayerAscensionState, 
    amount: number,
    source: AscensionMarkSource
  ): PlayerAscensionState {
    const newState = {
      ...state,
      marks: state.marks + amount,
      totalMarksEarned: state.totalMarksEarned + amount
    };
    
    // 检查是否可以自动升级境界
    const upgradeCheck = this.canUpgradeRealm(newState);
    if (upgradeCheck.canUpgrade) {
      return this.upgradeRealm(newState);
    }
    
    return newState;
  }
  
  /**
   * 消耗飞升印记
   */
  static spendMarks(
    state: PlayerAscensionState, 
    amount: number
  ): { success: boolean; newState: PlayerAscensionState; error?: string } {
    if (state.marks < amount) {
      return { 
        success: false, 
        newState: state, 
        error: `飞升印记不足，需要 ${amount}，当前 ${state.marks}` 
      };
    }
    
    return {
      success: true,
      newState: {
        ...state,
        marks: state.marks - amount
      }
    };
  }
  
  /**
   * 检查功能是否解锁
   */
  static isFeatureUnlocked(state: PlayerAscensionState, featureId: string): boolean {
    return state.unlockedFeatures.includes(featureId);
  }
  
  /**
   * 获取境界加成
   */
  static getRealmBonuses(state: PlayerAscensionState): AscensionRealm['bonuses'] {
    const realm = this.getCurrentRealm(state);
    return realm.bonuses;
  }
  
  /**
   * 获取当前里程碑
   */
  static getCurrentMilestone(ascensionCount: number): AscensionMilestone | null {
    const milestones = Object.keys(ASCENSION_MILESTONES)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const count of milestones) {
      if (ascensionCount >= count) {
        return ASCENSION_MILESTONES[count];
      }
    }
    
    return null;
  }
  
  /**
   * 获取下一个里程碑
   */
  static getNextMilestone(ascensionCount: number): { milestone: AscensionMilestone; required: number } | null {
    const milestones = Object.keys(ASCENSION_MILESTONES)
      .map(Number)
      .sort((a, b) => a - b);
    
    for (const count of milestones) {
      if (ascensionCount < count) {
        return {
          milestone: ASCENSION_MILESTONES[count],
          required: count
        };
      }
    }
    
    return null;
  }
  
  /**
   * 获取额外传承槽位
   */
  static getExtraInheritanceSlots(ascensionCount: number): { techniques: number; equipments: number } {
    const config = ASCENSION_CORE_CONFIG.inheritance.extraSlots;
    if (ascensionCount >= config.ascensionRequired) {
      return {
        techniques: config.extraTechniques,
        equipments: config.extraEquipments
      };
    }
    return { techniques: 0, equipments: 0 };
  }
  
  /**
   * 创建初始飞升状态
   */
  static createInitialState(): PlayerAscensionState {
    return {
      marks: 0,
      totalMarksEarned: 0,
      currentRealmId: 'mortal',
      ascensionCount: 0,
      unlockedFeatures: [],
      currentTitle: null,
      unlockedTitles: ['凡人']
    };
  }
}

// ============================================
// 导出
// ============================================

export const RealmSystem = {
  REALMS: ASCENSION_REALMS,
  MARK_GAIN_CONFIGS,
  MILESTONES: ASCENSION_MILESTONES,
  CONFIG: ASCENSION_CORE_CONFIG,
  Service: RealmService
};
