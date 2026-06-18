## Context

万界修行录中，所有资源获取（战斗掉落、机缘探索、地牢事件、爬塔奖励、任务报酬）最终都通过"奖励"到达玩家手中。当前每个模块独立实现奖励逻辑，造成大量重复代码和行为不一致。新模块 `modules/reward-pool/` 作为统一的奖励出口，所有模块通过 `poolId` 字符串引用池子。

**关键约束：**
- `core/` 不能依赖 `modules/`，所以 reward-pool 作为 `modules/` 存在（依赖 `modules/item/`）
- `logic/` 纯函数：无 React、无浏览器 API、使用种子 RNG
- 组件 ≤ 300 行，Hook ≤ 200 行，logic 文件 ≤ 500 行
- 禁止 `any` 类型
- 直接删除旧代码，不兼容、不融合

**依赖关系：**
```
modules/combat ──┐
modules/fortune ─┤
modules/dungeon ─┼──→ poolEngine.rollPool(poolId, ctx) ──→ ItemRegistry (只读)
modules/tower  ──┤                                       │
modules/quest  ──┘                                       └──→ ItemFilter (纯过滤)
```

## Goals / Non-Goals

**Goals:**
1. 统一奖励出口：所有模块通过 `poolId` 获取奖励，不再各自实现
2. 动态过滤器：池子通过 `ItemFilter` 查询 `ItemRegistry`，Mod 物品自动命中
3. 独立稀有度：每个条目独立配置稀有度权重，支持"小怪大概率白、Boss 保底传说"
4. 池子组合：`PoolRefEntry` 支持池子引用池子
5. Mod 合并：同名池子条目追加
6. 完全替代旧代码

**Non-Goals:**
- 不改动 `ItemRegistry` 本身
- 不改动 `ItemInstance` 生成逻辑（`generateItemInstance`、`rollAffixes` 保留）
- 不改动战斗经验/金钱计算（那是结算，不是掉落）
- 不做可视化掉落表编辑器

## Decisions

### D1: 池子本质 — ItemRegistry 的动态过滤器

**Decision:** 池子不存储静态物品列表，而是定义过滤规则。`FilterEntry` 在运行时查询 `ItemRegistry` 获取匹配物品。

```
FilterEntry {
  filter: { category: 'equipment', subcategory: 'weapon_melee', minRarity: 'uncommon' }
  rarityWeights: { uncommon: 0.6, rare: 0.3, epic: 0.08, legendary: 0.02 }
}
    │
    ▼ 运行时
ItemRegistry.getAll()
  .filter(t => t.category === 'equipment' && t.subcategory === 'weapon_melee')
  .filter(t => RARITY_ORDER[t.rarity] >= RARITY_ORDER['uncommon'])
    │
    ▼ 投骰稀有度 = 'rare'
  .filter(t => t.rarity === 'rare')
    │
    ▼ 等概率随机选一个
  → 稀有长剑
```

**Alternatives considered:**
- **静态列表** — 被拒绝：Mod 新增物品需要手动更新池子，维护成本高
- **纯标签系统** — 被拒绝：标签需要额外维护，品类/子品类已经是自然的过滤维度

### D2: 每条目独立稀有度投骰

**Decision:** 每个 `PoolEntry` 自带 `rarityWeights`，resolve 后独立投骰。不搞池子级别的统一稀有度。

```
池子 "boss_fire"
├─ FilterEntry { 装备, weight: 50, rarityWeights: { common: 0.7, rare: 0.2, epic: 0.08, legendary: 0.02 } }
├─ StaticEntry { 'flame_heart', weight: 5, rarityWeights: { legendary: 1.0 } }  ← 保底传说
├─ CurrencyEntry { spirit_stone, amount: [100,500], weight: 30 }               ← 不走稀有度
└─ PoolRefEntry → "rare_materials", weight: 15
```

**理由：** 不同条目代表不同"掉落来源"。小怪 90% 白装 + Boss 保底传说是合理的游戏设计，必须独立控制。

### D3: Mod 合并 — 追加不覆盖

**Decision:** 同名池子的 Mod 条目**追加**到已有条目列表。池子配置参数（`dropCount`、默认 `rarityWeights`）以最后注册的为准。

```
内置 "weapons_all":    entries: [FilterEntry{weapon_melee}, FilterEntry{weapon_ranged}]
Mod "weapons_all":     entries: [StaticEntry{mod_unique_blade}]
                       dropCount: [2, 4]  ← 覆写为 [2,4]

合并后 "weapons_all":  entries: [FilterEntry{melee}, FilterEntry{ranged}, StaticEntry{blade}]
                       dropCount: [2, 4]
```

