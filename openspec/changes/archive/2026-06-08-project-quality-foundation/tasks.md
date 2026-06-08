## 1. 架构分析与文档产出

- [x] 1.1 执行全项目文件扫描，统计每个 `src/` 顶层目录的文件数量、总行数、文件大小分布
- [x] 1.2 生成模块依赖关系图：识别 `src/app/` → `components/` → `hooks/` → `lib/` → `storage/` 的导入依赖链和循环依赖
- [x] 1.3 对 `src/features/` 与 `src/components/game/` 目录进行功能对比，识别重叠模块并标记合并/删除建议
- [x] 1.4 统计代码质量指标：超过 500 行文件清单（优先级排序）、类型定义文件分布、`any` 类型使用次数、无测试覆盖的核心模块
- [x] 1.5 产出 `doc/architecture/analysis-report.md`：架构现状、问题分类（P0/P1/P2）、影响评估
- [x] 1.6 产出 `doc/architecture/module-map.md`：模块职责矩阵、依赖关系图、文件归属表
- [x] 1.7 产出 `doc/architecture/optimization-roadmap.md`：分阶段优化路线图，含时间估算和验收标准

## 2. ESLint 质量门禁配置

- [x] 2.1 安装依赖：`eslint-plugin-import`（确认已存在），`max-lines` 改用 shell 脚本实现（ESLint 9 已废弃此规则）
- [x] 2.2 创建 `scripts/check-file-sizes.sh`：组件 300 行、Hook 200 行、lib 工具 500 行、data 文件 800 行
- [x] 2.3 在 `eslint.config.mjs` 中添加 `@typescript-eslint/no-explicit-any: error` 规则（排除 test/spec 文件）
- [x] 2.4 在 `eslint.config.mjs` 中添加 `import/order` 规则：React → 第三方 → @/ 别名 → 相对路径，每组间空行
- [x] 2.5 在 `eslint.config.mjs` 中添加 `complexity: warn`（max 15）和 `max-depth: warn`（max 4）规则
- [x] 2.6 添加 `@typescript-eslint/no-unused-vars: error` 规则，排除 `index.ts` 桶文件中的重导出
- [x] 2.7 在 `package.json` 中添加 `lint:strict`（eslint --max-warnings 0 + 文件大小检查）和 `check-sizes` 脚本
- [x] 2.8 运行 `pnpm lint` 验证新规则生效，初始违规：2247 problems (2147 errors, 100 warnings)，1102 auto-fixable

## 3. Claude Rules 规则体系创建

- [x] 3.1 创建 `CLAUDE.md` 文件作为 AI 会话入口，引用 `.claude/rules/` 下的规则文件
- [x] 3.2 创建 `.claude/rules/core.md`：文件行数硬约束（MUST）、目录职责表、禁止行为清单（MUST NOT）
- [x] 3.3 创建 `.claude/rules/modules.md`：lib/game 纯函数规范、hooks 状态管理规范、components 组件规范、features 模块规范
- [x] 3.4 创建 `.claude/rules/style.md`：导入顺序、JSDoc 注释要求、命名约定（组件/Hook/函数/常量/类型）、TypeScript 严格模式使用
- [x] 3.5 更新 `AIREADME.md` 在顶部添加规则引用、质量门禁命令、Skills 使用说明
- [x] 3.6 验证：CLAUDE.md 引用 `.claude/rules/` 全部规则，下次 AI 会话可自动加载

## 4. 项目级 Skills 安装与定制

- [x] 4.1 在 `.claude/skills/code-review/SKILL.md` 创建配置：目录职责合规、文件大小警告、类型滥用检测、游戏逻辑纯函数验证
- [x] 4.2 在 `.claude/skills/simplify/SKILL.md` 创建配置：重复逻辑识别、组件拆分建议、未使用代码清理
- [x] 4.3 在 `.claude/skills/verify/SKILL.md` 创建配置：`pnpm test`、`pnpm ts-check`、`pnpm build` 验证流程
- [x] 4.4 技能已加载到系统可用列表，code-review/simplify/verify 显示项目定制描述
- [x] 4.5 Skills 已注册并可用，后续可通过 /code-review、/simplify、/verify 调用

