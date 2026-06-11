# world-type-english-id

增量规格：修复 `World.type`（中文名）与注册中心英文键名之间的查找不匹配。

## MODIFIED Requirements

### Requirement: Code SHALL migrate from Chinese to English type indexing

`src/` 中所有使用中文世界类型字符串做键名、switch 分支、条件判断的代码 SHALL 逐步迁移到英文 `type`。新增代码 MUST 使用英文 `type`。

**变更**：以下通过 `World.type`（中文名）查找注册中心的消费代码必须改用 `World.worldviewId`（英文 kebab-case）：

- `getNamePoolFromRegistry(worldType)` — 必须接收英文 ID（如 `"wuxia"`）而非中文名（如 `"武侠世界"`）
- `getTraitPoolFromRegistry(worldType)` — 同上
- `getWorldData(worldType)` — 同上
- `getStatLabels(worldType)` — 同上
- `generateCharacter(id, worldType)` — `worldType` 参数语义改为英文 ID
- `generateCharacters(worldType)` — 同上

#### Scenario: New code uses English type

- **WHEN** 新增涉及世界类型的代码
- **THEN** 使用英文 `type` 值（如 `"wuxia"`）而非中文名（如 `"武侠世界"`）
- **AND** 中文名仅用于 UI 显示（通过 `WorldviewDefinition.name` 获取）

#### Scenario: Existing Chinese references are deprecated

- **WHEN** 现有代码中存在 `worldType === "修仙"` 的硬编码判断
- **THEN** 该处标注 `@deprecated` 注释
- **AND** 过渡期内通过 `WorldTypeData` 的中文 ID 查找保持功能正常

#### Scenario: Registry lookup uses worldviewId

- **WHEN** 持有 `World` 实例且需要通过类型查找注册中心数据
- **THEN** 代码 SHALL 使用 `world.worldviewId`（英文 kebab-case）进行查找
- **AND** SHALL NOT 使用 `world.type`（中文显示名）进行注册中心查找
- **AND** 若 `worldviewId` 在注册中心中不存在，SHALL 抛出包含英文 ID 的明确错误信息

#### Scenario: generateCharacters accepts worldviewId

- **WHEN** 调用 `generateCharacters(worldType)` 或 `generateCharacter(id, worldType)`
- **THEN** `worldType` 参数 SHALL 为英文 kebab-case ID（如 `"cultivation"`、`"wuxia"`）
- **AND** 函数内部 SHALL 使用该英文 ID 查找姓名池、词条池等注册中心数据
- **AND** SHALL NOT 再接收中文名如 `"修仙"` 或 `"武侠世界"`

## ADDED Requirements

### Requirement: getNamePoolFromRegistry 提供防御性检查

`getNamePoolFromRegistry` SHALL 在开发模式下（`NODE_ENV === 'development'`）对传入的世界类型参数进行日志记录，若检测到中文名传入则 SHALL 输出警告日志提示使用英文 ID。

#### Scenario: 开发模式下中文名传入警告

- **WHEN** 在开发环境以中文名（如 `"武侠世界"`）调用 `getNamePoolFromRegistry`
- **THEN** 系统 SHALL 输出 `console.warn` 日志提示"传入的是中文名，请使用英文 worldviewId"
- **AND** SHALL 仍然抛出错误（保持现有行为）

#### Scenario: 生产模式下直接抛出错误

- **WHEN** 在生产环境以无效 ID 调用 `getNamePoolFromRegistry`
- **THEN** 系统 SHALL 直接抛出 `姓名池未加载` 错误
- **AND** SHALL NOT 输出额外日志（避免性能影响）
