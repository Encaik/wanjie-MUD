# quest-storyline

## Purpose

故事线系统（StoryLine），将连续的单次任务组成主线/支线/新手引导剧情。支持 phase（章）→ section（节）→ quest_ref（任务引用）多层级嵌套结构，默认线性但保留分支扩展性。

## ADDED Requirements

### Requirement: 故事线定义

故事线 SHALL 使用 `StoryLine` 类型定义，包含 id、name、type、rootNodes。`rootNodes` SHALL 是 `StoryNode` 数组，按 `order` 排序。

#### Scenario: 三层级故事线

- **WHEN** 故事线定义为 "第一章(phase) → 第一节(section) → [任务A, 任务B, 任务C]"
- **THEN** UI 展示 SHALL 显示完整层级结构
- **AND** 任务A完成后任务B自动解锁

#### Scenario: 双层故事线

- **WHEN** 故事线定义为 "第一章(phase) → [任务A, 任务B]"（无 section 层）
- **THEN** SHALL 正常工作，section 层是可选的

#### Scenario: 三种故事线类型

- **WHEN** 故事线 type=`main` — 主线剧情，始终在任务面板最显眼位置
- **WHEN** 故事线 type=`side` — 支线剧情，满足条件时解锁
- **WHEN** 故事线 type=`tutorial` — 新手引导，与现有 tutorialGuide 等价

### Requirement: 节点解锁条件

每个 StoryNode SHALL 支持 `unlockCondition`，不满足时该节点及子节点不可访问。

#### Scenario: 任务完成解锁

- **WHEN** 节点 unlockCondition 为 `{ type: 'quest_completed', target: 'q_intro_001' }`
- **AND** 玩家已完成 `q_intro_001`
- **THEN** 该节点 SHALL 解锁

#### Scenario: 等级解锁

- **WHEN** 节点 unlockCondition 为 `{ type: 'level', target: '5' }`
- **AND** 玩家等级 5
- **THEN** 该节点 SHALL 解锁

### Requirement: 故事线进度追踪

系统 SHALL 在 `QuestState.storyCompletedNodeIds` 中记录已完成的故事线节点 ID。

#### Scenario: 完成节点

- **WHEN** 节点类型为 `quest_ref` 且其引用的任务完成
- **THEN** 该节点 ID SHALL 添加到 `storyCompletedNodeIds`
- **AND** 父节点的下一个子节点 SHALL 变为可访问

#### Scenario: 章节完成标记

- **WHEN** phase 节点的所有子 section/quest_ref 节点均完成
- **THEN** phase 节点 ID SHALL 添加到 `storyCompletedNodeIds`
- **AND** UI SHALL 显示该章节为"已完成"

### Requirement: 故事线注册中心

系统 SHALL 提供 `StoryLineRegistry` 单例，存储在 `core/registry/`。

#### Scenario: Mod 注册故事线

- **WHEN** Mod 的 quests/storylines.json 包含 `[{id: 'my_story', ...}]`
- **THEN** ModLoader SHALL 调用 `StoryLineRegistry.getInstance().registerAll(storylines)`
- **AND** 注册后的故事线可通过 `getById()` 查询

### Requirement: 故事线引擎

系统 SHALL 提供 `storyEngine` 纯函数集合。

#### Scenario: 获取当前任务

- **WHEN** 故事线进行中，已完成节点 A、B
- **THEN** `getNextQuestIds(storyline, storyCompletedNodeIds)` SHALL 返回节点 C 的任务 ID 列表
- **AND** 如果所有节点已完成，返回空数组

#### Scenario: 检查节点是否可解锁

- **WHEN** 节点 unlockCondition 为 quest_completed
- **THEN** `isNodeUnlockable(node, questState)` SHALL 检查对应任务是否已完成
