# logger-core

**Purpose:** 系统运行日志核心——面向开发者的分级日志记录器（debug/info/warn/error），支持模块命名空间和生产环境过滤，放在 `core/logger/`，输出到浏览器 F12 控制台。

## Requirements

### Requirement: 日志级别枚举
系统 SHALL 提供 `LogLevel` 枚举，包含 `DEBUG = 0`、`INFO = 1`、`WARN = 2`、`ERROR = 3`、`SILENT = 4` 五个级别。数值越小，日志越详细。

#### Scenario: 枚举值定义
- **WHEN** 引用 `LogLevel.DEBUG`
- **THEN** 其值为 `0`

#### Scenario: 级别大小关系
- **WHEN** 比较 `LogLevel.DEBUG < LogLevel.INFO < LogLevel.WARN < LogLevel.ERROR < LogLevel.SILENT`
- **THEN** 该不等式恒成立

### Requirement: Logger 接口
系统 SHALL 提供 `Logger` 接口，包含 `debug(message: string, ...args: unknown[]): void`、`info(...)`、`warn(...)`、`error(...)` 四个方法。每个方法在级别足够时输出到对应的 `console` 方法（debug→console.debug、info→console.info、warn→console.warn、error→console.error）。

#### Scenario: debug 级别输出
- **WHEN** 当前日志级别为 `DEBUG`，调用 `log.debug('加载模块', { count: 5 })`
- **THEN** 控制台输出包含 `[DEBUG]`、模块命名空间前缀和 `{ count: 5 }` 参数

#### Scenario: 级别不足时不输出
- **WHEN** 当前日志级别为 `WARN`，调用 `log.debug('调试信息')`
- **THEN** 控制台不输出任何内容

#### Scenario: warn 级别在 WARN 时输出
- **WHEN** 当前日志级别为 `WARN`，调用 `log.warn('磁盘空间不足')`
- **THEN** 控制台输出包含 `[WARN]` 前缀和警告消息

### Requirement: createLogger 工厂函数
系统 SHALL 提供 `createLogger(name: string): Logger` 工厂函数，返回绑定模块命名空间 `[name]` 的 Logger 实例。每个模块在文件顶部调用一次，后续使用该实例记录日志。

#### Scenario: 创建带命名空间的 logger
- **WHEN** 调用 `const log = createLogger('ModLoader')`，然后 `log.info('加载完成')`
- **THEN** 控制台输出包含 `[ModLoader]` 前缀，格式为 `[ModLoader] 加载完成`

#### Scenario: 不同模块 logger 独立
- **WHEN** 创建 `const logA = createLogger('A')` 和 `const logB = createLogger('B')`
- **AND** 调用 `logA.info('消息A')` 和 `logB.warn('消息B')`
- **THEN** 两条日志分别带有 `[A]` 和 `[B]` 前缀，互不干扰

### Requirement: 运行时日志级别控制
系统 SHALL 提供 `setLogLevel(level: LogLevel): void` 和 `getLogLevel(): LogLevel` 函数，允许在运行时动态调整日志输出级别。

#### Scenario: 运行时切换日志级别
- **WHEN** 调用 `setLogLevel(LogLevel.DEBUG)`
- **THEN** 后续的 `log.debug()` 调用生效，输出调试信息

#### Scenario: 静默所有日志
- **WHEN** 调用 `setLogLevel(LogLevel.SILENT)`
- **THEN** 后续所有级别的日志（debug/info/warn/error）均不输出

#### Scenario: 查询当前日志级别
- **WHEN** 调用 `getLogLevel()`
- **THEN** 返回当前生效的 `LogLevel` 值

### Requirement: 默认日志级别
系统 SHALL 根据运行环境自动设置默认日志级别：开发环境（`NODE_ENV !== 'production'`）默认为 `DEBUG`，生产环境（`NODE_ENV === 'production'`）默认为 `WARN`。

#### Scenario: 开发环境默认 DEBUG
- **WHEN** `NODE_ENV` 为 `'development'` 或未设置，首次导入 `core/logger/`
- **THEN** 默认日志级别为 `LogLevel.DEBUG`

#### Scenario: 生产环境默认 WARN
- **WHEN** `NODE_ENV` 为 `'production'`，首次导入 `core/logger/`
- **THEN** 默认日志级别为 `LogLevel.WARN`，`debug` 和 `info` 级别不输出

### Requirement: 模块导出
`core/logger/` 模块 SHALL 通过 `index.ts` 统一导出所有公开 API：`LogLevel`、`Logger` 接口、`createLogger`、`setLogLevel`、`getLogLevel`。

#### Scenario: 模块导入
- **WHEN** 其他模块写 `import { createLogger, LogLevel } from '@/core/logger'`
- **THEN** 成功导入 `createLogger` 函数和 `LogLevel` 枚举