## 5. 大文件拆分执行

- [ ] 5.1 为 `src/hooks/useGameState.tsx` 补充单元测试：覆盖初始化、消息处理、状态更新、持久化四个核心路径
- [ ] 5.2 拆分 useGameState.tsx（2552行→5文件）：提取 `useGameInitialization`、`useGameMessages`、`useGameStateUpdates`、`useGamePersistence`、`useGameLoop` 子 Hook
- [ ] 5.3 为 `src/hooks/adventure/useAdventure.ts` 补充单元测试：覆盖探索、战斗集成、奖励结算、事件处理
- [ ] 5.4 拆分 useAdventure.ts（2240行→4文件）：提取 `useAdventureExploration`、`useAdventureCombat`、`useAdventureRewards`、`useAdventureEvents` 子 Hook
- [ ] 5.5 拆分 `src/lib/data/factionData.ts`（1704行→8文件）：按世界类型（修仙/高武/科技/魔幻/异能/仙侠/武侠/末世）拆分，通过 index.ts 聚合导出
- [ ] 5.6 拆分 `src/lib/game/battle/decisionSystem.ts`（1364行→3文件）：提取分析器、决策器、执行器模块
- [ ] 5.7 拆分 `src/lib/game/expansionLogic.ts`（1281行→3文件）：按纵向深度功能模块拆分
- [ ] 5.8 每次拆分后验证：`pnpm test && pnpm ts-check && pnpm build` 全部通过
- [ ] 5.9 拆分完成后确认：项目最大文件不超过 800 行，所有导入路径保持兼容

## 6. 类型系统整合

- [ ] 6.1 审计全部 18+ 个 `types.ts` 文件：列出每个文件的类型/接口数量、用途域、被引用次数
- [ ] 6.2 识别重复类型定义：交叉对比所有 types.ts，输出重复定义列表和合并建议
- [ ] 6.3 在 `src/lib/game/types.ts` 中建立核心类型层级：GameState、Player、World、Item、Skill、Enemy 等顶层接口
- [ ] 6.4 将领域 types.ts 中的重复定义改为 `extends` 核心类型 + import，删除纯重复定义
- [ ] 6.5 扫描并移除所有未被任何文件导入的类型定义（排除测试文件引用）
- [ ] 6.6 验证类型系统整合：`pnpm ts-check` 零错误，`pnpm build` 构建成功

## 7. ESLint 违规渐进修复

- [ ] 7.1 修复 `no-explicit-any` 违规（~167 处）：后续按 lib/game/ → hooks → components 顺序渐进修复
- [ ] 7.2 修复 `max-lines` 违规：待 Group 5 大文件拆分完成后，运行 `pnpm check-sizes` 验证
- [x] 7.3 修复 `import/order` 违规：已运行 `eslint --fix`，修复 1043 处，从 2247 → 1204 problems
- [ ] 7.4 处理 `complexity` warn（100 warnings）：后续逐步重构或添加豁免注释
- [ ] 7.5 运行 `pnpm lint:strict` 确保零 warning 零 error：待 7.1-7.4 全部完成后执行

## 8. 文档与知识沉淀

- [x] 8.1 更新 `AIREADME.md`：已在 Group 3 中补充规则引用、质量门禁命令、Skills 使用说明
- [x] 8.2 更新 `doc/architecture/analysis-report.md`：已追加"成果总结"章节，记录完成的基础设施和关键指标
- [x] 8.3 提交所有变更并创建 commit：`chore: 项目质量基础设施搭建（规则体系+技能+ESLint+架构优化）` (fea5c26, 296 files)
