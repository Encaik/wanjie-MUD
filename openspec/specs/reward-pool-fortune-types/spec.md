# reward-pool-fortune-types

在现有 5 个主题机缘基础上，新增 5 个专项机缘类型，与现有主题并存。

## 新增机缘类型

| ID | 名称 | 描述 | 最低等级 | 难度 |
|----|------|------|----------|------|
| `weapon_armory` | 武器库 | 远古兵器库，只产出武器。适合收集神兵利器的修炼者。 | 15 | ★★ |
| `skill_sanctum` | 技阁 | 封存上古技能的密室，只产出技能书。 | 15 | ★★ |
| `treasury` | 金库 | 灵气凝结的宝库，大量产出灵石与稀有货币。 | 10 | ★ |
| `scriptorium` | 经阁 | 藏经之所，只产出功法卷轴。 | 20 | ★★★ |
| `forge` | 锻炉 | 地火锻炉遗迹，大量产出锻造材料与碎片。 | 10 | ★ |

## 与现有主题的关系

```
主题机缘（多样化体验）         专项机缘（定向 farming）
─────────────────────        ─────────────────────
spirit_vein (灵矿脉)          treasury (金库) — 更极端的货币侧重
ancient_battlefield (古战场)  weapon_armory (武器库) — 纯武器
herb_valley (药谷)            forge (锻炉) — 纯材料
mystic_realm (秘境)           skill_sanctum (技阁) — 纯技能
demon_abyss (魔渊)            scriptorium (经阁) — 纯功法
```

## 各机缘类型绑定的奖励池

每个机缘类型的每种节点类型绑定一个 poolId：

| 机缘类型 | 节点类型 | poolId |
|----------|----------|--------|
| weapon_armory | enemy/elite/miniboss | `fortune_weapon_armory_combat` |
| weapon_armory | treasure/herb/scroll | `fortune_weapon_armory_resource` |
| weapon_armory | guardian | `fortune_weapon_armory_guardian` |
| skill_sanctum | enemy/elite/miniboss | `fortune_skill_sanctum_combat` |
| skill_sanctum | treasure/herb/scroll | `fortune_skill_sanctum_resource` |
| treasury | enemy/elite | `fortune_treasury_combat` |
| treasury | mineral_vein/treasure | `fortune_treasury_resource` |
| scriptorium | 全部战斗节点 | `fortune_scriptorium_combat` |
| scriptorium | 全部资源节点 | `fortune_scriptorium_resource` |
| forge | 全部战斗节点 | `fortune_forge_combat` |
| forge | 全部资源节点 | `fortune_forge_resource` |

## 池子定义要点

- **武器库池**：FilterEntry `{ category: 'equipment', subcategory: ['weapon_melee', 'weapon_ranged'] }`，稀有度偏斜到 rare+
- **技阁池**：FilterEntry `{ category: 'skill' }`
- **金库池**：CurrencyEntry 权重 60%，FilterEntry 40%，高灵石产出
- **经阁池**：FilterEntry `{ category: 'technique' }`，稀有度偏斜到 epic+
- **锻炉池**：FilterEntry `{ category: 'material' }` + 碎片 CurrencyEntry

## fortuneTypeConfig 扩展

在 `FORTUNE_TYPE_CONFIGS` 中新增 5 个配置条目，遵循现有 `FortuneTypeConfigEntry` 接口：

- `terrainDistribution`：专项机缘的地形偏向（武器库偏 cave/ruins，技阁偏 ruins，金库偏 cave，经阁偏 ruins，锻炉偏 cave/cliff）
- `nodeTypeWeights`：专项机缘的节点分布（减少 event/merchant，增加 treasure/mineral_vein/scroll_fragment）
- `rewardBonuses`：专项机缘对应的奖励类别侧重
