# CLAUDE.md

## Rules

Before any code generation, read and follow these rules:

- [Core Constraints](.claude/rules/core.md) — File size limits, directory responsibilities, forbidden behaviors
- [Module Standards](.claude/rules/modules.md) — lib/game, hooks, components, features specifications
- [Style Guide](.claude/rules/style.md) — Import ordering, naming, JSDoc, TypeScript strictness

## Project Context

万界修行录 (Wanjie Cultivation Record) — A Next.js 16 text-based multiplayer cultivation MUD game with 8 world types. See `AIREADME.md` for full details.

## Quick Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Build static export
pnpm lint             # ESLint check
pnpm lint:strict      # Full quality gate (ESLint + file size check)
pnpm ts-check         # TypeScript type check
pnpm test             # Run vitest tests
pnpm check-sizes      # Check file size limits only
```

## Key TL;DR

- `src/lib/` = pure functions only, NO React, NO side effects
- `src/components/ui/` = shadcn/ui, DO NOT EDIT
- `src/hooks/` = state management, 200 line max
- Components = 300 line max
- No `any` types
- Search existing code BEFORE creating new files
- Update `index.ts` barrel exports when adding modules
