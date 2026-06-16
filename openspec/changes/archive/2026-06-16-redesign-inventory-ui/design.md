## Context

当前项目已引入统一物品系统（`src/modules/item/`），支持 7 种品类（`currency`、`consumable`、`material`、`equipment`、`technique`、`skill`、`fragment`）、6 级稀有度（`common` → `mythic`）、12 个装备/功法固定槽位、动态技能槽、词缀、升级、碎片合成等完整系统。物品的类型信息通过 `ItemTemplate`（静态定义）+ `ItemInstance`（运行时数据）双层建模，UI 通过 `ResolvedItem` 获取合并视图。

**但背包界面仍在用旧系统**（`modules/equipment/components/InventoryPanel`），且新旧两套 InventoryPanel 在视觉设计上都缺乏精致感。本设计定义如何构建一个品类感知、视觉精致的背包界面。

## Goals / Non-Goals

**Goals:**
- 切换到统一物品系统，让 BackpackPage 使用 `modules/item/` 的组件和 Hook
- 构建品类差异化卡片渲染：装备显示稀有度光效+槽位+等级，丹药显示数量+效果图标，材料显示子类+数量
- 构建品类感知的 ItemTooltip：不同品类显示专属信息分区
- 稀有度驱动的视觉层次：边框辉光、呼吸动画、背景渐变
- 响应式网格布局，适配不同屏幕宽度
- 删除 4 个重复的旧 tooltip 组件，统一到新的 ItemTooltip
- 所有文件在 300 行限制内

**Non-Goals:**
- 不修改物品系统的数据模型（types.ts、data/、logic/）
- 不修改装备/功法/skill 的 equip/unequip 逻辑
- 不在此变更中实现拖拽排序或批量操作
- 不修改 BackpackPage 的路由结构（`/game/backpack` 不变）
- 不引入新的第三方依赖

## Decisions

### Decision 1: 布局策略 — 卡片网格 vs 列表

**选择**: 响应式卡片网格（`grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8`），配合品类筛选 Tab。

**理由**:
- 网格布局在同等面积下展示更多物品（4 列 = 同时可见约 16 个物品 vs 列表约 6-8 个）
- 卡片形式更适合稀有度视觉层次（边框、光效、背景渐变在卡片上更突出）
- 现代 RPG 游戏（原神、星穹铁道）均采用网格布局展示背包物品
- 公式：`格子数 = floor((面板宽 - padding - gap) / 格子最小宽)`，格子最小宽 72px

**网格参数**:
```
面板宽度参考（max-w-4xl ≈ 896px，减 padding 48px = 848px 可用）
  sm (640px):  848/(72+8) ≈ 10 → 截断到 8 列
  md (768px):  grid-cols-6
  lg (896px):  grid-cols-8
  默认(移动):   grid-cols-4
```

### Decision 2: 组件拆分策略

**选择**: 拆分为 4 个组件：

```
src/modules/item/components/
├── InventoryPanel.tsx    # 主面板（Tab + 网格 + 效果条）~250 行
├── ItemCard.tsx          # 物品卡片（按品类差异化渲染）~180 行
├── ItemGrid.tsx          # 响应式网格容器 + 空状态 ~60 行
└── ItemTooltip.tsx       # 品类感知详情浮层 ~280 行
```

**各组件职责**:
- `InventoryPanel`: Tab 状态管理、品类筛选计数、activeEffects 条、组合 ItemGrid
- `ItemCard`: 接收 `ResolvedItem`，按 `category` 分支渲染不同视觉模板
- `ItemGrid`: 纯布局容器，响应式列数 + 空状态占位
- `ItemTooltip`: 接收 `ResolvedItem`，按 `category` 渲染专属信息分区

### Decision 3: 物品卡片视觉模板

**选择**: 每种品类有独立的渲染分支，共享稀有度边框框架。

#### 公共框架（所有卡片共享）
```
┌──────────────────────┐
│ ╔══════════════════╗ │ ← 稀有度渐变顶边（2px）
│ ║ [品类图标]       ║ │
│ ║ [名称]           ║ │
│ ║ [数量/等级信息]  ║ │
│ ║ [EXP进度条]      ║ │ ← 仅可升级物品
│ ╚══════════════════╝ │
│ 已装备 角标          │
└──────────────────────┘
  稀有度边框 + 光晕
  (epic+ 有呼吸动画)
```

