# world-theme-api

世界主题 API — 从后端 WorldviewDefinition 获取世界观主题配置的 HTTP 端点。

## ADDED Requirements

### Requirement: API endpoint for world theme configuration

系统 SHALL 提供 `GET /api/v1/worldviews/[id]/theme` 端点，返回指定世界观的完整明暗主题配置。响应数据 SHALL 从 `WorldviewDefinition.themeConfig` 字段读取。

#### Scenario: Successful theme fetch for built-in worldview

- **WHEN** 客户端请求 `GET /api/v1/worldviews/tech/theme`
- **THEN** 返回 HTTP 200
- **AND** 响应体包含 `worldviewId: "tech"`
- **AND** 响应体包含 `displayName: "科技世界"`
- **AND** 响应体包含 `lightTheme` 对象（CSS 变量名 → oklch 值）
- **AND** 响应体包含 `darkTheme` 对象（CSS 变量名 → oklch 值）
- **AND** `lightTheme` 至少包含 `--primary`、`--background`、`--foreground`、`--accent`、`--border`、`--ring` 变量

#### Scenario: Worldview without theme config returns 404

- **WHEN** 客户端请求 `GET /api/v1/worldviews/mod-custom/theme`，且该世界观未配置 `themeConfig`
- **THEN** 返回 HTTP 404
- **AND** 响应体包含 `{ error: "世界观 'mod-custom' 未配置主题" }`

#### Scenario: Non-existent worldview returns 404

- **WHEN** 客户端请求 `GET /api/v1/worldviews/nonexistent/theme`
- **THEN** 返回 HTTP 404

### Requirement: Theme config SHALL be stored in WorldviewDefinition

`WorldviewDefinition` 接口 SHALL 包含可选字段 `themeConfig`，其类型为 `{ light: Record<string, string>; dark: Record<string, string> }`。所有 8 个内置世界观 SHALL 填写此字段。

#### Scenario: Cultivation world has themeConfig

- **WHEN** 查询 "cultivation" 世界观的 `themeConfig`
- **THEN** `themeConfig.light["--primary"]` 为琥珀棕色 oklch 值
- **AND** `themeConfig.dark["--primary"]` 为暗色模式下的琥珀金色
- **AND** 亮色和暗色配置覆盖相同的 CSS 变量集合

#### Scenario: Mod worldview can include themeConfig

- **WHEN** Mod 的 `worldview.json` 包含 `"themeConfig"` 字段
- **THEN** `WorldViewRegistry.register()` 正常接受该定义
- **AND** `themeConfig` 通过类型校验

### Requirement: Theme API SHALL be read-only

主题 API 端点 SHALL 仅支持 `GET` 方法。主题数据通过 Mod JSON 文件定义，运行时不可通过 API 修改。

#### Scenario: POST request returns 405

- **WHEN** 客户端发送 `POST /api/v1/worldviews/tech/theme`
- **THEN** 返回 HTTP 405 Method Not Allowed
