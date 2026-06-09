## MODIFIED Requirements

### Requirement: typesExtension merged into domain types
The file `src/lib/game/typesExtension.ts` (917 lines, containing ascension flow state and extended game state types) SHALL be split and merged into the domain feature directories created by this refactoring.

#### Scenario: Ascension types in ascension domain
- **WHEN** domain refactoring creates `modules/ascension/`
- **THEN** ascension-related types from `typesExtension.ts` are moved to `modules/ascension/types.ts`

#### Scenario: Extended state types distributed to domains
- **WHEN** remaining types are distributed
- **THEN** generic extensions to `GameState` and `Protagonist` are moved to the respective domain `types.ts` files (progression, exploration, combat, equipment, faction, collection, ascension)

#### Scenario: typesExtension removed
- **WHEN** all content is relocated to domain feature directories
- **THEN** `src/lib/game/typesExtension.ts` is deleted and all imports are updated to `@/modules/<domain>/types`

### Requirement: 类型导出统一
All domain types SHALL be exported from their domain's `index.ts`, and shared core types remain in `src/lib/game/types.ts`.

#### Scenario: 导入路径规范
- **WHEN** 组件或 Hook 需要某个类型
- **THEN** 核心类型从 `@/lib/game/types` 导入，领域特有类型从 `@/modules/<domain>` 导入

#### Scenario: 删除重复类型
- **WHEN** 域重构完成
- **THEN** `src/types/game.ts` 中与 `src/lib/game/types.ts` 重复的 `GameState`、`Protagonist`、`MessageRecord`、`ActionResult`、`CraftingState`、`ForgingState` 定义被删除，改为从 `@/lib/game/types` 重新导出

## ADDED Requirements

### Requirement: 域类型自包含
Each domain directory SHALL contain a `types.ts` that defines the domain's Slice, Action types, and all domain-specific interfaces.

#### Scenario: 域类型结构
- **WHEN** 查看任意域的 `types.ts`
- **THEN** 文件包含 Slice interface、Action union type、domain-specific interfaces/enums，所有类型通过域 `index.ts` 导出
