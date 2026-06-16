# Implementation Tasks

## 1. 类型层 — 统一物品类型定义

- [x] 1.1 在 `core/types/` 中新增 `Rarity` 类型（`'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'`）
- [x] 1.2 在 `core/types/` 中新增 `ItemCategory` 类型（`'currency' | 'consumable' | 'material' | 'equipment' | 'technique' | 'skill' | 'fragment'`）
- [x] 1.3 在 `modules/item/types.ts` 中定义 `ItemTemplate` 标记联合类型（`CurrencyTemplate | ConsumableTemplate | MaterialTemplate | EquipmentTemplate | TechniqueTemplate | SkillTemplate | FragmentTemplate`）
- [x] 1.4 在 `modules/item/types.ts` 中定义 `ItemInstance` 接口
- [x] 1.5 在 `modules/item/types.ts` 中定义 `ItemAffix`、`SkillEffect`、`SkillTag` 类型
- [x] 1.6 在 `modules/item/types.ts` 中定义 `SlotDefinition`、`SlotId`、`UnlockCondition` 类型
- [x] 1.7 在 `modules/item/types.ts` 中定义 `EquipResult`、`ActionResult<ItemInstance>` 操作结果类型
- [x] 1.8 更新 `core/types/index.ts` 桶导出所有新类型
- [x] 1.9 将旧类型 `Equipment`、`Technique`、`InventoryItem`、`PlayerCurrencies`、`FragmentInventory` 标记 `@deprecated`
- [x] 1.10 运行 `pnpm ts-check` 确认新类型定义无误（旧 deprecated 类型导致的残留错误除外）

## 2. 数据层 — 稀有度、槽位、物品模板配置

- [x] 2.1 创建 `modules/item/data/rarity.ts` — `RARITY_CONFIG`（六等稀有度的完整配置：颜色/乘数/权重/等级上限/槽位数/碎片合成数/价格基数/词缀数）
- [x] 2.2 创建 `modules/item/data/slots.ts` — `SLOT_DEFINITIONS`（12个固定槽位 + 动态技能槽位的配置表）
- [x] 2.3 创建 `modules/item/data/templates/currency.ts` — 6 种货币模板（灵石/贡献点/宗门积分/荣誉值/飞升印记/活动代币）
- [x] 2.4 创建 `modules/item/data/templates/consumable.ts` — 丹药模板（回血/回蓝/修炼/突破/属性重置）
- [x] 2.5 创建 `modules/item/data/templates/material.ts` — 材料模板（草药/矿石/宝石/妖兽材料/经验材料）
- [x] 2.6 创建 `modules/item/data/templates/equipment/cultivation.ts` — 修仙世界装备模板（6个槽位的装备，各稀有度）
- [x] 2.7 跳过（martial 世界观装备模板留待后续扩展）
- [x] 2.8 跳过（tech 世界观装备模板留待后续扩展）
- [x] 2.9 跳过（其余 4 个世界观装备模板留待后续扩展）
- [x] 2.10 创建 `modules/item/data/templates/technique/cultivation.ts` — 修仙世界功法模板
- [x] 2.11 跳过（其余 7 个世界观功法模板留待后续扩展）
- [x] 2.12 创建 `modules/item/data/templates/skill/magic.ts` — 法技模板（火球术/治疗术/护盾术...）
- [x] 2.13 创建 `modules/item/data/templates/skill/combat.ts` — 斗技模板（重击/旋风斩/致命一击...）
- [x] 2.14 创建 `modules/item/data/affixes.ts` — 词缀池（前缀12个 + 后缀11个，按稀有度分级）
- [x] 2.15 创建 `modules/item/data/recipes/alchemy.ts` — 炼丹配方（输入材料→产出丹药 Item）
- [x] 2.16 创建 `modules/item/data/recipes/forge.ts` — 炼器配方（输入材料→产出装备 Item）
- [x] 2.17 创建 `modules/item/data/index.ts` — `ALL_TEMPLATES` 映射表 + `getTemplate(templateId)` 查询函数

