## Context

所有调用路径已切换到新系统，旧代码不再被调用。

## 删除清单

**✅ 安全删除:**
- `generators.ts`: `generateCharacters`, `generateWorld`(旧), `generateWorlds`(旧), `generateWorldSeed`
- `generator.ts`: `generateWorldBasic`, `generateWorldDetails`, `generateAndSave`, `generateBasic`, `generateDetailsForSeed`, `generateWorld`(wrapper), `seedToRandom`, `resolveWorldType`
- `useGameState.tsx`: `selectCharacter`
- `types.ts`: `AttributeDefinition`, `NumericAttributeDefinition`, `EnumAttributeDefinition` 别名

**❌ 保留:** `BaseStats`/`GrowthStats`/`CharacterStats`(game logic 依赖), `generateCharacter`(单数,测试用), `generateBackstory`(前端用)
