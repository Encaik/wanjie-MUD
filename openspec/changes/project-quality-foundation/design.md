## Context

万界修行录经过 3 轮重大重构（扣子平台解耦 → 标准 Next.js 静态导出 → Supabase 重构 → GitHub Pages 部署），功能快速迭代过程中积累了显著的代码质量问题：

- **核心状态文件巨大**：useGameState.tsx 2552 行，useAdventure.ts 2240 行
- **类型定义分散**：18+ 个 types.ts 文件散布在不同模块，存在重复定义风险
- **目录结构重叠**：`src/features/` 和 `src/components/game/` 功能重叠（如 shop、faction）
- **ESLint 过于宽松**：仅使用 Next.js 默认规则，无复杂度/行数限制
- **AI 开发规范缺失**：仅有 README 级别规范，无机器可执行的规则和技能
- **测试覆盖薄弱**：30 个测试文件覆盖 455 个源文件

本次变更的核心思路是：**先建立规范和工具基础设施，再按优先级渐进式优化代码结构**。所有产出物（规则、技能、配置）是持久化资产，持续约束后续 AI 生成代码的质量。

## Goals / Non-Goals

**Goals:**
- 建立 `.claude/rules/` 三层规则体系（core → modules → style），AI 每次会话自动加载
- 安装并定制 3 个核心技能（code-review / simplify / verify），适配项目技术栈
- 扩展 ESLint 配置，引入行数/复杂度/any 禁止/导入排序规则
- 产出架构分析报告，明确模块边界和重构优先级
- 制定大文件拆分方案和类型系统整合方案

**Non-Goals:**
- 不在此变更中执行大文件拆分（仅制定方案）
- 不重构运行时功能（游戏逻辑不改变）
- 不引入新的第三方状态管理库（保持现有的 useGameState 模式）
- 不强制 100% 测试覆盖率（仅要求大文件拆分时有测试保护）
- 不修改 shadcn/ui 组件（components/ui/ 保持不可变）

## Decisions

### Decision 1: 规则文件采用 Markdown 格式 + CLAUDE.md 引用

**选择**：在 `.claude/rules/` 下创建 `.md` 文件，通过 CLAUDE.md 引用自动加载。

**备选方案**：
- `.cursorrules` 单文件格式 — 已有但专用于 Cursor IDE，不够通用
- JSON/YAML schema 格式 — 结构化但可读性差，AI 不易理解
- 直接在 CLAUDE.md 内联 — 会导致 CLAUDE.md 过长

**理由**：Markdown 格式的规则文件既人类可读也 AI 友好，且 Claude Code 支持 CLAUDE.md 自动加载机制。通过 `CLAUDE.md` 中 `@.claude/rules/core.md` 引用，无需额外工具即可生效。

### Decision 2: 三层规则结构（core → modules → style）

**选择**：按关注点分为三层：
```
.claude/rules/
├── core.md        # 文件行数、目录职责、禁止行为（硬约束）
├── modules.md     # lib/game、hooks、components、features 模块规范
└── style.md       # 导入顺序、命名约定、JSDoc、TypeScript 严格模式
```

**理由**：
- 分层便于维护和渐进增强
- `core.md` 是硬约束（违反=错误），`modules.md` 是模块规范（违反=警告），`style.md` 是风格指南（违反=建议）
- 不同 Skill 可引用不同层级（如 code-review 引用 core+modules，simplify 引用 modules+style）

### Decision 3: Skills 采用项目配置覆盖模式

**选择**：不为 3 个技能创建完整重写，而是在 `.claude/skills/` 中创建配置文件，覆盖内置技能的参数和行为。

**备选方案**：
- 完全自定义 Skill 文件 — 工作量大，难以同步上游更新
- 仅依靠内置 Skills — 无法适配项目特定规范（如目录职责、游戏逻辑纯函数验证）

**理由**：内置的 `code-review`、`simplify`、`verify` 技能已提供通用能力，通过配置覆盖（审查维度、检查规则、技术栈适配）即可满足项目需求。后续可持续增强配置而不影响技能核心逻辑。

具体技能配置：
```yaml
# code-review 配置
dimensions:
  - bugs: true
  - security: false        # 本项目为纯前端静态游戏，不需要安全检查
  - reuse-simplification: true
  - architecture: true     # 新增：目录职责合规检查
custom_rules:
  - no_react_in_lib
  - no_custom_in_ui
  - pure_functions_in_game_lib
file_limits:
  component: 300
  hook: 200
  utility: 500
```

### Decision 4: ESLint 使用 flat config + 轻量插件组合

**选择**：扩展 `eslint.config.mjs`，添加以下规则/插件：

| 规则 | 用途 | 级别 |
|------|------|------|
| `@stylistic/max-lines` | 文件行数限制 | error (comp > 300, hook > 200) |
| `@typescript-eslint/no-explicit-any` | 禁止 any 类型 | error |
| `import/order` | 导入排序 | error |
| `complexity` | 圈复杂度 | warn (max 15) |
| `@typescript-eslint/no-unused-vars` | 未使用变量 | error |

**备选方案**：
- `eslint-plugin-import` + `eslint-plugin-unicorn` — unicorn 规则集过大，引入干扰
- Biome 替代 ESLint — 迁移成本高，与 Next.js 生态兼容性未知

**理由**：上述规则集轻量且针对性强，不需要额外安装大插件。`max-lines` 由 `@stylistic/eslint-plugin` 提供（ESLint 废弃规则的社区替代），`import/order` 由 `eslint-plugin-import` 提供。

### Decision 5: 代码拆分采用 "测试先行 → 增量拆分 → 保持兼容" 策略

