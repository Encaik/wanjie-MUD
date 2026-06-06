# 商店Tab重设计方案

## 一、设计目标

### 核心目标
- **丰富可玩性**：增加商店等级、限时特卖、商店任务等玩法
- **视觉体验**：更现代的UI设计，丰富的动效反馈
- **深度交互**：商品详情、批量购买、收藏功能
- **经济平衡**：合理的货币消耗和获取循环

### 设计原则
- 保持与现有系统的兼容性
- 渐进式体验（新手友好，深度足够）
- 减少玩家操作负担
- 增加惊喜感和期待感

---

## 二、商店架构总览

### 2.1 商店类型扩展

| 商店类型 | 解锁条件 | 主货币 | 刷新机制 | 特色玩法 |
|---------|---------|--------|---------|---------|
| 🏪 普通商店 | 默认解锁 | 灵石 | 无刷新 | 基础物资供应 |
| ⭐ 势力商店 | 加入势力 | 贡献点 | 每周刷新 | 势力专属商品 |
| 🌑 黑市 | 10级解锁 | 灵石 | 每日刷新 | 随机折扣商品 |
| 🏆 竞技商店 | 20级解锁 | 荣誉值 | 无刷新 | 竞技装备功法 |
| ✨ 飞升商店 | 飞升后解锁 | 飞升印记 | 无刷新 | 飞升专属道具 |
| 🎫 活动商店 | 活动期间 | 活动代币 | 活动结束 | 限时活动商品 |
| 🔮 神秘商人 | 随机出现 | 灵石/贡献 | 随机出现 | 稀有商品特价 |

### 2.2 商店Tab布局

```
┌─────────────────────────────────────────────────────────┐
│  商店Tab                                                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │ 💰 货币栏: 💎灵石  ⭐贡献  🏆荣誉  ✨印记       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🔥 今日特卖 (滚动展示限时折扣商品)              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │🏪普通    │🌑黑市    │⭐势力    │🏆竞技    │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 商店等级: Lv.3 ████████░░ 1200/2000             │    │
│  │ [本周消费: 1200灵石] [折扣: -5%]                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 商品分类: [全部] [丹药] [材料] [功法] [装备]    │    │
│  │ 排序: [默认] [价格] [稀有度]                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────┬─────────┬─────────┬─────────┐             │
│  │ 商品卡片│ 商品卡片│ 商品卡片│ 商品卡片│             │
│  ├─────────┼─────────┼─────────┼─────────┤             │
│  │ 商品卡片│ 商品卡片│ 商品卡片│ 商品卡片│             │
│  └─────────┴─────────┴─────────┴─────────┘             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 📋 商店任务: 今日 2/3 [领取奖励]                 │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 三、新增核心系统

### 3.1 商店等级系统

#### 等级机制
- **经验获取**：消费货币获得商店经验（1灵石=1经验）
- **等级上限**：10级
- **等级奖励**：解锁新商品、获得永久折扣

#### 等级奖励表

| 等级 | 累计消费 | 解锁内容 | 永久折扣 |
|------|---------|---------|---------|
| 1 | 0 | 基础商品 | 0% |
| 2 | 1,000 | 稀有材料上架 | 1% |
| 3 | 5,000 | 功法购买上限+1 | 2% |
| 4 | 15,000 | 史诗材料上架 | 3% |
| 5 | 50,000 | 黑市刷新次数+1 | 5% |
| 6 | 100,000 | 随机宝箱上架 | 6% |
| 7 | 250,000 | 传说材料上架 | 7% |
| 8 | 500,000 | 全商店折扣券 | 8% |
| 9 | 1,000,000 | 神秘商人概率提升 | 9% |
| 10 | 2,500,000 | 所有商品限购+50% | 10% |

#### 数据结构

```typescript
interface ShopLevelData {
  level: number;
  exp: number;
  totalSpent: number;
  weeklySpent: number;
  lastResetTime: number;
  unlockedProducts: string[];
  unlockedFeatures: string[];
}
```

### 3.2 限时特卖系统

#### 特卖机制
- **每日特卖**：每天随机挑选3件商品，享受30%-70%折扣
- **限时数量**：每种特卖商品限购1件
- **倒计时**：显示特卖剩余时间
- **预告**：提前显示明日特卖商品类型

#### 特卖商品池
- 普通商店商品（50%概率）
- 黑市商品（30%概率）
- 稀有商品（20%概率）

#### 数据结构

```typescript
interface DailySale {
  products: SaleProduct[];
  refreshTime: number;
  previewCategory: string; // 明日预告
}

