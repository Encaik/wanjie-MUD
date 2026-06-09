## ADDED Requirements

### Requirement: 游戏时间推进
时间域 SHALL 管理游戏内时间系统，与真实时间独立。

#### Scenario: 时间推进
- **WHEN** 玩家执行消耗时间的操作（修炼、探索等）
- **THEN** 游戏时间按操作消耗的时长推进

#### Scenario: 时间状态查询
- **WHEN** 查询当前游戏时间
- **THEN** 返回年、月、日、时辰的游戏内时间

### Requirement: 离线处理
时间域 SHALL 处理玩家离线期间的游戏收益计算。

#### Scenario: 登录时计算离线收益
- **WHEN** 玩家重新登录
- **THEN** 基于离线时长、修炼状态、爬塔层数计算离线奖励，显示离线奖励弹窗

#### Scenario: 离线修炼
- **WHEN** 离线时自动修炼处于开启状态
- **THEN** 按离线时长计算修炼经验和属性增长

### Requirement: 离线奖励展示
时间域 SHALL 提供离线奖励的 UI 展示。

#### Scenario: 离线奖励弹窗
- **WHEN** 登录检测到离线收益
- **THEN** 弹出离线奖励弹窗，显示经验、灵石、物品等收益明细

### Requirement: 域状态切片
时间域 SHALL 拥有独立的状态切片 `TimeSlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `TimeSlice` 类型
- **THEN** 包含 `gameTime`（游戏内时间）、`offlineResult`（离线处理结果）字段
