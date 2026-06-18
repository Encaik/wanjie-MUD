## Why

当前代码库中，奖励/掉落逻辑分散在 5 个模块中各自独立实现，存在严重的重复和耦合问题：

- **零共享**：`itemGenerator.generateRandomDrop()`、`battleController.calculateRewards()`、`fortune/rewardCalculator.ts`、`dungeon/eventSystem.ts`、`tower/towerSystem.ts` 各自独立实现掉落
- **零组合**：没有"掉落池"概念，无法表达 `boss_fire = boss_common + fire_items` 这样的组合关系
- **零配置**：敌人掉落手写在 `enemy.drops[]` 里，100 个敌人 = 100 份手写掉落数据
- **8 处重复的 weightedRandom**：有的用种子有的用 `Math.random()`，行为不一致
- **无 Mod 扩展性**：Mod 注册新物品后，需要手动修改所有相关掉落逻辑
- **`MessageRecord.rewards` 使用旧 `InventoryItem[]`**：新物品系统 (`ItemInstance`) 无法正确展示奖励

玩家反馈"不知道去哪儿刷想要的东西"的根源就是掉落系统没有池子概念，无法实现定向 farming。

## What Changes

- **新建 `modules/reward-pool/` 模块**：完整奖励池系统，作为所有模块的统一奖励出口
- **ItemFilter 动态过滤器**：池子不是静态物品列表，而是对 `ItemRegistry` 的运行时过滤规则。Mod 注册新物品后自动命中
- **4 种条目类型**：`StaticEntry`（指定物品）、`FilterEntry`（动态筛选）、`PoolRefEntry`（池子组合）、`CurrencyEntry`（货币）
- **每条目独立稀有度投骰**：不同条目可配置完全不同的稀有度分布（小怪 90% 白+10% 绿，Boss 保底传说）
- **条件系统**：条目可带 `EntryCondition`（等级/世界观/幸运/任务/难度），不满足自动剪枝
- **Mod 合并语义**：同名池子条目追加，FilterEntry 自动包含 Mod 物品
- **机缘专项类型**：新增 5 个专项机缘（武器库/技阁/金库/经阁/锻炉），与现有 5 个主题并存
- **消息模块集成**：奖励事件驱动 + `MessageRecord.rewards` 迁移到 `ItemInstance[]`
- **删除旧代码**：移除 `generateRandomDrop()`、`rollRarity()`、`enemy.drops[]`、`rewardCalculator.ts` 硬编码等

## Capabilities

### New Capabilities
- `reward-pool`: 新的 `modules/reward-pool/` 模块，包含池子引擎、注册中心、物品过滤器、稀有度投骰器、难度配置
- `reward-pool-item-filter`: ItemFilter 动态过滤系统，运行时查询 ItemRegistry
- `reward-pool-fortune-types`: 5 个新专项机缘类型配置（武器库/技阁/金库/经阁/锻炉）

### Modified Capabilities
- `item-generator`: 删除 `generateRandomDrop()`、`rollRarity()`，保留 `generateItemInstance()` 和 `rollAffixes()`
- `combat-enemy`: `Enemy.drops[]` 替换为 `rewardPoolId`
- `combat-battle`: `calculateRewards()` 掉落部分改用 poolEngine
- `fortune-reward`: `rewardCalculator.ts` 删除硬编码，改用 poolEngine
- `dungeon-event`: `eventSystem.ts` 中 `gain_item` 改用 poolEngine
- `tower-reward`: 塔层奖励改用 poolEngine
- `message-record`: `MessageRecord.rewards` 从 `InventoryItem[]` 迁移到 `ItemInstance[]`
- `message-log`: 新增 `reward` 通道 + 对应模板
- `item-data`: 新增 `getFilteredTemplates()` 方法支持 ItemFilter 查询

## Impact

- **新增 `modules/reward-pool/`** — 约 20 个文件（types, logic, data, hooks, events）
- **修改 `modules/item/`** — `itemGenerator.ts` 删函数，`data/index.ts` 新增查询方法
- **修改 `modules/combat/`** — `enemy/types.ts` 改字段，`battleController.ts` 改用 poolEngine
- **修改 `modules/fortune/`** — `rewardCalculator.ts` 重写，`fortuneTypeConfig.ts` 新增 5 项
- **修改 `modules/exploration/`** — `eventSystem.ts` 改用 poolEngine
- **修改 `modules/tower/`** — 奖励逻辑改用 poolEngine
- **修改 `core/types/`** — `MessageRecord.rewards` 类型迁移
- **修改 `core/message-log/`** — 新增 reward 通道
- **modules/README.md 更新** — 添加 reward-pool/ 条目
