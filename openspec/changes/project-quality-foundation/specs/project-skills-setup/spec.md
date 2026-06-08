## ADDED Requirements

### Requirement: 项目级 Skills 安装
项目 SHALL 安装并配置 3 个核心技能：`code-review`（代码审查）、`simplify`（代码简化）、`verify`（变更验证），适配万界修行录项目规范。

#### Scenario: Skills 已安装验证
- **WHEN** 检查 `.claude/skills/` 目录
- **THEN** 至少包含 `code-review/`、`simplify/`、`verify/` 三个技能目录，每个包含可执行的技能定义文件

#### Scenario: Skills 可用性验证
- **WHEN** 用户输入 `/code-review`、`/simplify` 或 `/verify`
- **THEN** 对应技能被正确触发，按项目规范执行审查/简化/验证流程

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
