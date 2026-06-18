## Stage 1: 模块骨架（类型 + 目录 + 导出）

### 1.1 目录结构
- [x] 创建 `modules/reward-pool/` 完整目录结构（index.ts, types.ts, events.ts, logic/, data/pools/, hooks/）
- [x] 验证：目录结构与 design.md 一致

### 1.2 类型定义
- [x] 实现 `types.ts`：`ItemFilter`, `EntryCondition`, `StaticEntry`, `FilterEntry`, `PoolRefEntry`, `CurrencyEntry`, `PoolEntry`, `RewardPool`, `RollContext`, `RollResult`
- [x] 所有类型有 JSDoc 注释
- [x] 验证：`pnpm ts-check` 类型通过，文件 ≤ 300 行

### 1.3 桶文件
- [x] 实现 `index.ts`：导出全部公共类型和函数
- [x] 验证：`import { rollPool } from '@/modules/reward-pool'` 可解析

---

## Stage 2: 核心逻辑（引擎 + 注册 + 过滤 + 稀有度）

### 2.1 物品过滤器
- [x] 实现 `logic/itemFilter.ts`：
  - `applyFilter(templates, filter)` → `ItemTemplate[]`
  - 支持 category / subcategory / rarity 范围 / isDroppable / exclude
- [x] 实现 `logic/itemFilter.test.ts`：测试各种过滤组合、空结果、边界
- [x] 验证：`pnpm test` 通过，文件 ≤ 200 行

### 2.2 稀有度投骰器
- [x] 实现 `logic/rarityRoller.ts`：
  - `rollRarity(weights, luck, seed?)` → `Rarity`
  - 使用 `createRng` from `@/shared/utils/rng`
  - 幸运值加成逻辑（高于 8 点提升高稀有度权重）
  - 权重全 0 时 fallback 到 `common`
- [x] 实现 `logic/rarityRoller.test.ts`：确定性种子测试、幸运值边界测试
- [x] 验证：`pnpm test` 通过，文件 ≤ 150 行

### 2.3 池子注册中心
- [x] 实现 `logic/poolRegistry.ts`：
  - `registerPool(pool)` — 注册/合并池子
  - `getPool(id)` — 查询池子
  - `getAllPoolIds()` — 所有池子 ID
  - `invalidateCache()` — 清除 FilterEntry 缓存
  - Mod 合并：同名追加 entries，配置以最后注册为准
  - 去重检查：同 templateId 重复 static 条目 warn
  - pool_ref 存在性验证
- [x] 实现 `logic/poolRegistry.test.ts`：注册、合并、去重、缓存
- [x] 验证：`pnpm test` 通过，文件 ≤ 300 行

### 2.4 池子引擎
- [x] 实现 `logic/poolEngine.ts`：
  - `rollPool(poolId, ctx)` → `RollResult`
  - `resolvePool(pool, ctx)` — 展开 pool_ref，过滤 conditions，返回有效条目
  - 加权选取条目（使用 `randomWeighted` from `@/shared/utils/rng`）
  - 每个条目独立投骰稀有度
  - FilterEntry：稀有度投骰 → applyFilter → 随机选模板 → 生成实例
  - StaticEntry：稀有度投骰 → 生成实例
  - CurrencyEntry：roll 数量
  - PoolRefEntry：递归 rollPool
  - 调用 `generateItemInstance` from `@/modules/item/logic`
  - `formatSummary(items, currencies)` → string
- [x] 实现 `logic/poolEngine.test.ts`：完整流程测试、边界测试
- [x] 验证：`pnpm test` 通过，文件 ≤ 500 行

### 2.5 逻辑桶文件
- [x] 实现 `logic/index.ts`：导出所有 logic 函数
- [x] 验证：`pnpm ts-check` 通过

---

## Stage 3: 数据配置（难度 + 池子定义）

### 3.1 难度配置
- [x] 实现 `data/difficultyConfig.ts`：
  - 难度倍率表（normal=1.0, hard=1.5, nightmare=2.5）
  - 按等级段稀有度上限表
- [x] 验证：文件 ≤ 200 行

### 3.2 通用池子
- [x] 实现 `data/pools/common.ts`：
  - `common_currency` — 灵石掉落池
  - `common_material` — 通用材料池（FilterEntry: category=material）
  - `common_consumable` — 通用消耗品池
- [x] 验证：文件 ≤ 200 行

