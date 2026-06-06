# 统一数值计算系统迁移评估

## 一、现有计算架构概览

### 1.1 核心计算模块分布

| 模块 | 文件路径 | 职责 | 代码行数 |
|------|---------|------|---------|
| 数值平衡配置 | `src/lib/game/balanceConfig.ts` | 玩家/敌人属性计算、伤害计算、暴击闪避、奖励计算 | ~400行 |
| 战力系统 | `src/lib/game/combatPower.ts` | 玩家/敌人战力计算 | ~200行 |
| 境界系统 | `src/lib/game/realmSystem.ts` | 境界配置、境界倍率 | ~250行 |
| 世界效果 | `src/lib/game/worldEffectSystem.ts` | 危险/机缘效果应用 | ~300行 |
| 战斗系统 | `src/lib/game/battle/*.ts` | 战斗状态管理、技能系统、决策系统 | ~1000行 |
| 功法生成 | `src/lib/game/technique.ts` | 功法生成、升级 | ~200行 |
| 装备生成 | `src/lib/game/equipment.ts` | 装备生成、升级 | ~200行 |
| 类型定义 | `src/lib/game/types.ts` | 核心类型定义 | ~600行 |

### 1.2 计算逻辑依赖图

```
                    ┌─────────────────┐
                    │   types.ts      │ ← 所有模块依赖
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  realmSystem.ts │ │  balanceConfig  │ │ combatPower.ts  │
│   (境界倍率)    │ │   (核心计算)    │ │   (战力计算)    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │                   ▼                   │
         │          ┌─────────────────┐          │
         └─────────►│worldEffectSystem│◄─────────┘
                    │   (世界效果)    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  battle/*.ts    │
                    │   (战斗系统)    │
                    └─────────────────┘
```

---

## 二、模块迁移复杂度评估

### 2.1 评估维度

| 维度 | 说明 | 评分标准 |
|------|------|---------|
| **独立性** | 模块是否可独立运行，不依赖其他业务模块 | 高(3) 中(2) 低(1) |
| **依赖数量** | 被其他模块依赖的数量 | 少(3) 中(2) 多(1) |
| **计算复杂度** | 计算逻辑的复杂程度 | 简单(3) 中等(2) 复杂(1) |
| **数据耦合** | 与外部数据结构的耦合程度 | 松(3) 中(2) 紧(1) |
| **测试覆盖** | 现有测试覆盖情况 | 有(3) 部分(2) 无(1) |

### 2.2 各模块评估结果

#### 模块1: combatPower.ts (战力计算)

| 维度 | 评分 | 说明 |
|------|------|------|
| 独立性 | ⭐⭐⭐ | 纯计算函数，无副作用 |
| 依赖数量 | ⭐⭐⭐ | 仅被UI显示调用，无被依赖 |
| 计算复杂度 | ⭐⭐⭐ | 公式简单清晰 |
| 数据耦合 | ⭐⭐ | 依赖 Protagonist, Technique, Equipment 类型 |
| 测试覆盖 | ⭐ | 无测试 |

**综合评分: 12/15 (优先级: 最高)**

**迁移策略:**
- 创建 `CombatPowerCalculator` 类
- 实现 `calculatePlayerPower()` 方法
- 实现 `calculateEnemyPower()` 方法
- 直接删除 `combatPower.ts`，替换为新计算器调用

**风险: 低**

---

#### 模块2: realmSystem.ts (境界系统)

| 维度 | 评分 | 说明 |
|------|------|------|
| 独立性 | ⭐⭐⭐ | 纯配置+计算，无副作用 |
| 依赖数量 | ⭐⭐ | 被 balanceConfig、UI 调用 |
| 计算复杂度 | ⭐⭐⭐ | 配置映射，无复杂计算 |
| 数据耦合 | ⭐⭐⭐ | 仅依赖 WorldType |
| 测试覆盖 | ⭐ | 无测试 |

**综合评分: 12/15 (优先级: 最高)**

