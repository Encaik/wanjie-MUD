## Stage 1: QuestTemplate 核心类型定义

### 1.1 创建 QuestTemplate 类型
- [x] 在 `core/types/` 中创建 `questTemplate.ts`：定义 `QuestTemplate`、`QuestTemplateStage`、`QuestTemplateObjective`、`QuestTemplateDialog` 接口
- [x] 所有字段有 JSDoc 注释
- [x] 验证：`pnpm ts-check` 通过，文件 ≤ 120 行

### 1.2 核心类型导出
- [x] `core/types/index.ts` 导出所有 `QuestTemplate` 相关类型
- [x] 验证：其他模块可通过 `@/core/types` 导入

---

## Stage 2: QuestTemplateRegistry 注册中心

### 2.1 创建注册中心
- [x] 创建 `core/registry/QuestTemplateRegistry.ts`：单例类，包含 `register()`、`registerAll()`、`get()`、`getAll()`、`getAllForWorldview()`、`getByBoardId()`、`getByStorylineId()` 方法
- [x] 验证：文件 ≤ 120 行

### 2.2 注册中心导出
- [x] `core/registry/index.ts` 导出 `QuestTemplateRegistry`
- [x] 验证：`pnpm ts-check` 通过

---

## Stage 3: 模板编译函数

### 3.1 创建编译逻辑
- [x] 在 `modules/quest/logic/` 中创建 `templateCompiler.ts`
- [x] 实现 `compileTemplate(template: QuestTemplate): QuestDefinition` 纯函数
- [x] 实现 `deriveEventMapping(stages: QuestTemplateStage[]): EventObjectiveMapping[]`
- [x] 实现惰性编译缓存 `ensureCompiled(templateId: string): QuestDefinition`
- [x] 验证：`pnpm ts-check` 通过，文件 ≤ 200 行

### 3.2 导出编译函数
- [x] `modules/quest/logic/index.ts` 导出编译相关函数

---

## Stage 4: 教程任务迁移为标准模板

### 4.1 重写教程数据文件
- [x] 重写 `modules/quest/data/quests/tutorial.ts`：将 9 个教程任务改为 `QuestTemplate[]` 格式
- [x] 移除所有 `ItemDefinition` 内联定义，改为 `itemId` 字符串引用
- [x] 将所有 `dialog` 从 `QuestDefinition.dialog` 迁移到 `QuestTemplate.acceptDialog` 数组
- [x] 验证：数据文件 ≤ 150 行，`pnpm ts-check` 通过

### 4.2 注册内置模板
- [x] 在 `modules/quest/data/index.ts` 中调用 `QuestTemplateRegistry.getInstance().registerAll(TUTORIAL_QUEST_TEMPLATES)`
- [x] 验证：注册中心可查询到 9 个教程模板

---

## Stage 5: 删除旧教程代码

### 5.1 删除 tutorialTasks.ts
- [x] 删除 `modules/quest/logic/tutorialTasks.ts`（404 行）
- [x] 验证：`pnpm ts-check` 无错误（所有引用已迁移）

### 5.2 删除 tutorialGuide.ts
- [x] 删除 `modules/quest/logic/tutorialGuide.ts`（300+ 行）
- [x] 验证：`pnpm ts-check` 无错误

### 5.3 重写 taskProgressTracker.ts
- [x] 移除所有教程专用类型（`TutorialState`、`TutorialStep`、`TutorialPhase`）
- [x] 改为通用进度追踪：接收 `QuestState` + `storylineId`，通过 `storyEngine` 计算进度
- [x] 验证：文件 ≤ 200 行

### 5.4 清理 types.ts 旧类型
- [x] `modules/quest/types.ts` 中移除教程专用类型引用（如有）

---

## Stage 6: 模块 API 净化

