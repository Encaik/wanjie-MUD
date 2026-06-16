## Why

当前项目存在三个紧密关联的结构性问题：

1. **统计系统分散触发**：游戏统计数据（`GameStatistics`）在 `useAdventure`、`useCultivation`、`useInventory`、`useFaction`、`useSeclusion` 等各处直接赋值更新，无统一入口。部分用 `StatisticsManager.processEvent()`，部分直接展开 `statistics: { ...prev.statistics, xxx }`，触发逻辑散落在 5+ 个 Hook 中，添加新统计项需要在多处寻找触发点。

2. **新手引导与业务逻辑耦合**：新手引导通过 `GameStore.tsx` 中的 `useEffect` 轮询 `gameState.statistics` 来检测任务完成，然后直接操作背包、发放奖励。引导逻辑嵌入初始化流程中，且初始物品硬编码在 `protagonistAdapter.ts`，不在引导体系内。整个引导是一个干巴巴的 7 项顺序任务列表，缺乏教学弹窗和分阶段引导。

3. **任务面板简陋**：`QuestPanel` 只展示新手引导的线性进度条，缺乏对不同任务系统（引导/势力/NPC 任务）的分类展示，没有信息层级和视觉精致感。

项目的 EventBus（`core/events/`）已经完善地支持事件驱动架构，但统计和任务系统没有利用它。

## What Changes

### 核心变更

1. **新建 `core/statistics/` 模块** — 统一统计追踪基础设施
   - 从 `modules/collection/logic/statistics/` 迁移统计更新纯函数到 core/
   - 规范化事件类型定义（按域划分：combat/cultivation/item/adventure/faction…）
   - 纯函数 `processStatisticsEvent(stats, event) → newStats`，无副作用

2. **事件驱动统计采集** — 消除分散触发
   - 各业务 Hook 改为通过 `emit()` 发射游戏事件，不再直接修改 `statistics`
   - `GameStore` 单一 `useEffect` 订阅 `on('*')`，集中处理所有事件 → 更新统计 + 检查任务
   - 对事件处理做节流（1s 批量），避免高频战斗事件导致过度渲染

3. **分阶段新手引导** — 5 阶段引导流程
   - 阶段 0：初入仙途（领取新手礼包，替代硬编码初始物品）
   - 阶段 1：初识修炼（使用丹药 → 修炼）
   - 阶段 2：初露锋芒（进入机缘 → 击败敌人）
   - 阶段 3：融入世界（升到 3 级 → 加入势力）
   - 阶段 4：登堂入室（完成机缘 → 领取成就 → 解锁正式任务）
   - 每个步骤支持可选弹窗（`TutorialDialog`），用于玩法说明

4. **任务中心面板重构** — Tab 式设计
   - Tab：新手引导 | 势力任务 | NPC 任务
   - 每个 Tab 独立渲染各自的进度系统
   - 高级感视觉：渐变装饰、清晰信息层级、进度条动画

5. **初始物品归入引导体系**
   - `protagonistAdapter` 不再硬编码初始物品
   - "领取新手礼包"作为引导第 0 步，统一初始物品分发

### 非目标

- 不改变 `QuestEngine`（NPC 对话驱动的任务系统）的核心逻辑
- 不改变 `AchievementSystem`（成就系统独立运作）
- 不改变 `BattleStatistics`（战斗统计是另一套体系，本次不合并）

## Capabilities

### New Capabilities
- `statistics-tracker`: 统一统计追踪系统（`core/statistics/`）
- `tutorial-guide`: 分阶段事件驱动新手引导
- `quest-panel-redesign`: Tab 式任务中心面板

## Impact

- **新增**: `src/core/statistics/` — 统计追踪基础设施
- **新增**: `src/shared/components/TutorialDialog.tsx` — 引导弹窗组件
- **新增**: `src/modules/quest/logic/tutorialGuide.ts` — 分阶段引导定义
- **新增**: `src/modules/quest/logic/taskProgressTracker.ts` — 事件驱动任务进度
- **修改**: `src/views/game/state/GameStore.tsx` — 集中事件处理
- **修改**: `src/modules/quest/components/QuestPanel.tsx` — Tab 式重构
- **修改**: `src/modules/identity/logic/protagonistAdapter.ts` — 移除初始物品
- **修改**: `src/modules/quest/index.ts` — 新增导出
- **修改**: 各业务 Hook（渐进迁移）— `setGameState` 改为 `emit()`
- **废弃**: `src/modules/collection/logic/statistics/statisticsSystem.ts` 中 StatisticsManager 类
- **废弃**: `src/modules/quest/logic/tutorialTasks.ts` 中旧线性任务定义
