# world-provider-registry

## Purpose

定义统一的世界提供者注入接口和注册中心，让 mod 随机生成器和固化模板加载器以同一套契约提供世界数据，游戏代码只依赖抽象接口而不依赖具体来源。

## Requirements

### Requirement: WorldProvider 接口定义

系统 SHALL 定义 `WorldProvider` 抽象接口，所有世界来源（随机生成器、固化模板）SHALL 实现此接口。接口 SHALL 包含世界生成和元数据查询方法。两种 provider 类型产出相同形状的 `World` 实例，但内部构造逻辑不同--random 类型从配方（WorldTypeData 的池）随机组合，template 类型从成品（WorldTemplate 的确定值）直接组装。

#### Scenario: 随机生成器从配方池构造 World
- **WHEN** wanjie-core mod 注册世界类型后
- **THEN** 系统 SHALL 自动创建一个 type 为 `'random'` 的 WorldProvider 实例
- **AND** 该 provider 的 `generateWorld(seed, ascensionCount)` SHALL 从 `WorldTypeData` 的名称前缀后缀池、描述池、势力池、危险机缘池中随机选取组合
- **AND** 返回 World 实例的 name、description、factions、dangers、opportunities 均为随机选取结果

#### Scenario: 固化模板从成品数据组装 World
- **WHEN** 一个含 `WorldTemplate` 的 mod 被加载
- **THEN** 系统 SHALL 为每个模板创建一个 type 为 `'template'` 的 WorldProvider 实例
- **AND** 该 provider 的 `generateWorld()` SHALL 直接读取 `WorldTemplate.world` 中的确定值（固定名称、固定描述、固定势力列表、固定危险/机缘实例）
- **AND** 忽略 seed 参数（模板世界是确定性的）
- **AND** 仅由 identity 系统分配 world.id，ratingScore 初始为 0

#### Scenario: generateWorlds 批量生成
- **WHEN** 调用 `provider.generateWorlds([seed1, seed2, ...], 0)`
- **THEN** SHALL 返回对应数量的 World 对象数组
- **AND** 每个 World SHALL 具有唯一 ID 和独立的名称/势力/危险/机缘组合

### Requirement: WorldTemplate 数据结构定义

系统 SHALL 定义 `WorldTemplate` 接口，表示一个"成品世界"--所有字段为确定值，与 `WorldTypeData`（配方/池）明确区分。

#### Scenario: WorldTemplate 包含确定的世界数据
- **WHEN** 检查 `WorldTemplate` 接口定义
- **THEN** SHALL 包含 `id: string`（模板唯一 ID）
- **AND** SHALL 包含 `world` 字段，其类型为 `Omit<World, 'id' | 'ratingScore'>`（完整世界数据，不含系统分配字段）
- **AND** world.name SHALL 为确定的完整名称字符串（非前缀后缀池）
- **AND** world.factions SHALL 为确定的 `WorldFaction[]` 具体势力列表（非描述池）
- **AND** world.dangers SHALL 为确定的 `WorldDanger[]` 具体危险实例（非危险池）
- **AND** world.opportunities SHALL 为确定的 `WorldOpportunity[]` 具体机缘实例（非机缘池）

#### Scenario: WorldTemplate 包含游戏版本标记
- **WHEN** 检查 `WorldTemplate` 接口定义
- **THEN** SHALL 包含 `gameVersion: string`（必填，semver 格式），记录模板创建时的游戏版本
- **AND** 加载模板时 SHALL 检查 `gameVersion` 与当前 `GAME_VERSION` 的兼容性

#### Scenario: WorldTemplate 包含模板元数据
- **WHEN** 检查 `WorldTemplate` 接口定义
- **THEN** SHALL 可选包含 `protected: boolean`（锁定评分，不被低分淘汰）
- **AND** SHALL 可选包含 `tags: string[]`（模板标签）
- **AND** SHALL 可选包含 `author: string`（模板作者）
- **AND** SHALL 可选包含 `previewText: string`（预览文案）

### Requirement: 游戏版本常量与兼容性检查

系统 SHALL 定义统一的 `GAME_VERSION` 常量（semver 格式，与 `package.json` 同步），并提供 `checkWorldTemplateCompatibility()` 函数检查模板版本与当前游戏版本的兼容性。

#### Scenario: GAME_VERSION 常量存在
- **WHEN** 代码需要引用当前游戏版本号
- **THEN** SHALL import `GAME_VERSION` 从 `@/shared/config/version`
- **AND** 其值 SHALL 与 `package.json` 的 `version` 字段一致

#### Scenario: 主版本号不同判定为不兼容
- **WHEN** 模板的 `gameVersion` 为 `"2.0.0"`，当前 `GAME_VERSION` 为 `"1.5.0"`
- **THEN** `checkWorldTemplateCompatibility("2.0.0")` SHALL 返回 `"incompatible"`
- **AND** 世界卡片 SHALL 显示红色"版本不兼容"标签

