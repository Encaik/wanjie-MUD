## ADDED Requirements

### Requirement: 统一消息面板

系统 SHALL 在右侧栏"消息"Tab 中通过扩展的 `MessagePanel` 组件，按时间倒序混合展示以下三类消息：

- 系统消息：`MessageRecord[]`，channel 属于 `core/message-log/` 预设通道（`system`、`combat`、`cultivation`、`exploration`、`economy`）或未设置 channel
- 聊天消息：通过 WebSocket 实时接收的玩家消息，适配为 `MessageRecord`（channel=`'chat'`）
- 公告：服务器全服公告 `Announcement[]`，适配为 `MessageRecord`（channel=`'announcement'`）

#### Scenario: 统一流按时间倒序混合展示

- **WHEN** 系统消息、聊天消息、公告同时存在
- **THEN** 所有消息按各自时间戳倒序排列，最新消息在最上方
- **AND** 每条消息显示来源标识和发送者/标题

#### Scenario: 无筛选时显示所有消息

- **WHEN** 筛选器选择"全部"
- **THEN** 消息流中同时包含系统消息、聊天消息和公告

#### Scenario: 筛选系统消息

- **WHEN** 筛选器选择"系统"
- **THEN** 消息流仅显示 channel 为 system/combat/cultivation/exploration/economy/undefined 的消息
- **AND** 聊天消息（channel=chat）和公告（channel=announcement）被隐藏

#### Scenario: 筛选聊天消息

- **WHEN** 筛选器选择"聊天"
- **THEN** 消息流仅显示聊天消息（channel=`'chat'`）
- **AND** 系统消息和公告被隐藏

#### Scenario: 筛选公告

- **WHEN** 筛选器选择"公告"
- **THEN** 消息流仅显示公告（channel=`'announcement'`）
- **AND** 系统消息和聊天消息被隐藏

### Requirement: 消息类型筛选组件

系统 SHALL 在 `MessagePanel` 顶部提供筛选组件，包含四个筛选选项：全部、系统、聊天、公告。

#### Scenario: 筛选按钮显示

- **WHEN** `MessagePanel` 渲染且存在多类消息
- **THEN** 筛选组件显示四个可点击的选项：[全部] [系统] [聊天] [公告]
- **AND** 当前选中的选项高亮显示

#### Scenario: 仅系统消息时隐藏筛选器

- **WHEN** 仅有系统消息（无聊天、无公告）
- **THEN** 筛选组件可以隐藏，保持与旧版 `MessagePanel` 无筛选时的体验一致

#### Scenario: 切换筛选选项

- **WHEN** 用户点击筛选组件中的某个选项
- **THEN** 消息流立即切换为该类型的消息视图
- **AND** 不重新加载数据，仅前端过滤

### Requirement: 聊天未读提示

当筛选器不在"聊天"或"全部"模式时，如有新的聊天消息到达，系统 SHALL 在聊天筛选按钮上显示红点提示。

#### Scenario: 非聊天模式下新消息到达

- **WHEN** 筛选器选择"系统"或"公告"
- **AND** 有新的聊天消息从 WebSocket 到达
- **THEN** "聊天"筛选按钮上显示红色未读标记

#### Scenario: 切换到聊天模式后清除提示

- **WHEN** 用户点击带有未读标记的"聊天"筛选按钮
- **THEN** 未读标记立即清除

### Requirement: 排行榜独立 Tab

排行榜面板 SHALL 保持为独立的 Tab，不合并到消息面板中。

#### Scenario: 排行榜独立显示

- **WHEN** 右侧栏渲染
- **THEN** 显示两个 Tab：消息（`MessagePanel` + 筛选器）和排行（`LeaderboardPanel`）
- **AND** 排行榜 Tab 保持原有功能不变