**迁移策略:**
- 已在适配器中实现 `RealmAdapter`
- 创建 `RealmCalculator` 封装境界相关计算
- 直接删除旧代码，替换为新实现

**风险: 低**

---

#### 模块3: technique.ts (功法生成)

| 维度 | 评分 | 说明 |
|------|------|------|
| 独立性 | ⭐⭐⭐ | 纯生成函数，无状态 |
| 依赖数量 | ⭐⭐⭐ | 仅被掉落系统调用 |
| 计算复杂度 | ⭐⭐ | 生成逻辑+稀有度计算 |
| 数据耦合 | ⭐⭐ | 依赖 Technique 类型 |
| 测试覆盖 | ⭐ | 无测试 |

**综合评分: 12/15 (优先级: 高)**

**迁移策略:**
- 功法生成逻辑保持不变（非数值计算）
- 仅迁移功法属性加成计算到 `TechniqueAdapter`
- 生成逻辑保留原位置

**风险: 低**

---

#### 模块4: equipment.ts (装备生成)

| 维度 | 评分 | 说明 |
|------|------|------|
| 独立性 | ⭐⭐⭐ | 纯生成函数，无状态 |
| 依赖数量 | ⭐⭐⭐ | 仅被掉落系统调用 |
| 计算复杂度 | ⭐⭐ | 生成逻辑+稀有度计算 |
| 数据耦合 | ⭐⭐ | 依赖 Equipment 类型 |
| 测试覆盖 | ⭐ | 无测试 |

**综合评分: 12/15 (优先级: 高)**

**迁移策略:**
- 装备生成逻辑保持不变（非数值计算）
- 仅迁移装备属性加成计算到 `EquipmentAdapter`
- 生成逻辑保留原位置

**风险: 低**

---

#### 模块5: worldEffectSystem.ts (世界效果)

| 维度 | 评分 | 说明 |
|------|------|------|
| 独立性 | ⭐⭐ | 效果应用有副作用（修改 protagonist） |
| 依赖数量 | ⭐⭐ | 被战斗、冒险系统调用 |
| 计算复杂度 | ⭐⭐ | 效果叠加逻辑 |
| 数据耦合 | ⭐ | 直接修改 Protagonist 对象 |
| 测试覆盖 | ⭐ | 无测试 |

**综合评分: 8/15 (优先级: 中)**

**迁移策略:**
- 创建 `WorldEffectCalculator` 类
- 将效果应用改为返回计算结果，不直接修改 protagonist
- 已实现 `WorldDangerAdapter` 和 `WorldOpportunityAdapter`
- 删除旧的直接修改逻辑

**风险: 中等** - 需要修改调用方

---

#### 模块6: balanceConfig.ts (核心数值平衡)

| 维度 | 评分 | 说明 |
|------|------|------|
| 独立性 | ⭐⭐ | 纯计算，但被大量模块依赖 |
| 依赖数量 | ⭐ | 被10+模块调用 |
| 计算复杂度 | ⭐⭐ | 多种计算类型，有边界处理 |
| 数据耦合 | ⭐⭐ | 依赖 WorldType, EnemyTier 等类型 |
| 测试覆盖 | ⭐⭐ | 有部分测试 |

**综合评分: 8/15 (优先级: 中)**

**迁移策略:**
- 核心模块，需最后迁移
- 新计算器完全实现后再替换
- 分阶段迁移：
  1. 先迁移伤害计算 `calculateDamage`
  2. 再迁移属性计算 `calculatePlayerMaxHp/Attack/Defense`
  3. 最后迁移奖励计算 `calculateBattleExp/SpiritStones`

**风险: 高** - 被大量模块依赖，需全面测试

---

#### 模块7: battle/*.ts (战斗系统)

| 维度 | 评分 | 说明 |
|------|------|------|
| 独立性 | ⭐ | 与多个系统深度耦合 |
| 依赖数量 | ⭐ | 被冒险系统、UI调用 |
| 计算复杂度 | ⭐ | 复杂状态机+多系统协作 |
| 数据耦合 | ⭐ | 依赖几乎所有类型 |
| 测试覆盖 | ⭐⭐ | 有部分测试 |

