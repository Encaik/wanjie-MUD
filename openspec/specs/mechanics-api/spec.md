# mechanics-api

## Purpose

世界机制 API 端点 `GET /api/v1/worldviews/[id]/mechanics` — 前端通过 HTTP API 获取世界机制配置，不再直接访问服务端 `WorldMechanicsRegistry` 单例。API 响应仅包含机制数据，不暴露全量 WorldviewDefinition。

## Requirements

### Requirement: 世界机制 API 端点

系统 SHALL 提供 `GET /api/v1/worldviews/[id]/mechanics` API 端点，返回指定世界观的机制配置信息。

#### Scenario: 获取已注册世界观的机制

- **WHEN** 客户端发起 `GET /api/v1/worldviews/cultivation/mechanics`
- **THEN** 服务端 SHALL 返回 `200 OK`，响应体包含 `worldviewId` 和 `mechanics` 对象
- **AND** `mechanics` 对象 SHALL 包含 `worldType`、`cultivation`、`combat`、`exploration`、`uniqueMechanic` 字段

#### Scenario: 请求未注册世界观的机制

- **WHEN** 客户端发起 `GET /api/v1/worldviews/nonexistent/mechanics`
- **THEN** 服务端 SHALL 返回 `404 Not Found`，错误信息为 `世界观 'nonexistent' 未配置机制`

#### Scenario: 仅返回机制数据

- **WHEN** 客户端发起 `GET /api/v1/worldviews/:id/mechanics`
- **THEN** 响应体 SHALL NOT 包含 `WorldviewDefinition` 的全量数据（如 namePrefixes、nameSuffixes、descriptions、dangers、opportunities、factions、traits、namePool、texts 等生成池）
- **AND** 响应体 SHALL 仅包含 `worldviewId` 和 `mechanics` 两个字段

#### Scenario: 世界观已注册但无机制配置

- **WHEN** 客户端发起 `GET /api/v1/worldviews/:id/mechanics` 且该世界观在 `WorldMechanicsRegistry` 中无注册
- **THEN** 服务端 SHALL 返回 `404 Not Found`，错误信息为 `世界观 ':id' 未配置机制`

### Requirement: 前端通过 API 获取机制

前端组件 SHALL 通过 HTTP API 获取世界机制信息，SHALL NOT 直接调用 `WorldMechanicsRegistry` 或 `getWorldMechanics()` 函数。`factory.ts` 中的 `hasUniqueMechanics()` 导出 SHALL 被删除。

#### Scenario: WorldSelect 渲染机制信息

- **WHEN** WorldSelect 组件需要显示世界机制描述
- **THEN** SHALL 通过 `fetch('/api/v1/worldviews/:id/mechanics')` 获取数据
- **AND** SHALL NOT import `getWorldMechanics` 或 `WorldMechanicsRegistry`

#### Scenario: worldAudit 检查机制存在性

- **WHEN** `worldAudit.ts` 需要判断世界观是否有独特机制
- **THEN** SHALL 通过 `WorldMechanicsRegistry.getInstance().has(id)` 直接检查（服务端逻辑代码）
- **AND** SHALL NOT 调用已删除的 `hasUniqueMechanics()`
