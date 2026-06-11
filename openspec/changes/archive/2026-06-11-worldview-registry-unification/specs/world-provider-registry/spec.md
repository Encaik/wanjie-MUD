## MODIFIED Requirements

### Requirement: WorldProvider 接口定义

系统 SHALL 定义 `WorldProvider` 抽象接口，所有世界来源 SHALL 实现此接口。接口 SHALL 包含世界生成和元数据查询方法。WorldProvider 从 `WorldviewDefinition` 的配方池中随机组合生成 World 实例。

`WorldProvider.generateWorld()` 方法 SHALL 接受 `worldviewId` 参数，指定从哪个世界观生成世界实例。

#### Scenario: 随机生成器从世界观配方池构造 World

- **WHEN** wanjie-core mod 注册世界观后
- **THEN** 系统 SHALL 自动创建一个 WorldProvider 实例
- **AND** 该 provider 的 `generateWorld(seed, ascensionCount, worldviewId)` SHALL 从 `WorldviewDefinition` 的名称前缀后缀池、描述池、势力池、危险机缘池中确定性选取组合
- **AND** 返回 World 实例的 name、description、factions、dangers、opportunities 均为确定性选取结果
- **AND** 返回 World 的 `worldviewId` SHALL 等于传入的 `worldviewId`

#### Scenario: generateWorlds 批量生成

- **WHEN** 调用 `provider.generateWorlds([seed1, seed2, ...], 0)`
- **THEN** SHALL 返回对应数量的 World 对象数组
- **AND** 每个 World SHALL 具有唯一 ID 和独立的名称/势力/危险/机缘组合

### Requirement: WorldProviderRegistry 单例注册中心

系统 SHALL 提供 `WorldProviderRegistry` 单例类，管理所有已注册的 WorldProvider。

#### Scenario: 注册和获取 provider

- **WHEN** 调用 `WorldProviderRegistry.getInstance().register(provider)`
- **THEN** 后续调用 `get(provider.id)` SHALL 返回该 provider

#### Scenario: 重复注册检测

- **WHEN** 尝试注册一个 `id` 已存在的 provider
- **THEN** 系统 SHALL 抛出 `Error` 明确说明 provider ID 冲突

### Requirement: Mod 加载完成后自动注册 provider

`ModLoader.loadAll()` 完成后，系统 SHALL 自动调用 `registerWorldProviders()` 从 `WorldViewRegistry` 获取所有世界观，创建并注册 WorldProvider。provider 的元数据 SHALL 包含可用的世界观 ID 列表。

#### Scenario: 世界 provider 元数据包含世界观列表

- **WHEN** `WorldViewRegistry` 中注册了 N 个世界观
- **THEN** 系统 SHALL 创建一个 WorldProvider
- **AND** 该 provider 的 `getMetadata()` SHALL 返回包含世界观 ID 列表

### Requirement: 游戏代码仅通过注册中心获取世界

所有需要世界列表的代码 SHALL 通过 WorldProviderRegistry 获取世界，SHALL NOT 直接调用 `generateWorlds()` 或读取硬编码数组。

#### Scenario: 世界选择页从注册中心获取世界

- **WHEN** WorldSelect 需要展示世界列表
- **THEN** SHALL 调用 `WorldProviderRegistry` 获取所有 provider
- **AND** SHALL 通过 provider 的 `generateWorlds()` 方法生成世界实例

## REMOVED Requirements

### Requirement: WorldTemplate 数据结构定义

**Reason**: 固化世界模板（`WorldTemplate`）概念被完全移除。世界实例始终通过 `WorldProvider` 从 `WorldviewDefinition` 动态生成，不再支持预定义的固化世界。这简化了世界生成流程，消除了两种数据结构（配方 vs 成品）之间的混淆。

**Migration**: 所有世界实例现在通过 `WorldProvider.generateWorld()` 动态生成。如果需要特定的世界配置，应创建新的 `WorldviewDefinition` 而非 `WorldTemplate`。`World` 接口保持不变。

### Requirement: 游戏版本常量与兼容性检查

**Reason**: `GAME_VERSION` 常量和 `checkWorldTemplateCompatibility()` 函数仅用于 `WorldTemplate` 版本兼容性检查。移除固化模板后，这些功能不再需要。

**Migration**: 删除 `src/shared/config/version.ts` 中的相关导出（如果该文件仅用于此目的，可整文件删除）。如有其他用途，保留非模板相关部分。
