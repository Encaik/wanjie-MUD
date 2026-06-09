## ADDED Requirements

### Requirement: 功法收集
功法域 SHALL 管理玩家的功法收集系统。

#### Scenario: 获得功法
- **WHEN** 玩家通过战斗掉落、商店购买等方式获得功法
- **THEN** 功法添加到玩家的功法列表中

#### Scenario: 功法列表查看
- **WHEN** 打开功法面板
- **THEN** 展示所有拥有的功法，包含名称、品质、等级、属性加成

### Requirement: 功法装备
功法域 SHALL 支持玩家在攻击/防御槽位中装备功法。

#### Scenario: 装备攻击功法
- **WHEN** 玩家选择一个攻击型功法拖入攻击槽位
- **THEN** 功法装备到指定槽位，玩家战斗属性更新

#### Scenario: 卸下功法
- **WHEN** 玩家从槽位卸下功法
- **THEN** 槽位清空，对应战斗属性移除

#### Scenario: 槽位限制
- **WHEN** 玩家尝试装备超过槽位数量限制的功法
- **THEN** 提示槽位已满，需先卸下已有功法

### Requirement: 功法升级
功法域 SHALL 支持消耗材料对功法进行升级。

#### Scenario: 功法升级
- **WHEN** 玩家选择目标功法并提供升级材料
- **THEN** 材料消耗，功法等级提升，属性加成增加

### Requirement: 域状态切片
功法域 SHALL 拥有独立的状态切片 `TechniqueSlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `TechniqueSlice` 类型
- **THEN** 包含 `techniques`（功法列表）、`equippedAttackTechniques`、`equippedDefenseTechniques` 字段
