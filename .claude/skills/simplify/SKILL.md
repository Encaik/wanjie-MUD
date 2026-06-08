---
name: simplify
description: Review changed code for reuse, simplification, efficiency, and altitude cleanups, with 万界修行录-specific patterns for duplicate logic detection, component splitting, and dead code removal.
---

Review the changed code for reuse, simplification, efficiency, and altitude cleanups. Quality only — does not hunt for bugs; use /code-review for that.

## Project-Specific Simplification Patterns

When simplifying code for 万界修行录, apply these additional checks:

### 1. Duplicate Logic Detection
- Check `src/features/` does not duplicate logic already in `src/lib/game/` or `src/components/game/`
- Cross-reference `src/lib/game/` functions with `src/hooks/` to ensure hooks aren't re-implementing lib logic
- Detect similar patterns across different `src/lib/game/<domain>/` modules that could be generalized

### 2. Component Simplification
- Components > 250 lines → suggest extracting sub-components
- Inline render functions → suggest extracting as named components or hooks
- Props drilling > 3 levels → suggest Context or composition pattern
- Overly generic component with many conditional branches → suggest splitting into specialized variants

### 3. Library Code Simplification
- `src/lib/game/` functions > 100 lines → suggest breaking into smaller pure functions
- Repeated calculation patterns → suggest creating shared utility
- Deeply nested if/switch in game logic → suggest strategy pattern or lookup table
- Overly parameterized single function → suggest specialized wrapper functions

### 4. Dead Code & Unused Exports
- Remove unused imports (ESLint will flag)
- Remove unused type exports (check with `pnpm ts-check`)
- Remove unreachable code branches in game logic
- Remove commented-out code blocks (belongs in git history, not source)

### 5. Efficiency Improvements
- Inline expensive calculations in render → suggest useMemo
- Unstable callback references → suggest useCallback
- Large object spreads in hot loops → suggest mutation with care
- Repeated database queries in hooks → suggest caching layer
