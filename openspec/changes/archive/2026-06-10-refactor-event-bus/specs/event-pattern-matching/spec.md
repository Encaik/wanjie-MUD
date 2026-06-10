# event-pattern-matching

## Purpose

提供基于模式匹配的事件订阅能力，支持通配符和自定义过滤函数，让监听器可以用一条订阅覆盖多类相关事件，减少样板代码。

## ADDED Requirements

### Requirement: 通配符模式匹配订阅

系统 SHALL 支持在 `on()` 和 `once()` 中使用结尾通配符 `*` 进行模式匹配订阅。格式为 `namespace:*` 或 `namespace:prefix*`。

#### Scenario: 订阅命名空间下所有事件
- **WHEN** 监听器调用 `eventBus.on('combat:*', handler)`
- **THEN** 所有以 `combat:` 开头的事件（如 `combat:monster_killed`、`combat:boss_killed`）触发时 SHALL 调用该 handler
- **AND** 非 `combat:` 开头的事件（如 `collection:item_collected`）触发时 SHALL NOT 调用该 handler

#### Scenario: 订阅前缀匹配的事件
- **WHEN** 监听器调用 `eventBus.on('combat:boss_*', handler)`
- **THEN** `combat:boss_killed` 触发时 SHALL 调用该 handler
- **AND** `combat:monster_killed` 触发时 SHALL NOT 调用该 handler

#### Scenario: 多个通配符订阅共存
- **WHEN** 同时存在 `on('combat:*', handlerA)` 和 `on('combat:monster_killed', handlerB)` 订阅
- **THEN** 触发 `combat:monster_killed` 时 SHALL 同时调用 handlerA 和 handlerB
- **AND** handlerB（精确匹配）SHALL 先于 handlerA（通配符匹配）执行

### Requirement: 函数过滤器订阅

系统 SHALL 支持在 `on()` 中传入函数过滤器作为事件选择器，替代字符串模式。

#### Scenario: 自定义过滤函数
- **WHEN** 监听器调用 `eventBus.on(type => type.includes('killed'), handler)`
- **THEN** 所有类型名包含 `killed` 的事件触发时 SHALL 调用该 handler
- **AND** 类型名不包含 `killed` 的事件触发时 SHALL NOT 调用该 handler

#### Scenario: 复杂条件过滤
- **WHEN** 监听器传入过滤函数 `(type, payload) => payload.rarity === 'legendary'`
- **THEN** handler SHALL 只在事件类型匹配过滤条件时才被调用

### Requirement: 模式匹配与取消订阅兼容

通配符订阅和过滤器订阅 SHALL 与 `off()` 精确取消订阅兼容——通过 `off(pattern, handler)` 传入模式字符串可以取消对应的通配符订阅。

#### Scenario: 取消通配符订阅
- **WHEN** 先调用 `eventBus.on('combat:*', handler)` 获得取消函数 `unsub`
- **THEN** 调用 `unsub()` 后，触发任何 `combat:*` 事件 SHALL NOT 调用该 handler
- **AND** 调用 `eventBus.off('combat:*', handler)` 也具有同等效果

### Requirement: 事件触发时模式匹配性能约束

通配符订阅的内部匹配逻辑 SHALL 在触发事件时以 O(p) 复杂度执行，其中 p 为通配符模式订阅总数（非所有订阅数）。匹配结果 SHALL 在当前事件触发周期内缓存。

#### Scenario: 精确订阅不受影响
- **WHEN** 系统中存在 N 个精确匹配订阅和 M 个通配符订阅
- **THEN** 触发精确匹配的事件时 SHALL 只遍历该事件类型的精确订阅列表 + 检查 M 个通配符模式
- **AND** 不遍历其他类型的精确订阅
