# 属性系统设计文档

## 一、属性定义与作用

### 1.1 核心属性（CharacterStats）

当前游戏中存在 5 个核心属性，每个属性对应特定的游戏机制：

| 属性名 | 英文键 | 主要作用 | 次要作用 |
|--------|--------|----------|----------|
| 体质 | constitution | 影响生命上限、防御力 | 影响物理攻击力 |
| 灵根 | spiritRoot | 影响法力上限、修行速度 | 影响法术攻击力 |
| 悟性 | insight | 影响功法触发率、技能冷却 | 影响突破成功率 |
| 幸运 | luck | 影响暴击率、闪避率、机缘掉落 | 影响暴击伤害 |
| 意志 | willpower | 影响防御力、心魔抗性 | 影响体力上限 |

### 1.2 属性与世界的对应关系

不同世界的属性名称需要统一映射到核心属性：

| 世界类型 | 体质 | 灵根 | 悟性 | 幸运 | 意志 |
|----------|------|------|------|------|------|
| 修仙 | 肉身强度 | 灵根 | 悟性 | 气运 | 道心 |
| 高武 | 肉身强度 | 内力 | 悟性 | 气运 | 武道意志 |
| 魔法 | 体魄 | 魔力亲和 | 感知 | 幸运 | 精神力 |
| 科幻 | 身体素质 | 精神力 | 智力 | 运势 | 意志力 |

## 二、属性效果详细设计

### 2.1 体质（肉身强度）

**影响范围：**
1. **生命上限**：每点体质增加 X 点最大生命值（根据世界不同）
2. **物理防御**：每点体质增加 Y 点物理防御
3. **物理攻击**：每点体质增加 Z 点物理攻击（体修加成更高）
4. **体力恢复速度**：每 10 点体质增加 5% 体力恢复速度

**计算公式：**
```typescript
maxHp = worldBaseHp + constitution * hpPerConstitution + level * hpPerLevel
physicalDefense = worldBaseDefense + willpower * defensePerWillpower + constitution * 0.3
physicalAttack = worldBaseAttack + constitution * attackPerConstitution + spiritRoot * attackPerSpiritRoot
```

### 2.2 灵根（内力/魔力亲和）

**影响范围：**
1. **法力上限**：每点灵根增加 X 点最大法力值
2. **修行速度**：每点灵根增加 Y% 修炼经验获取
3. **法术攻击**：每点灵根增加 Z 点法术攻击
4. **功法威力**：每点灵根增加 W% 功法伤害加成

**计算公式：**
```typescript
maxMp = baseMp + spiritRoot * mpPerSpiritRoot + level * mpPerLevel
cultivationExpBonus = 1 + spiritRoot * 0.02 // 每点灵根增加2%修炼速度
spellPower = spiritRoot * 1.5 // 法术攻击力
```

### 2.3 悟性（感知/智力）

**影响范围：**
1. **功法触发率**：每点悟性增加 X% 功法触发概率
2. **技能冷却缩减**：每 10 点悟性减少 Y% 技能冷却
3. **突破成功率**：每点悟性增加 Z% 突破成功率
4. **学习速度**：影响功法升级所需经验

**计算公式：**
```typescript
techniqueTriggerRate = baseRate + insight * 0.01 // 每点悟性增加1%触发率
cooldownReduction = Math.floor(insight / 10) * 0.03 // 每10点悟性减少3%冷却
breakthroughBonus = insight * 0.5 // 每点悟性增加0.5%突破率
techniqueExpRequired = baseExp * (1 - insight * 0.01) // 悟性减少升级所需经验
```

### 2.4 幸运（气运/运势）

**影响范围：**
1. **暴击率**：每点幸运增加 X% 暴击概率
2. **闪避率**：每点幸运增加 Y% 闪避概率
3. **掉落率**：每点幸运增加 Z% 稀有物品掉落概率
4. **暴击伤害**：每 10 点幸运增加 W% 暴击伤害

**计算公式：**
```typescript
critRate = baseCritRate + luck * critRatePerLuck // 基础5% + 每点0.5%
dodgeRate = baseDodgeRate + luck * dodgeRatePerLuck // 基础3% + 每点0.3%
dropRateBonus = luck * 0.02 // 每点幸运增加2%掉落率
critDamage = baseCritDamage + Math.floor(luck / 10) * 0.05 // 每10点增加5%暴伤
```

### 2.5 意志（道心/精神力）

**影响范围：**
1. **物理防御**：每点意志增加 X 点物理防御
2. **心魔抗性**：每点意志增加 Y% 心魔抗性
3. **状态抵抗**：每点意志减少 Z% 负面状态持续时间
4. **体力上限**：每 10 点意志增加 W 点体力上限

**计算公式：**
```typescript
physicalDefense = baseDefense + willpower * defensePerWillpower
heartDemonResistance = willpower * 0.02 // 每点意志增加2%心魔抗性
statusDurationReduction = willpower * 0.01 // 每点意志减少1%负面状态时长
maxStamina = baseStamina + Math.floor(willpower / 10) * 5 // 每10点意志增加5点体力
```

## 三、流派与属性的深度关联

### 3.1 流派属性侧重

每个流派有主属性和副属性，选择流派后获得加成：