**综合评分: 5/15 (优先级: 最低)**

**迁移策略:**
- 必须在所有其他模块迁移完成后迁移
- 战斗系统作为数值计算的消费者
- 替换战斗中的属性获取逻辑为新计算器
- 保持战斗流程不变

**风险: 最高** - 核心游戏流程

---

## 三、迁移顺序规划

### 3.1 迁移阶段划分

```
阶段1 (无风险)          阶段2 (低风险)          阶段3 (中风险)          阶段4 (高风险)
─────────────────      ─────────────────      ─────────────────      ─────────────────
│ combatPower.ts │     │ worldEffectSystem │   │ balanceConfig.ts │   │ battle/*.ts    │
│ realmSystem.ts │ ──► │ (效果计算部分)    │ ──►│ (分步骤迁移)     │ ──►│ (战斗系统)     │
│                 │     │                   │   │                  │   │                │
│ 独立计算模块    │     │ 效果适配器        │   │ 核心数值计算     │   │ 整合验证       │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └────────────────┘
```

### 3.2 详细迁移计划

#### 阶段1: 独立计算模块 (预计工作量: 0.5天)

| 序号 | 模块 | 任务 | 验证方式 |
|------|------|------|---------|
| 1.1 | combatPower.ts | 删除旧代码，创建 CombatPowerCalculator | 对比新旧计算结果 |
| 1.2 | realmSystem.ts | 删除旧代码，使用 RealmAdapter | 验证境界显示正确 |

**迁移代码示例:**

```typescript
// 旧代码 (combatPower.ts)
export function calculatePlayerCombatPower(
  protagonist: Protagonist,
  techniques: Technique[],
  equipments: Equipment[],
  activeEffects: ActiveEffect[]
): number { ... }

// 新代码 (使用统一计算系统)
import { UnifiedCalculator, ContextBuilder } from '@/lib/calculation';

export function calculatePlayerCombatPower(
  protagonist: Protagonist,
  techniques: Technique[],
  equipments: Equipment[],
  activeEffects: ActiveEffect[]
): number {
  const builder = new ContextBuilder();
  builder.setProtagonist(protagonist);
  // ... 构建上下文
  
  const calculator = new UnifiedCalculator();
  const result = calculator.calculateCombatStats(builder.build());
  
  return result.stats.get('power')?.finalValue ?? 0;
}
```

---

#### 阶段2: 效果系统迁移 (预计工作量: 1天)

| 序号 | 模块 | 任务 | 验证方式 |
|------|------|------|---------|
| 2.1 | worldEffectSystem.ts | 分离计算逻辑与副作用 | 单元测试 |
| 2.2 | 世界效果适配器 | 完善 WorldDangerAdapter/WorldOpportunityAdapter | 集成测试 |

**重构策略:**

```typescript
// 旧代码 (直接修改 protagonist)
export function applySingleDanger(
  danger: WorldDanger,
  protagonist: Protagonist
): AppliedEffect {
  // 直接修改属性
  protagonist.stats.growth[statName] += value;
}

// 新代码 (返回计算结果)
export function calculateDangerEffects(
  dangers: WorldDanger[],
  context: CalculationContext
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];
  for (const danger of dangers) {
    effects.push(...WorldDangerAdapter.convert(danger, context));
  }
  return effects;
}

// 应用逻辑分离
export function applyDangerEffects(
  dangers: WorldDanger[],
  protagonist: Protagonist
): AppliedEffect[] {
  // 1. 计算效果
  const effects = calculateDangerEffects(dangers, buildContext(protagonist));
  
  // 2. 应用到主角（副作用集中管理）
  for (const effect of effects) {
    applyEffectToProtagonist(effect, protagonist);
  }
  
  return convertToAppliedEffects(effects);
}
```

---

#### 阶段3: 核心数值计算迁移 (预计工作量: 2天)

