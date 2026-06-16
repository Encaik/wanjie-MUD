## 1. generators.ts

- [x] 1.1 删除 `generateCharacters`、`generateWorld`(旧)、`generateWorlds`(旧)、`generateWorldSeed`
- [x] 1.2 `sumImpacts` 改为非导出
- [x] 1.3 更新 `modules/identity/index.ts`

## 2. generator.ts

- [x] 2.1 删除旧管线全部函数（`generateWorldBasic`、`generateWorldDetails`、`generateAndSave`、`generateBasic`、`generateDetailsForSeed`、`generateWorld`(wrapper)、`seedToRandom`、`resolveWorldType`）

## 3. useGameState.tsx + types.ts

- [x] 3.1 删除 `selectCharacter`，更新返回值 + `GameContextType`
- [x] 3.2 删除兼容别名，全局替换引用

## 4. 验证

- [x] 4.1 `pnpm ts-check` + `pnpm build` + `pnpm test` 全部通过
