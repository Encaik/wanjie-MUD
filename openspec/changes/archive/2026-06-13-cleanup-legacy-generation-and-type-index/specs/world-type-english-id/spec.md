## REMOVED Requirements

### Requirement: Legacy lookup by Chinese ID still works

**Reason**: 过渡期结束。所有代码索引 MUST 使用英文 `worldviewId`（如 `"cultivation"`），不再支持以中文名（如 `"修仙"`）作为查找 key。`WorldViewRegistry` 的 `get()` 方法依然接受任意字符串（已注册 ID 即可），但调用方 MUST 确保传入的是英文 ID。

**Migration**: 所有 `WORLD_COEFFICIENTS[worldType]`、`getWorldData(worldType)`、`getWorldBaseCoefficient(worldType)` 等调用中，`worldType` 参数值从中文改为英文 worldviewId。删除 `WORLD_COEFFICIENTS` 硬编码常量，改为从 `WorldViewRegistry` 读取。

### Requirement: WorldDataRegistry SHALL support lookup by type

**Reason**: `WorldDataRegistry` 已被 `WorldViewRegistry` 取代。所有的世界数据查找通过 `WorldViewRegistry.getInstance().get(worldviewId)` 完成。`getWorldData()` 函数参数改为 `worldviewId`。

**Migration**: `getWorldData(worldviewId: string)` 直接代理到 `WorldViewRegistry`，所有调用方传参改为英文 ID。

## MODIFIED Requirements

### Requirement: Code SHALL migrate from Chinese to English type indexing

src/ 中所有使用中文世界类型字符串做键名、switch 分支、条件判断的代码 MUST 改用英文 `worldviewId`。不存在过渡期——所有代码 MUST 一次性迁移完成。

#### Scenario: All lookups use worldviewId
- **WHEN** 任何代码需要索引世界类型
- **THEN** 使用 `worldviewId`（如 `"cultivation"`）而非中文名（如 `"修仙"`）
- **AND** 中文名通过 `world.type` 字段仅用于 UI 显示

#### Scenario: No Chinese-keyed constants remain
- **WHEN** 检查所有 `Record<WorldType, T>` 类型常量
- **THEN** 其 key 值 MUST 使用英文 worldviewId
- **AND** 无任何以中文名作为 key 的运行时数据结构

#### Scenario: Registry fallback removed
- **WHEN** `WorldViewRegistry` 未加载指定 worldviewId 的数据
- **THEN** `getWorldData()` MUST 抛出明确异常
- **AND** 不返回任何硬编码 fallback 数据
