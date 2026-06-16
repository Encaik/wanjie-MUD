## Context

当前项目有五层架构（app → views → modules → core → shared）。修炼页面 `/game/cultivation` 由 `app/game/cultivation/page.tsx`（路由）→ `CultivationPage`（views）→ `CultivationPanel` + `SeclusionPanel` + `InventoryPanel`（modules 组件）构成。

`CultivationPanel.tsx` 682 行，包含修炼操作、新手任务 UI、突破/渡劫 UI、流派信息、心魔管理等——严重违反 300 行组件限制。`panelRegistry.tsx` 管理 6 个主标签和 8 个万界盘面板的导航。

`modules/quest/` 只有 `logic/` 和 `hooks/`，没有任何 `components/`、`types.ts` 或页面路由——模块不完整。新手任务数据 `TUTORIAL_TASKS` 在 `modules/faction/logic/tutorialTaskSystem.ts`，依赖 `faction/logic/types.ts` 中的通用任务类型。

## Goals / Non-Goals

**Goals:**
- 从 CultivationPanel 中分离新手引导 UI 和突破子系统，使其降至 300 行以内
- 创建独立的 QuestPanel（统一新手引导 + quest 任务）和 BackpackPage
- 将任务相关代码统一到 `modules/quest/`，从 faction 中完整移除
- 导航重排：功法/装备移入万界盘，任务/背包升为主标签
- 不引入任何冗余代码、兼容层或 deprecated 标记

**Non-Goals:**
- 不在此变更中创建 QuestPage 上 quest 系统（questEngine）的高级 UI（任务详情弹窗、分支选择等）——仅展示进行中任务列表
- 不修改 InventoryPanel 的内部实现
- 不修改 questEngine 或 rewardDistributor 的逻辑
- 不修改后端 API

## Decisions

### Decision 1: 导航重排策略

**选择**: 功法、装备从 primary 降为 secondary（武备组），quest、backpack 升为 primary。

**主标签变更**:
```
Before: 修炼 │ 机缘 │ 势力 │ 功法 │ 商店 │ 装备
After:  修炼 │ 机缘 │ 势力 │ 任务 │ 商店 │ 背包
```

**万界盘变更**:
```
Before: 炼丹 │ 炼器 │ 碎片  │  技能 │ 试炼  │  成就 │ 图鉴 │ 统计
        ──炼造──       ──武备──       ──记载──

After:  炼丹 │ 炼器 │ 碎片  │  技能 │ 试炼 │ 功法 │ 装备  │  成就 │ 图鉴 │ 统计
        ──炼造──       ──────────武备──────────       ──记载──
```

**理由**: 功法和装备是配置型操作，设置后很少变更，放万界盘合适。背包和任务是高频操作（使用物品、查看任务进度），应该从主标签直接访问。武备组整合 4 项战斗相关，逻辑自洽。

### Decision 2: CultivationPanel 拆分线

**拆分原则**: 新手引导 → QuestPanel（属于任务关注点）; 突破/渡劫/天道 → BreakthroughPanel（突破是独立子系统，有自己的概率计算、丹药加成、渡劫触发逻辑）; 修炼操作保持。

**CultivationPanel 保留内容**（预计 ~250 行）:
```
├── 流派信息卡（pathConfig 展示 + 选择流派按钮）
├── 修炼操作区（稳健/激进/顿悟/传统/自动修炼按钮）
├── 恢复/休息区
└── 心魔概率警告
```

**BreakthroughPanel 提取内容**（预计 ~180 行）:
```
├── 突破提示与概率显示
├── 经验溢出警告
├── 渡劫提示区
└── 满级天道挑战区
```

**Props 减量**: 移除 `statistics`、`completedTutorialTaskIds` 等任务相关 props，BreakthroughPanel 只接收突破/渡劫所需的 props 子集（`level`、`experience`、`overflowExperience`、`luck`、`activeEffects`、`autoCultivating`、`disabled`、回调）。

### Decision 3: 任务类型迁移策略

**选择**: 将 `faction/logic/types.ts` 中的通用任务类型整体迁移至 `modules/quest/types.ts`，faction 任务系统改为从 `@/modules/quest` 导入。

**迁移内容**:
```
faction/logic/types.ts → modules/quest/types.ts
├── TaskSystemType, TaskStatus
├── TaskItemReward, TaskReward, BaseTask
├── TaskSystemState, TaskProgressResult, ITaskSystem
├── AllTaskSystemsState
├── createDefaultTaskSystemState, createDefaultAllTaskSystemsState
├── checkTaskCompletion, checkTasksProgress, checkNewlyCompletedTask
└── ItemReward (deprecated alias — 迁移后删除)
```

