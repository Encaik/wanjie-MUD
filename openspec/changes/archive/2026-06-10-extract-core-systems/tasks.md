## 1. 准备工作 — 创建 core/ 目录结构

- [x] 1.1 运行质量门禁基线：`pnpm ts-check && pnpm lint && pnpm build && pnpm test`
- [x] 1.2 创建 `src/core/` 顶级目录
- [x] 1.3 创建 `core/` 七个子目录：`events/`、`types/`、`calculation/`、`world/`、`registry/`、`mod/`、`engine/`
- [x] 1.4 确认 `tsconfig.json` 中 `@/*` 路径别名覆盖率含 `src/core/`

## 2. 迁移 — 核心类型 `shared/lib/types*.ts` → `core/types/`

- [x] 2.1 复制 `shared/lib/types.ts` → `core/types/types.ts`，更新内部相对导入路径
- [x] 2.2 复制 `shared/lib/typesExtension.ts` → `core/types/typesExtension.ts`，更新导入路径（`./types`）
- [x] 2.3 创建 `core/types/index.ts` 桶导出文件
- [x] 2.4 在 `shared/lib/types.ts` 添加 barrel re-export：`export * from '@/core/types'`
- [x] 2.5 在 `shared/lib/typesExtension.ts` 添加 barrel re-export：`export * from '@/core/types'`

## 3. 迁移 — 事件系统 `shared/lib/events/` → `core/events/`

- [x] 3.1 复制 `shared/lib/events/types.ts` → `core/events/types.ts`
- [x] 3.2 复制 `shared/lib/events/events.ts` → `core/events/events.ts`，更新 import 为 `@/core/types`
- [x] 3.3 复制 `shared/lib/events/eventManager.ts` → `core/events/eventManager.ts`
- [x] 3.4 复制 `shared/lib/events/eventMatcher.ts` → `core/events/eventMatcher.ts`
- [x] 3.5 创建 `core/events/index.ts` 桶导出，更新内部导入路径
- [x] 3.6 更新 `shared/lib/events/index.ts` 为 barrel re-export 到 `@/core/events`

## 4. 迁移 — 数值计算引擎 `shared/lib/calculation/` → `core/calculation/`

- [x] 4.1 复制 `shared/lib/calculation/` 全部文件到 `core/calculation/`
- [x] 4.2 更新 `core/calculation/` 内部所有 `@/shared/lib/types` import 为 `@/core/types`
- [x] 4.3 更新 `core/calculation/index.ts` 桶导出
- [x] 4.4 更新 `shared/lib/calculation/index.ts` 为 barrel re-export 到 `@/core/calculation`

## 5. 迁移 — 世界系统 `shared/lib/world/` → `core/world/`

- [x] 5.1 复制 `shared/lib/world/` 全部文件（含测试）到 `core/world/`
- [x] 5.2 更新 `core/world/` 内部所有 `@/shared/lib/types` import 为 `@/core/types`
- [x] 5.3 更新 `core/world/index.ts` 桶导出
- [x] 5.4 更新 `shared/lib/world/index.ts` 为 barrel re-export 到 `@/core/world`

## 6. 迁移 — 注册中心 `shared/lib/registry/` → `core/registry/`

- [x] 6.1 复制 `shared/lib/registry/` 全部文件（含测试）到 `core/registry/`
- [x] 6.2 更新 `core/registry/` 内部 import 路径（`@/shared/lib/types` → `@/core/types`，`@/shared/lib/world` → `@/core/world`）
- [x] 6.3 创建/更新 `core/registry/index.ts` 桶导出
- [x] 6.4 更新 `shared/lib/registry/index.ts` 为 barrel re-export 到 `@/core/registry`

## 7. 迁移 — Mod 系统 `shared/lib/mod/` → `core/mod/`

- [x] 7.1 复制 `shared/lib/mod/` 全部文件（含测试）到 `core/mod/`
- [x] 7.2 更新 `core/mod/` 内部 import 路径（`@/shared/lib/types` → `@/core/types`）
- [x] 7.3 创建/更新 `core/mod/index.ts` 桶导出
- [x] 7.4 更新 `shared/lib/mod/index.ts` 为 barrel re-export 到 `@/core/mod`

## 8. 迁移 — 引擎集成层 → `core/engine/`

