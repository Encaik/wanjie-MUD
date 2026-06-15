# claude-rules-system

## Purpose

TBD — see change project-quality-foundation for full context.

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: CLAUDE.md 设计文档同步规则

CLAUDE.md SHALL 增加「设计文档同步规则」章节，同步时机和规则如下：

1. **创建 OpenSpec Change 时**：如果变更涉及游戏设计改动，同步更新 `game-design/` 对应章节
2. **归档 OpenSpec Change 时**：追加一条记录到 `game-design/changelog.md`
3. **非 Change 小改动**：顺手更新对应章节，不做强制要求
4. **关系说明**：`game-design/` 记录"系统最终设计"，`openspec/changes/` 记录"变更过程"，两者互为补充

#### Scenario: 同步规则存在
- **WHEN** 审查 CLAUDE.md
- **THEN** 必须包含「设计文档同步规则」章节，涵盖上述 4 条规则

#### Scenario: 变更触发同步
- **WHEN** 创建新的 OpenSpec Change 且变更涉及游戏设计
- **THEN** 需要同步更新 `game-design/` 对应章节，AI Agent 应提示开发者执行此步骤

#### Scenario: 归档触发记录
- **WHEN** 归档 OpenSpec Change
- **THEN** 需要追加一条记录到 `game-design/changelog.md`，包含「改动」「原因」「涉及章节」字段

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

### Requirement: core/server/ 目录职责

`.claude/rules/core.md` 的目录职责表 SHALL 包含 `core/server/` 条目。

#### Scenario: 职责描述存在
- **WHEN** 查看 `.claude/rules/core.md` 的目录职责表
- **THEN** 存在 `| core/server/` 行，描述其职责为「服务端核心代码（instrumentation、中间件等）」，禁止行为为「React 组件/Hooks、依赖 modules/」
