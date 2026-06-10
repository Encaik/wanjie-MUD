# world-provider-registry (Delta)

对 `openspec/specs/world-provider-registry/spec.md` 的增量修改 — WorldProvider 从操作"世界类型数据（WorldTypeData）"改为操作"世界观定义（WorldviewDefinition）"，并明确支持按世界观 ID 生成世界。

## MODIFIED Requirements

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

### Requirement: WorldTemplate 与 WorldviewDefinition 明确分离

系统 SHALL 保持 `WorldTemplate`（成品世界）与 `WorldviewDefinition`（世界观配方）明确分离。`WorldTemplate.world` 中的世界数据 SHALL 是确定值（非池），但其结构 SHALL 与从 `WorldviewDefinition` 生成的 `World` 实例一致。

#### Scenario: WorldTemplate 包含世界观引用

- **WHEN** 检查 `WorldTemplate` 接口定义
- **THEN** SHALL 包含 `worldviewId: string`，标明该模板世界属于哪个世界观
- **AND** `WorldTemplate.world.type` SHALL 等于对应 `WorldviewDefinition.name`

#### Scenario: WorldTemplate 与 WorldviewDefinition 数据不混淆

- **WHEN** 一个 Mod 同时提供 `data/world/*.json`（WorldviewDefinition 配方）和 `templates/worlds/*.json`（WorldTemplate 成品）
- **THEN** WorldviewDefinition 用于随机生成 provider（type='random'），WorldTemplate 用于模板 provider（type='template'）
- **AND** 两者使用相同的 WorldDataRegistry 世界观注册，但数据结构不混淆
- **AND** 模板世界的 `worldviewId` SHALL 引用已注册的 `WorldviewDefinition.id`

## ADDED Requirements

### Requirement: Mod 加载完成后自动注册 provider

`ModLoader.loadAll()` 完成后，系统 SHALL 自动调用 `registerWorldProviders()` 从 `WorldDataRegistry.worldviews` 和 mod 模板数据创建并注册 WorldProvider。provider 的元数据 SHALL 包含可用的世界观 ID 列表。

#### Scenario: 随机世界 provider 元数据包含世界观列表

- **WHEN** `WorldDataRegistry` 中注册了 N 个世界观（如 8 个核心世界观 + M 个 mod 世界观）
- **THEN** 系统 SHALL 创建一个 type 为 `'random'` 的 provider
- **AND** 该 provider 的 `getMetadata()` SHALL 返回 `{ worldTypes: [...N个世界观ID], templateIds: [] }`
- **AND** `generateWorld(seed, ascensionCount, worldviewId)` 接收的 `worldviewId` SHALL 必须在此列表中

#### Scenario: 模板世界 provider 自动注册

- **WHEN** mod 的 `templates/worlds/` 目录包含 K 个世界模板 JSON 文件
- **THEN** 系统 SHALL 为每 K 个模板创建一个 type 为 `'template'` 的 provider
- **AND** 每个 provider 的 `generateWorld()` SHALL 返回对应模板的固定世界数据
- **AND** 模板世界 SHALL 包含 `worldviewId` 关联到其世界观