#### 各品类差异化

**装备卡片** (equipment):
```tsx
// 重点：稀有度光效 + 槽位图标 + 等级
<div className="relative rounded-lg border-2 p-1.5 w-full aspect-square
  border-quality-{rarity} bg-quality-{rarity}/5
  {epic+ && 'animate-glow-pulse'}
  hover:scale-[1.02] hover:shadow-lg hover:shadow-quality-{rarity}/20
  transition-all duration-200">
  {/* 稀有度渐变顶条 */}
  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg
    bg-gradient-to-r from-quality-{rarity} via-quality-{rarity}/60 to-transparent" />
  
  {/* 槽位图标 */}
  <div className="text-center mt-1">
    {slotIcon} {/* Sword/Shield/Helmet/Boot 等 */}
  </div>
  
  {/* 名称 */}
  <div className="text-[11px] font-medium text-center truncate mt-0.5">
    {name}
  </div>
  
  {/* 等级 + 经验条 */}
  {isUpgradable && (
    <Progress value={expPercent} className="h-1 mt-1" />
  )}
  
  {/* 已装备角标 */}
  {equipped && <Badge>已装备</Badge>}
</div>
```

**丹药卡片** (consumable):
```tsx
// 重点：数量 + 效果图标
<div className="relative rounded-lg border p-1.5 ...">
  {/* 效果类型图标（💊 回血 / 🔮 回蓝 / 🌿 修炼 / ⚡ 突破）*/}
  <div className="text-lg text-center">{effectIcon}</div>
  {/* 名称 */}
  <div className="text-[10px] text-center truncate">{name}</div>
  {/* 大号数量 */}
  <div className="text-sm font-bold text-center">x{quantity}</div>
</div>
```

**功法卡片** (technique):
```tsx
// 重点：攻⚔/防🛡 图标 + 等级
<div className="relative rounded-lg border-2 p-1.5 ...">
  <div className="text-lg text-center">{subcategory === 'attack' ? '⚔️' : '🛡️'}</div>
  <div className="text-[11px] text-center truncate">{name}</div>
  {isUpgradable && <Progress ... />}
</div>
```

**技能卡片** (skill):
```tsx
// 重点：标签芯片 + CD 信息
<div className="relative rounded-lg border p-1.5 ...">
  <div className="text-lg text-center">{subcategory === 'magic_skill' ? '✨' : '💥'}</div>
  <div className="text-[10px] text-center truncate">{name}</div>
  {/* 技能标签（瞬发/范围/持续 等） */}
  <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
    {tags.map(tag => <Badge className="text-[8px]">{tag}</Badge>)}
  </div>
</div>
```

**材料卡片** (material):
```tsx
// 重点：简洁 + 子类图标 + 数量
<div className="relative rounded-lg border p-1.5 ...">
  <div className="text-lg text-center">
    {subcategory === 'herb' ? '🌿' : subcategory === 'ore' ? '⛏️' : subcategory === 'gem' ? '💎' : '🦴'}
  </div>
  <div className="text-[10px] text-center truncate">{name}</div>
  <div className="text-xs text-center text-muted-foreground">x{quantity}</div>
</div>
```

**货币卡片** (currency):
```tsx
// 重点：大号数量 + 币种标签
<div className="relative rounded-lg border p-2 col-span-2 ...">
  <div className="flex items-center gap-2">
    <span className="text-lg">💰</span>
    <div>
      <div className="text-[10px] text-muted-foreground">{name}</div>
      <div className="text-lg font-bold font-mono">{quantity.toLocaleString()}</div>
    </div>
  </div>
</div>
```

**碎片卡片** (fragment):
```tsx
// 重点：源物品名 + 碎片标记
<div className="relative rounded-lg border p-1.5 opacity-75 ...">
  <div className="text-lg text-center">🧩</div>
  <div className="text-[9px] text-center truncate">{sourceName} 碎片</div>
  <div className="text-[8px] text-center text-muted-foreground">x{quantity}</div>
</div>
```

### Decision 4: ItemTooltip 品类感知设计

