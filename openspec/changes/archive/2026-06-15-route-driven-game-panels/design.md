## Context

项目采用五层架构（app → views → modules → core → shared）。游戏主界面当前在 `views/game/GameLayout.tsx` 中以单文件管理全部 14 个功能面板：`GameLayout` 调用 13 个领域 Hook，将 100+ 个 props 传给 `PanelContent`，后者通过 switch-case 根据 `useState(activePanel)` 渲染对应面板。底部 `PanelNav` 提供 5 个主入口 + "万界"按钮触发 `WanjiePanel` 底部滑出面板（9 个次要功能）。

项目使用 Next.js 16 App Router，当前仅有 `/game` 一个路由页面，所有面板切换通过客户端状态完成。

约束：
- `app/` 目录只放 `page.tsx` 和 `layout.tsx`
- 组件 ≤300 行，Hook ≤200 行
- `views/` 组合模块 Panel，不含业务逻辑
- `modules/<domain>/hooks/` 管理状态，`modules/<domain>/logic/` 纯函数
- components 只接收 props 渲染，不直接调 setGameState

## Goals / Non-Goals

**Goals:**
- 中间区域面板由路由驱动，URL 反映当前面板（如 `/game/cultivation`），支持浏览器前进/后退、深链、刷新保持状态
- 菜单位于中间栏顶部，固定展示 6 个常用标签（修炼/机缘/势力/功法/商店/装备），其余通过"更多"触发万界盘
- 每个面板页面只调用自己需要的领域 Hook，消除 100+ props 透传
- 新增面板只需：创建路由文件夹 + 创建 PanelPage + 注册到 panelRegistry，不影响其他文件
- 万界盘保留现有组件和交互，仅触发入口从独立按钮改为 GameMenu 的"更多"标签
- 一次性全部迁移，不保留旧代码

**Non-Goals:**
- 不修改任何模块的业务逻辑（`modules/<domain>/logic/` 保持不变）
- 不修改领域 Hook 的实现（`domainHooks/` 保持不变，只是调用方从 `GameLayout` 变为各 `PanelPage`）
- 不修改 LeftSidebar / RightSidebar / GameHeader / DialogLayer 的内部实现
- 不修改 WanjiePanel 的内部实现（仅改 `onWanjieOpen` 的来源和触发入口的 label）

## Decisions

### Decision 1: 独立路由文件夹而非 `[panel]` 动态路由

**选择**: 14 个独立文件夹（`/game/cultivation/page.tsx`、`/game/adventure/page.tsx` 等），每个返回自己的 `PanelPage` 组件。

**替代方案**: `/game/[panel]/page.tsx` 动态路由 + switch-case 分发。

**理由**: 独立文件夹允许每个面板页面在未来独立扩展（如为特定面板新增 `loading.tsx`、子布局、或内嵌弹窗路由）。增删面板只需操作对应文件夹，无需修改一个巨大的 switch-case。14 个文件虽然多，但每个都极薄（≈15 行），且结构完全一致。

**页面文件模板**（每个 `app/game/<panel>/page.tsx`）:
```tsx
import { CultivationPage } from '@/views/game/pages/CultivationPage';

export default function Page() {
  return <CultivationPage />;
}
```

### Decision 2: PanelPage 放在 views/game/pages/ 而非 app/ 内

**选择**: 业务逻辑和 JSX 在 `views/game/pages/<Name>Page.tsx` 中，`app/game/<panel>/page.tsx` 只做一行导入+渲染。

**理由**: 遵循项目架构规则——`app/` 只放路由入口（page.tsx, layout.tsx），页面级组件放 `views/`。保持五层分离。

**PanelPage 模板**:
```tsx
// views/game/pages/CultivationPage.tsx
'use client';

import { useGameStore } from '@/views/game/state/GameStore';
import { useCultivation } from '@/views/game/domainHooks/useCultivation';
import { useInventory } from '@/views/game/domainHooks/useInventory';
import { CultivationPanel } from '@/modules/progression/components/CultivationPanel';
import { SeclusionPanel } from '@/modules/progression/components/SeclusionPanel';
import { InventoryPanel } from '@/modules/equipment/components/InventoryPanel';

export function CultivationPage() {
  const { gameState } = useGameStore();
  const p = gameState.protagonist!;
  const cultivation = useCultivation();
  const inventory = useInventory();

  return (
    <div className="space-y-3">
      <CultivationPanel
        onCultivate={cultivation.performCultivation}
        onRest={cultivation.performRest}
        // ... only cultivation-related props
      />
      <SeclusionPanel onSeclusion={cultivation.performSeclusion} ... />
      <InventoryPanel inventory={p.inventory} onUseItem={inventory.useItem} ... />
    </div>
  );
}
```

