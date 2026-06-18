## Context

万界修行录的物品系统已将货币定义为 `ItemCategory = 'currency'`，以 `ItemInstance` 形式存放在 `protagonist.items` 背包中。但奖励链路中货币仍然独立于物品管线：奖励池有专用 `CurrencyEntry` 类型和 `RollResultCurrency` 结果，任务系统有专用 `spiritStones` 字段和 `resolveCurrencyToItems()` 桥接函数，顶栏有硬编码的 `getResourceName()` 映射表。

**关键约束**：
- `core/` 不能依赖 `modules/`，货币解析函数 `getWorldviewCurrencyItemId()` 位于 `modules/reward-pool/logic/poolEngine.ts`
- `logic/` 纯函数，不能引用 React / 浏览器 API
- 禁止 `any` 类型
- 直接删除，不保留兼容层

## Goals / Non-Goals

**Goals:**
1. 删除 `CurrencyEntry` 类型，所有货币条目统一用 `StaticEntry`，指向通用货币模板 `wanjie:common:spirit_stone`
2. 在 `processStaticEntry` 中自动检测 `currency` 类别并按世界观解析为具体货币模板 ID
3. 删除 `RollResultCurrency` 和 `RollResult.currencies`，统一产出 `RollResultItem`
4. 删除 `RewardResult.spiritStones` 字段和 `resolveCurrencyToItems()` 桥接函数
5. 顶栏货币数量改为世界观感知查询：`getCurrencyAmount(items, getWorldviewCurrencyItemId(worldviewId))`
6. 删除 `layout.tsx` 中 `getResourceName()` 硬编码映射，货币名从 ItemRegistry 查询

**Non-Goals:**
- 不修改 `CurrencyTemplate` 物品模板定义（已在 `currency.ts` 中定义完毕）
- 不修改背包中已有货币物品的 templateId
- 不修改 `InheritanceChoice.spiritStonesPercent`（飞升系统，后续独立处理）
- 不修改旧版 `CurrencyState` 类型（已计划淘汰，本变更不加重其使用）
- 不改动世界观注册中心（`WorldViewRegistry`）

## Architecture

### 核心思想：货币 = 物品，完全统一管线

```
变更前（两条平行通道）：
┌──────────────────────────────────────────────────────────┐
│ 奖励池                                                    │
│   StaticEntry → processStaticEntry → RollResultItem      │
│   FilterEntry → processFilterEntry → RollResultItem      │
│   CurrencyEntry → processCurrencyEntry → RollResultCurrency │ ← 特殊通道
│   PoolRefEntry → resolvePool (recursive)                 │
├──────────────────────────────────────────────────────────┤
│ 任务奖励分发器                                             │
│   RollResult.items → RewardResult.items                   │
│   RollResult.currencies → RewardResult.spiritStones       │ ← 特殊字段
│   resolveCurrencyToItems(spiritStones, worldviewId)       │ ← 桥接函数
├──────────────────────────────────────────────────────────┤
│ 顶栏                                                      │
│   数量：getCurrencyAmount(items, 'wanjie:common:spirit_stone') │ ← 硬编码
│   名称：getResourceName(worldType)                        │ ← 硬编码映射
└──────────────────────────────────────────────────────────┘

变更后（单一条通道）：
┌──────────────────────────────────────────────────────────┐
│ 奖励池                                                    │
│   StaticEntry(templateId='wanjie:common:spirit_stone')    │
│     → processStaticEntry                                  │
│       → 检测 category==='currency'                         │
│         → getWorldviewCurrencyItemId(worldviewId)          │
│           → generateItemInstance(resolvedId, ...)          │
│       → RollResultItem                                    │ ← 统一产出
│   FilterEntry → processFilterEntry → RollResultItem      │
│   PoolRefEntry → resolvePool (recursive)                 │
├──────────────────────────────────────────────────────────┤
│ 任务奖励分发器                                             │
│   RollResult.items → RewardResult.items                   │ ← 只有 items
│   buildRewardMessage 筛选 category==='currency' 的 items   │
├──────────────────────────────────────────────────────────┤
│ 顶栏                                                      │
│   currencyId = getWorldviewCurrencyItemId(worldviewId)    │ ← 单一数据源
│   数量：getCurrencyAmount(items, currencyId)               │
│   名称：getTemplate(currencyId).name                       │
└──────────────────────────────────────────────────────────┘
```