### D4: 机缘专项 — 主题与专项并存

**Decision:** 保留现有 5 主题机缘，新增 5 专项机缘。专项机缘通过 FilterEntry 实现定向产出。

| 类型 | poolId | 核心 Filter |
|------|--------|------------|
| 武器库 | `fortune_weapon_armory` | `{category: 'equipment', subcategory: ['weapon_melee', 'weapon_ranged']}` |
| 技阁 | `fortune_skill_sanctum` | `{category: 'skill'}` |
| 金库 | `fortune_treasury` | CurrencyEntry 为主 |
| 经阁 | `fortune_scriptorium` | `{category: 'technique'}` |
| 锻炉 | `fortune_forge` | `{category: 'material'}` |

### D5: 模块命名

**Decision:** 命名为 `reward-pool` 而非 `drop-table` 或 `loot-table`。

**理由：** "奖励池"涵盖货币、物品、碎片、经验等全部产出类型，不只是"掉落"。

## Architecture

### 模块结构

```
modules/reward-pool/
├── index.ts              ← 公共 API：rollPool, registerPool, getPool, invalidateCache
├── types.ts              ← 全部类型定义（≤300行）
├── events.ts             ← 奖励事件定义 + MessageManager 模板注册
│
├── logic/
│   ├── index.ts
│   ├── poolEngine.ts     ← rollPool(resolve → rarity → select → generate)（≤500行）
│   ├── poolRegistry.ts   ← 注册 + merge + lookup（≤300行）
│   ├── itemFilter.ts     ← applyFilter(templates, ItemFilter) → filtered[]（≤200行）
│   ├── rarityRoller.ts   ← rollRarity(weights, luck, seed) → Rarity（≤150行）
│   └── __tests__/
│       ├── poolEngine.test.ts
│       ├── poolRegistry.test.ts
│       ├── itemFilter.test.ts
│       └── rarityRoller.test.ts
│
├── data/
│   ├── index.ts
│   ├── difficultyConfig.ts  ← 难度倍率 + 稀有度上限表
│   └── pools/
│       ├── index.ts
│       ├── common.ts        ← 通用货币/材料（所有世界观共享）
│       ├── combat.ts        ← 战斗掉落池（按 tier 分层）
│       ├── fortune.ts       ← 机缘池（5主题 × N节点 + 5专项）
│       ├── dungeon.ts       ← 地牢事件池
│       ├── tower.ts         ← 爬塔层数池
│       └── quest.ts         ← 任务奖励池
│
└── hooks/
    └── useRewardDisplay.ts  ← React Hook：RollResult → UI 展示状态
```

### 核心类型

```typescript
// ─── ItemFilter（核心抽象）───

interface ItemFilter {
  category?: ItemCategory | ItemCategory[];
  subcategory?: string | string[];
  minRarity?: Rarity;
  maxRarity?: Rarity;
  isDroppable?: boolean;
  exclude?: string[];
  tags?: string[];
}

// ─── 条目条件 ───

type EntryCondition =
  | { type: 'playerLevelMin'; value: number }
  | { type: 'playerLevelMax'; value: number }
  | { type: 'worldView'; value: string }
  | { type: 'luckMin'; value: number }
  | { type: 'questCompleted'; questId: string }
  | { type: 'difficultyMin'; value: 'normal' | 'hard' | 'nightmare' };

// ─── 4 种条目 ───

interface StaticEntry {
  type: 'static';
  templateId: string;
  weight: number;
  quantity?: [number, number];
  rarityWeights?: Partial<Record<Rarity, number>>;
  conditions?: EntryCondition[];
}

interface FilterEntry {
  type: 'filter';
  filter: ItemFilter;
  weight: number;
  quantity?: [number, number];
  rarityWeights: Partial<Record<Rarity, number>>;
  conditions?: EntryCondition[];
}

interface PoolRefEntry {
  type: 'pool_ref';
  poolId: string;
  weight: number;
  rarityOverride?: Partial<Record<Rarity, number>>;
  conditions?: EntryCondition[];
}

interface CurrencyEntry {
  type: 'currency';
  currencyType: string;
  amount: [number, number];
  weight: number;
  conditions?: EntryCondition[];
}

type PoolEntry = StaticEntry | FilterEntry | PoolRefEntry | CurrencyEntry;

// ─── 池子定义 ───

interface RewardPool {
  id: string;
  name: string;
  description?: string;
  entries: PoolEntry[];
  dropCount: [number, number];
  defaultRarityWeights?: Partial<Record<Rarity, number>>;
  worldView?: string | null;
  difficultyMultiplier?: Record<string, number>;
}

// ─── 上下文与结果 ───

interface RollContext {
  playerLevel: number;
  worldView: string;
  luck: number;
  difficulty?: 'normal' | 'hard' | 'nightmare';
  seed?: number | string;
  quantityMultiplier?: number;
  maxRarityOverride?: Rarity;
}

interface RollResult {
  items: Array<{ templateId: string; instanceId: string; quantity: number; rarity: Rarity }>;
  currencies: Array<{ type: string; amount: number }>;
  summary: string;
}
```

