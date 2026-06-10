## Context

当前项目中"世界观"和"世界"两个概念混合在多个系统中：

**现状混乱点**：

1. **世界观文本三套并行**：
   - `WorldDataRegistry.worldTexts` — Mod JSON 加载的文本，类型为 `Record<string, unknown>`（无类型安全）
   - `modules/narrative/data/worlds/` — 8 个 TS 文件各自 export `WorldTextDefinition`（有类型，但与 registry 脱节）
   - `modules/narrative/data/terminology.ts` — `WORLD_TERMINOLOGY` 简单术语映射（第三套）

2. **世界生成逻辑分裂**：
   - `modules/identity/logic/generators.ts` — 前端使用的 `generateWorld(seed, ascensionCount)`，从 registry 读取数据
   - `app/api/v1/worlds/generate/generator.ts` — 后端 API 使用的 `generateAndSave()`，两阶段生成
   - 两个函数做**几乎同样的事**但实现不同

3. **硬编码兜底数据残留**：
   - `worldData.ts` — `WORLD_DATA` 常量（已标记 deprecated，但兜底逻辑还在）
   - `worldEffectsData.ts` — `WORLD_DANGERS`、`WORLD_OPPORTUNITIES` 硬编码数组（兜底逻辑还在）
   - `traits.ts` — 大量 `ORIGIN_TRAITS`、`TECH_*`、`MAGIC_*`、`WASTELAND_*` 硬编码（兜底逻辑还在）
   - `namePools.ts` — `NAME_POOLS` 硬编码

4. **概念命名混乱**：
   - `WorldTypeData` — 实际是世界观的完整数据定义，但名字暗示只是"类型"
   - `WorldType` — 有 `string`（旧）和 `ExtensibleWorldType`（品牌类型）两个版本
   - `WorldTemplate` — 是"预制的世界实例"（deterministic world），不是世界观模板

**目标架构**：

```
Mod JSON 文件
    │
    ▼
后端 init.ts 加载 ──→ WorldDataRegistry（世界观注册中心）
    │                      │
    │                      ├── WorldviewDefinition（每个世界观的完整定义）
    │                      │     ├── 数值配置 (stats, coefficients)
    │                      │     ├── 生成池 (names, dangers, opportunities, factions)
    │                      │     ├── 境界系统 (realmSystem)
    │                      │     ├── 世界观文本 (texts: WorldTextDefinition)
    │                      │     ├── 机制配置 (mechanics: MechanicsConfig)
    │                      │     ├── UI 配置 (visualConfig)
    │                      │     └── 特性/名称池 (traits, namePool)
    │                      │
    │                      └── 查询 API (getWorldview, getAllWorldviews, ...)
    │
    ▼
core/world/generateWorld.ts（世界生成纯函数）
    │  输入: worldviewId + seed + ascensionCount
    │  输出: World（具体世界实例）
    │
    ▼
app/api/v1/worlds/generate/（API 路由）
    │  POST /api/v1/worlds/generate
    │  前端调用 → 后端从 registry 读取世界观 → generateWorld() → 存入 SQLite → 返回 World
    │
    ▼
前端 GameState.worlds[]
```

## Goals / Non-Goals

**Goals:**
- 定义清晰的 `WorldviewDefinition`（世界观）和 `World`（世界）两层数据模型
- 统一三套并行世界观文本系统到 `WorldDataRegistry`，使用强类型 `WorldTextDefinition`
- 统一世界生成逻辑到 `core/world/` 纯函数，API 和前端共用同一套逻辑
- 清理所有硬编码兜底数据，registry 缺失时直接抛错
- 前端删除本地生成调用，全部改为 API 请求
- `WorldTypeData` → `WorldviewDefinition` 重命名
- `WorldDataRegistry.worldTexts` 类型从 `Record<string, unknown>` → `WorldTextDefinition`

**Non-Goals:**
- 不改变 Mod JSON 文件格式（字段名保持向后兼容）
- 不改变 `World` 接口的使用方（GameState、前端组件 —— 只增加 `worldviewId` 字段）
- 不改变 Mod 加载机制（`init.ts` 的加载流程保留，只调整注册内容）
- 不改变 `WorldProvider` 架构（Provider 仍作为世界生成的抽象层）
- 不改变 SQLite 存储 schema（worlds 表结构不变）

## Decisions

### 决策 1：世界观文本合并策略 — 以 Mod JSON 为准，narrative 模块转为运行时读取

**选择**：将 `modules/narrative/data/worlds/*.ts` 中的 `WorldTextDefinition` 静态数据迁移到对应 Mod JSON 文件的 `text` 字段中，`WorldDataRegistry.worldTexts` 存储完整的 `WorldTextDefinition`。narrative 模块的 `WorldTextManager` 改为从 registry 读取。

**替代方案**：
- A：保持 narrative 模块独立，registry 的 `worldTexts` 只是一个引用键 → 仍然两套系统，没有真正统一
- B：删除 narrative 模块，全部走 registry → 改动太大，narrative 模块的 React Context 和便捷 hook 仍然有用

**选择 B 的变体** — narrative 模块保留 React 层（`WorldTextContext`、`useWorldText`），但底层数据源改为 `WorldDataRegistry`。`WorldTextManager` 从 registry 读取 `WorldTextDefinition`。

**理由**：这是最小改动实现数据统一的方式。前端消费侧的 API 不变（`useWorldText().t()` 仍然可用），但底层不再有两套数据。

### 决策 2：世界生成函数放置位置 — `core/world/generateWorld.ts`

