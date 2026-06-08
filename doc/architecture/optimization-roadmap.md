# 万界修行录 — 架构优化路线图

> 产出日期：2026-06-08 | 预计总工期：2–3 周

## 一、阶段总览

| 阶段 | 名称 | 预计时间 | 任务数 | 风险等级 |
|------|------|----------|--------|----------|
| Phase 1 | 🔧 基础设施搭建 | 1–2 天 | 14 | 🟢 低 |
| Phase 2 | 🏗️ P0 紧急重构 | 3–5 天 | 6 | 🟡 中 |
| Phase 3 | 📦 P1 结构优化 | 3–5 天 | 10 | 🟡 中 |
| Phase 4 | 🧹 P2 质量提升 | 3–5 天 | 12 | 🟢 低 |
| Phase 5 | 📝 文档沉淀 | 1 天 | 3 | 🟢 低 |

---

## Phase 1: 🔧 基础设施搭建（1–2 天）

**目标**：建立代码质量和 AI 开发的基础设施，零运行时风险。

### 任务清单

| # | 任务 | 产出 | 验收标准 |
|---|------|------|----------|
| 1.1 | 安装 ESLint 增强插件 | `package.json` 新增依赖 | `pnpm install` 成功 |
| 1.2 | 配置 `max-lines` 规则 | `eslint.config.mjs` | 组件>300行报 error，Hook>200行报 error |
| 1.3 | 配置 `no-explicit-any` 规则 | `eslint.config.mjs` | `any` 使用报 error |
| 1.4 | 配置 `import/order` 规则 | `eslint.config.mjs` | `eslint --fix` 自动排序 |
| 1.5 | 配置 `complexity` 限制 | `eslint.config.mjs` | 复杂度>15 warn |
| 1.6 | 创建 `.claude/rules/core.md` | 规则文件 | 硬约束清单完整 |
| 1.7 | 创建 `.claude/rules/modules.md` | 规则文件 | 模块规范覆盖完整 |
| 1.8 | 创建 `.claude/rules/style.md` | 规则文件 | 代码风格规则完整 |
| 1.9 | 创建 `CLAUDE.md` | 入口文件 | 自动加载 rules/ |
| 1.10 | 更新 `AIREADME.md` | 更新文件 | 引用规则链接 |
| 1.11 | 安装技能配置 | `.claude/skills/` | 3 个技能可用 |
| 1.12 | 添加 `lint:strict` 脚本 | `package.json` | `pnpm lint:strict` 可执行 |
| 1.13 | 产出架构分析报告 | `doc/architecture/` | 3 份文档完成 |
| 1.14 | 定位并修复 lib→hooks 循环依赖 | 1–2 文件修改 | 依赖方向正确 |

### 里程碑：基础设施可用
- ✅ ESLint 质量门禁生效
- ✅ Claude Rules 自动加载
- ✅ Skills 可用
- ✅ 架构文档产出

---

## Phase 2: 🏗️ P0 紧急重构（3–5 天）

**目标**：拆分两个最大的核心文件，消除单点故障。

### 拆分 useGameState.tsx（2552 行 → 5 个文件）

| 子任务 | 提取模块 | 预计行数 | 职责 |
|--------|----------|----------|------|
| 2.1 | 补测试 | — | 覆盖初始化/消息/更新/持久化路径 |
| 2.2 | useGameInitialization.ts | ≤400 | 游戏世界初始化、角色创建 |
| 2.3 | useGameMessages.ts | ≤300 | 消息发布与消费 |
| 2.4 | useGameStateUpdates.ts | ≤400 | 资源变动、属性更新、等级提升 |
| 2.5 | useGamePersistence.ts | ≤300 | 存档、读档、云端同步 |
| 2.6 | useGameLoop.ts | ≤200 | 游戏主循环、离线处理触发 |

**汇总后 useGameState.tsx**：≤500 行，仅做组合编排。

### 拆分 useAdventure.ts（2240 行 → 4 个文件）

| 子任务 | 提取模块 | 预计行数 | 职责 |
|--------|----------|----------|------|
| 2.7 | 补测试 | — | 覆盖探索/战斗/奖励/事件路径 |
| 2.8 | useAdventureExploration.ts | ≤400 | 地图生成、探索状态机 |
| 2.9 | useAdventureCombat.ts | ≤400 | 战斗集成、遇敌触发 |
| 2.10 | useAdventureRewards.ts | ≤300 | 战利品、掉落、结算 |
| 2.11 | useAdventureEvents.ts | ≤300 | 随机事件、奇遇、秘境 |

