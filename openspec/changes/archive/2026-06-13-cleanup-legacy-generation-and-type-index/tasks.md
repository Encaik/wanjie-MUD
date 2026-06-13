## 1. 分析：确认所有受影响文件和调用点

- [x] 1.1 列出 `generators.ts` 中所有导出函数，追踪每个函数的调用方
- [x] 1.2 列出所有 `world.type` 用于索引/查找而非纯显示的调用点
- [x] 1.3 列出所有 `WORLD_COEFFICIENTS` 的引用点
- [x] 1.4 确认 `api/v1/characters/generate/route.ts` 的前端调用方

## 2. 删除前端生成逻辑（identity 清理）

- [x] 2.1 删除 `modules/identity/logic/generators.ts`
- [x] 2.2 删除 `modules/identity/logic/characterEvaluation.ts`
- [x] 2.3 删除 `modules/identity/logic/traits.ts`
- [x] 2.4 删除 `modules/identity/data/traits.ts`
- [x] 2.5 删除 `modules/identity/data/namePools.ts`
- [x] 2.6 删除 `modules/identity/data/worldTraitPools.ts`
- [x] 2.7 删除 `modules/identity/data/worlds/index.ts`
- [x] 2.8 删除 `modules/identity/logic/worlds/ModRandomWorldProvider.ts`
- [x] 2.9 更新 `modules/identity/index.ts`

## 3. 清理 generators.ts 的外部调用

- [x] 3.1 删除 `useGameState.tsx` 中的 `selectCharacter()` 和 `generateBackstory()` 调用
- [x] 3.2 删除 `api/v1/characters/generate/route.ts`
- [x] 3.3 创建 `core/world/CoreWorldProvider.ts` 替代 ModRandomWorldProvider
- [x] 3.4 修复 `core/events/events.ts` 中 `getWorldTerms` 的 import
- [x] 3.5 修复所有从 generators.ts 导入 `getRealmName`、`generateId` 等的调用方

## 4. 重构中文 type 索引为 worldviewId

- [x] 4.1 重构 `modules/identity/data/worldData.ts`：删除 `WORLD_COEFFICIENTS`、`WORLD_DATA`、改造 `getWorldData()` 参数为 `worldviewId`、删除硬编码回退
- [x] 4.2 修改 `worldSystem.ts`：删除 `generateWorldDangers()`、`generateWorldOpportunities()`；`getWorldBaseCoefficient()` 改为从 registry 读取
- [x] 4.3 修改所有 `getWorldData(worldType)` 调用方：`statDisplayNames.ts`、`combat/logic/statsCalc.ts`
- [x] 4.4 修改 `combat/logic/statsCalc.ts`：`WORLD_COEFFICIENTS` → `getWorldBaseCoefficient`
- [x] 4.5 删除死代码 `app/api/v1/worlds/generate/generator.ts`，清理 basic/details 路由中的旧回退
- [x] 4.6 修复 `WorldInfoPanel.tsx`：`getWorldVisualConfig(world.type)` → `getWorldVisualConfig(world.worldviewId)`
- [x] 4.7 删除 `getBuiltinWorldTypes()`（零引用）

## 5. DB Schema 更新

- [x] 5.1 `app/api/db/schema.ts`：worlds 表增加 `worldviewId` 字段
- [x] 5.2 `app/api/v1/worlds/store.ts`：保存世界时写入 `worldviewId` 字段
- [x] 5.3 确认 test 中 `world.type` 断言为预期行为（显示名），保留

## 6. 验证

- [x] 6.1 `pnpm ts-check` ✅
- [x] 6.2 `pnpm build` ✅
- [x] 6.3 `pnpm test` ✅（203 tests passed）
