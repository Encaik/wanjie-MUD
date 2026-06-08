## Context

The current codebase is a Next.js 16 text-based cultivation MUD game with ~200 TypeScript files across 12 top-level directories. The project has well-defined architecture rules in [CLAUDE.md](CLAUDE.md) and [.claude/rules/](.claude/rules/), but the implementation has drifted from these rules over time.

**Current state by directory:**

| Directory | Files | Issues |
|-----------|-------|--------|
| `lib/game/` | 54 flat files + 12 subdirectories | No domain organization, files at root level |
| `hooks/` | 10 files + 6 subdirectories | `useGameState.tsx` at 2553 lines, hook sizes 5-12× over limit |
| `components/game/` | 50+ files | Most exceed 300 lines, 4 orphaned at root, `MainGame/` uses PascalCase |
| `features/` | 8 subdirectories | Mostly empty; re-exports from `components/game/` |
| `lib/text/` | ~15 files | Contains React Context and Hook (boundary violation) |
| `lib/calculation/` | ~20 files | Has both `service/` and `services/` directories |
| `lib/data/` | 26 files | No barrel export |
| `lib/gameData/` | 4 files | Duplicates `lib/data/` purpose |

**Key constraints:**
- All changes must be zero-impact on user-facing functionality
- `lib/` must contain only pure functions (no React, no DOM, no side effects)
- Components ≤ 300 lines, hooks ≤ 200 lines, lib modules ≤ 500 lines
- Imports must use `@/` aliases or relative paths ≤ 2 levels deep
- Every directory with exported modules must have `index.ts`

## Goals / Non-Goals

**Goals:**
1. Reorganize `lib/game/` into domain-based subdirectories while keeping all barrel exports valid
2. Decompose all files exceeding size limits into focused, single-responsibility modules
3. Fix architecture boundary violations (React code in `lib/`)
4. Unify naming conventions (kebab-case directories, consistent file naming)
5. Ensure every module directory has complete barrel exports
6. Consolidate duplicate/overlapping directories and files
7. Consolidate scattered utility functions into coherent locations
8. Replace `Math.random()` with seed-based randomness across `lib/game/`

**Non-Goals:**
- Changing any game mechanics, balance values, or user-facing behavior
- Adding new features or game systems
- Modifying shadcn/ui components in `components/ui/`
- Changing the Next.js routing or page structure
- Refactoring the WebSocket implementation (`lib/websocket/`)
- E2E test architecture changes
- Supabase/storage layer modifications
- CSS/Tailwind restructuring

## Decisions

### D1: `lib/game/` Reorganization Strategy

**Decision:** Group flat files into 12 domain subdirectories, each following the `types.ts + <module>.ts + index.ts` pattern from [module standards](.claude/rules/modules.md).

**Target structure:**
```
lib/game/
├── index.ts              # Re-exports all domain barrels
├── types.ts              # Core shared types (already exists)
├── constants.ts          # Game constants
├── balanceConfig.ts      # Balance configuration
├── typeGuards.ts         # Type guard utilities
├── adventure/
│   ├── index.ts
│   ├── types.ts
│   ├── adventure.ts         # From adventure.ts
│   ├── battleIntegration.ts  # From adventureBattleIntegration.ts
│   ├── battleNew.ts          # From adventureBattleNew.ts
│   └── stamina.ts            # From adventureStamina.ts
├── achievement/
│   └── ...
├── ascension/
│   └── ... (already well-structured)
├── battle/                    # Already structured, add barrel
│   └── ...
├── cultivation/
│   ├── cultivation.ts        # From cultivation.ts
│   └── seclusion.ts           # From seclusion.ts
├── economy/                   # Already structured
│   └── ...
├── enemy/                     # Already structured, absorb enemyEnhancement.ts
│   └── ...
├── equipment/
│   ├── equipment.ts           # From equipment.ts
│   └── ...
├── skill/
│   ├── skillTypes.ts          # From skillTypes.ts
│   ├── skillGenerator.ts      # From skillGenerator.ts
│   ├── skillEquipSystem.ts    # From skillEquipSystem.ts
│   └── battleSkillIntegration.ts # From battleSkillIntegration.ts
├── statistics/
│   ├── statisticsSystem.ts    # From statisticsSystem.ts
│   └── statisticsUtils.ts     # From statisticsUtils.ts
├── items.ts                   # Standalone (within 500 lines)
├── quality.ts                 # Standalone
├── generators.ts              # Standalone
└── utils/                     # New: consolidate scattered utils
```

