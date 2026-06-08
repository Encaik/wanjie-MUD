# lib-game-reorganization

## Purpose

Organize 54 flat files in `src/lib/game/` into domain-based subdirectories, following the module organization template from project rules. This eliminates the "flat file sprawl" problem where related files are scattered and hard to discover.

## ADDED Requirements

### Requirement: Domain subdirectory structure
All files in `src/lib/game/` SHALL be organized into domain subdirectories, each following the pattern `types.ts + <feature>.ts + index.ts`.

#### Scenario: Flat files moved to domains
- **WHEN** the reorganization is complete
- **THEN** no `.ts` files remain directly in `src/lib/game/` except `index.ts`, `types.ts`, `constants.ts`, `balanceConfig.ts`, `typeGuards.ts`, `items.ts`, `quality.ts`, `generators.ts`, and the `utils/` directory

#### Scenario: Domain completeness
- **WHEN** checking each domain subdirectory
- **THEN** each subdirectory contains an `index.ts` barrel export that re-exports all public functions from the domain

### Requirement: Adventure domain
Files related to the adventure system SHALL be grouped into `src/lib/game/adventure/`: `adventure.ts`, `adventureBattleIntegration.ts`, `adventureBattleNew.ts`, and `adventureStamina.ts`.

#### Scenario: Adventure imports
- **WHEN** a module imports adventure functions
- **THEN** the import path is `@/lib/game/adventure` (via barrel) or `@/lib/game/adventure/<file>` for specific functions

### Requirement: Skill domain
Files related to the skill system SHALL be grouped into `src/lib/game/skill/`: `skillTypes.ts`, `skillGenerator.ts`, `skillEquipSystem.ts`, and `battleSkillIntegration.ts`.

#### Scenario: Skill domain barrel
- **WHEN** importing skill functions
- **THEN** all skill exports are accessible from `@/lib/game/skill`

### Requirement: Statistics domain
Files related to statistics SHALL be grouped into `src/lib/game/statistics/`: `statisticsSystem.ts` and `statisticsUtils.ts`.

#### Scenario: Statistics consolidation
- **WHEN** importing statistics functions
- **THEN** all statistics exports are accessible from `@/lib/game/statistics`

### Requirement: Achievement domain
Files related to achievements SHALL be grouped into `src/lib/game/achievement/`: `achievementSystem.ts` and `achievementUtils.ts`.

#### Scenario: Achievement module structure
- **WHEN** importing achievement functions
- **THEN** all achievement exports are accessible from `@/lib/game/achievement`

### Requirement: Time system domain
Files related to time management SHALL be grouped into `src/lib/game/time/`: `timeManager.ts`, `timeSystem.ts`, and `offlineProcessor.ts`.

#### Scenario: Time domain barrel
- **WHEN** importing time functions
- **THEN** all time-related exports are accessible from `@/lib/game/time`

### Requirement: Root index re-exports
`src/lib/game/index.ts` SHALL re-export all domain barrels to maintain backward-compatible imports.

#### Scenario: Backward compatible imports
- **WHEN** existing consumers import from `@/lib/game` or `@/lib/game/<file>`
- **THEN** the import resolves correctly through the barrel chain without modification

### Requirement: Enemy duplicate removal
The flat file `enemyTechniqueEquipment.ts` SHALL be removed in favor of the already-existing `enemy/techniqueEquipment.ts`.

#### Scenario: Single source of truth
- **WHEN** the duplicate is removed
- **THEN** all imports of `enemyTechniqueEquipment` are redirected to `enemy/techniqueEquipment` and type checking passes