### 奖励池改造

#### types.ts 变更

```typescript
// 删除：
export interface CurrencyEntry { ... }           // 约 11 行
export interface RollResultCurrency { ... }      // 约 6 行
export type PoolEntry = StaticEntry | FilterEntry | PoolRefEntry | CurrencyEntry;
// 改为：
export type PoolEntry = StaticEntry | FilterEntry | PoolRefEntry;

export interface RollResult {
  items: RollResultItem[];
  // 删除 currencies 字段
  summary: string;
}

export interface ResolvedEntry {
  // 删除 CurrencyEntry 引用
  entry: StaticEntry | FilterEntry;
  // ... 其余不变
}
```

#### poolEngine.ts 变更

```typescript
// 在 processStaticEntry 中，稀有度投骰前新增货币解析：
function processStaticEntry(
  entry: StaticEntry,
  ctx: RollContext,
  rarityOverride: Partial<Record<Rarity, number>> | undefined,
  rng: () => number
): RollResultItem | null {
  // 新增：货币类物品按世界观解析 templateId
  let templateId = entry.templateId;
  if (isGenericCurrency(templateId) && ctx.worldView) {
    // 检查是否为通用货币模板（如 wanjie:common:spirit_stone）
    const resolved = getWorldviewCurrencyItemId(ctx.worldView);
    if (resolved !== templateId) {
      templateId = resolved;
    }
  }

  // 以下使用 templateId 替代 entry.templateId（其余不变）
  const weights = rarityOverride ?? entry.rarityWeights;
  if (!weights || Object.keys(weights).length === 0) {
    try {
      const template = getTemplate(templateId);
      // ...
    }
  }
  // ...
}

/**
 * 判断是否为通用货币模板 ID
 *
 * 通用货币（wanjie:common:spirit_stone 等）是占位符，
 * 实际发放时按世界观替换为 wanjie-core:<worldview>:spirit_stone。
 */
const GENERIC_CURRENCY_IDS = new Set([
  'wanjie:common:spirit_stone',
  'wanjie:common:contribution',
  'wanjie:common:sect_point',
  'wanjie:common:honor',
  'wanjie:common:ascension_mark',
  'wanjie:common:event_token',
]);

function isGenericCurrency(templateId: string): boolean {
  return GENERIC_CURRENCY_IDS.has(templateId);
}
```

替代方案：不维护 `GENERIC_CURRENCY_IDS` 硬编码集合，而是在模板存在时检查其 `category === 'currency'`：

```typescript
function resolveCurrencyTemplateIdIfApplicable(
  templateId: string,
  worldView: string | undefined,
): string {
  if (!worldView) return templateId;
  try {
    const template = getTemplate(templateId);
    if (template.category === 'currency') {
      return getWorldviewCurrencyItemId(worldView);
    }
  } catch { /* 模板不存在，保持原样 */ }
  return templateId;
}
```

**Decision**: 使用方案 B（检查 `category === 'currency'`）。理由：不维护硬编码 ID 列表，自动兼容未来新增的通用货币模板。`getTemplate` 调用在 `processStaticEntry` 中本就会发生，无额外性能开销。

#### 奖励池数据文件迁移

30+ 处 `CurrencyEntry` → `StaticEntry`：

```typescript
// 旧：
{ type: 'currency', currencyType: '灵石', amount: [10, 100], weight: 40 }

// 新：
{ type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [10, 100], weight: 40 }
```

**变更量**（按文件）：
- `common.ts`: 3 处
- `combat.ts`: 4 处
- `dungeon.ts`: 4 处
- `tower.ts`: 2 处
- `quest.ts`: 3 处
- `fortune.ts`: ~18 处

### 任务奖励分发器改造

#### rewardDistributor.ts 变更

