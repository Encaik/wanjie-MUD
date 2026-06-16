# 统一物品系统

## 概述

统一物品系统（`modules/item/`）将所有可拥有、可使用、可装备、可消耗、可升级的游戏实体统一为 `Item` 体系，替代之前分散在 `equipment/`、`techniques/`、`economy/`、`crafting/` 的独立管理。

## 功能需求

### FR-1: 物品模板系统

物品分为七大品类，每种品类有独立模板定义：

- **货币** (`currency`) — 灵石等通用货币，高堆叠
- **消耗品** (`consumable`) — 丹药、卷轴等可使用的物品
- **材料** (`material`) — 草药、矿石、经验材料等
- **装备** (`equipment`) — 武器/防具，提供属性加成
- **功法** (`technique`) — 修炼功法，提供修炼加成
- **技能** (`skill`) — 战斗技能，提供战斗效果
- **碎片** (`fragment`) — 物品碎片，用于合成完整物品

### FR-2: 物品实例管理

- 从模板生成实例 (`generateItemInstance`)
- 添加/移除物品 (`addItem`/`removeItem`)
- 查询物品（按模板ID、实例ID、品类）
- 获取货币数量 (`getCurrencyAmount`)
- 检查数量是否足够 (`hasEnough`)

### FR-3: 槽位装备系统

- 三种独立的槽位类型：装备槽×6、功法槽×3、技能槽×6
- 槽位之间无父子依赖关系
- 装备物品到槽位 (`equipItem`) — 自动卸载该槽位旧物品
- 从槽位卸载物品 (`unequipItem`)
- 装备技能到技能槽 (`equipSkill`)
- 卸载技能 (`unequipSkill`)

### FR-4: 物品升级系统

- 消耗材料提升物品等级 (`upgradeItem`)
- 升级增加物品属性数值
- 满级时不可升级

### FR-5: 碎片合成系统

- 物品可拆解为碎片 (`fragmentItem`)
- 指定数量碎片可合成为完整物品 (`synthesizeFragments`)
- 合成所需碎片数量由物品稀有度决定

### FR-6: 消耗品使用

- 使用消耗品产生效果 (`useConsumable`)
- 效果包括：恢复HP/MP、属性提升、buff/debuff

### FR-7: 物品生成

- 随机稀有度掉落 (`generateRandomDrop`)
- 词缀系统 (`ItemAffix`) — 前缀/后缀随机附加

## 类型定义

### 物品职责分离

| 品类 | 职责 | 影响系统 |
|------|------|----------|
| equipment | 提供属性加成（攻击/防御/HP/MP/速度） | 计算引擎 (core/calculation) |
| technique | 提供修炼加成（修炼速度/突破/灵力） | 修炼系统 (progression) |
| skill | 提供战斗效果（伤害/治疗/buff/debuff/shield） | 战斗系统 (combat) |

### 槽位定义

| 类别 | 槽位 ID | 数量 | 接受品类 |
|------|---------|------|----------|
| 装备 | weapon_melee, weapon_ranged, armor_head, armor_body, armor_legs, armor_feet | 6 | equipment |
| 功法 | technique_1, technique_2, technique_3 | 3 | technique |
| 技能 | skill_1 ~ skill_6 | 6 | skill |

## 与旧系统的区别

- 装备/功法/技能不再有"技能子槽"父子关系
- 功法不再区分攻击型/防御型（统一为 technique）
- `Protagonist` 只用 `items[]` + `slots{}` 管理所有物品，废弃 `equipments[]`、`techniques[]`、`inventory[]` 等字段
