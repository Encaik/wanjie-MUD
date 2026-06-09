## MODIFIED Requirements

### Requirement: WorldStats 结构包含 statDisplayNames 及完整数值

`WorldStats` 接口 SHALL 包含 `statDisplayNames` 字段，定义该世界的属性显示名映射。同时 SHALL 从 `WorldTypeData.stats` 获取全部数值配置（`baseHp`、`hpPerLevel`、`baseAttack` 等），SHALL NOT 在消费代码中硬编码任何数值。

#### Scenario: WorldStats 包含 statDisplayNames
- **WHEN** 读取 `getWorldData('科技')` 返回的 `WorldStats`
- **THEN** SHALL 包含 `statDisplayNames`，值为注册数据中定义的映射（如 `{ '体质': '体能', '灵根': '智力', '悟性': '反应', '幸运': '技术', '意志': '魅力' }`）

#### Scenario: WorldStats 数值完全来自注册数据
- **WHEN** 读取 `getWorldData('科技')` 返回的 `WorldStats`
- **THEN** `baseHp`、`hpPerLevel` 等数值字段 SHALL 等于注册数据中 `stats` 对象的对应字段
- **AND** SHALL NOT 存在从消费代码内联的数值常量

#### Scenario: 缺失 statDisplayNames 时无兜底
- **WHEN** 一个世界类型的注册数据缺少 `statDisplayNames`
- **THEN** `getWorldData()` SHALL 抛出错误
- **AND** SHALL NOT 使用空对象 `{}` 或修仙默认值作为兜底

#### Scenario: 缺失任何数值字段时报错
- **WHEN** 一个世界类型的注册数据缺少 `stats` 或其子字段（如 `stats.baseHp` 为 `undefined`）
- **THEN** `getWorldData()` SHALL 抛出错误，明确指出缺失字段和世界类型 ID
- **AND** SHALL NOT 静默使用任何默认值