**每次拆分后验证**：`pnpm test && pnpm ts-check && pnpm build`

### 里程碑：P0 文件消除
- ✅ 项目最大 Hook 不超过 600 行
- ✅ 所有测试通过
- ✅ 构建成功

---

## Phase 3: 📦 P1 结构优化（3–5 天）

**目标**：消除数据文件膨胀，理清 features/ 定位。

### 3.1 拆分 factionData.ts（1704 行 → 8 个文件）
- 按世界类型：修仙/高武/科技/魔幻/异能/仙侠/武侠/末世
- 通过 `index.ts` 聚合导出保持兼容
- 每个文件 ≤300 行

### 3.2 拆分 decisionSystem.ts（1364 行 → 3 个文件）
- 分析器模块（analyzer.ts）— 评估敌人、计算胜率
- 决策器模块（decider.ts）— 选择行动策略
- 执行器模块（executor.ts）— 执行决策、处理结果

### 3.3 拆分 adventure.ts（1286 行 → 3–4 个文件）
- 按地图/探索/事件维度拆分

### 3.4 拆分 expansionLogic.ts（1281 行 → 3 个文件）
- 按纵向深度功能模块拆分

### 3.5 features/ 定位明确化
- 分析每个 feature 的业务逻辑 vs UI 职责
- 将 features/ 中纯 UI 组件迁移至 components/game/
- features/ 保留为轻量业务编排层
- 消除与 components 的 7 个重叠模块

### 里程碑：P1 文件消除
- ✅ 项目超过 800 行的文件不超过 5 个
- ✅ features/ 与 components/ 职责清晰

---

## Phase 4: 🧹 P2 质量提升（3–5 天）

**目标**：类型系统整合，ESLint 违规清零。

### 4.1 类型系统整合

| 子任务 | 操作 |
|--------|------|
| 审计 18 个 types.ts | 列出类型的用途、引用次数 |
| 识别重复类型 | 交叉对比，生成合并清单 |
| 建立核心类型层级 | GameState/Player/World/Item/Skill/Enemy 在 types.ts |
| 领域类型延伸 | 通过 extends + import 替代重复定义 |
| 删除未引用类型 | `tsc --noEmit` 安全移除 |

### 4.2 ESLint 违规修复

| 优先级 | 规则 | 预计修复量 | 策略 |
|--------|------|-----------|------|
| 1 | `no-explicit-any` | ~167 处 | 优先 lib/game/ → hooks → components |
| 2 | `import/order` | 批量修复 | `eslint --fix` 自动 |
| 3 | `max-lines` warn → error | 拆分完成后 | 此时大文件已消除 |
| 4 | `complexity` | 逐个处理 | 重构或加豁免注释 |

### 4.3 零警告目标
- `pnpm lint:strict` 零 error、零 warning

### 里程碑：代码质量达标
- ✅ `pnpm lint:strict` 零错误零警告
- ✅ 类型系统无重复定义
- ✅ 无 `any` 滥用（除合理的豁免）

---

## Phase 5: 📝 文档沉淀（1 天）

| 子任务 | 内容 |
|--------|------|
| 更新 `AIREADME.md` | 规则引用、技能使用说明、质量门禁命令 |
| 追加优化成果总结 | 在 `analysis-report.md` 末尾 |
| Commit | `chore: 项目质量基础设施搭建` |

---

## 二、风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| useGameState 拆分引入回归 bug | 中 | 高 | 测试先行 + 增量拆分 + 每次独立验证 |
| ESLint 新规则阻塞 CI | 高 | 中 | warn 级别引入 → 逐步修复 → 升级 error |
| 类型整合导致编译错误 | 中 | 中 | `tsc --noEmit` 每步验证 |
| 拆分后导入路径断裂 | 低 | 中 | 保持 API 兼容 + 构建验证 |
| 规则过于严格抑制 AI 效率 | 低 | 低 | MUST/SHOULD 分级 + 允许豁免 |

## 三、回滚策略

- **ESLint**：`git checkout eslint.config.mjs`
- **Rules/Skills**：删除 `.claude/rules/` 或 `.claude/skills/` 对应文件
- **代码拆分**：每次拆分独立 commit，可单独 revert
- **类型整合**：同上，增量提交

## 四、总时间估算

| 阶段 | 乐观 | 悲观 |
|------|------|------|
| Phase 1 | 1 天 | 2 天 |
| Phase 2 | 3 天 | 5 天 |
| Phase 3 | 3 天 | 5 天 |
| Phase 4 | 3 天 | 5 天 |
| Phase 5 | 1 天 | 1 天 |
| **合计** | **11 天** | **18 天** |
