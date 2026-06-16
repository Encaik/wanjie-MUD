# 设计：统一物品系统迁移

## 一、架构变更

### 1.1 删除的模块

```
modules/
├── equipment/     ❌ 删除 (15文件)
├── techniques/    ❌ 删除 (12文件)
├── economy/       ❌ 删除 (20+文件)
├── crafting/      ❌ 删除 (4+文件)
└── item/          ✅ 保留（统一物品系统的唯一位置）
```

### 1.2 Protagonist 类型精简

```typescript
// core/types/types.ts

export interface Protagonist {
  character: Character;
  world: World;
  // ... 保留字段 ...

  // ══ 统一物品系统（唯一物品数据源）══
  items: ItemInstance[];                    // 所有物品实例
  slots: Record<string, string | null>;     // 槽位 → instanceId 映射
  maxSlotCounts: Record<string, number>;    // 各槽位类型最大数量

  // ❌ 删除以下全部废弃字段：
  // inventory: InventoryItem[];
  // equipments: Equipment[];
  // equippedMelee/equippedRanged/equippedHead/equippedBody/equippedLegs/equippedFeet
  // techniques: Technique[];
  // equippedAttackTechniques/equippedDefenseTechniques
  // fragmentInventory
}
```

### 1.3 旧类型删除清单

从 `core/types/types.ts` 中移除以下导入：

- `FragmentDropData, FragmentDropResult` from `@/modules/crafting/logic/fragmentSystem`
- 不再需要的旧类型定义：`Equipment`、`Technique`、`InventoryItem`、`ItemDefinition`、`ItemRarity` 等（如果它们仅在旧模块中使用）

---

## 二、槽位系统设计

### 2.1 新槽位定义（固定扁平）

```typescript
// modules/item/data/slots.ts 中更新

const NEW_SLOT_DEFINITIONS: SlotDefinition[] = [
  // ── 装备槽（5个固定槽位）──
  { slotId: 'weapon_melee',  category: 'equipment', acceptedCategory: 'equipment',
    acceptedSubcategory: 'weapon_melee',  isDynamic: false, displayName: '近战武器' },
  { slotId: 'weapon_ranged', category: 'equipment', acceptedCategory: 'equipment',
    acceptedSubcategory: 'weapon_ranged', isDynamic: false, displayName: '远程武器' },
  { slotId: 'armor_head',    category: 'equipment', acceptedCategory: 'equipment',
    acceptedSubcategory: 'armor_head',    isDynamic: false, displayName: '头部' },
  { slotId: 'armor_body',    category: 'equipment', acceptedCategory: 'equipment',
    acceptedSubcategory: 'armor_body',    isDynamic: false, displayName: '身体' },
  { slotId: 'armor_legs',    category: 'equipment', acceptedCategory: 'equipment',
    acceptedSubcategory: 'armor_legs',    isDynamic: false, displayName: '腿部' },
  { slotId: 'armor_feet',    category: 'equipment', acceptedCategory: 'equipment',
    acceptedSubcategory: 'armor_feet',    isDynamic: false, displayName: '脚部' },

  // ── 功法槽（3个固定槽位）──
  { slotId: 'technique_1',  category: 'technique', acceptedCategory: 'technique',
    isDynamic: false, displayName: '功法一' },
  { slotId: 'technique_2',  category: 'technique', acceptedCategory: 'technique',
    isDynamic: false, displayName: '功法二' },
  { slotId: 'technique_3',  category: 'technique', acceptedCategory: 'technique',
    isDynamic: false, displayName: '功法三' },

  // ── 技能槽（6个固定槽位，完全独立）──
  { slotId: 'skill_1', category: 'skill', acceptedCategory: 'skill',
    isDynamic: false, displayName: '技能一' },
  { slotId: 'skill_2', category: 'skill', acceptedCategory: 'skill',
    isDynamic: false, displayName: '技能二' },
  { slotId: 'skill_3', category: 'skill', acceptedCategory: 'skill',
    isDynamic: false, displayName: '技能三' },
  { slotId: 'skill_4', category: 'skill', acceptedCategory: 'skill',
    isDynamic: false, displayName: '技能四' },
  { slotId: 'skill_5', category: 'skill', acceptedCategory: 'skill',
    isDynamic: false, displayName: '技能五' },
  { slotId: 'skill_6', category: 'skill', acceptedCategory: 'skill',
    isDynamic: false, displayName: '技能六' },
];
```

### 2.2 与旧槽位的差异

