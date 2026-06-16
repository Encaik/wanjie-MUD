## Context

当前项目有五层架构（app → views → modules → core → shared），物品相关的代码分散在 4 个独立模块中：

```
modules/economy/      货币系统（6种货币、商店、经济调节）
modules/equipment/    装备系统（武器/防具、升级、词缀、残片）
modules/techniques/   功法系统（攻击/防御功法、法技、斗技、羁绊）
modules/crafting/     制作系统（炼丹/炼器配方、碎片系统）
```

这些模块拥有几乎相同的结构——都有生成器（随机生成掉落）、升级系统（等级/经验/稀有度上限）、槽位系统（装备/卸下）、碎片系统（拆解/合成）。但因为类型不统一，相同逻辑写了 3-4 遍。

此外 `Protagonist` 接口中有 10+ 个字段来管理这些"玩家拥有的东西"，装备和功法的槽位以独立字段硬编码（`equippedMelee`、`equippedRanged`、`equippedHead`...），技能寄生在功法/装备的内部数组中无法独立存在。

**命名约定**：模板（Template）= 静态定义，"炎龙剑是什么"；实例（Instance）= 运行时数据，"这把炎龙剑几级了、有什么词缀"。

## Goals / Non-Goals

**Goals:**
- 所有可拥有、可使用、可装备、可消耗、可升级的东西统一为一个 `Item` 类型
- 模板-实例分离：静态数据不重复存储，实例只存差异
- 技能成为独立的 `category=skill` 物品，可在功法/武器槽位间自由装备/卸下/交易
- 唯一稀有度体系：`common → uncommon → rare → epic → legendary → mythic`
- 槽位系统完全配置化：固定槽 + 动态技能槽，新槽位只需加配置
- 统一操作接口：一套 `addItem/removeItem/equipItem/upgradeItem` 覆盖所有物品类型

**Non-Goals:**
- 不做旧存档迁移（清档重来）
- 不在此变更中重新设计商店系统（商店独立为 `modules/shop/`，仅适配新 Item 类型）
- 不修改 `core/calculation/` 的核心算法（只改变装备/功法加成的数据来源）
- 不在此变更中实现 Mod 自定义物品模板（预留扩展点，但模板先硬编码在 `modules/item/data/`）
- 不修改战斗系统的核心逻辑（只改变战斗读取装备/技能的方式）

## Decisions

### Decision 1: 物品采用标记联合（Discriminated Union），而非单一大接口

**选择**: `ItemTemplate` 和 `ItemInstance` 都使用 `category` 作为判别字段，配合 `templateExt` / `instanceExt` 扩展字段携带类型特定的数据。

**替代方案**: 一个大接口包含所有可能的字段（`attackBonus?`、`defenseBonus?`、`skillSlots?`...），所有非该类型的字段为 `undefined`。但这种方式代码中充斥着空值检查，类型提示不精准。

**理由**: 标记联合是 TypeScript 原生支持的模式，类型收窄后编译器知道当前分支的精确类型，所有字段可用无问号。扩展字段打包在 `ext` 子对象中，避免顶层字段爆炸。

```typescript
// ItemTemplate
type ItemTemplate =
  | CurrencyTemplate     // category: 'currency'
  | ConsumableTemplate   // category: 'consumable'
  | MaterialTemplate     // category: 'material'
  | EquipmentTemplate    // category: 'equipment'
  | TechniqueTemplate    // category: 'technique'
  | SkillTemplate        // category: 'skill'
  | FragmentTemplate     // category: 'fragment'

// 每个子类型通过 ext 携带特定字段
interface EquipmentTemplate {
  category: 'equipment';
  subcategory: 'weapon_melee' | 'weapon_ranged' | 'armor_head' | 'armor_body' | 'armor_legs' | 'armor_feet';
  ext: {
    equipSlot: SlotId;              // 装备到哪个槽位
    providesSkillSlots: number;     // 提供几个技能槽（斗技槽）
    acceptedSkillTag: SkillTag;     // 接受的技能类型
    weaponCategory?: WeaponCategory;
    element?: Element;
    compatibleElement?: Element;
  };
}
```

### Decision 2: 稀有度使用英文 key，中文名在元数据中

**选择**: `type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'`

六等制，英文 key 用于代码和存储，中文显示名通过 `RARITY_META` 常量获取。替代现有的：
- `ItemRarity`（`'普通' | '稀有' | '史诗' | '传说' | '神话'`——5级中文）
- `Quality`（`'mythic' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common' | 'poor' | 'basic'`——8级英文）
- `QualityTier`（enum 英文）

**稀有度与游戏机制挂钩**:

| Rarity | 中文 | 颜色 | maxLevel | 技能槽数 | 碎片合成数 | 掉落权重 |
|--------|------|------|----------|----------|-----------|---------|
| common | 凡品 | 灰 | 3 | 1 | 3 | 50% |
| uncommon | 精良 | 绿 | 5 | 1 | 4 | 25% |
| rare | 稀有 | 蓝 | 7 | 2 | 6 | 15% |
| epic | 史诗 | 紫 | 8 | 2 | 8 | 7% |
| legendary | 传说 | 橙 | 9 | 3 | 10 | 2.5% |
| mythic | 神话 | 红 | 10 | 3 | 12 | 0.5% |

