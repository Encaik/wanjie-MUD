# mod-directory-data-layout

## MODIFIED Requirements

### Requirement: ModManifest 类型定义统一

`ModManifest` 类型定义 SHALL 统一在 `core/mod/ModManifest.ts` 中，删除 `app/api/mod-types.ts` 的重复定义。

#### Scenario: 单一类型来源
- **WHEN** 导入 `ModManifest` 类型
- **THEN** 只能从 `@/core/mod/ModManifest` 或 `@/core/mod` 导入，不再有 `/app/api/mod-types` 路径

#### Scenario: 服务端兼容
- **WHEN** 服务端代码导入 `core/mod/ModManifest.ts` 中的 `ModManifest` 类型
- **THEN** 该模块不包含浏览器特定 API（如 `fetch`），纯类型定义 + 校验函数，可在 Node.js 环境直接使用

### Requirement: ModContentType 分服务端/客户端枚举

`ModContentType` SHALL 区分为服务端和客户端两组枚举值，但统一在 `core/mod/types.ts` 中定义。

#### Scenario: 服务端内容类型
- **WHEN** 服务端加载器处理 Mod 内容类型
- **THEN** 识别以下类型：`worldview`、`attributes`、`races`、`talents`、`npcs`、`quests`、`traits`、`dangers`、`opportunities`、`realms`、`factions`、`names`、`text`、`items`

#### Scenario: 客户端内容类型
- **WHEN** 客户端加载器处理 Mod 内容类型
- **THEN** 识别以下类型：`styles`、`theme`

#### Scenario: 类型安全
- **WHEN** 开发者在代码中引用 `ModContentType`
- **THEN** TypeScript 枚举提供类型检查，避免拼写错误
