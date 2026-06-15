# Game Dialog Layer

## Purpose

将弹窗的 open/close 逻辑从 MainGame 分散到各触发组件，通过 `useDialogController` + `DialogLayer` 模式实现声明式弹窗管理。GameLayout 只负责渲染活跃弹窗。

## Requirements

### Requirement: useDialogController 提供 open/close API

`useDialogController` SHALL 提供弹窗注册/注销的全局 API，任何组件可调用 `open`/`close` 控制弹窗。

#### Scenario: 打开弹窗

- **WHEN** 组件调用 `open('upgrade', { item, type })`
- **THEN** 弹窗被注册到全局弹窗注册表
- **AND** `DialogLayer` 检测到变化后渲染对应弹窗组件
- **AND** `open` 返回弹窗 ID 用于后续操作

#### Scenario: 关闭弹窗

- **WHEN** 组件调用 `close('upgrade')`
- **THEN** 对应弹窗从注册表中移除
- **AND** `DialogLayer` 停止渲染该弹窗

#### Scenario: 同类型弹窗覆盖

- **WHEN** 已有弹窗 A 打开，再次 `open` 同类型弹窗 B
- **THEN** 弹窗 B 的 props 覆盖弹窗 A
- **AND** 不产生重复弹窗

### Requirement: DialogLayer 统一渲染

`DialogLayer` SHALL 在 GameLayout 中渲染一次，根据注册表渲染所有活跃弹窗。

#### Scenario: DialogLayer 渲染

- **WHEN** GameLayout 渲染
- **THEN** `DialogLayer` 在组件树最外层（弹窗层级最高）渲染
- **AND** 遍历弹窗注册表中的所有活跃弹窗
- **AND** 每个弹窗根据 `type` 映射到对应的弹窗组件
- **AND** 弹窗组件的 `onOpenChange`/`onClose` 回调自动调用 `close`

#### Scenario: 弹窗组件映射

- **WHEN** DialogLayer 需要渲染 `type: 'upgrade'` 的弹窗
- **THEN** 从 `DIALOG_MAP` 查找并渲染 `UpgradePanel`（包装在 Dialog 中）
- **AND** 弹窗通过 props 接收 `open('upgrade', ...)` 时传入的数据
- **AND** 弹窗关闭时自动从注册表注销

### Requirement: 各弹窗归属到触发组件

每个弹窗的 open/close 逻辑 SHALL 放在触发该弹窗的组件中。

#### Scenario: 升级弹窗归属

- **WHEN** TechniquePanel 中的"升级"按钮被点击
- **THEN** TechniquePanel 调用 `open('upgrade', { item, type: 'technique' })`
- **AND** MainGame/GameLayout 不包含 `upgradeTarget` 状态
- **AND** UpgradePanel 通过 DialogLayer 渲染，接收 `item` 和 `type` props

#### Scenario: 修炼弹窗归属

- **WHEN** CultivationPanel 中的"选择流派"按钮被点击
- **THEN** CultivationPanel 内部管理 `showPathSelect` 状态
- **AND** CultivationPathSelect 弹窗的状态完全由 CultivationPanel 控制
- **AND** GameLayout 不参与此弹窗的生命周期

#### Scenario: 设置面板归属

- **WHEN** GameHeader 中的设置按钮被点击
- **THEN** GameHeader 调用 `open('settings')`
- **AND** SettingsPanel 通过 DialogLayer 渲染

### Requirement: 飞升流程多步骤弹窗自管理

飞升流程的 3 个连续弹窗（守卫战斗 → 传承选择 → 世界揭示）SHALL 由 `useAscensionFlow()` Hook 统一管理阶段状态机。

#### Scenario: 飞升流程阶段驱动

- **WHEN** 玩家触发渡劫/飞升
- **THEN** `useAscensionFlow()` 管理 `phase: 'idle' | 'battle' | 'inheritance' | 'world_reveal'`
- **AND** `phase === 'battle'` 时 GuardianBattle 弹窗渲染
- **AND** `phase === 'inheritance'` 时 InheritanceSelect 弹窗渲染
- **AND** `phase === 'world_reveal'` 时 WorldReveal 弹窗渲染
- **AND** 每个阶段的回调推进到下一阶段

#### Scenario: 飞升弹窗不由 GameLayout 管理

- **WHEN** 飞升流程进行中
- **THEN** GameLayout 不包含 `ascensionBattleEndedRef`、`showGuardianBattle`、`showInheritanceSelect`、`showWorldReveal` 等状态
- **AND** 这些状态完全在 `useAscensionFlow()` 内部管理
- **AND** `useAscensionFlow()` 使用 `open`/`close` 控制对应弹窗

### Requirement: 弹窗间数据传递

弹窗 SHALL 支持通过 `open` 的 `props` 参数传递数据，接收方通过 props 获取。

#### Scenario: 升级弹窗接收数据

- **WHEN** `open('upgrade', { item: technique, type: 'technique' })` 被调用
- **THEN** UpgradePanel 通过 props 接收 `{ item: Technique, type: 'technique' }`
- **AND** UpgradePanel 使用这些数据渲染升级界面
- **AND** 关闭弹窗时调用 `close('upgrade')`
