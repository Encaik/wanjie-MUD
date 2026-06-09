## ADDED Requirements

### Requirement: 加入/退出势力
势力域 SHALL 支持玩家加入和退出游戏世界中的势力。

#### Scenario: 加入势力
- **WHEN** 玩家选择某个势力并满足加入条件
- **THEN** 玩家成为该势力成员，记录势力 ID 和加入时间

#### Scenario: 退出势力
- **WHEN** 玩家主动退出势力
- **THEN** 清除势力相关状态（势力 ID、进度、贡献度）

### Requirement: 势力任务
势力域 SHALL 提供势力日常/周常任务系统。

#### Scenario: 接受任务
- **WHEN** 玩家接受一个势力任务
- **THEN** 任务出现在玩家的进行中任务列表

#### Scenario: 任务进度更新
- **WHEN** 监听游戏事件（如击杀敌人、完成修炼）
- **THEN** 自动更新匹配的势力任务进度

#### Scenario: 完成任务
- **WHEN** 任务进度达到目标值
- **THEN** 任务标记为可提交，玩家可领取奖励

### Requirement: 贡献度系统
势力域 SHALL 管理玩家的势力贡献度。

#### Scenario: 贡献度获取
- **WHEN** 玩家完成任务、捐赠资源
- **THEN** 增加对应数量的势力贡献度

#### Scenario: 每日俸禄
- **WHEN** 玩家在势力中且当日未领取
- **THEN** 可以领取每日俸禄（灵石 + 贡献度）

### Requirement: 域状态切片
势力域 SHALL 拥有独立的状态切片 `FactionSlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `FactionSlice` 类型
- **THEN** 包含 `factionId`、`factionProgress`（等级、贡献度、任务状态）字段
