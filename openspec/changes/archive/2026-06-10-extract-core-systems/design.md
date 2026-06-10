## Context

万界修行录当前采用四层架构（app → views → modules → shared）。`shared/` 被定义为"纯公共内容"，但实际上承载了两类性质完全不同的代码：

1. **游戏核心基础设施**：事件管理器、数值计算引擎、世界生成系统、Mod 加载器、注册中心、核心类型定义——这些是所有模块的**必须运行时依赖**，没有它们游戏无法运行
2. **模块间共享工具**：cn()、logger、rng、saveMigrator、AI 调用工具、WebSocket 基础设施——这些是便利函数，模块可以选择性引用

混合存放的问题：
- `shared/` 语义被稀释——"shared" 暗示可选共享，但事件系统、计算引擎等并非"可选"
- 新开发者面对 `shared/lib/` 下 60+ 文件时无法分辨哪些是核心基础设施、哪些是工具
- 与行业惯例不一致：大多数游戏引擎将核心系统（事件、计算、世界生成）放在 `core/` 层

当前 `shared/lib/` 文件清单及其性质分析：

| 路径 | 性质 | 目标 |
|------|------|------|
| `events/` (4 files) | 核心架构 — 事件驱动通信的基础 | `core/events/` |
| `types.ts` + `typesExtension.ts` | 核心领域 — 属性系统、品质、全局枚举 | `core/types/` |
| `calculation/` (20+ files) | 核心引擎 — 所有模块属性计算的统一入口 | `core/calculation/` |
| `world/` (7 files) | 核心系统 — WorldProviderRegistry、WorldPoolEngine | `core/world/` |
| `registry/` (4 files) | 核心系统 — WorldDataRegistry、WorldMechanicsRegistry | `core/registry/` |
| `mod/` (5 files) | 核心系统 — Mod 加载与验证 | `core/mod/` |
| `gameSystems.ts` | 核心集成 — 成就/图鉴/事件协调 | `core/engine/` |
| `expansionLogic.ts` | 核心集成 — 流派/功法/装备扩展计算 | `core/engine/` |
| `messageDB.ts` | 核心服务 — 消息双层存储 | `core/engine/` |
| `ai/` (3 files) | 工具性 — AI API 调用 | 保留 `shared/lib/` |
| `websocket/` (4 files) | 工具性 — WebSocket 基础设施 | 保留 `shared/lib/` |
| `multiplayer/` (3 files) | 工具性 — 多人游戏 | 保留 `shared/lib/` |

## Goals / Non-Goals

**Goals:**
- 在 `src/core/` 创建独立的游戏核心系统层
- 从 `shared/` 中提取出所有核心游戏系统（事件、计算、世界、注册、Mod、核心类型、引擎集成）
- `shared/` 精简为只含跨模块工具性代码（cn、logger、rng、AI、WebSocket、multiplayer）
- 建立清晰的五层依赖关系：`core/` → 无上层依赖，`shared/` → 依赖 `core/`，`modules/` → 依赖二者
- 迁移期间通过 barrel re-export 保持向后兼容
- 更新所有架构文档（CLAUDE.md、.claude/rules/）反映新结构

**Non-Goals:**
- 不修改任何业务逻辑
- 不修改 `shared/ui/`（shadcn 组件）、`shared/components/`、`shared/utils/`、`shared/config/`、`shared/storage/`
- 不改变构建流程或部署方式
- 不修改 `modules/` 内部结构
- 不在此变更中引入新功能

## Decisions

### 1. 五层架构：app → views → modules → core → shared

**选择：在现有四层架构中插入 `core/` 层，形成五层架构**

```
src/
├── app/           ← ① 路由入口（Next.js App Router）
├── views/         ← ② 页面组件（组合 Panel）
├── modules/       ← ③ 功能模块（15个业务域）
├── core/          ← ④ 核心系统（游戏基础设施，新增）
└── shared/        ← ⑤ 公共工具（跨模块工具性代码）
```

