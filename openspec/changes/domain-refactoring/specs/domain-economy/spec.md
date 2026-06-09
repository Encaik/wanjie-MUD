## ADDED Requirements

### Requirement: 商店系统
经济域 SHALL 提供多层级的商店买卖功能。

#### Scenario: 商品列表
- **WHEN** 打开商店面板
- **THEN** 按分类展示可购买商品，包含名称、价格、货币类型、描述

#### Scenario: 购买商品
- **WHEN** 玩家选择商品并确认购买，货币充足
- **THEN** 扣除对应货币，商品添加到背包

#### Scenario: 货币不足
- **WHEN** 玩家尝试购买但货币不足
- **THEN** 提示货币不足，不执行购买

### Requirement: 多种货币支持
经济域 SHALL 支持多种游戏货币（灵石、贡献度、宗门点数、荣誉点、飞升印记、活动代币）。

#### Scenario: 货币余额
- **WHEN** 查看商店面板
- **THEN** 显示所有货币的当前余额

#### Scenario: 混合货币购买
- **WHEN** 商品支持多种货币购买
- **THEN** 玩家可选择使用哪种货币支付

### Requirement: 每日特卖
经济域 SHALL 提供每日刷新的限时特卖商品。

#### Scenario: 特卖商品刷新
- **WHEN** 每日重置时间到达
- **THEN** 特卖商品列表刷新，更新折扣价格

#### Scenario: 特卖倒计时
- **WHEN** 查看特卖面板
- **THEN** 显示距离下次刷新的倒计时

### Requirement: 商店等级
经济域 SHALL 提供商店等级系统，影响商品品质和种类。

#### Scenario: 商店升级
- **WHEN** 玩家累计消费达到阈值
- **THEN** 商店等级提升，解锁更高品质商品

### Requirement: 经济平衡
经济域 SHALL 管理货币流通和灵石回收机制。

#### Scenario: 灵石回收
- **WHEN** 玩家在商店消费灵石
- **THEN** 灵石从流通中回收，维护经济平衡

### Requirement: 域状态切片
经济域 SHALL 拥有独立的状态切片 `EconomySlice`。

#### Scenario: 状态结构
- **WHEN** 查看 `EconomySlice` 类型
- **THEN** 包含 `currencies`（多币种余额）、`shopLevel`、`dailySale`、`purchaseHistory` 字段
