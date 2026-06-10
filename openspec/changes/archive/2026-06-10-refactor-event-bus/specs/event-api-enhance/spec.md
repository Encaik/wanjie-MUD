# event-api-enhance

## Purpose

增强事件总线的核心 API，补充 `once()`、`off()` 等业界标准方法，支持优先级排序、错误恢复，让事件总线更稳健、更易用。

## ADDED Requirements

### Requirement: 事件总线核心 API

系统 SHALL 提供 `on`、`once`、`off`、`emit` 四个核心方法作为事件总线最小 API。`removeAllListeners` 和 `getHistory` 作为辅助方法保留。

#### Scenario: on() 订阅并返回取消函数
- **WHEN** 调用 `const unsub = eventBus.on('combat:monster_killed', handler)`
- **THEN** `handler` SHALL 被添加到 `combat:monster_killed` 事件的监听器列表中
- **AND** 返回值 `unsub` SHALL 是一个函数，调用后取消该订阅

#### Scenario: emit() 触发事件
- **WHEN** 调用 `eventBus.emit('combat:monster_killed', { enemyName: 'Demon', enemyTier: 'boss', enemyLevel: 10 })`
- **THEN** 所有订阅了 `combat:monster_killed` 的监听器 SHALL 被依次调用
- **AND** 每个监听器收到的 event 对象 SHALL 包含 `type`、`timestamp`、`payload` 三个字段

#### Scenario: once() 一次性订阅
- **WHEN** 调用 `eventBus.once('combat:boss_killed', handler)`
- **AND** 随后触发 `combat:boss_killed` 事件
- **THEN** handler SHALL 被调用一次
- **AND** 再次触发 `combat:boss_killed` 时 SHALL NOT 再次调用 handler

#### Scenario: off() 精确移除监听器
- **WHEN** 先调用 `eventBus.on('combat:monster_killed', handler)` 再调用 `eventBus.off('combat:monster_killed', handler)`
- **THEN** 触发 `combat:monster_killed` 时 SHALL NOT 调用 handler

### Requirement: 监听器优先级排序

系统 SHALL 支持在订阅时指定 `priority` 选项，事件触发时监听器按 priority 从小到大顺序执行。

#### Scenario: 优先级数值小的先执行
- **WHEN** handlerA 以 `{ priority: 10 }` 订阅，handlerB 以 `{ priority: 0 }` 订阅同一事件
- **THEN** 触发事件时 handlerB（priority 0）SHALL 先于 handlerA（priority 10）执行

#### Scenario: 同优先级按订阅先后顺序执行
- **WHEN** handlerA 和 handlerB 以相同 priority 订阅同一事件
- **THEN** 先订阅的 handler SHALL 先执行

#### Scenario: 未指定优先级默认为 0
- **WHEN** 订阅时未传入 `priority` 选项
- **THEN** 该监听器 SHALL 使用默认优先级 0

### Requirement: 监听器错误隔离

单个监听器执行时的异常 SHALL NOT 影响其他监听器的执行，也不应中断事件触发的整体流程。

#### Scenario: 监听器异常不影响后续监听器
- **WHEN** 事件有三个监听器 A、B、C，其中 B 执行时抛出异常
- **THEN** A SHALL 正常执行完毕
- **AND** B 的异常 SHALL 被捕获并输出 `console.error`
- **AND** C SHALL 仍然被调用（不被 B 的异常中断）

### Requirement: 事件历史记录

系统 SHALL 保留最近触发的事件历史，提供 `getHistory()` 和 `clearHistory()` 方法。历史记录上限默认为 100 条。

#### Scenario: 获取最近事件历史
- **WHEN** 先后触发了事件 A、B、C
- **THEN** `eventBus.getHistory()` SHALL 返回 `[A, B, C]` 的浅拷贝
- **AND** 每个历史条目 SHALL 包含 `type`、`timestamp`、`payload`

#### Scenario: 历史记录超过上限自动丢弃
- **WHEN** 历史记录已达上限（默认 100 条）且触发新事件
- **THEN** 最早的历史记录 SHALL 被丢弃
- **AND** 新事件 SHALL 被添加到历史记录末尾

#### Scenario: 清空历史记录
- **WHEN** 调用 `eventBus.clearHistory()`
- **THEN** `getHistory()` SHALL 返回空数组

### Requirement: removeAllListeners 清除能力

系统 SHALL 提供 `removeAllListeners(type?)` 方法：传入事件类型时清除该类型所有监听器，不传参数时清除全部监听器。

#### Scenario: 清除特定事件类型的全部监听器
- **WHEN** 调用 `eventBus.removeAllListeners('combat:monster_killed')`
- **THEN** 所有订阅了 `combat:monster_killed` 的监听器 SHALL 被移除
- **AND** 其他事件类型的监听器 SHALL 不受影响

#### Scenario: 清除所有监听器
- **WHEN** 调用 `eventBus.removeAllListeners()`
- **THEN** 所有事件类型的所有监听器 SHALL 被移除
- **AND** 后续 `emit()` 任何事件 SHALL 无监听器被调用

### Requirement: 旧 API 完全移除

本次重构 SHALL 完全移除旧的 `GameEventType` 枚举、`EventPayloadMap` 接口、`triggerEvent()` 和 `addListener()` 导出。不保留任何 `@deprecated` 过渡兼容层。

#### Scenario: 旧枚举不可用
- **WHEN** 代码尝试 `import { GameEventType } from '@/core/events'`
- **THEN** TypeScript SHALL 报编译错误（导出不存在）

#### Scenario: 旧方法不可用
- **WHEN** 代码尝试 `import { triggerEvent } from '@/core/events'`
- **THEN** TypeScript SHALL 报编译错误（导出不存在）