| 流派 | 主属性 | 副属性 | 主属性效果+20% | 副属性效果+10% |
|------|--------|--------|----------------|----------------|
| 体修 | 体质 | 意志 | HP、防御、体力 | 防御、心魔抗性 |
| 剑修 | 灵根 | 悟性 | 法力、修行速度 | 功法触发、突破 |
| 法修 | 灵根 | 悟性 | 法力、法术攻击 | 功法触发、冷却 |
| 丹修 | 悟性 | 幸运 | 炼丹效果、突破 | 暴击、掉落 |
| 魔修 | 体质 | 幸运 | HP、攻击 | 暴击、掉落 |

### 3.2 流派升级机制

**流派经验获取：**
- 修炼时获得流派经验 = 修炼经验 × 流派经验系数
- 战斗胜利时获得流派经验 = 敌人等级 × 0.5
- 使用流派相关功法时额外获得流派经验

**流派等级效果：**
- 每 1 级流派等级：主属性 +2，副属性 +1
- 每 5 级流派等级：解锁一个流派技能
- 满 10 级流派等级：解锁终极能力

### 3.3 流派技能实现

```typescript
interface PathSkillEffect {
  type: 'stat_bonus' | 'multiplier' | 'special';
  stat?: keyof CharacterStats;
  value?: number;
  specialId?: string;
}

function applyPathSkill(
  protagonist: Protagonist,
  skill: PathSkill
): Protagonist {
  // 应用技能效果到主角
}
```

## 四、丹药系统改进

### 4.1 境界限制

丹药需要设置适用的大境界：

```typescript
interface PillRealmRestriction {
  minRealm: string;  // 最低境界（如"炼气"）
  maxRealm: string;  // 最高境界（如"筑基"）
}

const REALM_ORDER = [
  '凡人', '炼气', '筑基', '金丹', '元婴', 
  '化神', '炼虚', '合体', '大乘', '渡劫'
];
```

### 4.2 使用效果

| 情况 | 效果 |
|------|------|
| 境界匹配 | 正常效果 |
| 境界过低（丹药高于玩家） | 效果减半，有 30% 概率获得负面效果（属性-1~3） |
| 境界过高（丹药低于玩家） | 效果仅 10%，无负面效果 |

### 4.3 负面效果定义

```typescript
interface PillSideEffect {
  type: 'stat_reduction' | 'hp_loss' | 'mp_loss' | 'debuff';
  stat?: keyof CharacterStats;
  value: number;
  duration?: number;
}
```

## 五、战力计算修正

### 5.1 当前问题

当前战力计算包含了所有功法和装备，包括背包中未装备的。

### 5.2 修正方案

**只计算已装备的物品：**
1. 已装备的功法（`equippedAttackTechniques` + `equippedDefenseTechniques`）
2. 已装备的装备（`equippedMelee`、`equippedBody` 等）

**不计算背包中的物品：**
1. `techniques` 数组中未装备的功法
2. `equipments` 数组中未装备的装备

### 5.3 修正后的计算

```typescript
function calculatePlayerCombatPower(protagonist: Protagonist): number {
  // 只获取已装备的功法
  const equippedTechniques = [
    ...protagonist.equippedAttackTechniques,
    ...protagonist.equippedDefenseTechniques
  ].filter((t): t is Technique => t !== null);
  
  // 只获取已装备的装备
  const equippedEquipments = [
    protagonist.equippedMelee,
    protagonist.equippedRanged,
    protagonist.equippedHead,
    protagonist.equippedBody,
    protagonist.equippedLegs,
    protagonist.equippedFeet
  ].filter((e): e is Equipment => e !== null);
  
  // 使用修正后的列表计算战力
  // ...
}
```

## 六、扫荡收益调整

### 6.1 当前问题

扫荡奖励过高，约 20% 敌人 + 10% 宝箱 + Boss，导致收益远超正常机缘。

### 6.2 调整方案

| 调整项 | 原值 | 新值 | 说明 |
|--------|------|------|------|
| 敌人数量 | 20% 格子 | 10% 格子 | 减半 |
| 宝箱数量 | 10% 格子 | 5% 格子 | 减半 |
| 经验倍率 | 1.0 | 0.5 | 减半 |
| 灵石倍率 | 1.0 | 0.5 | 减半 |
| 物品掉落率 | 15% | 8% | 大幅降低 |
| Boss 掉落 | 必定 2 个突破丹 | 必定 1 个 | 减半 |
| 功法/装备掉落 | 50% | 20% | 大幅降低 |
| 属性提升 | 1-3 点 | 0-1 点 | 大幅降低 |

### 6.3 扫荡定位

扫荡应该是"快速获取基础资源"的方式，而不是"高收益捷径"：
- 适合：快速消耗体力获取基础资源
- 不适合：替代正常机缘获取稀有物品

## 七、实现优先级

1. **P0 - 必须立即修复**
   - 战力计算修正（只计算已装备）
   - 扫荡收益下调

2. **P1 - 核心功能**
   - 流派系统完善（选择效果、升级机制）
   - 丹药境界限制

3. **P2 - 增强功能**
   - 属性效果实现
   - 心魔系统
   - 更多流派技能

---

*文档版本：v1.0*
*最后更新：2024年*