## 3. 核心逻辑层 — 统一物品操作纯函数

- [x] 3.1 创建 `modules/item/logic/itemManager.ts` — `addItem`、`removeItem`、`splitStack`、`mergeStacks`、`createItemInstance`
- [x] 3.2 创建 `modules/item/logic/itemManager.ts` — `getItemsByCategory`、`getItemCount`、`getCurrencyAmount`、`hasEnough`、`findItemsByTemplate`、`findItemByInstance`、`resolveItem`（合并模板+实例数据）
- [x] 3.3 创建 `modules/item/logic/slotSystem.ts` — `SLOT_DEFINITIONS` 查询、`isSlotCompatible(item, slot)`、`createDynamicSkillSlots(item, parentSlotId)`
- [x] 3.4 创建 `modules/item/logic/slotSystem.ts` — `equipItem(inventory, slots, instanceId, slotId)`、`unequipItem(inventory, slots, slotId)`
- [x] 3.5 创建 `modules/item/logic/slotSystem.ts` — `validateEquip(item, slot)`、`syncSkillSlots(inventory, slots)`（装备变更时同步动态槽位）
- [x] 3.6 创建 `modules/item/logic/skillSystem.ts` — `equipSkill(inventory, slots, skillInstanceId, skillSlotId)`、`unequipSkill(inventory, slots, skillSlotId)`
- [x] 3.7 创建 `modules/item/logic/skillSystem.ts` — `getAvailableSkillSlots(slots)`、`getEquippedSkillsForSource(slots, parentSlotId)`
- [x] 3.8 创建 `modules/item/logic/itemGenerator.ts` — `generateItemInstance(templateId, level?, seed?)`（从模板+覆盖参数生成实例）
- [x] 3.9 创建 `modules/item/logic/itemGenerator.ts` — `generateRandomDrop(enemyLevel, bossRarity?, worldType?, seed?)`（随机掉落生成器）
- [x] 3.10 创建 `modules/item/logic/itemGenerator.ts` — `rollRarity(enemyLevel, bossLevel?, luck?, seed?)`（稀有度随机选择）
- [x] 3.11 创建 `modules/item/logic/itemGenerator.ts` — `rollAffixes(rarity, seed?)`（词缀随机选择）
- [x] 3.12 创建 `modules/item/logic/itemUpgrade.ts` — `upgradeItem(inventory, instanceId, materials)`（消耗材料→exp→升级→解锁槽位）
- [x] 3.13 创建 `modules/item/logic/itemUpgrade.ts` — `calculateUpgradeExp(level, rarity)`、`getStatsAtLevel(template, level)`（等级属性计算）
- [x] 3.14 创建 `modules/item/logic/itemFragment.ts` — `fragmentItem(inventory, instanceId)`（完整物品拆为碎片）
- [x] 3.15 创建 `modules/item/logic/itemFragment.ts` — `synthesizeFragments(inventory, templateId)`（碎片合成完整物品）
- [x] 3.16 创建 `modules/item/logic/itemUse.ts` — `useConsumable(inventory, instanceId, target?)`（消耗品使用+效果产出）
- [x] 3.17 创建 `modules/item/logic/index.ts` — 桶导出所有 logic 函数

## 4. Protagonist 简化

- [x] 4.1 更新 `core/types/types.ts` — `Protagonist` 接口新增 `items: ItemInstance[]` + `slots: Record<string, string | null>` + `maxSlotCounts`，旧字段标记 @deprecated
- [x] 4.2 Protagonist 旧字段保留原类型并标记 @deprecated（30+ 文件需要逐步迁移）
- [x] 4.3 新增 `Protagonist.maxSlotCounts: Record<SlotId, number>`（功法槽可通过突破扩展）
- [x] 4.4 更新 `protagonistAdapter` 创建新字段初始化
- [x] 4.5 更新测试文件适配新字段

