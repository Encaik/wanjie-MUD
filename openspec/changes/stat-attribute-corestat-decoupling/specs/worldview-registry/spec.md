# worldview-registry (Delta)

## MODIFIED Requirements

### Requirement: WorldViewRegistry 仅管理 WorldviewDefinition

`WorldViewRegistry` SHALL 只管理 `WorldviewDefinition` 对象。Mod JSON 加载后的完整世界观数据 SHALL 直接以 `WorldviewDefinition` 形式注册，不再拆分为零散的 pools。

`WorldviewDefinition` SHALL 新增以下字段以支持属性系统和种族/天赋 Mod 化：

- `attributes: AttributeDefinition[]` — 该世界观的属性定义列表（必填）
- `coreStatFormulas: CoreStatBaseValues` — 核心值的基础值定义（必填）
- `racePool: string[]` — 该世界观可用的种族 ID 列表（必填，至少 `["human"]`）
- `talentPool: string[]` — 该世界观可用的天赋 ID 列表（可选）
- `specialResource: SpecialResourceDef` — 专项数值定义（可选，无特殊资源的世界观可省略）

原有 `stats: WorldStatsData` 字段 SHALL 保留但标记 deprecated，与 `attributeDefinitions` + `coreStatFormulas` 并存过渡。过渡期后 SHALL 移除 `stats`。

#### Scenario: 注册数据已是 WorldviewDefinition

- **WHEN** Mod 加载器解析完一个世界观 JSON（如 `cultivation.json`）
- **THEN** 结果 SHALL 为完整的 `WorldviewDefinition` 对象
- **AND** 直接调用 `WorldViewRegistry.register(worldview)` 注册
- **AND** SHALL 包含 `attributes`、`coreStatFormulas`、`racePool` 字段
- **AND** 不再需要分步注册 dangers、opportunities、factions 等子字段

#### Scenario: 缺少必填新字段时校验失败

- **WHEN** 注册的 `WorldviewDefinition` 缺少 `attributes` 字段或为空数组
- **THEN** `validateWorldTypes()` SHALL 返回错误信息
- **AND** 世界观 SHALL NOT 被注册

#### Scenario: attributes 字段合法性校验

- **WHEN** `attributes` 中某个属性的 `calculations` 引用了不存在的 `CoreStatKey`
- **THEN** 校验 SHALL 返回警告但允许注册（容错：未知维度在计算时忽略）