interface SaleProduct {
  productId: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  purchased: boolean;
}
```

### 3.3 商店任务系统

#### 每日任务

| 任务 | 条件 | 奖励 |
|------|------|------|
| 初次消费 | 购买任意商品 | 100灵石 |
| 日常采购 | 购买3件商品 | 1张折扣券 |
| 丹药爱好者 | 购买任意丹药 | 50贡献点 |
| 黑市淘金 | 在黑市购买商品 | 200灵石 |

#### 周常任务

| 任务 | 条件 | 奖励 |
|------|------|------|
| 周末狂欢 | 消费5000灵石 | 随机稀有道具 |
| 收藏家 | 收藏5件商品 | 限定称号 |
| 贵宾体验 | 达到VIP体验 | 500贡献点 |

#### 数据结构

```typescript
interface ShopTask {
  id: string;
  type: 'daily' | 'weekly';
  name: string;
  description: string;
  condition: TaskCondition;
  reward: TaskReward;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}
```

### 3.4 商品收藏系统

#### 功能说明
- 玩家可收藏感兴趣的商品
- 收藏商品降价时推送通知
- 收藏列表快速访问
- 收藏数量与商店等级挂钩

#### 数据结构

```typescript
interface FavoriteData {
  products: string[]; // 商品ID列表
  maxSlots: number;   // 最大收藏槽位
  priceAlerts: {      // 降价提醒
    productId: string;
    targetPrice: number;
  }[];
}
```

### 3.5 神秘商人系统

#### 出现机制
- 每天有20%概率出现（商店等级提升概率）
- 出现后停留4小时
- 提供3-5件稀有商品，价格优惠

#### 商品类型
- 传说功法（比正常价格低30%）
- 传说装备
- 稀有材料包
- 特殊道具（改名卡、洗点丹等）

#### 数据结构

```typescript
interface MysteryMerchant {
  active: boolean;
  appearTime: number;
  expireTime: number;
  products: ShopProduct[];
  visited: boolean;
}
```

### 3.6 商品详情弹窗

#### 内容展示
- 商品图标、名称、稀有度
- 详细描述和效果说明
- 价格和折扣信息
- 购买条件检查
- 限购信息
- 相似商品推荐
- 批量购买选项

#### 交互功能
- 单件购买
- 批量购买（滑动选择数量）
- 收藏/取消收藏
- 分享到聊天

---

## 四、新增商店详细设计

### 4.1 竞技商店

#### 解锁条件
- 玩家等级 ≥ 20
- 完成竞技场新手引导

#### 商品列表

| 商品 | 价格 | 限购 | 说明 |
|------|------|------|------|
| 竞技荣誉宝箱 | 500荣誉 | 每周2 | 随机装备/材料 |
| 竞技功法残页 | 300荣誉 | 每周3 | 用于功法升级 |
| 荣誉勋章 | 1000荣誉 | 每月1 | 装饰道具 |
| 竞技药水 | 50荣誉 | 每日5 | 战斗增益 |
| 称号券 | 2000荣誉 | 永久1 | 解锁竞技称号 |

### 4.2 飞升商店

#### 解锁条件
- 完成首次飞升

#### 商品列表

| 商品 | 价格 | 限购 | 说明 |
|------|------|------|------|
| 飞升丹 | 100印记 | 每月2 | 飞升后修炼加速 |
| 天界材料包 | 200印记 | 每周1 | 随机天界材料 |
| 飞升功法 | 500印记 | 永久1 | 飞升专属功法 |
| 神器碎片 | 300印记 | 每周2 | 用于神器锻造 |

### 4.3 活动商店

#### 机制说明
- 仅在活动期间开放
- 使用活动专属代币
- 活动结束后代币兑换为基础货币

#### 示例活动
- 新春活动：年货商店
- 周年庆：庆典商店
- 节日活动：限定商品

---

## 五、UI组件设计

### 5.1 货币栏组件

```tsx
interface CurrencyBarProps {
  currencies: PlayerCurrencies;
  compact?: boolean;
  showAll?: boolean;
}
```

- 横向展示主要货币
- 点击展开全部货币详情
- 显示货币获取途径提示

### 5.2 商品卡片组件

```tsx
interface ProductCardProps {
  product: ShopProduct;
  viewMode: 'grid' | 'list';
  showDiscount?: boolean;
  onSelect: () => void;
  onQuickBuy: () => void;
}
```

#### 卡片样式
- 稀有度边框颜色
- 限时标签（折扣/新品）
- 限购进度条
- 快速购买按钮

### 5.3 商品详情弹窗

```tsx
interface ProductDetailModalProps {
  product: ShopProduct;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (quantity: number) => void;
  onFavorite: () => void;
}
```

### 5.4 商店任务组件

```tsx
interface ShopTaskPanelProps {
  tasks: ShopTask[];
  onClaim: (taskId: string) => void;
}
```

---

## 六、数据流设计

### 6.1 状态管理

```typescript
interface ShopState {
  // 当前选中商店
  activeShop: ShopType;
  
