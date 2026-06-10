## Why

当前 Mod 数据文件有两个结构性问题：

1. **扁平单文件布局**：`data/worlds.json` 一个文件包含全部 8 个世界类型，增删改某个世界需要触碰巨型文件。`dataFiles` 只能指向单个文件，Mod 作者无法按条目组织文件（如 `world/修仙.json`、`world/高武.json` 各一个文件）。

2. **中文字符串做索引**：世界类型 ID 直接使用中文（`"修仙"`、`"高武"`），导致代码中到处用中文做键名、做类型守卫、做 switch 分支。英文代码与中文数据混杂，不利于索引、不利于 IDE 自动补全、不利于国际化扩展。

## What Changes

- **BREAKING**: `ModManifest.dataFiles` 从 `Record<string, string>` 变更为 `Record<string, string | string[]>`，值可以是单文件路径（向后兼容）或文件路径数组（新模式）
- **BREAKING**: `WorldTypeData` 引入三标识体系：`id`（数字编号）、`type`（英文，代码索引）、`name`（中文，显示名）
- **BREAKING**: `wanjie-core` Mod 的数据文件从单文件迁移为目录 + 数组布局：
  ```
  data/world/
  ├── cultivation.json    ← type: "cultivation", id: 1, name: "修仙世界"
  ├── martial.json        ← type: "martial", id: 2, name: "高武世界"
  ├── tech.json           ← type: "tech", id: 3, name: "科技世界"
  └── ...
  ```
- `ModLoader.loadModDataAndRegister` 支持数组模式——遍历 `dataFiles` 数组逐个 fetch 并注册
- `mod.json` 中 `dataFiles` 值改为数组时，每个文件独立加载，单个失败不影响其余
- 代码中所有使用中文世界类型字符串做索引的位置逐步迁移到英文 `type`

## Capabilities

### New Capabilities
- `mod-directory-data-layout`: Mod 数据文件支持目录 + 数组布局，`dataFiles` 值可以是文件路径数组，加载器遍历数组逐文件 fetch 并注册
- `world-type-english-id`: 世界类型引入 `id`（数字）/ `type`（英文）/ `name`（中文）三标识体系，代码使用 `type` 做索引，移除中文硬编码

### Modified Capabilities
- `mod-styles`: `dataFiles` 字段 schema 变更——值类型从 `string` 扩展为 `string | string[]`，校验规则需同步更新
- `world-data-consolidation`: 世界类型标识体系从单一中文 ID 变更为三字段标识，`WORLD_DATA` 的键从中文改为英文 `type`

## Impact

- `src/core/mod/ModManifest.ts` — `dataFiles` 类型、`validateManifest` 校验
- `src/core/mod/ModLoader.ts` — `loadModDataAndRegister` 支持数组遍历
- `src/core/registry/WorldDataRegistry.ts` — `WorldTypeData` 三标识字段
- `src/core/types/types.ts` — `WorldType` 类型从中文转向英文
- `public/mods/wanjie-core/mod.json` — `dataFiles` 改为数组格式
- `public/mods/wanjie-core/data/` — 数据文件按目录拆分，一个条目一个 JSON
- `src/modules/identity/` — 世界相关数据迁移到新标识
- `src/` 中所有引用中文世界类型字符串的文件 — 迁移到英文 type
