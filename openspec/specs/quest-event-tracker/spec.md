# quest-event-tracker

## Purpose

事件驱动任务追踪引擎（QuestEventTracker），订阅全局 GameEvent，自动匹配活跃任务目标并更新进度。替代之前的轮询 `check()` 模式，实现"事件的同步统计"。

## ADDED Requirements

### Requirement: 全局事件订阅

`QuestEventTracker` SHALL 在初始化时注册到 `EventBus`，匹配模式为 `'*'`（所有事件）。

#### Scenario: 初始化订阅

- **WHEN** 游戏启动
- **THEN** `QuestEventTracker` SHALL 调用 `gameEventBus.on('*', handleEvent)`
- **AND** 不进行任何其他初始化

### Requirement: 事件→目标映射

事件匹配 SHALL 按以下规则执行：

| 事件类型 | 映射的 ObjectiveType | payload 字段映射 |
|---------|---------------------|-----------------|
| `combat:enemy_killed` | `kill_enemy` | `payload.enemyId` → `target` |
| `item:collected` | `collect_item` | `payload.itemId` → `target` |
| `item:used` | `use_item` | `payload.templateId` → `target` |
| `progression:level_up` | `reach_level` | `payload.newLevel >= Number(target)` |
| `progression:realm_broken` | `reach_realm` | `payload.realm` → `target` |
| `cultivation:performed` | `cultivate` | 无条件匹配，delta = +1 |
| `exploration:location_entered` | `explore_location` | `payload.locationId` → `target` |
| `npc:dialogue_triggered` | `dialogue_check` | `payload.npcId` → `target` |
| `faction:joined` | `join_faction` | `payload.factionId` → `target` |
| `*` (任何事件) | `custom` | 由 `EventObjectiveMapping.getDelta` 计算 |

#### Scenario: 战斗事件匹配

- **WHEN** 活跃任务当前 stage 有 objective `{ type: 'kill_enemy', target: 'slime', count: 5 }`
- **AND** 事件 `combat:enemy_killed` 触发，payload `{ enemyId: 'slime' }`
- **THEN** 该 objective 进度 SHALL 增加 1

#### Scenario: 事件不匹配

- **WHEN** 活跃任务当前 stage 有 objective `{ type: 'kill_enemy', target: 'slime', count: 5 }`
- **AND** 事件 `combat:enemy_killed` 触发，payload `{ enemyId: 'wolf' }`
- **THEN** 该 objective 进度 SHALL NOT 变化

### Requirement: 自定义映射

任务可通过 `EventObjectiveMapping` 数组自定义事件匹配规则。

#### Scenario: 自定义映射

- **WHEN** 任务定义了 `eventMapping: [{ eventType: 'social:gift_given', targetField: 'npcId', objectiveType: 'dialogue_check' }]`
- **THEN** 当 `social:gift_given` 事件触发且 `payload.npcId === objective.target` 时进度 +1
- **AND** 默认映射规则 SHALL NOT 适用

### Requirement: 进度更新与完成检测

事件匹配后 SHALL 更新进度，并检测 stage/quest 是否完成。

#### Scenario: 目标进度更新

- **WHEN** 事件匹配到 objective，delta = +1
- **THEN** `activeQuest.objectives[key]` SHALL 增加 delta
- **AND** 更新 SHALL 通过不可变方式（返回新对象）

#### Scenario: Stage 完成

- **WHEN** 当前 stage 所有非隐藏 objective 的进度 ≥ count
- **THEN** `checkStageCompletion(stage, activeQuest)` SHALL 返回 true
- **AND** 任务 SHALL 进入可提交状态

#### Scenario: Quest 完成

- **WHEN** 最后 stage 完成
- **THEN** questId SHALL 添加到 `completedQuestIds`
- **AND** `quest:completed` 事件 SHALL 发射
- **AND** MessageManager SHALL 生成消息："🎉 任务「xxx」已完成！请在任务面板领取奖励。"

### Requirement: 隐藏目标

隐藏目标 SHALL NOT 显示给玩家，但进度 SHALL 在后台追踪。

#### Scenario: 隐藏目标不显示

- **WHEN** objective 设置 `hidden: true`
- **THEN** 该目标 SHALL NOT 出现在任务面板的目标列表中
- **AND** 玩家看到的目标数 SHALL NOT 包含隐藏目标

#### Scenario: 隐藏目标追踪

- **WHEN** objective 设置 `hidden: true`
- **THEN** 事件匹配和进度追踪 SHALL 正常工作
- **AND** 完成时 SHALL 作为惊喜展示给玩家

### Requirement: 消息通知

任务事件 SHALL 通过 MessageManager 生成消息记录。

#### Scenario: 任务完成通知

- **WHEN** `quest:completed` 事件发射
- **THEN** MessageManager SHALL 匹配 `quest:*` 模板
- **AND** 消息 SHALL 发送到 `reward` 通道
- **AND** 消息内容 SHALL 包含任务名称和"请在任务面板领取奖励"提示

#### Scenario: 领取奖励通知

- **WHEN** `quest:claimed` 事件发射
- **THEN** MessageManager SHALL 生成消息："✅ 领取了任务「xxx」的奖励：灵石 ×500 + 铁剑 ×1"
- **AND** 消息 SHALL 发送到 `reward` 通道
