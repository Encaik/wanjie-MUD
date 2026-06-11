# world-data-consolidation

世界数据整合为单一数据源，以 `WorldViewRegistry.worldviews` 为所有世界观数据的唯一配置来源。

## Requirements

### Requirement: WorldviewDefinition 为世界配置唯一数据源

`WorldViewRegistry.worldviews`（存储 `WorldviewDefinition` 实例的 Map）在 `src/core/registry/WorldViewRegistry.ts` 中 SHALL 作为所有世界观数据的唯一定义来源。任何其他文件 SHALL NOT 重复定义世界名称前缀、后缀、描述、系数、世界观文本或特性池。所有消费代码 SHALL 通过 `WorldViewRegistry.getWorldview(worldviewId)` 获取数据。

#### Scenario: 新增世界观只需 Mod JSON 一处

- **WHEN** 需要新增或修改世界观配置
- **THEN** 只需在 Mod JSON 文件中定义（`mods/<mod-name>/data/world/<worldviewId>.json`）
- **AND** `WorldViewRegistry` 在初始化时自动加载所有 Mod JSON 中的世界观
- **AND** 无需修改任何 TypeScript 源代码

#### Scenario: 世界观文本统一到 registry

- **WHEN** 需要世界观的术语或 UI 文本
- **THEN** SHALL 通过 `WorldViewRegistry.getWorldview(worldviewId).texts` 获取
- **AND** `modules/narrative/data/worlds/` 中的静态 TS 文件 SHALL 标记为 deprecated
- **AND** `modules/narrative/logic/WorldTextManager` SHALL 从 registry 读取 `texts` 字段

#### Scenario: 修仙与仙侠世界观数据独立

- **WHEN** 比较 `registry.getWorldview('cultivation')` 和 `registry.getWorldview('xianxia')`
- **THEN** `namePrefixes` SHALL NOT 共享任何相同值
- **AND** `descriptions` SHALL 反映不同的世界观（修仙：长生修仙，仙侠：剑道修行）
- **AND** `dangers` 和 `opportunities` 的 `description` 文本 SHALL 各自独立
- **AND** `texts.terminology` SHALL 各自独立（如修仙用"灵石"，仙侠用"剑晶"）

#### Scenario: 缺失数据时抛出错误

- **WHEN** 一个世界类型的注册数据缺少必要字段
- **THEN** 系统 SHALL 抛出明确错误
- **AND** SHALL NOT 静默使用默认值

### Requirement: WorldStats 数值完全来自注册数据

`WorldStats` 接口 SHALL 从 `WorldviewDefinition.stats` 获取全部数值配置（`baseHp`、`hpPerLevel`、`baseAttack` 等），SHALL NOT 在消费代码中硬编码任何数值。

#### Scenario: WorldStats 数值完全来自注册数据

- **WHEN** 读取 `getWorldData('cultivation')` 返回的 `WorldStats`
- **THEN** `baseHp`、`hpPerLevel` 等数值字段 SHALL 等于注册数据中 `stats` 对象的对应字段
- **AND** SHALL NOT 存在从消费代码内联的数值常量

#### Scenario: 缺失任何数值字段时报错

- **WHEN** 一个世界类型的注册数据缺少 `stats` 或其子字段
- **THEN** `getWorldData()` SHALL 抛出错误，明确指出缺失字段和世界类型 ID
- **AND** SHALL NOT 静默使用任何默认值

### Requirement: 仙侠世界独立姓名池

仙侠世界 SHALL 使用独立的 `XIANXIA_NAMES` 姓名池，SHALL NOT 与修仙世界共用 `CULTIVATION_NAMES`。

#### Scenario: 姓名池映射独立

- **WHEN** 检查 `WORLD_NAME_POOLS`
- **THEN** `WORLD_NAME_POOLS['修仙']` SHALL 引用 `CULTIVATION_NAMES`
- **AND** `WORLD_NAME_POOLS['仙侠']` SHALL 引用 `XIANXIA_NAMES`
- **AND** 两个对象 SHALL NOT 引用同一内存地址

### Requirement: 世界观文本强类型化

`WorldViewRegistry` 中的世界观文本存储 SHALL 使用完整的 `WorldTextDefinition` 类型，SHALL NOT 使用 `Record<string, unknown>`。所有世界观文本的读取 SHALL 具有编译时类型检查。

#### Scenario: worldTexts 类型为 WorldTextDefinition

- **WHEN** 从 registry 获取世界观的文本数据
- **THEN** 返回类型 SHALL 为 `WorldTextDefinition`
- **AND** SHALL NOT 需要 `as` 类型断言
- **AND** IDE 自动补全 SHALL 列出 `terminology`、`stats`、`combat`、`cultivation` 等子字段

#### Scenario: 文本缺失时报错

- **WHEN** 一个世界观的 `texts` 字段为 `undefined` 或缺少子字段
- **THEN** `registry.getWorldview(id)` SHALL 在初始化验证阶段抛出错误
- **AND** SHALL NOT 使用修仙世界观的文本作为默认兜底

### Requirement: 无硬编码兜底数据

所有世界相关数据 SHALL 仅从 `WorldViewRegistry` 读取。当 registry 中无请求的数据时，系统 SHALL 抛出明确错误，SHALL NOT 回退到硬编码的兜底数据。

#### Scenario: 危险/机遇数据缺失时报错

- **WHEN** 世界观注册数据中没有 `dangers` 或 `opportunities`
- **THEN** 世界生成时 SHALL 抛出错误
- **AND** SHALL NOT 使用 `WORLD_DANGERS` 或 `WORLD_OPPORTUNITIES` 硬编码兜底数组
