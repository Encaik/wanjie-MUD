## Context

### 当前状态

项目中有两个与"日志/消息"相关的系统，但状态不同：

1. **`core/message-log/`**（已完成）——游戏消息记录系统，管理玩家在游戏内消息框中看到的文本（战斗消息、修炼消息等）。MessageManager 单例 + 通道注册 + 事件模板 + 装饰器，功能完整。

2. **开发日志**（散落各处）——面向开发者的 F12 控制台日志。现状是：
   - `shared/utils/logger.ts` 定义了一个简单的 `logger` 对象（debug/info/warn/error），导出 `LogLevel` 枚举，但**基本无人使用**——全项目搜索未发现任何 `import { logger }` 的调用
   - 实际代码中大量使用原始 `console.log/warn/error`（约 40+ 处），集中分布在 `core/mod/ModLoader.ts`、`core/registry/`、`shared/utils/saveUtils.ts` 等文件
   - 日志格式不统一：有的带 `[ModuleName]` 前缀，有的没有；有的用模板字符串，有的用逗号分隔参数

3. **`MessageRecord` 类型**（`core/types/types.ts`）——游戏消息的数据结构，与开发日志无关。

### 两个系统的明确分工

| 维度 | `core/logger/` | `core/message-log/` |
|------|---------------|---------------------|
| **受众** | 开发者 | 玩家 |
| **可见位置** | F12 浏览器控制台 | 游戏内消息框 UI |
| **内容** | 系统运行状态、错误、调试信息 | 游戏事件结果（战斗、修炼、交易） |
| **数据存储** | 不持久化 | IndexedDB（messageDB） |
| **依赖项** | 无 | GameEventManager、MessageRecord |

### 约束

- `core/` 不依赖 `modules/`，不依赖 React
- 遵循项目五层架构，`core/` 是底层基础设施
- 与 `shared/utils/logger.ts` 的功能升级迁移，不是简单搬运
- 不在 `components/ui/`（shadcn 源文件）中做任何修改
- logger 必须轻量——不应引入外部依赖或复杂的类层次结构

## Goals / Non-Goals

**Goals:**
- 在 `core/logger/` 中创建结构化的系统运行日志模块
- 提供**分级日志**：debug、info、warn、error，支持运行时级别过滤
- 提供**模块命名空间**：`createLogger('ModLoader')` 产出带 `[ModLoader]` 前缀的日志实例
- 支持**生产环境静默**：production 模式下自动抑制 debug/info，仅输出 warn/error
- 替换全项目中所有原始 `console.log/warn/error` 调用
- 删除旧 `shared/utils/logger.ts`，从 `shared/utils/index.ts` 移除相关导出

**Non-Goals:**
- 不修改 `core/message-log/` 的任何代码（游戏消息系统独立运作）
- 不实现远程日志上报、日志持久化、日志文件导出
- 不实现结构化 JSON 日志（首版保持简单文本）
- 不修改 `components/ui/` 中 shadcn 组件的 `console` 调用
- 不实现日志的性能计时/性能分析功能

## Decisions

### D1: Logger 采用工厂函数模式，非单例类

**选择**：`createLogger(name: string): Logger` 工厂函数，返回带命名空间的 logger 实例。

```typescript
const log = createLogger('ModLoader');
log.info('加载完成', { modCount: 5 });
// 输出: [ModLoader] 加载完成 { modCount: 5 }
```

**替代方案**：
- **单例 Logger 类**：与 MessageManager 模式一致，但 logger 不需要全局状态管理（无缓冲、无事件），单例是不必要的复杂度。❌
- **直接导出带命名空间的函数**：`logInfo('ModLoader', ...)` 每次调用都要传模块名，冗余。❌

**理由**：工厂函数简洁、树摇友好、符合函数式风格。每个模块在文件顶部调用 `createLogger('ModuleName')` 一次，后续使用简洁。

### D2: 日志级别采用枚举 + 运行时配置

**选择**：保留 `LogLevel` 枚举（从旧 logger 升级），新增 `setLogLevel(level)` 和 `getLogLevel()` 运行时 API。默认级别：开发环境 `DEBUG`，生产环境 `WARN`。

```typescript
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}
```

