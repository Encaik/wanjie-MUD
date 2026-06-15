# mod-loader-interface

## Purpose

定义 `IModLoader` 抽象接口，作为服务端和客户端加载器的统一契约。

## Requirements

### Requirement: IModLoader 抽象接口

项目 SHALL 在 `core/mod/types.ts` 中定义 `IModLoader` 接口，作为服务端和客户端加载器的统一契约。

#### Scenario: 接口定义
- **WHEN** 定义 `IModLoader` 接口
- **THEN** 包含以下方法：
  - `discover(): Promise<ModEntry[]>` — 发现可用的 Mod 列表
  - `loadAll(): Promise<ModLoadResult>` — 加载所有 Mod 并注册
  - `getLoadedMods(): LoadedMod[]` — 获取已加载的 Mod 列表
  - `getFailedMods(): Array<{id, name, error}>` — 获取加载失败的 Mod

#### Scenario: 加载状态类型
- **WHEN** 定义加载状态类型
- **THEN** 包含 `ModLoadPhase`（idle/loading/ready/error）、`ModLoadProgress`（current/total）、`ModLoadResult`（loaded/failed/total）

### Requirement: 服务端加载器 ServerModLoader

项目 SHALL 在 `core/mod/loader/server-loader.ts` 中实现基于 `fs` 的 `ServerModLoader`。

#### Scenario: 文件系统发现 Mod
- **WHEN** 服务端启动时调用 `ServerModLoader.discover()`
- **THEN** 通过 `fs.readdirSync` 扫描 `mods/` 目录
- **AND** 读取每个子目录中的 `mod.json` 解析清单
- **AND** 返回发现的 Mod 条目列表

#### Scenario: 全量加载数据
- **WHEN** 调用 `ServerModLoader.loadAll()`
- **THEN** 通过 `fs.readFileSync` 读取每个 Mod 的 `mod.json` 和数据文件
- **AND** 按依赖顺序（拓扑排序）逐 Mod 加载
- **AND** 处理所有声明的内容类型（worldview、attributes、races、talents、npcs、quests 等）
- **AND** 将数据注册到对应的注册中心
- **AND** 对有对应 Registry 的类型调用 `registry.register()`，尚无 Registry 的类型仅暂存，不抛异常

#### Scenario: 依赖排序
- **WHEN** Mod 声明了 `dependencies`
- **THEN** 加载器按依赖关系拓扑排序后加载
- **AND** 缺少必要依赖的 Mod 标记为失败但继续加载其他 Mod

#### Scenario: required Mod 失败处理
- **WHEN** 标记为 `required: true` 的 Mod 加载失败
- **THEN** 汇总所有失败的 required Mod 并抛 `ModLoadError`

### Requirement: 客户端加载器 ClientModLoader

项目 SHALL 在 `core/mod/loader/client-loader.ts` 中实现基于 `fetch` 的 `ClientModLoader`。

#### Scenario: 非阻塞加载
- **WHEN** 客户端页面加载时调用 `ClientModLoader.loadAll()`
- **THEN** 通过 `fetch` 从 `public/mods/mod-list.json` 获取 Mod 索引
- **AND** 逐 Mod 加载主题/样式数据
- **AND** 加载结果通过回调通知调用方，不阻塞页面渲染

#### Scenario: 加载失败不破坏页面
- **WHEN** 客户端 Mod 加载失败（fetch 404、JSON 解析错误等）
- **THEN** 该 Mod 标记为失败，其他 Mod 继续加载
- **AND** 页面正常渲染，不影响游戏运行
