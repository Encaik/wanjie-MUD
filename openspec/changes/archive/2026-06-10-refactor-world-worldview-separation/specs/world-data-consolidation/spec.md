# world-data-consolidation (Delta)

对 `openspec/specs/world-data-consolidation/spec.md` 的增量修改 — 世界观数据从分散的 `WORLD_DATA` + narrative 文本 + registry 三套系统整合为以 `WorldDataRegistry.worldviews` 为单一数据源。

## MODIFIED Requirements

### Requirement: WorldviewDefinition 为世界配置唯一数据源

`WorldDataRegistry.worldviews`（存储 `WorldviewDefinition` 实例的 Map）在 `src/core/registry/WorldDataRegistry.ts` 中 SHALL 作为所有世界观数据的唯一定义来源。任何其他文件 SHALL NOT 重复定义世界名称前缀、后缀、描述、系数、世界观文本或特性池。所有消费代码 SHALL 通过 `WorldDataRegistry.getWorldview(worldviewId)` 获取数据。

#### Scenario: 新增世界观只需 Mod JSON 一处

- **WHEN** 需要新增或修改世界观配置
- **THEN** 只需在 Mod JSON 文件中定义（`mods/<mod-name>/data/world/<worldviewId>.json`）
- **AND** `WorldDataRegistry` 在初始化时自动加载所有 Mod JSON 中的世界观
- **AND** 无需修改任何 TypeScript 源代码

#### Scenario: 世界观文本统一到 registry

- **WHEN** 需要世界观的术语或 UI 文本
- **THEN** SHALL 通过 `WorldDataRegistry.getWorldview(worldviewId).texts` 获取
- **AND** `modules/narrative/data/worlds/` 中的静态 TS 文件 SHALL 标记为 deprecated
- **AND** `modules/narrative/logic/WorldTextManager` SHALL 从 registry 读取 `texts` 字段
- **AND** SHALL NOT 存在 `modules/narrative/data/terminology.ts` 的独立 `WORLD_TERMINOLOGY` 映射

#### Scenario: 修仙与仙侠世界观数据独立

- **WHEN** 比较 `registry.getWorldview('cultivation')` 和 `registry.getWorldview('xianxia')`
- **THEN** `namePrefixes` SHALL NOT 共享任何相同值
- **AND** `descriptions` SHALL 反映不同的世界观（修仙：长生修仙，仙侠：剑道修行）
- **AND** `dangers` 和 `opportunities` 的 `description` 文本 SHALL 各自独立
- **AND** `texts.terminology` SHALL 各自独立（如修仙用"灵石"，仙侠用"剑晶"）

## REMOVED Requirements

### Requirement: WORLD_DATA 为世界配置唯一数据源

**Reason**: `WORLD_DATA: Record<WorldType, WorldStats>` 已被 `WorldDataRegistry.worldviews: Map<string, WorldviewDefinition>` 替代。旧的 `WORLD_DATA` 常量仅包含 `WorldStats` 子集，不包含世界观文本、机制配置等完整数据。

**Migration**: 所有引用 `WORLD_DATA[worldType]` 的代码改为 `WorldDataRegistry.getInstance().getWorldview(worldviewId)`。`getWorldData()` 函数改为从 registry 读取，并在数据缺失时抛出错误。

### Requirement: WORLD_COEFFICIENTS 全局唯一

**Reason**: 系数数据已整合到 `WorldviewDefinition.baseCoefficient` 和 `WorldviewDefinition.rewardCoefficient` 中，不需要独立的 `WORLD_COEFFICIENTS` 常量。

**Migration**: 通过 `registry.getWorldview(worldviewId).baseCoefficient` 获取基础系数，通过 `registry.getWorldview(worldviewId).rewardCoefficient` 获取奖励系数。

### Requirement: WorldStats 结构包含 statDisplayNames 及完整数值

**Reason**: `WorldStats` 接口不变，但 `statDisplayNames` 现在通过 `WorldviewDefinition.texts.stats` 获取，替代 `WorldStats.statDisplayNames` 字段。世界观文本统一走 `texts` 路径。

**Migration**: `getWorldData(type).statDisplayNames` → `registry.getWorldview(id).texts.stats`

## ADDED Requirements

### Requirement: 世界观文本强类型化

`WorldDataRegistry.worldTexts`（或等价的世界观文本存储）SHALL 使用完整的 `WorldTextDefinition` 类型，SHALL NOT 使用 `Record<string, unknown>`。所有世界观文本的读取 SHALL 具有编译时类型检查。

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

所有世界相关数据 SHALL 仅从 `WorldDataRegistry` 读取。当 registry 中无请求的数据时，系统 SHALL 抛出明确错误，SHALL NOT 回退到硬编码的兜底数据。

#### Scenario: 特性池缺失时报错

- **WHEN** `WorldDataRegistry` 中不存在某世界观的 trait 数据
- **THEN** `registry.getWorldview(id).traits` SHALL 为 `undefined`（由调用方处理）
- **AND** 调用方 SHALL 抛出明确错误，SHALL NOT 使用 `ORIGIN_TRAITS`、`TECH_*`、`MAGIC_*` 等硬编码兜底

#### Scenario: 危险/机遇数据缺失时报错

- **WHEN** 世界观注册数据中没有 `dangers` 或 `opportunities`
- **THEN** 世界生成时 SHALL 抛出错误
- **AND** SHALL NOT 使用 `WORLD_DANGERS` 或 `WORLD_OPPORTUNITIES` 硬编码兜底数组
