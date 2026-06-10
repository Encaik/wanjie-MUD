# backend-logger-unification

**Purpose:** 后端所有 API 模块（`src/app/api/` 下的路由和工具模块）统一使用 `core/logger` 的 `createLogger()` 输出日志，替换裸 `console.log/warn/error` 调用。

## ADDED Requirements

### Requirement: 后端模块使用统一日志实例
`src/app/api/` 下的每个模块 SHALL 在文件顶部通过 `createLogger(namespace)` 创建日志实例，后续所有日志输出使用该实例的方法。

#### Scenario: API 路由日志使用统一的 logger
- **WHEN** API 路由文件（如 `init.ts`, `db/index.ts`, `worlds/route.ts`）输出日志
- **THEN** 日志通过 `createLogger()` 返回的实例方法输出
- **AND** 日志格式统一包含 `[LEVEL] [ModuleName]` 前缀

#### Scenario: 后端日志仍然输出到控制台
- **WHEN** 在 Node.js 服务端调用 `log.info('消息')`
- **THEN** 方法通过 `console.info` 输出到 `stdout`，格式与其他模块一致

### Requirement: 常见日志命名空间约定
后端各模块的日志命名空间 SHALL 遵循以下约定：

| 命名空间 | 对应文件 |
|---------|---------|
| `API Init` | `src/app/api/init.ts` |
| `DB` | `src/app/api/db/index.ts` |
| `Basic` | `src/app/api/v1/worlds/generate/basic/route.ts` |
| `Generate` | `src/app/api/v1/worlds/generate/route.ts` |
| `Details Generate` | `src/app/api/v1/worlds/generate/details/route.ts` |
| `Worlds` | `src/app/api/v1/worlds/route.ts` |
| `Instrumentation` | `src/instrumentation.ts` |

#### Scenario: 命名空间可区分日志来源
- **WHEN** 后端不同模块同时输出日志
- **THEN** 各日志行携带各自的命名空间前缀
- **AND** 开发者可以通过前缀过滤特定模块的日志

### Requirement: 禁止裸 console 调用
`src/app/api/` 和 `src/instrumentation.ts` 中的代码 SHALL NOT 直接调用 `console.log`、`console.warn`、`console.error`、`console.info`（除 `core/logger/` 本身的实现外）。

#### Scenario: ESLint 检测裸 console
- **WHEN** 在 `src/app/api/` 目录中写入 `console.log('...')`
- **THEN** 代码审查或 ESLint 检查应标记为不合规
