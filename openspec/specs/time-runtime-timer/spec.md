## Purpose

运行时定时器服务，持续检测冷却过期和每日/每周刷新时机，通过 EventBus 通知各模块。位于 `core/time/timerService.ts`，单例模式，500ms tick 间隔。

## Requirements

### Requirement: 定时服务启动与停止
系统 SHALL 提供 `timerService.start(serverNow)` 启动运行时定时器和 `timerService.stop()` 停止定时器。

#### Scenario: 启动后定时器持续运行
- **WHEN** 调用 `timerService.start(serverNow)`
- **THEN** 定时器以 500ms 间隔持续 tick

#### Scenario: 停止后不再 tick
- **WHEN** 调用 `timerService.stop()`
- **THEN** 定时器不再执行任何 tick

#### Scenario: 重复启动忽略
- **WHEN** 定时器已启动时再次调用 `timerService.start()`
- **THEN** 不做任何操作（不创建第二个定时器）

### Requirement: 定时检测冷却过期
系统 SHALL 在每次 tick 时检查所有冷却，对已过期的冷却通过 `GameEventBus` 发射 `CooldownEnded` 事件。

#### Scenario: 冷却过期时发射事件
- **WHEN** 冷却 `'explore'` 在两次 tick 之间过期
- **THEN** `GameEventBus` 收到类型为 `CooldownEnded` 的事件
- **AND** 事件 payload 包含 `{ cooldownId: 'explore' }`

#### Scenario: 无冷却过期时不发射事件
- **WHEN** 所有冷却都未过期
- **THEN** 不发射任何 `CooldownEnded` 事件

### Requirement: 定时检测每日刷新
系统 SHALL 在每次 tick 时检查是否跨越午夜，如果是则发射 `DailyReset` 事件。

#### Scenario: 跨过午夜时发射每日刷新事件
- **WHEN** `dailyRefreshAt` 是前一天且 `serverNow` 是当日凌晨 00:01
- **THEN** `GameEventBus` 收到类型为 `DailyReset` 的事件

#### Scenario: 同一日内不发射每日刷新事件
- **WHEN** `dailyRefreshAt` 和 `serverNow` 是同一天
- **THEN** 不发射 `DailyReset` 事件

#### Scenario: 发射事件后更新刷新时间
- **WHEN** `DailyReset` 事件发射后
- **THEN** `TimeState.real.dailyRefreshAt` 更新为当前 `serverNow`

### Requirement: 定时检测每周刷新
系统 SHALL 在每次 tick 时检查是否跨越周一 00:00，如果是则发射 `WeeklyReset` 事件。

#### Scenario: 跨过周一时发射每周刷新事件
- **WHEN** `weeklyRefreshAt` 是上周日且 `serverNow` 是周一 00:01
- **THEN** `GameEventBus` 收到类型为 `WeeklyReset` 的事件

### Requirement: 定时器事件发射防重
系统 SHALL 保证同一事件在同一时间点不会重复发射。

#### Scenario: 连续 tick 不重复发射每日刷新
- **WHEN** 第一个 tick 已发射 `DailyReset` 并更新 `dailyRefreshAt`
- **THEN** 后续 tick 不再发射 `DailyReset`（直到再次跨午夜）

### Requirement: 定时器支持时间同步
系统 SHALL 提供 `timerService.sync(serverNow)` 方法，允许在运行时更新服务端时间基准。

#### Scenario: 运行时同步服务端时间
- **WHEN** 调用 `timerService.sync(newServerNow)`
- **THEN** 下一次 tick 使用 `newServerNow` 作为当前时间

### Requirement: tick 回调机制
系统 SHALL 支持在每次 tick 时调用注册的回调函数，用于 UI 层更新（如冷却倒计时刷新）。

#### Scenario: UI 通过回调更新倒计时
- **WHEN** 有冷却进度需要实时显示
- **AND** 注册了 tick 回调
- **THEN** 每次 tick 都会调用该回调

#### Scenario: 移除回调
- **WHEN** 组件卸载时调用 `timerService.offTick(callback)`
- **THEN** 后续 tick 不再调用该回调