| 方面 | 旧系统 | 新系统 |
|------|--------|--------|
| 装备槽 | 6个（melee/ranged/head/body/legs/feet） | 6个（不变，slotId 前缀改为 weapon_/armor_） |
| 功法槽 | 6个（atk×3 + def×3） | 3个（不区分攻防） |
| 技能槽 | 动态，依附装备/功法 | 6个固定独立槽位 |
| 父子关系 | `parentSlotId` + `isDynamic` | 无父子关系 |
| 解锁条件 | 依赖等级/境界 | 暂不设置解锁条件（后续按需添加） |

### 2.3 物品职责映射

```
ItemCategory 'equipment'
  ├── 装备到 equipment 槽
  ├── 提供属性加成 → actualStats (attackBonus, defenseBonus, hp, mp, speed)
  └── 影响计算引擎 → EquipmentInput → core/calculation

ItemCategory 'technique'
  ├── 装备到 technique 槽
  ├── 提供修炼加成 → actualStats (cultivationSpeed, breakthroughBonus, mpRegen)
  └── 影响修炼计算 → progression/ logic 中读取 slots + items

ItemCategory 'skill'
  ├── 装备到 skill 槽
  ├── 提供战斗技能 → SkillTemplate.ext.effects (SkillEffect[])
  └── 战斗系统后续重构时消费
```

---

## 三、页面设计

### 3.1 导航变更

```
panelRegistry.tsx 面板变更：

删除：
  - equipment (装备)   ─┐
  - technique (功法)    ├─ 合并为 equip-manage
  - skill (技能)       ─┘
  - fragment (碎片)    ─── 移入背包页面
  - alchemy (炼丹)     ─┐
  - forge (炼器)       ─┘ 合并为 craft

新增：
  - equip-manage (装备管理) → route: '/game/equip-manage'
  - craft (炼制) → route: '/game/craft'

保持：
  - cultivation, adventure, quest, faction, shop, backpack (主标签不变)
  - tower, achievement, collection, statistics (次要面板不变)
```

### 3.2 BackpackPage（增强）

```
BackpackPage
├── Tab: 全部     — 所有物品网格（已有）
├── Tab: 装备     — category === 'equipment'
├── Tab: 功法     — category === 'technique'
├── Tab: 技能     — category === 'skill'
├── Tab: 消耗品   — category === 'consumable'
├── Tab: 材料     — category === 'material'
└── Tab: 碎片合成  — category === 'fragment' + synthesizeFragments UI

使用组件：InventoryPanel（已有）+ ItemGrid（已有）+ 新增 FragmentSynthesizePanel
```

### 3.3 EquipManagePage（新增）

```
EquipManagePage
├── 左侧：槽位面板
│   ├── 装备槽位组（武器/头盔/身体/腿/脚 — 5个槽位图标）
│   ├── 功法槽位组（3个槽位图标）
│   └── 技能槽位组（6个槽位图标）
│
└── 右侧：物品列表
    ├── Tab: 装备 | 功法 | 技能
    └── 可装备物品列表（背包中对应品类、未装备的物品）

交互：
  - 点击槽位 → 右侧切换到对应分类列表
  - 点击列表物品 → 装备到当前选中槽位
  - 点击已装备物品 → 卸下
  - 使用 ItemCard 渲染每个物品
```

### 3.4 CraftPage（新增，正式化炼制）

```
CraftPage
├── Tab: 炼丹
│   ├── 配方列表（从 item/ 消耗品模板中选择可炼制的丹药）
│   ├── 材料需求展示
│   └── 炼制按钮 → generateItemInstance(templateId)
│
└── Tab: 炼器
    ├── 配方列表（从 item/ 装备模板中选择可锻造的装备）
    ├── 材料需求展示
    └── 锻造按钮 → generateItemInstance(templateId)
```

### 3.5 ShopPage（重写）

```
ShopPage
├── 使用 modules/shop/ 的新组件和逻辑
├── 不再使用 p.inventory（旧），改用 p.items + getCurrencyAmount()
└── 购买逻辑 → addItem() + getCurrencyAmount() 扣款
```

---

## 四、数据流变更

### 4.1 物品获取流程

```
之前：
  掉落 → 旧 InventoryItem / Equipment / Technique 对象 → push 到对应数组

之后：
  掉落 → modules/item/logic generateItemInstance(templateId) → ItemInstance
       → addItem(items, templateId, quantity) → 更新 protagonist.items[]
```

