## 1. 创建新事件总线核心

- [x] 1.1 创建 `core/events/types.ts` 新版类型定义：`EventType`（字符串联合）、`GameEvent<T>`（泛型事件对象）、`EventListener<T>`（监听器类型）、`EventBusOptions`（订阅选项含 priority）、`EventMatcher`（匹配器类型：字符串/通配符/函数）
- [x] 1.2 创建 `core/events/patternMatcher.ts` 模式匹配逻辑：`createMatcher()` 工厂函数（支持精确字符串、`namespace:*` 通配符、自定义过滤函数）、`matchPattern()` 纯函数（判断事件类型是否匹配给定 pattern）
- [x] 1.3 创建 `core/events/eventRegistry.ts` 事件注册中心：`EventRegistry.registerModule(namespace, eventDefs)` 方法、返回含类型安全 emit 和事件名常量的 ModuleEventEmitter、重复注册警告+合并逻辑、可选 Zod schema 绑定
- [x] 1.4 创建 `core/events/eventBus.ts` 核心事件总线：`EventBus` 类（单例）、`on(type, handler, opts?)` 订阅返回取消函数、`once(type, handler)` 一次性订阅、`off(type, handler)` 精确取消、`emit(type, payload)` 触发（含错误隔离 try-catch）、`removeAllListeners(type?)` 清除、`getHistory()`/`clearHistory()` 事件历史、优先级排序执行逻辑
- [x] 1.5 更新 `core/events/index.ts` 桶文件：导出新的公共 API（`gameEventBus` 单例、`eventRegistry`、`on`/`once`/`off`/`emit` 便捷绑定、类型定义），同时保留旧的 `eventManager.ts` 导出（新旧共存过渡期）

## 2. 迁移模块事件声明到各模块

- [x] 2.1 在 `modules/combat/` 中创建/更新事件声明文件：从旧 `GameEventType` 枚举中提取战斗相关事件（`monster_killed`、`boss_killed`、`elite_killed`），通过 `eventRegistry.registerModule('combat', {...})` 注册
- [x] 2.2 在 `modules/collection/` 中创建/更新事件声明文件：提取收集相关事件（`item_collected`、`technique_collected`、`equipment_collected`、`legendary_obtained`、`full_equipped`、`technique_max_level`、`equipment_max_level`），注册到 `collection` 命名空间
- [x] 2.3 在 `modules/progression/` 中创建/更新事件声明文件：提取进度相关事件（`level_up`、`realm_breakthrough`、`adventure_completed`、`cultivation_done`），注册到 `progression` 命名空间
- [x] 2.4 在 `modules/world/` 或 `modules/theme/` 中创建/更新事件声明文件：提取世界相关事件（`world_changed`），注册到 `world` 命名空间

## 3. 迁移现有 callers 到新 API

- [x] 3.1 迁移 `src/core/engine/gameSystems.ts`：将 `gameEventManager.destroy()` 调用改为新总线单例的 `removeAllListeners()`；将事件触发调用从 `triggerEvent(GameEventType.X, payload)` 改为 `emit('namespace:event_name', payload)`
- [x] 3.2 迁移 `src/modules/collection/logic/achievement/achievementSystem.ts`：将 `subscribeToEvents()` 中的 `addListener(GameEventType.X, handler)` 改为 `on('namespace:event_name', handler)`，更新 `AchievementCondition.eventType` 字段类型从枚举值改为字符串
- [x] 3.3 迁移 `src/modules/collection/logic/collectionSystem.ts`：将 `subscribeToEvents()` 中的 `addListener` 调用改为新 `on()` API，handler 内的事件类型判断从 `event.type === GameEventType.X` 改为字符串比较
- [x] 3.4 迁移 `src/modules/theme/events.ts`：将 `subscribeThemeEvents()` 中的 `addListener` + 事件处理改为新 API；如果使用了通配符匹配场景，改用 `on('collection:*', handler)` 简化

## 4. 清理旧代码和重复文件

- [x] 4.1 删除 `src/modules/exploration/logic/dungeon/eventManager.ts` 重复副本：确认无其他文件引用后删除，更新 `dungeon/` 目录下可能引用它的文件（搜索 `from './eventManager'` 或 `from '../eventManager'` within dungeon）
- [x] 4.2 清理 `src/modules/social/announcementTypes.ts` 中的重复 `GameEventType` 枚举：将该文件中的事件类型定义为独立的字符串常量或迁移到统一注册中心
- [x] 4.3 删除 `src/core/events/eventManager.ts` 旧实现：确认所有 callers 已迁移后删除整个文件
- [x] 4.4 更新 `src/core/events/index.ts` 桶文件：移除旧导出（`GameEventType`、`EventPayloadMap`、`gameEventManager`、`triggerEvent`），只保留新 API 导出

## 5. 质量验证

- [x] 5.1 运行 `pnpm ts-check` 确保类型检查通过（0 errors）
- [x] 5.2 运行 `pnpm lint` 确保 ESLint 规则通过
- [x] 5.3 运行 `pnpm build` 确保静态构建成功
- [x] 5.4 手动验证：启动 `pnpm dev`，测试游戏核心流程（战斗触发事件 → 成就/收集系统响应），确认事件系统工作正常
