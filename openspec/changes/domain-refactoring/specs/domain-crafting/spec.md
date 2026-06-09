## ADDED Requirements

### Requirement: 炼丹系统
炼制域 SHALL 提供丹药炼制功能。

#### Scenario: 选择配方
- **WHEN** 玩家打开炼丹面板
- **THEN** 显示可用配方列表，包含材料需求、炼制时间、成功率和产物品质

#### Scenario: 开始炼丹
- **WHEN** 玩家选择配方并确认
- **THEN** 消耗对应材料，开始炼制计时，记录炼丹状态

#### Scenario: 炼丹完成
- **WHEN** 炼制计时结束
- **THEN** 根据成功率和品质生成丹药，添加到背包

### Requirement: 炼器系统
炼制域 SHALL 提供装备锻造功能。

#### Scenario: 选择配方
- **WHEN** 玩家打开炼器面板
- **THEN** 显示可用锻造配方列表

#### Scenario: 开始锻造
- **WHEN** 玩家选择配方并确认
- **THEN** 消耗对应材料，开始锻造计时

#### Scenario: 锻造完成
- **WHEN** 锻造计时结束
- **THEN** 生成对应品质的装备，添加到背包

### Requirement: 域状态切片
炼制域 SHALL 拥有独立的状态切片 `CraftingSlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `CraftingSlice` 类型
- **THEN** 包含 `alchemy`（炼丹状态）、`forge`（炼器状态）字段
