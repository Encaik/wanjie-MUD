# 任务：统一物品系统迁移

## Phase 1: 断开战斗系统旧依赖

### T1.1 删除 combat 内部旧技能系统
- [x] 删除 `src/modules/combat/logic/skill/` 目录（skillTypes.ts, skillGenerator.ts, skillEquipSystem.ts, index.ts）
- [x] 删除 `src/modules/combat/logic/enemy/techniqueEquipment.ts`
- [x] 删除 `src/modules/combat/logic/enemy/enemyTechniqueEquipment.ts`
- **验证**: `pnpm ts-check` 无新增错误（combat 相关允许后续处理）

### T1.2 断开 combat/logic 旧类型引用
- [x] `battle/skillSystem.ts`: 移除旧 import，导出 stub 函数，标记 TODO 待战斗重构
- [x] `battle/decisionSystem.ts`: 移除旧类型引用，技能选择逻辑暂时禁用
- [x] `battle/battleController.ts`: 移除旧类型引用
- [x] `battle/enemyState.ts`: 移除旧类型引用
- [x] `combatPower.ts`: 改为调用 `quickCalculatePlayerPowerUnified()`
- [x] `statsCalc.ts`: 移除旧类型 import
- **验证**: 战斗相关文件无旧类型 import

### T1.3 断开 combat/components 旧类型引用
- [x] `BattlePanel.tsx`: 移除旧 `Technique`/`Equipment` props，用 `ResolvedItem` 替代
- [x] `BattleResultDialog.tsx`: 同上
- [x] `CombatantPanel.tsx`: 同上
- [x] `DecisionPanel.tsx`: 同上
- [x] `src/views/game/layout/CenterPanel.tsx`: 移除 `playerTechniques`/`playerWeapons` props
- **验证**: 战斗组件无旧类型 props

---

## Phase 2: 删除旧模块

### T2.1 删除旧模块目录
- [x] 删除 `src/modules/equipment/`（15文件）
- [x] 删除 `src/modules/techniques/`（12文件）
- [x] 删除 `src/modules/economy/`（20+文件）
- [x] 删除 `src/modules/crafting/`（4+文件）
- **验证**: `find src/modules/{equipment,techniques,economy,crafting} -type f` 返回空

### T2.2 清理旧模块引用（全局搜索替换）
- [x] 搜索 `from.*modules/(equipment|techniques|economy|crafting)` 的 import，逐个移除或用新路径替换
- [x] 移除 `src/shared/components/DeveloperPanel.tsx` 中旧模块引用
- [x] 移除 `src/core/engine/gameSystems.ts` 中旧模块引用
- [x] 移除 `src/core/engine/expansionLogic.ts` 中旧模块引用
- [x] 移除 `src/shared/utils/typeGuards.ts` 中旧模块引用
- [x] 移除 `src/modules/collection/`、`src/modules/faction/`、`src/modules/tower/` 等中的旧物品引用
- **验证**: `grep -r "modules/(equipment|techniques|economy|crafting)" src/` 返回空

---

## Phase 3: 清理核心类型

### T3.1 清理 Protagonist 类型
- [x] 删除 `core/types/types.ts` 中 Protagonist 的废弃字段（inventory, equipments, equippedMelee/Ranged/Head/Body/Legs/Feet, techniques, equippedAttackTechniques, equippedDefenseTechniques, fragmentInventory）
- [x] 删除 `core/types/types.ts` 中旧模块的 import（FragmentDropData 等）
- [x] 删除 `core/types/types.ts` 中不再需要直接引用的旧类型定义
- **验证**: `grep "deprecated\|@deprecated" src/core/types/types.ts` 无相关条目

### T3.2 清理 typesExtension.ts
- [x] `core/types/typesExtension.ts`: 删除旧字段迁移/转换逻辑
- [x] 删除 `ProtagonistExtension` 中与旧物品系统相关的字段
- [x] 删除旧的 `Equipment`、`Technique`、`InventoryItem`、`ItemDefinition` 等类型导出
- **验证**: `grep "Equipment\|Technique\|InventoryItem\|ItemDefinition\|FragmentDrop" src/core/types/` 返回空或仅为新系统保留

