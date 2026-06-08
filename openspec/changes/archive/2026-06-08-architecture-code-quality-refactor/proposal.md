## Why

The codebase has accumulated significant architectural debt since initial development: 54 flat files in `lib/game/` without domain organization, React components living in `lib/` (violating core architecture rules), `useGameState.tsx` at 2553 lines (12.7× the 200-line hook limit), and most component files exceeding the 300-line cap. This debt makes incremental feature development increasingly difficult — adding a new game system requires navigating an inconsistent directory structure, modifying monolithic files, and risking side effects in intertwined modules. Without refactoring now, each new feature will compound these problems, leading to an unmaintainable codebase.

## What Changes

- **`lib/game/` reorganization**: Move 54 flat files into domain-based subdirectories (`adventure/`, `achievement/`, `cultivation/`, `skill/`, `statistics/`, `economy/`, etc.) following the module organization template
- **Fix architecture boundary violations**: Move `WorldTextContext.tsx` from `lib/text/` to `contexts/`, move `useGameText.tsx` from `lib/text/hooks/` to `hooks/text/`
- **`useGameState.tsx` decomposition**: Split the 2553-line monolithic hook into focused modules — `state/` types, `reducer/` with pure reducers, `actions/` for dispatch builders, and `GameProvider.tsx` for the context provider
- **Oversized component splits**: Decompose `FactionPanel.tsx` (1127 lines), `MainGame.tsx` (1005 lines), `DeveloperPanel.tsx` (864 lines), `SkillManagePanel.tsx` (721 lines), and `GamePage.tsx` (614 lines) into sub-components with focused responsibilities
- **Directory naming consistency**: Rename `components/game/MainGame/` → `components/game/main-game/`
- **Orphaned files placement**: Move `RestraintChart.tsx`, `SkillManageDialog.tsx`, `SkillManagePanel.tsx`, `SkillsUnlockDialog.tsx` from `components/game/` root into appropriate subdirectories
- **Barrel export completeness**: Add `index.ts` to all directories with exported modules (`lib/data/`, `lib/game/shop/`, `lib/config/`, `lib/util/`, and others)
- **`features/` redefinition**: Either populate `features/` with actual business orchestration (composing lib + hooks) or consolidate with `components/game/` — currently it's a hollow re-export layer
- **Merge duplicate directories**: Consolidate `lib/calculation/service/` and `lib/calculation/services/`, merge `lib/gameData/` into `lib/data/`
- **Remove duplicate files**: Eliminate `enemyTechniqueEquipment.ts` in favor of `enemy/techniqueEquipment.ts`
- **Utility consolidation**: Unify scattered utilities from `src/utils/`, `src/lib/utils.ts`, `src/lib/util/`, `src/hooks/utils/` into a coherent structure
- **Pure function enforcement**: Make all `lib/game/` functions accept random seeds instead of calling `Math.random()`

## Capabilities

### New Capabilities
- `lib-game-reorganization`: 54 flat files in `lib/game/` organized into domain-based subdirectories with proper `index.ts` barrel exports
- `architecture-boundary-fix`: React code (WorldTextContext, useGameText) moved out of `lib/` to proper locations (`contexts/`, `hooks/`)
- `file-size-compliance`: All hooks ≤ 200 lines, all components ≤ 300 lines, all lib modules ≤ 500 lines enforced through decomposition
- `barrel-export-completeness`: All module directories with exported code have `index.ts` barrel exports
- `directory-naming-consistency`: All directories use kebab-case naming, no PascalCase directories
- `features-consolidation`: `features/` directory either populated as genuine orchestration layer or merged into `components/game/`
- `utility-consolidation`: Scattered utility modules consolidated into `src/utils/` and `src/lib/util/` with clear responsibilities
- `pure-function-compliance`: All `lib/game/` functions use seed-based randomness, making them deterministic and testable

### Modified Capabilities
- `type-system-consolidation`: Extension of the existing effort — `typesExtension.ts` content merged into appropriate domain type files, `lib/gameData/` types consolidated with `lib/data/`
- `code-splitting-plan`: Extension of the existing plan — actual implementation of the splits identified for oversized files with updated module boundaries

## Impact

- **All `src/lib/game/` modules** — files moved into subdirectories, imports updated across the entire codebase
- **`src/hooks/useGameState.tsx`** — decomposed into 4-6 focused modules in `src/hooks/game-state/`
- **`src/hooks/adventure/useAdventure.ts`** (2242 lines) and **`src/hooks/faction/useFaction.ts`** (1070 lines) — split into smaller hooks
- **12+ component files** — decomposed into focused sub-components
- **`src/features/`** — all files evaluated for removal or proper population
- **`src/lib/text/WorldTextContext.tsx`** → `src/contexts/`
- **`src/lib/text/hooks/useGameText.tsx`** → `src/hooks/text/`
- **`src/lib/gameData/`** → merged into `src/lib/data/`
- **20+ directories** — new `index.ts` barrel exports added
- **Imports in 100+ files** — paths updated due to reorganized module structure
- **Zero functional changes** — all game systems, APIs, and user-facing behavior remain identical