### Decision 3: 货币也是 Item，堆叠极大数量

**选择**: 货币（灵石/贡献点/宗门积分/荣誉值/飞升印记/活动代币）是 `category=currency` 的模板，运行时 `ItemInstance.quantity` 表示持有数量。`maxStack` 设为极大值（如 999,999,999）。

**理由**: 
- 统一增删查改接口——`addItem(inventory, 'spirit_stone', 1000)` 和 `addItem(inventory, '回春丹', 5)` 是同一次调用
- 商店交易——扣除灵石和获得商品是同一套物品操作
- 未来可扩展——如果某活动代币有"不同来源的同名代币有不同属性"的需求，Item 模型天然支持

**替代方案**: 货币保留为独立 `Record<string, number>`。但会导致背包操作有两个入口（`addItem` + `addCurrency`），违反统一目标。

### Decision 4: 技能是完全独立的物品

**选择**: 技能是 `category=skill` 的独立物品，有自己的模板和实例。功法/武器的模板中声明 `providesSlots`（提供 N 个技能槽位）和 `acceptedSkillTag`（接受的技能类型）。技能实例通过 `equipSkill(slots, skillInstanceId, skillSlotId)` 装备到功法/武器的技能槽上。

**技能模板结构**:
```typescript
interface SkillTemplate {
  category: 'skill';
  subcategory: 'magic_skill' | 'combat_skill';  // 法技 / 斗技
  rarity: Rarity;
  maxLevel: number;       // 技能也可升级！
  baseStats: {
    power: number;
    mpCost: number;
    cooldown: number;
  };
  effects: SkillEffect[]; // 效果列表
  tags: SkillTag[];       // 标签（instant/aoe/dot/shield...）
  ext: {
    requiredElement?: Element;
    weaponRestriction?: WeaponCategory;
  };
}
```

**技能槽位动态创建/销毁**:
```
装备"炎龙剑"(providesSlots=3, acceptedSkillTag="combat") 到 weapon_melee
  → slots 中新增 skill_weapon_melee_0、skill_weapon_melee_1、skill_weapon_melee_2

卸下"炎龙剑"
  → skill_weapon_melee_* 中的技能先卸下（回到背包），再删除这三个槽位
```

**理由**: 技能从"功法的附属品"升级为"可自由获取和交易的商品"，未来可做技能书掉落、技能市场、技能合成等扩展。

### Decision 5: Protagonist 只保留 2 个物品相关字段

**选择**:
```typescript
interface Protagonist {
  inventory: ItemInstance[];                          // 统一背包
  slots: Record<SlotId, string | null>;              // 槽位映射（槽位ID → 物品instanceId）
  // ... 非物品字段不变（stats, activeEffects, statistics 等）
}
```

**替代方案**: 保留旧字段为兼容别名。但决定清档重构，不必要增加复杂度。

**理由**: 从 10+ 字段减到 2 个，操作逻辑大幅简化。槽位是固定槽 + 动态技能槽的并集，`Record<string, string|null>` 足够表达一切。

### Decision 6: 槽位配置表驱动

**选择**: 所有槽位在 `modules/item/data/slots.ts` 中以 `SlotDefinition[]` 表定义：

```typescript
interface SlotDefinition {
  slotId: string;                              // 唯一标识
  displayName: string;                         // 显示名
  category: 'equipment' | 'technique' | 'skill';  // 槽位大类
  acceptedCategory: ItemCategory;              // 接受什么类型的物品
  acceptedSubcategory?: string;                // 接受的子类型
  isDynamic: boolean;                          // 是否动态创建/销毁（技能槽为 true）
  parentSlotId?: string;                       // 所属父槽位（技能槽指向装备/功法槽）
  maxSlotCount?: number;                       // 槽位容量（功法槽可以扩展）
  unlockCondition?: UnlockCondition;           // 解锁条件
}
```

**理由**: 新增槽位（如法宝、坐骑）只需向配置表加一条记录——不需要改类型、不需要改组件、不需要改状态管理。

### Decision 7: modules/ 合并方案

**选择**: 将 `economy`、`equipment`、`techniques`、`crafting` 全部合并到 `modules/item/`。`economy` 中的经济调节器迁到 `core/calculation/`（核心基础设施），商店独立为 `modules/shop/`。

