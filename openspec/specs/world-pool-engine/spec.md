# world-pool-engine

## Purpose

世界混合池引擎接收已评分高分世界和随机新世界的列表，按可配置比例混合产出最终世界选择列表，支持去重和排序策略。

## Requirements

### Requirement: 世界池混合引擎按比例混合来源

系统 SHALL 提供 `WorldPoolEngine` 类，接收来自 WorldProvider 的新世界和来自 localStorage 的已评分高分世界，按可配置比例混合产出最终列表。

#### Scenario: 默认比例混合世界
- **WHEN** 调用 `WorldPoolEngine.generatePool(config)` 使用默认配置
- **THEN** 返回的世界列表中 SHALL 约 60% 来自已评分高分世界（平均分 >= 3.5）
- **AND** 约 40% 来自 WorldProvider 随机生成的新世界
- **AND** 新世界中约 70% 来自 `random` 类型 provider，约 30% 来自 `template` 类型 provider

#### Scenario: 已评分高分世界不足时自动补足
- **WHEN** 已评分高分世界数量少于目标配额的 60%
- **THEN** 系统 SHALL 用随机新世界补齐到 `poolSize`（默认 8 个）
- **AND** 补齐的新世界 SHALL 按 `randomSourceRatio` 在 random 和 template provider 间分配

#### Scenario: 无已评分世界时全部使用新世界
- **WHEN** localStorage 中无任何评分数据（首次游玩）
- **THEN** 返回的世界列表 SHALL 全部为随机生成的新世界
- **AND** SHALL 按 `randomSourceRatio` 在 random 和 template provider 间分配

### Requirement: 世界池支持自定义配置

`WorldPoolConfig` SHALL 支持从配置文件读取自定义比例，允许调整评分世界占比、总池大小、高分阈值等参数。

#### Scenario: 自定义配置覆盖默认值
- **WHEN** 提供自定义的 `WorldPoolConfig`（如 `{ sourceRatio: { rated: 0.8, random: 0.2 }, poolSize: 12 }`）
- **THEN** 引擎 SHALL 使用自定义比例（80% 已评分，20% 随机）
- **AND** 最终列表 SHALL 包含 12 个世界

#### Scenario: 配置校验
- **WHEN** `sourceRatio.rated + sourceRatio.random !== 1.0`
- **THEN** 系统 SHALL 发出 `console.warn` 警告并归一化比例

### Requirement: 去重逻辑确保世界不重复

混合池引擎 SHALL 对产出世界列表执行去重，同一 worldId 的世界 SHALL NOT 在列表中重复出现。

#### Scenario: 已评分世界与随机新世界冲突去重
- **WHEN** 随机生成的新世界 ID 与某个已评分世界 ID 相同
- **THEN** 系统 SHALL 丢弃随机新世界，重新生成
- **AND** 最终列表 SHALL 不包含重复 worldId

#### Scenario: 模板世界与随机世界不冲突
- **WHEN** 模板世界的 worldId 格式为 `{providerId}:tpl:{templateId}`
- **AND** 随机世界的 worldId 格式为 `{providerId}:{worldType}:{seed}`
- **THEN** 两套 ID 命名空间 SHALL 天然不冲突

### Requirement: 世界池输出包含来源标记

混合池产出的世界列表 SHALL 标记每个世界的来源类型（`'rated'` | `'random'` | `'template'`），供 UI 层差异化展示。

#### Scenario: 已评分世界展示评分徽章
- **WHEN** UI 渲染来自 `'rated'` 来源的世界卡片
- **THEN** SHALL 展示该世界的平均评分星级徽章
- **AND** SHALL 显示评分人数

#### Scenario: 新世界展示标签
- **WHEN** UI 渲染来自 `'random'` 来源的世界卡片
- **THEN** SHALL 展示"全新世界"标签
- **AND** `'template'` 来源的世界 SHALL 展示"精选世界"标签

### Requirement: WorldPool 为纯函数逻辑

`WorldPoolEngine` 的核心算法 SHALL 放在 `shared/lib/world/` 中实现为纯函数，SHALL NOT 依赖 React 或浏览器 API（localStorage 读写在调用方完成，作为参数传入）。

#### Scenario: 纯函数可测试
- **WHEN** 使用相同的输入参数调用 `buildWorldPool(providers, ratings, config)`
- **THEN** SHALL 返回相同的结果（给定相同的 seed RNG）
- **AND** SHALL NOT 访问 `localStorage`、`document` 或任何浏览器 API
