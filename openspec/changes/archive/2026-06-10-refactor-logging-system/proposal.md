## Why

当前游戏消息（`MessageRecord`）的生成散落在各模块的 Hook 和 logic 中，没有统一的消息创建入口。消息类型仅有 `success/failure/info/warning` 四级，缺乏按业务域分类（战斗消息、修炼消息、系统消息等）。消息与事件系统脱节——触发事件的地方通常需要手动构造消息，导致重复代码。

同时，项目五层架构中缺少专门的消息记录核心模块。`messageDB.ts` 位于 `core/engine/` 但仅负责 IndexedDB 持久化，不负责消息的创建、分发和格式化。需要一个独立的 `core/message-log/` 核心子系统，作为所有游戏消息的统一入口。

## What Changes

- 新建 `core/message-log/` 模块，作为游戏消息记录的**核心基础设施**，与代码级 `console.log` 明确区分
- 引入**消息通道（MessageChannel）**概念，按业务域分类：`combat`、`cultivation`、`exploration`、`system` 等。新增通道只需声明配置，核心代码零修改
- 引入**装饰器** `@GameMessage`：在方法上标注，自动将方法执行结果转化为消息框中的游戏消息，无需手动构造 `MessageRecord`
- 与事件系统深度集成：`MessageManager` 订阅 `GameEventManager`，事件触发时通过**消息模板**自动生成对应消息
- 支持**消息模板注册**：模块可注册 `eventType → message` 的转换模板，相同事件在不同模块可产生不同消息
- 从 `core/engine/` 中分离消息持久化职责（`messageDB.ts` 保持在 engine 中处理 IndexedDB，`message-log/` 专注消息创建与分发）— **BREAKING**：`MessageRecord` 类型可能扩展新字段

## Capabilities

### New Capabilities

- `message-log-core`: 核心消息管理器——MessageManager 单例、消息通道注册、消息创建与缓冲、消息事件发射
- `message-log-decorators`: 游戏消息装饰器——`@GameMessage` 方法装饰器、`@GameMessageClass` 类装饰器，自动将方法执行转化为游戏消息
- `message-log-templates`: 消息模板系统——事件到消息的转换模板注册，新模块声明模板即可自动获得事件消息，无需修改核心代码

### Modified Capabilities

无——`message-log` 是全新核心子系统，现有 `MessageRecord` 类型和 `messageDB.ts` 的持久化逻辑不受影响。

## Impact

- **新增** `src/core/message-log/` 目录（约 6-8 个文件）
- **新增** `tsconfig.json` 启用 `experimentalDecorators`（装饰器支持）
- **关联** `src/core/events/`（MessageManager 订阅 GameEventManager）
- **关联** `src/core/types/types.ts`（`MessageRecord` 类型可能新增 `channel` 字段）
- **关联** 各模块 `hooks/`（逐步将手动消息构造迁移到装饰器/模板）
- **不影响** `src/core/engine/messageDB.ts`（持久化层不变）
- **不影响** `src/shared/utils/logger.ts`（代码级日志保持独立）
