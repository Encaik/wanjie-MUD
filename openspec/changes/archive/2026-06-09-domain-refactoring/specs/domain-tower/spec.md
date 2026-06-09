## ADDED Requirements

### Requirement: 塔层挑战
爬塔域 SHALL 提供逐层递进的试炼挑战系统。

#### Scenario: 进入爬塔
- **WHEN** 玩家选择进入试炼塔
- **THEN** 从当前最高层开始挑战，每层敌人属性随层数递增

#### Scenario: 通关楼层
- **WHEN** 玩家击败当前层敌人
- **THEN** 解锁下一层，记录最高通关层数

#### Scenario: 战斗失败
- **WHEN** 玩家在塔中被击败
- **THEN** 保留当前最高记录，可使用挂机收益

### Requirement: 挂机收益
爬塔域 SHALL 提供基于最高通关层数的离线挂机收益。

#### Scenario: 计算离线收益
- **WHEN** 系统计算离线奖励时
- **THEN** 基于玩家最高通关层数和离线时长生成经验、灵石奖励

### Requirement: 域状态切片
爬塔域 SHALL 拥有独立的状态切片 `TowerSlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `TowerSlice` 类型
- **THEN** 包含 `highestFloor`、`currentFloor`、`idleReward` 字段