- [x] 8.1 复制 `shared/lib/gameSystems.ts` → `core/engine/gameSystems.ts`，更新 import 路径
- [x] 8.2 复制 `shared/lib/expansionLogic.ts` → `core/engine/expansionLogic.ts`，更新 import 路径
- [x] 8.3 复制 `shared/lib/messageDB.ts` → `core/engine/messageDB.ts`，更新 import 路径
- [x] 8.4 创建 `core/engine/index.ts` 桶导出
- [x] 8.5 在 `shared/lib/gameSystems.ts`、`expansionLogic.ts`、`messageDB.ts` 添加 barrel re-export

## 9. 验证 — 构建与测试（中间检查点）

- [x] 9.1 运行 `pnpm ts-check` 确认类型检查通过
- [x] 9.2 运行 `pnpm build` 确认静态导出构建成功
- [x] 9.3 运行 `pnpm test` 确认全部测试通过
- [x] 9.4 运行 `pnpm lint` 确认无 ESLint 错误

## 10. 更新代码引用 — 分批迁移 import 路径

- [x] 10.1 全局搜索 `@/shared/lib/events` 引用，分批更新为 `@/core/events`
- [x] 10.2 全局搜索 `@/shared/lib/types`（排除 barrel 自身），分批更新为 `@/core/types`
- [x] 10.3 全局搜索 `@/shared/lib/calculation`，分批更新为 `@/core/calculation`
- [x] 10.4 全局搜索 `@/shared/lib/world`，分批更新为 `@/core/world`
- [x] 10.5 全局搜索 `@/shared/lib/registry`，分批更新为 `@/core/registry`
- [x] 10.6 全局搜索 `@/shared/lib/mod`，分批更新为 `@/core/mod`
- [x] 10.7 更新 `shared/lib/gameSystems.ts`、`expansionLogic.ts`、`messageDB.ts` 的引用为 `@/core/engine`
- [x] 10.8 确认零处 `@/shared/lib/events` 等旧路径的直接 import（只能通过 barrel）

## 11. 更新架构文档

- [x] 11.1 更新 `CLAUDE.md`：四层架构 → 五层架构，新增 `core/` 层说明和决策树
- [x] 11.2 更新 `.claude/rules/core.md`：目录职责表新增 `core/` 行；新增 `core/` 约束规则（不可依赖 modules/、不可包含 React 组件等）
- [x] 11.3 更新 `.claude/rules/modules.md`：模块结构说明中添加对 `core/` 的依赖关系
- [x] 11.4 更新 `.claude/rules/data-flow.md`：调用链总图新增 `core/` 层
- [x] 11.5 更新 `.claude/rules/style.md`：导入顺序中的 `@/` 别名说明加入 `@/core/`

## 12. 收尾清理

- [x] 12.1 删除 `shared/lib/events/` 中原文件（保留 barrel index.ts）
- [x] 12.2 删除 `shared/lib/types.ts` 和 `typesExtension.ts` 原内容（保留 barrel re-export）
- [x] 12.3 删除 `shared/lib/calculation/` 中原文件（保留 barrel index.ts）
- [x] 12.4 删除 `shared/lib/world/` 中原文件（保留 barrel index.ts）
- [x] 12.5 删除 `shared/lib/registry/` 中原文件（保留 barrel index.ts）
- [x] 12.6 删除 `shared/lib/mod/` 中原文件（保留 barrel index.ts）
- [x] 12.7 删除 `shared/lib/gameSystems.ts`、`expansionLogic.ts`、`messageDB.ts` 原内容（改为 barrel re-export）
- [x] 12.8 迁移测试文件到 `core/` 对应目录（交叉检查 vitest 配置无需更新）

## 13. 最终验证

- [x] 13.1 运行完整质量门禁：`pnpm lint:strict && pnpm ts-check && pnpm build && pnpm test`
- [x] 13.2 运行 `pnpm check-sizes` 确认文件大小合规
- [x] 13.3 运行 `pnpm dev` 启动开发服务器，手动验证游戏流程正常
- [x] 13.4 确认 `src/` 顶层为五目录：`app/`、`views/`、`modules/`、`core/`、`shared/`
- [x] 13.5 确认 `src/shared/lib/` 中只有 `ai/`、`websocket/`、`multiplayer/` 三个子目录（加少量 barrel re-export 文件）