### 4.2 装备/卸载流程

```
之前：
  protagonist.equippedMelee = equipment  （直接赋值）
  protagonist.equipments = [...equipments, equipment]  （push到数组）

之后：
  equipItem(items, slots, instanceId, slotId)
    → instance.equipped = true, instance.equippedInSlot = slotId
    → slots[slotId] = instanceId
    → 旧槽位自动卸载
```

### 4.3 计算引擎适配

`core/calculation/helpers/contextHelper.ts` 已有 `buildContextFromUnifiedProtagonist()`，
完全从 `protagonist.items[]` + `protagonist.slots{}` 构建计算上下文，无需改动。

旧路径 `buildContextFromProtagonist`（如果直接读取旧字段）需要删除或改为调用统一路径。

---

## 五、Combat 断开方案

### 5.1 需要处理的文件

```
modules/combat/logic/battle/skillSystem.ts    — import 旧 TechniqueSkill, WeaponTechnique
modules/combat/logic/battle/decisionSystem.ts — 使用旧技能类型
modules/combat/logic/battle/battleController.ts — 引用旧类型
modules/combat/logic/battle/enemyState.ts     — 引用旧类型
modules/combat/logic/battle/types.ts          — BattleSkill 可能引旧类型
modules/combat/logic/skill/skillGenerator.ts  — 旧技能生成器
modules/combat/logic/skill/skillEquipSystem.ts — 旧技能装备系统
modules/combat/logic/skill/skillTypes.ts      — 旧技能类型
modules/combat/logic/enemy/techniqueEquipment.ts — 旧敌人功法装备
modules/combat/logic/enemy/enemyTechniqueEquipment.ts — 旧敌人功法装备
modules/combat/logic/combatPower.ts           — import 旧 Technique, Equipment
modules/combat/logic/statsCalc.ts             — import 旧类型
modules/combat/components/BattlePanel.tsx     — 引用旧类型
modules/combat/components/BattleResultDialog.tsx — 引用旧类型
modules/combat/components/CombatantPanel.tsx  — 引用旧类型
```

### 5.2 断开策略

1. **skillSystem.ts / skillGenerator.ts / skillEquipSystem.ts / skillTypes.ts**（combat 内部的技能子目录）
   - 删除 `modules/combat/logic/skill/` 整个子目录
   - 战斗技能生成功能临时 stub