**合并后结构**:
```
modules/item/
├── index.ts              ← 统一导出
├── types.ts              ← ItemTemplate、ItemInstance、Rarity、SlotDefinition...
├── events.ts             ← item_obtained、item_used、item_equipped、item_upgraded...
│
├── data/
│   ├── rarity.ts         ← 稀有度配置
│   ├── slots.ts          ← 槽位定义表
│   ├── affixes.ts        ← 词缀池
│   ├── bonds.ts          ← 羁绊配置（按名称关键词/元素匹配）
│   ├── templates/        ← 物品模板（按 category 分文件）
│   │   ├── currency.ts
│   │   ├── consumable.ts
│   │   ├── material.ts
│   │   ├── equipment/    ← 按世界观分文件
│   │   ├── technique/
│   │   └── skill/
│   └── recipes/          ← 制作配方
│       ├── alchemy.ts
│       └── forge.ts
│
├── logic/
│   ├── itemManager.ts    ← 统一背包操作（add/remove/stack/query）
│   ├── slotSystem.ts     ← 统一槽位操作（equip/unequip/dynamicSlots）
│   ├── skillSystem.ts    ← 技能装备/卸下
│   ├── itemGenerator.ts  ← 物品生成（随机掉落/商店/奖励）
│   ├── itemUpgrade.ts    ← 统一升级（消耗材料→exp→升级）
│   ├── itemFragment.ts   ← 碎片拆解/合成
│   ├── itemUse.ts        ← 消耗品使用
│   └── __tests__/
│
├── hooks/
│   ├── useInventory.ts
│   ├── useEquipment.ts
│   ├── useTechniques.ts
│   ├── useSkills.ts
│   └── useCrafting.ts
│
└── components/
    ├── InventoryPanel.tsx
    ├── EquipmentPanel.tsx
    ├── TechniquePanel.tsx
    ├── SkillPanel.tsx
    ├── FragmentPanel.tsx
    ├── AlchemyPanel.tsx
    └── ForgePanel.tsx
```

## Risks / Trade-offs

- **[风险] 单次变更涉及 40+ 文件**: 这是项目迄今最大范围的重构，分 6 个阶段实施，每阶段独立提交并运行质量门。
- **[风险] 标记联合类型增加复杂度**: 处理 Item 的代码需要先收窄类型（`if (item.category === 'equipment')`），比之前的"拿字段"多一步。但 TypeScript 的类型收窄非常成熟，代价小于收益。
- **[风险] 货币从简单计数器变为 Item 堆叠**: 每次查询货币数量需要 `inventory.find(i => i.templateId === 'spirit_stone')?.quantity ?? 0` 而非一次属性访问。通过 `getCurrencyAmount()` 辅助函数封装，对外接口保持简洁。
- **[风险] 技能槽位动态创建/销毁增加状态复杂度**: 装备/卸下物品时需要同步管理动态槽位的生命周期。slotSystem 的 `syncSkillSlots(inventory, slots)` 函数将此逻辑封装为纯函数。
- **[取舍] 旧存档完全不可用**: 决定清档。优点是零兼容包袱，缺点是测试时需要重新生成角色。对于开发中的项目，这个取舍合理。
- **[取舍] 模板数据暂时硬编码**: 不在此变更中实现 Mod 自定义物品模板。模板先写在 `modules/item/data/templates/` 中，后续可通过 Mod JSON 扩展。

## Migration Plan

1. **Phase 0 — 类型层**: 在 `core/types/` 和 `modules/item/types.ts` 中定义所有新类型。旧类型（`Equipment`、`Technique`、`InventoryItem`、`PlayerCurrencies`、`FragmentInventory`）标记 `@deprecated`。
2. **Phase 1 — 模块创建**: 创建 `modules/item/` 目录结构，写入所有 data/ 配置（稀有度、槽位、物品模板、配方）。
3. **Phase 2 — 核心逻辑**: 实现 `modules/item/logic/` 中的全部纯函数（itemManager、slotSystem、skillSystem、itemGenerator、itemUpgrade、itemFragment、itemUse）。
4. **Phase 3 — Protagonist 简化**: 更新 Protagonist 接口为 `inventory` + `slots`，重构 useGameState 中所有物品相关操作。
5. **Phase 4 — 消费方适配**: 更新所有依赖旧物品字段的模块（combat、progression、collection、shop）和 UI 组件。
6. **Phase 5 — 旧代码清理**: 删除 `modules/economy/`、`modules/equipment/`、`modules/techniques/`、`modules/crafting/`，删除 `core/types/` 中所有 deprecated 类型。
7. **Phase 6 — 质量验证**: 全量 `pnpm ts-check && pnpm test && pnpm build && pnpm lint:strict`。

## Open Questions

- **Q1**: 技能可否堆叠？——如果"火球术"是一种技能模板，玩家能否拥有多本"火球术秘籍"？还是技能实例唯一（每个技能只能存在于一个槽位中）？倾向于技能不可堆叠（`maxStack: 1`），获得就是独立实例。
- **Q2**: 功法残本合成后，技能保留还是重新随机？——如果功法残本合成后原本带有特定技能，这些技能怎么办？倾向于合成后按功法模板重新随机生成技能（失去旧技能），保持简洁。
- **Q3**: 装备/功法的经验材料用什么类型？——当前升级系统有 `UpgradeMaterial`，统一物品系统下是否直接用 Item 实例作为升级消耗（类似原神的"用武器喂武器"）？倾向于保留专用的"经验材料"（category=material, subtype=exp_fodder）。
- **Q4**: 羁绊系统是否需要适配技能物品？——当前羁绊按功法名称的关键词匹配。技能独立后，是否需要"装备了3个火系技能的功法"触发的羁绊？倾向于先保留现有羁绊逻辑（按功法/装备名称匹配），技能羁绊留到后续扩展。