**选择**：在 `core/world/` 中创建 `generateWorld.ts`，包含 `generateWorld(worldview, seed, ascensionCount)` 纯函数。API 路由和前端（过渡期）都调用此函数。

**替代方案**：
- A：放在 `modules/identity/logic/` → `core/world/` 不应依赖 `modules/`，但生成函数是核心基础设施
- B：放在 `app/api/v1/worlds/generate/` → API 路由不应包含可复用业务逻辑

**理由**：世界生成是游戏核心基础设施 — 给定世界观定义 + 种子，产出世界实例。这是纯计算，属于 `core/` 层。`core/world/` 已有 `WorldProvider`、`WorldPoolEngine` 等世界相关基础设施，生成函数放这里最合适。

### 决策 3：重命名方案 — `WorldTypeData` → `WorldviewDefinition`

**选择**：
- `WorldTypeData` → `WorldviewDefinition`
- `getWorldTypeData()` → `getWorldview()`
- `registerWorldType()` → `registerWorldview()`
- `getAllWorldTypeValues()` → `getAllWorldviews()`
- `WorldDataRegistry.worldTypes` → `WorldDataRegistry.worldviews`

不修改 `WorldType` 类型名（在 `core/types/types.ts` 中作为 `string` 别名），因为它是 `World` 接口的 `type` 字段类型，表示世界实例的类型标签（如 "修仙"），语义不同。

**理由**：`WorldTypeData` 承载的是世界观的完整定义（文本、数值、生成池、机制），远超"类型数据"的语义。`WorldviewDefinition` 准确表达"世界观的完整定义"。

### 决策 4：World 接口增加 worldviewId 字段

**选择**：在 `World` 接口中增加 `worldviewId: string`（对应 `WorldviewDefinition.id`，English kebab-case），保留 `type: WorldType`（中文显示名，向后兼容）。

```typescript
interface World {
  id: string;
  worldviewId: string;   // 新增：对应 WorldviewDefinition.id，如 "cultivation"
  type: WorldType;       // 保留：中文显示名，如 "修仙世界"
  // ... 其余字段不变
}
```

**理由**：`type` 是面向用户的中文显示名，`worldviewId` 是面向程序的世界观唯一标识。这允许同一个世界观的不同世界实例通过 `worldviewId` 关联回其定义。

### 决策 5：硬编码兜底清理策略

**选择**：所有 `getXxxFromRegistry()` 函数在 registry 中无数据时**直接抛出错误**，不返回硬编码兜底。

**理由**：Mod 加载在服务启动时完成，registry 一定有数据。如果 registry 无数据，说明初始化失败，应该尽早暴露问题，而不是静默降级到可能不一致的硬编码数据。

### 决策 6：前端世界生成流程

**选择**：
```
前端 world-select 页面
  │
  ├── GET /api/v1/worldviews              → 获取可用世界观列表（用于展示选项）
  ├── POST /api/v1/worlds/generate        → 请求生成世界实例
  │     body: { worldviewId, seed?, count? }
  │     response: World | World[]
  └── 前端不保留任何世界生成逻辑，仅调用 API
```

## Risks / Trade-offs

- **[风险] `WorldTypeData` → `WorldviewDefinition` 重命名影响面大** → 通过 TypeScript 编译器追踪所有引用，分文件逐步替换，每个文件替换后立即 `ts-check`
- **[风险] 移除硬编码兜底可能导致某些测试失败** → 确保测试前先初始化 registry（或 mock registry 数据）
- **[风险] narrative 模块的静态 TS 文件改为从 registry 读取，可能影响 SSR/SSG** → `WorldTextManager` 在服务端和客户端都能访问 registry（registry 是纯内存单例，无浏览器 API 依赖）
- **[权衡] 前端完全依赖 API 生成世界，离线能力下降** → 这是预期行为：世界生成需要世界观数据，世界观数据在后端通过 Mod 加载。前端只负责展示
- **[风险] 过渡期 `modules/narrative/data/worlds/*.ts` 变成 barrel re-export** → 按 CLAUDE.md 规则，过渡期后必须删除旧文件。在 tasks 中明确标注删除时间点

## Migration Plan

1. **Phase 1（类型层）**：定义 `WorldviewDefinition`，修改 `WorldDataRegistry` 类型，`World` 增加 `worldviewId`
2. **Phase 2（数据迁移）**：将 narrative 文本写入 Mod JSON，registry 加载完整的 `WorldTextDefinition`
3. **Phase 3（生成函数）**：创建 `core/world/generateWorld.ts`，替代两处现有生成逻辑
4. **Phase 4（API 对齐）**：重构 API 路由使用新生成函数，前端改为 API 调用
5. **Phase 5（清理）**：删除硬编码兜底、重命名、删除旧文件

每个 Phase 独立可验证（`ts-check` + `build` + `test` 通过）。

回滚策略：每个 Phase 提交一个 commit，出问题 revert 到上一 Phase 即可。

## Open Questions

- `WorldProvider` 体系在本次重构后是否还必要？当前 `ModRandomWorldProvider` 只是 `generateWorld()` 的薄包装 → 保留，因为 `WorldProvider` 抽象支持 template world 和未来的自定义 provider
- 世界观的 `text` 字段在 Mod JSON 中结构较复杂，是否需要定义 JSON Schema 验证？ → 本次不处理，后续用 Zod schema 验证
- `modules/narrative/data/worlds/*.ts` 文件是否立即删除？ → 按 CLAUDE.md 规则，过渡期保留 barrel re-export，后续 PR 删除。但本次变更中应标记为 `@deprecated`
