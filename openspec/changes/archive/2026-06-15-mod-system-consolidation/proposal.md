## Why

Mod 系统目前有两套平行的加载体系：`core/mod/ModLoader.ts`（浏览器 fetch，未投入使用）和 `app/api/init.ts` 中的内联加载逻辑（服务端 fs，实际在用），同时存在两份重复的 `ModManifest` 类型定义。这导致代码维护成本高、内容类型（`attributes`、`races` 等）被静默跳过、客户端 Mod 加载能力缺失。需要将两套体系归一到 `core/mod/` 下，通过区分服务端/客户端加载器实现统一管理，同时保障现有功能不受影响。

## What Changes

### 核心重构

1. **归一化类型定义**：删除 `app/api/mod-types.ts`，统一使用 `core/mod/ModManifest.ts` 中的 `ModManifest`
2. **重构 `core/mod/ModLoader.ts`**：移除浏览器 `fetch()` 依赖，抽取 `IModLoader` 接口，实现服务端和客户端两个加载器
3. **新增文件布局**：
   - `core/mod/types.ts` — IModLoader 接口、内容类型枚举、加载状态类型
   - `core/mod/loader/server-loader.ts` — 服务端 fs 加载器
   - `core/mod/loader/client-loader.ts` — 客户端 fetch 加载器
   - `core/mod/loader/index.ts` — barrel 导出

### 服务端加载（替换 `app/api/init.ts` 内联代码）

4. **`core/mod/loader/server-loader.ts`** 实现：
   - `fs` 扫描 `mods/` 目录发现 Mod
   - 读取 `mod.json` + 数据文件
   - 处理所有数据内容类型（worldview, attributes, races, talents, npcs, quests 等）
   - 依赖排序 + required 检查
   - 注册到 `WorldViewRegistry` / `WorldMechanicsRegistry`
5. **`app/api/init.ts` 精简**：内联加载代码替换为对 `ServerModLoader` 的调用

### 客户端加载（新增能力）

6. **`core/mod/loader/client-loader.ts`** 新增：
   - `fetch()` 从 `public/mods/mod-list.json` 发现 Mod
   - 加载主题/样式包
   - 在不破坏现有客户端渲染路径的前提下提供状态

### 功能修复

7. **修复内容类型遗漏**：当前 `app/api/init.ts` 仅处理 `worldview`，导致 `attributes`、`races`、`talents`、`npcs`、`quests` 声明了但未注册。新加载器处理所有类型
8. **清理死代码**：移除废弃的 `ModLoadingOverlay`，精简 `ModInitProvider`

### 安全保障

9. **分步替换**：先实现新加载器并独立测试，再替换 `app/api/init.ts`，中间可并行运行
10. **不改变**：Mod 文件格式（`mod.json` + 数据 JSON）、构建脚本（`build-mods.ts`）、注册中心 API

## Capabilities

### New Capabilities
- `mod-loader-interface`: IModLoader 抽象接口、服务端/客户端加载器实现
- `client-theme-mod-loading`: 客户端主题/样式 Mod 加载能力

### Modified Capabilities
- `mod-directory-data-layout`: 服务端加载器接管数据加载，类型定义统一到 core/mod/
- `mod-data-bundling`: 修复内容类型遗漏，所有声明类型均被注册

## Impact

- **删除**：`app/api/mod-types.ts`（类型合并到 core/mod/）
- **新增**：`core/mod/types.ts`、`core/mod/loader/base-loader.ts`、`core/mod/loader/server-loader.ts`、`core/mod/loader/client-loader.ts`
- **修改**：`core/mod/ModManifest.ts`（移除 fetch 依赖）、`app/api/init.ts`（内联代码替换为加载器调用）
- **清理**：废弃的 `ModLoadingOverlay` 组件
- **无影响**：`mods/` 目录结构、`build-mods.ts` 流程、`package.json` 脚本、已持久化的游戏存档
