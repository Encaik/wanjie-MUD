# file-size-compliance

## Purpose

Enforce the file size limits defined in the project's core constraints: components ≤ 300 lines, hooks ≤ 200 lines, lib modules ≤ 500 lines. Currently, most files exceed these limits, with some (useGameState at 2553 lines) exceeding by 12×.

## ADDED Requirements

### Requirement: useGameState decomposition
`src/hooks/useGameState.tsx` (2553 lines) SHALL be decomposed into focused modules within `src/hooks/game-state/`, each ≤ 400 lines. The original export name `useGameState` SHALL remain as a re-export for backward compatibility.

#### Scenario: Module count
- **WHEN** decomposition is complete
- **THEN** the `hooks/game-state/` directory contains at least 5 and no more than 8 files, each ≤ 400 lines

#### Scenario: API compatibility
- **WHEN** consumers import `useGameState` from `@/hooks/useGameState`
- **THEN** the API shape (returned object) is identical to before decomposition

#### Scenario: Test suite passes
- **WHEN** running `pnpm test` after decomposition
- **THEN** all existing tests pass without modification

### Requirement: useAdventure decomposition
`src/hooks/adventure/useAdventure.ts` (2242 lines) SHALL be split into sub-hooks by feature area, each ≤ 400 lines. A facade hook `useAdventure` SHALL compose the sub-hooks.

#### Scenario: Sub-hook extraction
- **WHEN** decomposition is complete
- **THEN** the `hooks/adventure/` directory contains separate hooks for exploration, combat, events, and rewards

#### Scenario: Facade compatibility
- **WHEN** consumers call `useAdventure()`
- **THEN** the returned object shape matches the pre-split API

### Requirement: useFaction decomposition
`src/hooks/faction/useFaction.ts` (1070 lines) SHALL be split into sub-hooks, each ≤ 400 lines, with a facade hook preserving API compatibility.

#### Scenario: Faction hook decomposition
- **WHEN** decomposition is complete
- **THEN** `hooks/faction/` contains focused sub-hooks for tasks, reputation, shop, and roster

### Requirement: Component size enforcement
Each component file in `src/components/game/`, `src/components/pages/`, and `src/components/layout/` SHALL be ≤ 300 lines. Files exceeding this limit SHALL be split into sub-components.

#### Scenario: Top 5 offenders fixed
- **WHEN** component decomposition is complete
- **THEN** FactionPanel.tsx, MainGame.tsx, DeveloperPanel.tsx, SkillManagePanel.tsx, and GamePage.tsx are each ≤ 300 lines

#### Scenario: All components compliant
- **WHEN** running `pnpm check-sizes`
- **THEN** zero component files exceed 300 lines

### Requirement: Lib module size enforcement
Each file in `src/lib/game/` SHALL be ≤ 500 lines. Files exceeding this limit SHALL be split by sub-feature.

#### Scenario: Top lib offenders fixed
- **WHEN** lib decomposition is complete
- **THEN** adventure.ts, expansionLogic.ts, types.ts, fragmentSystem.ts, and typesExtension.ts are each ≤ 500 lines

#### Scenario: Lib size check passes
- **WHEN** running `pnpm check-sizes`
- **THEN** zero lib files exceed the applicable limit
