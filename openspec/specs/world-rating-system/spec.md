# world-rating-system

## Purpose

玩家游玩后对世界进行评分（1-5星），评分数据持久化到 localStorage，为世界混合池引擎提供排序依据。

## Requirements

### Requirement: 玩家可对已完成的世界评分

系统 SHALL 在游戏结束（死亡/通关/飞升）后展示评分入口，允许玩家对当前世界进行 1-5 星评分。

#### Scenario: 游戏结束后展示评分入口
- **WHEN** 玩家在某个世界中的游戏进程结束（角色死亡、完成飞升或主动退出）
- **THEN** 系统 SHALL 展示评分组件，包含 1-5 星选择和可选文字评价
- **AND** 评分组件 SHALL 显示当前世界的名称和类型

#### Scenario: 玩家提交评分
- **WHEN** 玩家选择星级并确认提交
- **THEN** 系统 SHALL 将评分数据写入 localStorage 的 `world-ratings` 键
- **AND** SHALL 更新该世界 ID 对应的 `totalScore` 和 `ratingCount`

#### Scenario: 玩家可跳过评分
- **WHEN** 玩家在评分界面选择"跳过"或关闭评分组件
- **THEN** 系统 SHALL NOT 写入任何评分数据
- **AND** SHALL 正常进入后续流程（返回首页/飞升选择）

### Requirement: 评分数据持久化到 localStorage

评分数据 SHALL 存储在 localStorage 中，key 为 `world-ratings`，value 为 JSON 格式的评分存储对象。存储结构 SHALL 以 worldId 为键，包含累计评分、评分次数和时间戳。

#### Scenario: 评分数据正确序列化
- **WHEN** 玩家对 worldId 为 `"wanjie-core:修仙:a0b1c2d3"` 的世界评 4 星
- **THEN** localStorage 的 `world-ratings` SHALL 包含 `{"wanjie-core:修仙:a0b1c2d3": {"totalScore": 4, "ratingCount": 1, "lastRated": <timestamp>}}`

#### Scenario: 同一世界多次评分聚合
- **WHEN** 不同玩家（或同一玩家多次游玩）对同一 worldId 的世界评分
- **THEN** `totalScore` SHALL 累加新评分
- **AND** `ratingCount` SHALL 递增
- **AND** 平均评分 SHALL = `totalScore / ratingCount`

#### Scenario: 评分数据读取
- **WHEN** 系统需要获取某世界的评分
- **THEN** SHALL 从 `world-ratings` 读取对应 worldId 的数据
- **AND** 如果 worldId 不存在，SHALL 返回 `undefined`（表示未评分）

### Requirement: 评分影响世界在混合池中的权重

评分数据 SHALL 作为世界池混合引擎的输入，高分世界 SHALL 有更高概率被选入混合池。

#### Scenario: 高分世界优先入选
- **WHEN** 混合池引擎构建世界列表
- **THEN** 平均评分 >= 高分阈值（默认 3.5）的世界 SHALL 以优先权重进入候选池
- **AND** 已评分但低分（< 阈值）的世界 SHALL 以降低的权重进入或排除

#### Scenario: 未评分世界的处理
- **WHEN** 一个 worldId 在 `world-ratings` 中不存在
- **THEN** 该世界 SHALL 被视为"未评分"
- **AND** 在混合池中 SHALL NOT 占据"已评分高分"名额

### Requirement: 评分组件独立于游戏结果展示

评分 UI 组件 SHALL 作为独立组件存在，SHALL NOT 与游戏结果面板耦合。组件 SHALL 接收 worldId 和 worldName 作为 props，通过回调通知评分完成。

#### Scenario: 评分组件接收世界信息
- **WHEN** 渲染评分组件
- **THEN** 组件 SHALL 接收 `worldId: string` 和 `worldName: string` props
- **AND** SHALL 接收 `onRated: (rating: number) => void` 回调
- **AND** SHALL 接收 `onSkip: () => void` 回调

#### Scenario: 评分组件展示世界信息
- **WHEN** 评分组件渲染
- **THEN** SHALL 显示 "为世界「{worldName}」评分"
- **AND** SHALL 以 1-5 星交互式控件展示可选星级
