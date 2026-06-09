# generation-cache

## Purpose

避免世界选择和角色选择页面在路由守卫触发、页面刷新时重复生成世界和角色数据。

## ADDED Requirements

### Requirement: 世界数据仅在新游戏开始时生成

`generateWorlds()` SHALL 仅在 `startNewGame()` 调用时执行一次。路由守卫重定向到 `/world-select` 时 SHALL NOT 重新生成世界数据。

#### Scenario: 首次点击开始新游戏
- **WHEN** 用户在首页点击"踏入万界"开始新游戏
- **THEN** 系统 SHALL 调用 `generateWorlds()` 生成 8 个世界
- **AND** 将世界列表存入 `gameState.worlds`
- **AND** 将 `gameState.phase` 设置为 `'world-select'`

#### Scenario: 从角色选择返回世界选择
- **WHEN** 用户从角色选择页点击"返回"按钮回到世界选择页
- **THEN** 系统 SHALL NOT 重新调用 `generateWorlds()`
- **AND** 世界列表 SHALL 保持与首次生成时一致

#### Scenario: 直接刷新世界选择页
- **WHEN** 用户在世界选择页刷新浏览器
- **THEN** 系统 SHALL 从 localStorage 恢复 `gameState`（包含已生成的世界列表）
- **AND** 如果存档中有世界列表，SHALL NOT 重新生成

### Requirement: 角色数据缓存与可控刷新

角色列表 SHALL 在世界选中时生成并缓存。只有在用户主动点击"刷新"按钮时才重新生成。页面路由变化 SHALL NOT 触发角色重新生成。

#### Scenario: 选择世界后自动生成角色
- **WHEN** 用户选择世界
- **THEN** 系统 SHALL 调用 `generateCharacters(world.type)` 生成 8 个角色
- **AND** 将角色列表存入 `gameState.characters`

#### Scenario: 从背景故事返回角色选择不重新生成
- **WHEN** 用户从背景故事页返回角色选择
- **THEN** 系统 SHALL 使用已缓存的角色列表
- **AND** SHALL NOT 调用 `generateCharacters()`

#### Scenario: 手动刷新角色
- **WHEN** 用户点击"刷新"按钮
- **THEN** 系统 SHALL 重新调用 `generateCharacters(selectedWorld.type)` 生成新角色列表
- **AND** 旧角色列表 SHALL 被替换

### Requirement: 路由守卫不触发数据生成

路由守卫逻辑 SHALL 仅检查 `gameState` 中是否已有数据，不主动调用生成函数。如果发现数据缺失，SHALL 重定向到上一级页面。

#### Scenario: 角色选择页无角色数据
- **WHEN** 用户访问 `/character-select` 但 `gameState.characters` 为空
- **THEN** 系统 SHALL 重定向到 `/world-select`
- **AND** SHALL NOT 自动调用 `generateCharacters()`

#### Scenario: 世界选择页无世界数据
- **WHEN** 用户访问 `/world-select` 但 `gameState.worlds` 为空
- **THEN** 系统 SHALL 重定向到 `/`
- **AND** SHALL NOT 自动调用 `generateWorlds()`