**Alternatives considered:**
- **Flatter structure** (5-8 domains) — rejected: too coarse, files would still be bloated
- **Deeper nesting** — rejected: violates relative import depth limit
- **Keep flat + add barrel** — rejected: doesn't solve the discovery problem; 54 flat files is unmanageable

### D2: `useGameState.tsx` Decomposition Pattern

**Decision:** Split into a directory with focused modules, with the original `useGameState` as a re-export bridge for backward compatibility.

**Target structure:**
```
hooks/game-state/
├── index.ts                  # Re-exports useGameState for compat
├── types.ts                  # State types (extracted from inline)
├── GameProvider.tsx           # React context provider (~300 lines)
├── gameReducer.ts            # Pure reducer function (~400 lines)
├── initialState.ts           # Default state definition (~200 lines)
├── saveActions.ts            # Save/load/export actions (~300 lines)
├── playerActions.ts          # Player state mutation actions (~300 lines)
├── gameActions.ts            # Game phase/flow actions (~300 lines)
└── timeActions.ts            # Time/tick management actions (~300 lines)
```

**Key constraint:** The `useGameState` export name must remain stable — all 50+ consumers import it by name.

**Alternatives considered:**
- **Zustand/Jotai** — rejected: would be a breaking API change and a new dependency
- **Multiple contexts** — rejected: increases nesting, complicates cross-cutting state reads
- **Slice pattern (Redux-style)** — the selected approach is closest to this, with focused action files

### D3: Oversized Hook Decomposition

**Decision:** Split `useAdventure.ts` (2242 lines) and `useFaction.ts` (1070 lines) by sub-feature, keeping a facade hook for backward compatibility.

**Pattern:**
```
hooks/adventure/
├── index.ts                    # Re-exports useAdventure
├── useAdventure.ts             # Facade: composes sub-hooks (~150 lines)
├── useAdventureExploration.ts  # Grid exploration logic
├── useAdventureCombat.ts       # Adventure combat logic
├── useAdventureEvents.ts       # Event handling
├── useAdventureRewards.ts      # Loot/reward handling
└── utils.ts                    # Shared adventure utils
```

The facade retains the original `useAdventure` return shape, so no consumer changes are needed.

**Alternatives considered:**
- **Single hook + extracted lib functions** — partial fix; doesn't solve hook size
- **Context-based approach** — adds unnecessary nesting for hooks that are composed into panels

### D4: Component Decomposition Pattern

**Decision:** Large components (>300 lines) are split into focused sub-components within the same domain directory.

**Example — `FactionPanel.tsx` (1127 lines):**
```
components/game/tabs/
├── FactionPanel.tsx          # ~250 lines: orchestration + tab switching
├── faction/
│   ├── FactionOverview.tsx   # Faction overview tab
│   ├── FactionTasks.tsx      # Task/trial tab
│   ├── FactionShop.tsx       # Contribution shop tab
│   ├── FactionRoster.tsx     # Member/enemy roster tab
│   └── FactionReputation.tsx # Reputation & rank tab
```

Same approach for `MainGame.tsx` → extract the tab routing into a `TabRouter` component, and `DeveloperPanel.tsx` → split by debug feature (state inspector, resource injector, event trigger).

### D5: `features/` Directory Decision

**Decision:** Remove the mostly-empty `features/` directory. The current content (two small cultivation components + thin re-exports) is moved into `components/game/cultivation/` and `hooks/` respectively.

**Rationale:** The `features/` pattern (orchestration layer combining lib + hooks) is a valid architectural pattern, but the current implementation adds indirection without value. Re-introduction can happen later when there are genuinely cross-cutting orchestration needs.

**Alternatives considered:**
- **Keep and populate** — rejected: premature abstraction; the codebase doesn't yet have cross-system orchestration complex enough to warrant a separate layer
- **Keep as-is** — rejected: dead code that increases import path complexity

### D6: Pure Function Enforcement

