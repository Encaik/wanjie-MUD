## MODIFIED Requirements

### Requirement: WorldType 为可扩展字符串

代码库中 SHALL NOT 使用硬编码的世界类型联合类型。`WorldType` SHALL 为 `string`（可扩展），有效的世界类型值 SHALL 由 `WorldViewRegistry` 在运行时动态确定。任何已注册的世界观 ID 在类型层面都是有效的。

#### Scenario: 新 Mod 注册的世界观可用

- **WHEN** 一个 Mod 通过 `WorldViewRegistry.getInstance().register()` 注册了新的世界观（如 `'魔法学院'`）
- **THEN** 游戏代码 SHALL 能使用该世界观生成世界、计算战斗、展示 UI
- **AND** TypeScript 编译器 SHALL NOT 报 "类型不匹配" 错误

#### Scenario: 未注册的世界观抛出明确错误

- **WHEN** 代码尝试使用一个未在 `WorldViewRegistry` 注册的世界观 ID
- **THEN** 系统 SHALL 抛出 `Error('世界观未注册: "<id>"')`
- **AND** 错误信息 SHALL 包含可用的已注册世界观列表

### Requirement: 代码中无写死的世界类型值

任何代码 SHALL NOT 包含字面量世界类型字符串（如 `'修仙'`、`'高武'`）作为兜底值或默认值。所有世界类型值的来源 SHALL 为注册中心或用户选择。

#### Scenario: 组件无硬编码默认世界类型

- **WHEN** 搜索所有 `.tsx` 和 `.ts` 文件中的世界类型字面量
- **THEN** SHALL NOT 存在 `= '修仙'`、`default: '修仙'` 等形式的默认值赋值
- **AND** 世界类型参数 SHALL 为必填（必需由调用方显式传入）

#### Scenario: 计算上下文无硬编码世界类型

- **WHEN** 检查 `src/core/calculation/` 中的所有文件
- **THEN** 任何 `type: '修仙'` 或类似的硬编码 SHALL 被替换为从上下文/注册中心获取

### Requirement: BUILTIN_WORLD_TYPES 通过注册中心查询

内置世界类型列表 SHALL 通过 `WorldViewRegistry.getInstance().getBuiltins()` 动态获取，SHALL NOT 是硬编码常量数组。

#### Scenario: 获取所有可用世界类型

- **WHEN** 游戏需要展示世界选择列表
- **THEN** SHALL 调用 `WorldViewRegistry.getInstance().getAll()`
- **AND** 返回所有已注册 Mod 提供的世界观

#### Scenario: 内置世界仍可通过标签识别

- **WHEN** 需要区分核心 Mod 提供的世界和第三方 Mod 提供的世界
- **THEN** `WorldviewDefinition` 接口 SHALL 包含 `builtin: boolean` 字段
- **AND** 核心世界标记为 `builtin: true`

### Requirement: views/ 层无硬编码视觉映射

`src/views/` 下的所有组件 SHALL NOT 包含硬编码的世界类型→视觉映射。所有视觉信息 SHALL 从 `WorldViewRegistry` 的 `WorldviewDefinition.visualConfig` 动态获取。

#### Scenario: WorldSelect 组件从注册中心获取视觉

- **WHEN** 检查 `WorldSelect.tsx` 的代码
- **THEN** SHALL NOT 存在 `const worldTheme: Record<string, ...> = { ... }` 形式的硬编码映射
- **AND** 视觉配置 SHALL 通过 `WorldViewRegistry.getInstance().get(id)?.visualConfig` 获取

#### Scenario: 所有视图组件从注册中心获取视觉

- **WHEN** 检查 `WorldInfoPanel.tsx`、`WorldReveal.tsx`、`WorldInfoBar.tsx` 的代码
- **THEN** SHALL NOT 存在硬编码视觉映射常量
- **AND** 图标和颜色 SHALL 从 `WorldViewRegistry` 动态获取

## REMOVED Requirements

### Requirement: WorldTypeData 包含视觉配置

**Reason**: `WorldTypeData` 接口已被完全删除，其功能合并到 `WorldviewDefinition.visualConfig` 中。视觉配置现在是 `WorldviewDefinition` 的固有字段，不再需要独立的 `WorldTypeData` 接口。

**Migration**: Mod JSON 中的 `visualConfig` 字段保持不变，只是存储位置从 `WorldTypeData.visualConfig` 变为 `WorldviewDefinition.visualConfig`。所有读取代码改为从 `WorldViewRegistry.getInstance().get(id)?.visualConfig` 获取。
