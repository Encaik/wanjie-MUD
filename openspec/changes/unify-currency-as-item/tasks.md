## Stage 1: 奖励池类型清理

### 1.1 删除 CurrencyEntry 和 RollResultCurrency 类型
- [x] 在 `reward-pool/types.ts` 中删除 `CurrencyEntry` 接口（约 11 行）
- [x] 删除 `RollResultCurrency` 接口（约 6 行）
- [x] `RollResult` 删除 `currencies: RollResultCurrency[]` 字段
- [x] `PoolEntry` 联合类型删除 `| CurrencyEntry`
- [x] `ResolvedEntry.entry` 类型删除 `| CurrencyEntry`
- [x] 验证：`pnpm ts-check` 通过（此时会有引用错误，在后续阶段修复）

### 1.2 更新 events.ts 事件类型
- [x] `RewardGeneratedPayload.result` 类型更新（`RollResult` 改为无 `currencies` 字段）
- [x] 验证：无类型错误

---

## Stage 2: 奖励池引擎改造

### 2.1 processStaticEntry 新增货币世界观解析
- [x] 在 `processStaticEntry` 函数开头新增货币解析逻辑：检测 `getTemplate(templateId).category === 'currency'` → 调用 `getWorldviewCurrencyItemId(ctx.worldView)` 替换 templateId
- [x] 使用 try-catch 包裹 `getTemplate` 调用（模板可能不存在）
- [x] 验证：新增代码 ≤ 10 行

### 2.2 删除 processCurrencyEntry
- [x] 删除 `processCurrencyEntry` 函数（约 30 行）
- [x] 删除 `resolveCurrencyTemplateId` 内部函数（约 6 行）
- [x] 删除 `processEntry` 中 `case 'currency'` 分支
- [x] 删除 `rollPool` 中 `currencies` 数组和相关筛选逻辑（约 5 行）
- [x] 删除 `index.ts` 和 `useRewardDisplay.ts` 中的 `CurrencyEntry`/`RollResultCurrency` 引用
- [x] 验证：`pnpm ts-check` 通过

### 2.3 formatSummary 移除货币分支
- [x] `formatSummary` 删除第二个参数 `currencies`
- [x] 删除函数体中「货币」相关格式化代码（约 10 行）
- [x] 更新 `rollPool` 中 `formatSummary` 调用（去掉 `currencies` 参数）
- [x] 验证：`pnpm ts-check` 通过

### 2.4 更新 logic/index.ts 导出
- [x] 确认 `getWorldviewCurrencyItemId` 仍在导出列表中（layout.tsx 需要引用）
- [x] 验证：`pnpm ts-check` 通过

---

## Stage 3: 奖励池数据文件迁移

### 3.1 所有 CurrencyEntry → StaticEntry
将所有池子数据文件中的 `{ type: 'currency', currencyType: '灵石', amount: [min, max], weight: N }` 改为 `{ type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [min, max], weight: N }`：

- [x] `data/pools/common.ts` — 3 处
- [x] `data/pools/combat.ts` — 4 处
- [x] `data/pools/dungeon.ts` — 4 处
- [x] `data/pools/tower.ts` — 2 处
- [x] `data/pools/quest.ts` — 3 处
- [x] `data/pools/fortune.ts` — ~18 处
- [x] 验证：`pnpm ts-check` 通过（PoolEntry 类型已变，旧 `type: 'currency'` 会报错）

### 3.2 移除 CurrencyEntry 相关 import
- [x] 各数据文件中如 import 了 `CurrencyEntry` 类型，同步删除
- [x] 验证：`pnpm ts-check` — 0 错误

---

## Stage 4: 任务奖励分发器清理

### 4.1 删除 spiritStones 字段
- [x] `RewardResult` 接口删除 `spiritStones: number`（含 `@deprecated` 注释）
- [x] `createEmptyRewardResult()` 删除 `spiritStones: 0` 初始化
- [x] `mergeRewards()` 删除 `reward.spiritStones` 累加逻辑
- [x] `buildRewardMessage()` 删除 `result.spiritStones > 0` 专门分支（货币已在 items 中，消息构建时一并处理）
- [x] `calculateQuestRewards()` 删除 `result.spiritStones = poolResult.currencies.filter(...)` 逻辑
- [x] 验证：`pnpm ts-check` 通过

### 4.2 删除 resolveCurrencyToItems 桥接函数
- [x] 删除 `resolveCurrencyToItems()` 函数（约 15 行）
- [x] 删除函数上方的 JSDoc 注释
- [x] 验证：`pnpm ts-check` 通过

