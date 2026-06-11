## 1. 基础设施 — 类型和常量

- [x] 1.1 创建 `core/time/types.ts` — `TimeState`、`GameClock`、`RealClock`、`CooldownRecord`、`CooldownMap`、`OfflineConfig`、`OfflineResult`、`AutoCultivateResult` 类型定义
- [x] 1.2 创建 `core/time/constants.ts` — `GAME_TIME_SCALE`、`ACTION_TIME_COST`、`HOUR_NAMES`、`MONTH_NAMES`、默认离线配置、恢复间隔常量

## 2. 核心模块 — 纯函数实现

- [x] 2.1 创建 `core/time/gameClock.ts` — `gameClock` 命名空间：`advance()`、`getAge()`、`getShichen()`、`format()`、`formatShort()`
- [x] 2.2 创建 `core/time/realClock.ts` — `realClock` 命名空间：`login()`、`logout()`、`getOfflineDuration()`、`needsDailyRefresh()`、`needsWeeklyRefresh()`
- [x] 2.3 创建 `core/time/cooldown.ts` — `cooldown` 命名空间：`set()`、`remove()`、`isActive()`、`remaining()`、`progress()`、`clearExpired()`
- [x] 2.4 创建 `core/time/formatter.ts` — `formatter` 命名空间：`duration()`、`remaining()`、`timestamp()`
- [x] 2.5 创建 `core/time/serverTime.ts` — `fetchServerTime()` 函数，调用 `/api/v1/status` 获取服务端时间，失败时降级到 `Date.now()`

## 3. 组合模块 — 离线处理与定时器

- [x] 3.1 创建 `core/time/offlineProcessor.ts` — `offline` 命名空间：`process()`（合并体力/HP/MP恢复、冷却过期、批量升级、刷新检测）、`applyResult()`、`shouldShowDialog()`
- [x] 3.2 创建 `core/time/timerService.ts` — `timerService` 单例：`start()`、`stop()`、`sync()`、`onTick()`、`offTick()`，内部 500ms `setInterval`，检测冷却过期和刷新时机并发射事件

## 4. 对外出口

- [x] 4.1 创建 `core/time/index.ts` — 统一 barrel 导出所有命名空间、类型、`fetchServerTime`、`timerService`
- [x] 4.2 更新 `core/types/types.ts` 中的 `GameState` — 删除 `timeSystem`、`offlineResult`、`offlineResultV2`、`lastExploreTime` 字段，新增 `time: TimeState`
- [x] 4.3 更新 `core/types/types.ts` 中的 `Protagonist` — 删除 `cultivationCooldown`、`taskCooldowns`、`lastStaminaRecover` 字段
- [x] 4.4 更新 `core/types/index.ts` — 重新导出 `core/time/` 中的核心类型（如果需要）

## 5. 集成 — 模块接入新时间 API

- [x] 5.1 改造 `src/views/game/useGameState.tsx` — 登录/登出/保存时使用 `realClock.login/logout`、离线处理使用 `offline.process/applyResult`、启动时调用 `timerService.start`
- [x] 5.2 改造 `src/app/game/page.tsx` — 登录时调用 `fetchServerTime()`，将 `serverNow` 传入时间处理流程
- [x] 5.3 改造 `src/views/game/GameHeader.tsx` — 使用 `gameClock.formatShort()` 替代旧的 `formatGameTimeShort()`
- [x] 5.4 改造 `src/modules/progression/hooks/useCultivation.ts` — 导入改为 `@/core/time`，使用 `gameClock.advance()`
- [x] 5.5 改造 `src/modules/progression/hooks/useSeclusion.ts` — 同上
- [x] 5.6 改造 `src/modules/exploration/hooks/useAdventure.ts` — 导入改为 `@/core/time`，使用 `gameClock.advance()` 和 `cooldown.set()`
- [x] 5.7 改造 `src/views/game/types.ts` 中的 `GameContextType` — 删除 `clearOfflineResult`、`applyOfflineRewards`，新增时间相关方法

## 6. 清理 — 删除旧代码

- [x] 6.1 删除 `src/modules/time/` 整个目录
- [x] 6.2 删除 `src/modules/tower/logic/idleSystem.ts`（仅删除离线处理相关内容，如果文件有其他逻辑则保留）
- [x] 6.3 在其他引用旧时间模块的文件中移除相关 import（搜索 `@/modules/time`、`@/modules/tower/logic/idleSystem`）
- [x] 6.4 删除 `src/shared/ui/cooldown-button.tsx` 中引用旧时间 API 的代码，或将其改为使用新 API

## 7. 验证

- [x] 7.1 运行 `pnpm ts-check` 确保类型检查通过
- [x] 7.2 运行 `pnpm lint` 确保 ESLint 通过
- [x] 7.3 运行 `pnpm build` 确保构建成功
- [x] 7.4 编写 `core/time/__tests__/gameClock.test.ts`
- [x] 7.5 编写 `core/time/__tests__/cooldown.test.ts`
- [x] 7.6 编写 `core/time/__tests__/offlineProcessor.test.ts`
- [x] 7.7 运行 `pnpm test` 确保所有测试通过
- [x] 7.8 运行 `pnpm check-sizes` 确保新文件不超行数限制
