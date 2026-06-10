## Why

游戏消息系统（`core/message-log/`）已完成设计和实现，为玩家可见的游戏消息提供了统一入口。但系统运行日志（开发者 F12 调试用）仍使用原始的 `console.log/warn/error` 散落各处，旧的 `shared/utils/logger.ts` 功能简陋且无人使用。需要将日志系统也规范化到 `core/` 层，形成"游戏消息"与"系统日志"两套明确分工的核心基础设施，并清理所有旧的日志代码。

## What Changes

- 新建 `core/logger/` 模块：面向开发者的系统运行日志系统，提供分级日志（debug/info/warn/error）、模块标识、生产环境控制
- 将 `shared/utils/logger.ts` 的功能升级迁移到 `core/logger/`，删除旧文件
- 替换全项目中的原始 `console.log/warn/error` 调用为 `core/logger/` 的统一日志 API
- 保持 `core/message-log/` 不变——它已在正确位置，专注玩家可见的游戏消息
- 从 `shared/utils/index.ts` 中移除 `logger` 和 `LogLevel` 的导出
- `core/logger/` 和 `core/message-log/` 明确分工：logger 面向开发者 F12 控制台，message-log 面向玩家游戏内消息框

## Capabilities

### New Capabilities

- `logger-core`: 系统运行日志核心——分级日志记录器（debug/info/warn/error）、模块命名空间、生产环境过滤、与 console 对接，放在 `core/logger/`

### Modified Capabilities

无——`message-log-core`、`message-log-decorators`、`message-log-templates` 的规范行为不变，本次仅新增 logger 模块并替换旧代码。

## Impact

- **新增** `src/core/logger/` 目录（约 4-5 个文件：`index.ts`、`types.ts`、`logger.ts`、`__tests__/`）
- **删除** `src/shared/utils/logger.ts`
- **修改** `src/shared/utils/index.ts`（移除 logger/LogLevel 导出）
- **修改** 约 15-20 个文件中使用 `console.log/warn/error` 的地方，替换为 logger API
- **不影响** `src/core/message-log/`（游戏消息系统独立运作，不涉及本次变更）
- **不影响** `components/ui/` 中 shadcn 组件的 `console` 调用（shadcn 源文件不修改）
