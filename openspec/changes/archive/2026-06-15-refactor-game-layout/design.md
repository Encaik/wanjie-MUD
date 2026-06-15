# 游戏主页面架构重构设计

## 一、GameStore 设计

### 1.1 核心思路

当前的 `useGameState.tsx` 是一个巨型 Provider，内部调用各模块的领域 Hook（`useGameCultivation`、`useGameFaction` 等），将所有 action 聚合到一个 Context 中暴露。重构后：

- **GameStore** 只提供状态读写通道：`gameState`（只读）+ `dispatch`（不可变更新）
- **领域 Hook** 各自从 GameStore 读取状态，导出该领域专属的 action 函数
- 组件只消费自己需要的领域 Hook，不再依赖全能 Context

### 1.2 GameStore 结构

```
src/views/game/
├── GameStore.tsx          ← 新建：轻量 store（~50 行）
│   ├── GameStoreProvider   ← Context Provider：gameState + dispatch
│   ├── useGameStore()      ← Hook：读取 gameState + dispatch
│   └── useGameDispatch()   ← Hook：仅读取 dispatch（写操作专用）
│
├── domainHooks/
│   ├── useCultivation.ts   ← 从 useGameState 中提取，改为自取 store
│   ├── useFaction.ts       ← 同上
│   ├── useEquipment.ts     ← 同上（装备/碎片/升级）
│   ├── useAdventure.ts     ← 同上
│   ├── useShop.ts          ← 同上
│   ├── useCrafting.ts      ← 同上（炼丹/炼器）
│   ├── useAscension.ts     ← 同上（飞升流程）
│   ├── useBattle.ts        ← 同上（战斗）
│   ├── useInventory.ts     ← 同上（物品使用）
│   ├── useSaveLoad.ts      ← 同上（存档）
│   ├── useAchievement.ts   ← 同上（成就/图鉴/统计）
│   └── useTower.ts         ← 同上（试炼塔）
│
├── useGameHooks.ts          ← 保留：派生数据选择器 Hook
│   （useProtagonist, useHpMp, useStats, useCombatStats 等不变）
│
└── types.ts                 ← 精简：移除 GameContextType，保留 UI 类型
```

### 1.3 GameStore API

```typescript
// GameStore.tsx

interface GameStoreValue {
  gameState: GameState;
  dispatch: (updater: (prev: GameState) => GameState) => void;
}

// 读取完整 store
export function useGameStore(): GameStoreValue;

// 仅写（避免因读取 state 导致不必要的重渲染）
export function useGameDispatch(): (updater: (prev: GameState) => GameState) => void;
```

### 1.4 领域 Hook 改造模式

```typescript
// ❌ 当前：参数注入式（只能在 Provider 内部使用）
export function useGameCultivation({
  state, setState, addMessage
}: CultivationHookParams) { ... }

// ✅ 目标：自取式（任何组件可独立使用）
export function useCultivation() {
  const { gameState, dispatch } = useGameStore();
  const addMessage = useAddMessage(); // 共享的消息添加器

  const performCultivation = useCallback(() => {
    dispatch(prev => { /* ... */ });
    addMessage('success', '修炼完成', '...');
  }, [dispatch, addMessage]);

  return { performCultivation, performRest, toggleAutoCultivation, ... };
}
```

### 1.5 迁移策略

将 `useGameState.tsx` 中现有的 100+ 个 action 函数按领域分类，逐个提取到对应的 `domainHooks/useXxx.ts` 中。提取过程中：

1. 不修改 action 内部逻辑（只改变数据获取方式）
2. `addMessage` 抽取为独立的 `useAddMessage()` Hook
3. 保持 action 函数签名不变，确保调用方无需修改
4. 渐进式迁移：可以先提取一个领域（如 `useCultivation`），验证可行后再继续

---

## 二、功能导航设计（底栏 + 万界盘）

### 2.1 设计目标

- 14 个功能面板不全部平铺，降低认知负担
- 高频操作（修炼、机缘）一键即达
- 低频操作通过万界盘分组展示，两步可达
- 导航本身有修仙游戏感，不是普通 Tab 栏

