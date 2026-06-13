# Implementation Tasks

## 1. 类型层 — Quest 核心类型定义

- [x] 1.1 新增 `QuestType` 类型（main / side / hidden / daily / event）
- [x] 1.2 新增 `QuestObjective` 接口（type、target、count、description、hidden）
- [x] 1.3 新增 `QuestStageCompletion` 接口（description、nextStageId、stageRewards）
- [x] 1.4 新增 `QuestStage` 接口（id、name、description、objectives、completions、npcDialogueOnEnter）
- [x] 1.5 新增 `QuestPrerequisite` 接口（type、target、minValue、maxValue）
- [x] 1.6 新增 `QuestReward` 接口（experience、spiritStones、items、reputation、attitudeChanges、unlockQuests）
- [x] 1.7 新增 `QuestDefinition` 接口（id、name、description、type、worldviewRestrictions、prerequisites、stages、rewards、repeatable、cooldownSeconds）
- [x] 1.8 新增 `QuestState`、`ActiveQuest` 接口（运行时状态追踪）
- [x] 1.9 更新 `core/types/index.ts` 桶导出所有新类型
- [x] 1.10 运行 `pnpm ts-check` 确认新类型定义无误

## 2. Mod 数据层 — 任务 JSON

- [x] 2.1 创建 `mods/wanjie-core/data/quests/` 目录
- [x] 2.2 创建 `cultivation_quests.json` — 修仙世界观示例任务（主线 1 个 + 支线 1 个 + 隐藏 1 个 + 日常 1 个）
- [x] 2.3 每个任务 JSON 包含完整的多阶段定义、前置条件、奖励
- [x] 2.4 任务中引用 NPC ID（对接已有 NPC 数据）
- [x] 2.5 扩展 `ModContentType` 类型新增 `'quests'`
- [x] 2.6 更新 `mods/wanjie-core/mod.json` 声明 quests

## 3. 注册中心 — QuestRegistry

- [x] 3.1 创建 `core/registry/QuestRegistry.ts` — 任务数据注册、查询
- [x] 3.2 支持 `getAvailableQuests(worldviewId, playerState)` — 根据玩家状态筛选可接任务
- [x] 3.3 支持 `getQuestsByNPC(npcId)` — 查询某 NPC 关联的所有任务
- [x] 3.4 Mod 加载器集成 quests 内容类型

## 4. 任务引擎 — 状态管理 + 进度追踪

- [x] 4.1 创建 `modules/quest/logic/questEngine.ts` — 任务进度追踪纯函数
- [x] 4.2 实现 `checkPrerequisites(quest, protagonist)` — 多维度前置条件校验
- [x] 4.3 实现 `startQuest(questId, questState)` — 开始任务，进入第一个 Stage
- [x] 4.4 实现 `updateObjectiveProgress(activeQuest, objectiveType, target, delta)` — 更新目标进度
- [x] 4.5 实现 `checkStageCompletion(stage, activeQuest)` — 检查 Stage 所有 objectives 是否完成
- [x] 4.6 实现 `completeStage(quest, activeQuest, completionKey)` — 完成 Stage，选择分支
- [x] 4.7 实现 `completeQuest(questId, questState)` — 完成任务，发放奖励
- [x] 4.8 实现 `getActiveQuestForNPC(npcId, questState)` — 查询该 NPC 是否有活跃/可提交任务

## 5. NPC 对话集成 — 任务选项注入

- [x] 5.1 在 `dialogueEngine.ts` 中新增 `injectQuestOptions(npc, options, questState)` 函数
- [x] 5.2 NPC 有可接任务时注入 `[任务]` 选项
- [x] 5.3 NPC 有可提交任务时注入 `[提交]` 选项
- [x] 5.4 任务选项自动设置 `statGates`（由前置条件生成）
- [x] 5.5 任务选项注入到对话选项列表，保持原有选项不变

## 6. 奖励发放

- [x] 6.1 创建 `modules/quest/logic/rewardDistributor.ts` — 奖励发放纯函数
- [x] 6.2 实现经验/灵石/物品奖励发放
- [x] 6.3 实现声望/态度变化奖励
- [x] 6.4 实现解锁新任务（任务链）
- [x] 6.5 奖励发放结果以 `ActionResult` 格式返回

## 7. API 层

- [x] 7.1 实现 `GET /api/v1/quests?worldviewId=X` — 查询世界观下所有任务摘要
- [x] 7.2 实现 `GET /api/v1/quests/[id]` — 获取单个任务完整定义
- [x] 7.3 接取任务通过客户端 useQuest Hook 完成（无需独立 API）
- [x] 7.4 实现 `POST /api/v1/quests/complete-stage` — 提交阶段完成

## 8. 测试与验证

- [x] 8.1 为 `checkPrerequisites()` 编写单元测试（9 个场景）
- [x] 8.2 为 `updateObjectiveProgress()` 编写单元测试
- [x] 8.3 为 `checkStageCompletion()` 编写单元测试（含隐藏目标场景）
- [x] 8.4 为 `completeStage()` 和 `completeQuest()` 编写单元测试
- [x] 8.5 20/20 测试全部通过
- [x] 8.6 运行 `pnpm ts-check` 确保零类型错误
- [x] 8.7 运行 `pnpm build` 确保构建成功
