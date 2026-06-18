## Why

当前任务系统存在三套并行但不互通的体系，导致功能分散、维护复杂、扩展困难：

- **三套并行的任务状态**：`tutorialState`（新手引导）、`taskSystems`（通用任务面板）、`questState`（NPC 任务）各自独立管理，类型不统一
- **无故事线概念**：连续的单次任务无法组成主线/支线剧情，缺乏章节/节层级展示
- **无板块系统**：日常、周常、势力任务没有统一的分发和刷新机制
- **轮询检查模式**：`BaseTask.check()` 依赖主动轮询，不符合"基于事件的同步统计"设计原则
- **奖励与领取混为一谈**：部分任务完成即自动发放奖励，缺少"完成任务 → 手动领取"的二阶段操作
- **Mod 注入不完整**：Mod 只能注入独立任务，无法注入故事线和板块

## What Changes

- **统一 QuestState**：合并 `tutorialState`、`taskSystems`、`questState` 为单一 `QuestState`，涵盖所有任务类型的状态
- **新增故事线系统 `StoryLine` + `StoryNode`**：支持 phase/section/quest_ref 多层级嵌套，主线/支线/新手引导三种类型，默认线性但保留分支扩展性
- **新增任务板块系统 `QuestBoard`**：板块类型包括 tutorial/main_story/side_story/daily/weekly/faction/event/achievement，支持刷新规则（每日/每周/从不/自定义 cron）
- **统一事件驱动追踪引擎 `QuestEventTracker`**：订阅全局 GameEvent，自动匹配活跃任务目标，替代轮询 check() 模式
- **任务奖励接入 reward-pool**：静态任务奖励走 StaticEntry，动态奖励走 FilterEntry/PoolRefEntry
- **统一手动领奖机制**：所有任务 completed ≠ claimed，分两步操作
- **扩展 Mod 注入**：quests/ 文件夹支持 quests.json + storylines.json + boards.json
- **消息集成**：quest:completed 和 quest:claimed 事件通过 MessageManager 生成消息记录
- **QuestPanel UI 重构**：板块驱动的动态 Tab 系统，五种板块状态（锁定/空/进行中/可领取/冷却中）
- **QuestObjective 新增 custom 类型**：支持任意自定义条件函数

## Capabilities

### New Capabilities
- `quest-storyline`: 故事线系统，phase/section/quest_ref 多层级结构
- `quest-board`: 板块系统，任务分类、刷新规则、槽位管理
- `quest-event-tracker`: 事件驱动追踪引擎，自动匹配事件→目标
- `quest-reward-pool`: 任务奖励与 reward-pool 模块的桥接

### Modified Capabilities
- `quest-system` (existing): 扩展 QuestDefinition 字段，统一状态机，新增 custom objective 类型
- `quest-panel-redesign` (existing): 从 3 静态 Tab 重构为板块驱动的动态 Tab

## Impact

- **新增 `core/quest/`** — StoryLineRegistry、BoardRegistry（或扩展现有 QuestRegistry）
- **修改 `core/types/`** — 扩展 QuestDefinition，统一 QuestState
- **修改 `core/mod/`** — 扩展 quests content type 加载逻辑
- **修改 `core/message-log/`** — 注册 quest 相关的 message templates
- **重写 `modules/quest/`** — 统一引擎、事件追踪器、UI 面板
- **修改 `modules/reward-pool/`** — 新增 quest 奖励池配置
- **修改 `GameState`** — 合并三套状态为单一 QuestState
- **modules/README.md 更新** — 更新 quest/ 条目描述
