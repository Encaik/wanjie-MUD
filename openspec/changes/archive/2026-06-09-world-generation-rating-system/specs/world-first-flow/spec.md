# world-first-flow (delta)

## Purpose

世界优先的新游戏选择流程。本次变更将世界列表来源从硬编码生成改为使用 WorldPool 混合引擎动态产出。

## MODIFIED Requirements

### Requirement: 新游戏流程为世界优先

新游戏开始后，系统 SHALL 遵循"世界选择 → 角色选择 → 背景故事 → 游戏"的流程顺序。`GamePhase` 联合类型 SHALL 调整为 `'world-select' | 'character-select' | 'backstory' | 'playing'`。

#### Scenario: 首页点击开始新游戏
- **WHEN** 用户在首页点击"开始新游戏"
- **THEN** 系统 SHALL 通过 `WorldPoolEngine.generatePool()` 生成世界列表并跳转到 `/world-select` 页面
- **AND** 系统 SHALL NOT 在此时生成角色
- **AND** 世界列表 SHALL 包含已评分高分世界和随机新世界的混合

#### Scenario: 世界选择后进入角色选择
- **WHEN** 用户在世界选择页选中一个世界
- **THEN** 系统 SHALL 将选中世界存入 `selectedWorld`
- **AND** 系统 SHALL 基于选中世界的类型生成 8 个角色
- **AND** 系统 SHALL 跳转到 `/character-select` 页面

#### Scenario: 角色选择后进入背景故事
- **WHEN** 用户选中一个角色
- **THEN** 系统 SHALL 基于角色和选中世界生成背景故事
- **AND** 系统 SHALL 跳转到 `/backstory` 页面

### Requirement: 阶段路由守卫保护流程完整性

每个选择页面 SHALL 在渲染时（同步）检查前置条件，未满足时立即重定向，避免 `useEffect` 异步守卫造成的先渲染后跳转闪烁。

#### Scenario: 直接访问角色选择页无选中世界
- **WHEN** 用户直接访问 `/character-select` 但 `selectedWorld` 为空
- **THEN** 系统 SHALL 在渲染阶段同步重定向到 `/world-select`
- **AND** 渲染阶段 SHALL NOT 先渲染角色选择页的任何 UI 内容

#### Scenario: 直接访问世界选择页但已在游戏中
- **WHEN** 用户直接访问 `/world-select` 但已在游戏中（`phase === 'playing'`）
- **THEN** 系统 SHALL 在渲染阶段同步重定向到 `/game`
- **AND** 渲染阶段 SHALL NOT 先渲染世界选择页的任何 UI 内容

#### Scenario: 游戏页无主角时回退
- **WHEN** 用户在 `/game` 页面但 `protagonist` 为空
- **THEN** 系统 SHALL 在渲染阶段同步按顺序检查并重定向：有 selectedCharacter 和 selectedWorld → `/backstory`；有 selectedWorld → `/character-select`；有 worlds → `/world-select`；否则 → `/`

#### Scenario: 路由守卫不触发数据生成
- **WHEN** 路由守卫检测到前置条件不满足需要重定向
- **THEN** 系统 SHALL NOT 调用任何数据生成函数（WorldPool、角色生成等）
- **AND** 仅进行页面跳转，数据由对应的确认操作（选择世界/选择角色）负责生成

### Requirement: 首页启动签名需验证 Mod 加载状态

首页路由 SHALL 校验 Mod 加载是否完成，未完成时禁止跳转到世界选择。

#### Scenario: Mod 未加载完成时点击开始
- **WHEN** Mod 加载阶段为 `loading`
- **THEN** "踏入万界"按钮 SHALL 处于禁用状态
- **AND** 按钮 SHALL 显示加载进度提示

#### Scenario: Mod 加载完成后开始新游戏
- **WHEN** Mod 加载阶段为 `ready` 且用户点击"踏入万界"
- **THEN** 系统 SHALL 通过 WorldPool 生成混合世界列表并跳转到 `/world-select`

### Requirement: 世界选择页无需前置角色

世界选择页面 SHALL NOT 要求 `selectedCharacter` 存在才能访问。

#### Scenario: 新游戏直接进入世界选择
- **WHEN** `startNewGame()` 被调用后跳转到 `/world-select`
- **THEN** 页面 SHALL 正常渲染世界列表
- **AND** SHALL NOT 因 `selectedCharacter` 为空而重定向

## ADDED Requirements

### Requirement: 世界列表来自 WorldPool 引擎

世界选择页面的世界列表 SHALL 由 `WorldPoolEngine.generatePool()` 产出，SHALL NOT 来自硬编码种子数组或预生成 JSON 文件。

#### Scenario: WorldSelect 使用 WorldPool
- **WHEN** WorldSelect 组件需要世界列表
- **THEN** SHALL 调用封装了 `WorldPoolEngine` 的 Hook 获取世界列表
- **AND** SHALL NOT 直接 import `generateWorlds()` 或 `DEFAULT_WORLD_SEEDS`
- **AND** SHALL NOT 直接 import `AVAILABLE_WORLDS`

#### Scenario: 世界列表包含来源标记
- **WHEN** WorldSelect 渲染世界卡片列表
- **THEN** 每个世界卡片 SHALL 能区分来源类型（已评分/随机/模板）
- **AND** 已评分世界 SHALL 展示评分星级，模板世界 SHALL 展示精选标签
