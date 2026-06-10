## Why

当前 `shared/` 目录承载了两种截然不同的职责：一方面是游戏核心基础设施（事件系统、数值计算引擎、世界生成器、Mod系统、注册中心），另一方面是模块间共享的工具性代码（cn、logger、rng、WebSocket 基础设施等）。这违反了项目"同一层只做一件事"的设计原则。核心系统是所有模块的运行时依赖，而共享工具是可选引用的便利函数——它们应该在不同层级。将核心系统提取到独立的 `core/` 目录中，能让架构分层更清晰，也符合"核心系统 → 功能模块 → 共享工具"的内聚层级模型。

## What Changes

- **新增 `src/core/` 顶级目录**：存放构成游戏必备基础设施的核心系统，在 `src/` 下成为第 5 个顶级目录
- **从 `shared/lib/` 迁移到 `core/`**：
  - `shared/lib/events/` → `core/events/` — 事件系统（GameEventManager、事件类型、事件匹配器）
  - `shared/lib/types.ts` + `typesExtension.ts` → `core/types/` — 核心游戏类型（属性系统、品质、枚举等）
  - `shared/lib/calculation/` → `core/calculation/` — 统一数值计算引擎
  - `shared/lib/world/` → `core/world/` — 世界系统（WorldProviderRegistry、WorldPoolEngine、模板验证）
  - `shared/lib/registry/` → `core/registry/` — 数据注册中心（WorldDataRegistry、WorldMechanicsRegistry）
  - `shared/lib/mod/` → `core/mod/` — Mod 系统（加载、验证、清单）
  - `shared/lib/gameSystems.ts` + `expansionLogic.ts` + `messageDB.ts` → `core/engine/` — 游戏引擎集成层
- **保留在 `shared/` 的内容**：AI 模块、WebSocket 基础设施、多人游戏、通用 UI 组件、工具函数（cn/logger/rng）、环境配置、数据库存储
- **更新架构文档**：CLAUDE.md 四层架构 → 五层架构、`.claude/rules/core.md` 新增 `core/` 目录职责表
- **迁移期间保持向后兼容**：旧路径 barrel re-export 过渡

## Capabilities

### New Capabilities

- `core-systems-foundation`: `src/core/` 核心系统层 — 包含事件总线、数值计算引擎、世界系统、注册中心、Mod系统、游戏引擎集成等构成游戏运行必备的基础设施。该层不依赖任何 `modules/` 中的代码，是项目的最底层运行时依赖。

### Modified Capabilities

- `claude-rules-system`: 架构规则从四层（app/views/modules/shared）更新为五层（app/views/modules/core/shared），新增 `core/` 目录的职责边界、禁止行为清单。
- `barrel-export-completeness`: 新增 `core/` 下各子目录的桶导出要求。

## Impact

- **顶层结构**：`src/` 从 4 个目录变为 5 个：`app/`、`views/`、`modules/`、`core/`、`shared/`
- **导入路径变更**：约 50+ 文件中 `@/shared/lib/events` → `@/core/events`、`@/shared/lib/types` → `@/core/types` 等
- **依赖方向明确**：`core/` → 无上层依赖（纯基础设施）；`shared/` → 依赖 `core/`（工具可引用核心类型）；`modules/` → 依赖 `core/` 和 `shared/`；`views/` → 依赖 `modules/`
- **`shared/lib/` 大幅精简**：从 ~60 个文件减少到约 15 个（AI、WebSocket、multiplayer）
- **不影响业务逻辑**：纯文件移动 + 导入路径更新，游戏行为不变
