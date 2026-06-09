## ADDED Requirements

### Requirement: 全服公告
社交域 SHALL 支持全服公告的生成、显示和历史记录。

#### Scenario: 公告生成
- **WHEN** 触发游戏事件（如飞升成功、击败Boss、获得传说物品）
- **THEN** 生成对应的全服公告内容，包含玩家名称和事件描述

#### Scenario: 公告弹窗显示
- **WHEN** 有新的高优先级公告
- **THEN** 在游戏界面弹出公告提示，持续显示指定时长后自动消失

#### Scenario: 公告历史记录
- **WHEN** 打开公告历史面板
- **THEN** 显示最近的公告列表，包含时间、类型、内容

### Requirement: 聊天室
社交域 SHALL 提供游戏内聊天功能。

#### Scenario: 发送消息
- **WHEN** 玩家在聊天室发送消息
- **THEN** 消息显示在聊天面板中，包含发送者信息和时间戳

### Requirement: 排行榜
社交域 SHALL 提供玩家排行榜功能。

#### Scenario: 排行榜展示
- **WHEN** 打开排行榜面板
- **THEN** 按战力排序显示玩家列表，包含排名、名称、境界、战力值

### Requirement: 域状态切片
社交域 SHALL 拥有独立的状态切片 `SocialSlice`，包含消息记录和公告状态。

#### Scenario: 消息管理
- **WHEN** 查看 `SocialSlice` 类型
- **THEN** 包含 `messages`、`totalMessageCount`、公告展示状态等字段
