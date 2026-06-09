## ADDED Requirements

### Requirement: 修炼系统
成长域 SHALL 提供多种修炼策略和突破机制。

#### Scenario: 稳健修炼
- **WHEN** 玩家选择稳健修炼策略
- **THEN** 消耗灵石，获得稳定的经验值和属性增长

#### Scenario: 激进修炼
- **WHEN** 玩家选择激进修炼策略
- **THEN** 消耗更多灵石，有概率获得更高收益或触发修炼暴击

#### Scenario: 顿悟修炼
- **WHEN** 玩家拥有顿悟印记并选择顿悟修炼
- **THEN** 消耗顿悟印记，获得大幅属性提升

#### Scenario: 修炼冷却
- **WHEN** 策略修炼完成
- **THEN** 进入冷却时间，冷却结束前不能再次策略修炼

### Requirement: 突破系统
成长域 SHALL 管理境界突破机制。

#### Scenario: 突破条件
- **WHEN** 玩家经验值满且满足境界突破条件
- **THEN** 可以尝试突破到下一境界

#### Scenario: 突破成功
- **WHEN** 突破判定成功
- **THEN** 等级提升、境界名称更新、随机 1-2 个属性增长、HP/MP 回满

#### Scenario: 突破失败
- **WHEN** 突破判定失败
- **THEN** 获得部分经验补偿，心境状态受影响

### Requirement: 自动修炼
成长域 SHALL 提供自动挂机修炼功能。

#### Scenario: 开启自动修炼
- **WHEN** 玩家开启自动修炼且灵石充足
- **THEN** 按固定间隔自动执行修炼，消耗灵石获得经验

#### Scenario: 资源不足自动停止
- **WHEN** 自动修炼中灵石耗尽
- **THEN** 自动修炼关闭，发送资源不足通知

### Requirement: 闭关修炼
成长域 SHALL 提供闭关修炼功能。

#### Scenario: 小闭关
- **WHEN** 玩家选择小闭关
- **THEN** 消耗灵石和时间，获得经验值和属性增长

#### Scenario: 大闭关
- **WHEN** 玩家选择大闭关
- **THEN** 消耗更多资源，获得更大收益，闭关时间更长

### Requirement: 心境系统
成长域 SHALL 管理角色心境状态，受修炼结果和战斗结果影响。

#### Scenario: 心境变化
- **WHEN** 突破成功或战斗胜利
- **THEN** 心境值提升
- **WHEN** 突破失败或战斗失败
- **THEN** 心境值下降

### Requirement: 流派系统
成长域 SHALL 提供修炼流派选择和升级。

#### Scenario: 选择流派
- **WHEN** 达到等级条件且尚未选择流派
- **THEN** 弹出流派选择面板，选择后获得该流派加成

#### Scenario: 流派升级
- **WHEN** 修炼获得流派经验
- **THEN** 流派经验累积到阈值后自动升级，解锁更强加成

### Requirement: 域状态切片
成长域 SHALL 拥有独立的状态切片 `ProgressionSlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `ProgressionSlice` 类型
- **THEN** 包含 `level`、`realm`、`experience`、`overflowExperience`、`stats`、`cultivationCooldown`、`autoCultivating`、`mentalState`、`cultivationPath`、`pathLevel`、`pathExp` 字段
