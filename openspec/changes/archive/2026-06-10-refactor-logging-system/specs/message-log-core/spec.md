## ADDED Requirements

### Requirement: 消息通道类型
系统 SHALL 使用 `MessageChannel = string` 类型标识消息通道（如 `'combat'`、`'cultivation'`、`'system'`）。预设通道为 `system`（系统消息）、`combat`（战斗消息）、`cultivation`（修炼消息）、`exploration`（探索消息）、`economy`（经济消息），启动时自动注册。

#### Scenario: 预设通道自动注册
- **WHEN** 首次调用 `getMessageManager()`
- **THEN** `system`、`combat`、`cultivation`、`exploration`、`economy` 五个通道已自动注册

#### Scenario: 自定义通道注册
- **WHEN** 模块调用 `getMessageManager().registerChannel({ name: 'auction' })`
- **THEN** `auction` 通道被添加到注册表，无需修改 `core/message-log/` 任何文件

### Requirement: MessageManager 单例
系统 SHALL 提供 `MessageManager` 类，通过 `getMessageManager()` 获取单例。MessageManager 负责：消息缓冲（最多 200 条）、消息广播、事件模板管理、与 `GameEventManager` 集成。

#### Scenario: 单例保证
- **WHEN** 多次调用 `getMessageManager()`
- **THEN** 返回相同的 MessageManager 实例

#### Scenario: 广播消息
- **WHEN** 调用 `messageManager.broadcast({ channel: 'combat', title: '战斗胜利', content: '击败了妖兽', level: 'success' })`
- **THEN** 消息存入内部缓冲，同时通过 `GameEventManager` 发射 `message:new` 事件

#### Scenario: 消息缓冲上限
- **WHEN** 缓冲中已有 200 条消息，再广播一条新消息
- **THEN** 最早的一条消息被移除，新消息加入缓冲末尾，同时发射 `message:overflow` 事件

#### Scenario: 获取消息缓冲
- **WHEN** 调用 `messageManager.getMessages()`
- **THEN** 返回当前缓冲中的所有消息（按时间戳排序）

### Requirement: 与 GameEventManager 集成
MessageManager SHALL 在初始化时订阅 `GameEventManager`，监听事件并匹配已注册的消息模板。当事件与模板匹配时，自动调用模板函数生成 `MessageRecord` 并广播。

#### Scenario: 事件触发自动生成消息
- **WHEN** `GameEventManager` 发射 `{ type: 'combat:monster_killed', payload: { monsterName: '妖兽', exp: 50 } }` 事件
- **AND** 已注册模板 `{ eventType: 'combat:monster_killed', channel: 'combat', title: (p) => '击杀妖兽', content: (p) => '获得 ' + p.exp + ' 经验' }`
- **THEN** MessageManager 自动广播一条战斗消息，内容为 "获得 50 经验"

#### Scenario: 事件无匹配模板
- **WHEN** 发射的事件类型没有任何注册的模板匹配
- **THEN** 不生成消息，不报错

#### Scenario: 通配符事件匹配
- **WHEN** 模板注册为 `eventType: 'combat:*'`（通配符匹配）
- **AND** 发射事件 `{ type: 'combat:monster_killed', ... }`
- **THEN** 模板成功匹配并生成消息

### Requirement: 消息模板注册
系统 SHALL 提供 `registerTemplate(template: MessageTemplate)` 方法，允许模块注册事件类型到游戏消息的转换模板。模板支持函数式标题/内容生成（接收事件 payload 作为参数）。

#### Scenario: 注册消息模板
- **WHEN** 调用 `messageManager.registerTemplate({ eventType: 'progression:level_up', channel: 'cultivation', level: 'success', title: (p) => '突破！', content: (p) => '达到 ' + p.newRealm + ' 境界' })`
- **THEN** 模板注册成功，后续匹配的事件自动使用此模板

#### Scenario: 多个模板匹配同一事件
- **WHEN** 两个模板匹配同一事件类型（如一个精确匹配 + 一个通配符）
- **THEN** 精确匹配的模板优先，两个模板各自独立生成一条消息
