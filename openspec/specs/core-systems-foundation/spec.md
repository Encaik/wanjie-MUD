# core-systems-foundation

## Purpose

定义 `src/core/` 核心系统层的目录结构、依赖约束和代码规范。该层存放构成游戏运行必备的基础设施（事件总线、数值计算引擎、世界系统、注册中心、Mod 系统、引擎集成层），是项目的最底层运行时依赖。

## Requirements

### Requirement: core 目录结构
项目 SHALL 在 `src/` 下维护一个 `core/` 顶级目录，存放构成游戏运行必备基础设施的核心系统，包含以下子目录：

- `core/events/` — 事件驱动通信系统
- `core/types/` — 核心游戏类型定义
- `core/calculation/` — 统一数值计算引擎
- `core/world/` — 世界生成与管理
- `core/registry/` — 数据注册中心
- `core/mod/` — Mod 加载与验证
- `core/engine/` — 跨系统集成层

每个子目录 MUST 包含 `index.ts` 桶导出文件。

#### Scenario: core 目录作为顶级目录存在
- **WHEN** 查看 `src/` 目录
- **THEN** 必须看到 `core/` 与 `app/`、`views/`、`modules/`、`shared/` 并列存在

#### Scenario: core 子目录完整性
- **WHEN** 检查 `core/` 目录
- **THEN** 必须包含 `events/`、`types/`、`calculation/`、`world/`、`registry/`、`mod/`、`engine/` 七个子目录，每个均含 `index.ts`

### Requirement: core 层依赖隔离
`core/` 中的代码 SHALL NOT 依赖 `modules/` 中的任何代码。`core/` 是项目的最底层运行时依赖，只能依赖自身内部的子目录或外部库。

#### Scenario: 防止循环依赖
- **WHEN** 在 `core/` 中编写代码
- **THEN** 不得出现 `import ... from '@/modules/...'` 语句

#### Scenario: 核心类型独立
- **WHEN** 在 `core/types/` 中定义游戏核心类型
- **THEN** 类型定义不得引用 `modules/` 中的领域类型（如 `BattleState`、`ShopState`）

### Requirement: core 层代码约束
`core/` 中的代码 SHALL 遵循以下约束：
- 只包含纯逻辑基础设施（事件总线、计算引擎、注册中心等）
- 不包含 React 组件或 Hooks
- 不包含面向用户的业务逻辑（业务逻辑属于 `modules/`）
- SHALL NOT 硬编码任何世界观特定的属性名（如 `体质`、`灵根`）。属性集合 SHALL 由 `WorldviewDefinition.attributes` 元数据定义
- 可包含必要的 browser API 调用（如 IndexedDB 消息存储）

#### Scenario: 无 React 依赖
- **WHEN** 检查 `core/` 目录中的所有 `.ts` 文件
- **THEN** 不得出现 `import ... from 'react'` 或 JSX 语法

#### Scenario: 无业务逻辑
- **WHEN** 在 `core/` 中编写代码
- **THEN** 代码必须是基础设施性质（事件、计算、世界生成、Mod 加载等），不得包含面向特定玩法功能的逻辑（如修炼流程、战斗规则、商店逻辑）

#### Scenario: 无硬编码属性名
- **WHEN** 搜索 `core/` 目录中的 `.ts` 文件
- **THEN** SHALL NOT 存在作为 JS 属性名的中文字符串硬编码（如 `.体质`、`.灵根`）
- **AND** 属性访问 SHALL 通过 `Record<string, number>` 的 key 索引或 `AttributeDefinition` 元数据驱动

### Requirement: core 类型层新增类型

`core/types/` SHALL 新增以下类型定义：

- `AttributeDefinition`、`AttributeCategory`、`AttributeCalculation` — 属性元数据
- `CoreStatKey`、`CoreStatBaseValues`、`CoreStats` — 核心值系统
- `RaceDefinition`、`InnateAbility` — 种族系统
- `TalentDefinition`、`TalentEffect` — 天赋系统
- `DialogueCheck`、`CheckResult` — 对话检定系统

`BaseStats` / `GrowthStats` 接口 SHALL 转为 deprecated type alias 指向 `Record<string, number>`，并在所有引用消除后移除。

#### Scenario: 新类型可用
- **WHEN** 从 `@/core/types` 导入 `AttributeDefinition`、`CoreStatKey`、`RaceDefinition` 等新类型
- **THEN** 导入成功，类型定义完整且可通过 TS 类型检查

#### Scenario: BaseStats 向后兼容
- **WHEN** 过渡期代码 `import type { BaseStats } from '@/core/types'`
- **THEN** 导入成功（作为 `Record<string, number>` 的别名）
- **AND** 编译器 SHALL 发出 deprecated 警告

### Requirement: shared/ 精简
`shared/lib/` SHALL 只保留跨模块工具性代码：AI 调用工具、WebSocket 基础设施、多人游戏基础设施。原有的事件系统、类型定义、计算引擎、世界系统、注册中心、Mod 系统 SHALL 从 `shared/lib/` 移除（通过 barrel re-export 过渡）。

#### Scenario: shared/lib/ 不含核心系统
- **WHEN** 完成迁移后检查 `shared/lib/` 目录
- **THEN** 不得存在 `events/`、`types.ts`、`typesExtension.ts`、`calculation/`、`world/`、`registry/`、`mod/`、`gameSystems.ts`、`expansionLogic.ts`、`messageDB.ts` 的实际内容（允许 barrel re-export）

#### Scenario: shared/ 保留工具性代码
- **WHEN** 完成迁移后检查 `shared/` 目录
- **THEN** `shared/lib/ai/`、`shared/lib/websocket/`、`shared/lib/multiplayer/` 保持完整可用

### Requirement: 向后兼容过渡
迁移期间，`shared/lib/` 中的旧路径 SHALL 通过 barrel re-export 指向 `core/` 新路径，确保现有代码不中断。

#### Scenario: 旧路径仍可用
- **WHEN** 代码使用 `import { GameEventManager } from '@/shared/lib/events'` 导入
- **THEN** 导入成功，实际加载的是 `core/events/` 中的模块

#### Scenario: 新路径可用
- **WHEN** 代码使用 `import { GameEventManager } from '@/core/events'` 导入
- **THEN** 导入成功，直接从 `core/events/` 加载
