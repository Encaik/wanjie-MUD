# World Type English ID

## Purpose

引入世界类型三标识体系：`id`（数字编号）、`type`（英文，代码索引用）、`name`（中文，UI 显示用）。代码中逐步从中文字符串索引迁移到英文 `type`。

## Requirements

### Requirement: WorldTypeData SHALL have id, type, and name fields

`WorldTypeData` 接口 SHALL 包含三个标识字段：
- `id: number` — 唯一数字编号
- `type: string` — 英文标识符（kebab-case），用于代码索引和文件命名
- `name: string` — 中文显示名，用于 UI

旧的单一 `id: string`（中文）字段 SHALL 迁移为 `name` 字段。

#### Scenario: Cultivation world has three identifiers
- **WHEN** 加载修仙世界的数据
- **THEN** `id` 为 `1`，`type` 为 `"cultivation"`，`name` 为 `"修仙世界"`

#### Scenario: All eight built-in worlds have unique type values
- **WHEN** 遍历 8 个内置世界类型
- **THEN** 每个世界的 `type` 值唯一，均为英文 kebab-case：`cultivation`、`martial`、`tech`、`magic`、`psi`、`xianxia`、`wuxia`、`apocalypse`

### Requirement: World type JSON files SHALL be named by type

数据目录下的世界类型 JSON 文件 SHALL 以英文 `type` 值命名（如 `cultivation.json`）。`dataFiles.world` 数组 SHALL 使用英文文件名。

#### Scenario: File naming convention
- **WHEN** Mod 提供修仙世界数据
- **THEN** 文件路径为 `data/world/cultivation.json`
- **AND** 文件内 `"type"` 字段值为 `"cultivation"`

### Requirement: World files SHALL use type field as primary identity

每个世界类型 JSON 文件的根对象 SHALL 以 `type` 字段为主要代码标识。`id` 为数字编号，`type` 为英文标识，`name` 为中文名。

#### Scenario: World JSON file structure
- **WHEN** 读取 `data/world/cultivation.json`
- **THEN** 文件根对象包含 `"id": 1`
- **AND** 文件根对象包含 `"type": "cultivation"`
- **AND** 文件根对象包含 `"name": "修仙世界"`

### Requirement: Code MUST use worldviewId for all indexing

`src/` 中所有使用中文世界类型字符串做键名、switch 分支、条件判断的代码 MUST 改用英文 `worldviewId`。不存在过渡期——所有代码 MUST 一次性迁移完成。

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
