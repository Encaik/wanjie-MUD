## ADDED Requirements

### Requirement: WorldTypeData 包含完整数值配置

`WorldTypeData` 接口 SHALL 包含 `stats` 字段，承载该世界的完整数值配置（基础属性、成长率、系数等），替代在消费代码中硬编码。

#### Scenario: WorldTypeData 定义数值字段
- **WHEN** 检查 `WorldTypeData` 接口定义
- **THEN** SHALL 包含 `stats` 对象，字段包括：`baseHp`、`hpPerLevel`、`hpPerConstitution`、`baseAttack`、`attackPerLevel`、`attackPerConstitution`、`attackPerSpiritRoot`、`baseDefense`、`defensePerLevel`、`defensePerWillpower`
- **AND** 所有字段 SHALL 为 `number` 类型

#### Scenario: Mod 通过数据文件提供数值
- **WHEN** 一个 Mod 在其世界数据 JSON 中提供 `stats` 对象
- **THEN** `ModLoader` SHALL 正确解析并注册到 `WorldDataRegistry`
- **AND** 游戏代码通过 `registry.getWorldType(id).stats` 获取数值配置

#### Scenario: 缺少 stats 字段时抛出错误
- **WHEN** `getWorldData()` 从注册中心获取到世界数据但缺少 `stats` 字段
- **THEN** SHALL 抛出 `Error` 明确指示数据不完整
- **AND** SHALL NOT 静默使用硬编码默认值

### Requirement: getWorldData() 零硬编码

`getWorldData()` 函数 SHALL 完全从 `WorldDataRegistry` 映射数据，SHALL NOT 包含任何内联数值常量（如 `baseHp: 100`）。

#### Scenario: getWorldData 从注册中心映射
- **WHEN** 调用 `getWorldData('修仙')`
- **THEN** 返回的 `WorldStats` 对象 SHALL 完全来自 `registry.getWorldType('修仙')` 的数据
- **AND** `baseHp` 值 SHALL 等于 `data.stats.baseHp`
- **AND** `hpPerLevel` 值 SHALL 等于 `data.stats.hpPerLevel`
- **AND** 以此类推所有数值字段

#### Scenario: WorldStats 与 WorldTypeData.stats 一一对应
- **WHEN** 检查 `getWorldData()` 的返回对象
- **THEN** 每个数值字段 SHALL 直接映射自 `data.stats` 的同名字段
- **AND** SHALL NOT 存在 `||` 运算符、`??` 运算符或条件分支提供兜底值

### Requirement: StatDisplayNames 来自注册数据

`WorldStats.statDisplayNames` SHALL 来自 `WorldTypeData.stats.statDisplayNames`，SHALL NOT 在消费代码中默认为空对象。

#### Scenario: 注册数据包含属性显示名
- **WHEN** 一个世界在注册数据中提供了 `stats.statDisplayNames: { '体质': '体能' }`
- **THEN** `getWorldData().statDisplayNames` SHALL 返回该映射
- **AND** UI 组件 SHALL 使用映射后的名称显示属性

#### Scenario: 注册数据缺失属性显示名
- **WHEN** 一个世界在注册数据中未提供 `stats.statDisplayNames`
- **THEN** `getWorldData()` SHALL 抛出错误而不是返回空对象 `{}`
- **AND** 错误消息 SHALL 指明缺失的字段和世界类型 ID
