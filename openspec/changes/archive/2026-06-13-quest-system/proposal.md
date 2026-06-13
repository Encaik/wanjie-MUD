## Why

当前项目的任务系统存在三个根本性问题：(1) 任务逻辑硬编码在 `modules/faction/logic/` 中，无法作为 Mod 内容类型独立扩展——新增任务需要修改 TypeScript 源码；(2) 任务缺乏多阶段/分支结构——所有任务都是"接取→完成→领奖"的单一步骤，不支持剧情链、对话分支、阶段性推进；(3) 任务与 NPC 对话系统未打通——NPC 对话选项已支持核心值门槛和 CRPG 检定（`npc-mod-content-type`），但 NPC 无法作为任务给予者/提交者触发任务逻辑。

此外，现有 faction 任务系统覆盖了日常/重复性任务需求（杀怪、收集、捐献），但完全缺失主线/支线剧情任务、世界事件任务和隐藏任务。

## What Changes

- **新增 Quest Mod 内容类型**：`ModContentType` 新增 `'quests'`，任务数据通过 Mod JSON 文件加载
- **多阶段任务结构**：每个任务包含多个 Stage，每个 Stage 有独立的 objectives、completion 条件和 dialogue hooks
- **任务分支系统**：Stage 的 completion 可导向不同的下一 Stage（支持玩家选择影响剧情走向）
- **NPC 集成**：任务定义中引用 NPC ID 作为 quest giver / turn-in NPC，对话选项自动注入任务相关选项（接取/提交/拒绝）
- **任务前置条件**：支持等级、境界、已完成任务、阵营、态度值等多维度前置条件
- **任务奖励**：支持经验、灵石、物品、声望、态度变化、解锁新任务等多种奖励类型
- **QuestRegistry 注册中心**：统一管理所有任务定义，支持按 NPC/世界观/类型查询

## Capabilities

### New Capabilities
- `quest-system`: 多阶段分支任务系统，Mod 驱动，NPC 集成，支持主线/支线/隐藏/日常/事件任务类型

### Modified Capabilities
- `npc-mod-content-type`: NPC 对话引擎集成任务选项注入（quest giver/turn-in 自动生成对话选项）
- `core-systems-foundation`: 新增 `QuestDefinition`、`QuestStage`、`QuestPrerequisite`、`QuestReward` 等核心类型

## Impact

- **core/types/**: 新增 `QuestDefinition`、`QuestStage`、`QuestObjective`、`QuestPrerequisite`、`QuestReward` 类型
- **core/registry/**: 新增 `QuestRegistry` 注册中心
- **mods/wanjie-core/**: 新增 `data/quests/` 目录及示例任务 JSON
- **modules/npc/logic/**: 对话引擎新增任务选项注入逻辑
- **modules/quest/**: 新建模块，包含任务状态管理、进度追踪、奖励发放
- **app/api/**: 新增任务查询 API（按世界/NPC/类型筛选）
