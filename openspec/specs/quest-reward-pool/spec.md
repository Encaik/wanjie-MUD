# quest-reward-pool

## Purpose

任务奖励与 reward-pool 模块的桥接。`QuestDefinition.rewardPool` 字段引用奖励池 ID，任务完成时通过 poolEngine 动态生成奖励。同时保留静态 `rewards` 作为简单任务的直接配置方式。

## ADDED Requirements

### Requirement: QuestDefinition 奖励池字段

`QuestDefinition` SHALL 新增 `rewardPool` 字段。

```typescript
rewardPool?: {
  /** 引用的奖励池 ID */
  poolId: string;
  /** 奖励倍数（默认 1.0） */
  multiplier?: number;
}
```

#### Scenario: 走奖励池路径

- **WHEN** `quest.rewardPool = { poolId: 'quest_daily_rewards', multiplier: 1.5 }`
- **AND** 玩家领取任务奖励
- **THEN** SHALL 调用 `poolEngine.rollPool('quest_daily_rewards', ctx)` 生成奖励
- **AND** 数量 SHALL 乘以 1.5

#### Scenario: 走静态奖励路径

- **WHEN** `quest.rewardPool` 为 `undefined`
- **AND** `quest.rewards` 包含 `[{ experience: 500 }, { items: [{ itemId: 'sword_01', quantity: 1 }] }]`
- **THEN** SHALL 发放静态定义的奖励
- **AND** 不调用 poolEngine

### Requirement: 奖励池上下文构建

奖励池的 `RollContext` SHALL 从当前游戏状态构建。

#### Scenario: 上下文参数

- **WHEN** 构建 RollContext
- **THEN** `playerLevel` SHALL 取自 protagonist.level
- **AND** `worldView` SHALL 取自 selectedWorld.worldviewId
- **AND** `luck` SHALL 取自 protagonist.luck 或 coreStats.luck
- **AND** `difficulty` SHALL 取自 quest.difficulty 映射
- **AND** `seed` SHALL 使用 seeded RNG（基于 questId + timestamp）

### Requirement: 阶段奖励合并

任务级奖励和阶段奖励 SHALL 合并为最终奖励。

#### Scenario: 多阶段奖励

- **WHEN** Stage 1 的 `completions['done'].stageRewards` 包含 `{ spiritStones: 100 }`
- **AND** 最终 Stage 完成后 `quest.rewards` 包含 `{ experience: 500 }`
- **THEN** 奖励 SHALL 包含 100 灵石 + 500 经验

### Requirement: 手动领奖

所有任务 SHALL 统一为"完成任务 → 手动领取奖励"二阶段操作。

#### Scenario: 任务完成不发奖

- **WHEN** 任务所有 stage 目标达成
- **THEN** questId SHALL 添加到 `completedQuestIds`
- **AND** reward SHALL NOT 自动发放
- **AND** 消息 SHALL 提示"请在任务面板领取奖励"

#### Scenario: 手动领取

- **WHEN** 玩家点击"领取奖励"按钮
- **AND** questId 在 `completedQuestIds` 中 ✅
- **AND** questId 不在 `claimedQuestIds` 中 ✅
- **THEN** 奖励 SHALL 发放（物品入库、货币累加、经验增加）
- **AND** questId SHALL 添加到 `claimedQuestIds`
- **AND** 消息 SHALL 记录奖励内容
- **AND** 按钮 SHALL 消失/变灰

#### Scenario: 重复领取防护

- **WHEN** questId 已在 `claimedQuestIds` 中
- **THEN** 领取按钮 SHALL NOT 显示
- **AND** 后端校验 SHALL 拒绝重复领取

### Requirement: 领取回执

领取操作 SHALL 返回 `ActionResult`。

#### Scenario: 领取成功

- **WHEN** 领取奖励成功
- **THEN** 返回 `{ success: true, data: { items: [...], currencies: [...], experience: 500 } }`
- **AND** `data` SHALL 包含 RollResult 或静态奖励明细

#### Scenario: 领取失败

- **WHEN** 任务未完成
- **THEN** 返回 `{ success: false, error: '任务未完成，无法领取奖励' }`
