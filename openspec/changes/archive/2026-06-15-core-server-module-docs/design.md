## Context

目前 `src/instrumentation.ts`（Next.js `register()` 钩子）散落在 `src/` 根目录，与五层架构的模块化设计不符。该文件负责服务端启动时的世界系统初始化，属于服务端核心基础设施，应归属 `core/` 下的统一目录。

同时，`core/`（10 个子模块）和 `modules/`（20 个子模块）快速增长，但缺少一份总览 README，让新人和 AI Agent 需要逐个翻阅 `types.ts` 或 `index.ts` 才能了解模块用途。`CLAUDE.md` 和 `.claude/rules/` 中对 README 文档的维护要求尚未明确，容易出现文档滞后。

## Goals / Non-Goals

**Goals:**

- 建立 `core/server/` 目录作为服务端非业务核心代码的统一存放位置
- 将 `src/instrumentation.ts` 迁移到 `core/server/instrumentation.ts`，保持功能完全一致
- 编写 `core/README.md`，列出所有 core 子模块的名称、职责、关键导出
- 编写 `modules/README.md`，按功能域分组列出所有 modules 子模块的名称、用途
- 在 `.claude/rules/core.md` 中新增：`core/server/` 目录职责 + 变更时同步更新 README 的规则
- 建立文档维护的约束制度，防止再次脱节

**Non-Goals:**

- 不改变 `instrumentation.ts` 的内部实现逻辑
- 不重新组织或合并现有 core/modules 子模块（仅文档化现有结构）
- 不添加 `core/server/` 下其他文件（仅作为目录骨架 + instrumentation.ts）
- 不涉及 `shared/`、`app/`、`views/` 的文档

## Decisions

### 决策 1：`core/server/` 的目录定位

**选择**：`core/server/` 作为服务端非业务核心代码的目录。

**理由**：
1. `core/` 的定位是「游戏基础设施」，服务端启动钩子属于基础设施而非业务逻辑
2. `core/` 本身不包含业务逻辑、不与 `modules/` 耦合，与 `instrumentation.ts` 的特性一致
3. 与 `core/engine/`、`core/events/` 等已有目录平级，语义清晰
4. 未来类似的服务端核心工具（如 Next.js 中间件、server-only 工具函数）可以放入此目录

**替代考虑**：放入 `shared/server/` 或 `core/engine/`。前者不符合「`shared/` 不含业务逻辑」也不符「`shared/` 是跨模块通用工具」的定位；后者会模糊 `engine/` 的「引擎集成层」焦点。

### 决策 2：instrumentation.ts 迁移方案

**选择**：直接移动 + 旧位置建立 barrel re-export 过渡。

**理由**：
1. `instrumentation.ts` 是 Next.js 约定的特殊文件（文件名固定），必须保持在项目根目录 `src/` 下。Next.js 会在 `src/` 下查找 `instrumentation.ts`，无法通过别名重定位。
2. 因此，`src/instrumentation.ts` 保留为薄层 re-export 文件，实际实现在 `src/core/server/instrumentation.ts`。
3. 这与 Next.js 的 `instrumentation.ts` 约定兼容，且符合「内容唯一原则」——实际逻辑在 `core/server/`，根目录文件仅作钩子。

**文件布局**：
```
src/
├── instrumentation.ts          ← 保留，内容改为：export { register } from '@/core/server/instrumentation';
└── core/
    └── server/
        ├── index.ts            ← barrel export，导出 register
        └── instrumentation.ts  ← 实际实现（从原位置移动）
```

### 决策 3：README 的内容颗粒度

**选择**：`core/README.md` 列每个子模块一行和一句描述；`modules/README.md` 按功能域分组，每个模块一行和一句描述。

**理由**：
1. 颗粒度适中——提供足够的上下文来了解模块用途，又不至于过于冗长
2. 比「逐个打开 `types.ts`」高效，比「产出一份 50 页文档」轻量，适合持续维护
3. 按功能域分组（如「成长系统」「社交系统」）可以帮助新读者理解模块间关系

### 决策 4：README 同步维护机制

**选择**：在 `.claude/rules/core.md` 中新增明确条目，要求「创建、删除或重命名模块时，必须同步更新对应 README」。

**理由**：
1. 规则文件是 AI Agent 的强制阅读内容，写入此处确保每次代码生成时都能遵守
2. 同时更新 `CLAUDE.md` 中的「Quick Commands」或「Supplementary Conventions」段，做上层提醒
3. 不引入自动化脚本（如 CI check），因为模块增减频率不高，人工维护成本可接受

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| `instrumentation.ts` 迁移后，有未发现的 import 引用 | 迁移前运行 `grep -r 'instrumentation' src/` 确认所有引用点 |
| README 更新为约束后，仍然被忽略 | 在 `CLAUDE.md` 的 Supplementary Conventions 中增加醒目提示，且在变更后检查流程中提醒 |
| 模块描述过于简略，不足以指导开发 | 描述使用「动词+目的」格式（如「处理战斗伤害计算、回合流程和胜负判定」），后续可按需补充 |
