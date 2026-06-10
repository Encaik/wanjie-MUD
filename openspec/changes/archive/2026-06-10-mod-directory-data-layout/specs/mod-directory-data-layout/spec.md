# Mod Directory Data Layout

## Purpose

扩展 `ModManifest.dataFiles` 支持文件路径数组，Mod 作者可将一个内容类型的数据拆分为多个独立 JSON 文件，通过 `mod.json` 显式列出。加载器遍历数组逐文件 fetch 并注册。

## ADDED Requirements

### Requirement: dataFiles SHALL support array of file paths

`ModManifest.dataFiles` 的值类型 SHALL 从 `Record<string, string>` 变更为 `Record<string, string | string[]>`。值为字符串时保持原有单文件加载行为（向后兼容）。值为数组时，每个元素是一个相对于 Mod 目录的数据文件路径。

#### Scenario: Single string value loads one file
- **WHEN** `dataFiles.world` 的值为 `"data/worlds.json"`
- **THEN** ModLoader fetch 该单个文件并解析 JSON
- **AND** 加载行为与旧版本完全一致

#### Scenario: Array value loads multiple files
- **WHEN** `dataFiles.world` 的值为 `["data/world/cultivation.json", "data/world/martial.json"]`
- **THEN** ModLoader 依次 fetch 数组中的每个文件
- **AND** 每个文件的 JSON 内容被独立注册

### Requirement: Each file in array SHALL contain one data entry

数组模式下，每个 JSON 文件 SHALL 直接包含一个完整条目的数据对象，无需容器包装（如 `{ "worlds": [...] }`）。文件名自描述其内容（如 `cultivation.json` 包含一个世界类型的所有字段）。

#### Scenario: World type file
- **WHEN** 加载 `data/world/cultivation.json`
- **THEN** 文件内容是一个包含 `id`、`type`、`name`、`description`、`baseCoefficient`、`stats` 等字段的对象
- **AND** 该对象被直接注册到 `WorldDataRegistry.registerWorldType()`

#### Scenario: Danger effect file
- **WHEN** 加载 `data/dangers/demon_invasion.json`
- **THEN** 文件内容是一个 `DangerData` 对象
- **AND** 该对象被直接注册到 `WorldDataRegistry.registerDanger()`

### Requirement: Array order SHALL determine load order

数组中的文件 SHALL 按数组元素顺序依次加载和注册。后加载的文件如与已注册条目有冲突，须遵循 `WorldDataRegistry` 的覆盖策略（后者覆盖前者并记录警告）。

#### Scenario: Load order follows array order
- **WHEN** `dataFiles.world` 为 `["b.json", "a.json"]`
- **THEN** `b.json` 在 `a.json` 之前被 fetch 和注册
- **AND** 加载顺序不受文件名字母序影响

### Requirement: One array item failure SHALL NOT block others

数组中单个文件的加载失败（fetch 失败、JSON 解析错误等）SHALL NOT 阻止其他文件的加载和注册。失败文件的信息 SHALL 通过 console.warn 记录。

#### Scenario: Middle file parse error
- **WHEN** 数组中有 3 个文件，第 2 个文件 JSON 格式无效
- **THEN** 第 1 和第 3 个文件正常加载注册
- **AND** 第 2 个文件的错误被记录到 console.warn
- **AND** Mod 加载状态不受影响

### Requirement: validateManifest SHALL accept array dataFiles values

`validateManifest` 函数 SHALL 接受 `dataFiles` 中每个键的值为 `string` 或 `string[]`。数组中的每个元素 SHALL 是非空字符串。数组本身 SHALL NOT 为空。

#### Scenario: Array with valid strings passes validation
- **WHEN** `dataFiles.world` 为 `["data/world/a.json", "data/world/b.json"]`
- **THEN** 校验通过

#### Scenario: Empty array fails validation
- **WHEN** `dataFiles.world` 为 `[]`
- **THEN** 校验失败，报告 `dataFiles.world` 数组不能为空

#### Scenario: Array with non-string element fails validation
- **WHEN** `dataFiles.world` 为 `["a.json", 123]`
- **THEN** 校验失败，报告数组中每个元素必须为字符串

### Requirement: Built-in Mod SHALL use directory layout

`wanjie-core` Mod 的数据文件 SHALL 按内容类型建立子目录，每个条目一个 JSON 文件。世界类型文件以英文 `type` 命名。

#### Scenario: World data directory structure
- **WHEN** 查看 `public/mods/wanjie-core/data/world/`
- **THEN** 目录下存在 `cultivation.json`、`martial.json`、`tech.json`、`magic.json`、`psi.json`、`xianxia.json`、`wuxia.json`、`apocalypse.json`
- **AND** 每个文件包含一个世界类型的完整数据

#### Scenario: Dangers data directory structure
- **WHEN** 查看 `public/mods/wanjie-core/data/dangers/`
- **THEN** 目录下每个 `.json` 文件包含一个危险效果条目
