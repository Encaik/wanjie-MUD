## Context

当前项目的 Mod 系统设计思路是正确的——`WorldDataRegistry` 单例 + `ModLoader` 按 `contentTypes` 加载 JSON 数据文件并注册。但消费代码从未真正信任注册中心，导致严重的隔离泄漏：

1. **`WorldType` 是硬编码联合类型**（`'修仙' | '高武' | ... | '末世'`），新 Mod 无法扩展
2. **`getWorldData()` 有 12 行硬编码数值兜底**（`baseHp: 100`、`hpPerLevel: 15` 等），这些值在 Mod 注册数据更新后不生效
3. **`WORLD_MECHANICS` 工厂表写死 8 世界**，且有 `|| cultivationWorld` Fallback
4. **6+ 处代码中有 `'修仙'` 默认世界类型**，如 `AdventureLootPanel`、`DeveloperPanel`、`calculation/context`

根因分析：第一阶段只做了数据注册通道，但消费层在迁移时为了"兼容"添加了大量兜底逻辑。现在是时候移除这些兜底，让注册中心成为真正唯一的数据源。

## Goals / Non-Goals

**Goals:**
- 消除 `WorldType` 联合类型的硬编码限制，改为品牌字符串
- `getWorldData()` 零硬编码——所有数值来自注册数据
- 世界机制通过注册表注入，不再写死 8 世界映射
- 清理所有兜底默认值（`'修仙'` 作为默认）
- 新 Mod 只要 `mod.json` + 数据文件正确即可工作，零源代码修改

**Non-Goals:**
- 不改动 `ModLoader` 和 `WorldDataRegistry` 的核心注册逻辑（它们已经正确）
- 不重构 8 个世界机制文件的内部逻辑（只改它们的注册方式）
- 不做运行时热加载/卸载 Mod（超出范围）
- 不改动 UI 层面的世界选择交互流程

## Decisions

### 决策 1：`WorldType` → 品牌字符串 `ExtensibleWorldType`

**方案**：`type ExtensibleWorldType = string & { readonly __brand: 'ExtensibleWorldType' }`

创建于 `src/shared/lib/types.ts`，替代原联合类型。提供：
- `asWorldType(id: string): ExtensibleWorldType` — 运行时校验 ID 是否在注册表中，是则返回品牌字符串
- `ExtensibleWorldType` 在所有消费代码中替代 `WorldType`
- 旧 `WorldType` 保留为 `ExtensibleWorldType` 的别名（过渡期），添加 `@deprecated`

**为什么不用 `string`**：品牌字符串在 TypeScript 层面阻止随意赋值普通字符串，迫使调用方通过 `asWorldType()` 校验。

**为什么不用 `enum`**：enum 是编译时固定集合，Mod 在运行时注册新世界类型，enum 无法扩展。

### 决策 2：`WorldTypeData` 扩展 `stats` 字段

**方案**：在 `WorldTypeData` 中添加：
```typescript
interface WorldStatsData {
  baseHp: number;
  hpPerLevel: number;
  hpPerConstitution: number;
  baseAttack: number;
  attackPerLevel: number;
  attackPerConstitution: number;
  attackPerSpiritRoot: number;
  baseDefense: number;
  defensePerLevel: number;
  defensePerWillpower: number;
  enemyAttackBonus: number;
  enemyDefenseBonus: number;
  statDisplayNames: Record<string, string>;
}

interface WorldTypeData {
  // ... existing fields
  stats: WorldStatsData;
}
```

- `getWorldData()` 直接从 `data.stats` 展开，零硬编码
- wanji-core 的 8 个世界 JSON 数据文件需要补充 `stats` 字段
- `stats` 没有默认值——缺失则 `getWorldData()` 抛错

### 决策 3：`WorldMechanicsRegistry` 注册器模式

**方案**：新建 `src/shared/lib/registry/WorldMechanicsRegistry.ts`：

```typescript
class WorldMechanicsRegistry {
  private static instance: WorldMechanicsRegistry | null = null;
  private mechanics: Map<string, WorldMechanics> = new Map();

  static getInstance(): WorldMechanicsRegistry { /* ... */ }
  register(worldTypeId: string, mechanics: WorldMechanics): void { /* ... */ }
  get(worldTypeId: string): WorldMechanics { /* throw if not found */ }
  has(worldTypeId: string): boolean { /* ... */ }
  getAll(): Map<string, WorldMechanics> { /* ... */ }
}
```

- 每个世界机制文件底部添加自注册调用（如 `cultivationWorld.ts` 末尾 `WorldMechanicsRegistry.getInstance().register('修仙', cultivationWorld)`）
- `factory.ts` 中的 `getWorldMechanics()` 委托注册表：`return registry.get(worldType)`
- 移除 `hasUniqueMechanics()` 中的 `worldType !== '修仙'` 硬编码

**为什么不用事件/装饰器**：保持与 `WorldDataRegistry` 一致的显式注册模式，简单直接。

### 决策 4：兜底默认值清理策略

**原则**：消费方参数变为必填（`required`），不再有"如果没有就当作修仙"的逻辑。

- `AdventureLootPanel`: `worldType` prop 从 `= '修仙'` 改为 required
- `DeveloperPanel`: 世界选项列表从 `WorldDataRegistry.getAllWorldTypes()` 动态获取
- `calculation/context/builder.ts`: 从调用方的上下文中获取世界类型，而非硬编码
- `calculation/helpers/contextHelper.ts`: 同上

### 决策 5：`BUILTIN_WORLD_TYPES` 废弃

- 旧 `const BUILTIN_WORLD_TYPES` 改为调用 `getAllWorldTypesFromRegistry()` 的动态列表
- 需要区分内置/Mod 世界时，检查 `WorldTypeData.builtin` 字段
- `WorldTypeData` 添加 `builtin: boolean` 字段，由 wanji-core 注册时设为 `true`

## Risks / Trade-offs

- **风险 1：品牌字符串与第三方类型推断兼容性** → Mitigation：提供 `isExtensibleWorldType()` 类型守卫，并在 `asWorldType()` 中做运行时校验
- **风险 2：旧存档中存储的世界类型字符串可能失效** → Mitigation：旧存档加载时调用 `asWorldType()` 校验，不匹配则提示用户在存档迁移时修复
- **风险 3：wanji-core 的 JSON 数据文件需要补充 `stats` 字段** → Mitigation：在实施 tasks 中明确列出需要更新的数据文件清单
- **风险 4：WorldMechanics 的 8 个实现文件改为自注册** → Mitigation：自注册在模块顶层执行（import 时自动注册），需确保在 `ModLoader.loadAll()` 之前或之后执行——选择在 wanji-core 的数据注册阶段执行

## Migration Plan

1. 扩展 `WorldTypeData` 接口 + 创建 `WorldMechanicsRegistry`
2. `WorldType` → `ExtensibleWorldType` 品牌字符串
3. 更新 wanji-core 的 8 个世界数据 JSON，补充 `stats` 字段
4. 改造 `getWorldData()` 移除硬编码
5. 8 个世界机制文件自注册
6. 清理所有兜底默认值
7. 运行 `pnpm ts-check` + `pnpm lint:strict` + `pnpm build` 确保无错误
8. 用新世界 Mod 示例验证零报错

## Open Questions

- 无
