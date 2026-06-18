# reward-pool-item-filter

ItemFilter 系统，奖励池对 ItemRegistry 的动态过滤层。

## 职责

- 定义 `ItemFilter` 类型结构
- 实现 `applyFilter()` 运行时过滤函数
- 支持 Mod 物品自动命中（通过惰性查询 ItemRegistry）

## ItemFilter 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `category` | `ItemCategory \| ItemCategory[]` | 品类（equipment/consumable/material/technique/skill/fragment） |
| `subcategory` | `string \| string[]` | 子类别（如 weapon_melee, pill_hp） |
| `minRarity` | `Rarity` | 最低稀有度（含） |
| `maxRarity` | `Rarity` | 最高稀有度（含） |
| `isDroppable` | `boolean` | 是否可掉落，默认 true |
| `exclude` | `string[]` | 排除的 templateId 列表 |
| `tags` | `string[]` | 扩展标签（预留） |

## applyFilter 逻辑

```
① 从 ItemRegistry.getAll() 获取全部模板
② 过滤 isDroppable（默认 true）
③ 过滤 category（支持单值和数组）
④ 过滤 subcategory（支持单值和数组）
⑤ 过滤 rarity 范围（用 RARITY_ORDER 比较）
⑥ 排除 exclude 列表中的 templateId
⑦ 返回匹配的 ItemTemplate[]
```

## 与 RollContext 的关系

- `worldView` 过滤不在 `ItemFilter` 中，而是在 `RollContext` 中提供
- 调用方在调用 `rollPool` 前将 worldView 传入 context
- `applyFilter` 本身不做世界观过滤（那是 poolEngine 的职责）

## 缓存策略

- FilterEntry 的过滤结果按 `JSON.stringify(filter)` 为 key 缓存
- 在 `invalidateCache()` 时清空（Mod 加载后调用）
- 缓存存储在 `poolRegistry` 内部，不暴露

## 边界情况

- 过滤后结果为空 → 返回 `[]`，poolEngine 将该条目产出标记为 null
- category 为 `undefined` → 不过滤（匹配所有品类）
- subcategory 为 `undefined` → 不过滤（匹配所有子类别）
- minRarity 未指定 → 默认 common
- maxRarity 未指定 → 默认 mythic
