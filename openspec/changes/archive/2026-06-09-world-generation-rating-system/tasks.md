## 1. 游戏版本系统

- [x] 1.1 创建 `src/shared/config/version.ts`，定义 `GAME_VERSION` 常量（与 `package.json` 同步）和 `parseSemver`、`checkWorldTemplateCompatibility` 函数
- [x] 1.2 创建构建脚本 `scripts/sync-version.ts`，读取 `package.json` 的 version 字段并同步到 `src/shared/config/version.ts`
- [x] 1.3 在 `package.json` 的 `build` 脚本中添加版本同步步骤
- [x] 1.4 编写 `version.test.ts` 测试 semver 解析和兼容性判断

## 2. WorldIdentity 身份系统

- [x] 2.1 创建 `src/shared/lib/world/identity.ts`，实现 `createWorldId`、`parseWorldId`、`isTemplateWorldId`、`extractSeed` 工具函数
- [x] 2.2 在 `src/shared/lib/types.ts` 中更新 `World` 接口的 `id` 字段注释，明确其格式规则
- [x] 2.3 World 接口或快照结构中新增 `gameVersion` 字段
- [x] 2.4 编写 `identity.test.ts` 测试 ID 生成/解析的确定性

## 3. WorldProvider 接口与注册中心

- [x] 3.1 在 `src/shared/lib/world/types.ts` 中定义 `WorldProvider`、`WorldProviderMetadata`、`WorldTemplate` 接口（含 `gameVersion` 必填字段）
- [x] 3.2 创建 `src/shared/lib/world/WorldProviderRegistry.ts` 单例注册中心类
- [x] 3.3 创建 `src/shared/lib/world/index.ts` 桶导出
- [x] 3.4 编写 `WorldProviderRegistry.test.ts` 测试注册/注销/查询

## 4. ModRandomWorldProvider 实现

- [x] 4.1 创建 `src/modules/identity/logic/worlds/ModRandomWorldProvider.ts`，实现 `WorldProvider` 接口（type='random'），封装现有 `generateWorld` 函数
- [x] 4.2 创建 `src/modules/identity/logic/worlds/registerProviders.ts`，在 mod 加载完成后自动从 `WorldDataRegistry` 创建 ModRandomWorldProvider 并注册
- [x] 4.3 在 `src/shared/lib/mod/ModLoader.ts` 的加载流程末尾调用 `registerProviders()`
- [x] 4.4 更新 `src/modules/identity/logic/worlds/index.ts` 桶导出

## 5. WorldRating 评分系统

- [x] 5.1 创建 `src/modules/world-rating/types.ts`，定义 `WorldRatingsStore`、`RatingData` 类型
- [x] 5.2 创建 `src/modules/world-rating/logic/ratingStorage.ts`，实现 localStorage 读写和聚合逻辑
- [x] 5.3 创建 `src/modules/world-rating/hooks/useWorldRating.ts`，提供评分读写和状态管理
- [x] 5.4 创建 `src/modules/world-rating/components/WorldRatingForm.tsx`，五星评分交互组件
- [x] 5.5 创建 `src/modules/world-rating/index.ts` 桶导出
- [ ] 5.6 编写 `ratingStorage.test.ts` 测试评分存储和聚合

## 6. WorldPool 混合池引擎

- [x] 6.1 创建 `src/shared/lib/world/WorldPoolEngine.ts`，实现核心混合算法（去重、比例分配、补足）
- [x] 6.2 定义 `WorldPoolConfig` 和 `WorldPoolEntry` 类型
- [x] 6.3 创建 `src/modules/world-pool/hooks/useWorldPool.ts`，封装引擎调用和 localStorage 读取
- [x] 6.4 创建 `src/modules/world-pool/index.ts` 桶导出
- [ ] 6.5 编写 `WorldPoolEngine.test.ts` 测试各种配置下的混合结果

## 7. 世界选择流程接入