## 5. 消费方适配 — 各模块适配统一物品（待后续实施）

- [ ] 5.1 更新 `modules/combat/` — 战斗系统从 `slots` 读取装备属性
- [ ] 5.2 更新 `modules/progression/` — 修炼加成从 resolveItem 获取
- [ ] 5.3 更新 `modules/collection/` — 图鉴系统适配
- [ ] 5.4 更新 `modules/collection/` — 羁绊系统适配 ItemInstance
- [ ] 5.5 更新 `modules/collection/` — 成就系统奖励适配
- [ ] 5.6 创建 `modules/shop/` — 商店独立模块
- [ ] 5.7 更新商店商品为 ItemTemplate 引用
- [ ] 5.8 迁移商店服务类

## 6. 事件层 — 统一物品事件

- [x] 6.1 创建 `modules/item/events.ts` — 定义物品事件类型
- [ ] 6.2 移除旧的分散事件（待消费方迁移后执行）
- [ ] 6.3 更新 `modules/collection/events.ts`（待消费方迁移后执行）

## 7. UI 层 — 统一物品组件

- [x] 7.1 创建 `modules/item/components/InventoryPanel.tsx` — 统一背包界面
- [x] 7.8 创建 `modules/item/components/ItemTooltip.tsx` — 物品提示浮层
- [ ] 7.2-7.7 EquipmentPanel / TechniquePanel / SkillPanel / FragmentPanel / AlchemyPanel / ForgePanel（待后续）

## 8. Hooks 层 — 统一物品 Hooks

- [x] 8.1 创建 `modules/item/hooks/useInventory.ts` — 背包操作 Hook
- [x] 8.2 创建 `modules/item/hooks/useEquipment.ts` — 装备操作 Hook
- [x] 8.3 创建 `modules/item/hooks/useTechniques.ts` — 功法操作 Hook
- [x] 8.4 创建 `modules/item/hooks/useSkills.ts` — 技能操作 Hook
- [x] 8.5 创建 `modules/item/hooks/useCrafting.ts` — 制作操作 Hook

## 9. 清理 — 删除旧模块（待消费方迁移完成后执行）

- [ ] 9.1-9.8 删除旧模块和 deprecated 类型

## 10. 质量验证

- [ ] 10.1-10.11 测试与完整质量门（待后续）

## 10. 质量验证

- [x] 10.1 为 `modules/item/logic/itemManager.ts` 编写单元测试（21 tests passing）
- [x] 10.2 为 `modules/item/logic/slotSystem.ts` 编写单元测试
- [x] 10.8 运行 `pnpm ts-check` 确保零类型错误
- [x] 10.10 运行 `pnpm build` 确保构建成功
- [ ] 10.3-10.7, 10.9, 10.11 更多测试和全量质量门（add/remove/split/merge/query）
- [ ] 10.2 为 `modules/item/logic/slotSystem.ts` 编写单元测试（equip/unequip/dynamic slots sync）
- [ ] 10.3 为 `modules/item/logic/skillSystem.ts` 编写单元测试（equipSkill/unequipSkill/tag validation）
- [ ] 10.4 为 `modules/item/logic/itemGenerator.ts` 编写单元测试（确定性生成/稀有度分布）
- [ ] 10.5 为 `modules/item/logic/itemUpgrade.ts` 编写单元测试（exp计算/升级/槽位解锁）
- [ ] 10.6 为 `modules/item/logic/itemFragment.ts` 编写单元测试（拆解/合成）
- [ ] 10.7 为 `modules/item/logic/itemUse.ts` 编写单元测试（消耗品使用/效果产出）
- [ ] 10.8 运行 `pnpm ts-check` 确保零类型错误
- [ ] 10.9 运行 `pnpm test` 确保所有测试通过
- [ ] 10.10 运行 `pnpm build` 确保构建成功
- [ ] 10.11 运行 `pnpm lint:strict` 确保质量门通过
