# unified-inventory

## Purpose

提供统一的物品操作接口，移除 Protagonist 中分散的 10+ 个物品字段，所有增删查改通过 `modules/item/logic/itemManager.ts` 中的纯函数完成。

## ADDED Requirements

### Requirement: 统一背包增删操作

系统 SHALL 提供以下纯函数操作背包：

```typescript
// 新增物品（自动堆叠）
function addItem(
  inventory: ItemInstance[],
  templateId: string,
  quantity: number,
  overrides?: Partial<Pick<ItemInstance, 'level' | 'element' | 'affixes' | 'isFragment'>>
): ItemInstance[]

// 移除物品
function removeItem(
  inventory: ItemInstance[],
  instanceId: string,
  quantity: number
): ItemInstance[]

// 拆分堆叠
function splitStack(
  inventory: ItemInstance[],
  instanceId: string,
  count: number
): ItemInstance[]

// 合并堆叠
function mergeStacks(
  inventory: ItemInstance[],
  sourceInstanceId: string,
  targetInstanceId: string
): ItemInstance[]
```

#### Scenario: 添加货币自动堆叠

- **WHEN** 背包中已有 `templateId='spirit_stone', quantity=1000` 的灵石
- **AND** 调用 `addItem(inventory, 'spirit_stone', 500)`
- **THEN** 灵石 `quantity` SHALL 变为 `1500`
- **AND** SHALL NOT 创建新的 ItemInstance

#### Scenario: 添加装备不堆叠（独立实例）

- **WHEN** 背包中已有 1 把"炎龙剑"（`maxStack=1`）
- **AND** 调用 `addItem(inventory, 'flame_dragon_sword', 1)`
- **THEN** SHALL 创建新的 ItemInstance（新的 `instanceId`）
- **AND** 两把剑各自拥有独立的 `level`、`affixes`、`element`

#### Scenario: 移除物品时自动清理装备状态

- **WHEN** 要从背包移除某物品，且该物品 `equipped=true`
- **THEN** `removeItem` SHALL 先从 `slots` 中卸下该物品
- **AND** SHALL 清理对应的动态技能槽位
- **AND** 再减少 `quantity`（数量归零则删除实例）

### Requirement: 背包查询操作

系统 SHALL 提供以下纯函数查询背包：

```typescript
// 按类别筛选
function getItemsByCategory(inventory: ItemInstance[], category: ItemCategory): ItemInstance[]

// 获取某模板的总持有数量（含堆叠）
function getItemCount(inventory: ItemInstance[], templateId: string): number

// 获取货币余额（语法糖）
function getCurrencyAmount(inventory: ItemInstance[], currencyTemplateId: string): number

// 判断是否有足够数量
function hasEnough(inventory: ItemInstance[], templateId: string, count: number): boolean

// 按模板 ID 查找实例（返回所有匹配的实例）
function findItemsByTemplate(inventory: ItemInstance[], templateId: string): ItemInstance[]

// 按实例 ID 查找
function findItemByInstance(inventory: ItemInstance[], instanceId: string): ItemInstance | undefined
```

#### Scenario: 查询灵石余额

- **WHEN** 调用 `getCurrencyAmount(inventory, 'spirit_stone')`
- **THEN** SHALL 返回所有 `templateId='spirit_stone'` 的实例的 `quantity` 之和
- **AND** 实现为 `getItemCount(inventory, 'spirit_stone')` 的语法糖

#### Scenario: 检查是否买得起

- **WHEN** 商店物品售价 2000 灵石
- **THEN** SHALL 调用 `hasEnough(inventory, 'spirit_stone', 2000)`
- **AND** 返回 `true` 或 `false`

### Requirement: 消耗品使用操作

```typescript
function useConsumable(
  inventory: ItemInstance[],
  instanceId: string,
  target?: any  // 使用目标（可选）
): { inventory: ItemInstance[]; effects: ConsumableEffect[] }
```

#### Scenario: 使用回春丹恢复生命

