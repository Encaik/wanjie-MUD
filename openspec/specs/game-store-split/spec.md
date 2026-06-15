# Game Store Split

## Purpose

将 `useGameState.tsx`（2204 行）中的上帝 Context 拆分为轻量 GameStore（仅暴露 `gameState` + `dispatch`）和多个领域 action Hook。各组件通过领域 Hook 自取所需，不再依赖全能 Context。

## Requirements

### Requirement: GameStore 仅提供状态读写通道

GameStore SHALL 仅暴露 `gameState`（只读状态树）和 `dispatch`（不可变更新函数），不包含任何业务逻辑或 action 函数。

#### Scenario: GameStoreProvider 包裹游戏页面

- **WHEN** 游戏主页面（/game 路由）渲染
- **THEN** `GameStoreProvider` 在最外层包裹所有子组件
- **AND** `gameState` 初始化逻辑（localStorage 恢复 + 默认值）保持不变
- **AND** 消息分页状态（`hasMoreMessages`、`isLoadingMessages`）保留在 GameStore 中，作为 store 的附加字段

#### Scenario: 组件读取 gameState

- **WHEN** 任何子组件调用 `useGameStore()`
- **THEN** 返回 `{ gameState, dispatch }`
- **AND** `gameState` 为当前完整游戏状态树（类型 `GameState`）
- **AND** 组件因 `gameState` 变化重渲染的行为与原有 Context 一致

#### Scenario: 组件仅需 dispatch

- **WHEN** 组件仅需要修改状态（不需要读取）
- **THEN** 可使用 `useGameDispatch()` 仅获取 `dispatch` 函数
- **AND** 该组件不会因 `gameState` 变化而重渲染

### Requirement: 领域 Hook 自取状态

每个领域 action Hook SHALL 从 GameStore 自行读取 `gameState` 和 `dispatch`，不通过外部参数注入。

#### Scenario: 修炼 Hook 自取状态

- **WHEN** `useCultivation()` 被调用
- **THEN** Hook 内部调用 `useGameStore()` 获取 `gameState` 和 `dispatch`
- **AND** 返回 `{ performCultivation, performRest, toggleAutoCultivation, selectCultivationPath }` 等修炼相关 action
- **AND** 每个 action 使用 `dispatch(prev => ...)` 进行不可变状态更新
- **AND** 不接收任何外部参数

#### Scenario: 势力 Hook 自取状态

- **WHEN** `useFaction()` 被调用
- **THEN** Hook 返回 `{ joinFaction, leaveFaction, donate, promoteRank, acceptTask, submitTask, refreshTasks, claimTaskReward, claimDailySalary }`
- **AND** 所有 action 内部通过 `useGameStore()` 读写状态

#### Scenario: 现有模块 Hook 平滑迁移

- **WHEN** `useGameCultivation({ state, setState, addMessage })` 改造为 `useCultivation()`
- **THEN** 函数签名从参数注入改为自取 store
- **AND** 内部逻辑（数值计算、状态更新）保持不变
- **AND** `addMessage` 改为调用独立的 `useAddMessage()` Hook

### Requirement: addMessage 独立为共享 Hook

消息添加功能 SHALL 抽取为独立的 `useAddMessage()` Hook，供所有领域 Hook 使用。

#### Scenario: 领域 Hook 使用 addMessage

- **WHEN** 领域 Hook 需要添加消息记录
- **THEN** Hook 内部调用 `useAddMessage()` 获取 `addMessage` 函数
- **AND** `addMessage(type, title, content, details?, rewards?)` 签名与原来一致
- **AND** 消息自动写入 GameStore 中的 `messages` 数组

### Requirement: page.tsx 不再传递 action props

`app/game/page.tsx` SHALL 仅负责路由守卫，不向 GameLayout 传递任何 action prop。

#### Scenario: page.tsx 精简

- **WHEN** page.tsx 渲染
- **THEN** 仅执行路由守卫逻辑（检查 protagonist 是否存在）
- **AND** 向 GameLayout 传递 `protagonist` 一个 prop（用于守卫后的渲染条件）
- **AND** 不传递任何 action callback prop
- **AND** 文件不超过 40 行

### Requirement: 领域 Hook 覆盖所有现有功能

所有当前 `GameContextType` 中的方法 SHALL 在对应领域 Hook 中提供等价实现。

#### Scenario: 功能完整性

- **WHEN** 所有领域 Hook 全部实现
- **THEN** 每个 `GameContextType` 方法都有对应的领域 Hook action
- **AND** action 函数签名保持兼容（参数和返回值不变）
- **AND** 现有 Panel 组件无需修改 props 接口即可使用新 Hook
