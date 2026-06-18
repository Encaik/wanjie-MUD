## Why

当前物品系统已基本重构完成——货币（灵石/银两/魔晶等）在物品系统中已有完整的 `CurrencyTemplate` 定义，以 `ItemInstance` 形式存放在背包中，和其他物品（丹药、材料、装备）存储结构完全一致。但整个奖励链路中，货币仍然被**处处特殊处理**，形成一条与普通物品平行的独立通道：

1. **奖励池有独立的 `CurrencyEntry`** — 货币在池子中是第 4 种条目类型，产出为 `RollResultCurrency`（独立于 `RollResultItem`），不走稀有度投骰、不走统一的物品生成管线
2. **`currencyType` 使用中文 `'灵石'`** — 全部 30+ 处奖励池定义使用 `currencyType: '灵石'`，但 `resolveCurrencyTemplateId` 只匹配英文 `'spirit_stone'`，导致世界观映射从不触发，实际走的是回退逻辑
3. **`RewardResult` 保留独立 `spiritStones` 字段** — 虽已标记 `@deprecated`，但仍被 `calculateQuestRewards` 填充，再通过桥接函数 `resolveCurrencyToItems()` 转回物品数组
4. **顶栏硬编码查询 `wanjie:common:spirit_stone`** — 始终显示通用灵石数量，但货币名称却根据世界观显示为"银两""魔晶"等，数量与名称不匹配
5. **两套世界观→货币映射** — `poolEngine.ts` 的 `getWorldviewCurrencyItemId()` 和 `layout.tsx` 的 `getResourceName()` 功能重叠但数据源不同

**核心理念**：货币也是物品的一种，从奖励池产出到背包存储到顶栏显示，应该走与普通物品完全相同的管线——不需要独立的条目类型、独立的结果字段、独立的桥接函数。

## What Changes

- **删除 `CurrencyEntry` 和 `RollResultCurrency`**：奖励池仅保留 3 种条目类型（`StaticEntry`、`FilterEntry`、`PoolRefEntry`），所有产出统一为 `RollResultItem`
- **所有池子中的货币条目改为 `StaticEntry`**：`currencyType: '灵石'` → `templateId: 'wanjie:common:spirit_stone'`（通用货币 ID）
- **自动世界观货币解析**：在 `processStaticEntry` 中，检测模板类别为 `currency` 时自动调用 `getWorldviewCurrencyItemId()` 解析为世界观特定货币（`wanjie-core:cultivation:spirit_stone` / `wanjie-core:martial:silver_tael` 等）
- **删除 `RewardResult.spiritStones`**：货币完全走 `items` 数组，构建消息时从 items 中筛选货币类物品显示
- **删除 `resolveCurrencyToItems()` 桥接函数**：不再需要，奖励结果直接包含正确的货币物品
- **顶栏使用世界观感知的货币查询**：改用 `getWorldviewCurrencyItemId(protagonist.world.worldviewId)` 确定要显示的货币物品 ID
- **删除 `layout.tsx` 中 `getResourceName()` 硬编码映射**：货币显示名从 ItemRegistry 查询模板名（`getTemplate(currencyId).name`）

## Capabilities

### New Capabilities
- `worldview-currency-auto-resolve`: `StaticEntry` 自动检测 `currency` 类别物品并按世界观解析为具体货币模板

### Modified Capabilities
- `reward-pool`: 删除 `CurrencyEntry` 类型和 `processCurrencyEntry` 函数，货币条目统一用 `StaticEntry`；删除 `RollResultCurrency`，`RollResult` 统一产出 `RollResultItem`
- `quest-system`: `RewardResult` 删除 `spiritStones` 字段，`resolveCurrencyToItems()` 删除，`buildRewardMessage()` 从 items 中识别货币
- `game-header`: 顶栏货币数量从通用灵石改为世界观感知的货币物品查询

### Removed Capabilities
- `currency-entry-type`: 删除 `CurrencyEntry` 条目类型和 `processCurrencyEntry` 函数
- `roll-result-currency`: 删除 `RollResultCurrency` 类型和 `RollResult.currencies` 字段
- `resolve-currency-bridge`: 删除 `resolveCurrencyToItems()` 桥接函数
- `legacy-spirit-stones-field`: 删除 `RewardResult.spiritStones` 字段
- `hardcoded-resource-name`: 删除 `layout.tsx` 中 `getResourceName()` 硬编码映射

## Impact

- **删除** `reward-pool/types.ts` 中 `CurrencyEntry`、`RollResultCurrency`、`RollResult.currencies`
- **修改** `reward-pool/logic/poolEngine.ts` — 删除 `processCurrencyEntry`、`formatSummary` 不再处理 `currencies`、`rollPool` 只返回 `items`、`processStaticEntry` 新增货币自动解析（≤10 行）
- **修改** 6 个奖励池数据文件 — 约 30 处 `CurrencyEntry` 改为 `StaticEntry`
- **修改** `quest/logic/rewardDistributor.ts` — 删除 `spiritStones` 字段、删除 `resolveCurrencyToItems()`、重构 `buildRewardMessage()`（货币从 items 中筛选）
- **修改** `quest/hooks/useQuest.ts` — `claimQuestReward` 不再调用 `resolveCurrencyToItems()`，直接使用 `result.items`
- **修改** `app/game/layout.tsx` — 删除 `getResourceName()`，货币 ID 和名称改用 `getWorldviewCurrencyItemId()` + `getTemplate()`
- **修改** `views/game/layout/GameHeader.tsx` — props 新增 `currencyItemId` 或由调用方传入 worldview-aware 的 currencyName
- **修改** `reward-pool/events.ts` — 事件类型从 `RollResult` 改为无 `currencies` 字段
- **不需要迁移**：背包中已有货币物品的玩家数据不受影响（货币 templateId 不变）

**风险**：奖励池数据文件中 `currencyType: '灵石'` 改为 `templateId: 'wanjie:common:spirit_stone'` 后，需确认世界观解析在运行时正确触发。顶栏货币显示需验证在无世界观（如初始状态）时回退到通用灵石。
