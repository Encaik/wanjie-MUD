# mod-data-bundling

## MODIFIED Requirements

### Requirement: 服务端加载器支持所有声明的内容类型

服务端加载器 SHALL 处理 Mod 清单中声明的所有 `contentTypes`，而非仅限于 `worldview`。

#### Scenario: 全量注册
- **WHEN** `wanjie-core/mod.json` 声明了 contentTypes 包含 `worldview`、`attributes`、`races`、`talents`、`npcs`、`quests`
- **THEN** 服务端加载器遍历 `dataFiles` 读取每个类型对应的数据文件
- **AND** 对 `worldview` 类型调用 `WorldViewRegistry.register()`
- **AND** 对其他类型执行对应的注册或暂存操作

#### Scenario: 尚无 Registry 的类型安全跳过
- **WHEN** 内容类型（如 `attributes`）尚无对应的注册中心
- **THEN** 加载器读取数据文件、进行基本结构校验
- **AND** 将数据暂存在加载器内存中
- **AND** 不抛异常、不影响其他内容的注册流程

### Requirement: 加载结果汇总

服务端加载器 SHALL 返回完整的加载结果汇总，包含成功/失败/总数和失败详情。

#### Scenario: 加载结果返回
- **WHEN** `ServerModLoader.loadAll()` 完成
- **THEN** 返回 `ModLoadResult`，包含 `loaded`（成功数）、`failed`（失败数）、`total`（总数）、`errors`（失败详情列表）
- **AND** `ensureWorldSystemInitialized()` 根据结果决定是否完成初始化