```typescript
// 删除 spiritStones 字段
export interface RewardResult {
  success: boolean;
  experience: number;
  // 删除：spiritStones: number;
  items: { itemId: string; quantity: number }[];
  attitudeChanges: { npcId: string; change: number }[];
  reputationChanges: { factionId: string; change: number }[];
  unlockedQuests: string[];
  message: string;
}

// 创建空结果不再初始化 spiritStones
export function createEmptyRewardResult(): RewardResult {
  return {
    success: true,
    experience: 0,
    items: [],
    attitudeChanges: [],
    reputationChanges: [],
    unlockedQuests: [],
    message: '',
  };
}

// mergeRewards 不再处理 spiritStones
export function mergeRewards(rewards: QuestReward[], worldviewId?: string): RewardResult {
  const result = createEmptyRewardResult();
  for (const reward of rewards) {
    if (reward.experience) result.experience += reward.experience;
    if (reward.items) result.items.push(...reward.items);
    // 删除：if (reward.spiritStones) ...
    // ...
  }
  result.message = buildRewardMessage(result, worldviewId);
  return result;
}

// buildRewardMessage 从 items 中识别货币
export function buildRewardMessage(result: RewardResult, worldviewId?: string): string {
  const parts: string[] = [];
  if (result.experience > 0) parts.push(`经验 +${result.experience}`);

  if (result.items.length > 0) {
    parts.push(`获得: ${result.items.map(i => {
      let name: string;
      try {
        name = getTemplate(i.itemId).name;
      } catch {
        name = i.itemId.split(':').pop() ?? i.itemId;
      }
      return `${name} x${i.quantity}`;
    }).join(', ')}`);
  }
  // ... 其余不变
}

// calculateQuestRewards 不再筛选 currencies 到 spiritStones
export async function calculateQuestRewards(...): Promise<RewardResult> {
  // ...
  const result = createEmptyRewardResult();
  // 货币已在 poolResult.items 中（poolEngine 已解析为世界观货币）
  result.items = poolResult.items.map(i => ({
    itemId: i.templateId,
    quantity: i.quantity,
  }));
  // 删除：result.spiritStones = poolResult.currencies.filter(...)
  // ...
}

// 删除 resolveCurrencyToItems() 整个函数（约 15 行）
```

#### useQuest.ts 变更

`claimQuestReward` 中删除 `resolveCurrencyToItems()` 调用：

```typescript
// 旧：
const allRewardItems = resolveCurrencyToItems(result, worldviewId);

// 新：直接使用 result.items（货币已是其中一部分）
const allRewardItems = result.items;
```

消息构建时 `hasRewards` 判断删除 `result.spiritStones > 0`：

```typescript
// 旧：
const hasRewards = result.experience > 0 || result.spiritStones > 0 || result.items.length > 0;

// 新：
const hasRewards = result.experience > 0 || result.items.length > 0;
```

### 顶栏改造

#### layout.tsx 变更

```typescript
// 删除硬编码映射函数：
// function getResourceName(worldType: string): string { ... }  ← 整个函数删除

// 添加世界观感知的货币查询：
import { getCurrencyAmount } from '@/modules/item/logic';
import { getWorldviewCurrencyItemId } from '@/modules/reward-pool/logic/poolEngine';
import { getTemplate } from '@/modules/item/data';

// 在组件中：
const currencyId = useMemo(
  () => getWorldviewCurrencyItemId(protagonist?.world.worldviewId),
  [protagonist?.world.worldviewId],
);

const spiritStones = useMemo(
  () => protagonist ? getCurrencyAmount(protagonist.items, currencyId) : 0,
  [protagonist?.items, currencyId],
);

const currencyName = useMemo(
  () => {
    try { return getTemplate(currencyId).name; }
    catch { return '灵石'; }
  },
  [currencyId],
);
```

#### GameHeader.tsx

Props 保持不变（`spiritStones`、`currencyName`），layout.tsx 传入的值已经是世界观感知的。

### 数据流（变更后）

```
奖励池滚动
  │
  ├── StaticEntry(templateId='wanjie:common:spirit_stone', quantity=[50,100])
  │     → processStaticEntry
  │       → 检测 category === 'currency' → getWorldviewCurrencyItemId('cultivation')
  │       → templateId = 'wanjie-core:cultivation:spirit_stone'
  │       → generateItemInstance('wanjie-core:cultivation:spirit_stone', ...)
  │       → RollResultItem { templateId: 'wanjie-core:cultivation:spirit_stone', quantity: 75 }
  │
  └── RollResult { items: [...], summary: '获得了 灵石 ×75、...' }

任务领奖
  │
  ├── rewardDistributor.calculateQuestRewards()
  │     → RewardResult { items: [{ itemId: 'wanjie-core:cultivation:spirit_stone', quantity: 75 }, ...] }
  │
  └── useQuest.claimQuestReward()
        → addItem(inventory, 'wanjie-core:cultivation:spirit_stone', 75, { source: 'quest' })
        → 背包中新增 75 个 wanjie-core:cultivation:spirit_stone

顶栏显示
  │
  ├── currencyId = getWorldviewCurrencyItemId('cultivation') → 'wanjie-core:cultivation:spirit_stone'
  ├── count = getCurrencyAmount(items, 'wanjie-core:cultivation:spirit_stone') → 75
  ├── name = getTemplate('wanjie-core:cultivation:spirit_stone').name → '灵石'
  └── 顶栏显示：灵石 75
```

