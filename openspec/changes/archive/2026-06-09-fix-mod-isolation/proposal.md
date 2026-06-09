## Why

当前 Mod 系统的数据注册层（`WorldDataRegistry` + `ModLoader`）已能正确加载 Mod 数据，但消费层存在大量硬编码兜底逻辑，导致插入新 Mod 后 TypeScript 类型错误满天飞，用户引入世界 Mod 示例后代码标红。问题根源在于 **消费代码不信任注册中心**，四处写死 `WorldType` 联合类型和魔法默认值，完全破坏了 Mod 隔离性。

## What Changes

- **BREAKING**: `WorldType` 从硬编码联合类型改为品牌字符串 `ExtensibleWorldType`，所有写死世界名称的代码改用注册中心动态获取
- `getWorldData()` 移除硬编码数值（`baseHp: 100` 等），改为从 `WorldDataRegistry` 完整读取，注册数据不足时抛出明确错误而非静默降级
- `WORLD_MECHANICS` 工厂映射表移除硬编码的 8 世界 Fallback（`|| cultivationWorld`），改为注册器模式——Mod 可注册自定义 `WorldMechanics` 实现
- 删除代码中所有以 `'修仙'` 作为默认世界类型的兜底写法（`AdventureLootPanel`、`DeveloperPanel`、`calculation/context` 等）
- `WorldTypeData` 接口扩展 `stats` 字段，承载 `baseHp`/`hpPerLevel` 等数值配置，替代 `getWorldData()` 中的内联硬编码
- 确保新 Mod 只提供 `mod.json` + 数据文件即可工作，无需修改任何源代码

## Capabilities

### New Capabilities
- `extensible-world-type`: 世界类型从硬编码联合类型改为品牌字符串，由注册中心动态校验，任何 Mod 注册的世界类型都是有效类型
- `registry-driven-world-stats`: 世界数值配置（baseHp、hpPerLevel、attackPerLevel 等）完全由 `WorldTypeData` 注册提供，消费代码无硬编码兜底
- `world-mechanics-registry`: 世界特殊机制通过注册表注入，替代硬编码 `WORLD_MECHANICS` 映射，Mod 可提供自定义 `WorldMechanics` 实现

### Modified Capabilities
- `world-data-consolidation`: 扩展 `WorldTypeData` 接口使其承载完整数值配置，补充之前遗漏的 `stats` 字段（原 `getWorldData()` 中硬编码的部分）

## Impact

- `src/shared/lib/types.ts` — `WorldType` 重定义为品牌字符串
- `src/modules/identity/data/worldData.ts` — `getWorldData()` 移除硬编码，改为从注册中心完整映射
- `src/modules/identity/logic/worlds/factory.ts` — 移除硬编码映射表和 Fallback 逻辑
- `src/modules/identity/logic/worlds/` — 8 个世界机制文件改为自注册模式
- `src/shared/lib/registry/WorldDataRegistry.ts` — `WorldTypeData` 扩展数值字段
- `src/shared/components/` — `AdventureLootPanel`、`DeveloperPanel` 移除兜底默认值
- `src/shared/lib/calculation/` — `context/builder.ts`、`helpers/contextHelper.ts` 移除硬编码世界类型
- `src/modules/identity/logic/generators.ts` — 确保完全从注册中心读取，无本地硬编码常量