**选择**: 一个 ItemTooltip 组件，内部按 `item.category` 分支渲染不同信息分区。宽度提升至 280px（现 220px 太窄）。

**Tooltip 分区体系**:

```
┌─────────────────────────────┐
│ ① Header（公共）             │
│   [稀有度色标] 名称  品质徽章│
│   类别 · 子类别              │
├─────────────────────────────┤
│ ② Description（公共，如有）  │
│   描述文本                   │
├─────────────────────────────┤
│ ③ Category Section（专属）  │
│                             │
│ [装备]                      │
│   基础属性表（左key右value） │
│   词缀列表（稀有度色标前缀） │
│   技能槽（已装/总槽数）      │
│   等级 EXP 进度条            │
│   元素 · 武器类型            │
│                             │
│ [功法]                      │
│   基础属性表                 │
│   技能槽                     │
│   兼容武器 · 元素            │
│   法力消耗                   │
│   等级 EXP 进度条            │
│                             │
│ [技能]                      │
│   效果列表（图标+描述）      │
│   技能标签芯片组             │
│   冷却时间 · 元素限制        │
│                             │
│ [丹药]                      │
│   效果列表                   │
│   冷却 · 等级/境界要求      │
│                             │
│ [材料]                      │
│   经验值（如是exp材料）      │
│   适用升级品类               │
│                             │
│ [货币]                      │
│   （仅Header + Description） │
│                             │
│ [碎片]                      │
│   源物品预览（名称+稀有度）  │
│   "集齐可合成" 提示          │
├─────────────────────────────┤
│ ④ Footer（条件显示）         │
│   已装备 · 槽位: xxx        │
│   来源: xxx · 获得时间      │
└─────────────────────────────┘
```

**稀有度视觉映射**:

| Rarity | 边框色 | 光晕色 | 文字色 | 动画 |
|--------|--------|--------|--------|------|
| mythic | `border-quality-mythic` | `shadow-quality-mythic/30` | `text-quality-mythic` | 双呼吸（快+慢叠加） |
| legendary | `border-quality-legendary` | `shadow-quality-legendary/25` | `text-quality-legendary` | 慢呼吸 |
| epic | `border-quality-epic` | `shadow-quality-epic/20` | `text-quality-epic` | 慢呼吸 |
| rare | `border-quality-rare` | `shadow-quality-rare/15` | `text-quality-rare` | 无 |
| uncommon | `border-quality-uncommon` | - | `text-quality-uncommon` | 无 |
| common | `border-quality-common` | - | `text-quality-common` | 无 |

**呼吸动画（CSS keyframes）**:
```css
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 4px var(--glow-color); }
  50% { box-shadow: 0 0 12px var(--glow-color); }
}
@keyframes glow-pulse-double {
  0%, 100% { box-shadow: 0 0 4px var(--glow-color), 0 0 8px var(--glow-color-weak); }
  50% { box-shadow: 0 0 12px var(--glow-color), 0 0 24px var(--glow-color-weak); }
}
```

### Decision 5: Tooltip 统一与旧代码删除

**选择**: 新 ItemTooltip 放在 `modules/item/components/ItemTooltip.tsx`，作为项目唯一的物品浮层组件。删除 4 个旧 tooltip，更新所有引用。

**删除文件**:
- `src/shared/ui/overlay/item-tooltip.tsx`
- `src/shared/ui/data-display/item-tooltip.tsx`
- `src/shared/ui/overlay/upgradeable-item-tooltip.tsx`
- `src/shared/ui/data-display/upgradeable-item-tooltip.tsx`

**引用更新策略**:
1. 搜索所有 `from '@/shared/ui/overlay/item-tooltip'` 和 `from '@/shared/ui/data-display/item-tooltip'` 的 import
2. 搜索所有 `from '@/shared/ui/overlay/upgradeable-item-tooltip'` 和 `from '@/shared/ui/data-display/upgradeable-item-tooltip'` 的 import
3. 逐个文件评估：如果该文件使用旧道具系统（`InventoryItem`、`ItemRarity`），**先将其切换到新道具系统**（`ResolvedItem`）；如果仅依赖旧 tooltip 的展示能力且切换成本高，在当前变更中标记为 TODO，确保不影响构建
4. 更新为新 tooltip 的 import + props 格式
5. 删除旧文件
6. 运行 `pnpm ts-check` 确保零错误