### Decision 3: 统一面板注册表 panelRegistry.ts

**选择**: 在 `views/game/navigation/panelRegistry.ts` 中定义一个 `PANELS` 对象，包含 14 个面板的完整元数据。`GameMenu` 和 `WanjiePanel` 都引用此注册表。

**替代方案**: `GameMenu` 和 `WanjiePanel` 各维护一份面板列表。

**理由**: 单一数据源。新增面板只需在注册表中加一条记录，菜单和万界盘自动同步。未来如果调整某个面板的分类（primary ↔ secondary），只需改一处。

**结构**:
```typescript
import { Sparkles, Swords, Building2, Zap, ShoppingBag, Shield,
         FlaskConical, Anvil, Package, Landmark, Trophy, BookOpen, BarChart3 }
  from 'lucide-react';

export interface PanelDefinition {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: 'primary' | 'secondary';
  group?: string;        // secondary 面板在万界盘中的分组
  route: string;          // 如 '/game/cultivation'
}

export const PANELS: Record<string, PanelDefinition> = {
  // —— 主标签（6 个）——
  cultivation:  { id: 'cultivation',  label: '修炼', icon: <Sparkles className="w-4 h-4" />,    category: 'primary',   route: '/game/cultivation' },
  adventure:    { id: 'adventure',    label: '机缘', icon: <Swords className="w-4 h-4" />,      category: 'primary',   route: '/game/adventure' },
  faction:      { id: 'faction',      label: '势力', icon: <Building2 className="w-4 h-4" />,   category: 'primary',   route: '/game/faction' },
  technique:    { id: 'technique',    label: '功法', icon: <Zap className="w-4 h-4" />,         category: 'primary',   route: '/game/technique' },
  shop:         { id: 'shop',         label: '商店', icon: <ShoppingBag className="w-4 h-4" />, category: 'primary',   route: '/game/shop' },
  equipment:    { id: 'equipment',    label: '装备', icon: <Shield className="w-4 h-4" />,      category: 'primary',   route: '/game/equipment' },

  // —— "更多"（8 个，万界盘展示）——
  alchemy:      { id: 'alchemy',      label: '炼丹', icon: <FlaskConical className="w-5 h-5" />, category: 'secondary', group: '炼造', route: '/game/alchemy' },
  forge:        { id: 'forge',        label: '炼器', icon: <Anvil className="w-5 h-5" />,        category: 'secondary', group: '炼造', route: '/game/forge' },
  fragment:     { id: 'fragment',     label: '碎片', icon: <Package className="w-5 h-5" />,      category: 'secondary', group: '炼造', route: '/game/fragment' },
  skill:        { id: 'skill',        label: '技能', icon: <Swords className="w-5 h-5" />,       category: 'secondary', group: '武备', route: '/game/skill' },
  tower:        { id: 'tower',        label: '试炼', icon: <Landmark className="w-5 h-5" />,     category: 'secondary', group: '武备', route: '/game/tower' },
  achievement:  { id: 'achievement',  label: '成就', icon: <Trophy className="w-5 h-5" />,       category: 'secondary', group: '记载', route: '/game/achievement' },
  collection:   { id: 'collection',   label: '图鉴', icon: <BookOpen className="w-5 h-5" />,     category: 'secondary', group: '记载', route: '/game/collection' },
  statistics:   { id: 'statistics',   label: '统计', icon: <BarChart3 className="w-5 h-5" />,    category: 'secondary', group: '记载', route: '/game/statistics' },
} as const;

export const PRIMARY_PANELS = Object.values(PANELS).filter(p => p.category === 'primary');
export const SECONDARY_PANELS = Object.values(PANELS).filter(p => p.category === 'secondary');
```

### Decision 4: GameMenu 组件设计

**选择**: 渲染 PRIMARY_PANELS 的 6 个 `<Link>` 标签 + "更多"按钮。使用 `usePathname()` 判断当前路由高亮。状态提示点通过 props 传入。

**布局**:
```
┌──────────────────────────────────────────────────────────────┐
│  [✦修炼] [⚔机缘] [🏛势力●] [⚡功法] [🛒商店] [🛡装备]  [⋯更多●] │
│   active                                  yellow-dot  pulse  │
└──────────────────────────────────────────────────────────────┘
```

