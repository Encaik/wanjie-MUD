# unified-slot-system

## Purpose

将所有装备槽位/功法槽位/技能槽位统一为可扩展的 `SlotDefinition` 配置表驱动系统。Protagonist 中不再有 `equippedMelee`、`equippedHead`、`equippedAttackTechniques[3]` 等硬编码字段，改为一个 `slots: Record<SlotId, string | null>` 映射。

## ADDED Requirements

### Requirement: 槽位配置表

系统 SHALL 在 `modules/item/data/slots.ts` 中维护 `SLOT_DEFINITIONS: SlotDefinition[]` 配置表。每个槽位定义 SHALL 包含：

```typescript
interface SlotDefinition {
  slotId: string;                              // 唯一标识
  displayName: string;                         // 显示名
  category: 'equipment' | 'technique' | 'skill';  // 槽位大类
  acceptedCategory: ItemCategory;              // 接受的物品类型
  acceptedSubcategory?: string;                // 接受的子类型（如 'weapon_melee'）
  acceptedSkillTag?: SkillTag;                 // 接受的技能标签（仅技能槽）
  isDynamic: boolean;                          // 动态创建/销毁？
  parentSlotId?: string;                       // 父槽位（技能槽指向所属装备/功法槽）
  maxCount?: number;                           // 该类型槽位的数量（功法槽为 3）
  unlockCondition?: UnlockCondition;           // 解锁条件
}
```

#### Scenario: 近战武器槽接受装备类物品

- **WHEN** 查询 `weapon_melee` 槽位定义
- **THEN** `category` SHALL 为 `'equipment'`
- **AND** `acceptedCategory` SHALL 为 `'equipment'`
- **AND** `acceptedSubcategory` SHALL 为 `'weapon_melee'`
- **AND** `isDynamic` SHALL 为 `false`（固定槽）

#### Scenario: 技能槽接受技能类物品

- **WHEN** 查询 `skill_weapon_melee_0` 槽位定义
- **THEN** `acceptedCategory` SHALL 为 `'skill'`
- **AND** `acceptedSkillTag` SHALL 为 `'combat'`（由父装备的 `ext.acceptedSkillTag` 决定）
- **AND** `isDynamic` SHALL 为 `true`
- **AND** `parentSlotId` SHALL 为 `'weapon_melee'`

### Requirement: 固定槽位初始化

主角创建时 SHALL 初始化所有 `isDynamic=false` 的槽位。固定槽位 SHALL 包括：

| slotId | 显示名 | 接受物品 |
|--------|--------|---------|
| `weapon_melee` | 近战武器 | equipment / weapon_melee |
| `weapon_ranged` | 远程武器 | equipment / weapon_ranged |
| `armor_head` | 头部 | equipment / armor_head |
| `armor_body` | 身体 | equipment / armor_body |
| `armor_legs` | 腿部 | equipment / armor_legs |
| `armor_feet` | 脚部 | equipment / armor_feet |
| `technique_atk_1` | 攻击功法① | technique / attack |
| `technique_atk_2` | 攻击功法② | technique / attack |
| `technique_atk_3` | 攻击功法③ | technique / attack |
| `technique_def_1` | 防御功法① | technique / defense |
| `technique_def_2` | 防御功法② | technique / defense |
| `technique_def_3` | 防御功法③ | technique / defense |

#### Scenario: 新角色槽位初始化为 null

- **WHEN** 创建新主角
- **THEN** `protagonist.slots` SHALL 包含上述 12 个键
- **AND** 所有值 SHALL 为 `null`（未装备）
- **AND** SHALL NOT 包含任何动态技能槽（技能槽在装备物品时创建）

### Requirement: 动态技能槽位生命周期

当物品装备到固定槽位时，如果物品模板 `ext.providesSkillSlots > 0`，系统 SHALL 自动创建对应的技能槽位。物品卸下时，系统 SHALL 先卸下技能槽中的技能（回到背包），再删除技能槽位。

#### Scenario: 装备功法创建技能槽

- **WHEN** "焚天诀"（`providesSkillSlots=2`, `acceptedSkillTag='magic'`）装备到 `technique_atk_1`
- **THEN** 系统 SHALL 创建 `skill_technique_atk_1_0` 和 `skill_technique_atk_1_1` 两个槽位
- **AND** 槽位的 `acceptedSkillTag` SHALL 为 `'magic'`
- **AND** 槽位的 `parentSlotId` SHALL 为 `'technique_atk_1'`

#### Scenario: 卸下功法清理技能槽

- **WHEN** "焚天诀"从 `technique_atk_1` 卸下
- **AND** `skill_technique_atk_1_0` 中装备了"火球术"技能
- **THEN** 系统 SHALL 先将"火球术"卸下（`equipped=false`, `equippedInSlot=null`）
- **AND** SHALL 删除 `skill_technique_atk_1_0` 和 `skill_technique_atk_1_1` 槽位
- **AND** "火球术" SHALL 回到背包中

### Requirement: 装备操作为纯函数

装备/卸下操作 SHALL 实现为纯函数，不修改输入参数，返回新状态：

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

#### Scenario: 装备操作验证槽位兼容性

- **WHEN** 尝试将"回春丹"（category=consumable）装备到 `weapon_melee`
- **THEN** `equipItem` SHALL 返回 `{ success: false, error: '物品类型不匹配：消耗品无法装备到武器槽' }`
- **AND** inventory 和 slots SHALL 保持不变

#### Scenario: 装备操作验证槽位是否已被占用

- **WHEN** `weapon_melee` 已装备物品 A，尝试装备物品 B
- **THEN** `equipItem` SHALL 先将物品 A 卸下（`equipped=false`）
- **AND** 再将物品 B 装备上（`equipped=true`, `equippedInSlot='weapon_melee'`）
- **AND** 返回更新后的 inventory 和 slots

### Requirement: 未来扩展槽位只需加配置

新增槽位（如法宝槽 `artifact`、坐骑槽 `mount`）SHALL 只需向 `SLOT_DEFINITIONS` 配置表和固定槽位初始化列表添加记录——不需要修改任何类型定义或逻辑代码。

#### Scenario: 新增法宝槽

- **WHEN** 在 `SLOT_DEFINITIONS` 中添加：
  ```typescript
  { slotId: 'artifact', displayName: '本命法宝', category: 'equipment',
    acceptedCategory: 'equipment', acceptedSubcategory: 'artifact',
    isDynamic: false, unlockCondition: { type: 'realm', minRealm: 5 } }
  ```
- **AND** 在固定槽位初始化中添加 `'artifact': null`
- **THEN** 装备/卸下逻辑 SHALL 自动支持法宝槽
- **AND** UI SHALL 遍历 `SLOT_DEFINITIONS` 渲染新槽位
- **AND** 解锁条件不满足时 SHALL 显示为锁定状态
