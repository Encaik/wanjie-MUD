# reward-pool

统一的奖励池模块，作为所有游戏模块获取奖励的唯一出口。

## 模块职责

- 定义和注册奖励池（`RewardPool`）
- 根据上下文滚动池子产生奖励（`rollPool`）
- 支持 Mod 池子合并
- 发射奖励事件供消息系统消费

## 类型

### RewardPool
- `id: string` — 唯一标识，如 `"combat_cultivation_boss"`
- `name: string` — 显示名称
- `description?: string`
- `entries: PoolEntry[]` — 条目列表
- `dropCount: [number, number]` — 每次滚动产出条目数 `[min, max]`
- `defaultRarityWeights?: Partial<Record<Rarity, number>>` — 条目未指定 rarityWeights 时的默认值
- `worldView?: string | null` — 世界观限定
- `difficultyMultiplier?: Record<string, number>` — 难度倍率

### PoolEntry
联合类型，4 种变体：

1. **StaticEntry** — 指定具体物品模板
   - `templateId: string`
   - `weight: number`
   - `quantity?: [number, number]`
   - `rarityWeights?: Partial<Record<Rarity, number>>`
   - `conditions?: EntryCondition[]`

2. **FilterEntry** — 动态过滤 ItemRegistry
   - `filter: ItemFilter`
   - `weight: number`
   - `quantity?: [number, number]`
   - `rarityWeights: Partial<Record<Rarity, number>>`
   - `conditions?: EntryCondition[]`

3. **PoolRefEntry** — 引用另一个池子
   - `poolId: string`
   - `weight: number`
   - `rarityOverride?: Partial<Record<Rarity, number>>`
   - `conditions?: EntryCondition[]`

4. ~~**CurrencyEntry**~~ — 已删除。货币改用 `StaticEntry`（`templateId: 'wanjie:common:spirit_stone'`），在 `processStaticEntry` 中自动按世界观解析为具体货币模板

### EntryCondition
- `playerLevelMin` / `playerLevelMax` — 等级限制
- `worldView` — 世界观匹配
- `luckMin` — 最低幸运值
- `questCompleted` — 需完成特定任务
- `difficultyMin` — 最低难度

### RollContext
- `playerLevel: number`
- `worldView: string`
- `luck: number`
- `difficulty?: 'normal' | 'hard' | 'nightmare'`
- `seed?: number | string`
- `quantityMultiplier?: number`
- `maxRarityOverride?: Rarity`

### RollResult
- `items: Array<{ templateId, instanceId, quantity, rarity }>` — 统一产出（含货币物品）
- `summary: string` — 格式化文本

## 逻辑函数

### poolEngine

| 函数 | 签名 | 职责 |
|------|------|------|
| `rollPool` | `(poolId: string, ctx: RollContext) => RollResult` | 主入口：resolve → rarity roll → select → generate |
| `resolvePool` | `(pool: RewardPool, ctx: RollContext) => ResolvedEntry[]` | 展开 pool_ref，过滤 conditions，收集所有生效条目 |

### poolRegistry

| 函数 | 签名 | 职责 |
|------|------|------|
| `registerPool` | `(pool: RewardPool) => void` | 注册/合并池子 |
| `getPool` | `(id: string) => RewardPool \| undefined` | 查询池子 |
| `getAllPoolIds` | `() => string[]` | 所有已注册池子 ID |
| `invalidateCache` | `() => void` | 清除 FilterEntry 缓存 |

### rarityRoller

| 函数 | 签名 | 职责 |
|------|------|------|
| `rollRarity` | `(weights: Partial<Record<Rarity, number>>, luck: number, seed?: number \| string) => Rarity` | 加权稀有度投骰 |

### itemFilter

| 函数 | 签名 | 职责 |
|------|------|------|
| `applyFilter` | `(templates: ItemTemplate[], filter: ItemFilter) => ItemTemplate[]` | 按过滤条件筛选模板 |

## 注册中心合并规则

1. 同名 poolId：Mod 的 entries 追加到已有 entries 末尾
2. 池子配置参数（`dropCount`、`defaultRarityWeights`、`worldView`、`difficultyMultiplier`）以最后注册的为准
3. `static` 类型的 templateId 去重检查（同 templateId 重复注册时 warn）
4. `pool_ref` 引用的池子必须在注册时已存在（注册顺序由 Mod 加载顺序保证）

## 边界情况

- 池子为空或所有条目被条件过滤 → `RollResult` 为空（items=[], summary="未获得任何物品"）
- FilterEntry 过滤后无匹配物品 → 该条目产出 `null`，不贡献到结果
- PoolRefEntry 引用不存在的池子 → warn 日志，该条目产出 `null`
- 稀有度 weights 全为 0 → fallback 到 `common`
- seed 未提供 → 使用 `Date.now()` 作为 fallback
