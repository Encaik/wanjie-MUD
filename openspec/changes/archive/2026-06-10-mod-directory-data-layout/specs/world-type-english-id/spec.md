# World Type English ID

## Purpose

引入世界类型三标识体系：`id`（数字编号）、`type`（英文，代码索引用）、`name`（中文，UI 显示用）。代码中逐步从中文字符串索引迁移到英文 `type`。

## ADDED Requirements

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

### Requirement: WorldDataRegistry SHALL support lookup by type

`WorldDataRegistry` SHALL 新增 `getWorldTypeByEnglishType(type: string)` 方法，根据英文 `type` 查找世界类型数据。原有的 `getWorldType(id: string)` SHALL 继续支持中文 ID 查找（过渡期兼容）。

#### Scenario: Lookup by English type
- **WHEN** 调用 `registry.getWorldTypeByEnglishType("cultivation")`
- **THEN** 返回修仙世界的 `WorldTypeData`

#### Scenario: Legacy lookup by Chinese ID still works
- **WHEN** 调用 `registry.getWorldType("修仙")`
- **THEN** 返回修仙世界的 `WorldTypeData`
- **AND** console 输出 deprecation warning

### Requirement: World files SHALL use type field as primary identity

每个世界类型 JSON 文件的根对象 SHALL 以 `type` 字段为主要代码标识。`id` 为数字编号，`type` 为英文标识，`name` 为中文名。

#### Scenario: World JSON file structure
- **WHEN** 读取 `data/world/cultivation.json`
- **THEN** 文件根对象包含 `"id": 1`
- **AND** 文件根对象包含 `"type": "cultivation"`
- **AND** 文件根对象包含 `"name": "修仙世界"`

### Requirement: Code SHALL migrate from Chinese to English type indexing

`src/` 中所有使用中文世界类型字符串做键名、switch 分支、条件判断的代码 SHALL 逐步迁移到英文 `type`。新增代码 MUST 使用英文 `type`。

#### Scenario: New code uses English type
- **WHEN** 新增涉及世界类型的代码
- **THEN** 使用英文 `type` 值（如 `"cultivation"`）而非中文名（如 `"修仙"`）
- **AND** 中文名仅用于 UI 显示（通过 `WorldTypeData.name` 获取）

#### Scenario: Existing Chinese references are deprecated
- **WHEN** 现有代码中存在 `worldType === "修仙"` 的硬编码判断
- **THEN** 该处标注 `@deprecated` 注释
- **AND** 过渡期内通过 `WorldTypeData` 的中文 ID 查找保持功能正常
