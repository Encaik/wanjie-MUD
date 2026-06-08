---
name: code-review
description: Review code changes for correctness bugs and reuse/simplification/efficiency cleanups, with 万界修行录-specific rules for directory compliance, file size, type safety, and game logic purity.
---

Review the current diff for correctness bugs and reuse/simplification/efficiency cleanups.

## Project-Specific Review Dimensions

When reviewing code for 万界修行录, apply these additional checks:

### 1. Directory Compliance
- Verify no React component or Hook exists in `src/lib/`
- Verify no custom code is added to `src/components/ui/` (shadcn is read-only)
- Verify new modules are exported in their `index.ts` barrel file
- Check that `src/features/` doesn't duplicate logic already in `src/lib/game/`

### 2. File Size Warnings
- Components: warn if > 300 lines (should split into sub-components)
- Hooks: warn if > 200 lines (should extract sub-hooks)
- Utility modules: warn if > 500 lines (should split by concern)
- Data files: warn if > 800 lines (should split by category)

### 3. Type Safety
- Flag all `any` type usage (ESLint enforces as error, exempt test files)
- Flag missing parameter/return type annotations on exported functions
- Flag `as` type assertions without justification comment
- Check for duplicate type definitions across multiple `types.ts` files

### 4. Game Logic Purity (src/lib/game/)
- Verify exported functions are pure (no Math.random(), no Date.now(), no DOM access)
- Verify random-dependent functions accept a seed parameter instead
- Flag side effects (parameter mutation, external state modification)

### 5. Anti-Patterns
- Hardcoded numeric values in components → suggest moving to balanceConfig.ts or data file
- Direct mutation of game state objects → suggest immutable update pattern
- Missing JSDoc on exported functions and interfaces
- Inline complex expressions in JSX → suggest extracting to named variables/functions
