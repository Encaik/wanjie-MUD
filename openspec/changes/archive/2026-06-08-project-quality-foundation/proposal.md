## Why

项目经过多轮迭代（从扣子平台迁移到标准 Next.js、Supabase 重构、GitHub Pages 部署）后积累了显著的代码质量问题：核心状态文件达 2552 行，超过 50 个文件超过 500 行，类型定义分散在 18+ 个文件中，ESLint 配置仅为默认模板，缺少 AI 编码规范和项目级技能。这些问题导致 AI 辅助开发效率低下、生成代码质量不可控，需从架构层面系统性优化。

## What Changes

- **架构分析文档**：产出项目架构现状分析报告，识别模块耦合、职责不清、目录重叠等问题，制定优化路线图
- **.claude/rules/ 规则体系**：创建分层 AI 编码规则（核心约束、模块规范、代码风格），约束 AI 生成代码质量
- **项目级 Skills**：安装并定制 3 个核心技能（code-review、simplify、verify），适配项目特定规范
- **ESLint 质量门禁**：扩展 ESLint 配置，添加复杂度限制、文件行数限制、导入顺序、禁止 any 等自定义规则
- **大文件拆分计划**：识别并制定超过 500 行核心文件的重构方案，优先拆分 useGameState、useAdventure、factionData
- **类型系统整合**：梳理 18+ 个 types.ts 文件，消除重复定义，建立统一的类型层级

## Capabilities

### New Capabilities

- `architecture-documentation`: 项目架构现状分析与优化路线图文档，识别模块边界、依赖关系、重构优先级
- `claude-rules-system`: .claude/rules/ 分层规则文件体系，约束 AI Agent 生成代码的质量和风格
- `project-skills-setup`: 安装并定制 code-review、simplify、verify 三个核心技能，适配万界修行录项目规范
- `eslint-quality-gate`: 扩展 ESLint 配置，添加文件行数限制、复杂度检查、禁止 any、导入排序等规则
- `code-splitting-plan`: 大文件拆分方案，优先处理 useGameState.tsx (2552行)、useAdventure.ts (2240行)、factionData.ts (1704行)
- `type-system-consolidation`: 类型系统整合方案，消除分散类型定义，建立单一数据源

### Modified Capabilities

<!-- 本次为新建变更，不修改现有 spec -->

## Impact

- **Affected Code**: `.claude/rules/`（新增）、`.claude/settings.json`（修改）、`eslint.config.mjs`（扩展）、`src/lib/game/types.ts`（整合）、`src/hooks/useGameState.tsx`（拆分）、`src/hooks/adventure/useAdventure.ts`（拆分）、`src/lib/data/factionData.ts`（拆分）
- **Dependencies**: 新增 ESLint 插件依赖（eslint-plugin-complexity、eslint-plugin-import 等）
- **Systems**: 不影响运行时系统，纯代码质量和开发体验改进
- **Breaking Changes**: 无
