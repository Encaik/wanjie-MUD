# barrel-export-completeness

## Purpose

Ensure every directory containing exported TypeScript modules has an `index.ts` barrel export file. Currently, 35+ directories lack barrel exports, creating inconsistent import patterns and breaking the module organization standard.

## ADDED Requirements

### Requirement: Lib directories with barrel exports
Every subdirectory in `src/lib/` that contains exported `.ts` files SHALL have an `index.ts` barrel export.

#### Scenario: Missing lib barrels
- **WHEN** scanning `src/lib/` subdirectories
- **THEN** `lib/data/`, `lib/game/shop/`, `lib/game/utils/`, `lib/config/`, and `lib/util/` each contain valid `index.ts` files

#### Scenario: Barrel content
- **WHEN** checking each `index.ts`
- **THEN** it re-exports all public functions, types, and constants from the directory's modules using `export { ... } from './file'` syntax

### Requirement: Component directories with barrel exports
Every subdirectory in `src/components/game/` that contains component files SHALL have an `index.ts` barrel export.

#### Scenario: Page-level component barrels
- **WHEN** scanning `src/components/pages/`
- **THEN** `backstory/`, `character-select/`, `home/`, and `world-select/` each contain `index.ts`

### Requirement: Utils and tools directories with barrel exports
`src/utils/` and `src/hooks/utils/` SHALL have barrel exports for all exported utilities.

#### Scenario: Utils barrel
- **WHEN** importing from `@/utils`
- **THEN** the import resolves through `src/utils/index.ts`

### Requirement: Feature component barrels
Subdirectories within feature modules that contain components SHALL have `index.ts` exports.

#### Scenario: Cultivation features
- **WHEN** checking `src/features/cultivation/components/` and `src/features/cultivation/utils/`
- **THEN** each contains an `index.ts` barrel export

### Requirement: Barrel consistency enforcement
Running `pnpm ts-check` SHALL pass after all barrels are added, with no circular imports introduced.

#### Scenario: No circular dependencies
- **WHEN** all barrel exports are added
- **THEN** TypeScript compilation succeeds without circular reference errors

#### Scenario: Unused export verification
- **WHEN** a barrel re-exports a module
- **THEN** all re-exported names exist in the target module (no dangling exports)
