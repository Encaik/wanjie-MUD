# mod-data-bundling

## Purpose

优化 Mod 系统启动加载性能：在构建阶段将 Mod 的分散 JSON 数据文件合并为单个 `data.json`，运行时通过单次 HTTP 请求加载全部数据，并支持 Mod 间并发加载，避免大量小文件串行 fetch 导致的请求排队阻塞。

## Requirements

### Requirement: 构建时合并 Mod 数据文件

构建脚本 `scripts/build-mods.ts` SHALL 在复制 Mod 目录到 `public/mods/` 后，为每个 Mod 生成一个合并数据文件 `data.json`。

合并文件的内容 SHALL 以 `ModContentType` 为 key，对应值为合并后的数据。对于 `world` 类型（每个文件是自包含的世界数据对象），合并值 SHALL 为以世界类型（`type` 字段）为 key 的对象映射。

#### Scenario: 合并多个世界数据文件

- **WHEN** 构建脚本处理 `wanjie-core` Mod，其 `dataFiles.world` 声明了 8 个世界 JSON 文件
- **THEN** 构建脚本 SHALL 读取所有 8 个文件
- **AND** 生成 `public/mods/wanjie-core/data.json`，包含 `{ "world": { "cultivation": {...}, "martial": {...}, ... } }`

#### Scenario: 跳过不存在的文件

- **WHEN** `dataFiles` 中声明的文件路径在 Mod 源目录中不存在
- **THEN** 构建脚本 SHALL 输出警告并跳过该文件，不阻塞其他文件的合并

#### Scenario: 单个数据文件的 Mod

- **WHEN** Mod 的某个 content type 只声明了单个数据文件路径（字符串而非数组）
- **THEN** 构建脚本 SHALL 将该文件内容直接作为该 content type 的合并值

### Requirement: 运行时优先加载合并数据文件

`ModLoader.loadModDataAndRegister()` SHALL 优先尝试加载合并数据文件 `data.json`（单次 HTTP 请求）。当 `data.json` 不存在（HTTP 404）时 SHALL 回退到按 `dataFiles` 逐文件加载的原有逻辑。

#### Scenario: 生产环境加载合并文件

- **WHEN** `ModLoader` 加载 Mod 数据，且 `{basePath}/{modId}/data.json` 存在
- **THEN** 加载器 SHALL 通过单次 `fetch` 获取 `data.json`
- **AND** 遍历合并数据中的每个 content type，调用 `registerData()` 注册
- **AND** 不再发起对 `dataFiles` 中声明的独立文件的请求

#### Scenario: 开发环境回退到逐文件加载

- **WHEN** `ModLoader` 加载 Mod 数据，且 `{basePath}/{modId}/data.json` 返回 404
- **THEN** 加载器 SHALL 回退到按 `dataFiles` 逐文件串行加载的原有逻辑
- **AND** 输出 info 级别日志提示回退

#### Scenario: 合并文件加载失败

- **WHEN** `data.json` 请求返回非 404 的错误状态（如 500）
- **THEN** 加载器 SHALL 回退到按 `dataFiles` 逐文件加载

### Requirement: 并发加载各 Mod 的数据

`ModLoader.loadAll()` 中，在完成清单加载和依赖排序后，各 Mod 的数据加载 SHALL 使用 `Promise.all` 并发执行，而非逐个串行。

#### Scenario: 多 Mod 数据并发加载

- **WHEN** 有 3 个 Mod 需要加载数据
- **THEN** 3 个 Mod 的数据请求 SHALL 同时发起
- **AND** 所有 Mod 数据加载完成后 SHALL 才进入后续步骤（注册内置机制等）

#### Scenario: 单个 Mod 数据加载失败不阻塞其他

- **WHEN** 并发加载中某个 Mod 的数据加载失败
- **THEN** 其他 Mod 的加载 SHALL 不受影响继续完成
- **AND** 失败的 Mod SHALL 被标记为 `status: 'error'`
