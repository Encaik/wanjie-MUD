/**
 * 飞升商店系统
 * 
 * 根据 comprehensive-optimization-design.md 设计文档实现
 * 管理：商品展示、购买限制、功能解锁
 */

import { RealmService } from './realmSystem';
import { 
  AscensionShopItem, 
  AscensionShopItemType,
  AscensionShopPurchase,
  PlayerAscensionState
} from './types';

// ============================================
// 商店商品配置
// ============================================

/** 飞升商店商品列表 */
export const ASCENSION_SHOP_ITEMS: AscensionShopItem[] = [
  // ========== 功法类 ==========
  {
    id: 'technique_transcendent_sword',
    type: 'technique',
    name: '飞升剑诀',
    description: '仙人境方可修炼的绝世剑法，攻击力大幅提升',
    content: { techniqueId: 'technique_transcendent_sword' },
    price: 100,
    requiredRealm: 'immortal'
  },
  {
    id: 'technique_divine_shield',
    type: 'technique',
    name: '神光护体',
    description: '神祇境的终极防御功法，减免大量伤害',
    content: { techniqueId: 'technique_divine_shield' },
    price: 200,
    requiredRealm: 'divine'
  },
  {
    id: 'technique_elemental_fusion',
    type: 'technique',
    name: '五行融通',
    description: '超脱者可学的五行融合功法，同时掌握多种元素',
    content: { techniqueId: 'technique_elemental_fusion' },
    price: 80,
    requiredRealm: 'transcendent'
  },
  
  // ========== 装备类 ==========
  {
    id: 'equipment_ascension_blade',
    type: 'equipment',
    name: '飞升之刃',
    description: '仙人使用的神器，对Boss伤害提升50%',
    content: { equipmentId: 'equipment_ascension_blade' },
    price: 150,
    requiredRealm: 'immortal',
    purchaseLimit: 1
  },
  {
    id: 'equipment_world_armor',
    type: 'equipment',
    name: '界域护甲',
    description: '超脱者的专属护甲，提供全面属性加成',
    content: { equipmentId: 'equipment_world_armor' },
    price: 120,
    requiredRealm: 'transcendent',
    purchaseLimit: 1
  },
  {
    id: 'equipment_mark_ring',
    type: 'equipment',
    name: '印记指环',
    description: '增加飞升印记获取速度20%',
    content: { equipmentId: 'equipment_mark_ring' },
    price: 60,
    purchaseLimit: 1
  },
  
  // ========== 消耗品类 ==========
  {
    id: 'item_ascension_pill',
    type: 'item',
    name: '飞升丹',
    description: '使用后提升15%飞升成功率',
    content: { itemId: 'item_ascension_pill' },
    price: 30,
    purchaseLimit: 5
  },
  {
    id: 'item_xp_boost_large',
    type: 'item',
    name: '大瓶经验药水',
    description: '使用后获得大量经验值',
    content: { itemId: 'item_xp_boost_large' },
    price: 20
  },
  {
    id: 'item_stat_reset',
    type: 'item',
    name: '洗髓丹',
    description: '重置所有属性点，返还分配',
    content: { itemId: 'item_stat_reset' },
    price: 50,
    purchaseLimit: 1
  },
  
  // ========== 外观类 ==========
  {
    id: 'appearance_aura_gold',
    type: 'appearance',
    name: '金色光环',
    description: '炫目的金色光环效果',
    content: { itemId: 'appearance_aura_gold' },
    price: 25
  },
  {
    id: 'appearance_aura_rainbow',
    type: 'appearance',
    name: '彩虹光环',
    description: '传说中的彩虹光环，彰显神祇身份',
    content: { itemId: 'appearance_aura_rainbow' },
    price: 100,
    requiredRealm: 'divine'
  },
  {
    id: 'appearance_title_champion',
    type: 'appearance',
    name: '冠军称号',
    description: '每周Boss排行榜冠军专属称号',
    content: { itemId: 'appearance_title_champion' },
    price: 0,
    requiredFeature: 'weekly_boss_champion'
  },
  
  // ========== 增益类 ==========
  {
    id: 'boost_exp_7d',
    type: 'boost',
    name: '7天经验加成',
    description: '7天内经验获取提升50%',
    content: { boostType: 'exp', boostValue: 50, boostDuration: 7 * 24 * 60 * 60 * 1000 },
    price: 40
  },
  {
    id: 'boost_drop_7d',
    type: 'boost',
    name: '7天掉落加成',
    description: '7天内物品掉落率提升30%',
    content: { boostType: 'drop', boostValue: 30, boostDuration: 7 * 24 * 60 * 60 * 1000 },
    price: 50
  },
  {
    id: 'boost_mark_7d',
    type: 'boost',
    name: '7天印记加成',
    description: '7天内飞升印记获取提升20%',
    content: { boostType: 'mark', boostValue: 20, boostDuration: 7 * 24 * 60 * 60 * 1000 },
    price: 60,
    requiredRealm: 'awakened'
  }
];

