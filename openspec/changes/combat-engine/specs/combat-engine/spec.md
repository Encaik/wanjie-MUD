# combat-engine

## ADDED Requirements

### Requirement: 战斗引擎消费核心值

战斗引擎 SHALL 消费 CoreStatValues（maxHp/physicalATK/specialATK/physicalDEF/specialDEF/speed），不依赖旧属性系统。

#### Scenario: 物理伤害计算

- **WHEN** 攻击方 physicalATK=15, 防御方 physicalDEF=8, level=5, power=40
- **THEN** damage = floor(((2×5+10)/250 × (15/8) × 40 + 2) × random)

### Requirement: 速度决定出手权

速度最高的单位 SHALL 先出手。开场类型 ambush 时攻击方首轮先手。

#### Scenario: ambush 先手

- **WHEN** 开场类型为 ambush
- **THEN** 攻击方首轮先于所有防御方出手，无视速度
