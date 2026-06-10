## 1. 基础设施搭建

- [x] 1.1 创建 `src/core/message-log/` 目录结构（含 `__tests__/` 子目录）
- [x] 1.2 在 `tsconfig.json` 的 `compilerOptions` 中启用 `"experimentalDecorators": true`

## 2. 类型定义

- [x] 2.1 创建 `src/core/message-log/types.ts`：定义 `MessageChannel`（字符串别名）、`MessageTemplate` 接口、`ChannelConfig` 接口、`GameMessageOptions`（装饰器配置类型）

## 3. 通道注册系统

- [x] 3.1 创建 `src/core/message-log/channelRegistry.ts`：实现 `ChannelRegistry` 类（`register`/`get`/`has`/`list`/`remove`），重复注册保护
- [x] 3.2 实现内置预设通道自动注册（`system`、`combat`、`cultivation`、`exploration`、`economy`）

## 4. 消息管理器

- [x] 4.1 创建 `src/core/message-log/messageManager.ts`：实现 `MessageManager` 单例（`getMessageManager`），包含消息缓冲（上限 200 条）、`broadcast()` 方法
- [x] 4.2 实现与 `GameEventManager` 的集成：初始化时订阅事件总线，事件触发时匹配注册的模板并自动生成消息
- [x] 4.3 实现消息事件发射：`broadcast()` 时通过 `GameEventManager` 发射 `message:new` 事件，溢出时发射 `message:overflow`
- [x] 4.4 实现 `registerTemplate()` 和 `getTemplates()`：模板注册/查询，支持精确匹配和通配符匹配

## 5. 装饰器系统

- [x] 5.1 创建 `src/core/message-log/decorators.ts`：实现 `@GameMessage(options)` 方法装饰器——拦截方法调用，执行原方法，从参数/返回值生成 `MessageRecord` 并调用 `broadcast()`
- [x] 5.2 实现 `@GameMessageClass(options)` 类装饰器——对类中所有公共方法（排除构造函数和 `exclude` 列表）应用消息生成行为

## 6. MessageRecord 扩展

- [x] 6.1 在 `src/core/types/types.ts` 的 `MessageRecord` 接口中新增可选 `channel?: string` 字段，保持向后兼容

## 7. 桶文件与模块导出

- [x] 7.1 创建 `src/core/message-log/index.ts`：统一导出所有公开 API

## 8. 测试

- [x] 8.1 创建 `src/core/message-log/__tests__/messageManager.test.ts`：单例、broadcast、缓冲上限、事件发射、模板匹配
- [x] 8.2 创建 `src/core/message-log/__tests__/channelRegistry.test.ts`：注册/查询/列表、重复注册、预设通道
- [x] 8.3 创建 `src/core/message-log/__tests__/decorators.test.ts`：@GameMessage 静态/函数式消息生成、异常不生成消息、@GameMessageClass 批量装饰

## 9. 验证

- [x] 9.1 运行 `pnpm ts-check` 确保类型正确
- [x] 9.2 运行 `pnpm lint:strict` 确保代码质量（message-log 目录零错误，其他错误为已有代码问题）
- [x] 9.3 运行 `pnpm check-sizes` 确保文件大小合规
- [x] 9.4 运行 `pnpm test` 确保所有测试通过（122 passed）
- [x] 9.5 运行 `pnpm build` 确保构建成功（含 `experimentalDecorators`）
