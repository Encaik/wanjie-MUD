## Why

当前事件总线存在严重架构问题：核心代码与副本代码**完全重复**（`core/events/eventManager.ts` 与 `modules/exploration/logic/dungeon/eventManager.ts` 内容一致），且新增事件类型需要**修改核心事件系统源码**（枚举 + 负载接口），违反开闭原则。每次新增业务功能的事件类型都牵动核心代码，开发和维护成本高、出错风险大。

## What Changes

- **BREAKING**：删除 `modules/exploration/logic/dungeon/eventManager.ts`（与 core 完全重复的副本），统一使用 core 事件总线
- **BREAKING**：删除 `modules/social/announcementTypes.ts` 中独立定义的 `GameEventType` 枚举，统一使用 core 事件类型
- 重构 `core/events/eventManager.ts`：将事件类型枚举改为**字符串联合类型**，移除 `EventPayloadMap` 强耦合接口，改为泛型参数
- 新增强大的事件注册机制：各模块通过**声明式配置**注册自有事件类型，无需修改 core 代码
- 新增强大的事件匹配/过滤：支持通配符匹配（如 `combat:*`）、条件过滤函数
- 新增 `once()` 一次性订阅、`removeListener()` 精确取消、优先级/异步支持
- 所有现有 callers（`gameSystems.ts`、`achievementSystem.ts`、`collectionSystem.ts`、`theme/events.ts`）迁移至新 API

## Capabilities

### New Capabilities
- `event-registry`: 事件类型注册中心——模块可声明式注册自定义事件类型，无需修改 core 源码
- `event-pattern-matching`: 事件模式匹配——支持通配符订阅（如 `combat:*`）和条件过滤，减少样板代码
- `event-api-enhance`: 增强型事件 API——`once()`、`removeListener()`、优先级排序、异步处理、错误恢复

### Modified Capabilities
<!-- 本次为全新能力，不修改现有规格 -->

## Impact

- **直接修改**：`src/core/events/eventManager.ts`（完全重写）、`src/core/events/types.ts`（可能需要更新）
- **删除文件**：`src/modules/exploration/logic/dungeon/eventManager.ts`（重复副本）
- **需迁移的 callers**：`src/core/engine/gameSystems.ts`、`src/modules/collection/logic/achievement/achievementSystem.ts`、`src/modules/collection/logic/collectionSystem.ts`、`src/modules/theme/events.ts`
- **间接影响**：`src/modules/social/announcementTypes.ts`（独立 GameEventType 需统一）
- **依赖关系**：`core/events/` 是基础层，不依赖 modules，本次重构保持此约束
