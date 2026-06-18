## Stage 1: 核心类型定义 + 注册中心 ✅

### 1.1 统一 QuestState 类型
- [x] 在 `core/types/types.ts` 中重构 `QuestState`：合并 `activeQuests`、`completedQuestIds`、`claimedQuestIds`、`acceptedTimestamps`、`completedTimestamps`、`boardSlots`、`boardLastRefresh`、`storyCompletedNodeIds`、`stageHistory`
- [x] 在 `GameState` 中标记 `taskSystems`、`tutorialState` 为 deprecated（保留用于存档迁移）
- [x] 更新 `createDefaultQuestState()` 为新结构
- [x] 全局替换 `completedQuests` → `completedQuestIds`，`claimedRewards` → `claimedQuestIds`

### 1.2 故事线类型
- [x] 在 `core/types/types.ts` 中新增：`StoryLineType`、`StoryNode`、`StoryLine`
- [x] 所有类型有 JSDoc 注释

### 1.3 板块类型
- [x] 在 `core/types/types.ts` 中新增：`QuestCategory`、`QuestBoard`、`RefreshRule`、`BoardSlotState`

### 1.4 扩展 QuestDefinition
- [x] 新增字段：`boardIds`、`storylineId`、`rewardPool`、`difficulty`、`eventMapping`、`hiddenInPanel`
- [x] `QuestObjectiveType` 新增：`'custom'`、`'join_faction'`、`'cultivate'`
- [x] 新增 `QuestRewardPoolConfig` 类型

### 1.5 故事线注册中心
- [x] 创建 `core/registry/StoryLineRegistry.ts`
- [x] 在 `core/registry/index.ts` 导出

### 1.6 板块注册中心
- [x] 创建 `core/registry/BoardRegistry.ts`
- [x] 在 `core/registry/index.ts` 导出

### 1.7 核心类型导出
- [x] `core/types/index.ts` 导出所有新增类型

---

## Stage 2: 任务引擎逻辑 ✅

### 2.1 故事线引擎
- [x] 创建 `modules/quest/logic/storyEngine.ts`
- [x] 实现 findNodeById, getAllLeafQuestIds, flattenNodes, isNodeUnlockable, getNextQuestIds, getStoryProgress, markNodeCompleted
- [x] 验证：`pnpm ts-check` 通过，文件 ≤ 300 行

### 2.2 板块引擎
- [x] 创建 `modules/quest/logic/boardEngine.ts`
- [x] 实现 needsRefresh, getAvailableQuestsForBoard, refreshBoard, advanceBoardSlot, getBoardUIState
- [x] 验证：`pnpm ts-check` 通过，文件 ≤ 250 行

### 2.3 事件驱动追踪器
- [x] 创建 `modules/quest/logic/eventTracker.ts`
- [x] 实现 matchEventToObjectives, applyEventToQuests, createQuestTracker
- [x] 9 条默认事件→目标映射规则
- [x] 验证：`pnpm ts-check` 通过，文件 ≤ 350 行

### 2.4 奖励池桥接
- [x] 在 rewardDistributor.ts 中新增 calculateQuestRewards（异步奖励池路径 + 回退静态路径）
- [x] 新增 calculateStaticQuestRewards（同步静态路径）
- [x] 验证：`pnpm ts-check` 通过

### 2.5 更新 logic/index.ts
- [x] 创建 modules/quest/logic/index.ts，导出所有新引擎函数

---

## Stage 3: 数据配置 ✅

### 3.1 教程故事线
- [x] 创建 `modules/quest/data/storylines/tutorial.ts`：5 phase + 9 quest_ref 节点
- [x] 验证：`pnpm ts-check` 通过

### 3.2 默认板块
- [x] 创建 `modules/quest/data/boards/default.ts`：tutorial/main_story/daily/weekly 4 板块
- [x] 验证：`pnpm ts-check` 通过

### 3.3 数据桶文件
- [x] 创建 `modules/quest/data/index.ts` 桶导出
- [x] 验证：`pnpm ts-check` 通过

---

## Stage 4: Hook 重写 ✅

### 4.1 useQuest Hook 重写
- [x] 重写 `modules/quest/hooks/useQuest.ts`
- [x] 新增：claimQuestReward、getStorylineQuestIds、getStoryProgress、refreshBoardIfNeeded、getBoardUIState、getBoardQuests
- [x] 保留：injectForNPC、acceptQuest、turnInQuest
- [x] 事件追踪器 useEffect 订阅 EventBus
- [x] 验证：`pnpm ts-check` 通过

---

## Stage 5: QuestPanel UI 重构 ✅

### 5.1 板块驱动 Tab
- [x] 重构 `modules/quest/components/QuestPanel.tsx`
- [x] Tab 从 BoardRegistry.getAll() 动态生成
- [x] 每个 Tab 显示板块名 + 状态图标
- [x] 五种状态渲染：locked/empty/available/claimable/cooling_down/completed
- [x] 验证：文件 ≤ 300 行，`pnpm ts-check` 通过

---

## Stage 6: Mod 加载扩展 ✅

### 6.1 ModLoader 扩展
- [x] 扩展 quests content type 处理：支持 { quests, storylines, boards } 合并格式
- [x] 支持 data.json 合并数据分发
- [x] 导入 StoryLineRegistry 和 BoardRegistry

---

## Stage 7: 消息系统集成 ✅

### 7.1 Quest 消息模板
- [x] 创建 `modules/quest/events.ts`
- [x] 注册 quest:completed、quest:claimed、quest:progress、quest:stage_completed 模板
- [x] 实现 initQuestRegistries() 初始化函数

---

## Stage 8: 旧代码清理 ✅

- [x] GameState 中 taskSystems 和 tutorialState 标记为 deprecated
- [x] QuestState 字段重命名（completedQuests→completedQuestIds, claimedRewards→claimedQuestIds）
- [x] 全局引用修复（QuestRegistry, questEngine, useQuest 等）
- [x] QuestPage 适配新 QuestPanel API

---

## Stage 9: 构建验证 ✅

- [x] `pnpm ts-check` — 0 错误
- [x] `pnpm build` — 构建成功

---

## Stage 10: 文档同步 ✅

- [x] 更新 `src/modules/README.md` — quest/ 条目描述更新

---

**实施摘要：**
- 新增文件 12 个，修改文件 8 个
- 核心引擎 3 个：storyEngine、boardEngine、eventTracker
- 注册中心 2 个：StoryLineRegistry、BoardRegistry
- 数据文件 3 个：tutorial.ts、boards/default.ts、data/index.ts
- TypeScript 编译 0 错误，生产构建成功