### 2.2 布局结构

```
┌──────────────────────────────────────────┐
│            GameHeader                     │
├────┬─────────────────────────────────────┤
│    │                                     │
│ L  │     Center Area                     │
│ e  │                                     │
│ f  │   ┌───────────────────────────┐     │
│ t  │   │   活跃面板内容             │     │  R
│    │   │   (CultivationPanel 等)   │     │  i
│ S  │   │                           │     │  g
│ i  │   └───────────────────────────┘     │  h
│ d  │                                     │  t
│ e  │   ┌───────────────────────────┐     │
│ b  │   │ 🧘修炼 🗺️机缘 🏰势力 ⚔️功法 🛒商店 [✦] │  S
│ a  │   └───────────────────────────┘     │  i
│ r  │         ↑ 底栏（5主入口+万界盘按钮）  │  d
│    │                                     │  e
└────┴─────────────────────────────────────┘

点击 ✦ 后万界盘从底部滑出：

┌────┬─────────────────────────────────────┐
│    │  （内容区略微缩小/变暗）              │
│    │                                     │
│    │  ╔══════════════════════════════╗   │
│    │  ║      ✦ 万 界 盘 ✦          ║   │
│    │  ║                            ║   │
│    │  ║  炼造                      ║   │
│    │  ║  ⚗️炼丹  🔨炼器  📦碎片    ║   │
│    │  ║                            ║   │
│    │  ║  武备                      ║   │
│    │  ║  💪技能  🏆试炼            ║   │
│    │  ║                            ║   │
│    │  ║  记载                      ║   │
│    │  ║  🏅成就  📖图鉴  📊统计    ║   │
│    │  ║                            ║   │
│    │  ║  ───────────────────       ║   │
│    │  ║  [关闭]                    ║   │
│    │  ╚══════════════════════════════╝   │
│    │                                     │
└────┴─────────────────────────────────────┘
```

### 2.3 功能面板分组

| 区域 | 面板 | 频率 | 说明 |
|------|------|------|------|
| **底栏主入口** | 修炼、机缘、势力、功法、商店 | 高 | 始终可见，一键切换 |
| **万界盘·炼造** | 炼丹、炼器、碎片 | 中低 | 有材料时使用 |
| **万界盘·武备** | 技能、试炼 | 中低 | 调整配置/挑战 |
| **万界盘·记载** | 成就、图鉴、统计 | 低 | 查看参考 |

### 2.4 PanelNav 组件

```typescript
// PanelNav.tsx — 底栏组件
interface PanelNavProps {
  activePanel: PanelId;
  onPanelChange: (panel: PanelId) => void;
  // 状态提示
  hasActiveCrafting: boolean;   // 炼丹进行中 → 红点
  canPromote: boolean;           // 可晋升 → 光点
  hasNewAchievement: boolean;    // 新成就 → 光点
}
```

- 5 个主入口渲染为 icon + 标签（移动端仅 icon）
- `✦` 按钮触发万界盘弹出
- 主入口上的状态指示器（红点/光点）从对应领域 Hook 获取

### 2.5 WanjiePanel（万界盘）

```typescript
// WanjiePanel.tsx — 万界盘弹出面板
interface WanjiePanelProps {
  open: boolean;
  onClose: () => void;
  onPanelSelect: (panel: PanelId) => void;
}
```

- 从底部滑入动画（`transition` + `translateY`）
- 三组功能卡片，每组带中文标题
- 点击面板 → 关闭万界盘 + 切换面板
- 点击背景蒙层 → 关闭万界盘
- 移动端全宽，桌面端居中最大宽度 480px

### 2.6 面板切换机制

当前使用 `ActionTab` 联合类型 + Tabs 组件。重构后：

```typescript
type PanelId = 'cultivation' | 'technique' | 'equipment' | 'fragment' | 'skill'
  | 'alchemy' | 'forge' | 'adventure' | 'faction' | 'shop'
  | 'tower' | 'achievement' | 'collection' | 'statistics';

// CenterArea 中
const [activePanel, setActivePanel] = useState<PanelId>('cultivation');

// 渲染映射表
const PANEL_MAP: Record<PanelId, React.FC> = {
  cultivation: CultivationPanel,
  technique: TechniquePanel,
  // ...
};
```

