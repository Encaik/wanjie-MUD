---
name: verify
description: Verify that a code change works by running tests, type checking, and building, with 万界修行录-specific commands and game logic regression checks.
---

Verify that a code change actually does what it's supposed to by running the app and observing behavior.

## Project-Specific Verification Commands

### 1. Quick Sanity Check
Run these commands to verify the change doesn't break anything:
```bash
pnpm ts-check    # TypeScript type checking (zero errors required)
pnpm test        # Vitest unit tests (all passing required)
pnpm build       # Next.js static export build (success required)
```

### 2. Full Quality Gate
For changes that touch core game logic:
```bash
pnpm lint:strict   # ESLint + file size check (zero warnings required)
pnpm test          # Full test suite
pnpm ts-check      # Type checking
pnpm build         # Production build
```

### 3. Game Logic Regression Checks
When changes modify `src/lib/game/` or `src/hooks/`:
- Run the full test suite: `pnpm test`
- If specific system is modified, run focused tests:
  ```bash
  npx vitest run src/tests/modules/<system>/
  ```
- Verify the dev server starts: `pnpm dev` (check for runtime errors)
- Verify build succeeds: `pnpm build`

### 4. ESLint Compliance
```bash
pnpm lint          # Check for new violations
pnpm lint:strict   # Zero-tolerance quality gate
```

### 5. What to Check For
- Type errors (ts-check catches most)
- Import path breakages (build catches these)
- State management regressions (test suite)
- Pure function side effects (manual review of lib/game changes)
- Component render errors (dev server smoke test)

### 6. Verification Report
After running verifications, report:
- Commands executed and their exit codes
- Any test failures with stack traces
- Any new ESLint violations
- Build warnings (if any)
- Summary: ✓ All clear or ✗ Issues found
