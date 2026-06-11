## MODIFIED Requirements

### Requirement: WorldMechanicsRegistry 服务端专用

`WorldMechanicsRegistry` SHALL 保留为服务端专用注册中心。注册操作 SHALL 仅在服务端初始化（`init.ts` 的 `registerBuiltinMechanics()`）中执行。查询操作 SHALL 仅在 API 路由层执行。前端代码 SHALL NOT 直接 import 或调用 `WorldMechanicsRegistry`。

#### Scenario: 服务端注册机制

- **WHEN** `ensureWorldSystemInitialized()` 执行
- **THEN** `registerBuiltinMechanics()` SHALL 从 `WorldViewRegistry` 获取所有世界观
- **AND** 将每个世界观的 `mechanics` 配置注册到 `WorldMechanicsRegistry`

#### Scenario: API 层查询机制

- **WHEN** API 路由需要返回世界机制数据
- **THEN** SHALL 通过 `WorldMechanicsRegistry.getInstance().get(id)` 查询
- **AND** 将结果序列化为 JSON 返回给客户端

#### Scenario: 前端不直接访问注册中心

- **WHEN** 搜索所有 `*.tsx` 和前端 `*.ts` 文件
- **THEN** SHALL NOT 存在 `import ... WorldMechanicsRegistry` 或 `import { getWorldMechanics }` 语句
- **AND** 所有机制查询 SHALL 通过 HTTP API 或 `WorldviewDefinition.mechanics` 字段