2. **battle/*.ts**（战斗引擎文件）
   - 移除对旧类型的 import
   - 用 `ResolvedItem`（从 `modules/item/`）替代旧类型参数
   - 技能相关函数改为 no-op 或抛出 "待重构" 错误

3. **enemy/*.ts**（敌人系统）
   - 移除 techniqueEquipment.ts 和 enemyTechniqueEquipment.ts
   - 敌人模板中的功法/装备生成使用新 `generateItemInstance`
   - 暂时用简化属性替代完整功法/装备系统

4. **components/*.tsx**（战斗UI组件）
   - 移除旧类型 props，用 ResolvedItem 替代
   - BattlePanel/ResultDialog 中技能展示暂时为空

5. **combatPower.ts / statsCalc.ts**
   - 改为调用 `quickCalculatePlayerPowerUnified()`（已有）
   - 移除旧计算路径

---

## 六、文件变更清单

### 6.1 删除

| 路径 | 说明 |
|------|------|
| `src/modules/equipment/` | 旧装备模块（15文件） |
| `src/modules/techniques/` | 旧功法/技能模块（12文件） |
| `src/modules/economy/` | 旧经济/商店模块（20+文件） |
| `src/modules/crafting/` | 旧炼制模块（4+文件） |
| `src/modules/combat/logic/skill/` | 旧战斗技能系统（3文件） |
| `src/modules/combat/logic/enemy/techniqueEquipment.ts` | 旧敌人功法装备 |
| `src/modules/combat/logic/enemy/enemyTechniqueEquipment.ts` | 旧敌人功法装备 |
| `src/app/game/equipment/` | 旧装备页面路由 |
| `src/app/game/technique/` | 旧功法页面路由 |
| `src/app/game/skill/` | 旧技能页面路由 |
| `src/app/game/fragment/` | 旧碎片页面路由 |
| `src/app/game/alchemy/` | 旧炼丹页面路由 |
| `src/app/game/forge/` | 旧炼器页面路由 |
| `src/views/game/pages/EquipmentPage.tsx` | 旧装备页面 |
| `src/views/game/pages/TechniquePage.tsx` | 旧功法页面 |
| `src/views/game/pages/SkillPage.tsx` | 旧技能页面 |
| `src/views/game/pages/FragmentPage.tsx` | 旧碎片页面 |
| `src/views/game/pages/AlchemyPage.tsx` | 旧炼丹页面 |
| `src/views/game/pages/ForgePage.tsx` | 旧炼器页面 |

### 6.2 新增

| 路径 | 说明 |
|------|------|
| `src/app/game/equip-manage/page.tsx` | 装备管理路由 |
| `src/app/game/craft/page.tsx` | 炼制路由 |
| `src/views/game/pages/EquipManagePage.tsx` | 装备管理页面组件 |
| `src/views/game/pages/CraftPage.tsx` | 炼制页面组件 |
| `src/modules/item/components/FragmentSynthesizePanel.tsx` | 碎片合成面板 |

### 6.3 修改

| 路径 | 变更内容 |
|------|----------|
| `src/core/types/types.ts` | 删除 Protagonist 废弃字段、旧类型 import |
| `src/core/types/typesExtension.ts` | 移除旧字段转换逻辑 |
| `src/views/game/navigation/panelRegistry.tsx` | 更新面板注册表（10→5次要面板） |
| `src/views/game/pages/BackpackPage.tsx` | 增加分类 Tab 和碎片合成入口 |
| `src/views/game/pages/ShopPage.tsx` | 改用新 shop 模块 + 新物品访问 |
| `src/views/game/pages/index.ts` | 更新导出 |
| `src/views/game/domainHooks/useEquipment.ts` | 删除旧兼容包装，纯新路径 |
| `src/views/game/domainHooks/useCrafting.ts` | 重写为使用新 item 系统 |
| `src/views/game/domainHooks/useShop.ts` | 重写为使用新 shop 模块 |
| `src/views/game/domainHooks/useInventory.ts` | 删除，功能由 modules/item/ 的 useInventory 替代 |
| `src/views/game/domainHooks/index.ts` | 更新导出 |
| `src/modules/item/data/slots.ts` | 更新槽位定义（扁平化） |
| `src/modules/item/types.ts` | 移除 SlotDefinition 的 parentSlotId/isDynamic，简化 SkillTag |
| `src/modules/item/logic/skillSystem.ts` | 简化技能装备逻辑，移除父槽依赖 |
| `src/modules/item/logic/slotSystem.ts` | 简化槽位逻辑，移除子槽创建/销毁 |
| `src/modules/item/index.ts` | 更新导出 |
| `src/modules/combat/logic/battle/skillSystem.ts` | 断开旧依赖，stub 或标记待重构 |
| `src/modules/combat/logic/battle/decisionSystem.ts` | 断开旧依赖 |
| `src/modules/combat/logic/battle/battleController.ts` | 断开旧依赖 |
| `src/modules/combat/logic/battle/enemyState.ts` | 断开旧依赖 |
| `src/modules/combat/logic/combatPower.ts` | 改用统一路径 |
| `src/modules/combat/logic/statsCalc.ts` | 断开旧依赖 |
| `src/modules/combat/components/BattlePanel.tsx` | 移除旧类型 props |
| `src/modules/combat/components/BattleResultDialog.tsx` | 移除旧类型 props |
| `src/modules/combat/components/CombatantPanel.tsx` | 移除旧类型 props |
| `src/modules/combat/components/DecisionPanel.tsx` | 移除旧类型引用 |
| `src/views/game/layout/CenterPanel.tsx` | 移除旧 Technique/Equipment props |
| `src/core/calculation/helpers/contextHelper.ts` | 删除旧路径，只保留统一路径 |
| `src/core/calculation/context/types.ts` | 保留 EquipmentInput/TechniqueInput 中间格式（计算引擎内部用） |
| `src/core/engine/gameSystems.ts` | 断开旧类型引用 |
| `src/core/engine/expansionLogic.ts` | 断开旧类型引用 |
| `src/shared/components/DeveloperPanel.tsx` | 断开旧类型引用 |
| `src/modules/item/logic/__tests__/slotSystem.test.ts` | 更新测试匹配新槽位 |

### 6.4 同步更新

| 路径 | 变更内容 |
|------|----------|
| `src/modules/README.md` | 删除旧模块条目，更新 item/ 描述 |
| `src/core/README.md` | 更新核心类型描述 |
| `game-design/` | 同步槽位系统和物品职责变更 |
| `game-design/changelog.md` | 追加变更记录 |
