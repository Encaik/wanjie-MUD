# skill-as-item

## Purpose

将技能（法技/斗技）从"功法/装备的子属性"升级为 `category=skill` 的独立物品。功法/装备提供技能槽位，技能作为独立物品可自由获取、装备、卸下、交易。

## ADDED Requirements

### Requirement: 技能是独立物品

技能 SHALL 作为 `category=skill` 的独立物品存在，拥有自己的模板和实例。`SkillTemplate` SHALL 包含：

- `subcategory`: `'magic_skill'`（法技，来自功法）| `'combat_skill'`（斗技，来自武器）
- `rarity`: 技能也可有稀有度（决定数值强度）
- `baseStats.power` — 基础威力
- `baseStats.mpCost` — 法力消耗
- `baseStats.cooldown` — 冷却回合数
- `effects: SkillEffect[]` — 技能效果列表
- `tags: SkillTag[]` — 技能标签
- `ext.requiredElement?` — 需要的元素属性
- `ext.weaponRestriction?` — 武器类别限制（仅斗技）
- `ext.isUltimate?` — 是否为终极技

#### Scenario: 火球术是法技类物品

- **WHEN** 查询"火球术"的物品定义
- **THEN** `category` SHALL 为 `'skill'`
- **AND** `subcategory` SHALL 为 `'magic_skill'`
- **AND** `tags` SHALL 包含 `'instant'`（瞬发）和 `'aoe'`（范围伤害）
- **AND** `ext.requiredElement` SHALL 为 `'fire'`

#### Scenario: 旋风斩是斗技类物品

- **WHEN** 查询"旋风斩"的物品定义
- **THEN** `category` SHALL 为 `'skill'`
- **AND** `subcategory` SHALL 为 `'combat_skill'`
- **AND** `ext.weaponRestriction` SHALL 为 `'sword'`（仅剑类武器可用）

### Requirement: 技能槽位由装备中的物品提供

技能不能直接装备到主角的固定槽位。技能 SHALL 装备到功法/武器的动态技能槽位中。功法/武器的 `ext.providesSkillSlots` 决定提供的槽位数，`ext.acceptedSkillTag` 决定接受的技能类型。

#### Scenario: 功法提供法技槽位

- **WHEN** "焚天诀"（`providesSkillSlots=3`, `acceptedSkillTag='magic'`）装备在 `technique_atk_1`
- **THEN** 系统 SHALL 创建 3 个技能槽位（`skill_technique_atk_1_0` ~ `_2`）
- **AND** 这些槽位 SHALL 只接受 `subcategory='magic_skill'` 的技能
- **AND** 物品升级到 `level >= skill.unlockLevel` 时 SHALL 解锁对应槽位

#### Scenario: 武器提供斗技槽位

- **WHEN** "炎龙剑"（`providesSkillSlots=3`, `acceptedSkillTag='combat'`）装备在 `weapon_melee`
- **THEN** 系统 SHALL 创建 3 个技能槽位（`skill_weapon_melee_0` ~ `_2`）
- **AND** 这些槽位 SHALL 只接受 `subcategory='combat_skill'` 的技能

### Requirement: 技能装备操作

技能装备/卸下 SHALL 通过独立的 `equipSkill` / `unequipSkill` 纯函数：

```typescript
function equipSkill(
  inventory: ItemInstance[],
  slots: Record<string, string | null>,
  skillInstanceId: string,
  skillSlotId: string
): { inventory: ItemInstance[]; slots: Record<string, string | null> }

function unequipSkill(
  inventory: ItemInstance[],
  slots: Record<string, string | null>,
  skillSlotId: string
): { inventory: ItemInstance[]; slots: Record<string, string | null> }
```

#### Scenario: 技能装备验证标签匹配

- **WHEN** 尝试将"火球术"（`subcategory='magic_skill'`）装备到 `skill_weapon_melee_0`（`acceptedSkillTag='combat'`）
- **THEN** `equipSkill` SHALL 返回错误 `'技能类型不匹配：法技无法装备到斗技槽'`
- **AND** inventory 和 slots SHALL 保持不变

#### Scenario: 同一个技能不能装备到两个槽位

- **WHEN** "火球术"已装备在 `skill_technique_atk_1_0`
- **AND** 尝试将其也装备到 `skill_technique_atk_2_0`
- **THEN** `equipSkill` SHALL 先将"火球术"从旧槽位卸下
- **AND** 再装备到新槽位

### Requirement: 技能可以升级

技能作为独立的可升级物品，SHALL 支持升级系统。技能升级 SHALL 提升 `power`、降低 `mpCost`，可能解锁额外效果。

#### Scenario: 升级火球术

- **WHEN** "火球术"（`level=1`）消耗经验材料升级到 `level=2`
- **THEN** 其 `power` SHALL 按稀有度乘数增长
- **AND** `mpCost` SHALL 保持不变或略微降低
- **AND** 升级后的效果 SHALL 在战斗计算中体现

### Requirement: 技能可独立获取和交易

技能作为物品 SHALL 可以通过商店购买、怪物掉落、任务奖励、制作等方式获得。技能 SHALL 可以像其他物品一样出现在背包中。

#### Scenario: 商店出售技能书

- **WHEN** 商店配置中包含 `templateId='fireball_skill'`
- **THEN** 玩家可以购买"火球术"技能物品
- **AND** 购买后出现在背包中（`inventory` 中新增一个 `category=skill` 的 ItemInstance）
- **AND** 价格由技能稀有度决定

## MODIFIED Requirements

### Requirement: 移除功法/装备的内置技能

`Technique` 和 `Equipment` 旧类型中的以下字段 SHALL 被移除：
- `Technique.allSkills: TechniqueSkill[]`
- `Technique.equippedSkills: (string | null)[]`
- `Equipment.allTechniques: WeaponTechnique[]`
- `Equipment.equippedTechniques: (string | null)[]`

功法/装备的模板 SHALL 改为声明 `ext.providesSkillSlots`（槽位数量）和 `ext.acceptedSkillTag`（接受的技能标签）。

#### Scenario: 旧的 allSkills 字段已移除

- **WHEN** 搜索 `src/` 中的 `allSkills`、`allTechniques` 字段
- **THEN** SHALL NOT 找到作为物品属性定义的旧字段
- **AND** 技能 SHALL 通过背包中的 `category=skill` 物品管理
