# 数值策划文档 - 万界修行录

## 一、核心设计原则

### 1.1 战斗平衡目标
- **禁止一击必杀**：高等级玩家对低等级敌人不能一回合秒杀
- **等级差距限制**：等级差距带来的伤害/防御加成有上限
- **战斗节奏控制**：普通敌人2-3回合，精英3-5回合，Boss5-8回合

### 1.2 数值成长原则
- **指数增长**：玩家和敌人属性按等级指数增长
- **边际递减**：高等级时属性提升相对减缓
- **战力压缩**：控制战力差距在可控范围内

---

## 二、伤害公式设计

### 2.1 基础伤害公式

```
基础伤害 = 攻击力 × 技能系数
实际伤害 = 基础伤害 × (100 / (100 + 防御力)) × 等级修正 × 随机浮动
```

### 2.2 等级修正公式

当前实现（balanceConfig.ts）：
```typescript
// 等级差距对伤害的影响系数
levelDiffDamageFactor: 0.02  // 每级差距影响2%伤害
maxLevelDiffModifier: 0.6    // 最大修正±60%
```

**问题**：60%的修正不足以防止一击必杀

**优化方案**：
```typescript
// 等级差距修正（新）
levelDiffDamageFactor: 0.03   // 每级差距影响3%伤害
maxLevelDiffModifier: 0.75    // 最大修正±75%

// 额外限制：高等级对低等级的伤害衰减
minimumDamageRatio: 0.15      // 最低造成15%基础伤害
```

### 2.3 伤害下限机制

防止一击必杀的关键：**强制伤害下限**

```typescript
// 计算实际伤害时
let actualDamage = baseDamage * defenseReduction * levelModifier * randomVariance;

// 伤害下限：至少造成基础伤害的15%
const minimumDamage = baseDamage * 0.15;
actualDamage = Math.max(actualDamage, minimumDamage);

// 但对于Boss等特殊敌人，伤害下限可适当提高
const bossMinimumDamage = baseDamage * 0.25;
```

---

## 三、敌人属性成长曲线

### 3.1 敌人分级系数

| 敌人类型 | HP倍率 | 攻击倍率 | 防御倍率 | 经验倍率 |
|---------|--------|---------|---------|---------|
| 普通    | 0.80   | 0.90    | 0.85    | 1.0     |
| 精英    | 1.20   | 1.30    | 1.20    | 2.0     |
| 小Boss  | 1.80   | 1.70    | 1.60    | 4.0     |
| Boss    | 3.00   | 2.50    | 2.20    | 8.0     |

### 3.2 等级成长因子

```typescript
function getEnemyLevelFactor(level: number): number {
  return 1 + Math.max(0, (level - 20) / 60);
}
```

| 等级 | 成长因子 |
|-----|---------|
| 20  | 1.00    |
| 40  | 1.33    |
| 60  | 1.67    |
| 80  | 2.00    |
| 100 | 2.33    |

---

## 四、战斗回合控制

### 4.1 目标回合数

| 敌人类型 | 最小回合 | 最大回合 | 理想回合 |
|---------|---------|---------|---------|
| 普通    | 1       | 3       | 2       |
| 精英    | 2       | 4       | 3       |
| 小Boss  | 3       | 5       | 4       |
| Boss    | 5       | 8       | 6       |

### 4.2 回合控制机制

```typescript
// 计算敌人HP时，确保需要足够的回合才能击败
const targetRounds = {
  normal: 2,
  elite: 3,
  miniboss: 4,
  boss: 6
};

// 敌人HP = 玩家平均伤害 × 目标回合 × 安全系数
const enemyHp = playerAvgDamage * targetRounds[type] * 1.1;
```

---

## 五、战力计算公式

### 5.1 玩家战力

```typescript
战力 = (HP × 0.5 + 攻击力 × 3 + 防御力 × 2) × 等级系数
等级系数 = 1 + (等级 - 1) × 0.05
```

