## ADDED Requirements

### Requirement: 背包管理
装备域 SHALL 管理玩家的物品背包系统。

#### Scenario: 物品获得
- **WHEN** 玩家通过战斗、商店、奖励获得物品
- **THEN** 物品按唯一 ID 和堆叠规则添加到背包

#### Scenario: 物品消耗
- **WHEN** 玩家使用或消耗物品
- **THEN** 背包中对应物品数量减少，数量归零时移除

#### Scenario: 物品查询
- **WHEN** 通过物品 ID 查询背包
- **THEN** 返回物品的数量和详情

### Requirement: 装备槽位
装备域 SHALL 管理 6 个装备槽位（近战、远程、头部、身体、腿部、脚部）。

#### Scenario: 装备武器
- **WHEN** 玩家选择武器拖入近战/远程槽位
- **THEN** 装备生效，玩家战斗属性更新

#### Scenario: 卸下装备
- **WHEN** 玩家从槽位卸下装备
- **THEN** 装备回到背包，对应属性移除

#### Scenario: 装备属性加成
- **WHEN** 装备在槽位中
- **THEN** 装备的属性加成（基础属性、词缀、套装效果）应用到玩家

### Requirement: 品质稀有度
装备域 SHALL 管理 8 级品质系统（传说→史诗→稀有→精良→优秀→普通→劣质→基础）。

#### Scenario: 品质影响属性
- **WHEN** 装备生成为某品质
- **THEN** 装备的基础属性、词缀数量与该品质等级匹配

### Requirement: 碎片合成
装备域 SHALL 支持碎片收集和合成完整物品。

#### Scenario: 碎片掉落
- **WHEN** 击败敌人
- **THEN** 按概率掉落功法/装备碎片，碎片记录来源名称和稀有度

#### Scenario: 碎片合成
- **WHEN** 收集到足够数量的同名碎片
- **THEN** 可以合成完整的功法或装备

### Requirement: 域状态切片
装备域 SHALL 拥有独立的状态切片 `EquipmentSlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `EquipmentSlice` 类型
- **THEN** 包含 `inventory`（背包）、`equipments`（装备列表）、6 个装备槽位、`fragmentInventory`（碎片背包）字段
