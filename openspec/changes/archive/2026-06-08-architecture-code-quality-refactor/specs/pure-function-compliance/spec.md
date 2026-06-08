# pure-function-compliance

## Purpose

Enforce the core constraint that all functions in `src/lib/game/` must be pure: same inputs → same outputs, no side effects, no `Math.random()` without a seed parameter. Currently, `adventure.ts`, `adventureBattleNew.ts`, `ascensionLogic.ts`, and other files use `Math.random()` extensively.

## ADDED Requirements

### Requirement: Seed-based RNG utility
A deterministic random number generator utility SHALL be added to `src/lib/game/utils/` that accepts a numeric seed and returns a function producing reproducible random sequences.

#### Scenario: RNG reproducibility
- **WHEN** two calls are made with the same seed
- **THEN** both produce identical sequences of random numbers

#### Scenario: RNG interface
- **WHEN** a lib function needs randomness
- **THEN** it accepts an `rng: () => number` parameter rather than calling `Math.random()` directly

### Requirement: Battle module pure refactor
Files in `src/lib/game/battle/` that use `Math.random()` SHALL be refactored to accept an `rng` parameter with a seed-based implementation.

#### Scenario: Battle functions deterministic
- **WHEN** a battle function is called with the same inputs and seed
- **THEN** it produces identical results every time

#### Scenario: Battle tests use fixed seeds
- **WHEN** battle unit tests run
- **THEN** they use fixed seeds to produce deterministic, reproducible results

### Requirement: Adventure module documented for Phase 2
Files in `src/lib/game/adventure/` that use `Math.random()` SHALL include a `@note` JSDoc tag documenting the deviation and linking to the follow-up issue for seed-based refactoring.

#### Scenario: JSDoc notes added
- **WHEN** checking adventure module files
- **THEN** each file with `Math.random()` includes `@note Uses Math.random() — to be refactored to seed-based RNG in follow-up change`

### Requirement: Pure function line items
After refactoring, zero files in `src/lib/game/battle/` SHALL contain `Math.random()` calls.

#### Scenario: Battle purity verified
- **WHEN** grepping `src/lib/game/battle/` for `Math.random`
- **THEN** zero matches are found