**组件接口**:
```typescript
interface GameMenuProps {
  statusDots?: {
    factionPromotion?: boolean;   // 势力标签黄点
    cultivationAlert?: boolean;   // 修炼标签脉冲点（自动修炼中）
    wanjieDot?: boolean;          // "更多"标签脉冲点（炼丹/炼器中）
  };
}
```

**组件位置**: 在 `layout.tsx` 中放于中间栏顶部，`{children}` 之上。

### Decision 5: 状态提示点迁移

| 状态 | 旧位置（PanelNav） | 新位置（GameMenu） | 判断逻辑（不变） |
|------|-------------------|-------------------|----------------|
| 炼丹/炼器中 | 万界按钮 脉冲点 | "更多"标签 脉冲点 | `!!gameState.crafting \|\| !!gameState.forging` |
| 势力可晋升 | 势力标签 黄点 | 势力标签 黄点 | `checkRankPromotion(factionProgress, faction.type)` |
| 自动修炼中 | 修炼标签 脉冲点 | 修炼标签 脉冲点 | `gameState.autoCultivating` |

判断逻辑在 `layout.tsx` 中保留（当前在 `GameLayout` 中），通过 props 传给 `GameMenu`。

### Decision 6: WanjiePanel 保留最小修改

**修改内容**:
- 移除 `PANEL_GROUPS` 内部定义，改为从 `panelRegistry.ts` 导入 `SECONDARY_PANELS`，按 `group` 字段分组
- 内部 `onPanelSelect` 回调改为使用 `router.push(panel.route)` 而非 `setActivePanel(panel)`

**不修改**:
- 底部滑出动画
- 蒙层交互
- 分组卡片布局
- Escape 键关闭

### Decision 7: GameLayout → layout.tsx 重构

**Before (GameLayout.tsx)**:
- 调用全部 13 个 domainHook
- 管理 `activePanel` / `showWanjiePanel` useState
- 渲染 PanelContent（100+ props）+ PanelNav
- 渲染 DialogLayer + BattleDialog

**After (app/game/layout.tsx)**:
- 调用 `useGameSystems()` + `useMultiplayerHttp()` + `useGameStore()` + `useSaveLoad()`（共享壳需要的全局 hook）
- 管理 `showWanjiePanel` useState（给"更多"按钮和 WanjiePanel 用）
- 计算 `statusDots`（给 GameMenu 用）
- 渲染 GameHeader + LeftSidebar + GameMenu + `{children}` + RightSidebar
- 渲染 DialogLayer + BattleDialog + WanjiePanel（onPanelSelect 改为 router.push）
- **不再调用**: `useCultivation`, `useAdventure`, `useEquipment`, `useShop`, `useCrafting`, `useAscension`, `useBattle`, `useFaction`, `useDevMode` — 这些改为各 PanelPage 自己调用

**BattleDialog 处理**: 战斗弹窗跨面板存在（在机缘面板中触发，但也可能在试炼塔中触发）。`activeBattle` 状态在 `gameState` 中全局存储，弹窗在 layout 层渲染是正确的。触发战斗的 hook（`useAdventure.handleBattleEnd`、`useBattle.challengeTower`）仍需在 PanelPage 中调用，但弹窗的关闭回调需要特别处理。

**DialogLayer**: 弹窗系统基于 `openDialog()` 全局函数，不依赖面板上下文，保持在 layout 层。

### Decision 8: 路由守卫适配

当前 `routeGuard.ts` 只检查 `currentPath === '/game'`。需要扩展为匹配 `/game/*` 前缀：

```typescript
// 已在游戏中 — 所有非游戏页面重定向到 /game
if (isPlaying && !currentPath.startsWith('/game')) {
  return '/game';
}

// /game 和 /game/* 的守卫逻辑相同
if (currentPath.startsWith('/game')) {
  if (!hasProtagonist) {
    if (hasSelectedWorld) return '/character-select';
    if (hasWorlds) return '/world-select';
    return '/';
  }
  return null;
}
```

## Component Architecture (After)

