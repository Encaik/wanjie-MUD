## 1. 创建 `core/statistics/` 模块

- [x] 1.1 创建 `src/core/statistics/types.ts` — 统计事件类型、payload 映射、StatisticsEventType 联合类型
- [x] 1.2 创建 `src/core/statistics/eventTypes.ts` — 所有事件类型常量 + EventRegistry 注册（按域划分）
- [x] 1.3 创建 `src/core/statistics/updaters.ts` — 完整的事件→统计更新纯函数映射（覆盖全部事件类型）
- [x] 1.4 创建 `src/core/statistics/statisticsTracker.ts` — `processStatisticsEvent()` + `processStatisticsEvents()` 批量处理
- [x] 1.5 创建 `src/core/statistics/summary.ts` — `calculateStatisticsSummary()` + `StatisticsSummary` 类型
- [x] 1.6 创建 `src/core/statistics/index.ts` — 桶导出
- [x] 1.7 更新 `src/core/README.md` — 添加 statistics 模块说明

## 2. 迁移旧调用方到新 API

- [x] 2.1 更新 `useAdventure.ts` — 三处 `statisticsManager.processEvents()` → `processStatisticsEvents()`
- [x] 2.2 更新 `useFaction.ts` — `statisticsManager.processEvent()` → `processStatisticsEvent()`
- [x] 2.3 更新 `taskProgressSystem.ts` — `StatisticsEventType` 导入 + `EVENT_TO_TASK_TYPE_MAP` 键名
- [x] 2.4 更新 `useCultivation.ts` — 三处手动统计构造 → `processStatisticsEvent/processStatisticsEvents`
- [x] 2.5 更新 `useSeclusion.ts` — 手动统计构造 → `processStatisticsEvents`
- [x] 2.6 更新 `useInventory.ts` — 直接展开赋值 → `processStatisticsEvent`
- [x] 2.7 更新 `StatisticsPanel.tsx` — `calculateStatisticsSummary` 导入路径
- [x] 2.8 删除旧 `statisticsSystem.ts` 及 barrel 文件
- [x] 2.9 更新 `modules/collection/index.ts` 移除旧导出

## 3. GameStore 集中事件处理

- [x] 3.1 添加 `applyTutorialReward()` 辅助函数
- [x] 3.2 添加 `on('*')` 订阅 → 1 秒节流 → 批量 flush → `processStatisticsEvent` → `setGameState`
- [x] 3.3 添加 `tutorialState` 到 GameState 类型（`core/types/types.ts`）
- [x] 3.4 添加 `tutorialState` 到 `initialState.ts`
- [x] 3.5 flush 中同时执行 `checkTutorialProgress()` 引导进度
- [x] 3.6 补全旧存档 tutorialState 兼容逻辑
- [x] 3.7 移除旧轮询式 `useEffect`（原 checkNewlyCompletedTutorialTask）

## 4. 分阶段新手引导系统

- [x] 4.1 创建 `src/modules/quest/logic/tutorialGuide.ts` — 5 阶段 9 步骤定义 + 弹窗内容 + 奖励
- [x] 4.2 创建 `src/modules/quest/logic/taskProgressTracker.ts` — 事件驱动引导进度检查函数族
- [x] 4.3 实现阶段 0 旧角色兼容逻辑（`shouldSkipPhaseZero` + `createLegacyCompatibleTutorialState`）
- [x] 4.4 修改 `src/modules/identity/logic/protagonistAdapter.ts` — 移除初始物品硬编码
- [x] 4.5 清理 protagonistAdapter 未使用的导入和模板变量
- [x] 4.6 更新 `src/modules/quest/index.ts` — 导出新引导系统（解决 checkTutorialProgress 名称冲突）

## 5. 引导弹窗组件

- [x] 5.1 创建 `src/shared/components/TutorialDialog.tsx` — 复用弹窗组件
- [x] 5.2 实现 3 种 variant：`welcome` / `system-intro` / `default`
- [x] 5.3 弹窗内容支持 Markdown 粗体 + 分段渲染
- [x] 5.4 更新 `src/shared/components/index.ts` 导出

## 6. QuestPanel Tab 式重构

- [x] 6.1 重写 `QuestPanel.tsx` — Tab 栏 UI + 三个 Tab 内容区
- [x] 6.2 新手引导 Tab：阶段指示器 + 进度条 + 步骤卡片 + 已完成列表
- [x] 6.3 势力任务 Tab：锁定态/引导完成后解锁
- [x] 6.4 NPC 任务 Tab：进行中任务卡片 + 空状态
- [x] 6.5 更新 `QuestPage.tsx` — 传递新 props（tutorialState/statistics/questState/factionJoined）

## 7. 清洗与验证

- [x] 7.1 修复 `combatEngine.ts` 预存类型错误（SessionState 比较）
- [x] 7.2 `pnpm ts-check` — 零新增错误
- [x] 7.3 `pnpm build` — 构建成功
- [x] 7.4 `pnpm test` — 269 全部通过
- [x] 7.5 更新 `src/core/README.md` — statistics 模块
- [ ] 7.6 `pnpm lint:strict` — 质量门禁（可选）
