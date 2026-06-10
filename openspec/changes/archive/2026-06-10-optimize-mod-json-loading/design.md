## Context

当前 Mod 系统在运行时通过 `ModLoader` 逐文件串行加载 JSON 数据。`wanjie-core` Mod 的 `mod.json` 声明了 8 个世界数据文件（`data/world/cultivation.json` 等），每个约 10KB。`loadModDataAndRegister()` 使用 `for...of` 循环 + `await fetch()` 逐个加载，导致 8 个请求串行排队。加上 `mod-list.json` 和 `mod.json`，共 10 次串行 fetch。

浏览器对同一域名的并发连接限制（HTTP/1.1 通常 6 个）意味着串行加载会让大部分连接空闲。即使改并发，10 个请求也要 2 轮才能完成。根本解决方案是在构建时将分散文件合并，运行时只需 1 次请求加载每个 Mod 的全部数据。

**约束**：
- 项目使用 Next.js 静态导出（`output: 'export'`），所有资源从静态文件服务
- `core/` 层不能依赖 React，`ModLoader` 是纯 TypeScript 类
- 构建脚本 `scripts/build-mods.ts` 在 `pnpm build` 流程中执行
- `mod.json` 中的 `dataFiles` 字段用于声明源文件结构，是 Mod 作者的创作界面

## Goals / Non-Goals

**Goals:**
- 将运行时加载每个 Mod 数据的 HTTP 请求数从 N 个（N = dataFiles 中声明的文件数）降至 1 个
- 构建脚本自动合并分散的数据文件，无需 Mod 作者手动操作
- Mod 之间的数据加载改为并发执行
- 保持 `ModLoader` 公共 API 不变（`loadAll()` 签名、回调类型、`useModLoader` Hook）

**Non-Goals:**
- 不改变 `mod.json` 的 `dataFiles` 字段格式（Mod 作者仍声明分散文件，构建时自动合并）
- 不实现懒加载/按需加载世界数据（后续变更可做）
- 不改变 WorldDataRegistry 的注册接口
- 不改变 `ModManifest` 接口定义
- 不引入外部打包工具依赖（使用 Node.js 内置 `fs` 和 `path`）

## Decisions

### 决策 1：合并文件格式 — 每个 Mod 一个 `data.json`

**选择**：构建时在 `public/mods/<mod-name>/data.json` 生成合并文件，结构为 `{ "<contentType>": <合并数据> }`。

对于 `world` 类型（当前唯一实际使用的类型），合并数据是一个以世界类型为 key 的对象：
```json
{
  "world": {
    "cultivation": { /* cultivation.json 内容 */ },
    "martial": { /* martial.json 内容 */ },
    ...
  }
}
```

**备选方案与拒绝理由**：
- ❌ 全局单一 bundle：失去 Mod 隔离性，且需要额外元数据标识数据归属
- ❌ 每个 content type 一个文件：只减少一半请求，仍需多个 fetch
- ❌ 内联到 JS bundle：Mod 数据是用户可替换的，不应硬编码到 JS

### 决策 2：运行时加载策略 — 两阶段：清单串行 + 数据并发

**选择**：`loadAll()` 中清单加载（`mod.json`）保持串行（用于依赖解析），依赖排序后的数据加载（`data.json`）改为 `Promise.all` 并发。

```
串行阶段：mod-list.json → 各 mod.json（逐个，用于收集 manifest）
并发阶段：各 data.json（Promise.all，同时发起所有 Mod 的数据请求）
```

**备选方案与拒绝理由**：
- ❌ 全部并发：manifest 之间可能有依赖关系需要先解析
- ❌ 全部串行：未充分利用浏览器并发能力

### 决策 3：向后兼容 — 开发模式下回退到逐文件加载

**选择**：`ModLoader` 运行时先尝试加载合并的 `data.json`，若 404 则回退到按 `dataFiles` 逐文件加载（开发模式下构建脚本可能未运行）。

**备选方案与拒绝理由**：
- ❌ 强制要求 `data.json` 存在：开发体验差，每次改数据文件都要重新构建

### 决策 4：构建脚本改动范围

**选择**：在 `scripts/build-mods.ts` 的 `buildMods()` 中，复制 Mod 目录后追加数据合并步骤。读取 `mod.json` 的 `dataFiles`，依次读取每个文件，按 content type 分组合并，写入 `data.json`。

不改变 `buildMods()` 的整体流程，只追加一个"生成合并数据文件"步骤。

## Risks / Trade-offs

- **[风险] 合并文件变大，单次请求耗时增加**：当前 8 个文件各约 10KB，合并后约 80KB。80KB 在单次 HTTP 请求中的传输时间远小于 8 次 10KB 请求的累积延迟（含连接建立、请求排队）。→ **可接受**
- **[风险] 开发模式下首次加载无 `data.json` 需回退**：回退逻辑确保功能正常，只是慢一些。→ **可接受**，开发时可在 `pnpm dev` 前手动运行一次构建脚本
- **[风险] 未来增加更多 Mod 时合并文件增大**：当前仅 1 个 Mod，合并文件 ~80KB。即使增加到 10 个 Mod，每个 ~100KB，总传输量 ~1MB，在现代网络下可接受。→ **未来可按需实现懒加载**
- **[取舍] 放弃文件级别的缓存粒度**：修改一个世界文件需要重新下载整个 `data.json`。但数据文件在构建时确定，运行时不变，不依赖 HTTP 缓存。→ **可接受**

## Migration Plan

1. 修改 `scripts/build-mods.ts`，追加合并步骤
2. 修改 `ModLoader.loadModDataAndRegister()`，优先加载 `data.json`，404 时回退
3. 修改 `ModLoader.loadAll()`，数据加载阶段使用 `Promise.all`
4. 运行 `pnpm build` 验证构建产物包含 `data.json`
5. 运行 `pnpm dev` 验证运行时加载正常

**回滚**：还原 `ModLoader` 和构建脚本的修改，删除生成的 `data.json` 文件。`mod.json` 中的 `dataFiles` 字段不受影响。
