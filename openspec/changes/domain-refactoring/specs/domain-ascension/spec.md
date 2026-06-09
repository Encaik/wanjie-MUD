## ADDED Requirements

### Requirement: 飞升流程
飞升域 SHALL 管理从当前世界飞升至新世界的完整流程。

#### Scenario: 触发飞升条件
- **WHEN** 玩家等级达到当前世界最高境界
- **THEN** 解锁飞升选项

#### Scenario: 飞升渡劫
- **WHEN** 玩家选择飞升
- **THEN** 触发渡劫流程（天劫/考验），根据属性判断成功率

#### Scenario: 飞升成功
- **WHEN** 渡劫成功
- **THEN** 保留部分属性（飞升印记），进入新世界，世界系数递增

#### Scenario: 飞升失败
- **WHEN** 渡劫失败
- **THEN** 玩家保留在当前世界，获得部分经验补偿

### Requirement: 元树系统
飞升域 SHALL 提供飞升后的永久加成升级树。

#### Scenario: 元树节点解锁
- **WHEN** 飞升成功后获得元树点数
- **THEN** 可以消耗点数解锁元树节点，获得永久属性加成

#### Scenario: 元树加成应用
- **WHEN** 玩家在新世界中
- **THEN** 已解锁的元树加成自动应用到角色属性

### Requirement: 周常Boss
飞升域 SHALL 提供飞升后可挑战的周常Boss。

#### Scenario: 周Boss挑战
- **WHEN** 飞升次数达到条件
- **THEN** 解锁周常Boss挑战，每周限挑战一次

### Requirement: 域状态切片
飞升域 SHALL 拥有独立的状态切片 `AscensionSlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `AscensionSlice` 类型
- **THEN** 包含 `ascensionFlow`（飞升流程状态）、`ascensionMark`（飞升印记/次数）、`metaTree`（元树解锁状态）字段