**替代方案**：
- **字符串级别（`'debug' | 'info' | ...`）**：灵活性高但无编译时检查。❌
- **环境变量 `LOG_LEVEL`**：适合服务端，但对客户端 SPA 不友好。❌
- **仅保留枚举，不提供运行时切换**：开发时调试不便（需重新编译切换级别）。❌

**理由**：枚举提供类型安全，`setLogLevel` 允许在浏览器控制台动态调整（`setLogLevel(LogLevel.DEBUG)`），开发体验好。

### D3: 模块命名空间通过 `createLogger` 的 `name` 参数实现

**选择**：`createLogger(name)` 创建的 logger 实例在所有输出中自动添加 `[name]` 前缀。命名空间为自由字符串，建议使用模块/文件名。

```typescript
const log = createLogger('ModLoader');
log.warn('未发现 Mod');
// console.warn: [ModLoader] 未发现 Mod
```

与现有代码中手动写 `[ModLoader]` 前缀的模式保持一致，只是改为自动注入。

**替代方案**：
- **点分隔命名空间（`core.mod.loader`）**：层次化但过于复杂，前端项目不需要。❌
- **无前缀，依赖 console 的文件名/行号**：浏览器 DevTools 已提供调用栈，但字符串搜索/过滤不便。❌

**理由**：`[ModuleName]` 前缀已是项目现有惯例（`ModLoader.ts` 中全部使用 `[ModLoader]` 前缀），自动化减少手写错误。

### D4: 文件结构

```
core/logger/
├── index.ts          # 桶导出
├── types.ts          # LogLevel 枚举、Logger 接口、LogFn 类型
├── logger.ts         # createLogger() 工厂、setLogLevel/getLogLevel
└── __tests__/
    └── logger.test.ts
```

轻量简洁，不需要 `channelRegistry` 或 `messageManager` 那样的复杂结构。

### D5: 替换策略

**阶段式替换**：
1. 创建 `core/logger/` 模块
2. 按文件逐个替换 `console.log/warn/error` → `log.info/warn/error`
3. 原有 `console.debug` 调用 → `log.debug`
4. 删除旧 `shared/utils/logger.ts`
5. 更新 `shared/utils/index.ts` 的 barrel 导出

**不替换的范围**：
- `components/ui/`（shadcn 源文件，项目策略：不修改）
- `core/message-log/` 中使用 `Math.random()` 的 `generateMessageId()`（那是逻辑需要，不是日志）

## Risks / Trade-offs

- **[R1] 大量文件改动** → 约 15-20 个文件需要替换 console 调用。每个文件改动小（仅 import + 替换调用），按文件逐个提交，减少冲突风险。
- **[R2] 日志性能影响** → `createLogger` 在模块加载时调用一次，运行时仅多一层函数调用（检查级别 + 拼接前缀），开销可忽略。
- **[R3] 旧 `shared/utils/logger.ts` 可能有隐式依赖** → 经搜索确认，当前无任何代码 import 旧的 `logger` 或 `LogLevel`。安全删除。
- **[R4] 浏览器 console 的调用栈指向 logger.ts 而非实际调用点** → 这是所有 logger 包装的通用问题。开发环境中 `console.debug` 本身就会显示完整调用栈，影响可控。

## Migration Plan

1. **Phase 1**：创建 `core/logger/` 全部文件并通过测试
2. **Phase 2**：在 2-3 个文件中试点替换，验证开发体验
3. **Phase 3**：批量替换剩余文件中的 `console.*` 调用
4. **Phase 4**：删除 `shared/utils/logger.ts`，更新 barrel
5. **Phase 5**：运行 `pnpm ts-check && pnpm build && pnpm test` 全量验证

**回滚**：新 logger 与旧 `console.*` 行为等价（都是输出到控制台），回滚仅需恢复 `import` 和删除 `core/logger/` 目录。旧 `shared/utils/logger.ts` 在 git 历史中可恢复。

## Open Questions

- Q1: 是否需要支持日志的 `trace` 级别（比 debug 更细粒度）？→ 首版不需要，ESLint 有 `no-console` 规则本身就是防止过多 console。
- Q2: 是否需要在测试环境中静默所有日志？→ `setLogLevel(LogLevel.SILENT)` 已支持，测试环境中可在 setup 文件调用。