#### Scenario: 主版本号相同次版本号不同判定为需更新
- **WHEN** 模板的 `gameVersion` 为 `"1.2.0"`，当前 `GAME_VERSION` 为 `"1.5.0"`
- **THEN** `checkWorldTemplateCompatibility("1.2.0")` SHALL 返回 `"needs-update"`
- **AND** 世界卡片 SHALL 显示黄色"可能需要更新"标签

#### Scenario: 主次版本号相同判定为兼容
- **WHEN** 模板的 `gameVersion` 为 `"1.5.0"`，当前 `GAME_VERSION` 为 `"1.5.3"`
- **THEN** `checkWorldTemplateCompatibility("1.5.0")` SHALL 返回 `"compatible"`
- **AND** 世界卡片无版本警告标签

#### Scenario: 不兼容模板仍可加载
- **WHEN** 模板与当前游戏版本不兼容
- **THEN** 系统 SHALL 仍加载该模板世界（不阻塞）
- **AND** 世界卡片 SHALL 显示版本不兼容警告
- **AND** 玩家 SHALL 可选择尝试游玩

#### Scenario: WorldTemplate 与 WorldTypeData 明确分离
- **WHEN** 一个 Mod 同时提供 `data/worlds.json`（WorldTypeData[] 配方）和 `templates/worlds/*.json`（WorldTemplate[] 成品）
- **THEN** worldTypeData 用于随机生成 provider（type='random'），模板用于模板 provider（type='template'）
- **AND** 两者使用相同的 WorldDataRegistry 世界类型注册，但数据结构不混淆

### Requirement: WorldProviderRegistry 单例注册中心

系统 SHALL 提供 `WorldProviderRegistry` 单例类，管理所有已注册的 WorldProvider。提供 `register()`、`unregister()`、`get()`、`getAll()`、`getByType()` 方法。

#### Scenario: 注册和获取 provider
- **WHEN** 调用 `WorldProviderRegistry.getInstance().register(provider)`
- **THEN** 后续调用 `get(provider.id)` SHALL 返回该 provider
- **AND** `getAll()` 返回的数组 SHALL 包含该 provider

#### Scenario: 重复注册检测
- **WHEN** 尝试注册一个 `id` 已存在的 provider
- **THEN** 系统 SHALL 抛出 `Error` 明确说明 provider ID 冲突
- **AND** 错误信息 SHALL 包含冲突的 ID 和已注册 provider 的名称

#### Scenario: 按类型过滤 provider
- **WHEN** 调用 `getByType('template')`
- **THEN** SHALL 返回所有 type 为 `'template'` 的 provider 数组
- **AND** 调用 `getByType('random')` SHALL 返回所有 type 为 `'random'` 的 provider 数组

#### Scenario: 注销 provider
- **WHEN** 调用 `unregister('some-provider-id')`
- **THEN** 该 provider SHALL 从注册中心移除
- **AND** 后续 `get('some-provider-id')` SHALL 返回 `undefined`

### Requirement: Mod 加载完成后自动注册 provider

`ModLoader.loadAll()` 完成后，系统 SHALL 自动调用 `registerWorldProviders()` 从 `WorldDataRegistry` 和 mod 模板数据创建并注册 WorldProvider。

#### Scenario: 随机世界 provider 自动注册
- **WHEN** `WorldDataRegistry` 中注册了 N 个世界类型（如 8 个核心世界 + M 个 mod 世界）
- **THEN** 系统 SHALL 创建一个 type 为 `'random'` 的 provider（id 为 mod 的 id）
- **AND** 该 provider 的 `generateWorld()` SHALL 可从所有已注册世界类型中随机选择

#### Scenario: 模板世界 provider 自动注册
- **WHEN** mod 的 `templates/worlds/` 目录包含 K 个世界模板 JSON 文件
- **THEN** 系统 SHALL 为每 K 个模板创建一个 type 为 `'template'` 的 provider
- **AND** 每个 provider 的 `generateWorld()` SHALL 返回对应模板的固定世界数据

### Requirement: 游戏代码仅通过注册中心获取世界

所有需要世界列表的代码（WorldSelect、飞升世界展示等）SHALL 通过 WorldProviderRegistry 获取世界，SHALL NOT 直接调用 `generateWorlds()` 或读取 `AVAILABLE_WORLDS`。

#### Scenario: 世界选择页从注册中心获取世界
- **WHEN** WorldSelect 需要展示世界列表
- **THEN** SHALL 调用 `WorldProviderRegistry` 获取所有 provider
- **AND** SHALL 通过 provider 的 `generateWorlds()` 方法生成世界实例
- **AND** SHALL NOT 直接 import `src/modules/identity/logic/generators.ts`

#### Scenario: 飞升流程从注册中心获取新世界
- **WHEN** 飞升系统需要生成新世界供玩家选择
- **THEN** SHALL 从 WorldProviderRegistry 获取 `'random'` 类型的 provider 生成新世界
- **AND** SHALL NOT 硬编码世界类型列表
