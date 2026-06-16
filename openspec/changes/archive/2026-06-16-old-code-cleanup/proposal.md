## Why

新属性/核心值系统上线后，旧管线代码（deprecated 函数、兼容别名、`Math.random()` 生成器）仍在代码中，造成双轨并存。统一到新系统。

## What Changes

- 删除 `generators.ts` 中 `@deprecated` 函数：`generateCharacters`、旧 `generateWorld`、旧 `generateWorlds`、`generateWorldSeed`
- 删除 `generator.ts` 旧管线：`generateWorldBasic`、`generateWorldDetails`、`generateAndSave`、`generateBasic`、`generateDetailsForSeed`
- 删除 `useGameState.tsx` 的 `selectCharacter`
- 删除兼容别名：`AttributeDefinition`、`NumericAttributeDefinition`、`EnumAttributeDefinition`

## Capabilities

无新能力，纯清理。

## Impact

`src/modules/identity/logic/generators.ts`、`src/app/api/v1/worlds/generate/generator.ts`、`src/views/game/useGameState.tsx`、`src/core/types/types.ts`