### 5.2 敌人战力

```typescript
战力 = (HP × 0.3 + 攻击力 × 4 + 防御力 × 1.5) × 敌人等级系数
敌人等级系数 = 1 + (等级 - 1) × 0.03
```

### 5.3 战力比值与胜负概率

| 战力比 | 胜率 | 平均损失HP |
|-------|-----|-----------|
| 0.5   | 10% | 90%       |
| 0.7   | 30% | 70%       |
| 0.9   | 50% | 50%       |
| 1.0   | 60% | 40%       |
| 1.2   | 75% | 30%       |
| 1.5   | 90% | 20%       |
| 2.0   | 99% | 10%       |

---

## 六、伤害上限机制

### 6.1 单次伤害上限

```typescript
// 玩家对敌人的最大伤害（防止一击必杀）
const maxDamageToEnemy = enemyMaxHp * 0.6; // 最多造成敌人60%HP的伤害

// 敌人对玩家的最大伤害（防止被秒杀）
const maxDamageToPlayer = playerMaxHp * 0.5; // 最多造成玩家50%HP的伤害
```

### 6.2 例外情况

- Boss战：允许单次造成更高伤害（最高80%）
- 暴击：可以在上限基础上提高20%
- 技能连击：每次攻击独立计算上限

---

## 七、实现建议

### 7.1 修改 balanceConfig.ts

```typescript
export const COMBAT_CONFIG = {
  // ... 现有配置
  
  /** 等级差距对伤害的影响系数（加强） */
  levelDiffDamageFactor: 0.03,
  /** 最大等级差距伤害修正（扩大） */
  maxLevelDiffModifier: 0.75,
  
  /** 单次伤害占目标HP的上限 */
  maxDamageRatioToHp: 0.6,
  /** 暴击时的伤害上限修正 */
  critDamageRatioModifier: 1.2,
  
  /** 最低伤害比例（防止伤害过低） */
  minimumDamageRatio: 0.15,
};
```

### 7.2 修改战斗计算函数

在 `calculateBattleWithLogs` 函数中添加伤害上限检查：

```typescript
// 计算伤害后
let damage = calculateDamage(attacker, defender);

// 应用伤害上限
const maxDamage = defender.maxHp * COMBAT_CONFIG.maxDamageRatioToHp;
damage = Math.min(damage, maxDamage);

// 应用伤害下限
const minDamage = attacker.attack * COMBAT_CONFIG.minimumDamageRatio;
damage = Math.max(damage, minDamage);
```

---

## 八、数值测试用例

### 8.1 测试场景1：等级差距10级

- 玩家：等级40，攻击力200，防御力100
- 敌人：等级30，HP 800，攻击力120，防御力60

预期结果：
- 等级差距修正：-30%（玩家高10级，伤害降低）
- 单次伤害上限：800 × 0.6 = 480
- 预计击败回合：3-4回合

### 8.2 测试场景2：Boss战

- 玩家：等级50，攻击力300，防御力150
- Boss：等级55，HP 3000，攻击力250，防御力100

预期结果：
- 等级差距修正：+15%（Boss高5级，伤害提高）
- 玩家单次伤害：约200-250
- 预计击败回合：12-15回合（符合Boss战设计）

---

## 九、附录：配置参数汇总

| 参数名 | 当前值 | 建议值 | 说明 |
|-------|-------|-------|-----|
| levelDiffDamageFactor | 0.02 | 0.03 | 等级差距影响系数 |
| maxLevelDiffModifier | 0.60 | 0.75 | 等级差距最大修正 |
| maxDamageRatioToHp | - | 0.60 | 单次伤害占HP上限 |
| minimumDamageRatio | - | 0.15 | 最低伤害比例 |
| defenseReductionFactor | 100 | 100 | 防御减伤因子 |
| critDamageMultiplier | 1.5 | 1.5 | 暴击伤害倍率 |
