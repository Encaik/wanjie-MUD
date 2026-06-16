## Why

当前物品相关系统存在五个根本性问题：

1. **同一概念散落在多处**：灵石同时存在于 `inventory`（物品）和 `currencies`（货币），装备和功法拥有几乎相同的结构（等级/经验/稀有度/技能槽/碎片）却是完全独立的两种类型、两种存储、两套代码
2. **技能是"二等公民"**：法技和斗技寄生在功法/装备的内部数组中，不能独立获取、交易、装备——玩家实际上无法"获得一个火球术"
3. **两种稀有度体系并存**：`ItemRarity`（中文5级）和 `Quality`（英文8级）同时在用，装备的掉落、属性、价格各自用不同的稀有度判断
4. **槽位硬编码**：6个装备槽位 + 6个功法槽位以独立字段硬编码在 Protagonist 接口中，每新增一个槽位都要改类型、改状态、改UI
5. **10+ 个字段管理"玩家拥有什么"**：`inventory`、`currencies`、`equipments`、`equippedMelee`、`equippedRanged`、`equippedHead`、`equippedBody`、`equippedLegs`、`equippedFeet`、`techniques`、`equippedAttackTechniques`、`equippedDefenseTechniques`、`fragmentInventory`——没有任何统一的操作接口

## What Changes

- **统一物品类型**：一切可拥有、可使用、可装备、可消耗的东西都是 `Item`。货币、消耗品、材料、装备、功法、技能、碎片统一为一个类型体系，通过 `category` 区分
- **模板-实例分离**：`ItemTemplate` 存储静态定义（名称/描述/图标/基础数值/槽位信息），`ItemInstance` 存储运行时数据（等级/经验/词缀/装备状态），同名物品共享模板不重复
- **技能独立为物品**：法技和斗技不再是功法/装备的子属性，而是 `category=skill` 的独立物品。功法/装备提供技能槽位（`providesSlots`），技能自由装备/卸下/交易。**BREAKING**: `Technique.allSkills`、`Equipment.allTechniques` 移除，改为槽位引用
- **统一稀有度**：六等制 `common → uncommon → rare → epic → legendary → mythic`（凡品→精良→稀有→史诗→传说→神话），全局一致，替代所有旧的 `ItemRarity` 和 `Quality` 散落定义
- **统一槽位系统**：所有装备槽/功法槽/技能槽统一为 `SlotDefinition` 配置表。Protagonist 只有两个字段：`inventory: ItemInstance[]`（背包）和 `slots: Record<SlotId, string | null>`（槽位→物品ID）。技能槽由装备中的物品动态创建
- **统一背包**：`addItem / removeItem / useItem / equipItem / upgradeItem` 一套操作接口覆盖所有物品类型。货币也是物品（堆叠极大数量），用相同的增删查改逻辑
- **合并冗余模块**：`modules/economy/`（货币）、`modules/equipment/`（装备）、`modules/techniques/`（功法）、`modules/crafting/`（碎片/制作）合并到 `modules/item/`
- **清档重构**：旧存档格式不兼容，不做迁移。全新物品数据结构从零开始

## Capabilities

### New Capabilities
- `unified-item-type`: 统一物品类型系统，ItemTemplate + ItemInstance 覆盖所有物品类别
- `template-instance-separation`: 模板-实例两层分离，模板静态配置在 data/，实例运行时在 protagonist.inventory
- `unified-slot-system`: 可扩展槽位配置表，固定槽位 + 动态技能槽位，新增槽位只需加配置
- `skill-as-item`: 技能作为 category=skill 的独立物品，可自由获取、交易、装备到功法/武器的技能槽
- `unified-rarity`: 六等唯一稀有度体系，替代所有旧稀有度/品质定义

### Modified Capabilities
- `item-management`: 现有 modules/equipment/、modules/economy/、modules/techniques/、modules/crafting/ 合并为 modules/item/
- `protagonist-model`: Protagonist 的物品相关字段从 10+ 个缩减为 2 个（`inventory` + `slots`）
- `drop-system`: 掉落系统统一产出 ItemInstance 而非分散的 Equipment/Technique/InventoryItem
- `shop-system`: 商品统一为 ItemTemplate 引用，价格和交易货币也是 Item
- `crafting-system`: 炼丹/炼器配方输入材料 Item → 产出 Item

### Removed Capabilities
- `modules/economy/` — 货币作为 Item 后不再需要独立模块
- `modules/equipment/` — 合并入 modules/item/
- `modules/techniques/` — 合并入 modules/item/
- `modules/crafting/` — 合并入 modules/item/

## Impact

**新增模块：**
- `modules/item/` — 统一物品系统（types / data / logic / hooks / components / events）

**删除模块：**
- `modules/economy/` — 经济调节器迁移到 `core/calculation/`，商店独立为 `modules/shop/`
- `modules/equipment/` — 合并入 `modules/item/`
- `modules/techniques/` — 合并入 `modules/item/`
- `modules/crafting/` — 碎片/制作逻辑合并入 `modules/item/`

**修改文件（核心层）：**
- `core/types/types.ts` — 移除 `Equipment`、`Technique`、`InventoryItem`、`PlayerCurrencies`、`FragmentInventory` 接口；新增 `ItemTemplate`、`ItemInstance`、`ItemCategory`、`Rarity`、`SlotDefinition` 类型
- `core/calculation/` — 经济调节器从 `modules/economy/` 迁入

**修改文件（模块层）：**
- `modules/collection/` — 图鉴/羁绊系统适配 ItemInstance，事件改为 `item_obtained`
- `modules/combat/` — 战斗系统从 Item 装备槽读取武器/功法，技能从技能槽读取
- `modules/progression/` — 修炼系统消费核心值（不受影响，但装备/功法加成从 Item 实例计算）

**修改文件（视图层）：**
- `views/game/` — 所有面板改从 `protagonist.inventory` + `protagonist.slots` 读取数据
- `Protoagonist` 接口简化，useGameState 大幅瘦身

**影响范围**：估算涉及约 40+ 个源文件的增删改，是项目迄今最大的一次重构
