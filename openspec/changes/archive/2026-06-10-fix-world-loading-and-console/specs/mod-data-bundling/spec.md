# mod-data-bundling

Delta for [mod-data-bundling](../../../openspec/specs/mod-data-bundling/spec.md)

## MODIFIED Requirements

### Requirement: 运行时优先加载合并数据文件
`ModLoader.loadModDataAndRegister()` SHALL 优先尝试加载合并数据文件 `data.json`（单次 HTTP 请求）。当 `data.json` 不存在（HTTP 404）时 SHALL 回退到按 `dataFiles` 逐文件加载的原有逻辑。

在服务端部署环境中，Mod 数据由 `ensureWorldSystemInitialized()` 通过文件系统（`fs`）直接加载并注册到 `WorldDataRegistry`，客户端不执行 `ModLoader.loadAll()` 的 fetch 加载管线。`ModLoader` 类保留作为可复用的基础设施，可供工具脚本、测试和特殊场景使用。

#### Scenario: 生产环境加载合并文件
- **WHEN** `ModLoader` 加载 Mod 数据，且 `{basePath}/{modId}/data.json` 存在
- **THEN** 加载器 SHALL 通过单次 `fetch` 获取 `data.json`
- **AND** 遍历合并数据中的每个 content type，调用 `registerData()` 注册
- **AND** 不再发起对 `dataFiles` 中声明的独立文件的请求

#### Scenario: 开发环境回退到逐文件加载
- **WHEN** `ModLoader` 加载 Mod 数据，且 `{basePath}/{modId}/data.json` 返回 404
- **THEN** 加载器 SHALL 回退到按 `dataFiles` 逐文件串行加载的原有逻辑
- **AND** 输出 info 级别日志提示回退

#### Scenario: 服务端部署模式不执行 fetch 加载
- **WHEN** 应用部署到生产环境
- **THEN** Mod 数据由服务端 `ensureWorldSystemInitialized()` 通过文件系统加载
- **AND** 客户端代码不调用 `ModLoader.loadAll()`
- **AND** 客户端不发起 `/mods/` 下任何文件的 HTTP 请求

#### Scenario: 合并文件加载失败
- **WHEN** `data.json` 请求返回非 404 的错误状态（如 500）
- **THEN** 加载器 SHALL 回退到按 `dataFiles` 逐文件加载

### Requirement: dataFiles 数组格式兼容
`dataFiles` 中的值既可以是字符串（单个文件路径）也可以是字符串数组（多个文件路径）。服务端（`init.ts`）和浏览器端（`ModLoader`）SHALL 统一处理这两种格式：对字符串做单元素数组归一化，对数组直接遍历。

#### Scenario: 字符串路径加载
- **WHEN** `dataFiles.world` 的值为 `"data/worlds.json"`（字符串）
- **THEN** 系统将其归一化为 `["data/worlds.json"]` 并加载该文件

#### Scenario: 数组路径加载
- **WHEN** `dataFiles.world` 的值为 `["data/world/cultivation.json", "data/world/martial.json"]`（数组）
- **THEN** 系统遍历数组逐一加载每个数据文件

#### Scenario: 不确定格式时路径安全拼接
- **WHEN** 系统调用 `path.join()` 或 URL 构造拼接文件路径
- **THEN** 传入的路径参数始终为 `string` 类型（已通过归一化确保），不会传入 `string[]`