**选择**：
1. 每个目标文件先补充单元测试
2. 提取子模块时保持原有导出 API 不变（重新导出）
3. 每次只拆一个文件，拆分后验证 `pnpm test && pnpm ts-check && pnpm build`
4. 拆分遵循现有模块边界（不在 types.ts 中存放纯函数，不在 lib/game 中放 React 代码）

**拆分优先级与目标**：

| 优先级 | 文件 | 当前行数 | 目标行数 | 拆分策略 |
|--------|------|----------|----------|----------|
| P0 | useGameState.tsx | 2552 | ≤500 | 初始化/消息/状态更新/持久化/循环 五模块 |
| P0 | useAdventure.ts | 2240 | ≤600 | 探索/战斗/奖励/事件 四子Hook |
| P1 | factionData.ts | 1704 | ≤500×8 | 按8个世界类型拆为8文件 |
| P1 | decisionSystem.ts | 1364 | ≤500 | 分析/决策/执行 三模块 |
| P1 | expansionLogic.ts | 1281 | ≤500 | 按纵向深度功能拆分 |
| P2 | 其余 >500行文件 | — | ≤500-800 | 渐进式 |

### Decision 6: 类型系统采用 "核心 + 领域扩展" 层级

**选择**：
```
src/lib/game/types.ts          ← 核心类型（GameState, Player, World, Item, Skill, Enemy）
    ↑ extends
src/lib/game/battle/types.ts    ← 战斗领域类型
src/lib/game/shop/types.ts      ← 商店领域类型
src/lib/game/ascension/types.ts ← 飞升领域类型
... (其他领域 types.ts)
```

**清理原则**：
- 能被核心类型覆盖的定义 → 删除，改为 import
- 领域特有类型 → 保留在领域 types.ts，但必须 extends 核心类型
- 未使用的类型 → 直接删除
- 确保 `@/lib/game/types` 是所有类型的首要导入源

## Risks / Trade-offs

### Risk 1: ESLint 新规则触发大量既有错误
**风险**：启用 `no-explicit-any`、`max-lines` 后，现有代码中大量违规导致 CI 阻塞。
**缓解**：
- 先以 warn 级别引入，逐步修复后升级为 error
- 使用 `eslint --quiet` + `.eslintignore` 排除尚未修复的目录
- 在 tasks 中安排专门的修复阶段

### Risk 2: useGameState 拆分引入回归 bug
**风险**：2552 行的核心状态 Hook 拆分后，状态流转可能出现竞态或丢失。
**缓解**：
- 拆分前必须补测试（P0 硬要求）
- 每次只拆一个职责域，立即验证
- 使用 React DevTools profiler 验证重渲染行为不变

### Risk 3: 规则过于严格抑制 AI 生产力
**风险**：规则约束过强导致 AI 为避免违规而选择次优方案（如过度拆分、避免必要的复杂度）。
**缓解**：
- core.md 规则分 "MUST" 和 "SHOULD" 两个级别
- 允许显式豁免（如 `// eslint-disable-next-line` + JSDoc 说明）
- 在实际使用中迭代调整阈值

### Risk 4: Skills 配置与内置技能版本不兼容
**风险**：Claude Code 更新内置技能后，项目级配置可能失效。
**缓解**：
- Skills 配置使用最小覆盖原则，仅修改必要参数
- 在 `project-skills-setup` 中记录配置适配的 Claude Code 版本

## Migration Plan

### Phase 1: 基础设施（无风险，立即生效）
1. 创建 `.claude/rules/core.md`、`modules.md`、`style.md`
2. 更新 `CLAUDE.md` / `AIREADME.md` 引用规则文件
3. 安装 ESLint 插件依赖
4. 更新 `eslint.config.mjs`（warn 级别引入新规则）

### Phase 2: 技能安装（无风险）
1. 在 `.claude/skills/` 中创建 `code-review`、`simplify`、`verify` 配置文件
2. 运行 `/verify` 验证技能可用性

### Phase 3: 架构分析（无风险）
1. 执行全文扫描，产出架构分析报告
2. 确认拆分优先级与方案

### Phase 4: 渐进修复（低风险，增量进行）
1. 修复 ESLint warn 级别违规
2. 逐步将新规则从 warn 升级到 error
3. 按优先级执行代码拆分（P0 → P1 → P2）
4. 类型系统整合

### 回滚策略
- 规则文件和技能配置：直接删除文件即可回滚
- ESLint 配置：还原 `eslint.config.mjs` 到 git 历史版本
- 代码拆分：由于每次拆分独立提交，可单独 revert

## Open Questions

1. **Q**: `src/features/` 和 `src/components/game/` 是否应合并？当前 shop、faction、adventure 等模块在两处均有代码。
   **A**: 需要在架构分析阶段确认。初步判断 features/ 应作为业务逻辑容器（引用 lib/game 纯函数），components/ 仅存放 UI 展示组件。若功能重复，优先保留 components/ 并移除 features/ 中的重复 UI。

2. **Q**: 测试框架是否考虑从 vitest 迁移到 jest？当前 vitest 配置为 v4.1，与 jsdom 29 搭配。
   **A**: 当前不需要变更。vitest 4.x 与 jsdom 29 组合稳定，且与 Vite 生态（项目已有 @vitejs/plugin-react）兼容性好。

3. **Q**: 是否引入 pre-commit hook（如 husky + lint-staged）强制 ESLint 检查？
   **A**: 在本变更中通过 `package.json` scripts 提供 `lint:strict` 命令，具体 pre-commit hook 集成留待后续 CI/CD 改进变更处理。