**依赖方向（箭头表示"可以依赖"）：**
```
app/ → views/ → modules/ → core/
                          → shared/ → core/
```

理由：`core/` 是基础设施层，不应依赖任何 `modules/`；`shared/` 的工具可以引用核心类型；`modules/` 同时依赖 `core/` 和 `shared/`。这比将 `core/` 放在 `shared/` 之下更清晰——`core/` 和 `shared/` 是并列的，不是包含关系。

**替代方案考虑**：
- 方案 B：将核心系统保留在 `shared/lib/` 但用子目录分组（`shared/lib/core/` 和 `shared/lib/utils/`）→ 拒绝：`shared/` 语义仍然模糊，导入路径冗长
- 方案 C：将核心系统移到 `modules/` → 拒绝：核心系统不是"功能模块"，它们不面向用户，是为其他模块服务的

### 2. `core/` 目录结构

**选择：按系统职能组织，每个子目录自包含**

```
core/
├── events/           ← 事件系统
│   ├── index.ts
│   ├── types.ts      ← 事件类型定义（GameEventType、EventPayloadMap等）
│   ├── events.ts     ← 事件实例
│   └── eventManager.ts ← GameEventManager 单例
│
├── types/            ← 核心类型
│   ├── index.ts
│   ├── types.ts      ← CharacterStats、BaseStats、GrowthStats、Quality 等
│   └── typesExtension.ts ← 修炼流派、瓶颈、渡劫、功法等扩展类型
│
├── calculation/      ← 数值计算引擎（从 shared/lib/calculation/ 完整搬移）
│   ├── index.ts
│   ├── types.ts
│   ├── constants.ts
│   ├── calculator/
│   ├── adapters/
│   ├── boundary/
│   ├── context/
│   ├── effect/
│   ├── helpers/
│   └── service(s)/
│
├── world/            ← 世界系统
│   ├── index.ts
│   ├── types.ts
│   ├── identity.ts
│   ├── WorldProviderRegistry.ts
│   ├── WorldPoolEngine.ts
│   ├── TemplateWorldProvider.ts
│   └── validateWorldTemplate.ts
│
├── registry/         ← 数据注册中心
│   ├── index.ts
│   ├── schemas.ts
│   ├── WorldDataRegistry.ts
│   └── WorldMechanicsRegistry.ts
│
├── mod/              ← Mod 系统
│   ├── index.ts
│   ├── ModLoader.ts
│   ├── ModManifest.ts
│   └── ModValidator.ts
│
└── engine/           ← 游戏引擎集成层（新聚合）
    ├── index.ts
    ├── gameSystems.ts     ← 从 shared/lib/gameSystems.ts 搬移
    ├── expansionLogic.ts  ← 从 shared/lib/expansionLogic.ts 搬移
    └── messageDB.ts       ← 从 shared/lib/messageDB.ts 搬移
```

理由：扁平结构优于嵌套——每个子目录职责唯一。`engine/` 存放的是跨越多个子系统的集成逻辑（如 `gameSystems.ts` 整合了成就、图鉴、事件三个系统），与单一职责的 `events/`、`calculation/` 区分。

### 3. `core/` 目录规则

**选择：`core/` 下的代码必须遵守以下约束**

| 允许 | 禁止 |
|------|------|
| 定义游戏核心类型和接口 | 依赖 `modules/` 中的任何代码 |
| 实现纯逻辑的基础设施（事件、计算、注册） | 包含 React 组件或 Hooks |
| 被 `modules/`、`shared/`、`views/` 引用 | 包含业务逻辑（业务逻辑属于 modules/） |
| 使用 browser API（IndexedDB、localStorage） | 重复定义 modules/ 中已有的类型 |
| 通过 barrel export 对外暴露 | 在 `core/` 内产生循环依赖 |

理由：确保 `core/` 作为底层基础设施的稳定性。如果 `core/` 可以引用 `modules/`，则产生循环依赖风险。