  // 商店数据
  shops: Record<ShopType, ShopData>;
  
  // 商店等级
  shopLevel: ShopLevelData;
  
  // 限时特卖
  dailySale: DailySale;
  
  // 神秘商人
  mysteryMerchant: MysteryMerchant | null;
  
  // 收藏列表
  favorites: FavoriteData;
  
  // 商店任务
  tasks: ShopTask[];
  
  // 持久化数据
  persistData: ShopPersistData;
}
```

### 6.2 核心Hooks

```typescript
// 商店主Hook
function useShop(): {
  activeShop: ShopType;
  setActiveShop: (type: ShopType) => void;
  products: ShopProduct[];
  purchase: (productId: string, quantity: number) => Promise<PurchaseResult>;
  refresh: () => void;
}

// 商店等级Hook
function useShopLevel(): {
  level: number;
  exp: number;
  progress: number;
  discount: number;
  addExp: (amount: number) => void;
}

// 限时特卖Hook
function useDailySale(): {
  products: SaleProduct[];
  countdown: number;
  purchase: (productId: string) => Promise<PurchaseResult>;
}

// 商店任务Hook
function useShopTasks(): {
  dailyTasks: ShopTask[];
  weeklyTasks: ShopTask[];
  claim: (taskId: string) => void;
}
```

---

## 七、实现计划

### Phase 1: 核心重构
1. 扩展商店类型系统（types.ts）
2. 新增商店等级服务（shopLevelService.ts）
3. 新增限时特卖服务（dailySaleService.ts）
4. 更新商店配置（shopConfigs.ts）

### Phase 2: UI组件
1. 重写ShopPanel主组件
2. 创建货币栏组件
3. 创建商品卡片组件
4. 创建商品详情弹窗
5. 创建商店任务组件

### Phase 3: 新商店
1. 实现竞技商店
2. 实现飞升商店
3. 实现神秘商人

### Phase 4: 增强功能
1. 收藏系统
2. 批量购买
3. 商店任务
4. 搜索筛选

---

## 八、文件结构

```
src/lib/game/shop/
├── types.ts              # 类型定义（扩展）
├── currencyService.ts    # 货币服务
├── shopService.ts        # 商店服务（扩展）
├── shopLevelService.ts   # 商店等级服务（新）
├── dailySaleService.ts   # 限时特卖服务（新）
├── shopTaskService.ts    # 商店任务服务（新）
├── mysteryMerchantService.ts # 神秘商人服务（新）
├── productConfigs.ts     # 商品配置（扩展）
├── shopConfigs.ts        # 商店配置（扩展）
└── index.ts              # 导出入口

src/components/game/shop/
├── ShopPanel.tsx         # 主面板
├── CurrencyBar.tsx       # 货币栏（新）
├── ProductCard.tsx       # 商品卡片（新）
├── ProductDetailModal.tsx # 商品详情（新）
├── DailySaleBanner.tsx   # 特卖横幅（新）
├── ShopLevelProgress.tsx # 等级进度（新）
├── ShopTaskPanel.tsx     # 任务面板（新）
├── MysteryMerchantModal.tsx # 神秘商人（新）
├── ShopFilterBar.tsx     # 筛选栏（新）
└── index.ts              # 导出入口

src/hooks/shop/
├── useShop.ts            # 商店主Hook
├── useShopLevel.ts       # 商店等级Hook
├── useDailySale.ts       # 特卖Hook
├── useShopTasks.ts       # 任务Hook
├── useFavorites.ts       # 收藏Hook
└── index.ts              # 导出入口
```

---

## 九、兼容性说明

### 向后兼容
- 保留原有货币类型映射
- 保留原有购买回调接口
- 新增可选参数，不影响现有调用

### 迁移策略
- 旧数据自动迁移到新格式
- 商店等级默认为1级
- 任务系统自动初始化

---

## 十、预期效果

### 用户体验提升
- 更丰富的商品选择
- 更有成就感的商店等级
- 更有趣的限时特卖
- 更便捷的购物体验

### 可玩性提升
- 每日登录查看特卖
- 完成商店任务获得奖励
- 追求商店等级提升
- 神秘商人的惊喜感

### 经济平衡
- 限时特卖促进消费
- 商店等级鼓励长期投入
- 任务系统增加活跃度
