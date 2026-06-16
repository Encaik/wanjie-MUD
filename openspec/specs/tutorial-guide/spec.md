# tutorial-guide

## ADDED Requirements

### Requirement: 分阶段引导定义

`modules/quest/logic/tutorialGuide.ts` SHALL 导出 `TUTORIAL_GUIDE` 常量，定义 5 个阶段（0-4）共 9 个步骤。每个步骤包含 id、name、description、hint、可选 dialog、triggerEvent、condition 和可选 stepReward。每个阶段包含 phaseReward。

#### Scenario: 引导数据结构完整性

- **GIVEN** 游戏启动，玩家进入主界面
- **WHEN** 引导系统初始化
- **THEN** `TUTORIAL_GUIDE.phases` 包含 5 个阶段
- **AND** 阶段 0 的步骤数为 1（领取新手礼包）
- **AND** 阶段 4 的步骤数为 2（完成机缘 + 领取成就）

#### Scenario: 条件检查函数

- **GIVEN** 步骤 2 "进行一次修炼" 的 condition 为 event 类型为 `cultivation:performed`
- **WHEN** 收到事件 `{ type: 'cultivation:performed', payload: { count: 1 } }`
- **THEN** `step.condition(event, protagonist)` 返回 true

### Requirement: 事件驱动步骤推进

`modules/quest/logic/taskProgressTracker.ts` SHALL 导出 `checkTutorialProgress(event, tutorialState, protagonist)` 函数，根据事件类型和当前阶段检查步骤完成，返回下一步状态和奖励信息。

#### Scenario: 步骤顺序完成

- **GIVEN** 当前在阶段 0 步骤 0（未完成）
- **WHEN** 触发 `tutorial:starter_pack_claimed` 事件
- **THEN** 阶段 0 步骤 0 标记完成
- **AND** 返回阶段 0 的 phaseReward（如果阶段内所有步骤完成）
- **AND** 当前步骤推进到阶段 1 步骤 1

#### Scenario: 不相关事件不影响引导

- **GIVEN** 当前在阶段 1（等待修炼事件）
- **WHEN** 触发 `combat:enemy_killed` 事件
- **THEN** 引导状态不变
- **AND** 不发放任何引导奖励

### Requirement: 引导弹窗触发

步骤首次成为当前步骤时，如果步骤定义了 `dialog`，SHALL 返回 dialog 信息供 UI 层展示弹窗。弹窗关闭后该步骤才正式开始监听触发事件。

#### Scenario: 欢迎弹窗（阶段 0）

- **GIVEN** 玩家刚进入游戏，引导系统激活
- **WHEN** 初始化完成
- **THEN** 返回阶段 0 步骤 0 的欢迎弹窗 (variant: 'welcome')
- **AND** 弹窗内容介绍游戏基本概念

#### Scenario: 修炼系统弹窗（阶段 1 步骤 2）

- **GIVEN** 阶段 1 步骤 1（使用丹药）已完成
- **WHEN** 步骤推进到步骤 2 "进行一次修炼"
- **THEN** 返回步骤 2 的弹窗 (variant: 'system-intro')
- **AND** 弹窗内容介绍修炼系统和境界

### Requirement: 引导完成过渡

当阶段 4 步骤 8（领取成就奖励）完成时，系统 SHALL 发射 `tutorial:completed` 事件，发放最终奖励，将 `tutorialState.completed` 设为 true。

#### Scenario: 引导完成

- **GIVEN** 阶段 4 所有步骤已完成
- **WHEN** 步骤 8 condition 满足
- **THEN** emit('tutorial:completed')
- **AND** 发放最终阶段奖励（300 灵石 + 传说品质纪念品）
- **AND** tutorialState.completed = true
- **AND** GameStore 显示庆祝弹窗标志

### Requirement: 初始物品归入引导

`protagonistAdapter.createProtagonistFromSaved()` SHALL 不再创建初始物品。初始物品作为阶段 0 步骤 0（领取新手礼包）的奖励发放。

#### Scenario: 新角色创建

- **WHEN** 新角色通过 `createProtagonistFromSaved` 创建
- **THEN** protagonist.items = []
- **AND** protagonist.inventory = []
- **AND** 引导系统激活阶段 0

#### Scenario: 旧角色兼容

- **GIVEN** 旧存档中 player 背包已有灵石和丹药
- **WHEN** 游戏加载完成，引导系统初始化
- **THEN** 阶段 0 步骤 0 自动标记完成（检测到已有初始物品）
- **AND** 不重复发放初始物品

### Requirement: 引导状态持久化

引导状态 SHALL 通过 `tutorialState` 字段存储在 GameState 中，支持存档读档。状态包含：当前阶段 ID、当前步骤 ID、已完成步骤 ID 列表、已查看弹窗 ID 列表。

#### Scenario: 读档后引导继续

- **GIVEN** 玩家完成阶段 0 和阶段 1 后存档退出
- **WHEN** 下次进入游戏
- **THEN** 引导从阶段 2 步骤 3 继续
- **AND** 已完成的步骤不重复触发弹窗
