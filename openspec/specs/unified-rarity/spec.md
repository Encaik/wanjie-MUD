# unified-rarity

## Purpose

统一项目中所有物品的稀有度体系为六等制 `common → uncommon → rare → epic → legendary → mythic`（凡品→精良→稀有→史诗→传说→神话），使用英文 key 作为代码和存储标识，替代当前并存的 `ItemRarity`（中文5级）、`Quality`（英文8级）、`QualityTier`（enum 英文）三套体系。

## ADDED Requirements

### Requirement: 六等唯一稀有度

系统 SHALL 提供六等稀有度，英文 key 在代码和存储中使用，中文显示名通过元数据获取：

| Key | 中文名 | 颜色 | 掉落权重 |
|-----|--------|------|---------|
| `common` | 凡品 | #9CA3AF (灰) | 50% |
| `uncommon` | 精良 | #22C55E (绿) | 25% |
| `rare` | 稀有 | #3B82F6 (蓝) | 15% |
| `epic` | 史诗 | #8B5CF6 (紫) | 7% |
| `legendary` | 传说 | #F97316 (橙) | 2.5% |
| `mythic` | 神话 | #EF4444 (红) | 0.5% |

#### Scenario: 稀有度英文 key 用于存储

- **WHEN** 物品实例存储到 JSON/数据库
- **THEN** 其 `rarity` 字段 SHALL 为英文 key（如 `"epic"`）
- **AND** SHALL NOT 存储中文值（如 `"史诗"`）

#### Scenario: 稀有度中文名用于 UI

- **WHEN** UI 需要显示物品稀有度
- **THEN** SHALL 通过 `RARITY_META[item.rarity].displayName` 获取 `"史诗"`
- **AND** SHALL 使用 `RARITY_META[item.rarity].color` 设置颜色

### Requirement: 稀有度决定游戏机制参数

稀有度 SHALL 统一决定以下游戏机制参数：

| 参数 | common | uncommon | rare | epic | legendary | mythic |
|------|--------|----------|------|------|-----------|--------|
| maxLevel | 3 | 5 | 7 | 8 | 9 | 10 |
| skillSlots | 1 | 1 | 2 | 2 | 3 | 3 |
| fragmentsRequired | 3 | 4 | 6 | 8 | 10 | 12 |
| basePrice | 100 | 500 | 2000 | 8000 | 30000 | 100000 |
| affixCount | 0 | 1 | 1 | 2 | 2 | 3 |

#### Scenario: 传说物品有 3 个技能槽

- **WHEN** 生成一件 `rarity=legendary` 的功法
- **THEN** 其 `maxSkillSlots` SHALL 为 `3`
- **AND** `maxLevel` SHALL 为 `9`

#### Scenario: 凡品物品没有词缀

- **WHEN** 生成一件 `rarity=common` 的装备
- **THEN** 其 `affixes` SHALL 为空数组

### Requirement: 稀有度掉落权重

掉落系统 SHALL 使用统一稀有度的权重表计算掉落稀有度。玩家幸运值 SHALL 影响权重分布（增加高稀有度权重）但不影响稀有度上限。

#### Scenario: Boss 掉落有稀有度上限

- **WHEN** 等级 20 的 Boss 掉落装备
- **THEN** 掉落稀有度上限 SHALL 为 `epic`（史诗）
- **AND** 实际稀有度由权重随机决定
- **AND** SHALL NOT 产生 `legendary` 或 `mythic` 掉落（即使权重 > 0 也被上限裁剪）

#### Scenario: 玩家幸运值提升高稀有度概率

- **WHEN** 玩家 `luck=20`（高于基准 8）
- **THEN** 掉落计算时 SHALL 增加 `epic` 和 `legendary` 的权重
- **AND** SHALL NOT 突破稀有度上限

## REMOVED Requirements

### Requirement: 移除旧稀有度体系

以下旧稀有度相关类型和常量 SHALL 被移除：
- `ItemRarity` 类型（`'普通' | '稀有' | '史诗' | '传说' | '神话'`）
- `Quality` 类型（`'mythic' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common' | 'poor' | 'basic'`）
- `QualityTier` 枚举
- `RARITY_NAMES`、`RARITY_COLORS`、`RARITY_BORDER_COLORS`（`modules/equipment/logic/rarityUtils.ts`）
- `RARITY_STATS`、`RARITY_WEIGHTS`（`modules/equipment/data/equipment.ts`）
- `TECHNIQUE_RARITY_CONFIG`、`EQUIPMENT_RARITY_CONFIG`（`modules/techniques/logic/skillTypes.ts`）
- `RARITY_DAMAGE_MULTIPLIER`（`modules/techniques/data/skillConfigs.ts`）

以上常量 SHALL 合并到 `modules/item/data/rarity.ts` 中的 `RARITY_CONFIG` 统一配置。

#### Scenario: 旧稀有度常量已移除

- **WHEN** 搜索 `src/` 中的 `ItemRarity`、`Quality` 类型定义
- **THEN** SHALL NOT 找到作为`type`/`interface`/`enum`定义的旧稀有度
- **AND** 旧常量 SHALL 被 `modules/item/data/rarity.ts` 中的统一配置替代
