# features-consolidation

## Purpose

Resolve the ambiguous role of `src/features/` — currently a mostly-empty re-export layer that adds import indirection without providing the business orchestration it was designed for. Either properly populate it or consolidate it.

## ADDED Requirements

### Requirement: Features directory evaluated and resolved
The `src/features/` directory SHALL either be populated as a genuine business orchestration layer with unique content, or be removed with its content relocated to appropriate directories.

#### Scenario: Decision outcome
- **WHEN** evaluating each feature module
- **THEN** a documented decision is made for each: keep-and-populate or remove-and-relocate

### Requirement: Hollow re-exports eliminated
Feature modules that only re-export from `@/components/game/tabs` without adding orchestration logic SHALL be removed. Consumers of these re-exports SHALL import directly from `@/components/game/tabs`.

#### Scenario: Empty features removed
- **WHEN** checking `achievement/`, `adventure/`, `collection/`, `equipment/`, `shop/`, `technique/`
- **THEN** since each is ≤ 6 lines of re-exports, they are removed and their 2-3 consumers import directly from the source

### Requirement: Cultivation feature content relocated
The two components in `src/features/cultivation/components/` (`AutoCultivateToggle.tsx`, `PathInfoCard.tsx`) SHALL be moved to `src/components/game/tabs/` alongside the CultivationPanel they support.

#### Scenario: Component relocation
- **WHEN** the move is complete
- **THEN** the components are importable from `@/components/game/tabs` and the `features/cultivation/` directory is removed

### Requirement: Feature types merged
Types defined in `features/*/types.ts` that duplicate game types SHALL be merged into `src/lib/game/types.ts` or their domain's `types.ts`. Unique types SHALL be preserved in the appropriate domain directory.

#### Scenario: Type consolidation
- **WHEN** consolidating feature types
- **THEN** `features/adventure/types.ts`, `features/cultivation/types.ts`, and `features/faction/types.ts` are evaluated for uniqueness and merged accordingly

### Requirement: Architecture decision documented
The final state and rationale for `features/` SHALL be documented in `doc/architecture/module-map.md`.

#### Scenario: Architecture documentation
- **WHEN** the consolidation is complete
- **THEN** `doc/architecture/module-map.md` reflects the updated directory structure and explains the decision to remove or keep features/
