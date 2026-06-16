# quest-panel-redesign

## ADDED Requirements

### Requirement: Tab 式任务中心

`QuestPanel` SHALL 重构为 Tab 式面板，支持多个任务系统独立展示。Tab 包括：新手引导（`tutorial`）、势力任务（`faction`）、NPC 任务（`npc`）。每个 Tab 独立管理数据和渲染。

#### Scenario: 三 Tab 结构

- **WHEN** QuestPanel 渲染
- **THEN** 显示 3 个 Tab：新手引导 | 势力任务 | NPC 任务
- **AND** 默认选中"新手引导"（如果引导未完成），否则选中"NPC 任务"

#### Scenario: Tab 切换

- **WHEN** 玩家点击"势力任务" Tab
- **THEN** 切换为该 Tab 内容
- **AND** Tab 指示器动画过渡到新位置
- **AND** URL query 参数同步更新（如 `?taskTab=faction`）

### Requirement: 新手引导 Tab

引导 Tab SHALL 展示分阶段进度视图：阶段列表、当前步骤卡片、进度条、已完成步骤勾选。引导完成时显示"已毕业"徽章。

#### Scenario: 引导进行中

- **GIVEN** 玩家在阶段 1 步骤 2
- **WHEN** 查看引导 Tab
- **THEN** 显示当前阶段名称 "初识修炼"
- **AND** 当前步骤卡片高亮，包含描述和提示
- **AND** 进度条显示阶段完成百分比
- **AND** 已完成步骤以绿色对勾 + 删除线展示

#### Scenario: 引导完成

- **GIVEN** tutorialState.completed = true
- **WHEN** 查看引导 Tab
- **THEN** 显示 "🎉 新手引导已全部完成！" 状态
- **AND** 显示已解锁的正式任务入口引导
- **AND** 不展示步骤列表

### Requirement: 势力任务 Tab

势力任务 Tab SHALL 展示玩家当前势力的日常/周常任务列表，包含任务名称、描述、进度、奖励预览。

#### Scenario: 引导未完成时

- **GIVEN** tutorialState.completed = false
- **WHEN** 点击"势力任务" Tab
- **THEN** 显示 "完成新手引导后解锁" 提示
- **AND** Tab 标签显示锁定图标

#### Scenario: 引导完成后

- **GIVEN** tutorialState.completed = true 且玩家已加入势力
- **WHEN** 查看势力任务 Tab
- **THEN** 展示日常/周常任务列表
- **AND** 每个任务显示名称、进度条、剩余时间
- **AND** 已完成任务显示 "领取奖励" 按钮

### Requirement: NPC 任务 Tab

NPC 任务 Tab SHALL 展示 QuestEngine 中进行中的 NPC 驱动任务，包含任务名称、当前阶段、目标进度。

#### Scenario: 有进行中的任务

- **GIVEN** questState.activeQuests 中有 2 个进行中的任务
- **WHEN** 查看 NPC 任务 Tab
- **THEN** 展示 2 个任务卡片
- **AND** 每个卡片显示任务名、当前阶段名、目标完成情况
- **AND** 点击展开查看详细目标

#### Scenario: 无进行中的任务

- **GIVEN** questState.activeQuests 为空
- **WHEN** 查看 NPC 任务 Tab
- **THEN** 显示空状态提示："暂无进行中的任务，与 NPC 对话可接取新任务"
- **AND** 提示带有引导性图标（如 ScrollText）

### Requirement: 视觉高级感

面板 SHALL 使用以下视觉元素：
- Tab 激活态使用渐变色文字（`game-cultivation` → `game-mental`）
- 进度条使用 `recharts` Progress 组件
- 阶段进度使用环状或条状渐变指示器
- 卡片使用 `CardCornerDecorations` 做四角装饰
- 空状态使用合适的插画图标
- 引导步骤完成时使用绿色脉冲动画

#### Scenario: 深色/浅色主题一致

- **WHEN** 切换主题
- **THEN** 所有渐变和颜色通过 CSS 变量自适应
- **AND** Tab 激活指示器在亮色/暗色主题下都有足够对比度

### Requirement: 组件复用

引导弹窗 `TutorialDialog` SHALL 放在 `src/shared/components/TutorialDialog.tsx`，接收 props：`title`、`content`（Markdown）、`variant`、`onConfirm`、`open`、`onOpenChange`。

#### Scenario: 不同 variant 的弹窗

- **WHEN** variant='welcome'
- **THEN** 弹窗使用较大尺寸 + 渐变背景 + Sparkles 装饰
- **WHEN** variant='system-intro'
- **THEN** 弹窗使用标准尺寸 + 系统图标 + 分段说明
- **WHEN** variant='default'
- **THEN** 弹窗使用紧凑尺寸 + 简洁布局