- **WHEN** 玩家使用 `quantity=1` 的"回春丹"
- **THEN** `useConsumable` SHALL 减少回春丹数量 1
- **AND** 返回 `effects: [{ type: 'restore_hp', value: 50 }]`
- **AND** 调用方 SHALL 根据 effects 更新主角 HP

#### Scenario: 使用最后一颗丹药移除实例

- **WHEN** 回春丹 `quantity=1`，玩家使用它
- **THEN** `inventory` SHALL 中移除该 ItemInstance
- **AND** SHALL NOT 保留 `quantity=0` 的实例

### Requirement: 物品升级操作

```typescript
function upgradeItem(
  inventory: ItemInstance[],
  instanceId: string,
  materials: { templateId: string; quantity: number }[]
): { inventory: ItemInstance[]; upgradedItem: ItemInstance }
```

#### Scenario: 消耗材料升级装备

- **WHEN** "炎龙剑"（`level=1, exp=0, expToNext=100`）消耗 3 个"经验石"（每个提供 50 exp）
- **THEN** 经验石从背包移除（或减少数量）
- **AND** 炎龙剑 `exp` 变为 `150`
- **AND** 由于 `exp >= expToNext`，`level` 变为 `2`
- **AND** 统计属性（攻击力）SHALL 按稀有度乘数增长
- **AND** 如果新等级解锁了技能槽位，`equippedSkills` SHALL 新增 `null` 条目

### Requirement: 碎片合成操作

```typescript
function synthesizeFragments(
  inventory: ItemInstance[],
  templateId: string
): { inventory: ItemInstance[]; synthesizedItem?: ItemInstance; message: string }
```

#### Scenario: 集齐碎片合成完整物品

- **WHEN** 背包中有 8 个"炎龙剑碎片"（`templateId='flame_dragon_sword_fragment', quantity=8`）
- **AND** 炎龙剑稀有度为 `epic`（`fragmentsRequired=8`）
- **THEN** `synthesizeFragments(inventory, 'flame_dragon_sword')` SHALL 消耗全部 8 个碎片
- **AND** SHALL 返回完整"炎龙剑" ItemInstance（`level=1`, 随机词缀）
- **AND** `synthesizedItem` SHALL 不为 null

#### Scenario: 碎片不足

- **WHEN** 背包中只有 5 个"炎龙剑碎片"（需要 8 个）
- **THEN** `synthesizeFragments` SHALL 返回 `{ inventory, synthesizedItem: undefined, message: '碎片不足：需要8个，当前5个' }`
- **AND** inventory SHALL 不变

### Requirement: 装备/卸下操作

装备/卸下 SHALL 通过 `slotSystem` 实现（参见 `unified-slot-system` spec），但入口函数 SHALL 统一操作 `inventory` + `slots` 两个字段。

```typescript
function equipItem(
  inventory: ItemInstance[],
  slots: Record<string, string | null>,
  instanceId: string,
  slotId: string
): { inventory: ItemInstance[]; slots: Record<string, string | null> }

function unequipItem(
  inventory: ItemInstance[],
  slots: Record<string, string | null>,
  slotId: string
): { inventory: ItemInstance[]; slots: Record<string, string | null> }
```

#### Scenario: 装备时更新 ItemInstance 装备状态

- **WHEN** 将物品 A 装备到 `weapon_melee`
- **THEN** 物品 A 的 `equipped` SHALL 为 `true`
- **AND** `equippedInSlot` SHALL 为 `'weapon_melee'`
- **AND** `slots['weapon_melee']` SHALL 为物品 A 的 `instanceId`

### Requirement: 所有操作为纯函数

`modules/item/logic/` 中的全部函数 SHALL 为纯函数：
- SHALL NOT 修改输入参数（返回新数组/新对象）
- SHALL NOT 使用 `Math.random()`（接收 RNG seed 参数）
- SHALL NOT 依赖 React 或浏览器 API
- SHALL NOT 产生副作用（如直接写 localStorage）
