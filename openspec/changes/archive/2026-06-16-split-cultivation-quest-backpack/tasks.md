# 实施任务

## 1. quest 类型层 — 通用任务类型迁移

- [x] 1.1 创建 `modules/quest/types.ts`，将 `faction/logic/types.ts` 的通用任务类型移入
  - 迁移内容：`TaskSystemType`、`TaskStatus`、`TaskItemReward`、`TaskReward`、`BaseTask`、`TaskSystemState`、`TaskProgressResult`、`ITaskSystem`、`AllTaskSystemsState`
  - 迁移纯函数：`createDefaultTaskSystemState`、`createDefaultAllTaskSystemsState`、`checkTaskCompletion`、`checkTasksProgress`、`checkNewlyCompletedTask`
  - 删除 `ItemReward` deprecated alias（不使用）
- [x] 1.2 更新 `modules/quest/index.ts` 导出所有新类型和函数
- [x] 1.3 运行 `pnpm ts-check` 确认 quest/types.ts 无类型错误

## 2. tutorialTaskSystem 迁移 — 从 faction 到 quest

- [x] 2.1 创建 `modules/quest/logic/tutorialTasks.ts`，从 `faction/logic/tutorialTaskSystem.ts` 完整复制
  - 更新导入：`./types`（faction task 类型）→ `../types`（quest 类型）
  - 其他导入保持不变（`@/modules/equipment/logic/items`、`@/core/types`）
- [x] 2.2 更新 `modules/quest/index.ts` 导出 tutorial 相关符号
- [x] 2.3 更新 `modules/faction/logic/factionTaskSystem.ts` — 导入路径从 `./types` 改为 `@/modules/quest`
- [x] 2.4 更新 `modules/faction/logic/factionTaskSystemNew.ts` — 导入路径从 `./types` 改为 `@/modules/quest`
- [x] 2.5 更新 `modules/faction/logic/taskProgressSystem.ts` — 导入路径从 `./types` 改为 `@/modules/quest`
- [x] 2.6 更新 `modules/faction/logic/index.ts`：
  - 删除 tutorial 相关导出（`tutorialTaskSystem`、`TUTORIAL_TASKS`、`checkTutorialProgress`、`isNewbie`、`getTaskRewards`、`getTutorialWelcomeMessage`、`claimTutorialReward`、`checkNewlyCompletedTask`、`TutorialTask`）
  - 更新 `factionTaskSystem`、`factionTaskSystemNew`、`taskProgressSystem` 的导入路径
- [x] 2.7 删除 `modules/faction/logic/tutorialTaskSystem.ts`
- [x] 2.8 删除 `modules/faction/logic/types.ts`（内容已全部迁移至 quest/types.ts）
- [x] 2.9 运行 `pnpm ts-check` 确认迁移无断裂引用

## 3. BreakthroughPanel — 从 CultivationPanel 拆分

- [x] 3.1 创建 `modules/progression/components/BreakthroughPanel.tsx`
  - 从 CultivationPanel 提取：突破概率显示、丹药加成显示、经验溢出警告、渡劫提示、满级天道挑战
  - 定义精简的 `BreakthroughPanelProps` 接口
  - 文件大小 ≤ 300 行
- [x] 3.2 更新 `modules/progression/components/` 的 barrel 导出（如有 index.ts）

## 4. QuestPanel — 统一任务面板

- [x] 4.1 创建 `modules/quest/components/QuestPanel.tsx`
  - 新手引导区（复用 CultivationPanel 中的新手引导 UI 代码，精简后约 80 行）
  - questState 进行中任务列表区（展示 `activeQuests` 的任务名、当前阶段、目标进度）
  - 文件大小 ≤ 300 行
- [x] 4.2 创建 `modules/quest/components/index.ts`
- [x] 4.3 更新 `modules/quest/index.ts` 导出 QuestPanel

## 5. CultivationPanel 瘦身

- [x] 5.1 从 `CultivationPanel.tsx` 中移除：
  - 新手引导任务 UI 代码块（lines 299-371）
  - 突破/渡劫/天道挑战代码块
  - 相关 props：`statistics`、`completedTutorialTaskIds`、`onTribulation`、`onChallengeGuardian`、`onBreakthrough`
- [x] 5.2 移除不再使用的导入（`TUTORIAL_TASKS`、`checkTutorialProgress`、tutorial 图标等）
- [x] 5.3 确认文件行数 ≤ 300

## 6. 页面和路由

- [x] 6.1 创建 `views/game/pages/QuestPage.tsx`
  - 组合 QuestPanel，传入所需的 props（从 GameStore 获取 tutorial 状态 + questState）
- [x] 6.2 创建 `views/game/pages/BackpackPage.tsx`
  - 渲染 `<InventoryPanel useGlobalState />`
- [x] 6.3 更新 `views/game/pages/CultivationPage.tsx`：
  - 用 BreakthroughPanel 替换原突破相关 JSX
  - 移除 InventoryPanel
  - 移除不再需要的导入和 props 传递
- [x] 6.4 更新 `views/game/pages/index.ts` 新增 QuestPage、BackpackPage 导出
- [x] 6.5 创建 `app/game/quest/page.tsx`
- [x] 6.6 创建 `app/game/backpack/page.tsx`

## 7. 导航注册表

- [x] 7.1 更新 `panelRegistry.tsx`：
  - 功法（technique）category 从 `primary` → `secondary`，group 设为 `'武备'`
  - 装备（equipment）category 从 `primary` → `secondary`，group 设为 `'武备'`
  - 新增 `quest` 面板：id=`quest`、label=`任务`、icon=`ScrollText`、category=`primary`、route=`/game/quest`
  - 新增 `backpack` 面板：id=`backpack`、label=`背包`、icon=`Backpack`（或 `Package`）、category=`primary`、route=`/game/backpack`
  - 更新 SECONDARY_PANELS 排序（新的武备组 4 项在一起）
- [x] 7.2 如有硬编码引用 technique/equipment 为 primary 的代码，同步更新

## 8. README 同步

- [x] 8.1 更新 `src/modules/README.md`：quest 模块描述更新，增加 components 说明
- [x] 8.2 检查 `src/core/README.md` 是否需要更新（本次变更不涉及 core，预计不需要）

## 9. 质量验证

- [x] 9.1 运行 `pnpm ts-check` 确保零类型错误
- [x] 9.2 运行 `pnpm build` 确保构建成功
- [x] 9.3 运行 `pnpm check-sizes` 确保所有文件在限制内
- [x] 9.4 运行 `pnpm lint:strict` 确保质量门通过
- [x] 9.5 运行 `pnpm test` 确保现有测试通过（quest 相关测试 + progression 相关测试）
- [x] 9.6 手动验证：dev 模式下确认 6 个主标签正确显示、quest/backpack 页面正常渲染、万界盘中功法/装备可访问、修炼页不再显示新手任务和背包
