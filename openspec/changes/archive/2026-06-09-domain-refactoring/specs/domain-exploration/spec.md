## ADDED Requirements

### Requirement: 秘境地图生成
探索域 SHALL 生成随机秘境地图供玩家探索。

#### Scenario: 地图生成
- **WHEN** 玩家以特定难度配置进入秘境
- **THEN** 生成对应行列数的网格地图，随机分布 treasure/enemy/elite/miniboss/boss/event/rest/portal/empty 九种格子类型

#### Scenario: 新手引导难度
- **WHEN** 玩家首次进入秘境且未完成新手引导
- **THEN** 在难度列表最前方插入新手难度选项（低等级、低体力消耗、高通关率）

### Requirement: 地图移动探索
探索域 SHALL 支持玩家在地图上移动并触发事件。

#### Scenario: 移动到相邻格子
- **WHEN** 玩家点击相邻格子
- **THEN** 消耗行动力，移动到目标格子，触发该格子事件

#### Scenario: 触发敌人格子
- **WHEN** 玩家移动到 enemy/elite/miniboss/boss 格子
- **THEN** 进入战斗，战斗结果影响秘境进度

#### Scenario: 触发宝物格子
- **WHEN** 玩家移动到 treasure 格子
- **THEN** 获得物品或灵石奖励

#### Scenario: 触发事件格子
- **WHEN** 玩家移动到 event 格子
- **THEN** 显示随机事件，玩家从多个选项中做出选择

#### Scenario: 触发休息格子
- **WHEN** 玩家移动到 rest 格子
- **THEN** 恢复部分 HP/MP

#### Scenario: 触发传送门
- **WHEN** 玩家移动到 portal 格子
- **THEN** 传送到地图的另一个位置

### Requirement: 行动力系统
探索域 SHALL 管理秘境探索的行动力机制。

#### Scenario: 进入秘境消耗
- **WHEN** 进入秘境
- **THEN** 检查冷却时间和等级条件，通过后创建行动力会话

#### Scenario: 移动消耗
- **WHEN** 在地图上移动
- **THEN** 扣除对应行动力

#### Scenario: 行动力耗尽
- **WHEN** 行动力降至 0 或玩家主动退出
- **THEN** 退出秘境，结算本次探索收益

### Requirement: 一键扫荡
探索域 SHALL 提供已通关难度的快速扫荡功能。

#### Scenario: 扫荡条件
- **WHEN** 玩家选择已通关难度进行扫荡
- **THEN** 检查体力充足后立即结算收益

#### Scenario: 扫荡收益
- **WHEN** 扫荡完成
- **THEN** 按难度配置和扫荡效率系数（0.5x）计算经验、灵石、物品、碎片

### Requirement: 历练事件系统
探索域 SHALL 提供独立的随机历练事件（非秘境模式）。

#### Scenario: 触发历练
- **WHEN** 玩家点击历练
- **THEN** 随机生成一个事件，展示可选选项

#### Scenario: 事件选择
- **WHEN** 玩家选择某个选项
- **THEN** 根据选项效果更新属性/物品/经验，选项可能触发战斗

### Requirement: 域状态切片
探索域 SHALL 拥有独立的状态切片 `ExplorationSlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `ExplorationSlice` 类型
- **THEN** 包含 `adventureGrid`、`adventurePosition`、`adventureConfig`、`adventurePhase`、`adventureSession`、`adventureLoot`、`adventureExperience`、`adventureFragments`、`currentEvent`、`lastExploreTime` 字段