### T3.3 清理计算引擎旧路径
- [x] `core/calculation/helpers/contextHelper.ts`: 删除旧 `buildContextFromProtagonist`（如直接读旧字段），只保留 `buildContextFromUnifiedProtagonist`
- [x] 检查 contextHelper 中无对旧 protagonist 字段的直接访问
- **验证**: 计算上下文的构建只通过 `items[]` + `slots{}`

---

## Phase 4: 更新 item 模块

### T4.1 简化槽位系统
- [x] `modules/item/data/slots.ts`: 更新 `SLOT_DEFINITIONS` 为扁平固定槽位（见 design.md 2.1）
- [x] `modules/item/types.ts`: 移除 `SlotDefinition` 的 `parentSlotId`、`isDynamic`、`acceptedSkillTag` 等与父子槽位相关的字段
- [x] `modules/item/logic/slotSystem.ts`: 简化 `equipItem`/`unequipItem`，移除子槽创建/销毁逻辑
- [x] `modules/item/logic/skillSystem.ts`: 简化 `equipSkill`/`unequipSkill`，技能直接装备到独立 skill 槽
- **验证**: 装备/功法/技能操作互不依赖

### T4.2 更新 item 导出
- [x] `modules/item/index.ts`: 调整导出，确保所有公共 API 正确
- [x] 移除对旧 `acceptedSkillTag`、`parentSlotId` 等字段的导出（如已从类型中删除）
- **验证**: `pnpm ts-check` — `modules/item/` 无类型错误

### T4.3 更新 item 测试
- [x] `modules/item/logic/__tests__/slotSystem.test.ts`: 更新测试用例匹配新槽位定义
- [x] 删除与子槽创建/销毁相关的测试
- **验证**: `pnpm test` — item 模块测试通过

---

## Phase 5: 重写页面

### T5.1 删除旧页面
- [x] 删除 `src/views/game/pages/EquipmentPage.tsx`
- [x] 删除 `src/views/game/pages/TechniquePage.tsx`
- [x] 删除 `src/views/game/pages/SkillPage.tsx`
- [x] 删除 `src/views/game/pages/FragmentPage.tsx`
- [x] 删除 `src/views/game/pages/AlchemyPage.tsx`
- [x] 删除 `src/views/game/pages/ForgePage.tsx`
- [x] 删除旧路由目录: `src/app/game/equipment/`, `src/app/game/technique/`, `src/app/game/skill/`, `src/app/game/fragment/`, `src/app/game/alchemy/`, `src/app/game/forge/`
- **验证**: 旧路由和页面文件均不存在

### T5.2 增强 BackpackPage
- [x] `src/views/game/pages/BackpackPage.tsx`: 添加分类筛选 Tab（全部/装备/功法/技能/消耗品/材料/碎片）
- [x] 新增 `src/modules/item/components/FragmentSynthesizePanel.tsx`: 碎片合成面板（在背包碎片 Tab 中使用）
- [x] 碎片合成面板复用 `modules/item/logic/itemFragment.ts` 的 `synthesizeFragments`
- **验证**: 背包页面可按分类筛选、碎片合成可用

### T5.3 新建 EquipManagePage
- [x] 创建 `src/views/game/pages/EquipManagePage.tsx`
  - 左侧槽位面板（装备槽×6 + 功法槽×3 + 技能槽×6）
  - 右侧物品列表（Tab: 装备/功法/技能）
  - 点击槽位→右侧切换到对应分类
  - 装备/卸载交互
- [x] 创建 `src/app/game/equip-manage/page.tsx` 路由
- **验证**: 装备管理页面可装备/卸载三种品类物品

### T5.4 新建 CraftPage
- [x] 创建 `src/views/game/pages/CraftPage.tsx`
  - Tab 炼丹: 配方列表 + 材料需求 + 炼制按钮
  - Tab 炼器: 配方列表 + 材料需求 + 锻造按钮
  - 炼制逻辑调用 `modules/item/logic/` 的 `generateItemInstance`
- [x] 创建 `src/app/game/craft/page.tsx` 路由
- **验证**: 炼丹和炼器功能可用

