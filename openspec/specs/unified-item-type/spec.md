# unified-item-type

## Purpose

将项目中所有"可拥有、可使用、可装备、可消耗、可升级"的实体统一为一个 `Item` 类型体系，通过 `category` 字段区分类别，替代当前分散的 `Equipment`、`Technique`、`InventoryItem`、`PlayerCurrencies`、`FragmentInventory` 等多个类型和存储。

## ADDED Requirements

### Requirement: 物品六大类

系统 SHALL 支持六种物品大类，每种通过 `category` 字段区分：

| category | 说明 | 示例 |
|----------|------|------|
| `currency` | 货币 | 灵石、贡献点、宗门积分、荣誉值、飞升印记、活动代币 |
| `consumable` | 消耗品 | 回春丹、筑基丹、聚气丹、卷轴 |
| `material` | 材料 | 草药、矿石、宝石、妖兽材料、经验材料 |
| `equipment` | 装备 | 近战武器、远程武器、头部防具、身体防具、腿部防具、脚部防具 |
| `technique` | 功法 | 攻击功法、防御功法 |
| `skill` | 技能 | 法技（火球术、治疗术）、斗技（重击、旋风斩） |
| `fragment` | 碎片 | 任何物品的碎片形态，集齐可合成完整物品 |

#### Scenario: 灵石是货币类物品

- **WHEN** 查询灵石（spirit_stone）的物品定义
- **THEN** 其 `category` SHALL 为 `'currency'`
- **AND** `maxStack` SHALL 为 `999_999_999`
- **AND** 走统一的 `addItem(inventory, 'spirit_stone', 1000)` 增加数量

#### Scenario: 炎龙剑是装备类物品

- **WHEN** 查询炎龙剑（flame_dragon_sword）的物品定义
- **THEN** 其 `category` SHALL 为 `'equipment'`
- **AND** `subcategory` SHALL 为 `'weapon_melee'`
- **AND** `maxStack` SHALL 为 `1`（装备不可堆叠）
- **AND** `ext.equipSlot` SHALL 为 `'weapon_melee'`

#### Scenario: 焚天诀是功法类物品

- **WHEN** 查询焚天诀（焚天诀）的物品定义
- **THEN** 其 `category` SHALL 为 `'technique'`
- **AND** `subcategory` SHALL 为 `'attack'`
- **AND** `ext.providesSkillSlots` SHALL 为功法可提供的法技槽位数量

### Requirement: ItemInstance 运行时数据

所有运行时存在的物品 SHALL 以 `ItemInstance` 表示，包含以下运行时字段：

- `instanceId: string` — 唯一实例 ID（UUID）
- `templateId: string` — 指向 ItemTemplate
- `quantity: number` — 当前堆叠数量
- `level: number` — 当前等级（从 1 开始）
- `exp: number` — 当前经验值
- `affixes: ItemAffix[]` — 随机词缀
- `equipped: boolean` — 是否装备中
- `equippedInSlot: SlotId | null` — 装备在哪个槽位
- `equippedSkills: Record<string, string | null>` — 装备的技能（skillSlotId → skillInstanceId），仅当物品提供技能槽时有效
- `element: Element | null` — 实际元素（实例层面可变异）
- `isFragment: boolean` — 是否为碎片形态
- `obtainedAt: number` — 获得时间戳（unix ms）
- `source: string` — 来源（`'drop' | 'shop' | 'craft' | 'quest' | 'initial'`）

#### Scenario: 装备拥有随机词缀

- **WHEN** 生成一把"炎龙剑"实例
- **THEN** 其 `affixes` SHALL 包含 1-3 个根据稀有度随机选择的词缀
- **AND** `element` SHALL 为 `'fire'`（可从模板继承或变异）
- **AND** `level` SHALL 为 `1`

#### Scenario: 丹药可堆叠

- **WHEN** 背包中已有 `quantity=5` 的"回春丹"实例，再获得 3 颗
- **THEN** 新回春丹 SHALL 合并到已有堆叠，`quantity` 变为 `8`
- **AND** SHALL NOT 创建新的 ItemInstance

### Requirement: Item 类型收窄

代码中 SHALL 通过 `category` 判别字段收窄类型。处理特定类别物品的函数 SHALL 在收窄后访问该类别专属的 `ext` 字段。

#### Scenario: 收窄后安全访问装备专属字段

- **WHEN** 函数接收 `ItemTemplate` 参数并需访问 `equipSlot`
- **THEN** SHALL 先判断 `item.category === 'equipment'`
- **AND** 收窄后 SHALL 通过 `item.ext.equipSlot` 访问
- **AND** TypeScript SHALL 在 `category !== 'equipment'` 的分支中报错

### Requirement: Protagonist 使用统一物品存储

Protagonist 接口中与物品相关的字段 SHALL 仅保留两个：

- `inventory: ItemInstance[]` — 背包（所有物品，含货币、装备、功法、技能、消耗品、材料、碎片）
- `slots: Record<SlotId, string | null>` — 槽位映射（槽位ID → 装备的物品 instanceId）

#### Scenario: 从装备切换到功法

- **WHEN** 玩家从 `weapon_melee` 槽卸下武器
- **AND** 将功法装备到 `technique_atk_1` 槽
- **THEN** 两次操作 SHALL 调用同一个 `equipItem(inventory, slots, instanceId, slotId)` 函数
- **AND** 函数 SHALL 验证物品 `category` 是否匹配槽位 `acceptedCategory`

## MODIFIED Requirements

### Requirement: 移除分散的物品类型

以下旧类型 SHALL 被移除，由 `ItemInstance` 替代：
- `Equipment` 接口（`core/types/types.ts:1391`）
- `Technique` 接口（`core/types/types.ts:1318`）
- `InventoryItem` 类型
- `PlayerCurrencies` 接口
- `FragmentInventory` 接口

相关工具函数 SHALL 使用新的 `ItemInstance` 类型。

#### Scenario: 旧类型不再存在于代码库

- **WHEN** 搜索 `src/` 中的 `interface Equipment`、`interface Technique`、`interface InventoryItem`
- **THEN** SHALL NOT 找到作为物品定义的旧类型
- **AND** 任何残留引用 SHALL 为 deprecated barrel re-export（过渡期后删除）
