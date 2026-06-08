# type-system-consolidation (Delta)

## Purpose

Extends the existing `type-system-consolidation` spec with additional requirements for type file cleanup identified during the architecture audit.

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: 类型导出统一
所有领域类型 SHALL 通过 `src/lib/game/types.ts` 或领域入口文件统一导出，不得有"散落导出"。`src/lib/game/typesExtension.ts` 的内容 SHALL 按域拆分并移入对应的 `types.ts` 文件中。

#### Scenario: 导入路径规范
- **WHEN** 组件或 Hook 需要某个类型
- **THEN** 优先从 `@/lib/game/types` 导入，仅在领域特有类型时从领域路径导入

#### Scenario: 桶文件维护
- **WHEN** 新增类型定义文件或从 typesExtension 拆分类型
- **THEN** 必须在对应的 `index.ts` 或桶文件中添加重导出，保持统一入口
