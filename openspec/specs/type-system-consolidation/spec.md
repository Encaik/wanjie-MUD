# type-system-consolidation

## Purpose

TBD — see change project-quality-foundation for full context.

## ADDED Requirements

### Requirement: 类型文件分布审计
项目 SHALL 审计全部 18+ 个 `types.ts` 文件，生成类型定义分布图和重复检测报告。

#### Scenario: 类型文件清单
- **WHEN** 扫描所有 types.ts 文件
- **THEN** 列出每个文件的路径、包含的类型/接口数量、主要用途域

#### Scenario: 重复类型检测
- **WHEN** 交叉对比所有类型定义
- **THEN** 输出重复（或高度相似）的类型定义列表，指出源位置和建议合并方向

### Requirement: 核心类型层级建立
项目 SHALL 在 `src/lib/game/types.ts` 中建立核心类型层级，作为项目的类型单一数据源。

#### Scenario: 基础类型定义
- **WHEN** 整合游戏核心类型
- **THEN** `src/lib/game/types.ts` 包含 GameState、Player、World、Item、Skill、Enemy 等顶层接口，其他 types.ts 通过 import 引用而非重复定义

#### Scenario: 领域类型分离
- **WHEN** 某个领域类型足够独立
- **THEN** 在领域内 `types.ts` 中定义领域特有类型，但必须通过 `extends` 继承核心类型，不得重新定义已有字段

### Requirement: typesExtension merged into domain types
The file `src/lib/game/typesExtension.ts` (917 lines, containing ascension flow state and extended game state types) SHALL be split and merged into the domain type files that use those types.

#### Scenario: Ascension types in ascension module
- **WHEN** typesExtension is split
- **THEN** ascension-related types are moved to `src/lib/game/ascension/types.ts`

#### Scenario: Extended state types in core types
- **WHEN** remaining types are merged
- **THEN** generic extensions to `GameState` are moved to `src/lib/game/types.ts`

#### Scenario: typesExtension removed
- **WHEN** all content is relocated
- **THEN** `src/lib/game/typesExtension.ts` is deleted and all imports are updated

### Requirement: gameData types consolidated
Types defined in `src/lib/gameData/` SHALL be merged into `src/lib/data/` when the directories are consolidated.

#### Scenario: Skill config types in data
- **WHEN** gameData is merged into data
- **THEN** types from `gameData/skillConfigs.ts` are accessible from `@/lib/data`

### Requirement: 类型导出统一
所有领域类型 SHALL 通过 `src/lib/game/types.ts` 或领域入口文件统一导出，不得有"散落导出"。`src/lib/game/typesExtension.ts` 的内容 SHALL 按域拆分并移入对应的 `types.ts` 文件中。

#### Scenario: 导入路径规范
- **WHEN** 组件或 Hook 需要某个类型
- **THEN** 优先从 `@/lib/game/types` 导入，仅在领域特有类型时从领域路径导入

#### Scenario: 桶文件维护
- **WHEN** 新增类型定义文件
- **THEN** 必须在对应的 `index.ts` 或桶文件中添加重导出，保持统一入口

### Requirement: 废弃类型清理
项目 SHALL 移除所有未被引用的类型定义，消除代码噪音。

#### Scenario: 未引用类型检测
- **WHEN** 运行类型使用分析
- **THEN** 输出所有未被任何文件导入的类型定义列表（排除测试文件引用）

#### Scenario: 安全清理
- **WHEN** 删除未引用类型
- **THEN** 通过 `tsc --noEmit` 确保编译无错误，通过 `pnpm build` 确保构建成功