---

## 三、弹窗管理设计

### 3.1 设计目标

- 弹窗的 open/close 逻辑分布到触发它的组件
- 全局只保留一个渲染层（DialogLayer）
- 支持弹窗间数据传递（如 upgradeTarget 传给 UpgradePanel）

### 3.2 useDialogController

```typescript
// useDialogController.ts

interface DialogState {
  id: string;
  type: DialogType;
  props: Record<string, unknown>;
}

// 全局弹窗注册表（不放在 React state 中避免批量重渲染）
const dialogRegistry = createDialogRegistry();

export function useDialogController() {
  return {
    open: (type: DialogType, props?: Record<string, unknown>) => { ... },
    close: (type: DialogType) => { ... },
    getActive: () => dialogRegistry.getActive(),
  };
}
```

### 3.3 DialogLayer

```typescript
// DialogLayer.tsx — 在 GameLayout 中渲染一次

export function DialogLayer() {
  const { getActive } = useDialogController();
  const activeDialogs = getActive();

  return (
    <>
      {activeDialogs.map(d => {
        const Component = DIALOG_MAP[d.type];
        return <Component key={d.id} {...d.props} />;
      })}
    </>
  );
}
```

### 3.4 各弹窗归属

| 弹窗 | 触发源 | 管理方式 |
|------|--------|---------|
| 重置确认 | LeftSidebar | LeftSidebar 内部用 `open('resetConfirm')` |
| 退出机缘确认 | AdventurePanel | AdventurePanel 内部管理 |
| 升级面板 | TechniquePanel/EquipmentPanel | 对应 Panel 用 `open('upgrade', { item })` |
| 流派选择 | CultivationPanel | CultivationPanel 内部管理 |
| 设置面板 | GameHeader | GameHeader 用 `open('settings')` |
| 开发者面板 | debug 模式 | GameHeader 或独立触发 |
| 飞升流程弹窗 | useAscensionFlow() | `useAscensionFlow` Hook 自管理阶段 |
| 死亡弹窗 | 全局状态 | `useDeathState()` Hook |
| 战斗弹窗 | useBattle() | `useBattle` Hook 管理 |

### 3.5 飞升流程特别处理

飞升流程涉及 3 个连续弹窗（守卫战斗 → 传承选择 → 世界揭示），由 `useAscensionFlow()` Hook 统一管理阶段状态机：

```
phase: 'idle'
  → challengeGuardian() → phase: 'battle'
  → onBattleEnd() → phase: 'inheritance'
  → onInheritanceConfirm() → phase: 'world_reveal'
  → onWorldConfirm() → phase: 'idle'
```

每个 phase 对应一个弹窗，飞升流程的状态不再存在于 MainGame 中。

---

## 四、UI 状态下放

### 4.1 迁移清单

| 当前状态 | 当前位置 | 目标位置 | 说明 |
|---------|---------|---------|------|
| `mentalState` | MainGame | CultivationPanel | 修炼面板自行读取 protagonist.mentalState |
| `upgradeTarget` | MainGame | TechniquePanel / EquipmentPanel | 各自通过 `open('upgrade', ...)` 管理 |
| `skillTabActiveTab` | MainGame | SkillsTab | 组件内部 state |
| `announcements` | MainGame | useMultiplayer() Hook | 公告数据属于多人子系统 |
| `showPathSelect` | MainGame | CultivationPanel | 修炼面板内部管理 |
| `ascensionBattleEndedRef` | MainGame | useAscensionFlow() | 飞升流程 Hook 内部 |
| `isExplorationComplete` | MainGame | AdventurePanel | 探索面板内部 useMemo |

### 4.2 共享状态保留

