## Why

当前背包界面存在三个核心问题：

**1. 背包页面未接入统一物品系统。** `BackpackPage` 仍从 `@/modules/equipment/components/InventoryPanel` 导入旧的 InventoryPanel，而新的统一物品系统（`src/modules/item/`）已完成类型、逻辑、Hook、组件全链路建设（commit `228529a`），但被闲置。旧系统只支持 4 种粗粒度分类（全部/丹药/材料/其他），无法展示装备、功法、技能、碎片等新品类。

**2. 新 InventoryPanel 视觉设计简陋。** `modules/item/components/InventoryPanel.tsx` 虽然支持 7 品类 Tab 切换和更丰富的数据，但采用简单的线性列表布局（`space-y-1`），缺乏视觉层次。所有品类物品用同一套列表项模板渲染，无法体现装备的属性丰富度 vs 材料的简洁 vs 丹药的效果驱动等差异化展示需求。

**3. Tooltip 组件存在 4 个几乎重复的版本**（`shared/ui/overlay/item-tooltip.tsx`、`shared/ui/data-display/item-tooltip.tsx`、`shared/ui/overlay/upgradeable-item-tooltip.tsx`、`shared/ui/data-display/upgradeable-item-tooltip.tsx`），再加上 `modules/item/components/ItemTooltip.tsx`，总计 5 个 tooltip。违反"同一份内容只在一处存在"原则。

**设计目标**：重新设计背包界面，充分利用统一物品系统的类型信息，为不同品类物品提供差异化的卡片展示和细节浮层，视觉上达到"高级感和精致感"——借鉴现代 RPG 游戏（如《原神》《崩坏：星穹铁道》）的物品界面设计语言：稀有度光效、卡片网格、品类图标、动效过渡。

## What Changes

### 核心变更

- **重写 `BackpackPage`**：切换到 `@/modules/item/components/InventoryPanel`（新统一物品系统）
- **重写 `InventoryPanel`**：从线性列表升级为**卡片网格布局**，按品类差异化渲染
- **重写 `ItemTooltip`**：按品类显示专属信息布局，统一稀有度视觉体系
- **删除 4 个重复 Tooltip**：`shared/ui/overlay/item-tooltip.tsx`、`shared/ui/data-display/item-tooltip.tsx`、`shared/ui/overlay/upgradeable-item-tooltip.tsx`、`shared/ui/data-display/upgradeable-item-tooltip.tsx`
- **新增物品卡片组件**：`ItemCard`（网格卡片）、`ItemGrid`（响应式网格容器）
- **新增稀有度光效系统**：边框渐变色、微光动画、背景光晕（CSS 变量驱动）

### 品类差异化展示

| 品类 | 卡片重点 | Tooltip 重点 |
|------|---------|-------------|
| 装备 equipment | 稀有度光效 + 槽位图标 + 等级条 | 属性列表 + 技能槽位 + 词缀 + 元素 |
| 功法 technique | 攻/防图标 + 等级条 | 属性 + 技能槽 + 兼容武器 + 法力消耗 |
| 技能 skill | 技能标签 + CD 标记 | 效果详情 + 标签 + 元素限制 |
| 丹药 consumable | 数量 + 效果图标 | 效果描述 + 冷却 + 等级要求 |
| 材料 material | 子类图标 + 数量 | 用途说明 + 经验值 |
| 货币 currency | 大号数量 | 货币说明 |
| 碎片 fragment | 源物品名 + 进度 | 源物品预览 + 合成提示 |

### 视觉升级

- **稀有度边框光晕**：mythic 金红渐变 → common 灰色，使用 `box-shadow` + `border-color` 双层效果
- **稀有物品呼吸光动画**：epic+ 品级卡片有缓慢的边框辉光呼吸效果
- **品类图标系统**：使用 lucide-react 图标 + emoji 混合，每个品类和子类有专属图标
- **响应式网格**：`grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8`，适配不同屏幕
- **卡片 hover 微动效**：`hover:scale-[1.02]` + 阴影提升 + 稀有度光效增强
- **空状态插画**：用图标 + 提示文字替代纯文字"暂无物品"

## Capabilities

### New Capabilities
- `inventory-card-grid`: 响应式物品卡片网格，按品类差异化渲染
- `item-detail-tooltip`: 统一品类感知的物品详情浮层，替代全部旧 tooltip
- `rarity-glow-system`: 稀有度驱动光效系统（CSS 变量 + Tailwind 类）

### Modified Capabilities
- `backpack-page`: 切换到统一物品系统，启用新 InventoryPanel
- `inventory-panel`: 从线性列表升级为卡片网格 + 品类差异化
- `item-tooltip`: 统一为品类感知浮层，删除所有旧版本

### Removed Capabilities
- `old-item-tooltip`: 删除 `shared/ui/overlay/item-tooltip.tsx` 和 `shared/ui/data-display/item-tooltip.tsx`
- `old-upgradeable-tooltip`: 删除 `shared/ui/overlay/upgradeable-item-tooltip.tsx` 和 `shared/ui/data-display/upgradeable-item-tooltip.tsx`

## Impact

- **`src/views/game/pages/BackpackPage.tsx`**: 切换到新 InventoryPanel 导入
- **`src/modules/item/components/InventoryPanel.tsx`**: 全面重写（~195 行 → ~280 行）
- **`src/modules/item/components/ItemTooltip.tsx`**: 全面重写（~132 行 → ~250 行）
- **`src/modules/item/components/ItemCard.tsx`** 🆕: 物品卡片组件（~150 行）
- **`src/modules/item/components/ItemGrid.tsx`** 🆕: 响应式网格容器（~50 行）
- **`src/modules/item/components/index.ts`**: 更新导出
- **`src/modules/item/index.ts`**: 更新导出
- **`src/shared/ui/overlay/item-tooltip.tsx`**: 删除
- **`src/shared/ui/data-display/item-tooltip.tsx`**: 删除
- **`src/shared/ui/overlay/upgradeable-item-tooltip.tsx`**: 删除
- **`src/shared/ui/data-display/upgradeable-item-tooltip.tsx`**: 删除
- **旧引用处**: 搜索所有 import 旧 tooltip 的文件，更新为 `@/modules/item`
- **`src/modules/README.md`**: 同步 item 模块变更