**faction 侧变更**:
- `faction/logic/types.ts` 删除（内容已全部迁移至 quest）
- `faction/logic/factionTaskSystem.ts` 的导入改为 `@/modules/quest`
- `faction/logic/factionTaskSystemNew.ts` 的导入改为 `@/modules/quest`
- `faction/logic/taskProgressSystem.ts` 的导入改为 `@/modules/quest`
- `faction/logic/index.ts` 移除 tutorial 导出，更新其他导出指向

**理由**: quest 是任务系统的规范归属模块，通用任务类型放在 quest 符合"一份内容只在一处存在"原则。quest → quest 自己用，faction → 跨模块依赖 quest（允许的：模块 A logic 调用模块 B logic）。

### Decision 4: QuestPanel 设计

**选择**: QuestPanel 同时展示新手引导任务（TutorialTask）和 quest 引擎中的进行中任务（QuestState.activeQuests），不做 tab 切换——上下分区即可。

```
┌─────────────────────────────────┐
│  📋 任务                         │
├─────────────────────────────────┤
│  🎯 新手引导        [3/7]       │  ← 新手引导区（progress < 1 时显示）
│  ████████░░░░  43%              │
│  ● 当前任务标题 + 提示           │
│  ✓ 已完成列表                    │
├─────────────────────────────────┤
│  进行中的任务                    │  ← questState 区（有任务时显示）
│  📜 任务名 — NPC名               │
│  目标: xxx (2/5)                │
└─────────────────────────────────┘
```

**QuestPanel Props**:
```typescript
interface QuestPanelProps {
  /** 新手引导完成进度 */
  completedTutorialTaskIds: string[];
  /** 角色数据（用于检查任务完成） */
  protagonistLevel: number;
  statistics: GameStatistics;
  activeEffects: ActiveEffect[];
  /** quest 引擎状态 */
  questState: QuestState;
  /** 领取新手任务奖励 */
  onClaimTutorialReward?: (taskId: string) => void;
}
```

**理由**: 任务面板的价值在于"一眼看到所有待办"。新手引导和常规任务混在一个面板中，用户不用在两个页面间切换。上下分区用视觉分隔线区分即可。

### Decision 5: BackpackPage 实现方式

**选择**: BackpackPage 直接复用 `InventoryPanel` 组件，传入 `useGlobalState={true}` 使其从全局 GameStore 自行获取数据。

```tsx
// views/game/pages/BackpackPage.tsx
export function BackpackPage() {
  return <InventoryPanel useGlobalState />;
}
```

**理由**: `InventoryPanel` 已经支持两种数据模式（props 传入 或 全局状态），无需修改组件。BackpackPage 作为一个薄 wrapper 即可。

### Decision 6: 文件大小合规验证

| 文件 | 变更前 | 变更后（预估） | 限制 |
|------|--------|---------------|------|
| `CultivationPanel.tsx` | 682 行 ❌ | ~250 行 ✅ | 300 |
| `BreakthroughPanel.tsx` | — | ~180 行 ✅ | 300 |
| `QuestPanel.tsx` | — | ~150 行 ✅ | 300 |
| `quest/types.ts` | — | ~180 行 ✅ | 300 |
| `tutorialTasks.ts` (quest) | — | ~250 行 ✅ | 500 (logic) |

## Risks / Trade-offs

- **[风险] faction 多个文件同时改导入路径**: `factionTaskSystem.ts`、`factionTaskSystemNew.ts`、`taskProgressSystem.ts`、`faction/logic/index.ts`——虽然改动是机械的（改 import path），但涉及文件多。缓解：先完成 quest/types.ts 迁移，再逐文件更新 faction。
- **[取舍] 现有游戏存档中的 `completedTutorialTaskIds`**: 存在 `gameState` 中，与 faction 模块无关——迁移只改代码路径，不影响存档数据。
- **[取舍] 功法/装备路由保留**: `/game/technique` 和 `/game/equipment` 路由和页面文件保持不变，只是面板在注册表中的 category 从 `primary` 变为 `secondary`。用户在万界盘中仍可访问，不影响功能。
- **[风险] 主标签从 6 个变 6 个（替换而非增加）**: UI 均分空间不变，无布局冲突。

## Migration Plan

1. **Phase 1 — quest 类型层**: 创建 `modules/quest/types.ts`，迁移通用任务类型
2. **Phase 2 — tutorial 迁移**: 移动 `tutorialTaskSystem.ts` 到 quest，更新 faction 导入
3. **Phase 3 — 组件拆分**: 创建 QuestPanel、BreakthroughPanel，瘦身 CultivationPanel
4. **Phase 4 — 路由和页面**: 创建 quest/backpack 路由和页面，修改导航注册表
5. **Phase 5 — 验证**: ts-check、build、lint:strict、文件大小检查

## Open Questions

- 无
