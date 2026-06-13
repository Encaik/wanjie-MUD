# quest-system

## Purpose

多阶段分支任务系统，作为 Mod 内容类型定义主线/支线/隐藏/日常/事件任务。任务与 NPC 对话系统深度集成——NPC 自动注入任务相关选项，支持多维度前置条件（等级、境界、已完成任务、阵营、态度值）和多类型奖励。

## Requirements

### Requirement: Quest Mod 内容类型注册

`ModContentType` 联合类型 SHALL 新增 `'quests'`。Mod 清单的 `contentTypes` 和 `dataFiles` SHALL 支持声明 `quests` 类型。

#### Scenario: Mod 清单声明任务数据

- **WHEN** 解析 `mod.json` 中 `contentTypes: ["worldview", "quests"]`
- **AND** `dataFiles: { "quests": ["data/quests/cultivation_quests.json"] }`
- **THEN** Mod 加载器 SHALL 加载并校验这些任务文件
- **AND** SHALL 将它们注册到 `QuestRegistry`

### Requirement: 任务多阶段结构

每个任务 SHALL 由 `stages: QuestStage[]` 组成。Stage SHALL 包含 `objectives`（完成目标列表）和 `completions`（完成后的分支选项，key = 完成方式标识）。Stage 按序推进，`completions` 的 `nextStageId` 为空表示任务结束。

```typescript
interface QuestStage {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  completions: Record<string, QuestStageCompletion>;
  npcDialogueOnEnter?: { npcId: string; lineId: string };
}
```

#### Scenario: 简单线性任务（3 个 Stage）

- **WHEN** 任务定义 3 个 Stage：`talk_to_npc` → `collect_items` → `return_to_npc`
- **THEN** 玩家必须先完成 Stage 1 的所有 objectives 才能进入 Stage 2
- **AND** 完成 Stage 3 后任务结束，发放最终奖励

#### Scenario: 分支任务（同一 Stage 多种完成方式）

- **WHEN** Stage 的 `completions` 定义了 `"fight"` 和 `"persuade"` 两个 key
- **AND** `"fight"` 的 `nextStageId` 为 `"boss_battle"`
- **AND** `"persuade"` 的 `nextStageId` 为 `"peaceful_end"`
- **THEN** 玩家选择"武力解决"走 boss 战斗分支，选择"说服解决"走和平分支
- **AND** 两条分支 SHALL 有独立的任务结局

### Requirement: 任务目标类型

任务目标 SHALL 支持以下类型：

| 类型 | 说明 | target 示例 |
|------|------|------------|
| `talk_to_npc` | 与指定 NPC 对话 | `"merchant_wang"` |
| `kill_enemy` | 击败指定敌人 | `"demon_beast_serpent"` |
| `collect_item` | 收集指定物品 | `"spirit_herb"` |
| `reach_realm` | 达到指定境界 | `"筑基"` |
| `reach_level` | 达到指定等级 | `"10"` |
| `explore_location` | 探索指定地点 | `"qingyun_mountain"` |
| `use_item` | 使用指定物品 | `"map_fragment"` |
| `dialogue_check` | 通过对话检定 | `"quest_persuasion_check"` |

#### Scenario: 多目标 Stage

- **WHEN** Stage 的 `objectives` 包含 `[{ type: "collect_item", target: "spirit_herb", count: 5 }, { type: "kill_enemy", target: "wolf", count: 3 }]`
- **THEN** 玩家必须同时满足两个目标才能完成此 Stage
- **AND** 每个目标的进度独立追踪

#### Scenario: 隐藏目标

- **WHEN** Objective 设置 `hidden: true`
- **THEN** 该目标 SHALL NOT 显示给玩家
- **AND** 进度 SHALL 仍在后台追踪
- **AND** 完成后 SHALL 作为惊喜展示

### Requirement: 任务前置条件

任务 SHALL 支持多维度前置条件（`prerequisites: QuestPrerequisite[]`），所有条件必须同时满足任务才可接取。

```typescript
interface QuestPrerequisite {
  type: 'level' | 'realm' | 'quest_completed' | 'faction' | 'attitude' | 'coreStat' | 'attribute' | 'item_owned';
  target: string;
  minValue?: number;
}
```

#### Scenario: 复合前置条件

- **WHEN** 任务设置 `prerequisites: [{ type: "level", target: "5" }, { type: "quest_completed", target: "intro_quest" }, { type: "faction", target: "righteous_sect" }]`
- **AND** 玩家等级 3（不满足）但已完成 intro_quest 且属于 righteous_sect
- **THEN** 该任务 SHALL NOT 出现在可接任务列表中
- **AND** SHALL 提示"需要等级 5"（首个不满足条件）

#### Scenario: 无前置条件

- **WHEN** 任务 `prerequisites` 为空数组
- **THEN** 任务 SHALL 始终可接（只要满足 worldview 限制）

### Requirement: 任务类型

任务 SHALL 支持 5 种类型：`main`（主线）、`side`（支线）、`hidden`（隐藏）、`daily`（日常）、`event`（事件）。

