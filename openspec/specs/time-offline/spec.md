## Purpose

离线处理引擎，统一处理玩家离线期间的体力/HP/MP 恢复、冷却过期清理、每日/每周刷新检测和自动修炼收益计算。合并了旧版 3 个离线处理器，位于 `core/time/offlineProcessor.ts`。

## Requirements

### Requirement: 离线体力恢复
系统 SHALL 在离线期间自动计算体力恢复量，基于配置的恢复间隔和单次恢复量。

#### Scenario: 离线 30 分钟恢复体力
- **WHEN** 离线 30 分钟（1800000ms）且体力未满
- **AND** 配置 `staminaRecoverInterval = 300000`（5 分钟一次）
- **AND** 配置 `staminaRecoverAmount = 1`
- **THEN** `OfflineResult.staminaRecovered = 6`

#### Scenario: 体力已满时不恢复
- **WHEN** 离线期间体力已达最大值
- **THEN** `OfflineResult.staminaRecovered = 0`

### Requirement: 离线 HP 恢复
系统 SHALL 在离线期间自动计算 HP 恢复量，基于最大 HP 百分比。

#### Scenario: 离线期间 HP 恢复
- **WHEN** 离线时长足够且 HP 未满
- **AND** 配置 `hpRecoverInterval = 300000, hpRecoverPercent = 0.05`
- **THEN** 每次恢复 `maxHp * 0.05` 的 HP 值

#### Scenario: HP 已满时不恢复
- **WHEN** 离线期间 HP 已达最大值
- **THEN** `OfflineResult.hpRecovered = 0`

### Requirement: 离线 MP 恢复
系统 SHALL 在离线期间自动计算 MP 恢复量，基于最大 MP 百分比。

#### Scenario: 离线期间 MP 恢复
- **WHEN** 离线时长足够且 MP 未满
- **AND** 配置 `mpRecoverInterval = 300000, mpRecoverPercent = 0.08`
- **THEN** 每次恢复 `maxMp * 0.08` 的 MP 值

### Requirement: 离线冷却过期处理
系统 SHALL 在离线处理中检查所有冷却是否过期，并返回过期 ID 列表。

#### Scenario: 部分冷却在离线期间过期
- **WHEN** cooldowns 中有 `'explore'`（在离线期间结束）和 `'cultivate'`（尚未结束）
- **THEN** `OfflineResult.expiredCooldownIds` 包含 `'explore'`
- **AND** `OfflineResult.expiredCooldownIds` 不包含 `'cultivate'`

### Requirement: 离线自动修炼收益计算
系统 SHALL 在离线期间自动计算修炼收益（当 `autoCultivating = true` 时）。

#### Scenario: 离线期间自动修炼
- **WHEN** 离线 1 小时且开启自动修炼
- **AND** 灵石充足
- **THEN** `OfflineResult.autoCultivate.executed = true`
- **AND** `OfflineResult.autoCultivate.count` 等于最大可修炼次数

#### Scenario: 灵石不足时停止自动修炼
- **WHEN** 离线期间灵石消耗完毕
- **THEN** `OfflineResult.autoCultivate.stoppedByResource = true`

#### Scenario: 未开启自动修炼时不计算
- **WHEN** `autoCultivating = false`
- **THEN** `OfflineResult.autoCultivate.executed = false`

### Requirement: 离线修炼批量升级计算
系统 SHALL 使用二分查找算法高效计算离线修炼后的等级变化，而非逐级循环。

#### Scenario: 离线经验足以升多级
- **WHEN** 当前等级 10，离线获得经验 10000
- **THEN** `AutoCultivateResult.endLevel > startLevel`
- **AND** `AutoCultivateResult.endExperience` 为升级后的正确经验进度

#### Scenario: 满级后经验增加但不升级
- **WHEN** 当前等级已达 `MAX_LEVEL`
- **THEN** `AutoCultivateResult.endLevel = MAX_LEVEL`
- **AND** `AutoCultivateResult.levelsGained = 0`

### Requirement: 离线收益应用到 Protagonist
系统 SHALL 提供 `offline.applyResult()` 将 `OfflineResult` 应用到 `Protagonist` 对象。

#### Scenario: 应用体力恢复
- **WHEN** 调用 `offline.applyResult(protagonist, result)` 且 `result.staminaRecovered = 5`
- **THEN** 返回的 `Protagonist.stamina` 增加 5（不超过 maxStamina）

#### Scenario: 应用自动修炼收益
- **WHEN** 调用 `offline.applyResult(protagonist, result)` 且自动修炼有收益
- **THEN** 返回的 `Protagonist.level` 更新为 `result.endLevel`
- **AND** `Protagonist.experience` 更新为 `result.endExperience`
- **AND** `Protagonist.inventory` 中的灵石数量减少

### Requirement: 离线时长限制
系统 SHALL 限制最大离线时长（默认 8 小时），超过部分不计入收益。

#### Scenario: 离线超过 8 小时
- **WHEN** 实际离线时长 12 小时
- **THEN** `OfflineResult.offlineDuration` 不超过 8 小时（28800000ms）

### Requirement: 离线弹窗判断
系统 SHALL 提供 `offline.shouldShowDialog()` 判断是否显示离线收益弹窗。

#### Scenario: 离线超过 30 秒需要弹窗
- **WHEN** `offlineDuration >= 30000`（30 秒）
- **THEN** 返回 `true`

#### Scenario: 离线不足 30 秒不需要弹窗
- **WHEN** `offlineDuration < 30000`
- **THEN** 返回 `false`

### Requirement: 离线每日/周刷新检测
系统 SHALL 在离线处理中检测是否需要每日刷新和每周刷新。

#### Scenario: 离线跨天
- **WHEN** `lastLogoutAt` 是 2025-01-01 且 `serverNow` 是 2025-01-02
- **THEN** `OfflineResult.needsDailyRefresh = true`

#### Scenario: 离线跨周
- **WHEN** `lastLogoutAt` 是周日且 `serverNow` 是周一
- **THEN** `OfflineResult.needsWeeklyRefresh = true`