### 4.3 清理 import
- [x] 删除不再需要的 import（`getWorldviewCurrencyItemId` 如仅被 `resolveCurrencyToItems` 使用则删除）
- [x] 确认 `getCurrencyDisplayName` 仍保留（buildRewardMessage 内部使用）
- [x] 验证：`pnpm ts-check` 通过

---

## Stage 5: useQuest Hook 和 quest/index.ts 清理

### 5.1 useQuest 移除 resolveCurrencyToItems 调用
- [x] `claimQuestReward` 中删除 `resolveCurrencyToItems()` 调用
- [x] `allRewardItems` 直接使用 `result.items`
- [x] 更新注释（移除"货币已由 resolveCurrencyToItems 转为..."）
- [x] 删除 `resolveCurrencyToItems` 的 import
- [x] 验证：`pnpm ts-check` 通过

### 5.2 useQuest 移除 spiritStones 引用
- [x] `claimQuestReward` 中 `hasRewards` 判断删除 `result.spiritStones > 0`
- [x] 验证：`pnpm ts-check` 通过

### 5.3 quest/index.ts 清理导出
- [x] 确认未导出删除的函数（`resolveCurrencyToItems`、`calculateQuestRewards`、`calculateStaticQuestRewards` 本就不在 index.ts 中）
- [x] 验证：`RewardResult` 类型导出仍有效（无 spiritStones 字段需文档更新）

---

## Stage 6: 顶栏世界观感知改造

### 6.1 layout.tsx 删除 getResourceName 硬编码
- [x] 删除 `getResourceName()` 函数（约 1 行但包含完整映射表）
- [x] 新增 `getWorldviewCurrencyItemId` import（从 `@/modules/reward-pool/logic/poolEngine`）
- [x] 新增 `getTemplate` import（从 `@/modules/item/data`）
- [x] `currencyId` 改用 `getWorldviewCurrencyItemId(protagonist.world.worldviewId)` 计算
- [x] `spiritStones` 改用 `getCurrencyAmount(protagonist.items, currencyId)` 计算
- [x] `currencyName` 改用 `getTemplate(currencyId).name`（try-catch 兜底 '灵石'）
- [x] 验证：`pnpm ts-check` 通过

### 6.2 GameHeader.tsx 确认兼容
- [x] Props 接口保持不变（`spiritStones`、`currencyName`）
- [x] 确认 layout.tsx 传入的值已经是世界观感知的
- [x] 验证：组件渲染逻辑无需改动

---

## Stage 7: 构建验证

### 7.1 TypeScript 编译
- [x] `pnpm ts-check` — 0 错误
- [x] 确认无新增 ESLint 警告

### 7.2 生产构建
- [x] `pnpm build` — 构建成功
- [x] 确认 `/game` 路由页面正常生成

### 7.3 测试运行
- [x] `pnpm test` — 348/349 通过（1 个预先存在的 offlineProcessor 失败，与本次变更无关）
- [x] reward-pool 和 quest 相关测试全部通过

### 7.4 手动验证清单
- [ ] 任务领奖：修仙世界任务 → 获得 `wanjie-core:cultivation:spirit_stone`（非通用灵石）
- [ ] 任务领奖：武侠世界任务 → 获得 `wanjie-core:martial:silver_tael`（银两）
- [ ] 顶栏显示：修仙世界 → 显示"灵石"及其数量
- [ ] 顶栏显示：武侠世界 → 显示"银两"及其数量
- [ ] 任务消息：奖励消息中货币名称与实际发放的货币模板名一致
- [ ] 战斗奖励池：战斗掉落货币正常（非任务途径也走同一管线）

---

## Stage 8: 文档同步

### 8.1 更新 modules/README.md
- [x] 更新 `reward-pool/` 条目描述（条目类型从 4 种改为 3 种）
- [x] 更新 `quest/` 条目描述（奖励发放不再是特殊处理）

### 8.2 更新相关 Spec
- [x] `openspec/specs/reward-pool/spec.md` 同步更新（CurrencyEntry→StaticEntry、RollResult 删除 currencies）
- [x] `openspec/specs/quest-reward-pool/spec.md` 同步更新（spiritStones→items）

---

**预计影响：**
- 新增代码：~10 行（processStaticEntry 货币解析）
- 删除代码：~100 行（CurrencyEntry、processCurrencyEntry、resolveCurrencyTemplateId、RollResultCurrency、resolveCurrencyToItems、spiritStones 字段、formatSummary 货币分支、getResourceName）
- 修改文件：~12 个
- 数据迁移：~35 处 `CurrencyEntry` → `StaticEntry`
- 无新增文件
- TypeScript 编译 0 错误，生产构建成功