### 6.1 清理 index.ts 导出
- [x] 移除教程专用导出：`tutorialTaskSystem`、`TUTORIAL_TASKS`、`isNewbie`、`getTaskRewards`、`getTutorialWelcomeMessage`、`claimTutorialReward`、`checkNewlyCompletedTutorialTask`、`checkLegacyTutorialProgress`、`TutorialTask`
- [x] 移除引导专用导出：`TUTORIAL_GUIDE`、`getStepById`、`getPhaseById`、`getTotalStepCount`、`getTotalPhaseCount`、`TutorialDialog`、`TutorialStep`、`TutorialPhase`、`TutorialGuideDefinition`
- [x] 移除进度追踪旧导出：`createDefaultTutorialState`、`createLegacyCompatibleTutorialState`、`checkTutorialProgress`（旧版）、`claimStepReward`、`claimPhaseReward`、`isStepRewardClaimable`、`isPhaseRewardClaimable`、`getPendingDialog`、`markDialogViewed`、`getTutorialProgressInfo`、`shouldSkipPhaseZero`、`TutorialState`、`TutorialProgressResult`
- [x] 新增通用导出：`compileTemplate`、`ensureCompiled`、`QuestTemplateRegistry` 单例获取
- [x] 验证：`pnpm ts-check`，确认外部引用全部更新

---

## Stage 7: QuestPanel 通用化

### 7.1 重构 QuestPanel
- [x] QuestPanel 已为数据驱动：Tab 由 BoardRegistry 驱动、任务卡片由 QuestDefinition 驱动、弹窗由 dialog 字段驱动
- [x] TutorialProgress 保留为数据驱动的子组件（通过 storyEngine 查询进度）
- [x] 验证：组件 ≤ 300 行，`pnpm ts-check` 通过

### 7.2 调整 useQuest Hook
- [x] `useQuest` 不含教程专用逻辑，弹窗通过 `quest.dialog` + `viewedDialogQuestIds` 通用处理
- [x] `getBoardQuests(boardId)` 已存在，`hasViewedDialog`/`markDialogViewed` 使用通用 QuestState 字段
- [x] 验证：Hook ≤ 200 行

---

## Stage 8: 引用更新

### 8.1 全局引用查找和修复
- [x] 删除文件所有引用已修复（`events.ts` 改用 `initBuiltinQuestTemplates`）
- [x] `getTutorialWelcomeMessage` 重写为从 QuestTemplateRegistry 查询模板数据
- [x] `checkTutorialProgress` 替代为 `getQuestProgress(storylineId, questState)`
- [x] 验证：`pnpm ts-check` 0 错误

---

## Stage 9: Mod 加载器适配

### 9.1 扩展 quests content type
- [x] `ModLoader.ts`：自动检测 QuestTemplate vs QuestDefinition 格式，分别注册
- [x] `server-loader.ts`：同上，支持两种格式
- [x] `initBuiltinQuestTemplates()` 统一编译所有模板（内置 + Mod）到 QuestRegistry
- [x] 验证：`pnpm ts-check` 0 错误，构建成功

---

## Stage 10: 构建验证 + 文档同步

### 10.1 完整构建
- [x] `pnpm ts-check` — 0 错误
- [x] `pnpm build` — 构建成功（所有路由通过，含 `/game/quest`）
- [x] `pnpm test` — 52/52 quest 测试通过，348/349 全量通过（1 个预先存在的 offlineProcessor 失败）

### 10.2 更新 README
- [x] 更新 `src/modules/README.md` — quest/ 条目描述更新
- [x] 更新 `src/core/README.md` — registry/ 条目添加 QuestTemplateRegistry

---

**预计影响：**
- 新增文件 3 个（`questTemplate.ts`、`QuestTemplateRegistry.ts`、`templateCompiler.ts`）
- 重写文件 3 个（`data/quests/tutorial.ts`、`taskProgressTracker.ts`、`QuestPanel.tsx`）
- 删除文件 2 个（`tutorialTasks.ts`、`tutorialGuide.ts`）
- 修改文件 5+ 个（`index.ts`、`types.ts`、`useQuest.ts`、外部引用等）
- TypeScript 编译 0 错误，生产构建成功
