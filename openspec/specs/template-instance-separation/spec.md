# template-instance-separation

## Purpose

将物品的静态定义（ItemTemplate："炎龙剑是什么"）和运行时数据（ItemInstance："这把炎龙剑几级了、有什么词缀"）分离。同名物品共享模板，实例只存储与模板不同的差异数据，避免重复存储 `name`、`description`、`baseStats` 等静态信息。

## ADDED Requirements

### Requirement: ItemTemplate 存储静态定义

每个物品种类 SHALL 有一个 `ItemTemplate` 定义其静态属性。模板 SHALL 位于 `modules/item/data/templates/` 目录下，按 category 组织。

模板 SHALL 包含以下公共字段：
- `templateId: string` — 模板唯一标识
- `name: string` — 显示名称
- `description: string` — 描述文本
- `category: ItemCategory` — 物品大类
- `subcategory: string` — 物品子类
- `rarity: Rarity` — 稀有度
- `maxStack: number` — 最大堆叠数量
- `maxLevel: number` — 最大等级
- `baseStats: Record<string, number>` — 基础数值（1级的数值）
- `price: number` — 基础售价
- `element: Element | null` — 元素属性
- `worldType?: WorldType` — 所属世界观
- `worldviewRestrictions?: string[]` — 世界观限制

#### Scenario: 模板是硬编码配置数据

- **WHEN** 查找"炎龙剑"的模板定义
- **THEN** SHALL 在 `modules/item/data/templates/equipment/cultivation.ts` 中找到
- **AND** 文件 SHALL 导出 `const FLAME_DRAGON_SWORD: EquipmentTemplate = { ... }`
- **AND** 模板 SHALL 包含 `name`、`rarity`、`baseStats`、`ext.equipSlot` 等静态字段

#### Scenario: 模板通过 templateId 查询

- **WHEN** 代码需要获取物品模板
- **THEN** SHALL 调用 `getTemplate(templateId)` 函数
- **AND** 函数 SHALL 从 `ALL_TEMPLATES` 映射表中查找并返回
- **AND** 不存在的 templateId SHALL 抛出明确错误

### Requirement: ItemInstance 仅存储差异数据

ItemInstance SHALL 通过 `templateId` 引用模板，自身只存储与模板不同的运行时数据。

**模板继承字段（实例不存储）**：`name`、`description`、`category`、`subcategory`、`rarity`、`baseStats`、`ext`（模板结构信息）

**实例自有字段（每个实例不同）**：`instanceId`、`quantity`、`level`、`exp`、`affixes`、`equipped`、`equippedInSlot`、`equippedSkills`、`element`（可覆盖模板）、`isFragment`、`obtainedAt`、`source`

#### Scenario: 查询物品完整信息时合并模板和实例

- **WHEN** UI 需要显示物品名称、稀有度颜色、攻击力
- **THEN** SHALL 通过 `resolveItem(instance)` 函数合并模板数据和实例数据
- **AND** 返回的对象 SHALL 包含 `name`（从模板）、`level`（从实例）、`actualStats`（`baseStats * levelMultiplier`）
- **AND** UI SHALL NOT 直接访问 `instance.templateId` 后再自行查模板

#### Scenario: 100 颗回春丹共享一个模板

- **WHEN** 背包中有 `quantity=100` 的回春丹 ItemInstance
- **THEN** 只存储 1 个 ItemInstance（`templateId='rejuvenation_pill'`, `quantity=100`）
- **AND** 每次查询回春丹的名称/效果时 SHALL 从同一个模板读取
- **AND** 模板数据在内存中只存在一份

### Requirement: 掉落生成使用模板工厂

物品生成函数 SHALL 接受 `templateId` + 覆盖参数，从模板生成实例：

```typescript
function createItemInstance(
  templateId: string,
  overrides?: Partial<Pick<ItemInstance, 'level' | 'element' | 'affixes' | 'isFragment'>>
): ItemInstance
```

#### Scenario: 生成掉落装备从模板创建

- **WHEN** Boss 掉落需要生成一把 `level=5` 的炎龙剑
- **THEN** SHALL 调用 `createItemInstance('flame_dragon_sword', { level: 5 })`
- **AND** 实例的 `name`/`baseStats` SHALL 来自模板，不重复存储
- **AND** `affixes` SHALL 在生成时随机选择（`rollAffixes(template.rarity)`）