// ============================================
// 商店分类
// ============================================

/** 商品类型名称 */
export const SHOP_TYPE_NAMES: Record<AscensionShopItemType, string> = {
  technique: '功法',
  equipment: '装备',
  item: '消耗品',
  appearance: '外观',
  boost: '增益道具'
};

/** 商品类型图标 */
export const SHOP_TYPE_ICONS: Record<AscensionShopItemType, string> = {
  technique: '📜',
  equipment: '⚔️',
  item: '🧪',
  appearance: '✨',
  boost: '⚡'
};

/** 商店页面配置 */
export const SHOP_SECTIONS = [
  { type: 'technique' as AscensionShopItemType, name: '功法', icon: '📜' },
  { type: 'equipment' as AscensionShopItemType, name: '装备', icon: '⚔️' },
  { type: 'item' as AscensionShopItemType, name: '消耗品', icon: '🧪' },
  { type: 'appearance' as AscensionShopItemType, name: '外观', icon: '✨' },
  { type: 'boost' as AscensionShopItemType, name: '增益', icon: '⚡' }
];

// ============================================
// 飞升商店服务
// ============================================

export class AscensionShopService {
  // 玩家购买记录
  private static purchaseHistory: Map<string, AscensionShopPurchase[]> = new Map();
  
  /**
   * 获取所有可用商品
   */
  static getAvailableItems(state: PlayerAscensionState): AscensionShopItem[] {
    return ASCENSION_SHOP_ITEMS.filter(item => {
      // 检查境界要求
      if (item.requiredRealm) {
        const realmIndex = this.getRealmIndex(item.requiredRealm);
        const playerRealmIndex = this.getRealmIndex(state.currentRealmId || 'mortal');
        if (playerRealmIndex < realmIndex) {
          return false;
        }
      }
      
      // 检查功能解锁要求
      if (item.requiredFeature && !state.unlockedFeatures.includes(item.requiredFeature)) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * 获取指定类型的商品
   */
  static getItemsByType(type: AscensionShopItemType, state: PlayerAscensionState): AscensionShopItem[] {
    return this.getAvailableItems(state).filter(item => item.type === type);
  }
  
  /**
   * 获取商品详情
   */
  static getItem(itemId: string): AscensionShopItem | null {
    return ASCENSION_SHOP_ITEMS.find(item => item.id === itemId) || null;
  }
  
  /**
   * 检查购买条件
   */
  static canPurchase(
    item: AscensionShopItem,
    state: PlayerAscensionState,
    playerId: string
  ): { canPurchase: boolean; reason: string } {
    // 检查境界要求
    if (item.requiredRealm) {
      const realmIndex = this.getRealmIndex(item.requiredRealm);
      const playerRealmIndex = this.getRealmIndex(state.currentRealmId || 'mortal');
      if (playerRealmIndex < realmIndex) {
        return { canPurchase: false, reason: `需要达到${this.getRealmName(item.requiredRealm)}境界` };
      }
    }
    
    // 检查功能解锁要求
    if (item.requiredFeature && !state.unlockedFeatures.includes(item.requiredFeature)) {
      return { canPurchase: false, reason: '尚未解锁此功能' };
    }
    
    // 检查印记数量
    if (state.marks < item.price) {
      return { canPurchase: false, reason: `飞升印记不足，需要${item.price}，当前${state.marks}` };
    }
    
    // 检查购买上限
    if (item.purchaseLimit) {
      const purchasedCount = this.getPurchasedCount(playerId, item.id);
      if (purchasedCount >= item.purchaseLimit) {
        return { canPurchase: false, reason: `已达购买上限（${item.purchaseLimit}次）` };
      }
    }
    
    return { canPurchase: true, reason: '' };
  }
  
  /**
   * 购买商品
   */
  static purchase(
    item: AscensionShopItem,
    state: PlayerAscensionState,
    playerId: string
  ): { 
    success: boolean; 
    newState: PlayerAscensionState; 
    error?: string;
    purchase?: AscensionShopPurchase;
  } {
    // 检查购买条件
    const check = this.canPurchase(item, state, playerId);
    if (!check.canPurchase) {
      return { success: false, newState: state, error: check.reason };
    }
    
    // 扣除印记
    const spendResult = RealmService.spendMarks(state, item.price);
    if (!spendResult.success) {
      return { success: false, newState: state, error: spendResult.error };
    }
    
    // 记录购买
    const purchase: AscensionShopPurchase = {
      itemId: item.id,
      purchasedAt: Date.now(),
      quantity: 1
    };
    
    this.recordPurchase(playerId, purchase);
    
    return {
      success: true,
      newState: spendResult.newState,
      purchase
    };
  }
  
  /**
   * 记录购买
   */
  private static recordPurchase(playerId: string, purchase: AscensionShopPurchase): void {
    const history = this.purchaseHistory.get(playerId) || [];
    history.push(purchase);
    this.purchaseHistory.set(playerId, history);
  }
  
  /**
   * 获取购买次数
   */
  static getPurchasedCount(playerId: string, itemId: string): number {
    const history = this.purchaseHistory.get(playerId) || [];
    return history.filter(p => p.itemId === itemId).reduce((sum, p) => sum + p.quantity, 0);
  }
  
  /**
   * 获取购买历史
   */
  static getPurchaseHistory(playerId: string): AscensionShopPurchase[] {
    return this.purchaseHistory.get(playerId) || [];
  }
  
  /**
   * 获取境界索引
   */
  private static getRealmIndex(realmId: string): number {
    const realmOrder = ['mortal', 'awakened', 'transcendent', 'immortal', 'divine'];
    return realmOrder.indexOf(realmId);
  }
  
  /**
   * 获取境界名称
   */
  private static getRealmName(realmId: string): string {
    const realmNames: Record<string, string> = {
      mortal: '凡人',
      awakened: '觉醒者',
      transcendent: '超脱者',
      immortal: '仙人',
      divine: '神祇'
    };
    return realmNames[realmId] || realmId;
  }
  
  /**
   * 计算推荐商品
   */
  static getRecommendedItems(state: PlayerAscensionState, count: number = 3): AscensionShopItem[] {
    const availableItems = this.getAvailableItems(state);
    
    // 按优先级排序
    return availableItems
      .sort((a, b) => {
        // 优先推荐能购买的商品
        const canBuyA = state.marks >= a.price;
        const canBuyB = state.marks >= b.price;
        if (canBuyA !== canBuyB) return canBuyA ? -1 : 1;
        
        // 其次按类型排序：功法 > 装备 > 增益 > 消耗品 > 外观
        const typeOrder: AscensionShopItemType[] = ['technique', 'equipment', 'boost', 'item', 'appearance'];
        return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
      })
      .slice(0, count);
  }
  
  /**
   * 获取商店统计
   */
  static getShopStats(state: PlayerAscensionState): {
    totalItems: number;
    affordableItems: number;
    lockedItems: number;
    byType: Record<AscensionShopItemType, number>;
  } {
    const availableItems = this.getAvailableItems(state);
    const affordableItems = availableItems.filter(item => state.marks >= item.price);
    const lockedItems = ASCENSION_SHOP_ITEMS.length - availableItems.length;
    
    const byType: Record<AscensionShopItemType, number> = {
      technique: 0,
      equipment: 0,
      item: 0,
      appearance: 0,
      boost: 0
    };
    
    availableItems.forEach(item => {
      byType[item.type]++;
    });
    
    return {
      totalItems: availableItems.length,
      affordableItems: affordableItems.length,
      lockedItems,
      byType
    };
  }
  
  /**
   * 清除购买记录（用于测试）
   */
  static clearHistory(): void {
    this.purchaseHistory.clear();
  }
}

// ============================================
// 导出
// ============================================

export const AscensionShopSystem = {
  ITEMS: ASCENSION_SHOP_ITEMS,
  TYPE_NAMES: SHOP_TYPE_NAMES,
  TYPE_ICONS: SHOP_TYPE_ICONS,
  SECTIONS: SHOP_SECTIONS,
  Service: AscensionShopService
};
