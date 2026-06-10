# event-registry

## Purpose

定义事件类型注册中心（EventRegistry），让各功能模块能以声明式方式注册自有事件类型，而无需修改 `core/events/` 中的任何代码。

## Requirements

### Requirement: 模块事件命名空间注册

系统 SHALL 提供 `EventRegistry.registerModule()` 方法，各模块可传入命名空间和事件定义对象来注册自有事件类型。注册后事件总线自动识别 `namespace:event_name` 格式的事件字符串。

#### Scenario: 模块成功注册命名空间事件
- **WHEN** combat 模块调用 `eventRegistry.registerModule('combat', { monster_killed: { description: '击杀怪物' }, boss_killed: { description: '击杀Boss' } })`
- **THEN** 事件总线 SHALL 接受 `'combat:monster_killed'` 和 `'combat:boss_killed'` 为有效事件类型
- **AND** `eventRegistry.getModuleEvents('combat')` SHALL 返回包含 `monster_killed` 和 `boss_killed` 的配置列表

#### Scenario: 重复命名空间注册保护
- **WHEN** 同一命名空间（如 `'combat'`）被第二个模块调用 `registerModule('combat', ...)` 
- **THEN** 系统 SHALL 输出 console.warn 警告
- **AND** 新事件定义 SHALL 合并进已有命名空间（不覆盖已有事件）

#### Scenario: 注册返回类型安全的事件发射器
- **WHEN** 模块调用 `const emitter = eventRegistry.registerModule('combat', eventDefs)`
- **THEN** `emitter` SHALL 具有 `emit(eventKey, payload)` 方法
- **AND** `emit` 的第一个参数 SHALL 只接受该模块注册的事件键名

### Requirement: 事件名常量自动生成

注册后系统 SHALL 返回一个包含完整事件名字符串常量的对象，模块可导出供其他模块使用，避免字符串拼写错误。

#### Scenario: 命名空间事件常量导出
- **WHEN** combat 模块注册 `{ monster_killed: {...} }` 后
- **THEN** 返回对象 SHALL 包含 `monster_killed: 'combat:monster_killed'` 常量
- **AND** 其他模块可通过 `import { combatEvents } from '@/modules/combat/events'` 使用 `combatEvents.monster_killed` 获取完整事件名

### Requirement: 事件命名空间隔离

每个命名空间的事件类型由注册该空间的模块自行定义，core 事件总线不做预定义。事件总线的核心逻辑只关心字符串路由，不关心字符串的具体语义。

#### Scenario: 新增模块事件无需修改 core
- **WHEN** 开发 trading 模块需要新增 `trade_completed` 事件
- **THEN** trading 模块 SHALL 只需调用 `registerModule('trading', { trade_completed: {...} })` 
- **AND** 无需修改 `core/events/` 目录下的任何文件
- **AND** 其他模块 SHALL 可通过 `'trading:trade_completed'` 字符串订阅该事件

### Requirement: 事件定义包含可选验证 Schema

事件注册时 SHALL 支持传入可选的 Zod schema，用于运行时验证事件负载数据结构。

#### Scenario: 注册时传入 Zod schema
- **WHEN** 模块注册事件时提供 `{ item_collected: { schema: z.object({ itemId: z.string() }) } }`
- **THEN** 触发该事件时系统 SHALL 使用对应 schema 验证 payload
- **AND** 验证失败时 SHALL 输出 console.error 并跳过该事件（不触发任何监听器）

#### Scenario: 注册时不传入 schema
- **WHEN** 模块注册事件时未提供 schema
- **THEN** 触发该事件时 SHALL 不做运行时验证，直接传递 payload 给所有监听器