### 4. 迁移策略

**选择：分阶段迁移 + barrel re-export 过渡**

阶段 1：创建 `core/` 目录结构，复制文件（保持原路径可用）
阶段 2：更新 `shared/lib/` 的 index.ts，改为 barrel re-export 到 `core/`
阶段 3：逐个模块更新 import 路径为 `@/core/`
阶段 4：删除 `shared/lib/` 中的原文件，只保留 barrel

**替代方案考虑**：
- 一次性全部移动并更新所有 import → 拒绝：风险过大，约 50+ 文件需要同时修改
- 先改 import 再移文件 → 拒绝：破坏构建，无法增量验证

### 5. `engine/` 子目录的定位

**选择：将 `gameSystems.ts`、`expansionLogic.ts`、`messageDB.ts` 聚合到 `core/engine/`**

这三者不是独立的"系统"，而是跨系统的集成层：
- `gameSystems.ts`：协调事件系统、成就系统、图鉴系统
- `expansionLogic.ts`：整合修炼流派、功法羁绊、装备词缀等扩展计算
- `messageDB.ts`：为所有模块提供消息持久化服务

归入 `engine/` 而非各自独立目录，表明它们是聚合集成逻辑，避免与单一职责的核心系统混淆。

## Risks / Trade-offs

- **[风险] 大量导入路径变更** → **缓解**：barrel re-export 确保旧路径继续可用；分阶段迁移，每个阶段后运行 `pnpm ts-check && pnpm build`
- **[风险] 循环依赖引入** → **缓解**：明确 `core/` 不可依赖 `modules/` 的规则；迁移完成后运行 `pnpm lint` 检查
- **[风险] `engine/` 子目录命名可能引起混淆**（engine 暗示游戏引擎核心循环）→ **缓解**：也可命名为 `integration/`，但 `engine/` 更简洁。如有争议可在实现阶段调整
- **[权衡] 目录深度增加**：原来 `@/shared/lib/events` 变为 `@/core/events`，路径长度基本不变
- **[权衡] `shared/lib/` 被掏空**：移走 ~45 个文件后 `shared/lib/` 只剩下 AI、WebSocket、multiplayer（~10 个文件）→ **接受**：这正是目标——`shared/lib/` 只保留工具性代码，而非核心系统
- **[权衡] `types.ts` 与 `modules/` 关系**：`core/types.ts` 定义了全局核心类型，但各模块还有自己的 `types.ts`。需确保 `core/types.ts` 不重复定义领域类型。现有 `shared/lib/types.ts` 已有少量的 `@/modules/` re-export（如 FragmentDropData、Faction 等），这些 re-export 是否保留待定。

## Migration Plan

1. 创建 `core/` 目录及所有子目录
2. 将文件从 `shared/lib/` 复制到 `core/` 对应位置（修改内容中的相对导入路径）
3. 在 `shared/lib/` 原位置添加 barrel re-export（指向 `@/core/`）
4. 运行 `pnpm ts-check && pnpm build` 确认兼容性
5. 分批更新 `modules/` 和 `views/` 中的 import 路径（`@/shared/lib/events` → `@/core/events` 等）
6. 更新 `CLAUDE.md`、`.claude/rules/core.md` 架构文档
7. 最终清理 `shared/lib/` 中的原文件和 barrel

回滚策略：任何阶段出问题，删除 `core/` 目录 + 恢复 `shared/lib/` 原有文件即可（因 barrel re-export 保持向后兼容）。

## Open Questions

- `core/types.ts` 中现存的与 modules/ 的交叉 re-export（如 `FragmentDropData` from `@/modules/crafting`）如何处理？选项：A) 删除这些 re-export，各模块自己 import；B) 保留在 core/types.ts 中作为便利导出
- `core/engine/` 命名是否为最佳选择？备选：`integration/`、`systems/`、`services/`