### T5.5 重写 ShopPage
- [x] `src/views/game/pages/ShopPage.tsx`: 改用 `modules/shop/` 组件，从 `p.items` 获取货币
- [x] 删除对旧 `p.inventory` 的引用
- **验证**: 商店页面可正常购买物品

### T5.6 更新页面桶文件和导航
- [x] `src/views/game/pages/index.ts`: 更新导出（删除旧页面，新增 EquipManagePage、CraftPage）
- [x] `src/views/game/navigation/panelRegistry.tsx`: 更新面板注册表
  - 删除: equipment, technique, skill, fragment, alchemy, forge
  - 新增: equip-manage（武备组）, craft（炼造组）
  - 主要面板从 10 减少到 5
- **验证**: 导航菜单正确显示新面板

---

## Phase 6: 重写 domainHooks

### T6.1 重写 useEquipment
- [x] `src/views/game/domainHooks/useEquipment.ts`: 删除所有旧兼容包装函数
  - 删除 `equipTechniqueOld` / `equipEquipmentOld` / `synthesizeFragmentOld` / `performUpgradeTechniqueOld`
  - 删除 `updateTechnique` / `updateEquipment`（空函数）
  - 简化接口，直接使用 `modules/item/` 的 pure logic
- **验证**: Hook 接口干净，无 `Old` 后缀、无旧类型转换

### T6.2 重写 useCrafting
- [x] `src/views/game/domainHooks/useCrafting.ts`: 使用新 item 系统
  - 删除 `createMinimalEquipment` 调用
  - 改为调用 `generateItemInstance(templateId)`
  - 结果写入 `protagonist.items`（通过新 `addItem`）
- **验证**: 炼制操作使用新物品系统

### T6.3 重写 useShop
- [x] `src/views/game/domainHooks/useShop.ts`: 使用新 item 系统
  - 删除 `createInventoryItem`、`addToInventory` 旧调用
  - 改为 `addItem(templateId, quantity)` + `getCurrencyAmount()` 扣款
- **验证**: 商店购买使用新物品系统

### T6.4 删除旧 useInventory
- [x] `src/views/game/domainHooks/useInventory.ts`: 删除（功能由 `modules/item/hooks/useInventory` 替代）
- [x] `src/views/game/domainHooks/index.ts`: 移除旧 useInventory 导出
- **验证**: 所有 useInventory 引用指向 `@/modules/item/hooks`

---

## Phase 7: 全局清理与验证

### T7.1 全局引用检查
- [x] `grep -r "from.*modules/equipment" src/` → 空
- [x] `grep -r "from.*modules/techniques" src/` → 空
- [x] `grep -r "from.*modules/economy" src/` → 空
- [x] `grep -r "from.*modules/crafting" src/` → 空
- [x] `grep -r "p\.equipments\|p\.equippedMelee\|p\.equippedRanged\|p\.equippedHead\|p\.equippedBody\|p\.equippedLegs\|p\.equippedFeet\|p\.techniques\|p\.equippedAttackTechniques\|p\.equippedDefenseTechniques\|p\.fragmentInventory\|p\.inventory\b" src/` → 空（或仅剩无害引用）

### T7.2 类型检查与构建
- [x] `pnpm ts-check` → 零错误
- [x] `pnpm lint:strict` → 通过
- [x] `pnpm build` → 构建成功

### T7.3 测试
- [x] `pnpm test` → 全部通过
- [x] 手动验证所有变更页面功能正常

### T7.4 文档同步
- [x] `src/modules/README.md`: 删除旧模块条目，更新 item/ 描述
- [x] `src/core/README.md`: 更新核心类型描述
- [x] `game-design/changelog.md`: 追加本变更记录

---

## 依赖顺序

```
Phase 1 (断开战斗) ──→ Phase 2 (删除旧模块) ──→ Phase 3 (清理核心类型)
                                                    │
Phase 4 (更新 item) ←───────────────────────────────┘
       │
       └──→ Phase 5 (重写页面) ──→ Phase 6 (重写 domainHooks) ──→ Phase 7 (全局清理)
```

Phase 1-2 必须在 Phase 5 之前完成（否则旧页面引用已删除的模块会导致构建失败）。
Phase 3-4 可以与 Phase 5-6 部分并行。
