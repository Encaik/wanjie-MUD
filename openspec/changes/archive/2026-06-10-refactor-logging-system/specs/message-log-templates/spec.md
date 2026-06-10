## ADDED Requirements

### Requirement: MessageTemplate 接口
系统 SHALL 提供 `MessageTemplate` 接口，包含 `eventType`（事件类型字符串，支持 `*` 通配符）、`channel`（目标消息通道）、`level`（消息级别，默认 `'info'`）、`title`（标题生成器：字符串或 `(payload) => string`）、`content`（内容生成器：字符串或 `(payload) => string`）、`priority`（优先级，数值小的先匹配，默认 0）字段。

#### Scenario: 最小模板配置
- **WHEN** 注册 `{ eventType: 'system:startup', channel: 'system', title: '游戏启动', content: '欢迎回来' }`
- **THEN** 当 `system:startup` 事件触发时，自动生成对应消息

#### Scenario: 函数式模板
- **WHEN** 注册 `{ eventType: 'economy:purchase', channel: 'economy', title: (p) => '购买了 ' + p.itemName, content: (p) => '花费 ' + p.cost + ' 灵石' }`
- **THEN** 消息的标题和内容由 payload 动态生成

#### Scenario: 模板优先级
- **WHEN** 注册两个匹配同一事件的模板，一个 `priority: 0`（精确匹配），一个 `priority: 10`（通配符匹配）
- **THEN** priority 0 的模板先执行生成消息

### Requirement: 模板通配符匹配
消息模板的 `eventType` SHALL 支持两种通配符模式：`namespace:*`（匹配所有该命名空间的事件）和 `*`（匹配所有事件）。精确匹配优先于通配符匹配。

#### Scenario: 命名空间通配符
- **WHEN** 注册模板 `{ eventType: 'combat:*', channel: 'combat', ... }`
- **THEN** `combat:monster_killed`、`combat:damage_dealt` 等所有 `combat:` 前缀事件都匹配

#### Scenario: 精确匹配优先
- **WHEN** 同时注册 `eventType: 'combat:monster_killed'`（精确）和 `eventType: 'combat:*'`（通配）
- **AND** 发射 `combat:monster_killed` 事件
- **THEN** 两个模板各自生成一条消息，精确匹配的模板先生成

### Requirement: 模块声明式模板注册
模块 SHALL 通过调用 `getMessageManager().registerTemplate(template)` 注册自己的消息模板。新增消息类型时，只需在模块中调用此方法，无需修改 `core/message-log/` 中的代码。

#### Scenario: 新模块独立注册模板
- **WHEN** `modules/auction/` 在某处调用 `getMessageManager().registerTemplate({ eventType: 'auction:bid_won', channel: 'auction', title: '竞拍成功', content: (p) => '获得 ' + p.itemName })`
- **THEN** 不需要修改 `core/message-log/` 任何文件，该模板即可生效

#### Scenario: 模板热注册
- **WHEN** 在运行时动态注册一个新模板
- **THEN** 该模板立即可用，后续匹配的事件会使用它

### Requirement: 获取模块的模板列表
系统 SHALL 提供 `messageManager.getTemplates(channel?: string)` 方法，返回指定通道（或全部）已注册的模板列表，用于调试和 UI 展示。

#### Scenario: 按通道查询模板
- **WHEN** 调用 `messageManager.getTemplates('combat')`
- **THEN** 返回所有 `channel='combat'` 的模板

#### Scenario: 查询所有模板
- **WHEN** 调用 `messageManager.getTemplates()` 不传参数
- **THEN** 返回所有已注册模板
