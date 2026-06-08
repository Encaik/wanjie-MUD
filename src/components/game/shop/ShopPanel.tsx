/**
 * 商店主面板
 * 
 * 整合所有商店相关功能的新版商店界面
 * 支持定时刷新、手动刷新、倒计时显示
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import {
  ShoppingBag,
  Star,
  Moon,
  Trophy,
  Sparkles,
  Ticket,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Clock,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 商店系统
import { CurrencyService } from '@/lib/game/shop/currencyService';
import { DailySaleService } from '@/lib/game/shop/dailySaleService';
import { getProductConfig } from '@/lib/game/shop/productConfigs';
import { RefreshService, RefreshState } from '@/lib/game/shop/refreshService';
import { SHOP_CONFIGS, getShopConfig, isShopUnlocked, getShopUnlockDescription } from '@/lib/game/shop/shopConfigs';
import { ShopLevelService } from '@/lib/game/shop/shopLevelService';
import { ShopService, PlayerDataForShop } from '@/lib/game/shop/shopService';
import { createShopTaskState, ShopTaskCheckData } from '@/lib/game/shop/shopTaskService';
import {
  ShopType,
  ShopProduct,
  PlayerCurrencies,
  ShopPersistData,
  PurchaseResult,
  ShopLevelData,
  DailySaleData,
  ProductCategory,
  SortMode,
} from '@/lib/game/shop/types';
import { WorldType } from '@/lib/game/types';
import { cn } from '@/utils';

// 子组件
import { CurrencyBar } from './CurrencyBar';
import { DailySaleBanner } from './DailySaleBanner';
import { ProductCard, ProductEmptyState, ShopLockedState } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { RefreshCountdown } from './RefreshCountdown';
import { ShopLevelProgress } from './ShopLevelProgress';
import { ShopTaskPanel } from './ShopTaskPanel';

// 图标

// ============================================
// Props 定义
// ============================================

interface ShopPanelProps {
  // 玩家基础信息
  playerLevel: number;
  realm: string;
  currencies: PlayerCurrencies;
  worldType?: WorldType;
  
  // 势力信息
  factionId?: string | null;
  factionRank?: string;
  
  // 飞升信息
  hasAscended?: boolean;
  
  // 回调
  onBuy?: (
    itemId: string,
    price: number,
    currencyType: string,
    type: 'item' | 'technique' | 'equipment',
    itemData?: any,
    quantity?: number,
    newCurrencies?: { spirit_stone?: number; contribution?: number }
  ) => void;
  onCurrenciesChange?: (newCurrencies: PlayerCurrencies) => void;
}

// ============================================
// 商店图标映射
// ============================================

const SHOP_ICONS: Record<ShopType, React.ReactNode> = {
  normal: <ShoppingBag className="w-3 h-3" />,
  faction: <Star className="w-3 h-3" />,
  blackmarket: <Moon className="w-3 h-3" />,
  arena: <Trophy className="w-3 h-3" />,
  ascension: <Sparkles className="w-3 h-3" />,
  event: <Ticket className="w-3 h-3" />,
};

// ============================================
// 主组件
// ============================================

export function ShopPanel({
  playerLevel,
  realm,
  currencies,
  worldType,
  factionId,
  factionRank,
  hasAscended,
  onBuy,
  onCurrenciesChange,
}: ShopPanelProps) {
  // ============================================
  // 状态管理
  // ============================================

  // 当前选中的商店
  const [activeShop, setActiveShop] = useState<ShopType>('normal');

  // 选中的商品（用于详情弹窗）
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // 筛选和排序
  const [category, setCategory] = useState<ProductCategory>('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');

  // 收藏列表
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shop_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 商店等级数据
  const [levelData, setLevelData] = useState<ShopLevelData>(() => 
    ShopLevelService.load()
  );

  // 限时特卖数据
  const [saleData, setSaleData] = useState<DailySaleData>(() =>
    DailySaleService.loadOrRefresh()
  );

  // 持久化数据
  const [persistData, setPersistData] = useState<ShopPersistData>(() =>
    ShopService.loadPersistData()
  );

  // 刷新状态
  const [refreshState, setRefreshState] = useState<RefreshState>(() =>
    RefreshService.loadState()
  );

  // 刷新动画状态
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 任务状态
  const [taskState, setTaskState] = useState(() => createShopTaskState());

  // 任务数据
  const [taskCheckData, setTaskCheckData] = useState<ShopTaskCheckData>({
    todayPurchaseCount: 0,
    todaySpent: 0,
    weeklySpent: levelData.weeklySpent,
    purchasedCategories: [],
    blackmarketPurchases: 0,
    salePurchases: 0,
  });

  // ============================================
  // 计算属性
  // ============================================

  // 玩家数据（提前定义，因为useEffect需要使用）
  const playerData: PlayerDataForShop = useMemo(() => ({
    level: playerLevel,
    realm,
    realmLevel: 0,
    factionId: factionId || null,
    factionRank,
    currencies,
  }), [playerLevel, realm, factionId, factionRank, currencies]);

  // ============================================
  // 自动刷新检测
  // ============================================

  // 检查并执行自动刷新
  useEffect(() => {
    if (RefreshService.needsAutoRefresh(activeShop, refreshState)) {
      const { products, newState } = RefreshService.performAutoRefresh(
        activeShop,
        playerData,
        refreshState
      );
      setRefreshState(newState);
    }
  }, [activeShop, refreshState, playerData]);

  // 初始化刷新状态
  useEffect(() => {
    const newState = RefreshService.initializeRefreshState(activeShop, refreshState);
    if (newState !== refreshState) {
      setRefreshState(newState);
    }
  }, [activeShop]);

  // 解锁的商店
  const unlockedShops = useMemo(() => {
    return (Object.keys(SHOP_CONFIGS) as ShopType[]).filter(type =>
      isShopUnlocked(type, {
        level: playerLevel,
        factionId: factionId || null,
        hasAscended,
      })
    );
  }, [playerLevel, factionId, hasAscended]);

  // 当前商店商品（支持刷新后的商品列表）
  const products = useMemo(() => {
    // 获取当前商店保存的商品ID
    const savedProductIds = RefreshService.getCurrentProductIds(activeShop, refreshState);
    
    let items: ShopProduct[];
    
    if (savedProductIds && savedProductIds.length > 0) {
      // 使用保存的商品ID生成商品实例
      items = savedProductIds
        .map(id => {
          const config = getProductConfig(id);
          if (!config) return null;
          
          // 创建商品实例
          const price = { ...config.price.primary };
          if (config.price.dynamic) {
            const dynamic = config.price.dynamic;
            price.amount = dynamic.baseAmount + playerData.level * dynamic.levelMultiplier;
          }
          
          return {
            id,
            definition: { ...config.definition },
            price,
            conditions: config.conditions,
            purchaseLimit: config.purchaseLimit,
            unlocked: true,
            purchased: 0,
          } as ShopProduct;
        })
        .filter((p): p is ShopProduct => p !== null);
    } else {
      // 没有保存的商品，使用默认逻辑
      items = ShopService.getProducts(activeShop, playerData, persistData);
    }
    
    // 应用购买记录
    items = items.map(p => {
      const record = persistData.purchaseRecords[`${activeShop}_${p.id}`];
      if (record && Date.now() <= record.resetTime) {
        return { ...p, purchased: record.purchased };
      }
      return p;
    });
    
    // 应用筛选
    if (category !== 'all') {
      items = items.filter(p => {
        if (category === 'consumable') return p.definition.type === 'item' && p.definition.effects && p.definition.effects.length > 0;
        if (category === 'material') return p.definition.type === 'item' && (!p.definition.effects || p.definition.effects.length === 0);
        return p.definition.type === category;
      });
    }
    
    // 应用排序
    switch (sortMode) {
      case 'price_asc':
        items = [...items].sort((a, b) => a.price.amount - b.price.amount);
        break;
      case 'price_desc':
        items = [...items].sort((a, b) => b.price.amount - a.price.amount);
        break;
      case 'rarity':
        const rarityOrder = { '传说': 0, '史诗': 1, '稀有': 2, '普通': 3 };
        items = [...items].sort((a, b) => 
          (rarityOrder[a.definition.rarity as keyof typeof rarityOrder] || 99) -
          (rarityOrder[b.definition.rarity as keyof typeof rarityOrder] || 99)
        );
        break;
      case 'name':
        items = [...items].sort((a, b) => a.definition.name.localeCompare(b.definition.name));
        break;
    }
    
    return items;
  }, [activeShop, playerData, persistData, refreshState, category, sortMode]);

  // 按类型分组商品
  const groupedProducts = useMemo(() => {
    const groups: Record<string, ShopProduct[]> = {};
    products.forEach(p => {
      const type = p.definition.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(p);
    });
    return groups;
  }, [products]);

  // ============================================
  // 回调函数
  // ============================================

  // 处理手动刷新
  const handleManualRefresh = useCallback(() => {
    if (isRefreshing) return;

    const result = RefreshService.performManualRefresh(activeShop, playerData, refreshState);
    
    if (result.success) {
      setIsRefreshing(true);
      
      // 更新刷新状态
      setRefreshState(prev => ({
        ...prev,
        lastRefreshTimes: {
          ...prev.lastRefreshTimes,
          [activeShop]: Date.now(),
        },
        nextRefreshTimes: {
          ...prev.nextRefreshTimes,
          [activeShop]: result.nextRefreshTime || 0,
        },
        manualRefreshCounts: {
          ...prev.manualRefreshCounts,
          [activeShop]: (prev.manualRefreshCounts[activeShop] || 0) + 1,
        },
        shopProductIds: {
          ...prev.shopProductIds,
          [activeShop]: result.newProducts?.map(p => p.id) || [],
        },
      }));

      // 扣除货币（如果不是免费刷新）
      if (result.deductedCurrencies && onCurrenciesChange) {
        onCurrenciesChange(result.deductedCurrencies);
      }

      // 清除购买记录
      const newPersistData = {
        ...persistData,
        purchaseRecords: Object.fromEntries(
          Object.entries(persistData.purchaseRecords).filter(
            ([key]) => !key.startsWith(`${activeShop}_`)
          )
        ),
      };
      setPersistData(newPersistData);
      ShopService.savePersistData(newPersistData);

      // 动画结束
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [activeShop, playerData, refreshState, persistData, isRefreshing, onCurrenciesChange]);

  // 处理购买
  const handlePurchase = useCallback((quantity: number) => {
    if (!selectedProduct) return;

    const result = ShopService.purchase(selectedProduct, playerData, quantity);
    
    if (result.success) {
      // 更新商店等级
      const spent = selectedProduct.price.amount * quantity;
      const newLevelData = ShopLevelService.addSpentExp(levelData, spent);
      setLevelData(newLevelData);
      ShopLevelService.save(newLevelData);

      // 更新购买记录
      const record = ShopService.createPurchaseRecord(
        selectedProduct.id,
        activeShop,
        selectedProduct.purchased + quantity,
        selectedProduct.purchaseLimit?.type || 'daily'
      );
      
      const newPersistData = {
        ...persistData,
        purchaseRecords: {
          ...persistData.purchaseRecords,
          [`${activeShop}_${selectedProduct.id}`]: record,
        },
      };
      setPersistData(newPersistData);
      ShopService.savePersistData(newPersistData);

      // 更新任务数据
      setTaskCheckData(prev => ({
        ...prev,
        todayPurchaseCount: prev.todayPurchaseCount + 1,
        todaySpent: prev.todaySpent + spent,
        weeklySpent: prev.weeklySpent + spent,
        purchasedCategories: [...new Set([...prev.purchasedCategories, selectedProduct.definition.type])],
        blackmarketPurchases: activeShop === 'blackmarket' ? prev.blackmarketPurchases + 1 : prev.blackmarketPurchases,
      }));

      // 回调
      if (onBuy) {
        onBuy(
          selectedProduct.id,
          selectedProduct.price.amount,
          selectedProduct.price.type,
          'item',
          selectedProduct.definition,
          quantity,
          result.newCurrencies
        );
      }
    }
  }, [selectedProduct, playerData, levelData, persistData, activeShop, onBuy]);

  // 处理特卖购买
  const handleSalePurchase = useCallback((productId: string) => {
    const saleProduct = saleData.products.find(p => p.productId === productId);
    if (!saleProduct || saleProduct.purchased) return;

    const productConfig = getProductConfig(productId);
    if (!productConfig) return;

    // 检查货币
    const cost = { type: saleProduct.currency, amount: saleProduct.salePrice };
    if (!CurrencyService.canAfford(currencies, cost)) {
      return;
    }

    // 扣除货币
    const newCurrencies = CurrencyService.deduct(currencies, cost);
    if (!newCurrencies) {
      return;
    }

    // 标记已购买
    const newSaleData = DailySaleService.markPurchased(saleData, productId);
    setSaleData(newSaleData);
    DailySaleService.save(newSaleData);

    // 更新任务数据
    setTaskCheckData(prev => ({
      ...prev,
      todayPurchaseCount: prev.todayPurchaseCount + 1,
      todaySpent: prev.todaySpent + saleProduct.salePrice,
      salePurchases: prev.salePurchases + 1,
    }));

    // 调用 onBuy 回调
    if (onBuy) {
      onBuy(
        productId,
        saleProduct.salePrice,
        saleProduct.currency,
        'item',
        productConfig.definition,
        1,
        { spirit_stone: newCurrencies.spirit_stone, contribution: newCurrencies.contribution }
      );
    }
  }, [saleData, currencies, onBuy]);

  // 切换收藏
  const handleToggleFavorite = useCallback((productId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem('shop_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  // 处理任务领取
  const handleClaimTask = useCallback((taskId: string) => {
    setTaskState(prev => ({
      ...prev,
      claimedTaskIds: [...prev.claimedTaskIds, taskId],
    }));
  }, []);

  // ============================================
  // 渲染
  // ============================================

  // 渲染商品网格
  const renderProductGrid = (items: ShopProduct[]) => (
    <div className={cn(
      'grid grid-cols-4 gap-1.5 transition-opacity',
      isRefreshing && 'opacity-50'
    )}>
      {items.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          currencies={currencies}
          onSelect={() => {
            setSelectedProduct(product);
            setShowDetail(true);
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-3">
      {/* 货币栏 */}
      <CurrencyBar currencies={currencies} worldType={worldType} />

      {/* 限时特卖 */}
      {saleData.products.length > 0 && (
        <DailySaleBanner
          saleData={saleData}
          currencies={currencies}
          onPurchase={handleSalePurchase}
        />
      )}

      {/* 商店等级进度 */}
      <ShopLevelProgress levelData={levelData} />

      {/* 商店标签页 */}
      <Tabs value={activeShop} onValueChange={(v) => setActiveShop(v as ShopType)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-6 h-8">
          {(Object.keys(SHOP_CONFIGS) as ShopType[]).map(type => {
            const config = SHOP_CONFIGS[type];
            const unlocked = isShopUnlocked(type, {
              level: playerLevel,
              factionId: factionId || null,
              hasAscended,
            });
            
            return (
              <TabsTrigger
                key={type}
                value={type}
                className={cn(
                  "text-[10px] px-1",
                  !unlocked && "opacity-60"
                )}
              >
                {SHOP_ICONS[type]}
                <span className="ml-1 hidden sm:inline">{config.name}</span>
                {!unlocked && <span className="ml-0.5">🔒</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* 各商店内容 */}
        {(Object.keys(SHOP_CONFIGS) as ShopType[]).map(type => {
          const config = SHOP_CONFIGS[type];
          const unlocked = isShopUnlocked(type, {
            level: playerLevel,
            factionId: factionId || null,
            hasAscended,
          });

          // 获取当前商店的商品
          const shopProducts = activeShop === type && unlocked ? products : [];

          return (
            <TabsContent key={type} value={type} className="flex-1 mt-2">
              <ScrollArea className="h-full pr-2">
                {!unlocked ? (
                  <ShopLockedState
                    icon={config.icon}
                    name={config.name}
                    unlockDescription={getShopUnlockDescription(type) || ''}
                  />
                ) : shopProducts.length === 0 ? (
                  <ProductEmptyState message="暂无商品" />
                ) : (
                  <div className="space-y-3">
                    {/* 刷新倒计时和手动刷新 */}
                    {RefreshService.supportsRefresh(type) && (
                      <RefreshCountdown
                        shopType={type}
                        currencies={currencies}
                        refreshState={refreshState}
                        onRefresh={handleManualRefresh}
                      />
                    )}

                    {/* 筛选栏 */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Filter className="w-3 h-3 text-muted-foreground" />
                        {(['all', 'consumable', 'material', 'technique', 'equipment'] as ProductCategory[]).map(cat => (
                          <Button
                            key={cat}
                            variant={category === cat ? 'default' : 'ghost'}
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => setCategory(cat)}
                          >
                            {cat === 'all' ? '全部' : 
                             cat === 'consumable' ? '丹药' :
                             cat === 'material' ? '材料' :
                             cat === 'technique' ? '功法' : '装备'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* 商品列表 */}
                    {config.uiConfig.groupBy === 'type' ? (
                      Object.entries(groupedProducts).map(([ptype, items]) => (
                        <Card key={ptype}>
                          <CardHeader className="pb-1 pt-2">
                            <CardTitle className="text-xs flex items-center gap-2">
                              {ptype === 'item' ? '物品' : 
                               ptype === 'technique' ? '功法' :
                               ptype === 'equipment' ? '装备' :
                               ptype === 'fragment' ? '碎片' : '特殊'}
                              <Badge variant="secondary" className="text-[10px]">
                                {items.length}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 pb-2">
                            {renderProductGrid(items)}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="pt-3 pb-2">
                          {renderProductGrid(shopProducts)}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* 商店任务面板 */}
      <ShopTaskPanel
        taskState={taskState}
        shopData={taskCheckData}
        onClaim={handleClaimTask}
        compact
      />

      {/* 商品详情弹窗 */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={showDetail}
        currencies={currencies}
        shopLevel={levelData.level}
        favorites={favorites}
        onClose={() => {
          setShowDetail(false);
          setSelectedProduct(null);
        }}
        onPurchase={handlePurchase}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
