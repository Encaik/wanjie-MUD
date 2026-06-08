# utility-consolidation

## Purpose

Consolidate utility functions scattered across four locations (`src/utils/`, `src/lib/utils.ts`, `src/lib/util/`, `src/hooks/utils/`) into a coherent structure with clear responsibilities.

## ADDED Requirements

### Requirement: Utility locations unified
Utility functions SHALL be consolidated into exactly two locations:
- `src/utils/` — General-purpose utilities not specific to the game domain (cn, format, logger)
- `src/lib/util/` — Game-specific pure utilities (type guards, calculations, data transforms)

#### Scenario: General utils in src/utils
- **WHEN** the consolidation is complete
- **THEN** `src/utils/` contains `cn.ts`, `logger.ts`, and an `index.ts` barrel export

#### Scenario: Game utils in lib/util
- **WHEN** the consolidation is complete
- **THEN** `src/lib/util/` contains game-specific utilities with `index.ts` barrel export

### Requirement: Hooks utils moved to lib
The utilities in `src/hooks/utils/` SHALL be evaluated: pure functions (like `inventoryUtils.ts`) moved to `src/lib/game/utils/`; state-specific helpers kept in `src/hooks/game-state/` (to be co-located with the decomposed useGameState).

#### Scenario: Hook utils relocated
- **WHEN** the move is complete
- **THEN** `src/hooks/utils/` no longer exists; its contents are in `src/lib/game/utils/` or `src/hooks/game-state/` as appropriate

### Requirement: Merged lib/gameData into lib/data
`src/lib/gameData/` SHALL be merged into `src/lib/data/`, eliminating the redundant data directory.

#### Scenario: gameData files in data
- **WHEN** the merge is complete
- **THEN** `skillConfigs.ts`, `techniqueConfigs.ts`, and `weaponConfigs.ts` are in `src/lib/data/` with appropriate barrel exports

#### Scenario: Import paths updated
- **WHEN** consumers import from `@/lib/gameData`
- **THEN** they are updated to import from `@/lib/data` or `@/lib/data/<file>`

### Requirement: Calculation service directory cleanup
The duplicate `src/lib/calculation/service/` directory SHALL be merged into `src/lib/calculation/services/`.

#### Scenario: Single services directory
- **WHEN** the merge is complete
- **THEN** `src/lib/calculation/service/` no longer exists; all content is in `src/lib/calculation/services/`

### Requirement: No orphaned utility files
After consolidation, `src/lib/utils.ts` (standalone file) SHALL be removed; its `cn()` function SHALL move to `src/utils/cn.ts`.

#### Scenario: Standalone lib file removed
- **WHEN** checking `src/lib/`
- **THEN** `utils.ts` no longer exists; `cn()` is importable from `@/utils`
