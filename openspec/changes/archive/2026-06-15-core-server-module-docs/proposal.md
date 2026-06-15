## Why

目前 `src/instrumentation.ts`（Next.js 服务端启动钩子）作为独立文件散落在 `src/` 根目录，没有归属的服务端核心代码目录。同时，`core/` 和 `modules/` 目录下虽有大量子模块，但缺少一份总览性 README 来描述每个模块的职责和用途，导致新开发者（或 AI Agent）难以快速了解项目结构。此外，现有约束规则中没有要求在模块变化时同步更新 README 文档，容易导致文档与代码脱节。

通过本次变更，建立 `core/server/` 目录为服务端核心代码的统一存放处，补充 `core/` 和 `modules/` 的 README 总览文档，并在规则中固化「变更时同步更新 README」的要求，确保文档与代码长期保持一致。

## What Changes

1. **新建 `core/server/` 目录** — 作为服务端非业务核心代码的存放目录
2. **迁移 `src/instrumentation.ts`** — 移入 `src/core/server/instrumentation.ts`，旧位置建立 barrel re-export 过渡（`export * from '@/core/server/instrumentation'`），待其他引用点清理后删除
3. **添加 `src/core/README.md`** — 描述 `core/` 下每个子模块（calculation, engine, events, logger, message-log, mod, registry, server, time, types, world）的职责和关系
4. **添加 `src/modules/README.md`** — 按功能域分组描述每个业务模块（ascension, collection, combat, crafting, economy, equipment, exploration, faction, identity, mod, narrative, npc, progression, quest, social, techniques, theme, tower, world-pool, world-rating）的用途
5. **更新 `.claude/rules/core.md`** — 在目录职责表新增 `core/server/` 条目，在变更约束中加入「变更涉及模块增减时必须同步更新对应 README」的规则
6. **更新 `.claude/rules/modules.md`** — 补充模块文档同步要求

## Capabilities

### New Capabilities
- `core-server-dir`: 服务端核心代码目录 `core/server/` 的建立，以及 `instrumentation.ts` 的迁移
- `module-readme-docs`: `core/README.md` 和 `modules/README.md` 的创建与维护规范

### Modified Capabilities
- `claude-rules-system`: 在核心规则 `core.md` 中新增 `core/server/` 目录职责描述和 README 同步更新义务

## Impact

- **新增文件**：`src/core/server/instrumentation.ts`、`src/core/README.md`、`src/modules/README.md`
- **移动文件**：`src/instrumentation.ts` → `src/core/server/instrumentation.ts`
- **更新文件**：`.claude/rules/core.md`、`.claude/rules/modules.md`（必要时）
- **搜索确认**：需确认是否有其他地方 import 了 `@/instrumentation` 或以相对路径引用 `src/instrumentation.ts`
- **无运行时影响**：迁移后导入路径变化，功能完全一致
