## Why

前端代码中残留了大量已被后端 API 取代的生成逻辑和旧架构代码。`modules/identity/` 中有完整的 `generateCharacter()`、`generateWorld()`、`generateBackstory()` 等前端实现（使用 `Math.random()`），而所有生成已由后端 API 覆盖。同时，核心索引使用中文 type 名（`"修仙"`）作为 key，导致新旧数据源之间的索引混乱，阻碍进一步重构。

**这是开发阶段，代码质量是最高优先级**——重复逻辑和兼容兜底应被彻底清理，不留过渡期。

## What Changes

### A. 删除前端生成逻辑（**BREAKING**）

删除 `modules/identity/` 中与后端 API 完全重叠的前端生成代码：

- `logic/generators.ts` — `generateCharacter()`、`generateCharacters()`、`generateWorld()`、`generateWorlds()`、`generateBackstory()`、`generateWorldSeed()` 及其辅助函数
- `logic/characterEvaluation.ts` — 仅被 `generators.ts` 调用
- `logic/traits.ts` — 仅被 `generators.ts` 调用
- `data/traits.ts`、`data/namePools.ts`、`data/worldTraitPools.ts`、`data/worlds/index.ts` — 静态数据文件，仅被旧生成逻辑使用或无引用死代码
- `logic/worlds/ModRandomWorldProvider.ts` — 依赖 `generators.ts`
- 同步清理 `identity/index.ts` 中上述文件的 barrel export
- 清理 `useGameState.tsx` 中对 `generateBackstory()` 的调用（前端不再生成背景故事）
- 清理 `api/v1/characters/generate/route.ts`（改用 `characterTemplates.ts`）

### B. 重构中文 type 索引为 worldviewId（**BREAKING**）

将所有使用中文 type 作为 key 的代码迁移为英文 worldviewId：

- `data/worldData.ts`：`WORLD_COEFFICIENTS` 的 key 从 `'修仙'` → `'cultivation'`；`getWorldData()` 参数改为 `worldviewId`；删除注册中心为空时的硬编码回退
- 波及 `progression/logic/balanceConfig.ts`、`combat/logic/statsCalc.ts`、`exploration/` 等 20+ 个文件
- 删除 `core/types/types.ts` 中的 `getBuiltinWorldTypes()` 和 `getFinalStats()`（已 `@deprecated`）

### C. 数据文件拆分

- `data/worldSystem.ts`：删除生成函数 `generateWorldDangers()` / `generateWorldOpportunities()`，保留纯查询函数

### D. DB Schema 字段迁移

- `app/api/db/schema.ts`：worlds 表增加 `worldviewId` 字段

## Capabilities

### New Capabilities

该变更不引入新能力，仅清理和重构现有代码。

### Modified Capabilities

- `world-type-english-id`：完成中文 type → 英文 worldviewId 的最终迁移。原 spec 定义了可扩展世界类型系统，本次变更新增要求：所有运行时索引必须使用 `worldviewId`，`type` 仅用于前端显示
- `code-no-compat-shims`：删除 generators.ts 等文件中残留的兼容过渡代码和 `@deprecated` 函数
- `world-aware-character-gen`：删除前端侧的 generateCharacter()/generateCharacters()，角色生成仅通过后端 API 完成
- `world-generation-api`：删除前端侧的 generateWorld()/generateWorlds()，世界生成仅通过后端 API + core/world/generateWorld.ts 完成

## Impact

- **删除约 10 个文件，修改约 25+ 个文件**
- `useGameState.tsx` 中的 `selectCharacter()` **被标记 @deprecated V3**、调用 `generateBackstory()` 的逻辑将被移除
- `api/v1/characters/generate/route.ts` 重新实现（改用 `characterTemplates.ts` 替代 `generators.ts`）
- 所有 `WORLD_COEFFICIENTS[worldType]` 调用方需改为 `WORLD_COEFFICIENTS[worldviewId]`
- 所有 `getWorldData(worldType)` 调用方传参需改为 `worldviewId`
- 不涉及：characterTemplates.ts、protagonistAdapter.ts、hooks/、data/worldEffects*.ts
