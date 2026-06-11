## ADDED Requirements

### Requirement: WorldViewRegistry 单例注册中心

系统 SHALL 提供 `WorldViewRegistry` 单例类（位于 `src/core/registry/WorldViewRegistry.ts`），作为所有世界观数据的唯一管理入口。该注册中心 SHALL 仅管理 `WorldviewDefinition` 的注册、查询和校验，替代原有的 `WorldDataRegistry`。

注册中心 SHALL 使用 Map 存储，key 为世界观 ID（英文 kebab-case，如 `"cultivation"`），value 为 `WorldviewDefinition` 对象。

#### Scenario: 注册世界观

- **WHEN** 调用 `WorldViewRegistry.getInstance().register(worldviewDefinition)`
- **THEN** 该世界观 SHALL 被存储并可查询
- **AND** 返回注册后的 `WorldviewDefinition`

#### Scenario: 重复注册检测

- **WHEN** 尝试注册一个 `id` 已存在的世界观
- **THEN** 系统 SHALL 抛出 `Error` 明确说明世界观 ID 冲突

#### Scenario: 查询已注册的世界观

- **WHEN** 调用 `WorldViewRegistry.getInstance().get('cultivation')`
- **THEN** SHALL 返回对应的 `WorldviewDefinition` 对象
- **AND** 返回类型 SHALL 为 `WorldviewDefinition | undefined`

#### Scenario: 查询不存在的世界观

- **WHEN** 调用 `WorldViewRegistry.getInstance().get('nonexistent')`
- **THEN** SHALL 返回 `undefined`

#### Scenario: 获取所有世界观

- **WHEN** 调用 `WorldViewRegistry.getInstance().getAll()`
- **THEN** SHALL 返回所有已注册 `WorldviewDefinition` 的数组
- **AND** 数组 SHALL 按注册顺序排列

#### Scenario: 获取内置世界观

- **WHEN** 调用 `WorldViewRegistry.getInstance().getBuiltins()`
- **THEN** SHALL 返回所有 `builtin: true` 的世界观数组

#### Scenario: 获取世界观总数

- **WHEN** 调用 `WorldViewRegistry.getInstance().count`
- **THEN** SHALL 返回已注册世界观的数量

### Requirement: WorldViewRegistry 不存储 WorldTemplate

`WorldViewRegistry` SHALL NOT 包含任何与固化世界模板（`WorldTemplate`）相关的存储或方法。该概念已被移除，世界实例 SHALL 仅通过 `WorldProvider` 从 `WorldviewDefinition` 动态生成。

#### Scenario: 无模板存储

- **WHEN** 检查 `WorldViewRegistry` 的公开 API
- **THEN** SHALL NOT 存在 `worldTemplates` Map 或 `registerWorldTemplate()` 方法
- **AND** SHALL NOT 存在 `getTemplate()` 方法

#### Scenario: 无旧 worldTypes 字段

- **WHEN** 检查 `WorldViewRegistry` 的公开 API
- **THEN** SHALL NOT 存在 `worldTypes` 字段或 `WorldTypeData` 相关方法
- **AND** SHALL NOT 存在 `registerWorldType()` 或 `getWorldType()` 方法

### Requirement: WorldViewRegistry 替代 WorldDataRegistry

`WorldViewRegistry` SHALL 完全替代 `WorldDataRegistry`。所有原引用 `WorldDataRegistry` 的代码 SHALL 迁移到 `WorldViewRegistry`。旧文件 SHALL 被删除。

#### Scenario: WorldDataRegistry 文件已删除

- **WHEN** 检查 `src/core/registry/` 目录
- **THEN** SHALL NOT 存在 `WorldDataRegistry.ts` 文件
- **AND** SHALL NOT 存在 `WorldDataRegistry.test.ts` 文件

#### Scenario: 所有导入指向新路径

- **WHEN** 搜索所有源代码中的 `WorldDataRegistry`
- **THEN** SHALL NOT 存在该标识符的导入语句
- **AND** 所有原引用点 SHALL 使用 `WorldViewRegistry`

### Requirement: WorldViewRegistry 仅管理 WorldviewDefinition

`WorldViewRegistry` SHALL 只管理 `WorldviewDefinition` 对象。Mod JSON 加载后的完整世界观数据 SHALL 直接以 `WorldviewDefinition` 形式注册，不再拆分为零散的 pools。

#### Scenario: 注册数据已是 WorldviewDefinition

- **WHEN** Mod 加载器解析完一个世界观 JSON（如 `cultivation.json`）
- **THEN** 结果 SHALL 为完整的 `WorldviewDefinition` 对象
- **AND** 直接调用 `WorldViewRegistry.register(worldview)` 注册
- **AND** 不再需要分步注册 dangers、opportunities、factions 等子字段

### Requirement: 初始化时自动注册世界观

服务端初始化（`app/api/init.ts`）和 Mod 加载器（`ModLoader`）SHALL 在启动时将已加载的 `WorldviewDefinition` 注册到 `WorldViewRegistry`。

#### Scenario: 服务端启动注册

- **WHEN** `ensureWorldSystemInitialized()` 被调用
- **THEN** 所有 Mod JSON 中加载的世界观 SHALL 被注册到 `WorldViewRegistry`
- **AND** 注册完成后 `WorldViewRegistry.getInstance().count` SHALL 等于加载的世界观总数

#### Scenario: 注册后 Provider 可正常生成世界

- **WHEN** 世界观已注册到 `WorldViewRegistry`
- **THEN** `WorldProvider` 可从中获取 `WorldviewDefinition` 用于生成 `World` 实例
- **AND** `WorldProviderRegistry` 正常工作不受影响