### 3.3 战斗掉落池
- [x] 实现 `data/pools/combat.ts`：
  - `combat_normal` — 普通敌人掉落
  - `combat_elite` — 精英敌人掉落（稀有度偏斜）
  - `combat_miniboss` — 小头目掉落
  - `combat_boss` — Boss 掉落（保底稀有+）
  - 每个池子包含 FilterEntry（装备/功法/技能）+ CurrencyEntry（灵石）
  - 稀有度 weights 按 tier 递增
- [x] 验证：文件 ≤ 400 行

### 3.4 机缘池子
- [x] 实现 `data/pools/fortune.ts`：
  - 5 主题 × 3 节点分类（combat/resource/guardian）= 15 个基础池
  - 5 专项机缘 × 2 节点分类 = 10 个专项池
  - 每个池子匹配对应机缘类型的奖励侧重
- [x] 验证：文件 ≤ 600 行（视复杂度可拆分为 fortune-general.ts + fortune-specialized.ts）

### 3.5 地牢事件池
- [x] 实现 `data/pools/dungeon.ts`：
  - `dungeon_treasure` — 宝箱事件
  - `dungeon_shrine` — 祭坛事件
  - `dungeon_hidden_room` — 隐藏房间
  - `dungeon_elite_guardian` — 精英守卫
- [x] 验证：文件 ≤ 300 行

### 3.6 爬塔池子
- [x] 实现 `data/pools/tower.ts`：
  - `tower_floor_normal` — 普通层
  - `tower_floor_boss` — Boss 层（每 10 层）
  - 稀有度权重随层数递增
- [x] 验证：文件 ≤ 200 行

### 3.7 任务奖励池
- [x] 实现 `data/pools/quest.ts`：
  - `quest_tutorial` — 新手任务奖励
  - `quest_daily` — 日常任务奖励
  - `quest_faction` — 宗门任务奖励
- [x] 验证：文件 ≤ 200 行

### 3.8 数据桶文件
- [x] 实现 `data/index.ts` + `data/pools/index.ts`：导出所有池子和配置
- [x] 验证：`pnpm ts-check` 通过

---

## Stage 4: 旧代码清理 + 集成改造

### 4.1 itemGenerator 清理
- [x] 删除 `modules/item/logic/itemGenerator.ts` 中的 `generateRandomDrop()` 函数
- [x] 删除 `modules/item/logic/itemGenerator.ts` 中的 `rollRarity()` 函数（逻辑已迁到 rarityRoller.ts）
- [x] 删除 `modules/item/logic/itemGenerator.ts` 中的内联 `createRng`（改用 `@/shared/utils/rng` 的）
- [x] 保留 `generateItemInstance()` 和 `rollAffixes()`
- [x] 更新 `modules/item/logic/index.ts` 导出
- [x] 验证：`pnpm test` + `pnpm ts-check` 通过

### 4.2 物品数据扩展
- [x] 在 `modules/item/data/index.ts` 中新增 `getFilteredTemplates(filter: ItemFilter): ItemTemplate[]`
- [x] 该函数调用 reward-pool 的 `applyFilter`
- [x] 验证：类型通过

### 4.3 敌人类型改造
- [x] `modules/combat/logic/enemy/types.ts`：
  - `Enemy` 接口：删除 `drops?: Array<{...}>` 字段
  - 新增 `rewardPoolId?: string` 字段
- [x] `modules/combat/logic/enemy/generator.ts`：
  - 敌人生成时设置 `rewardPoolId` 根据 tier（normal→combat_normal, elite→combat_elite, ...）
- [x] 更新敌人模板数据中的 `drops` 引用
- [x] 验证：`pnpm ts-check` 通过，无 broken import

### 4.4 战斗结算改造
- [x] `modules/combat/logic/battle/battleController.ts`：
  - `calculateRewards()` 删除掉落处理部分（drops 遍历）
  - 新增调用 `rollPool(enemy.rewardPoolId, ctx)` 生成掉落
  - 保留 exp/gold 计算
  - `BattleReward` 接口改为使用 `RollResult`
- [x] 更新 `settleBattle()` 适配新返回类型
- [x] 验证：`pnpm ts-check` 通过

