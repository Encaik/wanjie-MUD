## REMOVED Requirements

### Requirement: 角色生成接收世界类型参数

**Reason**: 前端 `generateCharacters(worldType)` 函数已被删除。角色生成通过后端 `POST /api/v1/characters/templates` 完成，该接口接收 `worldviewId`（英文 ID）参数。前端不再持有任何角色生成逻辑。

**Migration**: 前端使用 `useCharacterTemplates().generateTemplates(worldSeed, worldviewId)` Hook 调用后端 API 获取角色模板。

### Requirement: 属性显示名按世界类型映射

**Reason**: `getStatDisplayName` 函数的参数 `worldType` 从中文改为 `worldviewId`（英文）。

**Migration**: 调用方传参改为 `worldviewId`，如 `getStatDisplayName('灵根', 'cultivation')`。

## MODIFIED Requirements

### Requirement: 角色模板生成使用 worldviewId

`generateCharacterTemplates` 函数 SHALL 接收 `worldviewId: string` 参数（英文 ID），从 `WorldViewRegistry` 读取对应的姓名池、词条池和属性模板。

#### Scenario: 修仙世界角色模板
- **WHEN** 传入 `worldviewId === 'cultivation'`
- **THEN** 生成的角色的姓名 SHALL 从 `WorldViewRegistry.get('cultivation').namePool` 获取
- **AND** 属性模板 SHALL 从 `WorldViewRegistry.get('cultivation').attributes` 获取

#### Scenario: 科技世界角色模板
- **WHEN** 传入 `worldviewId === 'tech'`
- **THEN** 生成的角色的姓名 SHALL 从 `WorldViewRegistry.get('tech').namePool` 获取
- **AND** 属性模板 SHALL 从 `WorldViewRegistry.get('tech').attributes` 获取
