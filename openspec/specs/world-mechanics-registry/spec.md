# world-mechanics-registry

## Purpose

世界特殊机制通过注册表注入，替代硬编码 `WORLD_MECHANICS` 映射。WorldMechanics 对象由 JSON 数据配置构造，不再需要手写 TS 文件。Mod 通过提供 `mechanics` JSON 配置即可定义完整的修炼/战斗/探索行为。

## ADDED Requirements

### Requirement: WorldMechanics 通过注册表获取

世界独特机制 SHALL 通过注册器模式获取，所有已注册世界的 `WorldMechanics` 由 `registerBuiltinMechanics()` 从 `WorldDataRegistry` 的 JSON 配置自动构造。系统 SHALL NOT 使用硬编码的 8 世界映射表，SHALL NOT 包含沉默 Fallback 到修仙机制。

#### Scenario: Mod 通过 JSON 配置提供世界机制
- **WHEN** 一个 Mod 在其世界数据 JSON 中提供 `mechanics` 配置（含 cultivation、combat、exploration、uniqueMechanic）
- **THEN** `registerBuiltinMechanics()` SHALL 从注册中心读取配置，通过 `buildWorldMechanics()` 构造 `WorldMechanics` 对象
- **AND** 该世界的修炼/战斗/探索行为 SHALL 使用配置中定义的参数

#### Scenario: 未注册机制的世界抛出错误
- **WHEN** 代码请求一个未注册 `WorldMechanics` 的世界类型的机制
- **THEN** 系统 SHALL 抛出 `Error` 明确说明缺失的机制
- **AND** SHALL NOT 静默返回修仙世界的机制作为默认

#### Scenario: 内置世界通过 Mod 加载流程注册
- **WHEN** 应用启动并完成 `ModLoader.loadAll()` 后
- **THEN** `registerBuiltinMechanics()` SHALL 遍历所有已注册世界类型，从 JSON 配置构造并注册 `WorldMechanics`
- **AND** 注册逻辑不依赖任何手写的世界特定 TS 文件

### Requirement: WorldMechanicsRegistry 单例管理

`WorldMechanicsRegistry` SHALL 是单例类，提供 `register()`、`get()`、`has()`、`getAll()` 方法，与 `WorldDataRegistry` 模式一致。

#### Scenario: 注册和获取世界机制
- **WHEN** 调用 `WorldMechanicsRegistry.getInstance().register('修仙', mechanics)`
- **THEN** 后续调用 `WorldMechanicsRegistry.getInstance().get('修仙')` SHALL 返回该 mechanics
- **AND** 调用 `WorldMechanicsRegistry.getInstance().has('修仙')` SHALL 返回 `true`

#### Scenario: 覆盖注册发出警告
- **WHEN** 为已注册的世界类型 ID 再次注册 `WorldMechanics`
- **THEN** 系统 SHALL 发出 `console.warn` 警告
- **AND** 新注册的实现 SHALL 覆盖旧实现（最后写入胜出）

#### Scenario: 获取所有已注册机制
- **WHEN** 调用 `WorldMechanicsRegistry.getInstance().getAll()`
- **THEN** SHALL 返回 `Map<string, WorldMechanics>` 包含所有已注册的世界机制

### Requirement: 世界机制工厂函数委托注册表

`getWorldMechanics()` 工厂函数 SHALL 委托 `WorldMechanicsRegistry`，SHALL NOT 维护独立的硬编码映射表。`factory.ts` SHALL NOT import 任何世界特定的 TS 文件。

#### Scenario: 工厂函数查询注册表
- **WHEN** 调用 `getWorldMechanics('修仙')`
- **THEN** 内部 SHALL 调用 `WorldMechanicsRegistry.getInstance().get('修仙')`
- **AND** 如果注册表无此世界类型，SHALL 抛出 `Error`

#### Scenario: 移除 hasUniqueMechanics 硬编码
- **WHEN** 检查 `factory.ts` 中的 `hasUniqueMechanics()` 函数
- **THEN** SHALL NOT 存在 `worldType !== '修仙'` 等硬编码比较
- **AND** 函数实现 SHALL 查询注册表判断是否有独特机制

### Requirement: WorldMechanics 由纯数据配置驱动

`WorldMechanics` 对象 SHALL 通过 `buildWorldMechanics(config: MechanicsConfig)` 从纯数据配置构造。`MechanicsConfig` 接口 SHALL 包含 `cultivation`、`combat`、`exploration`、`uniqueMechanic` 四个纯数据字段。WorldMechanics 接口 SHALL NOT 包含函数类型的字段（如 `customAutoStrategy`、`onWorldEnter` 等代码逻辑钩子）。

#### Scenario: MechanicsConfig 定义所有世界差异
- **WHEN** 检查 `MechanicsConfig` 接口
- **THEN** SHALL 包含 `worldType: string`
- **AND** SHALL 包含 `cultivation: WorldCultivationParams`
- **AND** SHALL 包含 `combat: WorldCombatParams`
- **AND** SHALL 包含 `exploration: WorldExplorationParams`
- **AND** SHALL 包含 `uniqueMechanic: UniqueMechanicInfo`

#### Scenario: buildWorldMechanics 构造正确的 WorldMechanics
- **WHEN** 传入一个完整的 `MechanicsConfig` 到 `buildWorldMechanics()`
- **THEN** 返回的 `WorldMechanics` 对象 SHALL 的 `getCultivationParams()` 返回配置中的 `cultivation` 值
- **AND** `getCombatParams()` 返回配置中的 `combat` 值
- **AND** 以此类推所有方法