### 世界观货币解析函数位置

`getWorldviewCurrencyItemId()` 当前在 `modules/reward-pool/logic/poolEngine.ts`。由于 `app/game/layout.tsx` 需要引入它来确定顶栏显示的货币，而 layout.tsx 目前已经从 `modules/` 引用（`getCurrencyAmount`、`getFactionById` 等），因此不需要移动该函数。如果未来有 `core/` 层需要它，可考虑迁至 `core/world/` 或 `core/calculation/`。

## Decisions

### D1: 货币解析放在 processStaticEntry 而非独立函数

**Decision:** 货币世界观解析直接在 `processStaticEntry` 中完成，不需要调用方知晓。

**理由:** 调用方（`rollPool`、`resolvePool`）不需要关心 `StaticEntry` 的子类别。货币就是 item，解析是内部优化。

### D2: 用 category 检测而非硬编码 ID 集合

**Decision:** 使用 `getTemplate(templateId).category === 'currency'` 判断是否需要世界观解析，而不是维护 `GENERIC_CURRENCY_IDS` 集合。

**理由:** 
- 避免维护两份数据（模板定义 + ID 集合）
- 自动兼容未来新增的通用货币模板
- `getTemplate` 在 `processStaticEntry` 中本就会调用（获取 `template.rarity`），无额外开销

### D3: 删除而非标记 deprecated

**Decision:** `CurrencyEntry`、`RollResultCurrency`、`spiritStones`、`resolveCurrencyToItems()`、`getResourceName()` 直接删除，不留兼容层。

**理由:** 遵循项目"不写过渡兼容代码"原则。所有引用在本变更中一并修改。

### D4: getWorldviewCurrencyItemId 位置不变

**Decision:** `getWorldviewCurrencyItemId()` 保留在 `modules/reward-pool/logic/poolEngine.ts`，不做迁移。

**理由:** layout.tsx 已经依赖 `modules/` 层（`getCurrencyAmount`、`getFactionById`），不违背架构约束。贸然迁移可能引入不必要的 `core/` 依赖问题。

### D5: 货币无稀有度投骰

**Decision:** 货币类 `StaticEntry` 不使用稀有度权重（`rarityWeights` 设为 `undefined`），直接使用模板默认稀有度（common）。

**理由:** 货币的稀有度是固定的（common），不需要投骰。这与原 `CurrencyEntry` 行为一致（原 `CurrencyEntry` 不走稀有度投骰）。

## Risks / Mitigations

| 风险 | 缓解 |
|------|------|
| `buildRewardMessage` 从 items 筛选货币时，货币可能显示为"灵石"而实际发放的是"修仙灵石"（两模板名不同） | 货币已在 `processStaticEntry` 中解析为世界观模板，`buildRewardMessage` 查到的模板名就是实际发放的模板名 |
| 顶栏在无世界观状态下（如初始加载）`getWorldviewCurrencyItemId(undefined)` 返回 `wanjie:common:spirit_stone` | `getWorldviewCurrencyItemId(undefined)` 已处理此情况，返回 `DEFAULT_CURRENCY_ID` |
| 旧存档中可能有 `wanjie:common:spirit_stone` 货币物品（在新规则下不会再发放但历史数据存在） | 顶栏仍会显示这些货币数量（`getCurrencyAmount` 可以查到），不影响体验 |
| `calculateQuestRewards` 中 `result.spiritStones` 删除后，`QuestReward.spiritStones` 字段仍在 `core/types` 中但不再被消费 | `QuestReward` 是 core 类型，暂不修改（可能被其他模块如飞升引用）。不影响本变更行为 |
| `reward-pool/events.ts` 的 `emitRewardEvent` 传递的 `result` 类型变更 | 同步修改 events.ts 中事件 payload 类型 |
