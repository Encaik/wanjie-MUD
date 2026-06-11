## 1. 新建 WorldViewRegistry

- [x] 1.1 创建 `src/core/registry/WorldViewRegistry.ts`：单例类，管理 `Map<string, WorldviewDefinition>`，提供 `register`、`get`、`getAll`、`getBuiltins`、`count` API
- [x] 1.2 创建 `src/core/registry/WorldViewRegistry.test.ts`：测试注册、重复检测、查询、获取全部、获取内置、count
- [x] 1.3 更新 `src/core/registry/index.ts`：导出 WorldViewRegistry，移除 WorldDataRegistry 导出

## 2. 删除旧文件和类型

- [x] 2.1 删除 `src/core/registry/WorldDataRegistry.ts`
- [x] 2.2 删除 `src/core/registry/WorldDataRegistry.test.ts`
- [x] 2.3 删除 `WorldTypeData` 接口及所有相关 deprecated 类型（搜索并清理所有定义和引用）
- [x] 2.4 删除 `src/core/world/TemplateWorldProvider.ts`
- [x] 2.5 删除 `src/core/world/validateWorldTemplate.ts`
- [x] 2.6 删除 `WorldTemplate` 接口定义（`core/world/types.ts`）
- [x] 2.7 更新 `src/core/world/types.ts`：清理 WorldProvider type 字段（移除 'template'，只保留 'random'）

## 3. 更新 core/world/ 模块

- [x] 3.1 更新 `src/core/world/identity.ts`：移除 `tpl:` 格式的 ID 创建与解析，只保留 `{providerId}:{worldviewId}:{seed}` 格式
- [x] 3.2 更新 `src/core/world/identity.test.ts`：移除模板相关测试用例，添加新格式测试
- [x] 3.3 更新 `src/core/world/WorldProviderRegistry.ts`：移除模板相关方法（如 `getByType('template')`）
- [x] 3.4 更新 `src/core/world/WorldProviderRegistry.test.ts`：移除模板相关测试
- [x] 3.5 更新 `src/core/world/generateWorld.ts`：确保从 WorldViewRegistry 而非 WorldDataRegistry 获取数据
- [x] 3.6 更新 `src/core/world/index.ts`：移除 TemplateWorldProvider 等已删除文件的导出

## 4. 更新 Mod 系统

- [x] 4.1 更新 `src/core/mod/ModManifest.ts`：`ModContentType` 'world' → 'worldview'，删除 `worldTemplates` 字段
- [x] 4.2 更新 `src/core/mod/ModLoader.ts`：所有 `contentType === 'world'` → `'worldview'`，删除固化模板加载逻辑，简化 `registerData()` 世界观注册流程
- [x] 4.3 更新 `src/app/api/mod-types.ts`：移除模板相关类型导出
- [x] 4.4 更新 `src/app/api/init.ts`：删除 `assembleWorldviews()` 及其调用，直接注册 WorldviewDefinition 到 WorldViewRegistry；删除 `registerWorldProviders()` 中模板 provider 创建逻辑；更新所有 WorldDataRegistry 引用 → WorldViewRegistry

## 5. 更新 API 路由

- [x] 5.1 更新 `src/app/api/v1/worlds/route.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 5.2 更新 `src/app/api/v1/worlds/store.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 5.3 更新 `src/app/api/v1/worlds/generate/route.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 5.4 更新 `src/app/api/v1/worlds/generate/basic/route.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 5.5 更新 `src/app/api/v1/worlds/generate/details/route.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 5.6 更新 `src/app/api/v1/worlds/generate/generator.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 5.7 更新 `src/app/api/v1/worldviews/route.ts`：WorldDataRegistry → WorldViewRegistry

## 6. 更新 modules/ 层

- [x] 6.1 更新 `src/modules/identity/data/worldData.ts`：所有 `getWorldTypes()`/`getWorldData()` → `WorldViewRegistry`
- [x] 6.2 更新 `src/modules/identity/data/worldSystem.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.3 更新 `src/modules/identity/data/worldEffectsData.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.4 更新 `src/modules/identity/data/statDisplayNames.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.5 更新 `src/modules/identity/data/worldTraitPools.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.6 更新 `src/modules/identity/data/traits.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.7 更新 `src/modules/identity/data/namePools.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.8 更新 `src/modules/identity/data/realmData.ts`（progression 模块下）：WorldDataRegistry → WorldViewRegistry
- [x] 6.9 更新 `src/modules/identity/logic/worlds/registerProviders.ts`：删除模板 provider 注册，更新 WorldDataRegistry → WorldViewRegistry
- [x] 6.10 更新 `src/modules/identity/logic/worlds/registerBuiltin.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.11 更新 `src/modules/identity/logic/worlds/ModRandomWorldProvider.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.12 更新 `src/modules/identity/logic/generators.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.13 更新 `src/modules/identity/index.ts`：更新导出
- [x] 6.14 更新 `src/modules/narrative/logic/terminology.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.15 更新 `src/modules/narrative/logic/WorldTextManager.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.16 更新 `src/modules/narrative/data/worlds/types.ts`：更新类型引用
- [x] 6.17 更新 `src/modules/narrative/data/worlds/index.ts`：更新导出
- [x] 6.18 更新 `src/modules/exploration/data/eventChains.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.19 更新 `src/modules/exploration/logic/dungeon/types.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.20 更新 `src/modules/techniques/data/techniqueBondData.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.21 更新 `src/modules/progression/data/realmData.ts`：WorldDataRegistry → WorldViewRegistry
- [x] 6.22 更新 `src/modules/faction/data/factionData.ts`：WorldDataRegistry → WorldViewRegistry

## 7. 更新 shared/ 和 views/ 层

- [x] 7.1 更新 `src/shared/components/DeveloperPanel.tsx`：WorldDataRegistry → WorldViewRegistry
- [x] 7.2 更新 `src/views/game/useGameState.tsx`：WorldDataRegistry → WorldViewRegistry（如有引用）

## 8. 更新构建脚本和配置

- [x] 8.1 更新 `scripts/build-mods.ts`：contentType 'world' → 'worldview'
- [x] 8.2 更新所有 `mod-list.json` 文件中的 contentTypes（如有）
- [x] 8.3 检查并更新 `pnpm-workspace.yaml` 和 `package.json`（如有 WorldTemplate 相关脚本）

## 9. 验证

- [x] 9.1 运行 `pnpm ts-check` 确保无 TypeScript 类型错误
- [x] 9.2 运行 `pnpm test` 确保所有测试通过
- [x] 9.3 运行 `pnpm lint:strict` 确保 ESLint + 文件大小检查通过
- [x] 9.4 运行 `pnpm build` 确保构建成功
- [x] 9.5 全局搜索 `WorldDataRegistry`、`WorldTypeData`、`WorldTemplate`、`worldTypes`、`worldTemplates`、`tpl:` 确认无残留引用
- [x] 9.6 全局搜索 `contentType.*'world'`（排除 `'worldview'`）确认 mod 系统无残留旧名称
