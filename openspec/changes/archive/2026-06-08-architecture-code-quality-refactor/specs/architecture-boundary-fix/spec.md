# architecture-boundary-fix

## Purpose

Fix violations of the core architecture rule that `src/lib/` must not contain React components, hooks, or client-side code. Two files in `src/lib/text/` violate this rule: `WorldTextContext.tsx` (a React context) and `hooks/useGameText.tsx` (a React hook).

## ADDED Requirements

### Requirement: WorldTextContext relocated to contexts
The file `src/lib/text/WorldTextContext.tsx` SHALL be moved to `src/contexts/WorldTextContext.tsx`.

#### Scenario: Context in correct directory
- **WHEN** the move is complete
- **THEN** `src/contexts/WorldTextContext.tsx` exists and `src/lib/text/WorldTextContext.tsx` is deleted

#### Scenario: Import paths updated
- **WHEN** any file imports WorldTextContext
- **THEN** the import path is `@/contexts/WorldTextContext` or `@/contexts`

### Requirement: useGameText relocated to hooks
The file `src/lib/text/hooks/useGameText.tsx` SHALL be moved to `src/hooks/text/useGameText.ts`.

#### Scenario: Hook in correct directory
- **WHEN** the move is complete
- **THEN** `src/hooks/text/useGameText.ts` exists and `src/lib/text/hooks/useGameText.tsx` is deleted

#### Scenario: Hook import paths updated
- **WHEN** any file imports useGameText
- **THEN** the import path is `@/hooks/text/useGameText` or `@/hooks/text`

### Requirement: Pure text functions remain in lib
The remaining files in `src/lib/text/` (text resolver, world text data, types) SHALL remain in `lib/text/` as they are pure functions and data that do not import React.

#### Scenario: Lib purity maintained
- **WHEN** checking all remaining files in `src/lib/text/`
- **THEN** no file imports anything from `'react'` or uses `'use client'` directive

### Requirement: Build verification
After all moves, `pnpm ts-check` and `pnpm build` SHALL pass without errors.

#### Scenario: Type checking passes
- **WHEN** running `pnpm ts-check`
- **THEN** zero type errors

#### Scenario: Build succeeds
- **WHEN** running `pnpm build`
- **THEN** the static export builds successfully