**Decision:** Instead of a blanket `Math.random()` → seed rewrite (which would touch every file and risk regressions), use a targeted strategy:

1. **Critical lib files** (imported by tests): Refactor to accept `rng: () => number` parameter
   - `adventure.ts`, `adventureBattleNew.ts` — already use `Math.random()`, but this is a Phase 2 item
2. **Non-critical lib files**: Document the deviation with a JSDoc `@note` tag explaining why
3. **Add `createRng(seed: number): () => number` to `lib/game/utils/`** for use by all refactored functions

**Phase 1 (this change):** Add the RNG utility, refactor `battle/` module (already well-structured)
**Phase 2 (follow-up):** Refactor `adventure/`, `ascension/` modules

### D7: Directory Naming Standard

**Decision:** All directories under `src/` use kebab-case. One exception: `__tests__` directories (established convention). Rename `components/game/MainGame/` → `components/game/main-game/`.

### D8: Utility Consolidation Map

```
src/utils/              → General-purpose utilities (cn, format, date helpers)
src/lib/util/           → Game-specific pure utilities (damage calc helpers, type guards)
src/hooks/utils/        → Hook-specific utilities → merge into hooks/ or lib/util/ per content
src/lib/utils.ts        → Move cn() to src/utils/cn.ts
```

## Risks / Trade-offs

- **Risk: Import breakage across 100+ files** → Mitigation: Run `pnpm ts-check` after every module move; use IDE-assisted refactoring; batch changes by domain
- **Risk: `useGameState` decomposition introduces bugs** → Mitigation: Extract modules one at a time, run full test suite between each extraction; keep the original as integration test reference
- **Risk: Feature removal breaks unknown consumers** → Mitigation: Search all imports of `@/features/` before removal; verify only 4-6 consumers exist
- **Risk: Build failure due to barrel export circular dependencies** → Mitigation: Keep `lib/game/index.ts` flat (re-export each subdomain directly, not through nested barrels)
- **Risk: Large PR is hard to review** → Mitigation: Each domain reorganization is an independent commit; reviewers can go commit-by-commit
- **Trade-off: Some domain boundaries are fuzzy** (e.g., `adventureBattleIntegration.ts` touches both domains). Resolution: Place files in the domain they primarily serve, with JSDoc noting cross-domain usage.

## Migration Plan

### Phase 1: Foundation (safest changes first)
1. Add barrel exports (`index.ts`) to directories without them
2. Merge `lib/gameData/` → `lib/data/`
3. Merge `lib/calculation/service/` → `lib/calculation/services/`
4. Rename `MainGame/` → `main-game/`

### Phase 2: Boundary Fixes
5. Move `WorldTextContext.tsx` → `src/contexts/`
6. Move `useGameText.tsx` → `src/hooks/text/`
7. Merge `enemyTechniqueEquipment.ts` into `enemy/techniqueEquipment.ts`

### Phase 3: File Decomposition
8. Split `useGameState.tsx` into `hooks/game-state/` modules
9. Split `useAdventure.ts` and `useFaction.ts`
10. Split oversized components (starting with `FactionPanel`, `MainGame`)

### Phase 4: Reorganization
11. Organize `lib/game/` flat files into domain subdirectories
12. Place orphaned `components/game/` files into subdirectories
13. Remove `features/` and relocate content

### Phase 5: Cleanup
14. Consolidate scattered utilities
15. Add seed-based RNG to `battle/` module
16. Final `pnpm ts-check` + `pnpm build` + `pnpm test` verification

### Rollback
Each phase is an independent commit. If any phase introduces regressions, revert that commit and re-assess. The functional behavior is preserved at every step.

## Open Questions

1. **Should `features/` be fully removed or kept as empty scaffolding?** — Leaning toward removal; the overhead of maintaining empty directories with re-exports outweighs the value
2. **For `useGameState` decomposition, should action files use `useCallback`-wrapped functions or pure reducer dispatch?** — Need to evaluate the current call patterns; reducer dispatch is preferred for testability but may require consumer changes
3. **Should `lib/gameData/` be merged into `lib/data/` or into `lib/game/`?** — `lib/data/` is the existing pattern for static game data; merging gameData into data/ is consistent
