# world-provider-registry

## Purpose

定义统一的世界提供者注入接口和注册中心，让 mod 随机生成器和固化模板加载器以同一套契约提供世界数据，游戏代码只依赖抽象接口而不依赖具体来源。

## Requirements

### Requirement: WorldProvider 接口定义

系统 SHALL 定义 `WorldProvider` 抽象接口，所有世界来源（随机生成器、固化模板）SHALL 实现此接口。接口 SHALL 包含世界生成和元数据查询方法。两种 provider 类型产出相同形状的 `World` 实例，但内部构造逻辑不同——random 类型从配方（`WorldviewDefinition` 的池）随机组合，template 类型从成品（`WorldTemplate` 的确定值）直接组装。

`WorldProvider.generateWorld()` 方法 SHALL 接受 `worldviewId` 参数，指定从哪个世界观生成世界实例。

#### Scenario: 随机生成器从世界观配方池构造 World

- **WHEN** wanjie-core mod 注册世界观后
- **THEN** 系统 SHALL 自动创建一个 type 为 `'random'` 的 WorldProvider 实例
- **AND** 该 provider 的 `generateWorld(seed, ascensionCount, worldviewId)` SHALL 从 `WorldviewDefinition` 的名称前缀后缀池、描述池、势力池、危险机缘池中确定性选取组合
- **AND** 返回 World 实例的 name、description、factions、dangers、opportunities 均为确定性选取结果
- **AND** 返回 World 的 `worldviewId` SHALL 等于传入的 `worldviewId`

#### Scenario: 固化模板从成品数据组装 World

- **WHEN** 一个含 `WorldTemplate` 的 mod 被加载
- **THEN** 系统 SHALL 为每个模板创建一个 type 为 `'template'` 的 WorldProvider 实例
- **AND** 该 provider 的 `generateWorld()` SHALL 直接读取 `WorldTemplate.world` 中的确定值（固定名称、固定描述、固定势力列表、固定危险/机缘实例）
- **AND** 忽略 seed 参数（模板世界是确定性的）
- **AND** 仅由 identity 系统分配 world.id，ratingScore 初始为 0
- **AND** WorldTemplate SHALL 包含 `worldviewId` 字段，标明其来源世界观

#### Scenario: generateWorlds 批量生成

- **WHEN** 调用 `provider.generateWorlds([seed1, seed2, ...], 0)`
- **THEN** SHALL 返回对应数量的 World 对象数组
- **AND** 每个 World SHALL 具有唯一 ID 和独立的名称/势力/危险/机缘组合

### Requirement: WorldTemplate 数据结构定义

系统 SHALL 定义 `WorldTemplate` 接口，表示一个"成品世界"--所有字段为确定值，与 `WorldviewDefinition`（配方/池）明确区分。

#### Scenario: WorldTemplate 包含确定的世界数据

- **WHEN** 检查 `WorldTemplate` 接口定义
- **THEN** SHALL 包含 `id: string`（模板唯一 ID）
- **AND** SHALL 包含 `world` 字段，其类型为 `Omit<World, 'id' | 'ratingScore'>`（完整世界数据，不含系统分配字段）
- **AND** world.name SHALL 为确定的完整名称字符串（非前缀后缀池）
- **AND** world.factions SHALL 为确定的 `WorldFaction[]` 具体势力列表（非描述池）
- **AND** world.dangers SHALL 为确定的 `WorldDanger[]` 具体危险实例（非危险池）
- **AND** world.opportunities SHALL 为确定的 `WorldOpportunity[]` 具体机缘实例（非机缘池）

#### Scenario: WorldTemplate 包含世界观引用

- **WHEN** 检查 `WorldTemplate` 接口定义
- **THEN** SHALL 包含 `worldviewId: string`，标明该模板世界属于哪个世界观

#### Scenario: WorldTemplate 与 WorldviewDefinition 数据不混淆

- **WHEN** 一个 Mod 同时提供 `data/world/*.json`（WorldviewDefinition 配方）和 `templates/worlds/*.json`（WorldTemplate 成品）
- **THEN** WorldviewDefinition 用于随机生成 provider（type='random'），WorldTemplate 用于模板 provider（type='template'）
- **AND** 两者使用相同的 WorldDataRegistry 世界观注册，但数据结构不混淆

### Requirement: 游戏版本常量与兼容性检查

系统 SHALL 定义统一的 `GAME_VERSION` 常量（semver 格式），并提供 `checkWorldTemplateCompatibility()` 函数。

#### Scenario: GAME_VERSION 常量存在

- **WHEN** 代码需要引用当前游戏版本号
- **THEN** SHALL import `GAME_VERSION` 从 `@/shared/config/version`

#### Scenario: 主版本号不同判定为不兼容

- **WHEN** 模板的 `gameVersion` 为 `"2.0.0"`，当前 `GAME_VERSION` 为 `"1.5.0"`
- **THEN** `checkWorldTemplateCompatibility("2.0.0")` SHALL 返回 `"incompatible"`

### Requirement: WorldProviderRegistry 单例注册中心

系统 SHALL 提供 `WorldProviderRegistry` 单例类，管理所有已注册的 WorldProvider。

#### Scenario: 注册和获取 provider

- **WHEN** 调用 `WorldProviderRegistry.getInstance().register(provider)`
- **THEN** 后续调用 `get(provider.id)` SHALL 返回该 provider

#### Scenario: 重复注册检测

- **WHEN** 尝试注册一个 `id` 已存在的 provider
- **THEN** 系统 SHALL 抛出 `Error` 明确说明 provider ID 冲突

#### Scenario: 按类型过滤 provider

- **WHEN** 调用 `getByType('template')`
- **THEN** SHALL 返回所有 type 为 `'template'` 的 provider 数组

### Requirement: Mod 加载完成后自动注册 provider

`ModLoader.loadAll()` 完成后，系统 SHALL 自动调用 `registerWorldProviders()` 从 `WorldDataRegistry.worldviews` 和 mod 模板数据创建并注册 WorldProvider。provider 的元数据 SHALL 包含可用的世界观 ID 列表。

#### Scenario: 随机世界 provider 元数据包含世界观列表

- **WHEN** `WorldDataRegistry` 中注册了 N 个世界观
- **THEN** 系统 SHALL 创建一个 type 为 `'random'` 的 provider
- **AND** 该 provider 的 `getMetadata()` SHALL 返回包含世界观 ID 列表

#### Scenario: 模板世界 provider 自动注册

- **WHEN** mod 的 `templates/worlds/` 目录包含 K 个世界模板 JSON 文件
- **THEN** 系统 SHALL 为模板创建 type 为 `'template'` 的 provider

### Requirement: 游戏代码仅通过注册中心获取世界

所有需要世界列表的代码 SHALL 通过 WorldProviderRegistry 获取世界，SHALL NOT 直接调用 `generateWorlds()` 或读取 `AVAILABLE_WORLDS`。

#### Scenario: 世界选择页从注册中心获取世界

- **WHEN** WorldSelect 需要展示世界列表
- **THEN** SHALL 调用 `WorldProviderRegistry` 获取所有 provider
- **AND** SHALL 通过 provider 的 `generateWorlds()` 方法生成世界实例