一些状态确实是跨组件共享的，保留在 GameStore 中：
- `protagonist` — 全局主角数据
- `currentTab`/`activePanel` — 当前活跃面板（可考虑放 URL params）
- `battleState`/`activeBattle` — 战斗状态
- `ascensionFlow` — 飞升阶段（驱动多步骤弹窗）

---

## 五、新组件调用链

```
app/game/page.tsx — 路由守卫（~30行）
  │
  ▼
GameLayout.tsx — 布局骨架（~80行）
  ├── GameStoreProvider ← 包裹整个游戏页面
  │
  ├── GameHeader        ← useGameStore() 拿走主角数据
  │                     ← useDialogController().open('settings')
  │
  ├── LeftSidebar       ← StatusPanel (useProtagonistInfo + useHpMp)
  │   ├── StatusPanel   ← SaveLoadPanel (useSaveLoad)
  │   └── WorldInfoPanel ← WorldInfoPanel (useGameStore 读 world)
  │
  ├── CenterArea         ← useState(activePanel)
  │   ├── PanelNav      ← activePanel + onPanelChange + 状态提示
  │   ├── WanjiePanel   ← open/close + onPanelSelect
  │   └── PanelContent  ← PANEL_MAP[activePanel] 渲染
  │       ├── CultivationPanel ← useCultivation() 自取 actions
  │       ├── FactionPanel     ← useFaction() 自取 actions
  │       ├── ... 其余 Panel  ← 各自领域 Hook
  │       └── BattleDialog    ← useBattle() 管理
  │
  ├── RightSidebar      ← useState(sidebarTab)
  │   ├── ChatRoom      ← useChat()
  │   ├── MessagePanel  ← useMessages()
  │   ├── Leaderboard   ← useMultiplayer()
  │   └── Announcements ← useMultiplayer()
  │
  └── DialogLayer       ← 渲染注册表中所有活跃弹窗
```

关键变化：**没有任何 props 从 page.tsx 逐层传递到子组件**。每个组件通过领域 Hook 自取所需。

---

## 六、文件变更汇总

| 操作 | 文件 | 行数预估 |
|------|------|---------|
| **重写** | `src/views/game/useGameState.tsx` | 2204 → 拆分到多个文件 |
| **新建** | `src/views/game/GameStore.tsx` | ~50 |
| **新建** | `src/views/game/domainHooks/useCultivation.ts` | ~150 |
| **新建** | `src/views/game/domainHooks/useFaction.ts` | ~150 |
| **新建** | `src/views/game/domainHooks/useEquipment.ts` | ~120 |
| **新建** | `src/views/game/domainHooks/useAdventure.ts` | ~150 |
| **新建** | `src/views/game/domainHooks/useShop.ts` | ~80 |
| **新建** | `src/views/game/domainHooks/useCrafting.ts` | ~100 |
| **新建** | `src/views/game/domainHooks/useAscension.ts` | ~120 |
| **新建** | `src/views/game/domainHooks/useBattle.ts` | ~100 |
| **新建** | `src/views/game/domainHooks/useInventory.ts` | ~80 |
| **新建** | `src/views/game/domainHooks/useSaveLoad.ts` | ~60 |
| **新建** | `src/views/game/domainHooks/useAchievement.ts` | ~80 |
| **新建** | `src/views/game/domainHooks/useTower.ts` | ~60 |
| **删除** | `src/views/game/MainGame.tsx` | -1023 |
| **重写** | `src/views/game/GameLayout.tsx` | 87 → ~120 |
| **重写** | `src/views/game/CenterPanel.tsx` | 48 → ~100（集成导航） |
| **新建** | `src/views/game/PanelNav.tsx` | ~100 |
| **新建** | `src/views/game/WanjiePanel.tsx` | ~120 |
| **新建** | `src/views/game/DialogLayer.tsx` | ~80 |
| **新建** | `src/views/game/useDialogController.ts` | ~60 |
| **重写** | `src/app/game/page.tsx` | 126 → ~30 |
| **精简** | `src/views/game/types.ts` | 移除 GameContextType |
| **改造** | 各模块 `hooks/useXxx.ts` | 改为从 GameStore 自取 |
