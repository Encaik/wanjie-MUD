## Context

万界修行录是一个 Next.js 16 文字 MUD 修仙游戏，目前使用 pnpm 包管理、TypeScript 5、React 19 + shadcn/ui、Tailwind CSS 4、Supabase 作为数据库。项目已通过 `project-quality-foundation` 变更建立了完整的规则体系（CLAUDE.md + 3 个规则文件）和 ESLint 质量门禁。

当前项目 `.claude/skills/` 目录下有 8 个技能，其中 3 个是项目定制技能（`code-review`、`simplify`、`verify`），5 个是 OpenSpec 工作流技能（`openspec-*`）。这些技能主要覆盖代码质量和变更管理流程。

缺失的领域包括：游戏设计方法论、前端 UI/UX 设计、Next.js/React 开发模式、Supabase 数据层操作、游戏内容策划（关卡/秘境/数值）、泛型测试。

通过 `npx skills find` 对 6 个领域进行了系统性搜索，获取了 28+ 个候选技能的安装量、来源和质量数据。

## Goals / Non-Goals

**Goals:**
- 从 skills.sh 生态系统识别并整理适合本项目的第三方技能
- 按 6 个领域分类（代码层面、页面设计、游戏设计、游戏开发、数据存储、质量保障），每个领域给出 2-5 个候选技能
- 根据安装量、来源可信度、与项目的契合度进行质量评估和优先级排序
- 将高优先级（P0）技能安装到项目或用户全局配置中
- 更新 `project-skills-setup` spec 反映扩展后的技能清单

**Non-Goals:**
- 不涉及自定义技能的开发（仅使用 skills.sh 已有技能）
- 不修改 ESLint 规则或 CLAUDE.md 规范体系
- 不强制安装所有推荐技能（P1/P2 可选）
- 不涉及 MCP 服务器配置

## Decisions

### 决策 1: 技能分级策略

**选择**: 采用 P0（必装）/ P1（推荐）/ P2（可选）三级优先级

- P0：安装量 > 500 且与项目核心需求高度相关，安装到项目或用户全局
- P1：安装量 > 100 且补充特定领域能力，供用户按需安装
- P2：小众但有独特价值，或安装量 < 100，列在报告中供参考

**理由**: 避免一次性安装大量技能导致冲突或配置混乱。优先安装经过社区验证的高质量技能。

**备选方案**: 全部安装所有匹配技能 → 拒绝，因为低质量技能可能引入不兼容的规范或降低 Agent 响应质量。

### 决策 2: 安装位置

**选择**: 游戏设计和内容策划相关技能安装到项目级别（`.claude/skills/`），通用开发技能安装到用户全局（`~/.claude/skills/`）

- 项目级安装：游戏设计（game-design）、关卡设计（level-design）、RPG 设计（tabletop-rpg-design）——这些技能是项目特定的
- 用户全局安装：前端设计（frontend-design-ui-ux）、Next.js 模式（react-nextjs-patterns）、Supabase（supabase-database）——这些技能可跨项目复用

**理由**: 遵循关注点分离原则。游戏领域知识绑定项目，通用开发技能可跨项目复用。

### 决策 3: 技能来源选择

**选择**: 优先推荐来自知名作者（addyosmani、jeffallan、nice-wolf-studio）的技能，其次看安装量（> 100 installs），最后看功能契合度。

**理由**: 技能代码在 Agent 上下文中运行，来源可信度是安全基础。安装量是社区验证的信号。

**备选方案**: 仅按功能关键词匹配 → 拒绝，忽略质量和安全维度。

### 决策 4: 兼容性验证

**选择**: 安装前对比技能描述与项目 CLAUDE.md/rules 的冲突可能。安装在项目级的技能需确认不与 `core.md` 的目录职责、类型安全等规则冲突。

**理由**: 第三方技能可能带有与项目规范矛盾的建议（如建议在 `lib/` 中使用 React），需主动检测。

## Risks / Trade-offs

- **[技能冲突]** 第三方技能的建议可能与 CLAUDE.md 规则冲突 → 通过安装前兼容性审查 + 项目规则优先级高于技能建议来缓解
- **[上下文膨胀]** 安装过多技能会增加 Agent 初始化时的上下文加载量 → 通过 P0/P1/P2 分级控制，本次仅安装最多 5 个 P0 技能
- **[技能质量波动]** skills.sh 技能可能更新后改变行为或质量 → 锁定技能版本（通过 git commit 保存项目级技能的当前状态）
- **[维护成本]** 项目级安装的技能需要跟踪上游更新 → 定期运行 `npx skills check` 检查更新

## Open Questions

- 部分候选技能（如 `jeffallan/claude-skills@game-developer`）描述较泛，实际行为需要安装后验证
- `tabletop-rpg-design` 技能面向桌游 RPG，对文字 MUD 的适用程度需实测
- 是否需要为游戏数值平衡（`balanceConfig.ts`）寻找专门的数值设计技能？当前搜索结果中未发现直接匹配的技能