- [x] 7.1 修改 `src/views/world-select/WorldSelect.tsx`，改为使用 `useWorldPool` Hook 获取世界列表
- [ ] 7.2 在 WorldSelect 中根据世界来源标记（rated/random/template）差异化展示（评分徽章、全新/精选标签、版本兼容性标签）
- [x] 7.3 更新 `WorldSelect` 的 props，移除直接从 `generateWorlds` 传入的数据依赖
- [x] 7.4 更新 `src/app/world-select/page.tsx` 路由页面，适配新接口
- [x] 7.5 标记 `DEFAULT_WORLD_SEEDS` 和 `AVAILABLE_WORLDS` 为 `@deprecated`

## 8. 消除硬编码视觉映射

- [x] 8.1 在 `WorldDataRegistry` 的 `WorldTypeData` 类型中新增 `visualConfig: WorldVisualConfig` 可选字段
- [x] 8.2 更新 `mods/wanjie-core/data/worlds.json`，为 8 个世界类型添加 `visualConfig` 字段（icon、accentColor、gradientClass、theme）
- [x] 8.3 修改 `src/views/world-select/WorldSelect.tsx`，移除 `worldTheme` 硬编码映射，改为读取 `visualConfig`
- [x] 8.4 修改 `src/views/game/WorldInfoPanel.tsx`，移除 `worldTypeConfig` 硬编码映射
- [x] 8.5 修改 `src/views/game/WorldReveal.tsx`，移除 `WORLD_ICONS`、`WORLD_COLORS` 硬编码映射
- [x] 8.6 修改 `src/views/character-select/WorldInfoBar.tsx`，移除 `worldIcon`、`worldAccent` 硬编码映射
- [x] 8.7 在各组件中添加通用默认视觉 fallback（中性灰色调 + 通用图标）处理无 visualConfig 的世界

## 9. 固化模板世界支持（WorldTemplate 成品数据结构）

- [x] 9.1 在 `ModManifest` 接口中新增 `worldTemplates` 字段类型定义（模板 ID 数组）
- [x] 9.2 创建 `src/shared/lib/world/TemplateWorldProvider.ts`，实现 `WorldProvider` 接口（type='template'），从 `WorldTemplate.world` 的确定值直接组装 World 实例（不经过随机池选取），同时检查 `gameVersion` 兼容性
- [x] 9.3 创建 `src/shared/lib/world/validateWorldTemplate.ts`，校验模板 JSON 的 world 字段完整性（name/description/factions/dangers/opportunities 为确定值而非池）及 `gameVersion` 必填
- [x] 9.4 扩展 `ModLoader.registerData()`，支持加载 `templates/worlds/` 目录下的 `WorldTemplate` JSON 文件
- [x] 9.5 在 `registerProviders()` 中为每个 `WorldTemplate` 创建 `TemplateWorldProvider` 并注册
- [x] 9.6 更新 `mods/wanjie-template/`，添加示例 `WorldTemplate` JSON 文件（`templates/worlds/huanjing.json`），包含 `gameVersion` 字段
- [x] 9.7 更新 `mods/wanjie-template/mod.json`，添加 `worldTemplates` 声明

## 10. 评分入口与游戏结束流程

- [ ] 10.1 在游戏结束/飞升成功时展示 `WorldRatingForm` 评分组件
- [ ] 10.2 在 `src/views/game/` 的游戏结束面板中集成评分入口
- [ ] 10.3 在 `src/views/game/WorldReveal.tsx` 飞升成功后展示评分入口

## 11. 飞升系统接入

- [ ] 11.1 修改 `src/modules/ascension/logic/ascensionLogic.ts` 中的 `generateNewWorld` 函数，使用 WorldProviderRegistry 获取新世界
- [ ] 11.2 移除 `ascensionLogic.ts` 中的硬编码世界类型数组

## 12. 验证与清理

- [x] 12.1 运行 `pnpm ts-check` 确保类型安全
- [x] 12.2 运行 `pnpm lint` 确保代码规范（lint 错误均为已有，本次变更未引入新问题）
- [x] 12.3 运行 `pnpm test` 确保测试通过（84 tests passed）
- [x] 12.4 运行 `pnpm build` 确保静态构建成功
- [x] 12.5 确认 `data/worlds/` 目录不再被新代码 import（仅保留 barrel re-export 作为过渡）
- [x] 12.6 确认 views/ 中无硬编码世界类型映射
