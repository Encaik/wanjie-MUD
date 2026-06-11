## Why

当前世界系统存在三层冗余：`WorldDataRegistry`（原始数据 + 组装后的 WorldviewDefinition）、`WorldProviderRegistry`（世界生成器）、`WorldMechanicsRegistry`（玩法机制）。`WorldTypeData` 已被标记为 `@deprecated` 但仍在大量代码中使用，`WorldTemplate`（固化世界模板）概念增加了不必要的复杂度且无实际使用场景。Mod 的 `contentType` 使用 `'world'` 语义不准确——Mod 提供的是世界观定义（Worldview），而非世界实例。本次重构统一为以 `WorldViewRegistry`（世界观注册中心）为核心的单一数据源，消除所有历史包袱。

## What Changes

- **BREAKING**: 删除 `WorldDataRegistry` 整个类及文件，以新的 `WorldViewRegistry` 替代
- **BREAKING**: 删除所有 `worldTypes` 相关 deprecated 字段和 `WorldTypeData` 接口，统一使用 `WorldviewDefinition`
- **BREAKING**: 删除 `WorldTemplate`（固化世界模板）整个概念及相关文件（`TemplateWorldProvider.ts`、`validateWorldTemplate.ts`、`worldTemplates` Map、`identity.ts` 中 `tpl:` 格式）
- **BREAKING**: Mod `contentType` `'world'` 重命名为 `'worldview'`，不再包含特殊"自包含一站式注册"逻辑
- 新建 `WorldViewRegistry`：只管理 `WorldviewDefinition` 的注册与查询，替代 `WorldDataRegistry`
- 更新所有引用点（~31 个文件）：`WorldDataRegistry` → `WorldViewRegistry`，`worldTypes` → `worldviews`
- 清理 API 初始化 (`init.ts`)、Mod 加载器 (`ModLoader.ts`) 中固化模板相关逻辑
- `WorldProviderRegistry` 和 `WorldMechanicsRegistry` 保留不变

## Capabilities

### New Capabilities

- `worldview-registry`: 世界观注册中心 `WorldViewRegistry`——统一管理所有 `WorldviewDefinition` 的注册、查询、校验，作为世界观数据的唯一来源

### Modified Capabilities

- `worldview-definition`: WorldviewDefinition 的存储位置从 WorldDataRegistry 迁移至 WorldViewRegistry；删除 WorldTemplate 相关描述
- `extensible-world-type`: 世界类型注册 API 从 WorldDataRegistry 迁移至 WorldViewRegistry
- `world-data-consolidation`: 唯一数据源从 WorldDataRegistry.worldviews 改为 WorldViewRegistry
- `mod-data-bundling`: Mod content type `'world'` 改为 `'worldview'`
- `world-provider-registry`: 移除 TemplateWorldProvider 相关要求

## Impact

- **core/registry/**: 删除 `WorldDataRegistry.ts`、`WorldDataRegistry.test.ts`，新建 `WorldViewRegistry.ts`
- **core/world/**: 删除 `TemplateWorldProvider.ts`、`validateWorldTemplate.ts`，修改 `identity.ts`（移除 `tpl:` 格式）、`types.ts`（删除 `WorldTemplate`）
- **core/mod/**: `ModManifest.ts`（`contentType` 'world'→'worldview'，删除 `worldTemplates` 字段）、`ModLoader.ts`（重写 `registerData` 世界观处理逻辑）
- **core/types/**: 删除 `WorldTypeData`，确保 `World` 接口正确引用 `worldviewId`
- **modules/identity/**: 所有 `data/` 和 `logic/` 中引用 `WorldDataRegistry` 的文件
- **modules/narrative/**: `WorldTextManager`、`terminology` 等引用点
- **modules/exploration/**, **modules/techniques/**, **modules/progression/**, **modules/equipment/**, **modules/crafting/**, **modules/economy/**: `import` 路径更新
- **app/api/**: `init.ts`、所有 `v1/worlds/` 路由、`v1/worldviews/` 路由
- **shared/**: `DeveloperPanel.tsx`
