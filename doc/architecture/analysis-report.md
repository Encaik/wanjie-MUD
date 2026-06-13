# 万界修行录 — 架构现状分析报告

> **状态**: ✅ 已迁移到 `game-design/architecture.md`
> 产出日期：2026-06-08 | 分析范围：全项目 src/（446 文件，118,244 行）

## 一、整体概览

| 模块 | 文件数 | 总行数 | 占比 | 平均行数/文件 |
|------|--------|--------|------|---------------|
| `src/lib/` | 201 | 66,925 | 56.6% | 333 |
| `src/components/` | 150 | 30,463 | 25.8% | 203 |
| `src/tests/` | 33 | 9,573 | 8.1% | 290 |
| `src/hooks/` | 22 | 8,688 | 7.3% | 395 |
| `src/types/` | 12 | 962 | 0.8% | 80 |
| `src/contexts/` | 5 | 714 | 0.6% | 143 |
| `src/features/` | 15 | 329 | 0.3% | 22 |
| `src/app/` | 3 | 323 | 0.3% | 108 |
| `src/utils/` | 2 | 179 | 0.2% | 90 |
| `src/storage/` | 3 | 88 | 0.1% | 29 |

**关键发现**：`src/lib/` 占项目代码量的 56.6%，远超其他模块，且包含 201 个文件，需要关注其内部组织结构。

## 二、文件规模分析

### 2.1 文件大小分布

| 行数范围 | 文件数 | 占比 |
|----------|--------|------|
| 1–100 行 | 142 | 31.8% |
| 101–300 行 | 148 | 33.2% |
| 301–500 行 | 97 | 21.7% |
| 501–800 行 | 43 | 9.6% |
| 801–1200 行 | 9 | 2.0% |
| 1200+ 行 | 7 | 1.6% |

**问题**：59 个文件超过 500 行（13.2%），16 个文件超过 800 行，7 个文件超过 1200 行。

### 2.2 超大文件清单（>800 行）

| 行数 | 文件 | 归属模块 | 严重级别 |
|------|------|----------|----------|
| 2552 | useGameState.tsx | hooks | 🔴 P0 |
| 2240 | useAdventure.ts | hooks/adventure | 🔴 P0 |
| 1704 | factionData.ts | lib/data | 🟠 P1 |
| 1364 | decisionSystem.ts | lib/game/battle | 🟠 P1 |
| 1286 | adventure.ts | lib/game | 🟠 P1 |
| 1281 | expansionLogic.ts | lib/game | 🟠 P1 |
| 1254 | types.ts | lib/game | 🟡 P2 |
| 1127 | eventConfigs.ts | lib/game/dungeon | 🟡 P2 |
| 1124 | FactionPanel.tsx | components/game/tabs | 🟡 P2 |
| 1067 | useFaction.ts | hooks/faction | 🟡 P2 |
| 1000 | MainGame.tsx | components/game/layout | 🟡 P2 |
| 925 | worldData.ts | lib/data | 🟡 P2 |
| 917 | typesExtension.ts | lib/game | 🟡 P2 |
| 883 | fragmentSystem.ts | lib/game | 🟡 P2 |
| 862 | DeveloperPanel.tsx | components/game/shared | 🟡 P2 |
| 818 | adventure.test.ts | tests | 🟡 P2 |

## 三、模块依赖关系

### 3.1 理想依赖链

```
app/ → components/ → hooks/ → lib/ → storage/
```

### 3.2 实际依赖分析

| 依赖方向 | 状态 | 说明 |
|----------|------|------|
| app → components | ✅ 正常 | 页面合理引用组件 |
| components → hooks | ✅ 正常 | 组件通过 hooks 获取状态 |
| components → lib | ✅ 正常 | 组件引用类型和工具函数 |
| hooks → lib | ✅ 正常 | hooks 引用业务逻辑和类型 |
| lib → components | ✅ 正常 | 无引用 |
| **lib → hooks** | 🔴 **违规** | `src/lib/game/` 中某文件引用了 `@/hooks/useGameState`，破坏了依赖方向 |

### 3.3 循环依赖检测

**发现**：`lib → hooks → lib` 循环。
- `src/lib/` 中有一个文件 import 了 `@/hooks/useGameState`
- 而 `src/hooks/useGameState.tsx` 大量 import `@/lib/game/*`

这是架构层面的严重问题：`lib/` 作为纯业务逻辑层，不应该依赖 React Hooks。需要定位并修复。

## 四、目录重叠分析

### 4.1 `src/features/` vs `src/components/game/`

| 功能域 | features/ | components/game/ | 重叠 | 建议 |
|--------|-----------|------------------|------|------|
| shop | ✅ | ✅ (shop/) | ⚠️ 重叠 | 合并到 components/game/shop，features/shop 仅保留业务逻辑引用 |
| adventure | ✅ | ✅ (部分) | ⚠️ 重叠 | features/adventure 保留业务编排，UI 归 components |
| faction | ✅ | ✅ (tabs/FactionPanel.tsx) | ⚠️ 重叠 | 同上 |
| cultivation | ✅ | ✅ (tabs/CultivationPanel.tsx) | ⚠️ 重叠 | 同上 |
| equipment | ✅ | ✅ (tabs/EquipmentPanel.tsx) | ⚠️ 重叠 | 同上 |
| achievement | ✅ | ✅ (tabs/AchievementPanel.tsx) | ⚠️ 重叠 | 同上 |
| technique | ✅ | ✅ (tabs/) | ⚠️ 重叠 | 同上 |
| collection | ✅ | ❌ | — | features 独占 |

