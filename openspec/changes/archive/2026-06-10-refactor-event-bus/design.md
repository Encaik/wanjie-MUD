## Context

### 当前状态

当前事件总线位于 `src/core/events/eventManager.ts`，采用单例模式 + 枚举定义事件类型。核心问题是**事件类型和负载定义与事件总线代码强耦合在同一个文件中**——新增任何事件类型都必须修改这个文件。

更严重的是，`src/modules/exploration/logic/dungeon/eventManager.ts` 是 core 文件的**逐字复制副本**，违反了 "同一份内容只在一处存在" 的架构约束。此外 `src/modules/social/announcementTypes.ts` 还定义了第三个独立的 `GameEventType` 枚举。

### 约束

- `core/events/` 是底层基础设施，不依赖 `modules/`
- 遵循五层架构：core 不能 import modules
- 保持向后兼容：现有 callers 需要平滑迁移
- 禁止过渡兼容代码（`@deprecated`、Legacy 别名等）

## Goals / Non-Goals

**Goals:**
- 新增事件类型时**无需修改事件系统核心代码**（开闭原则）
- 消除重复代码，统一事件总线入口
- 支持事件模式匹配（通配符订阅），减少样板代码
- 增强 API：`once()`、`removeListener()`、优先级排序
- 事件命名空间化，避免不同模块事件名冲突

**Non-Goals:**
- 不引入外部依赖（如 RxJS、mitt 等第三方库）
- 不改变 core 不依赖 modules 的架构约束
- 不引入异步事件队列/批处理（可后续迭代）
- 不改变事件总线的同进程同步调度模型

## Decisions

### 决策 1：事件类型从枚举迁移为字符串命名空间

**选择**：事件类型用 `namespace:action` 格式的字符串，如 `combat:monster_killed`。不再使用 TypeScript enum。

**理由**：
- 枚举是封闭的——新增成员必须修改文件。字符串是开放的——任何模块定义了 `my_module:my_event` 字符串，总线就知道如何路由它
- 命名空间提供命名空间隔离和自文档化
- 字符串天然支持通配符匹配（如 `combat:*`）
- 放弃的编译时枚举安全性可通过模块级类型导出弥补

**替代方案**：继续使用 enum + 模块声明合并（declaration merging）。被否决——声明合并仍需要模块在 `GameEventType` 文件中声明自己的成员，只是形式不同。

### 决策 2：事件注册表（EventRegistry）作为模块声明机制

**选择**：新增 `EventRegistry` 类，提供 `registerModule(namespace, eventDefs)` 方法。各模块在初始化时调用注册。

```
core/events/eventRegistry.ts  ← 注册中心（core 层）
modules/combat/events.ts       ← 模块声明自己的事件（modules 层）
modules/collection/events.ts   ← 模块声明自己的事件（modules 层）
```

**流程**：
1. 模块 A 调用 `eventRegistry.registerModule('combat', { monster_killed: { description: '...' }, ... })`
2. 事件总线内部注册这些事件类型，可选绑定 Zod schema 做运行时验证
3. 模块 B 通过 `on('combat:monster_killed', handler)` 订阅

**理由**：注册表是纯声明式基础设施（类似 core/registry/ 的其他注册中心），不依赖 React 或 modules，符合 core 层约束。

### 决策 3：模式匹配订阅

**选择**：`on()` 和 `once()` 接受字符串精确匹配或通配符匹配。

```typescript
// 精确匹配
eventBus.on('combat:monster_killed', handler);

// 通配符：所有 combat 事件
eventBus.on('combat:*', handler);

// 函数过滤器
eventBus.on(type => type.startsWith('combat:'), handler);
```

内部实现：订阅时解析 pattern，触发事件时遍历匹配。

**理由**：当前每个事件类型都需要单独 `addListener`，新增事件时如果有多事件监听需求就需要多处修改。模式匹配让一个订阅覆盖整组事件。

**替代方案**：RegExp 匹配——更灵活但性能开销更大且对普通用途过度设计。选择 `*` 通配符 + 函数过滤器覆盖所有场景。

### 决策 4：单例 + API 增强

**选择**：保留单例模式，API 从 3 个方法扩展为 6 个核心方法：

| 方法 | 说明 | 状态 |
|------|------|------|
| `on(type, handler, opts?)` | 订阅事件，返回取消函数 | **新**（替代 addListener） |
| `once(type, handler)` | 一次性订阅，触发后自动取消 | **新** |
| `off(type, handler)` | 精确取消指定监听器 | **新** |
| `emit(type, payload)` | 触发事件 | **保留**（原 triggerEvent） |
| `removeAllListeners(type?)` | 清除监听器 | **保留** |
| `getHistory()` | 事件历史 | **保留** |

新增选项：
- `opts.priority: number` — 执行顺序（数字小的先执行，默认 0）
- `opts.filter: (event) => boolean` — 精确事件的附加过滤条件

**理由**：`on`/`off`/`once`/`emit` 是事件总线的业界标准命名（对标 Node.js EventEmitter），降低学习成本。`priority` 支持确定性的执行顺序。

### 决策 5：文件结构重组织

**选择**：

```
core/events/
├── index.ts           # 统一导出
├── types.ts           # 事件类型定义（GameEvent, EventListener, EventType）
├── eventBus.ts        # 核心总线实现（EventBus 类 + 单例 gameEventBus）
├── eventRegistry.ts   # 事件注册中心（EventRegistry 类）
└── matcher.ts         # 模式匹配逻辑（纯函数）
```

删除的重复文件：`modules/exploration/logic/dungeon/eventManager.ts`

**理由**：职责分离——types 只管类型、bus 只管发布订阅、registry 只管注册、matcher 只管匹配。避免将无关功能塞进单文件。

## Risks / Trade-offs

- **[风险] 迁移成本**：现有 4 个 callers 需要更新 API 调用 → 缓解：改动机械且范围可控，每次迁移只需改调用名 + 事件名字符串化
- **[风险] 失去编译时事件名检查**：枚举变字符串后拼写错误不会编译报错 → 缓解：每个模块导出事件名常量（`export const COMBAT_EVENTS = { MONSTER_KILLED: 'combat:monster_killed' as const }`）；Zod schema 提供运行时验证
- **[风险] 重复副本删除可能遗漏引用**：`modules/exploration/logic/dungeon/` 中可能还有其他文件引用该副本 → 缓解：实现前用 grep 确认所有引用点
- **[权衡] 通配符匹配性能**：每个事件触发时需遍历所有通配符订阅 → 实际影响可忽略（游戏事件频率低，订阅量少）

## Migration Plan

**分 4 步迁移**：

1. **创建新事件总线核心** — 在 `core/events/` 中创建新文件，新旧并存
2. **迁移 callers** — 逐一更新 4 个 callers 到新 API
3. **迁移模块事件声明** — 将各模块的事件类型声明迁移到模块目录下的 `events.ts`
4. **删除旧代码** — 移除旧的 `eventManager.ts`、dungeon 副本、announcementTypes 中的重复枚举

回滚策略：如果迁移过程中出现问题，恢复旧文件即可（步骤 1 保证了新旧并存）。
