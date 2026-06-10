## Why

Mod 系统引入后，游戏启动时需要加载大量小 JSON 文件。虽然单个文件很小（~10KB），但 `ModLoader` 采用逐文件串行 `await fetch()`，导致 10+ 个小请求排队等待。浏览器对同一域名的并发连接限制（HTTP/1.1 下通常 6 个）使得串行加载的等待时间被放大，加载感知速度远低于之前直接打包在 JS bundle 中的方案。需要将分散的小文件在构建时合并，减少运行时请求数，同时利用并发加载提升启动速度。

## What Changes

- **构建时合并数据文件**：`scripts/build-mods.ts` 在构建阶段将每个 Mod 的所有 JSON 数据文件按 content type 合并为一个 `data.json`，与 `mod.json` 同目录输出到 `public/mods/<mod-name>/`
- **运行时加载合并文件**：`ModLoader.loadModDataAndRegister()` 改为加载合并后的 `data.json`（每个 Mod 一个请求），而非逐个加载分散的数据文件
- **并发加载 Mod 清单和数据**：Mod 之间的清单加载和数据加载改为并发执行，充分利用浏览器并发连接
- **向后兼容**：`mod.json` 中仍保留 `dataFiles` 字段用于声明数据文件结构，但运行时直接读取构建产物 `data.json`；旧格式的单一文件路径数组在构建时自动合并

## Capabilities

### New Capabilities
- `mod-data-bundling`: 构建时将 Mod 分散的数据文件合并为单个 `data.json`，运行时通过单次请求加载每个 Mod 的全部数据

### Modified Capabilities
<!-- 本次变更不修改现有 spec 的需求级别行为，只优化内部实现 -->

## Impact

- **构建脚本** `scripts/build-mods.ts`：新增数据合并逻辑，将 `dataFiles` 中声明的各文件内容合并输出 `data.json`
- **运行时加载器** `src/core/mod/ModLoader.ts`：`loadModDataAndRegister()` 和 `loadTemplateWorlds()` 改为加载合并文件；`loadAll()` 中使用 `Promise.all` 并发加载各 Mod 数据
- **加载 Hook** `src/modules/mod/hooks/useModLoader.ts`：无需修改（加载状态 API 不变）
- **数据注册** `src/core/mod/ModLoader.ts` 中 `registerData()`：需适配合并后的数据结构（每个 content type 的数据从单个 JSON 变为可能包含多条目）
- **正向影响**：启动时 HTTP 请求数从 1+N+ΣKᵢ 降至 1+N+N（当前示例：10→3），感知加载时间大幅缩短
