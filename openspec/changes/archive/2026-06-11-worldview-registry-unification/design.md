## Context

当前世界系统存在三层注册中心：

```
WorldDataRegistry          ← 存储原始数据 + 组装后的 WorldviewDefinition（混合职责）
WorldProviderRegistry      ← 管理 WorldProvider 实例（生成 World）
WorldMechanicsRegistry     ← 管理 WorldMechanics（玩法机制）
```

`WorldDataRegistry` 承担了过多职责：既存储零散的 pools（dangers、opportunities、traits、names 等），又存储组装后的 `WorldviewDefinition`，还管理已废弃的 `WorldTypeData` 和 `WorldTemplate`。这导致数据流复杂、初始化逻辑冗长（`init.ts` 中的 `assembleWorldviews()` 需要在各 pool 之间拼接）。

本次重构的目标是：让 `WorldViewRegistry` 只做一件事——管理 `WorldviewDefinition`。

## Goals / Non-Goals

**Goals:**
- 新建 `WorldViewRegistry` 替代 `WorldDataRegistry`，只管理 `WorldviewDefinition`
- 删除所有 `WorldTypeData` 旧类型和相关 deprecated 字段
- 删除 `WorldTemplate`（固化世界模板）整个概念
- Mod contentType `'world'` → `'worldview'`
- 简化 init.ts 初始化流程（不再需要 assemble 步骤）
- 保持 `WorldProviderRegistry` 和 `WorldMechanicsRegistry` 不变

**Non-Goals:**
- 不修改 `World` 接口的数据结构（只确保 `worldviewId` 字段存在）
- 不修改 `WorldMechanics` 相关逻辑
- 不修改 API 路由的对外接口签名（内部实现会变）
- 不修改 Mod JSON 数据文件的格式（只改 contentType 名称）

## Decisions

### Decision 1: WorldViewRegistry 只存完整的 WorldviewDefinition

**选择**: Mod JSON 加载后直接注册到 WorldViewRegistry，不拆分为零散 pools。

**原因**: 当前 `assembleWorldviews()` 的存在是因为旧数据模型把 worldview 拆成了 realmSystem、traitPools、dangers 等独立片段分别注册。但自 `worldview-definition` spec 实施以来，Mod JSON 已经是自包含的完整定义。拆分-组装的往返是不必要的。

**替代方案**: 保留中间存储但标记为内部实现细节 → 拒绝，因为会增加 API 表面积和维护成本。

### Decision 2: WorldViewRegistry API 设计

**选择**: 单例模式，与现有 `WorldProviderRegistry` 和 `WorldMechanicsRegistry` 保持一致。

```typescript
class WorldViewRegistry {
  static getInstance(): WorldViewRegistry;
  register(def: WorldviewDefinition): WorldviewDefinition;
  get(id: string): WorldviewDefinition | undefined;
  getAll(): WorldviewDefinition[];
  getBuiltins(): WorldviewDefinition[];
  get count(): number;
}
```

**原因**: 项目中所有注册中心都使用单例模式，保持一致降低认知负担。

### Decision 3: 删除 WorldTemplate（固化世界模板）

**选择**: 完全删除 `WorldTemplate` 接口、`TemplateWorldProvider`、`validateWorldTemplate`、`worldTemplates` Map、`tpl:` ID 格式。

**原因**:
- 无实际使用场景——项目从零开始构建，没有需要"固化"的预设世界
- WorldTemplate 与 WorldviewDefinition 的边界模糊（一个是成品，一个是配方），但两者存储的数据高度重叠
- 需要确定性世界时，使用固定 seed + WorldviewDefinition 即可得到相同结果

**影响文件**: `core/world/types.ts`、`core/world/TemplateWorldProvider.ts`、`core/world/validateWorldTemplate.ts`、`core/world/identity.ts`、`core/mod/ModManifest.ts`、`core/mod/ModLoader.ts`、`modules/identity/logic/worlds/registerProviders.ts`、`app/api/init.ts`

### Decision 4: Mod contentType 'world' → 'worldview'

**选择**: 直接重命名，不做向后兼容。Mod JSON 文件路径不变（仍在 `data/world/*.json`）。

**原因**: `'worldview'` 语义更准确——Mod 提供的是世界观定义（Worldview），而非世界实例（World）。文件路径保留 `world` 是为了避免不必要的文件迁移。

**影响**: `ModManifest.ts` 类型定义、`ModLoader.ts` 中所有 contentType 判断、`mod-list.json` 中的 `contentTypes` 声明、`build-mods.ts` 构建脚本、`mod-data-bundling` spec。

### Decision 5: WorldProvider type 简化但不删除

**选择**: `WorldProvider.type` 字段保留但只保留 `'random'` 类型，移除 `'template'`。`getByType()` 方法保留以便未来扩展。

**原因**: 保留 type 字段为未来可能的 provider 类型（如 'curated'、'seasonal'）留扩展点。代价极低（一个字符串字段）。

### Decision 6: 迁移策略 — 一次性替换

**选择**: 一步到位：删除 `WorldDataRegistry`，新建 `WorldViewRegistry`，批量更新所有 ~31 个引用文件。

**原因**: 渐进式迁移（deprecate → remove）会增加过渡期复杂度，且两个注册中心并存会导致调用方困惑。当前 `WorldTypeData` 已经标记 deprecated 很久了，时机成熟。

**替代方案**: 先建 WorldViewRegistry、标记 WorldDataRegistry deprecated、逐步迁移 → 拒绝，因为成本高于收益（大量文件需要两次修改）。

## Risks / Trade-offs

- **[风险] 一次性修改 ~31 个文件可能导致遗漏** → 使用 TypeScript 编译检查 + grep 搜索确保无遗漏引用
- **[风险] 删除 WorldTemplate 可能影响测试数据** → 先检查所有测试文件中的 WorldTemplate 引用，确保迁移测试 seed 而非删除测试
- **[权衡] WorldViewRegistry 不再存储零散 pools** → 如果有代码直接读取 `registry.dangers` 而非从 WorldviewDefinition 获取，需要重写。当前代码已大部分从 WorldviewDefinition 读取，影响有限。

## Migration Plan

1. 新建 `WorldViewRegistry.ts` 及测试
2. 删除 `WorldDataRegistry.ts` 及测试
3. 删除模板相关文件：`TemplateWorldProvider.ts`、`validateWorldTemplate.ts`
4. 批量更新 ~31 个文件的 import 路径
5. 修改 `ModManifest.ts`（contentType + 删除 worldTemplates）
6. 修改 `ModLoader.ts`（简化 registerData）
7. 修改 `init.ts`（简化 assemble 流程）
8. 更新 `core/world/types.ts`（删除 WorldTemplate）
9. 更新 `core/world/identity.ts`（删除 tpl: 格式）
10. 更新 `core/registry/index.ts` barrel export
11. 更新 `core/world/index.ts` barrel export
12. 运行 `pnpm ts-check` 确保无类型错误
13. 运行 `pnpm test` 确保测试通过
14. 运行 `pnpm build` 确保构建成功

## Open Questions

- `GAME_VERSION` 常量和 `checkWorldTemplateCompatibility()` 函数在 `shared/config/version.ts` 中是否有其他用途？需在实施时确认，如果仅服务于模板兼容性检查则一并删除。
- 部分 `modules/identity/data/` 文件（如 `worldData.ts`、`worldSystem.ts`）中有大量从 WorldDataRegistry 读取后转换的逻辑，是否需要重构为直接从 WorldViewRegistry 获取？还是只做最小路径替换？→ 建议做最小路径替换，逻辑重构留待后续。