### 4.5 机缘奖励改造
- [x] 删除 `modules/fortune/logic/rewardCalculator.ts` 中 `generateFragmentsForNode()` 及其 switch 硬编码
- [x] 删除 `calculateNodeReward()` 中的碎片生成部分
- [x] 新增调用 `rollPool()` 替代碎片硬编码（节点类型 → poolId 映射）
- [x] 更新 `FortuneTypeConfigEntry.rewardBonuses` 或新增 `rewardPoolMapping` 字段
- [x] 验证：`pnpm test` + `pnpm ts-check` 通过

### 4.6 地牢事件改造
- [x] `modules/exploration/logic/dungeon/eventSystem.ts`：
  - `applyEffect()` 中 `case 'gain_item'` 改用 `rollPool('dungeon_' + eventId, ctx)`
  - 删除 `import { generateRandomDrop } from '@/modules/item/logic'`
- [x] 更新 `EventEffect` 中 `value` 的使用
- [x] 验证：`pnpm ts-check` 通过

### 4.7 爬塔奖励改造
- [x] `modules/tower/logic/towerSystem.ts`：
  - 碎片/材料硬编码替换为 `rollPool('tower_floor_' + floor, ctx)`
  - 保留 `DropPool` 收集器概念（待领取池 ≠ 奖励池）
- [x] 验证：`pnpm ts-check` 通过

### 4.8 残余引用清理
- [x] 全局搜索 `generateRandomDrop` 确认无残留引用
- [x] 全局搜索 `rollRarity` 确认已全部迁移到 `rarityRoller.rollRarity`
- [x] 全局搜索 `enemy.drops` 确认已全部替换为 `enemy.rewardPoolId`
- [x] 清理不再使用的 import

---

## Stage 5: 消息模块集成

### 5.1 奖励事件定义
- [x] 实现 `modules/reward-pool/events.ts`：
  - 定义 `reward:generated` 事件类型
  - 在 `poolEngine.rollPool()` 末尾发射事件
  - 注册 MessageManager 模板：`'reward:*'` → 格式化消息
- [x] 验证：事件正确发射和消费

### 5.2 消息通道扩展
- [x] `core/message-log/channelRegistry.ts`：新增 `'reward'` 通道
- [x] `core/message-log/`：注册 reward 通道的消息模板
- [x] 验证：`pnpm ts-check` 通过

### 5.3 MessageRecord.rewards 迁移
- [x] `core/types/types.ts`：`MessageRecord.rewards.items` 从 `InventoryItem[]` 改为 `ItemInstance[]`
- [x] 同步更新所有消费 `MessageRecord.rewards.items` 的 UI 组件
- [x] 确保 `RollResult.items` 与 `MessageRecord.rewards.items` 类型一致
- [x] 验证：`pnpm ts-check` + `pnpm build` 通过

---

## Stage 6: 机缘专项类型

### 6.1 专项机缘配置
- [x] `modules/fortune/data/fortuneTypeConfig.ts`：
  - 新增 5 个 `FortuneTypeConfigEntry`：`weapon_armory`, `skill_sanctum`, `treasury`, `scriptorium`, `forge`
  - 每个包含 terrainDistribution、nodeTypeWeights、rewardBonuses、minPlayerLevel、difficultyStars
- [x] 更新 `FortuneTypeId` 类型联合（`modules/fortune/types.ts`）
- [x] 验证：`pnpm ts-check` 通过

### 6.2 机缘 Hub UI 更新
- [x] `modules/fortune/components/`：机缘选择界面新增 5 个专项入口
- [x] 专项机缘显示定向产出提示（"本机缘只产出武器"）
- [x] 验证：`pnpm build` 通过，UI 正常

---

## Stage 7: Hook + 收尾

### 7.1 useRewardDisplay Hook
- [x] 实现 `hooks/useRewardDisplay.ts`：
  - 接收 `RollResult`，返回 UI 就绪的展示数据
  - 处理物品分组、稀有度排序、货币汇总
- [x] 验证：文件 ≤ 200 行

### 7.2 README 同步
- [x] 更新 `src/modules/README.md`：添加 `reward-pool/` 条目
- [x] 验证：条目描述准确

### 7.3 全量验证
- [x] `pnpm lint:strict` — ESLint + 文件大小检查
- [x] `pnpm ts-check` — TypeScript 类型检查
- [x] `pnpm test` — 全部测试通过
- [x] `pnpm build` — 构建成功
- [x] 手动验证：无 `generateRandomDrop`、`rollRarity`、`enemy.drops` 残留引用
