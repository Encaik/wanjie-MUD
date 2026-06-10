## Context

### 当前状态

游戏消息系统目前是隐式的——各处 Hook 和 logic 通过构造 `MessageRecord` 对象并手动更新 `GameState.messages` 来添加消息。这导致：

- 消息生成逻辑分散在 20+ 个模块中，无统一入口
- 消息与事件系统脱节：事件触发点通常也是消息生成点，但两者无关联
- 缺乏消息通道分类：所有消息混在一起，UI 无法按类型筛选
- 无消息模板：相同类型的消息（如"获得经验"）在不同地方重复构造

`core/engine/messageDB.ts`（387 行）仅负责 IndexedDB 持久化，是存储层而非消息创建层。

### 目标架构

```
事件触发 (GameEventManager)
  │
  ├──► MessageManager (core/message-log/)  ← 核心：消息创建与分发
  │      │
  │      ├──► 消息通道注册表 (ChannelRegistry)
  │      ├──► 消息模板引擎 (模板匹配 event → MessageRecord)
  │      └──► 消息缓冲 + 事件发射
  │
  ├──► 装饰器 @GameMessage
  │      │
  │      └──► 自动将方法返回值转化为消息
  │
  └──► React Hook (modules/message-log/hooks/)
         │
         ├──► 读取 MessageManager 缓冲
         ├──► 更新 GameState.messages
         └──► UI 消息框渲染
```

### 约束

- `core/` 不依赖 `modules/`，不依赖 React
- `MessageManager` 不直接操作 `GameState`（那是 React 层的事）
- 与现有 `GameEventManager` 单例模式一致
- 与现有 `MessageRecord` 类型兼容，扩展而非破坏

## Goals / Non-Goals

**Goals:**
- 在 `core/message-log/` 中创建统一的游戏消息管理中心
- 提供消息通道注册机制，新通道零修改添加
- 提供 `@GameMessage` 装饰器简化消息生成
- 与事件系统集成：事件 → 模板匹配 → 自动消息
- 消息缓冲 + `message:new` 事件通知 React 层消费
- 与现有 `MessageRecord` 类型和 `messageDB.ts` 共存

**Non-Goals:**
- 不修改 `messageDB.ts` 的 IndexedDB 持久化逻辑（那是存储层）
- 不实现消息 UI 组件（属于 `modules/` 或 `views/`）
- 不替换现有的 `GameState.messages` 数组（消息的最终归宿不变）
- 不在首版实现消息历史搜索/过滤（后续按需添加）

## Decisions

### D1: 消息通道采用注册制，基于字符串标识

**选择**：`type MessageChannel = string`，通过 `ChannelRegistry` 运行时注册。预设 `system`、`combat`、`cultivation`、`exploration`、`economy`。

**替代方案**：
- **枚举 `MessageChannel`**：添加新通道需修改枚举，违反开闭原则。❌
- **完全自由字符串**：无注册验证，拼写错误难排查。❌

**理由**：与 `EventType = string` 的设计一致——模块自由定义，运行时注册提供可发现性和验证。

### D2: MessageManager 通过事件通知 React 层，而非直接操作 GameState

**选择**：`MessageManager` 维护内部消息缓冲，每次新消息时通过 `GameEventManager` 发射 `message:new` 事件。React Hook 监听该事件更新 `GameState.messages`。

```
MessageManager.broadcast(msg)
  → buffer.push(msg)
  → gameEventManager.emit({ type: 'message:new', payload: msg })
  → React Hook 消费 → setGameState(prev => ({ ...prev, messages: [...prev.messages, msg] }))
```

**替代方案**：
- **MessageManager 直接修改 GameState**：违反 `core/` 不依赖 React 的规则。❌
- **返回消息由调用方处理**：失去统一性，分散了消息处理逻辑。❌

**理由**：符合项目"core 发射事件 → modules 处理状态"的数据流模式。`core/` 保持纯净，React 层做状态同步。

