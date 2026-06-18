# quest-board

## Purpose

任务板块系统（QuestBoard），将任务按类别组织为不同板块（新手、主线、支线、日常、周常、势力、活动、成就）。每个板块有独立的刷新规则和槽位管理，板块始终展示但根据状态显示不同 UI（锁定/空/可接取/可领取/冷却中）。

## ADDED Requirements

### Requirement: 板块定义

板块 SHALL 使用 `QuestBoard` 类型定义。

```typescript
interface QuestBoard {
  id: string;
  name: string;
  category: QuestCategory;  // tutorial|main_story|side_story|daily|weekly|faction|event|achievement
  description?: string;
  refreshRule: RefreshRule;
  slotCount: number;
  questPool: string[];
  randomPick: boolean;
  unlockConditions?: QuestPrerequisite[];
}
```

#### Scenario: 永不刷新的板块

- **WHEN** 板块 `refreshRule.type = 'never'`（如 tutorial、main_story）
- **THEN** 槽位 SHALL 按 `questPool` 顺序选取前 `slotCount` 个可用任务
- **AND** 任务完成后下一个任务自动进入槽位

#### Scenario: 每日刷新的板块

- **WHEN** 板块 `refreshRule.type = 'daily'`
- **THEN** 每日零点 SHALL 重新随机选取 `slotCount` 个任务
- **AND** `boardLastRefresh` SHALL 更新为刷新时间

#### Scenario: 周常板块

- **WHEN** 板块 `refreshRule.type = 'weekly'` + `resetDay = 1`（周一）
- **THEN** 每周一零点 SHALL 刷新槽位

### Requirement: 板块槽位管理

槽位 SHALL 存储在 `QuestState.boardSlots`，每次刷新时更新。

#### Scenario: 按序选取

- **WHEN** `randomPick = false` + `questPool = ['q_a', 'q_b', 'q_c', 'q_d']` + `slotCount = 2`
- **THEN** 槽位 SHALL 为 `['q_a', 'q_b']`
- **AND** q_a 完成后，槽位 SHALL 变为 `['q_b', 'q_c']`

#### Scenario: 随机选取

- **WHEN** `randomPick = true` + `questPool = ['q_a', 'q_b', 'q_c', 'q_d', 'q_e']` + `slotCount = 3`
- **THEN** 从可用任务中随机选取 3 个
- **AND** 每个任务有独立的权重（由 QuestDefinition 定义或默认等权重）

### Requirement: 板块解锁

板块 SHALL 支持 `unlockConditions`，不满足时显示锁定状态。

#### Scenario: 势力板块需加入势力

- **WHEN** faction 板块 unlockConditions 包含 `{ type: 'faction', target: 'any' }`
- **AND** 玩家未加入任何势力
- **THEN** 该板块 SHALL 显示为 🔒 锁定

#### Scenario: 主线板块需完成引导

- **WHEN** main_story 板块 unlockConditions 包含 `{ type: 'quest_completed', target: 'tutorial_final' }`
- **AND** 引导未完成
- **THEN** 该板块 SHALL 显示为 🔒 锁定

### Requirement: 板块 UI 状态

板块 SHALL 始终在 QuestPanel 中显示，状态由数据和条件决定：

| 条件 | UI 展示 |
|------|--------|
| unlockConditions 未满足 | 🔒 锁定（灰色图标，不可点击） |
| unlockConditions 满足 + boardSlots 为空 | 📭 "暂无任务" |
| 槽位有可接取任务 | 📋 任务列表 + 接取按钮 |
| 槽位全部完成未领取 | 🎁 "全部完成，可领取奖励" |
| 已完成 + 单次任务 | ✓ "已完成" |
| 已完成 + 重复任务冷却中 | ⏳ "冷却中 HH:MM:SS" |

#### Scenario: 板块状态切换

- **WHEN** 玩家完成板块最后一个槽位任务
- **THEN** 板块状态 SHALL 从"进行中"切换为"全部完成，可领取奖励"
- **AND** 领取按钮 SHALL 高亮

### Requirement: 板块注册中心

系统 SHALL 提供 `BoardRegistry` 单例，存储在 `core/registry/`。

#### Scenario: Mod 注册板块

- **WHEN** Mod 的 quests/boards.json 包含 `[{id: 'season_pass', ...}]`
- **THEN** ModLoader SHALL 调用 `BoardRegistry.getInstance().register(board)`
- **AND** 板块 SHALL 出现在 QuestPanel 的 Tab 列表中
