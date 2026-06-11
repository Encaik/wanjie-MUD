## Context

MUD 游戏需要两种时间概念：

- **游戏世界时间（GameClock）** — 虚拟世界的时间流逝，绑定于玩家行为（修炼、战斗、探索等）。用于角色年龄增长、剧情推进、世界时间显示。
- **现实时间（RealClock）** — 真实时间的流逝，用于技能冷却、离线收益计算、每日/每周刷新、资源恢复等。

当前实现散落在三个位置，存在严重代码重复：

| 位置 | 文件 | 问题 |
|------|------|------|
| `modules/time/logic/` | `timeSystem.ts`, `offlineProcessor.ts`, `offlineTimeProcessor.ts` | 核心基础设施却放在 modules/；两个离线处理器并存 |
| `modules/tower/logic/` | `idleSystem.ts` | 第三个离线处理器，重复定义 `OfflineProcessResult` |
| `core/types/types.ts` | `GameState` 包含 `timeSystem`/`offlineResult`/`offlineResultV2`/`lastExploreTime` | core 违规依赖 modules；字段臃肿 |

重复代码：
- `formatOfflineDuration` — 4 处定义
- `calculateStaminaRecovery` — 2 处定义
- `processExpiredCooldowns` — 2 处定义
- `OfflineProcessResult` — 3 个版本

架构约束：
- `core/` 不能依赖 `modules/`，但当前 `core/types` 导入了 `@/modules/time/`
- `core/` 不能包含 React 组件/Hooks
- 破坏性更新，不兼容旧存档

## Goals / Non-Goals

**Goals:**
- 在 `core/time/` 中建立统一的内聚时间系统
- 对外通过命名空间导出 API，模块无需了解 TimeState 内部结构
- 离线处理合并为一个引擎，涵盖体力/HP/MP 恢复、冷却过期、刷新检测、自动修炼
- 运行时定时器持续检测冷却/刷新，通过事件总线通知
- 所有时间计算以服务端时间为准
- GameState 精简——只保留一个 `time: TimeState` 字段

**Non-Goals:**
- 不修改 `core/events/` 事件总线架构（仅发射新事件类型）
- 不在 `core/` 中创建 React 组件或 Hooks
- 不处理离线期间虚拟世界事件推进
- 不兼容旧存档/旧数据

## Decisions

### 1. 命名空间导出 > 独立函数

**选择**：导出命名空间对象（`cooldown.set()`, `gameClock.advance()` 等）

**理由**：
- 业务模块调用时上下文清晰：`cooldown.isActive(time, 'explore')` 明确表达是在做冷却检查
- 避免数十个独立函数污染全局 import 空间
- 每个命名空间对应一个源文件，职责边界清晰

**替代方案**：独立函数 `setCooldown()`, `isCooldownActive()` — 函数名更长，且需要在 index.ts 中维护大量导出。

### 2. TimeState 作为 GameState 单一不透明字段

**选择**：`GameState.time: TimeState`，模块不直接访问 `.game` 或 `.real`

**理由**：
- 满足"不臃肿"要求——GameState 中时间是单一字段，不是 4-6 个分散的字段
- 模块通过 API 函数操作，内部结构变更不影响调用方
- 跨模块状态更新通过 `setGameState(prev => ({ time: someNS.operation(prev.time, ...) }))` 完成

**替代方案**：时间状态完全独立（不在 GameState 中）——不符合项目序列化/持久化模式，存档时会丢失时间状态。

### 3. 服务端时间为准

**选择**：所有纯函数接受 `serverNow: number` 参数，禁止内部调用 `Date.now()`

**理由**：
- 防止客户端修改系统时间绕过冷却
- `serverNow` 由调用方从 `/api/v1/status` 获取（已有接口）
- 登录时获取一次，运行时定时器可定期同步

**替代方案**：信任客户端时间——无法防止作弊。

### 4. 运行时 TimerService

**选择**：单例 `TimerService`，通过 `setInterval` 每 500ms tick

```
tick(serverNow):
  ├─ cooldown.clearExpired() → 有变化则 emit CooldownEnded 事件
  ├─ realClock.needsDailyRefresh() → emit DailyReset 事件
  └─ realClock.needsWeeklyRefresh() → emit WeeklyReset 事件
```

**理由**：
- 模块订阅事件而非轮询——商店监听 `DailyReset` 刷新商品，冷却 UI 监听 `CooldownEnded` 更新按钮状态
- tick 频率 500ms 对 UI 倒计时显示完全够用，不影响性能
- 单例模式保证全局只有一个定时器

**替代方案**：模块各自用 `setTimeout`/`setInterval`——导致大量分散的定时器，难以管理。

### 5. 离线处理器合并

**选择**：一个 `processOffline()` 函数，接受 `TimeState` + `Protagonist` + `serverNow` + `config`，返回 `OfflineResult`

合并内容：
- 从 `offlineProcessor.ts`：体力恢复、基础自动修炼
- 从 `offlineTimeProcessor.ts`：HP/MP 恢复、批量升级计算（二分法）、完整冷却处理
- 从 `idleSystem.ts`：挂机奖励框架（简化为自动修炼收益计算）

**理由**：
- 三个处理器功能高度重叠，合并消除重复
- `applyOfflineResult()` 负责将结果应用到 Protagonist
- 调用方（useGameState）只需要两次调用：`process()` + `applyResult()`

### 6. 冷却存储模式

**选择**：`CooldownMap` 为 `Record<string, CooldownRecord>`，`CooldownRecord = { startTime, duration }`

**理由**：
- `startTime + duration` 优于 `endTime`，因为修改持续时间时不需要重新计算
- string key 允许模块自定义冷却 ID（`'explore'`, `'cultivate'`, `'skill:fireball'` 等）
- 公共冷却（如探索）和私有冷却（如技能）统一管理

### 7. 目录结构（不使用 logic/ 子目录）

**选择**：`core/time/` 下直接放置源文件，不使用 `logic/` 子目录

**理由**：
- `core/` 目录本身就是纯基础设施，不需要再分 `logic/`
- `core/` 中已有模块（events、calculation、message-log、registry）大多不使用子目录
- 保持与 `core/` 其他模块一致

```
core/time/
├── index.ts           # 公共 API 出口
├── types.ts           # 所有时间类型
├── constants.ts       # 时间常量
├── gameClock.ts       # 游戏时钟
├── realClock.ts       # 现实时钟
├── cooldown.ts        # 冷却管理器
├── offlineProcessor.ts # 离线处理器
├── formatter.ts       # 格式化工具
├── timerService.ts    # 运行时定时器
├── serverTime.ts      # 服务端时间
└── __tests__/
```

## Risks / Trade-offs

- **[破坏旧存档]** → 本次为破坏性更新，用户反馈已确认不兼容旧存档。需确保下次 build 后全新开始。
- **[服务端时间延迟]** → `/api/v1/status` 无缓存，每次请求到服务端。高延迟网络下可能导致启动慢 200-500ms。可接受，因为仅在登录时调用一次。
- **[TimerService 生命周期]** → 需要在登录时 start、登出/卸载时 stop。如果 stop 忘记调用，定时器会持续运行消耗资源。缓解：在 `useGameState` 的 cleanup effect 中自动调用 `timerService.stop()`。
- **[定时器精度]** → 500ms tick 意味着冷却过期检测有 500ms 最差延迟。对于游戏来说是感知不到的。
- **[文件大小]** — `offlineProcessor.ts` 合并后可能接近 500 行（含体力/HP/MP 恢复、批量升级、自动修炼）。如果超过，需要拆分为 `offlineRecovery.ts` + `offlineCultivation.ts`。
