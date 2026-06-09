## ADDED Requirements

### Requirement: WorldType 为可扩展品牌字符串

代码库中 SHALL NOT 使用硬编码的世界类型联合类型。世界类型 SHALL 以品牌字符串 `ExtensibleWorldType` 表示，有效的世界类型值 SHALL 由 `WorldDataRegistry` 在运行时动态确定。任何已注册的世界类型 ID 在类型层面都是有效的。

#### Scenario: 新 Mod 注册的世界类型可用
- **WHEN** 一个 Mod 通过 `WorldDataRegistry.registerWorldType()` 注册了新的世界类型（如 `'魔法学院'`）
- **THEN** 游戏代码 SHALL 能使用该世界类型生成世界、计算战斗、展示 UI
- **AND** TypeScript 编译器 SHALL NOT 报 "类型不匹配" 错误

#### Scenario: 未注册的世界类型抛出明确错误
- **WHEN** 代码尝试使用一个未在 `WorldDataRegistry` 注册的世界类型 ID
- **THEN** 系统 SHALL 抛出 `Error('世界类型未注册: "<id>"')`
- **AND** 错误信息 SHALL 包含可用的已注册世界类型列表

#### Scenario: 旧版世界类型转换兼容
- **WHEN** 加载旧存档中存储的世界类型字符串
- **THEN** `asWorldType(value)` 函数 SHALL 在注册表中查找该 ID
- **AND** 如果找到则返回品牌字符串，否则抛出明确错误

### Requirement: 代码中无写死的世界类型值

任何代码 SHALL NOT 包含字面量世界类型字符串（如 `'修仙'`、`'高武'`）作为兜底值或默认值。所有世界类型值的来源 SHALL 为注册中心或用户选择。

#### Scenario: 组件无硬编码默认世界类型
- **WHEN** 搜索所有 `.tsx` 和 `.ts` 文件中的世界类型字面量
- **THEN** SHALL NOT 存在 `= '修仙'`、`default: '修仙'` 等形式的默认值赋值
- **AND** 世界类型参数 SHALL 为必填（必需由调用方显式传入）

#### Scenario: 计算上下文无硬编码世界类型
- **WHEN** 检查 `src/shared/lib/calculation/` 中的所有文件
- **THEN** 任何 `type: '修仙'` 或类似的硬编码 SHALL 被替换为从上下文/注册中心获取

### Requirement: BUILTIN_WORLD_TYPES 通过注册中心查询

内置世界类型列表 SHALL 通过 `WorldDataRegistry.getAllWorldTypes()` 动态获取，SHALL NOT 是硬编码常量数组。

#### Scenario: 获取所有可用世界类型
- **WHEN** 游戏需要展示世界选择列表
- **THEN** SHALL 调用 `WorldDataRegistry.getInstance().getAllWorldTypes()`
- **AND** 返回所有已注册 Mod 提供的世界类型 ID

#### Scenario: 内置世界仍可通过标签识别
- **WHEN** 需要区分核心 Mod 提供的世界和第三方 Mod 提供的世界
- **THEN** `WorldTypeData` 接口 SHALL 包含 `builtin: boolean` 字段
- **AND** 核心世界标记为 `builtin: true`
