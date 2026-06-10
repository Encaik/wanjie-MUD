# message-log-decorators

**Purpose:** 游戏消息装饰器系统——提供 `@GameMessage`、`@GameMessageAsync`、`@GameMessageClass` 装饰器，自动将方法执行结果转化为游戏消息框中的消息记录。

## Requirements

### Requirement: @GameMessage 方法装饰器
系统 SHALL 提供 `@GameMessage(options)` 方法装饰器，在方法成功执行后自动生成游戏消息。装饰器选项包含 `channel`（消息通道）、`level`（消息级别，默认 `'info'`）、`title`（标题，支持静态字符串或函数 `(args, result) => string`）、`content`（内容，支持静态字符串或函数）。

#### Scenario: 静态标题和内容
- **WHEN** 方法使用 `@GameMessage({ channel: 'cultivation', title: '修炼', content: '修炼完成' })` 装饰
- **AND** 方法正常返回
- **THEN** 生成一条 `channel='cultivation'`、`level='info'`、`title='修炼'`、`content='修炼完成'` 的消息

#### Scenario: 函数式标题和内容
- **WHEN** 使用 `@GameMessage({ channel: 'combat', title: (args, result) => '击败 ' + args[0], content: (args, result) => '获得 ' + result.exp + ' 经验' })`
- **AND** 调用 `attack('妖兽')` 返回 `{ exp: 100 }`
- **THEN** 生成标题为 "击败 妖兽"、内容为 "获得 100 经验" 的消息

#### Scenario: 方法抛出异常不生成消息
- **WHEN** 被 `@GameMessage()` 装饰的方法抛出异常
- **THEN** 不生成游戏消息，异常正常向上传播

#### Scenario: 自定义消息级别
- **WHEN** 使用 `@GameMessage({ level: 'warning', channel: 'system', title: '警告', content: '资源不足' })`
- **THEN** 生成的消息 `type` 字段为 `'warning'`

### Requirement: @GameMessageClass 类装饰器
系统 SHALL 提供 `@GameMessageClass(options)` 类装饰器，对类中所有公共方法（不含构造函数）自动应用 `@GameMessage`。选项支持 `channel`（默认通道）、`exclude`（排除的方法名数组）。

#### Scenario: 批量装饰类方法
- **WHEN** 类使用 `@GameMessageClass({ channel: 'economy' })` 装饰，有 `buy()`、`sell()`、`trade()` 三个方法
- **THEN** 三个方法执行后均自动生成 `channel='economy'` 的消息，标题默认为方法名

#### Scenario: 排除特定方法
- **WHEN** 使用 `@GameMessageClass({ channel: 'system', exclude: ['toString', 'toJSON'] })`
- **THEN** `toString` 和 `toJSON` 不生成消息

### Requirement: 装饰器消息通过 MessageManager 广播
`@GameMessage` 和 `@GameMessageClass` SHALL 通过 `getMessageManager().broadcast()` 发送消息，保证消息进入统一缓冲并触发 `message:new` 事件。

#### Scenario: 装饰器消息触发事件
- **WHEN** 被 `@GameMessage` 装饰的方法成功返回
- **THEN** `GameEventManager` 收到 `message:new` 事件，payload 为生成的 `MessageRecord`
