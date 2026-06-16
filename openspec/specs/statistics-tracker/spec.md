# statistics-tracker

## ADDED Requirements

### Requirement: 统一事件类型注册

所有统计相关事件 SHALL 通过 `EventRegistry` 在 `core/statistics/eventTypes.ts` 中声明式注册，按域划分命名空间（combat/cultivation/item/economy/adventure/collection/faction/achievement/path/technique/equipment/bond/crafting/player/tutorial）。

#### Scenario: 事件类型完整性

- **WHEN** GameStore 订阅 `'*'` 事件
- **THEN** 每个游戏操作都有一个对应的注册事件类型
- **AND** 事件类型命名格式为 `domain:action`
- **AND** 事件 payload 从 `StatisticsEventPayload` 类型中推导

### Requirement: 纯函数统计更新

`core/statistics/updaters.ts` SHALL 导出事件类型到统计更新函数的映射表 `statisticsUpdaters`。每个更新函数是纯函数：(stats: GameStatistics, payload) → GameStatistics。

#### Scenario: 修炼事件更新统计

- **GIVEN** 当前 statistics.totalCultivations = 5
- **WHEN** `processStatisticsEvent(stats, { type: 'cultivation:performed', payload: { count: 1 } })`
- **THEN** 返回的新 statistics.totalCultivations = 6

#### Scenario: 击杀 Boss 更新统计

- **GIVEN** 当前 statistics.totalBossKilled = 2
- **WHEN** `processStatisticsEvent(stats, { type: 'combat:boss_killed', payload: { count: 2 } })`
- **THEN** 返回的新 statistics.totalBossKilled = 4

#### Scenario: 已收集功法去重

- **GIVEN** collectedTechniqueNames 已包含 '太乙真经'
- **WHEN** `processStatisticsEvent(stats, { type: 'collection:technique_obtained', payload: { name: '太乙真经' } })`
- **THEN** totalTechniquesCollected 不变
- **AND** collectedTechniqueNames 数组不新增重复项

#### Scenario: 未知事件类型

- **WHEN** `processStatisticsEvent(stats, { type: 'unknown:event', payload: {} })`
- **THEN** 返回原 stats 不动
- **AND** 不抛出异常

### Requirement: processStatisticsEvent 主函数

`core/statistics/statisticsTracker.ts` SHALL 导出 `processStatisticsEvent(stats, event)` 函数，查表调用对应 updater。

#### Scenario: 批量事件处理

- **GIVEN** 批量事件 [{ type: 'cultivation:performed', payload: { count: 1 } }, { type: 'combat:enemy_killed', payload: { count: 3 } }]
- **WHEN** 对每个事件依次调用 `processStatisticsEvent`
- **THEN** 最终 statistics 同时包含修炼和战斗的增量

### Requirement: 旧 StatisticsManager 兼容

`modules/collection/logic/statistics/statisticsSystem.ts` 中的 `StatisticsManager` 类 SHALL 转为调用 `core/statistics/` 的新纯函数，标记 `@deprecated`，导出保持不变。

#### Scenario: 旧调用者仍可工作

- **WHEN** 某 Hook 仍调用 `statisticsManager.processEvent(stats, 'enemy_killed', payload)`
- **THEN** 仍然返回正确的新 statistics
- **AND** 控制台不产生 warning

### Requirement: GameStore 集中事件处理

`GameStore.tsx` SHALL 添加一个 `useEffect` 订阅 `on('*')`，对每个事件依次调用 `processStatisticsEvent()` → 更新 `gameState.statistics`。

#### Scenario: 节流处理

- **WHEN** 1 秒内到达 10 个事件
- **THEN** `setGameState` 最多被触发 1 次
- **AND** 10 个事件的效果都在该次更新中体现
