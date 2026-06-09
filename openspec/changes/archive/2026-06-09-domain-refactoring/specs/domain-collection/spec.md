## ADDED Requirements

### Requirement: 成就系统
收集域 SHALL 管理完整的成就系统，包括解锁和奖励领取。

#### Scenario: 成就解锁
- **WHEN** 监听游戏事件，玩家满足某成就条件
- **THEN** 该成就自动标记为已解锁，通知玩家

#### Scenario: 成就奖励领取
- **WHEN** 玩家点击已解锁成就的领取按钮
- **THEN** 发放奖励（灵石、物品等），成就标记为已领取

#### Scenario: 成就进度追踪
- **WHEN** 成就条件为累计型（如击杀100个敌人）
- **THEN** 实时显示当前进度/目标值

### Requirement: 图鉴收集
收集域 SHALL 管理功法、装备的图鉴收集系统。

#### Scenario: 图鉴解锁
- **WHEN** 玩家首次获得某功法或装备
- **THEN** 该条目在图鉴中从未发现变为已发现

#### Scenario: 羁绊计算
- **WHEN** 收集到羁绊配置中指定的功法/装备组合
- **THEN** 计算羁绊等级，显示激活的加成效果

### Requirement: 游戏统计
收集域 SHALL 追踪和展示玩家的游戏统计数据。

#### Scenario: 统计数据更新
- **WHEN** 游戏事件触发（击杀敌人、完成任务、炼制物品等）
- **THEN** 对应统计计数器自动增加

#### Scenario: 统计面板展示
- **WHEN** 打开统计面板
- **THEN** 分类展示战斗、修炼、收集等多维度的统计数据

### Requirement: 域状态切片
收集域 SHALL 拥有独立的状态切片 `CollectionSlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `CollectionSlice` 类型
- **THEN** 包含 `statistics`、`unlockedAchievementIds`、`claimedAchievementIds`、`collectionStatus` 字段