| 序号 | 子任务 | 依赖 | 验证方式 |
|------|--------|------|---------|
| 3.1 | 迁移伤害计算 calculateDamage | 无 | 战斗测试 |
| 3.2 | 迁移暴击/闪避计算 | 3.1 | 战斗测试 |
| 3.3 | 迁移玩家属性计算 | 3.2 | 属性面板对比 |
| 3.4 | 迁移敌人属性计算 | 3.3 | 战斗对比测试 |
| 3.5 | 迁移奖励计算 | 3.4 | 奖励对比测试 |

**分步替换策略:**

```typescript
// 步骤1: 创建兼容层
import { calculateDamage as newCalculateDamage } from '@/lib/calculation';
import { calculateDamage as oldCalculateDamage } from './balanceConfig';

export function calculateDamage(
  attack: number,
  defense: number,
  levelDiff: number = 0
): number {
  // 开发环境双计算对比
  if (process.env.NODE_ENV === 'development') {
    const oldResult = oldCalculateDamage(attack, defense, levelDiff);
    const newResult = newCalculateDamage(attack, defense, levelDiff);
    console.assert(
      Math.abs(oldResult - newResult) < 1,
      `Damage mismatch: old=${oldResult}, new=${newResult}`
    );
  }
  
  // 使用新计算
  return newCalculateDamage(attack, defense, levelDiff);
}

// 步骤2: 全量测试通过后删除旧代码
```

---

#### 阶段4: 战斗系统集成 (预计工作量: 1天)

| 序号 | 子任务 | 依赖 | 验证方式 |
|------|--------|------|---------|
| 4.1 | 替换战斗属性获取逻辑 | 3.x | 战斗流程测试 |
| 4.2 | 集成效果计算 | 2.x, 3.x | 全流程测试 |
| 4.3 | 删除旧依赖 | 4.1, 4.2 | 回归测试 |

---

## 四、风险控制

### 4.1 回滚策略

每个阶段完成后:
1. 创建 Git 标签: `migration-phase-N-complete`
2. 保留旧代码（注释而非删除）直到下一阶段验证通过
3. 维护功能开关可快速切换新旧实现

### 4.2 测试检查点

| 检查点 | 验证内容 | 通过标准 |
|--------|---------|---------|
| CP1 | 战力计算一致性 | 新旧结果误差 < 1% |
| CP2 | 境界显示正确性 | 所有境界显示正确 |
| CP3 | 世界效果应用 | 效果叠加计算正确 |
| CP4 | 战斗结果一致性 | 100场战斗结果一致 |
| CP5 | 性能测试 | 计算耗时增加 < 10% |

### 4.3 废弃代码清理

迁移完成后需删除的文件/函数:

```
删除文件:
- src/lib/game/combatPower.ts (迁移后)
- src/lib/game/realmSystem.ts (迁移后)

重构文件:
- src/lib/game/balanceConfig.ts (保留配置常量，删除计算函数)
- src/lib/game/worldEffectSystem.ts (保留效果定义，重构应用逻辑)
```

---

## 五、总结

### 迁移优先级排序

| 优先级 | 模块 | 风险 | 预计工作量 |
|--------|------|------|-----------|
| P0 | combatPower.ts | 低 | 0.5天 |
| P0 | realmSystem.ts | 低 | 0.5天 |
| P1 | technique.ts (属性部分) | 低 | 0.5天 |
| P1 | equipment.ts (属性部分) | 低 | 0.5天 |
| P2 | worldEffectSystem.ts | 中 | 1天 |
| P3 | balanceConfig.ts | 高 | 2天 |
| P4 | battle/*.ts | 最高 | 1天 |

### 总工作量预估

- **开发时间**: 5-6 天
- **测试时间**: 2 天
- **总计**: 1-1.5 周

### 核心原则

1. **从外到内**: 先迁移被依赖少的模块，最后迁移核心模块
2. **计算与副作用分离**: 将纯计算逻辑抽取到新系统
3. **保持接口兼容**: 迁移期间保持函数签名不变
4. **增量验证**: 每个模块迁移后立即验证

---

*文档版本: 1.0*
*创建时间: 2024-01-XX*
*最后更新: 2024-01-XX*
