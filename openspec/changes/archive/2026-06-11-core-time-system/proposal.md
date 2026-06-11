## Why

当前时间系统分散在三个位置（`modules/time/`、`modules/tower/logic/idleSystem.ts`、`core/types/types.ts`），存在代码重复（格式化函数多份拷贝）、架构违规（core/types 依赖 modules/time）、三套离线处理器并存、GameState 中时间字段臃肿等问题。需要将时间系统统一内聚到 `core/time/`，提供清晰的 API 并遵循五层架构约束。

## What Changes

- **BREAKING** 删除 `src/modules/time/` 整个模块
- **BREAKING** 删除 `src/modules/tower/logic/idleSystem.ts` 中的离线处理器，逻辑并入新离线处理器
- **BREAKING** 从 `GameState` 中删除 `timeSystem`、`offlineResult`、`offlineResultV2`、`lastExploreTime` 字段，替换为单一 `time: TimeState`
- **BREAKING** 从 `Protagonist` 中删除 `cultivationCooldown`、`taskCooldowns`、`lastStaminaRecover` 字段，移入时间系统冷却管理
- 新增 `core/time/` — 统一时间系统，包含 GameClock、RealClock、cooldown、offlineProcessor、formatter、timerService、serverTime
- 对外通过命名空间导出 API：`cooldown.*`、`gameClock.*`、`realClock.*`、`offline.*`、`formatter.*`
- `timerService` 提供运行时定时器，持续检测冷却过期和每日/周刷新，到期时通过 `GameEventBus` 发射事件
- 所有时间计算以服务端时间为准，不依赖客户端 `Date.now()`

## Capabilities

### New Capabilities

- `time-core`: 统一时间系统核心，包含 GameClock（游戏世界时间推进/年龄/显示）、RealClock（登录/登出/离线时长/刷新检测）、cooldown 命名空间（冷却 CRUD）、formatter 命名空间（时间格式化）、serverTime 获取
- `time-offline`: 离线处理引擎，统一处理离线期间的体力/HP/MP 恢复、冷却过期清理、每日/每周刷新检测、自动修炼收益计算
- `time-runtime-timer`: 运行时定时服务，持续 tick 检测冷却过期和刷新时机，通过事件总线通知各模块

### Modified Capabilities

无（本次为全新系统，不修改现有 spec）

## Impact

- 删除：`src/modules/time/`（6 个文件）
- 新增：`src/core/time/`（约 12 个文件）
- 修改：`src/core/types/types.ts`（GameState 字段精简）、`src/views/game/useGameState.tsx`（时间逻辑替换）、`src/app/game/page.tsx`（登录流程改造）
- 修改：`src/modules/progression/hooks/useCultivation.ts`、`useSeclusion.ts`（导入改为 `@/core/time`）
- 修改：`src/modules/exploration/hooks/useAdventure.ts`（导入改为 `@/core/time`）
- 修改：`src/views/game/GameHeader.tsx`（时间显示使用新 API）
- 存档不兼容：`GameState` 结构变更，旧存档将无法加载
