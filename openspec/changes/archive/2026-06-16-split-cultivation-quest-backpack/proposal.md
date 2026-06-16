## Why

当前 `CultivationPage`（修炼页面）混杂了三个不同关注点：修炼操作、新手引导任务、背包物品管理。`CultivationPanel.tsx` 达到 682 行，超过 300 行硬约束两倍以上。任务模块（`modules/quest/`）只有 logic + hooks，没有任何组件和页面——任务面板形同虚设。新手任务数据（`TUTORIAL_TASKS`）错误地放在 `modules/faction/logic/` 下，UI 却嵌在修炼面板中。

同时导航结构不合理：功法和装备作为低频操作占据主标签位，而高频的背包却没有独立入口（只能从修炼页下方翻到）。

## What Changes

### 导航重排
- **主标签**（6 个常驻）：修炼、机缘、势力、**任务** 🆕、商店、**背包** 🆕
- **功法、装备** 从主标签移入万界盘「武备」分组
- 万界盘「武备」组变为：技能、试炼、功法、装备

### 修炼面板拆分
- **新手引导任务 UI** 从 `CultivationPanel` 移出 → 新建 `QuestPanel`（统一任务面板）
- **突破/渡劫/天道挑战** 从 `CultivationPanel` 拆分 → 新建 `BreakthroughPanel`
- `CultivationPanel` 瘦身至约 250 行，只保留：流派信息、修炼操作、恢复/休息、心魔提示

### 任务模块统一
- `modules/faction/logic/tutorialTaskSystem.ts` **完整迁移**至 `modules/quest/logic/tutorialTasks.ts`
- 任务系统通用类型（`BaseTask`、`ITaskSystem`、`TaskSystemState` 等）从 `faction/logic/types.ts` 迁移至 `modules/quest/types.ts`
- faction 模块更新所有引用，导入路径改为 `@/modules/quest`
- 新建 `modules/quest/components/QuestPanel.tsx`：统一展示新手引导任务 + questState 进行中任务

### 背包独立
- 新建 `BackpackPage` 和路由 `/game/backpack`
- 复用现有 `InventoryPanel`（全局状态模式），不从 props 传入
- `CultivationPage` 中移除 `InventoryPanel`

## Capabilities

### New Capabilities
- `quest-panel`: 统一任务面板，展示新手引导任务和进行中的 NPC 任务
- `backpack-page`: 独立背包页面，可从主标签直接访问

### Modified Capabilities
- `cultivation-panel`: 从混杂面板瘦身为纯修炼面板，突破子系统独立
- `game-navigation`: 主标签和万界盘面板重排
- `quest-module`: 任务类型和逻辑统一到 quest 模块，faction 不再持有任务基础设施

## Impact

- **modules/quest/**: 新增 types.ts、logic/tutorialTasks.ts、components/QuestPanel.tsx
- **modules/faction/logic/**: 删除 tutorialTaskSystem.ts，types.ts 的通用任务类型移至 quest
- **modules/progression/components/**: CultivationPanel 瘦身，新增 BreakthroughPanel
- **views/game/pages/**: 新增 QuestPage、BackpackPage；CultivationPage 移除任务+背包
- **views/game/navigation/panelRegistry.tsx**: 导航重排
- **app/game/**: 新增 quest/page.tsx、backpack/page.tsx
- **src/modules/README.md**: 同步 quest 模块变更
