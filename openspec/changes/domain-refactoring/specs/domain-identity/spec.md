## ADDED Requirements

### Requirement: 角色创建
身份域 SHALL 提供完整的角色创建流程，包括随机生成角色属性和词条。

#### Scenario: 随机生成角色列表
- **WHEN** 进入角色选择页面
- **THEN** 显示多个可选的随机角色，每个角色包含名字、性别、年龄、出身、特性、性格、天赋、属性值

#### Scenario: 选择角色
- **WHEN** 用户点击某个角色
- **THEN** 该角色被标记为已选中，进入下一步世界选择

### Requirement: 世界选择
身份域 SHALL 提供 8 种世界类型的选择，每个世界有独立的境界体系和势力。

#### Scenario: 世界列表展示
- **WHEN** 角色选择完成后
- **THEN** 展示 8 种世界类型（修仙/高武/科技/魔幻/异能/仙侠/武侠/末世），每种世界显示名称、描述、力量体系

#### Scenario: 选择世界
- **WHEN** 用户选择某个世界
- **THEN** 该世界被标记为已选中，进入背景故事生成

### Requirement: 背景故事生成
身份域 SHALL 根据选中的角色和世界生成融合背景故事。

#### Scenario: 故事生成
- **WHEN** 角色和世界都已选定
- **THEN** 生成一段将角色出身、特性与世界观融合的背景故事文本

### Requirement: 域状态切片
身份域 SHALL 拥有独立的状态切片 `IdentitySlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `IdentitySlice` 类型
- **THEN** 包含 `characters`、`worlds`、`selectedCharacter`、`selectedWorld`、`backstory` 字段