```
app/game/layout.tsx (GameLayout)
├── GameHeader                          ← 不变
├── LeftSidebar                         ← 不变
├── CenterArea (col-span-6)
│   ├── GameMenu                        ← NEW：顶部标签导航
│   │   ├── Link × 6（PRIMARY_PANELS）
│   │   └── "更多"按钮 → setShowWanjiePanel(true)
│   └── {children}                      ← 路由驱动的 PanelPage
├── RightSidebar                        ← 不变
├── WanjiePanel                         ← 保留，入口改为"更多"
│   └── onPanelSelect → router.push()
├── DialogLayer                         ← 不变
├── BattleDialog                        ← 不变
├── CultivationPathSelect               ← 不变
├── CriticalHealthOverlay               ← 不变
├── DeathDialog                         ← 不变
├── SettingsPanel                       ← 不变
└── AnnouncementContainer               ← 不变

app/game/<panel>/page.tsx (14 个，每个 ≈15 行)
└── views/game/pages/<Name>Page.tsx     ← 调自己的 domainHook，渲染 Panel 组件
```

## Call Chain Comparison

**Before**:
```
GameLayout
├─ useCultivation()     ─┐
├─ useAdventure()       ─┤
├─ useEquipment()       ─┤
├─ useShop()            ─┤
├─ useCrafting()        ─┤
├─ useAscension()       ─┤ 13 个 Hook 全部调用
├─ useBattle()          ─┤
├─ useFaction()         ─┤
├─ useInventory()       ─┤
├─ useSaveLoad()        ─┤
├─ useGameActions()     ─┤
├─ useDevMode()         ─┘
└─ PanelContent ← 100+ props 透传
    └─ switch(panel) → PanelComponent
```

**After**:
```
layout.tsx
├─ useGameSystems()     ← 全局系统
├─ useMultiplayerHttp() ← 多人游戏
├─ useSaveLoad()        ← 存档（侧边栏用）
└─ useGameStore()       ← 核心状态

CultivationPage (只调 2 个 Hook)
├─ useCultivation()
└─ useInventory()

AdventurePage (只调 2 个 Hook)
├─ useAdventure()
└─ useBattle()
```

## Risks / Trade-offs

- **[风险] 14 个路由文件夹 + 14 个 Page 组件 = 28 个新文件**: 虽然数量多，但每个文件都极薄（page.tsx ≈15 行，PanelPage ≈30-60 行）。结构高度统一，维护成本低。
- **[风险] BattleDialog 跨面板**: 战斗弹窗在机缘面板中触发，但弹窗渲染在 layout 层。`handleBattleEnd` 回调需要 `useAdventure` Hook，而 Hook 在 AdventurePage 中。需要在 layout 层通过 `gameState.activeBattle` 判断渲染，关闭时通过事件通知 AdventurePage。但当前已使用 `openDialog` 全局函数 + `useGameStore` 全局状态，此模式保持一致即可。
- **[风险] 路由守卫需要处理所有 `/game/*` 路径**: 修改 `routeGuard.ts` 使用 `startsWith('/game')` 匹配。
- **[取舍] panelRegistry 使用 JSX 元素而非 lazy 组件**: icon 直接存 JSX 元素（`<Sparkles className="w-4 h-4" />`）而非 `lazy(() => import(...))`。14 个面板的图标库体积小，lazy 引入的异步复杂度不值得。

## Migration Plan

一次性全部迁移，不保留旧代码：

1. **Phase 1 — 基础设施**: 创建 `panelRegistry.ts`、`GameMenu.tsx`、14 个 `PanelPage` 组件
2. **Phase 2 — 路由层**: 创建 14 个 `app/game/<panel>/page.tsx`，更新 `app/game/layout.tsx`，更新 `app/game/page.tsx`（redirect）
3. **Phase 3 — 删除旧代码**: 删除 `PanelNav.tsx`、`PanelContent.tsx`，清理 `GameLayout.tsx`，移除 `WanjiePanel` 中的独立按钮引用
4. **Phase 4 — 验证**: 运行 `pnpm ts-check && pnpm build && pnpm lint:strict`

## Open Questions

- **Q1**: `BattleDialog` 的 `handleBattleEnd` 回调当前通过 `adventure` hook 提供。战斗中如果用户切换到其他面板（如修炼），战斗结束后如何通知机缘面板？建议保持当前行为：战斗中不阻止面板切换（但 `BattleDialog` 遮罩阻止交互），战斗结束后 `activeBattle` 置 null，机缘面板下次渲染时通过 `gameState` 同步最新状态。
- **Q2**: 移动端布局中 PanelNav 被 MobileLayout 引用。移动端是否也需要路由驱动？建议 Phase 1 移动端保持 `MobileLayout` 中的 PanelNav 行为（通过 `activePanel` state），Phase 2 再统一。