### 数据流

```
poolEngine.rollPool('combat_cultivation_boss', ctx)
  │
  ├─ ① resolvePool(pool, ctx)
  │     ├─ 遍历 entries
  │     ├─ PoolRefEntry → 递归 getPool(poolId)，展开子条目
  │     ├─ 检查 EntryCondition → 不满足的剔除
  │     └─ 返回 (ResolvedEntry & {weight})[]
  │
  ├─ ② 加权选取 dropCount 个条目
  │     randomWeighted(rng, entries.map(e => e.weight))
  │
  ├─ ③ 对每个选中条目：
  │    StaticEntry:
  │      ├─ rollRarity(entry.rarityWeights, ctx.luck, rng)
  │      ├─ generateItemInstance(templateId, rarity)
  │      └─ rollQuantity(entry.quantity)
  │    FilterEntry:
  │      ├─ rollRarity(entry.rarityWeights, ctx.luck, rng)
  │      ├─ items = applyFilter(getAllTemplates(), entry.filter)
  │      ├─ items = items.filter(i => i.rarity === rolledRarity)
  │      ├─ template = randomItem(rng, items)
  │      ├─ generateItemInstance(template.templateId, rolledRarity)
  │      └─ rollQuantity(entry.quantity)
  │    CurrencyEntry:
  │      └─ rollAmount(entry.amount)
  │
  └─ ④ formatSummary(items, currencies) → string
```

### 集成改造

```
旧代码                                 新代码
──────                                ──────
itemGenerator.generateRandomDrop()    删除
itemGenerator.rollRarity()            删除（逻辑迁到 rarityRoller.ts）
itemGenerator.generateItemInstance()  保留
itemGenerator.rollAffixes()           保留

Enemy.drops[] 字段                    Enemy.rewardPoolId: string
battleController.calculateRewards()   保留 exp/gold 部分
  掉落逻辑                             poolEngine.rollPool(enemy.rewardPoolId, ctx)

fortune/rewardCalculator.ts
  全部硬编码碎片                        poolEngine.rollPool('fortune_' + type + '_' + node, ctx)

dungeon/eventSystem.ts
  case 'gain_item':                   poolEngine.rollPool('dungeon_' + eventId, ctx)
    generateRandomDrop()

tower 硬编码碎片                       poolEngine.rollPool('tower_floor_' + n, ctx)

MessageRecord.rewards                 ItemInstance[] 替代 InventoryItem[]
```

### 消息集成

```
poolEngine.rollPool() 返回 RollResult
  │
  └─→ events.ts 发射 'reward:generated' 事件
        │
        ├─ payload.poolId
        ├─ payload.source  (module, nodeType, etc.)
        └─ payload.result  (RollResult)
              │
              ▼
        MessageManager 匹配模板 'reward:*'
              │
              ▼
        生成 MessageRecord {
          channel: 'reward',
          type: 'success',
          title: '获得奖励',
          content: result.summary,
          rewards: { items: ItemInstance[], ... }
        }
```

## Risks / Mitigations

| 风险 | 缓解 |
|------|------|
| `MessageRecord.rewards` 类型迁移影响 UI | 同步更新所有引用处；新类型向后兼容展示 |
| 稀有度投骰从池子独立后，`itemGenerator.rollRarity()` 的调用方需迁移 | 逐个替换，确认无遗漏 |
| Mod 池子合并可能导致意外条目 | 池子注册时有去重检查，日志记录合并行为 |
| FilterEntry 在物品过多时性能下降 | 缓存 filter 结果（按 filter 签名），`invalidateCache()` 在 Mod 加载后调用 |
