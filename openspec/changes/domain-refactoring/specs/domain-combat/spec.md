## ADDED Requirements

### Requirement: 回合制战斗引擎
战斗域 SHALL 提供完整的回合制战斗系统。

#### Scenario: 战斗初始化
- **WHEN** 进入战斗（秘境遭遇敌人、历练事件、爬塔）
- **THEN** 创建战斗实例，初始化敌我双方属性、状态

#### Scenario: 回合执行
- **WHEN** 玩家选择行动（攻击/技能/防御/逃跑）
- **THEN** 执行回合：玩家行动 → 敌方行动 → 结算伤害 → 检查胜负

#### Scenario: 战斗胜利
- **WHEN** 敌方 HP 降至 0
- **THEN** 战斗结束，结算经验、掉落、碎片奖励

#### Scenario: 战斗失败
- **WHEN** 玩家 HP 降至 0
- **THEN** 战斗结束，玩家 HP 恢复至 30%，触发心境下降

#### Scenario: 逃跑
- **WHEN** 玩家选择逃跑且判定成功
- **THEN** 战斗结束，无奖励，保留当前 HP

### Requirement: 手动/自动战斗
战斗域 SHALL 支持手动操作和自动战斗两种模式。

#### Scenario: 自动战斗
- **WHEN** 开启自动战斗模式
- **THEN** AI 自动选择行动，每回合快速执行，直到战斗结束

#### Scenario: 切换模式
- **WHEN** 战斗中切换手动/自动模式
- **THEN** 立即切换，当前回合继续执行

### Requirement: 敌人系统
战斗域 SHALL 管理敌人的生成、属性和 AI。

#### Scenario: 敌人生成
- **WHEN** 触发战斗事件
- **THEN** 根据玩家等级、敌人类型（normal/elite/miniboss/boss）、世界类型生成敌人属性

#### Scenario: 敌人 AI 决策
- **WHEN** 敌人回合
- **THEN** 根据 AI 权重选择行动（普通攻击/技能/防御），权重受敌人类型和 HP 状态影响

#### Scenario: 敌人等级压制
- **WHEN** 敌人等级高于玩家
- **THEN** 敌人获得额外属性加成（等级压制）

### Requirement: 技能克制系统
战斗域 SHALL 提供元素属性之间的克制关系。

#### Scenario: 属性克制
- **WHEN** 攻击方元素克制防御方元素
- **THEN** 伤害乘以克制系数（如 1.5x）

#### Scenario: 属性被克
- **WHEN** 攻击方元素被防御方元素克制
- **THEN** 伤害乘以被克系数（如 0.7x）

### Requirement: 战斗日志
战斗域 SHALL 记录并展示完整战斗过程。

#### Scenario: 战斗日志生成
- **WHEN** 每回合结算完成
- **THEN** 生成一条战斗日志（攻击者、行动类型、伤害值、剩余HP）

#### Scenario: 战斗结果展示
- **WHEN** 战斗结束
- **THEN** 展示战斗结果弹窗，包含胜负、奖励、关键回合日志

### Requirement: 域状态切片
战斗域 SHALL 拥有独立的状态切片 `CombatSlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `CombatSlice` 类型
- **THEN** 包含 `battleState`（回放用）、`activeBattle`（交互式战斗）、`autoBattle`（自动模式开关）字段
