# combat-engine

## ADDED Requirements

### Requirement: 事件驱动战斗引擎消费核心值

战斗引擎 SHALL 消费 CoreStatValues（maxHp/physicalATK/specialATK/physicalDEF/specialDEF/speed），不依赖旧属性系统。战斗 SHALL 是事件驱动的：每次循环 = 一次行动事件，不维护全局 tick。

#### Scenario: 物理伤害计算

- **WHEN** 攻击方 physicalATK=15, 防御方 physicalDEF=8, level=5, power=40
- **THEN** damage = floor(((2×5+10)/250 × (15/8) × 40 + 2) × random)

### Requirement: 速度衰减决定出手权

每次行动后行动方的有效速度 SHALL 乘以 DECAY（默认 0.5）。对方行动后，行动方的有效速度 SHALL 恢复为原始值。速度比较使用当前有效值。

#### Scenario: 速度相近方基本交替

- **WHEN** A.speed=10, B.speed=5
- **THEN** A 先动→A有效速度衰减为5→与B相等→平局时刚动过的一方让给对方
- **THEN** 双方大致交替行动，A 每3-5轮可多抢一次

#### Scenario: 速度碾压方连续行动

- **WHEN** A.speed=100000, B.speed=10000
- **THEN** A 可连续行动 3-4 次（100k→50k→25k→12.5k），直到衰减到低于对方
- **THEN** PITY_MAX=4 触发后强制给对方

#### Scenario: 高速同比例差距更大

- **WHEN** A.speed=100000, B.speed=50000
- **THEN** A 连抢频率高于 10:5 场景（因为绝对差值放大衰减后的差距）

### Requirement: 保底机制防止无限等待

当同一方连续行动次数达到 PITY_MAX（默认4）时 SHALL 强制切换给对方行动，并重置双方速度为原始值。

#### Scenario: 保底触发

- **WHEN** A 已连续行动 4 次
- **THEN** 第5次强制给 B，双方 speed 恢复原始值，consecutiveCount 归零

### Requirement: 开场类型修正

ambush 时攻击方首轮强制先手（无视速度比较）。surprise 时攻击方速度×1.5。defense 时防御方血量临时×1.1。

#### Scenario: ambush 先手

- **WHEN** 开场类型为 ambush
- **THEN** 攻击方首轮先于防御方出手，即使 speed 更低

### Requirement: 行动次数上限

总行动次数达到 ACTION_CAP（默认50）时 SHALL 终止战斗，按剩余血量比例判定胜负。

#### Scenario: 上限触发

- **WHEN** 总行动次数达到 50
- **THEN** 比较双方当前 HP 占总 HP 比例，比例高者胜出

### Requirement: 技能冷却按自身行动次数

技能使用后进入冷却（CD=N次自身行动）。每次自身行动时 SHALL 将 currentCooldown 减1（最低0）。不与速度挂钩。

#### Scenario: CD冷却

- **WHEN** 技能 CD=3 使用后
- **THEN** 该单位需再行动 3 次后技能才可用

### Requirement: 装备修正应用

战斗开始前 SHALL 应用装备/功法的 flat 和 multiplier 修正到核心值。条件修正（first_round/hp_below_50/hp_below_25）在每次条件变化时重新评估。
