## MODIFIED Requirements

### Requirement: 核心约束规则文件
项目 SHALL 在 `.claude/rules/core.md` 中定义核心约束规则，包括文件行数上限、命名规范、五层目录职责边界、禁止行为清单。

五层架构为：
```
src/
├── app/       ← ① Next.js 路由入口
├── views/     ← ② 页面组件（组合模块 Panel）
├── modules/   ← ③ 功能模块（15个自包含业务域）
├── core/      ← ④ 核心系统（游戏基础设施：事件、计算、世界、注册、Mod、引擎）
└── shared/    ← ⑤ 公共工具（跨模块工具性代码：AI、WebSocket、cn、logger）
```

#### Scenario: 文件行数约束
- **WHEN** AI Agent 生成新文件或修改现有文件
- **THEN** 生成的代码必须遵守核心规则中定义的行数上限（组件 ≤ 300 行、Hook ≤ 200 行、工具模块 ≤ 500 行、数据文件 ≤ 800 行）

#### Scenario: 目录职责判定
- **WHEN** AI Agent 需要放置新文件
- **THEN** 严格按照核心规则中的五层目录职责表选择放置位置。游戏核心基础设施（事件、计算、世界、注册、Mod）→ `core/`；跨模块工具性代码（cn、logger、AI、WebSocket）→ `shared/`；不得在 `shared/` 中放置核心游戏系统

#### Scenario: 禁止行为检查
- **WHEN** AI Agent 执行代码生成
- **THEN** 不得违反核心规则中的禁止行为清单（包括 `core/` 不能依赖 `modules/`、禁止在 `shared/` 中放置业务逻辑、禁止重复定义类型、禁止组件内硬编码数值等）

### Requirement: 模块规范规则文件
项目 SHALL 在 `.claude/rules/modules.md` 中定义各层的开发规范，包括 `core/` 纯逻辑约束、`modules/` 业务模块规范、`hooks/` 状态管理规范、`views/` 页面组件规范、`shared/` 公共代码规范。

#### Scenario: core/ 核心系统约束
- **WHEN** 在 `src/core/` 中创建或修改文件
- **THEN** 所有导出函数必须是纯逻辑基础设施（事件总线、计算引擎、注册中心等纯函数），不得包含 React 组件或 Hooks，不得依赖 `modules/` 中的任何代码。每个子目录必须包含 `index.ts` 桶导出。

#### Scenario: Modules 业务模块规范
- **WHEN** 在 `src/modules/` 中创建或修改模块
- **THEN** 每个模块必须遵循 `index.ts` + `types.ts` + `logic/` + `hooks/` + `components/` + `data/` 结构。模块可以依赖 `core/` 和 `shared/`，但不可依赖其他模块的 `hooks/` 或 `components/`（跨模块通信通过 `core/events/` 事件总线）。

#### Scenario: Hooks 状态管理约束
- **WHEN** 创建或修改 React Hook
- **THEN** 必须遵循状态层级：全局状态 → useGameState（单一数据源）→ 模块 Hooks → 组件本地 useState；每个模块 Hook 只访问自己模块的 state slice，跨模块写入通过事件总线

#### Scenario: Shared 公共代码约束
- **WHEN** 在 `src/shared/` 中创建或修改文件
- **THEN** 代码必须是跨模块工具性代码（cn、logger、rng、AI、WebSocket、multiplayer），不得包含游戏核心系统和业务逻辑。`shared/` 可以依赖 `core/`，但不可依赖 `modules/`。