### D3: 装饰器采用 TypeScript 实验性装饰器

**选择**：启用 `experimentalDecorators`，实现 `@GameMessage` 方法装饰器。

**装饰器行为**：
1. 拦截方法调用
2. 执行原始方法
3. 根据配置从参数/返回值生成 `MessageRecord`
4. 调用 `MessageManager.broadcast()`

```typescript
class CultivationService {
  @GameMessage({
    channel: 'cultivation',
    title: '修炼完成',
    content: (args, result) => `获得 ${result.experience} 点修炼经验`,
    level: 'success'
  })
  cultivate(player: Protagonist, hours: number): CultivationResult {
    // 原有逻辑
  }
}
```

**替代方案**：
- **高阶函数包装**：无语法糖，调用方需显式包装每个方法。❌
- **Stage 3 装饰器**：Next.js 16 支持不完整。❌

**理由**：装饰器提供最简洁的 API，一处注解替代 5-10 行手动消息构造代码。

### D4: 消息模板系统实现事件→消息的自动转换

**选择**：`MessageManager.registerTemplate({ eventType, channel, titleTemplate, contentTemplate, level })`。当匹配的事件触发时自动生成消息。

```typescript
messageManager.registerTemplate({
  eventType: 'combat:monster_killed',
  channel: 'combat',
  title: (p) => `击败 ${p.monsterName}`,
  content: (p) => `获得 ${p.experience} 经验，掉落 ${p.loot}`,
  level: 'success',
});
```

事件匹配使用已有的 `EventMatcher` 模式（支持通配符 `combat:*`）。

**替代方案**：
- **在每个事件监听器中手写消息**：重复代码，模板无法复用。❌
- **在事件定义中嵌入消息**：耦合事件数据与展示逻辑。❌

**理由**：模板是纯配置，模块声明自己的事件→消息映射，核心代码零修改。

### D5: 文件结构

```
core/message-log/
├── index.ts              # 桶导出
├── types.ts              # MessageChannel、MessageTemplate、GameMessageOptions 等
├── messageManager.ts     # MessageManager 单例（缓冲、广播、模板匹配）
├── channelRegistry.ts    # ChannelRegistry（通道注册/查询）
├── decorators.ts         # @GameMessage、@GameMessageClass
└── __tests__/
    ├── messageManager.test.ts
    ├── channelRegistry.test.ts
    └── decorators.test.ts
```

## Risks / Trade-offs

- **[R1] 装饰器需要 `experimentalDecorators`** → 先在 `tsconfig.json` 启用并 `pnpm build` 验证。
- **[R2] 消息缓冲内存增长** → 缓冲上限 200 条，超出时移除最旧消息，同时发射 `message:overflow` 事件通知持久化。
- **[R3] MessageRecord 扩展 `channel` 字段** → 现有类型 `type: 'success'|'failure'|'info'|'warning'` 保持不变，新增可选 `channel?: string`，向后兼容。
- **[R4] 与现有手动消息生成并存** → 新系统是增量添加，不强制替换现有代码。逐步迁移。

## Migration Plan

1. **Phase 1**：创建 `core/message-log/` 所有文件，`tsconfig.json` 启用装饰器
2. **Phase 2**：在 `MessageRecord` 类型中新增可选 `channel` 字段
3. **Phase 3**：在一个模块（如 `combat`）中试点装饰器和模板，验证流程
4. **Phase 4**：运行 `pnpm ts-check`、`pnpm build`、`pnpm test` 验证

**回滚**：新系统为纯增量，移除 `core/message-log/` 目录和 `experimentalDecorators` 标志即可恢复原状。

## Open Questions

- Q1: 消息缓冲是存在 MessageManager 中还是直接同步到 GameState？→ 设计为双重：MessageManager 缓冲作为短暂中间层，React Hook 消费后写入 GameState。
- Q2: 模板中的 `title/content` 函数是否需要支持访问全局状态来生成更丰富的消息？→ 首版仅使用事件 payload 数据，后续按需扩展。
