# CLAUDE.md

## Rules

Before any code generation, read and follow these rules:

- [Core Constraints](.claude/rules/core.md) — 四层架构、文件大小限制、目录职责、禁止行为
- [Module Standards](.claude/rules/modules.md) — modules/、views/、shared/ 开发规范
- [Style Guide](.claude/rules/style.md) — 导入顺序、命名、JSDoc、TypeScript 严格模式

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

## Key TL;DR — 四层架构

```
src/
├── app/       ← ① Next.js 路由（只放 page.tsx, layout.tsx）
├── views/     ← ② 页面组件（组合模块 Panel，无业务逻辑）
├── modules/   ← ③ 功能模块（一个业务域一个目录，自包含）
└── shared/    ← ④ 公共代码（ui, components, lib, utils, config, storage）
```

- **同一份内容只在一处存在** — 禁止复制粘贴
- `modules/<domain>/logic/` = pure functions only, NO React, NO side effects
- `components/ui/` = shadcn/ui, DO NOT EDIT
- `modules/<domain>/hooks/` = state management, 200 line max
- Components = 300 line max
- No `any` types
- Search existing code BEFORE creating new files
- Update `index.ts` barrel exports when adding modules
- 旧目录（`hooks/`、`lib/`、`contexts/`、`components/game/`）处于迁移过渡期，**不要新增文件**
