# logger-core

Delta for [logger-core](../../../openspec/specs/logger-core/spec.md)

## MODIFIED Requirements

### Requirement: Logger 接口
系统 SHALL 提供 `Logger` 接口，包含 `debug(message: string, ...args: unknown[]): void`、`info(...)`、`warn(...)`、`error(...)` 四个方法。每个方法在级别足够时输出到对应的 `console` 方法（debug→console.debug、info→console.info、warn→console.warn、error→console.error）。在 Node.js 服务端环境中，`console` 方法输出到 `stdout`/`stderr`；在浏览器环境中输出到 F12 开发者工具控制台。

#### Scenario: debug 级别输出
- **WHEN** 当前日志级别为 `DEBUG`，调用 `log.debug('加载模块', { count: 5 })`
- **THEN** 控制台输出包含 `[DEBUG]`、模块命名空间前缀和 `{ count: 5 }` 参数

#### Scenario: 级别不足时不输出
- **WHEN** 当前日志级别为 `WARN`，调用 `log.debug('调试信息')`
- **THEN** 控制台不输出任何内容

#### Scenario: warn 级别在 WARN 时输出
- **WHEN** 当前日志级别为 `WARN`，调用 `log.warn('磁盘空间不足')`
- **THEN** 控制台输出包含 `[WARN]` 前缀和警告消息

#### Scenario: Node.js 服务端正常输出
- **WHEN** 在 Node.js 服务端调用 `log.info('服务启动')`
- **THEN** 日志通过 `console.info` 输出到 `stdout`，携带 `[INFO]` 和模块命名空间前缀

### Requirement: createLogger 工厂函数
系统 SHALL 提供 `createLogger(name: string): Logger` 工厂函数，返回绑定模块命名空间 `[name]` 的 Logger 实例。该函数在浏览器和 Node.js 环境中均可使用。

#### Scenario: 创建带命名空间的 logger
- **WHEN** 调用 `const log = createLogger('ModLoader')`，然后 `log.info('加载完成')`
- **THEN** 控制台输出包含 `[ModLoader]` 前缀，格式为 `[INFO] [ModLoader] 加载完成`

#### Scenario: 不同模块 logger 独立
- **WHEN** 创建 `const logA = createLogger('A')` 和 `const logB = createLogger('B')`
- **AND** 调用 `logA.info('消息A')` 和 `logB.warn('消息B')`
- **THEN** 两条日志分别带有 `[A]` 和 `[B]` 前缀，互不干扰

#### Scenario: Node.js API 模块使用 logger
- **WHEN** 在 `src/app/api/init.ts` 中调用 `const log = createLogger('API Init')`
- **THEN** 返回可在 Node.js 环境正常工作的 Logger 实例
