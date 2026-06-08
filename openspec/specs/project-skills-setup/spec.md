# project-skills-setup

## Purpose

TBD — see change project-quality-foundation for full context.

## ADDED Requirements

### Requirement: 项目级 Skills 安装
项目 SHALL 安装并配置核心技能，包括 3 个代码质量技能（`code-review`、`simplify`、`verify`）以及经过 skills.sh 生态系统搜索和评估后引入的游戏设计和前端开发技能，总数不低于 5 个。

#### Scenario: Skills 已安装验证
- **WHEN** 检查 `.agents/skills/` 或 `.claude/skills/` 目录
- **THEN** 至少包含 `code-review`、`simplify`、`verify` 三个代码质量技能，以及至少 2 个来自 skills.sh 的游戏设计或前端开发技能（如 `game-developer`、`level-design`），每个包含可执行的技能定义文件

#### Scenario: Skills 可用性验证
- **WHEN** 用户输入 `/code-review`、`/simplify`、`/verify` 或新增技能的对应 slash 命令（如 `/game-developer`、`/level-design`）
- **THEN** 对应技能被正确触发，按项目规范执行对应流程

### Requirement: code-review 技能定制
`code-review` 技能 SHALL 针对万界修行录项目定制审查规则，包括检查目录职责合规、大文件警告、类型滥用检测、游戏逻辑纯函数验证。

#### Scenario: 目录合规检查
- **WHEN** `/code-review` 审查变更加
- **THEN** 报告任何违反目录职责规则的代码（如 lib/ 中出现 React 组件、components/ui/ 中出现自定义代码）

#### Scenario: 大文件警告
- **WHEN** 审查的文件超过规范行数上限（组件 300、Hook 200、工具 500、数据 800）
- **THEN** 输出警告并建议拆分方案

#### Scenario: 类型滥用检测
- **WHEN** 审查 TypeScript 文件
- **THEN** 标记所有 `any` 类型使用，推荐具体类型替代方案

### Requirement: simplify 技能定制
`simplify` 技能 SHALL 针对项目特性进行代码简化，识别重复逻辑、过度抽象、可提取的公共函数。

#### Scenario: 重复逻辑识别
- **WHEN** `/simplify` 运行代码分析
- **THEN** 检测 `src/lib/game/` 和 `src/features/` 中功能重复的函数，建议合并或提取到共享模块

#### Scenario: 组件简化
- **WHEN** `/simplify` 分析组件
- **THEN** 建议提取过长组件到子组件、将内联渲染函数抽取为独立组件、移除未使用的 props 和导入

### Requirement: verify 技能定制
`verify` 技能 SHALL 通过运行测试和构建验证变更的正确性，适配项目的 vitest + Next.js 技术栈。

#### Scenario: 测试执行
- **WHEN** `/verify` 运行
- **THEN** 执行 `pnpm test` 和 `pnpm ts-check`，报告所有失败项

#### Scenario: 构建验证
- **WHEN** `/verify` 运行构建检查
- **THEN** 执行 `pnpm build` 确保静态导出无错误

#### Scenario: 游戏逻辑回归检查
- **WHEN** 涉及 `src/lib/game/` 的变更
- **THEN** 额外运行与变更相关的游戏逻辑单元测试，确保数值计算和状态转换正确

### Requirement: 第三方技能兼容性规则

所有安装到项目级的第三方技能 SHALL 遵循 CLAUDE.md 中定义的规则体系。当第三方技能建议与项目规则冲突时，项目规则优先级更高。

#### Scenario: 规则优先级
- **WHEN** 第三方技能的建议违反核心规则（如在 lib/ 中建议使用 React 组件、推荐使用 any 类型等）
- **THEN** Agent 以 CLAUDE.md 规则为准，忽略冲突建议

#### Scenario: 技能目录共存
- **WHEN** 第三方技能通过 `npx skills add` 安装
- **THEN** 技能文件安装到 `.agents/skills/` 目录（universal 格式）或 `.claude/skills/` 目录，与项目自有技能共存

### Requirement: 技能分类管理

项目 SHALL 按功能领域对已安装技能进行分类管理，分为：代码质量类（code-quality）、工作流类（workflow）、游戏设计类（game-design）、前端开发类（frontend-dev）。

#### Scenario: 分类清单维护
- **WHEN** 查看项目技能清单（如 `AIREADME.md` 的 Skills 章节）
- **THEN** 每个技能标注其分类，便于用户了解各技能的用途和适用场景

#### Scenario: 技能发现报告
- **WHEN** 需要完整的技能评估和推荐清单
- **THEN** 参考 `doc/reference/skills-discovery-report.md` 获取跨 6 个领域的候选技能评估和 P0/P1/P2 分级推荐
