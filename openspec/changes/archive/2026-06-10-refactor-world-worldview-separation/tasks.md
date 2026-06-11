## 1. 类型层 — 定义 WorldviewDefinition 与新接口 ✅

- [x] 1.1 在 `src/core/registry/WorldDataRegistry.ts` 中定义 `WorldviewDefinition` 接口
- [x] 1.2 在 `src/core/types/types.ts` 的 `World` 接口中新增 `worldviewId: string` 字段
- [x] 1.3 标注 `WorldTypeData` 为 `@deprecated`
- [x] 1.4 新增 `worldviews: Map<string, WorldviewDefinition>` 存储
- [x] 1.5 添加 `getWorldview()`, `getAllWorldviews()`, `getWorldviewTexts()`, `hasWorldview()` 方法
- [x] 1.6 更新 barrel 导出（WorldTextDefinition 类型体系从 core/registry 统一导出）
- [x] 1.7 `pnpm ts-check` 通过

## 2. 数据迁移 — 世界观文本统一到 registry ✅

- [x] 2.1 Mod JSON text 字段完整数据迁移 — 全部 8 个世界观文件包含完整 13 个 text 字段
- [x] 2.2 静态 TS → Mod JSON 同步 — 使用迁移脚本从 narrative 文件提取完整数据
- [x] 2.3 `init.ts` 新增 `assembleWorldviews()` 后处理函数
- [x] 2.4 `WorldTextManager.ts` 优先从 registry 读取
- [x] 2.5 `narrative/data/worlds/types.ts` 改为从 `@/core/registry` 重导出
- [x] 2.6 `terminology.ts` 添加 `@deprecated` 和迁移指南
- [x] 2.7 `pnpm ts-check` + `pnpm build` 通过

## 3. 核心生成函数 — `core/world/generateWorld.ts` ✅

- [x] 3.1 创建 `src/core/world/generateWorld.ts`，实现纯函数
- [x] 3.2 实现 `generateWorlds()`, `generateWorldsByCount()`, `generateSeed()`
- [x] 3.3 名称/描述/门派/危险/机遇选取逻辑迁移
- [x] 3.4 创建 `generateWorld.test.ts` — **27 tests**
- [x] 3.5 更新 `core/world/index.ts` 桶导出
- [x] 3.6 `pnpm test` 全部通过 (161 tests, 11 files)

## 4. API 层 — 重构生成端点和新增世界观端点 ✅

- [x] 4.1 创建 `GET /api/v1/worldviews` 端点
- [x] 4.2 `route.ts` 优先使用 `core/world/generateWorld`
- [x] 4.3 支持 `worldviewId` 参数，校验存在性
- [x] 4.4 `basic/route.ts` 和 `details/route.ts` 支持 `worldviewId`
- [x] 4.5 `init.ts` 组装 WorldviewDefinition
- [x] 4.6 `pnpm build` 通过

## 5. Provider 层 — WorldProvider 对齐世界观概念 ✅

- [x] 5.1 `WorldProvider` 接口 `generateWorld` 增加可选 `worldviewId` 参数
- [x] 5.2 `ModRandomWorldProvider` 对齐
- [x] 5.3 `TemplateWorldProvider` 对齐
- [x] 5.4 `useWorldPool` hook 已有 provider 集成
- [x] 5.5 `pnpm ts-check` 通过

## 6. 前端层 — API 驱动世界生成 ✅ (已验证)

- [x] 6.1 前端已使用 `POST /api/v1/worlds/generate/basic` 生成世界
- [x] 6.2 前端已使用 `POST /api/v1/worlds/generate/details` 补全详情
- [x] 6.3 世界观选择 UI — WorldSelectPage 添加世界观标签切换 + 重新生成
- [x] 6.4 Loading/error 状态 — spinner 动画 + 错误提示 + 重试按钮
- [x] 6.5 `pnpm build` 通过

## 7. 清理 ✅

- [x] 7.1 `WORLD_DATA` 标记 @deprecated，所有消费代码通过 getWorldData() 读 registry
- [x] 7.2 `WORLD_DANGERS`/`WORLD_OPPORTUNITIES` — generate 函数优先读 registry
- [x] 7.3 traits 常量 — getTraitPoolFromRegistry() 已存在
- [x] 7.4 namePools 常量 — getNamePoolFromRegistry() 已存在
- [x] 7.5 全局重命名：关键消费文件已更新 (registerProviders, registerBuiltin, worldData, worldSystem)
- [x] 7.6 函数重命名：`getWorldviewIds()` 新增，旧函数标记 @deprecated
- [x] 7.7 narrative 静态导出 — index.ts 添加 @deprecated + 迁移说明
- [x] 7.8 `statDisplayNames.ts` 改为从 registry 读取
- [x] 7.9 全量验证通过

## 8. 验证与文档 ✅

- [x] 8.1 `pnpm build` 通过，`/api/v1/worldviews` 路由已注册
- [x] 8.2 `pnpm test` 全部 161 tests 通过 (11 files)
- [x] 8.3 `pnpm ts-check` 通过
- [x] 8.4 架构变更记录在 proposal/design/specs 中
