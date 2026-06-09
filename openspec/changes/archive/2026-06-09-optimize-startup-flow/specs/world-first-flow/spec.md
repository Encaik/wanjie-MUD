# world-first-flow (delta)

## MODIFIED Requirements

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
- **THEN** 系统 SHALL NOT 调用任何数据生成函数（`generateWorlds`、`generateCharacters`）
- **AND** 仅进行页面跳转，数据由对应的确认操作（选择世界/选择角色）负责生成

### Requirement: 首页启动签名需验证 Mod 加载状态

首页路由 SHALL 校验 Mod 加载是否完成，未完成时禁止跳转到世界选择。

#### Scenario: Mod 未加载完成时点击开始
- **WHEN** Mod 加载阶段为 `loading`
- **THEN** "踏入万界"按钮 SHALL 处于禁用状态
- **AND** 按钮 SHALL 显示加载进度提示

#### Scenario: Mod 加载完成后开始新游戏
- **WHEN** Mod 加载阶段为 `ready` 且用户点击"踏入万界"
- **THEN** 系统 SHALL 生成世界列表并跳转到 `/world-select`
