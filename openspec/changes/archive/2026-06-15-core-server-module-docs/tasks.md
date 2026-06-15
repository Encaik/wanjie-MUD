## 1. 创建 core/server/ 目录 & 迁移 instrumentation.ts

- [x] 1.1 创建 `src/core/server/` 目录，规划 `index.ts` + `instrumentation.ts` 文件结构
- [x] 1.2 将 `src/instrumentation.ts` 的内容移至 `src/core/server/instrumentation.ts`，更新导入路径（`@/app/api/init` → `@/core/../app/api/init`），更新 logger 标签
- [x] 1.3 创建 `src/core/server/index.ts`，导出 `register`
- [x] 1.4 将 `src/instrumentation.ts` 改为薄层 re-export：`export { register } from '@/core/server/instrumentation';`
- [x] 1.5 运行 `pnpm ts-check` 确认类型正确，`pnpm build` 确认构建成功
- [x] 1.6 确认 `src/instrumentation.ts` 无其他引用（`grep -r "instrumentation" src/` 应仅剩根目录文件和 core/server 自身）

## 2. 编写 core/README.md

- [x] 2.1 创建 `src/core/README.md`，列出所有 core 子模块的名称和职责描述
- [x] 2.2 确认 `core/README.md` 描述与子模块实际功能一致

## 3. 编写 modules/README.md

- [x] 3.1 创建 `src/modules/README.md`，按功能域分组列所有业务模块
- [x] 3.2 确认 `modules/README.md` 覆盖所有 modules 子目录且描述准确

## 4. 更新 .claude/rules/core.md

- [x] 4.1 在目录职责表新增 `core/server/` 条目
- [x] 4.2 在禁止行为清单中新增 5.5 节「README 文档同步」
- [x] 4.3 在 5.4 核心基础设施复用中补充 `core/server/` 到确认列表

## 5. 更新 CLAUDE.md（如有必要）

- [x] 5.1 更新 `CLAUDE.md` 五层架构描述补充 `server`；新增 `README 文档同步` 章节

## 6. 最终验证

- [x] 6.1 运行 `npx tsc --noEmit` 确保类型正确
- [x] 6.2 运行 `npx next build` 确保构建成功
- [x] 6.3 运行 ESLint 确保无新 lint 问题
- [x] 6.4 检查 `src/core/README.md` 和 `src/modules/README.md` 无遗漏模块
