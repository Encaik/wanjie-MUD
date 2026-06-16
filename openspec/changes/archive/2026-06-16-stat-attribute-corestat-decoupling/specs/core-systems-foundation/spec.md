# core-systems-foundation (Delta)

## MODIFIED Requirements

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
