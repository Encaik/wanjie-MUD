# claude-rules-system

## MODIFIED Requirements

### Requirement: 核心约束规则文件
项目 SHALL 在 `.claude/rules/core.md` 中定义核心约束规则，包括文件行数上限、命名规范、五层目录职责边界、禁止行为清单。

五层架构为：
```
src/
├── app/       ← ① Next.js 路由入口
├── views/     ← ② 页面组件（组合模块 Panel）
├── modules/   ← ③ 功能模块（20+ 自包含业务域）
├── core/      ← ④ 核心系统（游戏基础设施：事件、计算、世界、注册、Mod、引擎、服务端）
└── shared/    ← ⑤ 公共工具（跨模块工具性代码：AI、WebSocket、cn、logger）
```

#### Scenario: 文件行数约束
- **WHEN** AI Agent 生成新文件或修改现有文件
- **THEN** 生成的代码必须遵守核心规则中定义的行数上限（组件 ≤ 300 行、Hook ≤ 200 行、工具模块 ≤ 500 行、数据文件 ≤ 800 行）

#### Scenario: 目录职责判定
- **WHEN** AI Agent 需要放置新文件
- **THEN** 严格按照核心规则中的五层目录职责表选择放置位置。游戏核心基础设施（事件、计算、世界、注册、Mod、服务端）→ `core/`；跨模块工具性代码（cn、logger、AI、WebSocket）→ `shared/`；不得在 `shared/` 中放置核心游戏系统

#### Scenario: 禁止行为检查
- **WHEN** AI Agent 执行代码生成
- **THEN** 不得违反核心规则中的禁止行为清单（包括 `core/` 不能依赖 `modules/`、禁止在 `shared/` 中放置业务逻辑、禁止重复定义类型、禁止组件内硬编码数值等）

### Requirement: README 文档同步规则

项目 SHALL 在 `.claude/rules/core.md` 中增加 README 文档同步更新约束，确保 `src/core/README.md` 和 `src/modules/README.md` 与模块实际结构保持一致。

#### Scenario: 新增模块同步
- **WHEN** 在 `src/core/` 或 `src/modules/` 下新增子模块目录
- **THEN** 必须同步更新对应 README.md，添加新模块的名称和用途描述

#### Scenario: 删除模块同步
- **WHEN** 删除 `src/core/` 或 `src/modules/` 下的子模块目录
- **THEN** 必须同步更新对应 README.md，移除该模块的描述

#### Scenario: 重命名模块同步
- **WHEN** 重命名 `src/core/` 或 `src/modules/` 下的子模块目录
- **THEN** 必须同步更新对应 README.md，修改模块名称和（如适用）描述

#### Scenario: 变更前检查
- **WHEN** AI Agent 执行涉及 `src/core/` 或 `src/modules/` 子模块的新增、删除或重命名操作
- **THEN** 必须在变更前后检查对应 README.md 的内容并同步更新

## ADDED Requirements

### Requirement: core/server/ 目录职责

`.claude/rules/core.md` 的目录职责表 SHALL 包含 `core/server/` 条目。

#### Scenario: 职责描述存在
- **WHEN** 查看 `.claude/rules/core.md` 的目录职责表
- **THEN** 存在 `| core/server/` 行，描述其职责为「服务端核心代码（instrumentation、中间件等）」，禁止行为为「React 组件/Hooks、依赖 modules/」
