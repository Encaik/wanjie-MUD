## ADDED Requirements

### Requirement: 核心约束规则文件
项目 SHALL 在 `.claude/rules/core.md` 中定义核心约束规则，包括文件行数上限、命名规范、目录职责边界、禁止行为清单。

#### Scenario: 文件行数约束
- **WHEN** AI Agent 生成新文件或修改现有文件
- **THEN** 生成的代码必须遵守核心规则中定义的行数上限（组件 ≤ 300 行、Hook ≤ 200 行、工具模块 ≤ 500 行、数据文件 ≤ 800 行）

#### Scenario: 目录职责判定
- **WHEN** AI Agent 需要放置新文件
- **THEN** 严格按照核心规则中的目录职责表选择放置位置，不得在 `lib/` 放置组件、不得在 `components/ui/` 添加自定义组件

#### Scenario: 禁止行为检查
- **WHEN** AI Agent 执行代码生成
- **THEN** 不得违反核心规则中的禁止行为清单（包括禁止重复定义类型、禁止组件内硬编码数值、禁止直接修改状态对象等）

### Requirement: 模块规范规则文件
项目 SHALL 在 `.claude/rules/modules.md` 中定义各模块的开发规范，包括 lib/game 纯函数规范、hooks 状态管理规范、components 组件规范、features 模块规范。

#### Scenario: lib/game 纯函数约束
- **WHEN** 在 `src/lib/game/` 中创建或修改文件
- **THEN** 所有导出函数必须是纯函数（相同输入 → 相同输出，无副作用），类型定义统一放在 `types.ts`，新模块在 `index.ts` 中导出

#### Scenario: Hooks 状态管理约束
- **WHEN** 创建或修改 React Hook
- **THEN** 必须遵循状态层级：全局状态 → useGameState（单一数据源）→ 功能 Hooks → 组件本地 useState；复杂操作封装在独立 Hook 文件中

#### Scenario: Features 模块规范
- **WHEN** 使用 `src/features/` 目录
- **THEN** 每个 feature 目录必须包含 `types.ts`（类型）、`components/`（UI 组件）、业务逻辑引用 `lib/game/` 纯函数，不得在 feature 内重复实现已有 lib/game 逻辑

### Requirement: 代码风格规则文件
项目 SHALL 在 `.claude/rules/style.md` 中定义代码风格规则，包括导入顺序、JSDoc 注释、命名约定、TypeScript 严格模式使用。

#### Scenario: 导入顺序强制
- **WHEN** 生成 TypeScript 文件
- **THEN** 导入必须按顺序组织：1) React 相关 → 2) 第三方库 → 3) @/ 别名 → 4) 相对路径，每组之间空行分隔

#### Scenario: JSDoc 注释要求
- **WHEN** 导出函数、类型、常量
- **THEN** 必须有 JSDoc 注释说明用途和参数，接口的每个字段必须有注释

#### Scenario: 严格 TypeScript
- **WHEN** 编写 TypeScript 代码
- **THEN** 禁止使用 `any` 类型（除非有 JSDoc 说明理由），所有函数参数和返回值必须有显式类型标注

### Requirement: 规则自动加载
`.claude/rules/` 目录下的规则文件 SHALL 在 AI Agent 启动时自动加载，无需人工干预。

#### Scenario: 会话初始化加载
- **WHEN** 新的 AI 会话开始
- **THEN** CLAUDE.md 或等效入口文件自动引用 `.claude/rules/` 下所有规则

#### Scenario: 规则更新生效
- **WHEN** 修改 `.claude/rules/` 下的规则文件
- **THEN** 下次 AI 会话自动使用新规则，无需额外配置
