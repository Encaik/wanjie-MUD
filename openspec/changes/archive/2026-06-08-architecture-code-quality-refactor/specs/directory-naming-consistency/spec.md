# directory-naming-consistency

## Purpose

Enforce consistent kebab-case naming for all directories under `src/`, eliminating the one PascalCase directory (`MainGame/`) and placing orphaned files into proper subdirectories.

## ADDED Requirements

### Requirement: All directories use kebab-case
Every directory under `src/` SHALL use kebab-case naming. The directory `src/components/game/MainGame/` SHALL be renamed to `src/components/game/main-game/`.

#### Scenario: MainGame renamed
- **WHEN** the rename is complete
- **THEN** `src/components/game/MainGame/` no longer exists and `src/components/game/main-game/` contains all original files

#### Scenario: Import paths updated
- **WHEN** any file imports from the MainGame directory
- **THEN** the import path is updated to reference `main-game/`

### Requirement: No PascalCase directories
A scan of all `src/` subdirectories SHALL find zero PascalCase directory names (excluding `__tests__` and `node_modules`).

#### Scenario: PascalCase scan
- **WHEN** running a directory name scan
- **THEN** no directories match the pattern `[A-Z][a-z]+` as their name component

### Requirement: Orphaned files in components/game placed into subdirectories
Files directly in `src/components/game/` that are not `index.ts` SHALL be moved into appropriate domain subdirectories.

#### Scenario: Orphaned files resolved
- **WHEN** file placement is complete
- **THEN** `RestraintChart.tsx`, `SkillManageDialog.tsx`, `SkillManagePanel.tsx`, and `SkillsUnlockDialog.tsx` are moved to `tabs/` or `shared/` subdirectories based on their usage context

#### Scenario: Clean game directory
- **WHEN** checking `src/components/game/`
- **THEN** only `index.ts` and domain subdirectories exist at the root level

### Requirement: Build and type check pass
After all renames and moves, `pnpm ts-check` and `pnpm build` SHALL pass.

#### Scenario: No broken imports
- **WHEN** running `pnpm ts-check`
- **THEN** zero import-related errors