| 类型 | 可重复 | 说明 |
|------|--------|------|
| `main` | 否 | 主线剧情 |
| `side` | 否 | 支线任务 |
| `hidden` | 否 | 隐藏任务 |
| `daily` | 是 | 日常任务，有冷却时间 |
| `event` | 否 | 世界事件触发 |

#### Scenario: 隐藏任务不显示在任务列表

- **WHEN** 任务类型为 `hidden`
- **THEN** 该任务 SHALL NOT 出现在通用任务列表中
- **AND** 仅当玩家满足所有前置条件并与特定 NPC 对话时才触发

#### Scenario: 日常任务冷却

- **WHEN** `daily` 类型任务 `repeatable: true, cooldownSeconds: 86400`
- **THEN** 完成后 24 小时内不可再接取
- **AND** 冷却结束后重新出现在可接任务列表

### Requirement: 任务奖励

任务完成 SHALL 发放多类型奖励：

```typescript
interface QuestReward {
  experience?: number;
  spiritStones?: number;
  items?: { itemId: string; quantity: number }[];
  reputation?: { factionId: string; change: number };
  attitudeChanges?: { npcId: string; change: number };
  unlockQuests?: string[];
}
```

#### Scenario: 复合任务奖励

- **WHEN** 任务完成且奖励包含 `{ experience: 500, items: [{ itemId: "sword_01", quantity: 1 }], attitudeChanges: [{ npcId: "merchant_wang", change: 20 }] }`
- **THEN** 玩家 SHALL 获得 500 经验 + 剑 + 王掌柜态度 +20
- **AND** 所有奖励 SHALL 在任务完成时一次性发放

#### Scenario: Stage 分段奖励

- **WHEN** Stage 2 的 `completions["done"].stageRewards` 包含 `{ spiritStones: 100 }`
- **THEN** 完成 Stage 2 时 SHALL 发放 100 灵石
- **AND** 最终 Stage 完成时 SHALL 发放任务级 `rewards`

### Requirement: NPC 对话集成 — 任务选项注入

NPC 对话引擎 SHALL 自动检查 NPC 是否为 quest giver 或 turn-in NPC，并注入对应对话选项。

#### Scenario: NPC 有可接任务

- **WHEN** NPC `merchant_wang` 关联了任务 `collect_herbs`（quest giver）
- **AND** 玩家满足 `collect_herbs` 的前置条件
- **AND** 玩家尚未接取或完成该任务
- **THEN** 对话选项 SHALL 自动注入 `[任务] 收集灵药` 选项
- **AND** 选中后 SHALL 触发任务启动对话行

#### Scenario: NPC 有可提交任务

- **WHEN** NPC `merchant_wang` 是任务 `collect_herbs` 的 turn-in NPC
- **AND** 玩家当前活跃任务为 `collect_herbs` 且当前 Stage 所有 objectives 已完成
- **THEN** 对话选项 SHALL 自动注入 `[提交] 收集灵药` 选项
- **AND** 选中后 SHALL 完成当前 Stage 并发放奖励

#### Scenario: 任务选项不干扰手写选项

- **WHEN** 对话引擎注入任务选项
- **THEN** 原有的手写对话选项 SHALL 保持不变
- **AND** 任务选项 SHALL 显示在选项列表末尾，以 `[任务]` / `[提交]` 前缀区分

### Requirement: 任务状态持久化

系统 SHALL 在 `GameState` 中维护 `questState`，包含活跃任务、已完成任务、阶段历史。

```typescript
interface QuestState {
  activeQuests: Record<string, ActiveQuest>;
  completedQuests: string[];
 stageHistory: Record<string, string[]>;
}

interface ActiveQuest {
  questId: string;
  currentStageId: string;
  objectives: Record<string, number>;
  startedAt: number;
}
```

#### Scenario: 保存任务进度

- **WHEN** 玩家在任务 `collect_herbs` 的 Stage 2 中收集了 3/5 个灵药
- **AND** 存档保存
- **THEN** `activeQuests["collect_herbs"].objectives["collect_item:spirit_herb"]` SHALL 为 `3`
- **AND** 读档后进度 SHALL 恢复

#### Scenario: 任务完成后不再活跃

- **WHEN** 任务完成
- **THEN** 该任务 SHALL 从 `activeQuests` 移除
- **AND** SHALL 添加到 `completedQuests`
- **AND** `stageHistory` SHALL 记录玩家选择的分支路径

### Requirement: QuestRegistry 注册中心

系统 SHALL 提供 `QuestRegistry` 单例类，作为所有任务数据的唯一管理入口。

#### Scenario: 按世界观查询可用任务

- **WHEN** 调用 `QuestRegistry.getInstance().getAvailableQuests('cultivation', playerState)`
- **THEN** SHALL 返回世界观兼容 + 满足前置条件 + 未完成（或可重复且冷却已过）的任务列表

#### Scenario: 按 NPC 查询关联任务

- **WHEN** 调用 `QuestRegistry.getInstance().getQuestsByNPC('merchant_wang')`
- **THEN** SHALL 返回所有 stage 中引用该 NPC 作为 quest giver 或 objective target 的任务