**风险缓解**: 如果某个引用处的数据类型是旧 `InventoryItem` 而非新 `ResolvedItem`，可以：
- 在该处调用 `resolveItem(itemInstance)` 获得 `ResolvedItem` 传给新 tooltip
- 或者先完成该模块向新物品系统的迁移（单文件级别，影响面小）

### Decision 6: 稀有度颜色系统统一

**选择**: 所有稀有度颜色统一使用 `data/rarity.ts` 中的配置，不硬编码。组件通过 `RARITY_CONFIG[rarity]` 获取颜色类名。

**理由**: 当前项目中稀有度颜色在至少 5 个位置重复定义（`modules/item/data/rarity.ts`、`modules/equipment/logic/rarityUtils.ts`、`modules/equipment/logic/quality.ts`、`modules/theme/data/rarityStyles.ts`、`ItemTooltip.tsx` 内部常量）。本次变更中，`ItemCard` 和 `ItemTooltip` 统一从 `modules/item/data/rarity.ts` 的导出的 `RARITY_CONFIG` 获取，不新增重复定义。旧模块的重复定义不在本次清理范围（属于 equipment 模块迁移任务）。

### Decision 7: 品类图标映射

**选择**: 使用 emoji + lucide-react 图标混合系统：

```typescript
const CATEGORY_ICON: Record<ItemCategory, string> = {
  currency: '💰',
  consumable: '🧪',
  material: '📦',
  equipment: '⚔️',
  technique: '📜',
  skill: '✨',
  fragment: '🧩',
};

const SUBCATEGORY_ICON: Record<string, string> = {
  // 装备子类
  weapon_melee: '🗡️', weapon_ranged: '🏹',
  armor_head: '👑', armor_body: '🛡️', armor_legs: '👖', armor_feet: '👢',
  // 功法子类
  attack: '⚔️', defense: '🛡️',
  // 技能子类
  magic_skill: '🔮', combat_skill: '💥',
  // 丹药子类
  pill_hp: '❤️', pill_mp: '💙', pill_cultivation: '🌿', pill_breakthrough: '⚡', pill_stat: '💪', scroll: '📃',
  // 材料子类
  herb: '🌿', ore: '⛏️', gem: '💎', beast_part: '🦴', exp_fodder: '💠', special: '🔮',
  // 货币子类
  primary: '💎', faction: '🏛️', sect: '⛩️', honor: '🏅', ascension: '🌟', event: '🎪',
};
```

## Risks / Trade-offs

- **[风险] 旧 tooltip 删除可能影响构建**: 如果有文件在深层嵌套中引用旧 tooltip 且未被搜索覆盖，会导致 ts-check 失败。缓解：先全局搜索所有引用，逐文件处理后再删除。
- **[风险] 文件大小**: `ItemTooltip` 按品类分支渲染可能接近 300 行限制。缓解：如果超出，提取 `TooltipSection` 等子组件或按品类拆分渲染函数到 `logic/` 中。
- **[取舍] emoji 跨平台一致性**: emoji 在不同操作系统渲染效果不同（Windows 黑体 vs macOS 彩色）。缓解：主要品类图标使用 lucide-react 的 `Sword`/`Shield`/`Sparkles`/`Scroll`/`FlaskConical` 等矢量图标，emoji 仅用于子类微标。
- **[取舍] 货币卡片占 2 列宽**: `col-span-2` 让货币卡片突出显示，但可能在某些列数下导致布局不完美。可接受。

## Migration Plan

1. **Phase 1 — 新组件构建**: 创建 ItemCard、ItemGrid，重写 ItemTooltip、InventoryPanel（不影响现有功能）
2. **Phase 2 — BackpackPage 切换**: 修改 BackpackPage 导入为新 InventoryPanel
3. **Phase 3 — 旧 Tooltip 清理**: 全局搜索旧 tooltip 引用 → 逐一迁移 → 删除旧文件
4. **Phase 4 — 导出更新**: 更新 modules/item/ 的 index.ts 桶文件
5. **Phase 5 — 验证**: ts-check → build → lint:strict → check-sizes → dev 目视确认

## Open Questions

- 无（设计已覆盖所有关键决策）