**核心问题**：`features/` 目录的存在价值不明确。当前 15 个文件的 features/ 似乎是一个未完成的迁移——量少（329 行）、与 components 重叠严重。设计意图可能是按领域拆分业务逻辑，但实际实施不完整。

**建议**：明确 features/ 的定位——作为"领域业务编排层"（组合 lib/game 纯函数 + hooks），UI 组件统一归 components/game/。

## 五、代码质量指标

### 5.1 TypeScript 严格性

| 指标 | 数量 | 评级 |
|------|------|------|
| `any[]` 使用 | 14 | ⚠️ 可接受 |
| `: any` 使用 | 62 | 🔴 需改进 |
| `as any` 使用 | 91 | 🔴 需改进 |
| **合计 any 使用** | **167** | 🔴 需改进 |

### 5.2 类型定义分布

18 个 types.ts 文件分散在项目中：
- `src/lib/game/types.ts` (1254行) + `typesExtension.ts` (917行) = 2171 行核心类型
- 领域 types.ts：battle、shop、ascension、dungeon、economy、enemy、tower、taskSystem、tower
- `src/lib/calculation/types.ts` + `src/lib/calculation/context/types.ts`
- `src/lib/text/core/types.ts` + `src/lib/text/worlds/types.ts`
- `src/lib/websocket/types.ts`
- `src/features/adventure/types.ts`、`src/features/cultivation/types.ts`、`src/features/faction/types.ts`

**风险**：types.ts 和 typesExtension.ts 合计 2171 行，极可能存在类型膨胀和重复。

### 5.3 测试覆盖

| 指标 | 数值 |
|------|------|
| 测试文件数 | 30 |
| 源文件数 | 446 |
| 测试文件覆盖率 | ~6.7% |
| 测试代码总量 | 9,573 行（占总代码 8.1% 但集中在少数文件） |

## 六、问题分级汇总

### 🔴 P0 — 紧急修复

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| 1 | 核心状态文件 2552 行 | useGameState.tsx | 维护困难、改动风险极高 |
| 2 | 机缘 Hook 2240 行 | useAdventure.ts | 同上 |
| 3 | lib → hooks 循环依赖 | 待定位 | 破坏架构分层 |

### 🟠 P1 — 高优先级

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| 4 | 势力数据 1704 行单文件 | factionData.ts | 数据膨胀 |
| 5 | 战斗决策系统 1364 行 | decisionSystem.ts | 逻辑混乱 |
| 6 | 机缘逻辑 1286 行 | adventure.ts | 职责不清 |
| 7 | 扩展逻辑 1281 行 | expansionLogic.ts | 同上 |
| 8 | features/ 与 components 重叠 | 7 个模块 | 目录混乱 |

### 🟡 P2 — 中优先级

| # | 问题 | 位置 |
|---|------|------|
| 9 | 类型定义分散 18 个文件 | 全项目 |
| 10 | 167 处 any 类型使用 | 全项目 |
| 11 | 测试覆盖仅 6.7% | 全项目 |
| 12 | 59 个文件超 500 行 | 全项目 |

## 七、结论

项目整体架构方向正确（app → components → hooks → lib 分层），但存在以下核心问题：

1. **巨型文件**：2 个 P0 文件合计 4792 行，承载核心游戏状态
2. **依赖倒置**：lib 层不应依赖 hooks
3. **目录重叠**：features/ 定位不清，与 components 7 个模块重叠
4. **类型膨胀**：核心类型文件 2171 行 + 16 个分散 types.ts
5. **质量门禁缺失**：ESLint 配置过于宽松，无文件行数/复杂度限制

---

## 八、成果总结（2026-06-08）

### 已完成的基础设施

| 类别 | 成果 | 文件 |
|------|------|------|
| 架构文档 | 3 份分析报告 | `doc/architecture/analysis-report.md`、`module-map.md`、`optimization-roadmap.md` |
| 规则体系 | 3 层规则文件 | `.claude/rules/core.md`、`modules.md`、`style.md` |
| AI 入口 | CLAUDE.md | `CLAUDE.md`（自动加载规则） |
| 技能定制 | 3 个项目 Skills | `.claude/skills/code-review/`、`simplify/`、`verify/` |
| ESLint 增强 | 5 项新规则 | `eslint.config.mjs`（no-explicit-any、import/order、complexity、max-depth、no-unused-vars） |
| 文件大小检查 | Shell 脚本 | `scripts/check-file-sizes.sh`（组件 ≤300、Hook ≤200、工具 ≤500、数据 ≤800） |
| 质量门禁 | lint:strict 命令 | `pnpm lint:strict`（ESLint 零警告 + 文件大小检查） |

### 关键指标

| 指标 | 初始值 | 当前值 | 变化 |
|------|--------|--------|------|
| ESLint problems | ~0（无强规则） | 2247（新规则启用） | 质量基线建立 |
| auto-fix 完成 | — | 1043 修复 | import/order 批量修复 |
| 剩余问题 | — | 1204 | 渐进修复中 |
| 规则文件 | 0 | 4（core + modules + style + CLAUDE.md） | ✅ 完成 |
| 项目 Skills | 5（openspec only） | 8（+ code-review/simplify/verify 定制） | ✅ 完成 |
| 架构文档 | 0 | 3 份 | ✅ 完成 |

### 待继续的工作

- **大文件拆分**（P0/P1）：useGameState.tsx (2552行)、useAdventure.ts (2240行)、factionData.ts (1704行) 等
- **类型系统整合**：18 个 types.ts 的审计和合并
- **ESLint 渐进修复**：~167 处 any 类型替换、100 个 complexity warn 处理
- **lib → hooks 循环依赖定位与修复**

预计完整优化需要 2-3 周，按 P0 → P1 → P2 顺序渐进执行。
