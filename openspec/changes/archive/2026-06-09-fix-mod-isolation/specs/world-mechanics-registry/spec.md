## ADDED Requirements

### Requirement: WorldMechanics 通过注册表获取

世界独特机制 SHALL 通过注册器模式获取，Mod SHALL 能注册自定义 `WorldMechanics` 实现。系统 SHALL NOT 使用硬编码的 8 世界映射表，SHALL NOT 包含沉默 Fallback 到修仙机制。

#### Scenario: Mod 注册自定义世界机制
- **WHEN** 一个 Mod 在加载时调用 `WorldMechanicsRegistry.register(worldTypeId, mechanicsImpl)`
- **THEN** 游戏代码通过 `WorldMechanicsRegistry.get(worldTypeId)` SHALL 获取该实现
- **AND** 该世界的修炼/战斗/探索行为 SHALL 使用注册的实现

#### Scenario: 未注册机制的世界抛出错误
- **WHEN** 代码请求一个未注册 `WorldMechanics` 的世界类型的机制
- **THEN** 系统 SHALL 抛出 `Error` 明确说明缺失的机制
- **AND** SHALL NOT 静默返回修仙世界的机制作为默认

#### Scenario: 内置世界自注册
- **WHEN** 核心 Mod（wanjie-core）加载时
- **THEN** 8 个内置世界的 `WorldMechanics` 实现 SHALL 自动注册到注册表
- **AND** 自注册代码 SHALL 放在各世界机制文件内（如 `cultivationWorld.ts` 底部调用 `register()`）

### Requirement: WorldMechanicsRegistry 单例管理

`WorldMechanicsRegistry` SHALL 是单例类，提供 `register()`、`get()`、`has()`、`getAll()` 方法，与 `WorldDataRegistry` 模式一致。

#### Scenario: 注册和获取世界机制
- **WHEN** 调用 `WorldMechanicsRegistry.getInstance().register('修仙', cultivationWorld)`
- **THEN** 后续调用 `WorldMechanicsRegistry.getInstance().get('修仙')` SHALL 返回 `cultivationWorld`
- **AND** 调用 `WorldMechanicsRegistry.getInstance().has('修仙')` SHALL 返回 `true`

#### Scenario: 覆盖注册发出警告
- **WHEN** 为已注册的世界类型 ID 再次注册 `WorldMechanics`
- **THEN** 系统 SHALL 发出 `console.warn` 警告
- **AND** 新注册的实现 SHALL 覆盖旧实现（最后写入胜出）

#### Scenario: 获取所有已注册机制
- **WHEN** 调用 `WorldMechanicsRegistry.getInstance().getAll()`
- **THEN** SHALL 返回 `Map<string, WorldMechanics>` 包含所有已注册的世界机制

### Requirement: 世界机制工厂函数委托注册表

`getWorldMechanics()` 工厂函数 SHALL 委托 `WorldMechanicsRegistry`，SHALL NOT 维护独立的硬编码映射表。

#### Scenario: 工厂函数查询注册表
- **WHEN** 调用 `getWorldMechanics('修仙')`
- **THEN** 内部 SHALL 调用 `WorldMechanicsRegistry.getInstance().get('修仙')`
- **AND** 如果注册表无此世界类型，SHALL 抛出 `Error`

#### Scenario: 移除 hasUniqueMechanics 硬编码
- **WHEN** 检查 `factory.ts` 中的 `hasUniqueMechanics()` 函数
- **THEN** SHALL NOT 存在 `worldType !== '修仙'` 等硬编码比较
- **AND** 函数实现 SHALL 查询注册表判断是否有独特机制
