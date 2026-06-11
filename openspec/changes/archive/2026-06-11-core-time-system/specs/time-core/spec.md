## ADDED Requirements

### Requirement: 游戏世界时钟推进
系统 SHALL 提供纯函数版本的 `gameClock.advance()`，接受 `TimeState` 和行为类型，返回推进后的新 `TimeState`。推进游戏时间不影响现实时钟。

#### Scenario: 修炼行为消耗游戏时间
- **WHEN** 调用 `gameClock.advance(time, 'cultivate')`
- **THEN** 返回的 `TimeState.game.totalSeconds` 增加 `ACTION_TIME_COST.cultivate` 秒
- **AND** 时辰、日期、月份、年份根据累计秒数正确进位

#### Scenario: 时辰正常进位
- **WHEN** 游戏时间累计超过 7200 秒（一个时辰 = 2 游戏小时）
- **THEN** `shichen` 递增 1
- **AND** 满 12 后重置为 1，`day` 递增

#### Scenario: 月份进位
- **WHEN** `day` 超过 30
- **THEN** `day` 重置为 1，`month` 递增
- **AND** `month` 超过 12 后重置为 1，`year` 递增

### Requirement: 角色年龄计算
系统 SHALL 提供 `gameClock.getAge()`，基于 `baseAge + totalSeconds / 一年秒数` 计算当前年龄。

#### Scenario: 默认初始年龄为 16 岁
- **WHEN** 创建默认 `GameClock` 且 `totalSeconds = 0`
- **THEN** `getAge()` 返回 16

#### Scenario: 积累足够时间后年龄增长
- **WHEN** `totalSeconds` 达到 31536000（一年）
- **THEN** `getAge()` 返回 17（baseAge + 1）

### Requirement: 游戏时间格式化显示
系统 SHALL 提供 `gameClock.format()` 和 `gameClock.formatShort()`，返回中文格式的游戏时间字符串。

#### Scenario: 完整格式显示
- **WHEN** 游戏时间为 `{ year: 3, month: 7, day: 15, shichen: 6, eraName: '初元' }`
- **THEN** `gameClock.format(time)` 返回 `"初元3年七月十五 午时 (18岁)"`

#### Scenario: 简短格式显示
- **WHEN** 调用 `gameClock.formatShort(time)`
- **THEN** 返回 `"第3年7月15日 午时 · 18岁"`

### Requirement: 时辰名称映射
系统 SHALL 提供 `gameClock.getShichen()`，返回时辰索引和中文名称。

#### Scenario: 获取午时
- **WHEN** `shichen = 6`
- **THEN** 返回 `{ index: 6, name: '午' }`

### Requirement: 现实时钟登录/登出
系统 SHALL 提供 `realClock.login()` 和 `realClock.logout()`，更新 `RealClock` 中的登录/登出时间戳。

#### Scenario: 登录更新 lastLoginAt
- **WHEN** 调用 `realClock.login(time, 1700000000000)`
- **THEN** 返回的 `TimeState.real.lastLoginAt` 等于 `1700000000000`

#### Scenario: 登出更新 lastLogoutAt
- **WHEN** 调用 `realClock.logout(time, 1700000003600)`
- **THEN** 返回的 `TimeState.real.lastLogoutAt` 等于 `1700000003600`

### Requirement: 离线时长计算
系统 SHALL 提供 `realClock.getOfflineDuration()`，基于 `lastLogoutAt` 和当前服务端时间计算离线毫秒数。

#### Scenario: 计算正离线时长
- **WHEN** `lastLogoutAt = 1700000000000` 且 `serverNow = 1700000003600`
- **THEN** 返回 3600000（1 小时）

#### Scenario: 无有效登出记录时返回 0
- **WHEN** `lastLogoutAt = 0`
- **THEN** 返回 0

### Requirement: 每日刷新检测
系统 SHALL 提供 `realClock.needsDailyRefresh()`，比较上次刷新时间与当前服务端时间是否跨过午夜。

#### Scenario: 跨天后需要刷新
- **WHEN** `dailyRefreshAt` 是 2025-01-01 23:00 且 `serverNow` 是 2025-01-02 01:00
- **THEN** 返回 `true`

#### Scenario: 同一天不需要刷新
- **WHEN** `dailyRefreshAt` 和 `serverNow` 同一天
- **THEN** 返回 `false`

### Requirement: 每周刷新检测
系统 SHALL 提供 `realClock.needsWeeklyRefresh()`，比较上次刷新时间与当前服务端时间是否跨越周边界（周一 00:00）。

#### Scenario: 跨周需要刷新
- **WHEN** `weeklyRefreshAt` 是周日且 `serverNow` 是周一
- **THEN** 返回 `true`

### Requirement: 冷却时间设置与移除
系统 SHALL 提供 `cooldown.set()` 和 `cooldown.remove()` 管理冷却状态。

#### Scenario: 设置新冷却
- **WHEN** 调用 `cooldown.set(time, 'explore', 30000, serverNow)`
- **THEN** 返回的 `TimeState` 中 `real.cooldowns['explore']` 等于 `{ startTime: serverNow, duration: 30000 }`

#### Scenario: 移除已有冷却
- **WHEN** 冷却 `'explore'` 存在且调用 `cooldown.remove(time, 'explore')`
- **THEN** 返回的 `TimeState` 中 `real.cooldowns['explore']` 不存在

### Requirement: 冷却状态查询
系统 SHALL 提供 `cooldown.isActive()` 和 `cooldown.remaining()` 查询冷却状态。

#### Scenario: 冷却进行中
- **WHEN** `startTime = 1000, duration = 30000, serverNow = 20000`
- **THEN** `isActive()` 返回 `true`，`remaining()` 返回 11000

#### Scenario: 冷却已结束
- **WHEN** `startTime = 1000, duration = 10000, serverNow = 20000`
- **THEN** `isActive()` 返回 `false`，`remaining()` 返回 0

#### Scenario: 冷却不存在
- **WHEN** 查询不存在的冷却 ID
- **THEN** `isActive()` 返回 `false`，`remaining()` 返回 0

### Requirement: 冷却进度查询
系统 SHALL 提供 `cooldown.progress()`，返回 0-1 的冷却进度。

#### Scenario: 半进度
- **WHEN** `startTime = 1000, duration = 10000, serverNow = 6000`
- **THEN** `progress()` 返回 0.5

#### Scenario: 已完成
- **WHEN** 冷却已过期
- **THEN** `progress()` 返回 1

### Requirement: 批量清理过期冷却
系统 SHALL 提供 `cooldown.clearExpired()`，批量检查并清理所有已过期的冷却。

#### Scenario: 部分冷却过期
- **WHEN** cooldowns 中有 3 个，其中 2 个已过期
- **THEN** 返回的 `time` 中只保留未过期的 1 个
- **AND** `expired` 数组包含过期冷却的 ID

### Requirement: 时间格式化工具
系统 SHALL 提供 `formatter.duration()`、`formatter.remaining()` 将毫秒转换为可读中文字符串。

#### Scenario: 格式化时长 — 天和小时
- **WHEN** 调用 `formatter.duration(90000000)`（25 小时）
- **THEN** 返回 `"1天1小时"`

#### Scenario: 格式化冷却剩余 — 分钟和秒
- **WHEN** 调用 `formatter.remaining(185000)`（3 分 5 秒）
- **THEN** 返回 `"3分5秒"`

#### Scenario: 冷却已就绪
- **WHEN** 调用 `formatter.remaining(0)`
- **THEN** 返回 `"已就绪"`

### Requirement: 服务端时间获取
系统 SHALL 提供 `fetchServerTime()` 函数，从 `/api/v1/status` 获取服务端时间戳。

#### Scenario: 成功获取服务端时间
- **WHEN** 调用 `fetchServerTime()` 且服务在线
- **THEN** 返回一个 Unix 毫秒时间戳

#### Scenario: 服务端不可用时返回客户端时间
- **WHEN** 调用 `fetchServerTime()` 但请求失败
- **THEN** 返回 `Date.now()` 作为降级策略

### Requirement: TimeState 为 GameState 单一字段
系统 SHALL 在 `GameState` 中以单一 `time: TimeState` 字段存储所有时间状态，替代原有的 `timeSystem`、`offlineResult`、`offlineResultV2`、`lastExploreTime` 等字段。

#### Scenario: 新 GameState 不包含旧时间字段
- **WHEN** 检查新 `GameState` 接口定义
- **THEN** 不存在 `timeSystem`、`offlineResult`、`offlineResultV2`、`lastExploreTime` 字段

### Requirement: 不在 core/ 中包含 React 依赖
系统 SHALL NOT 在 `core/time/` 的任何文件中导入 React 或包含 React 组件/Hooks。

#### Scenario: core/time/ 文件不导入 React
- **WHEN** 检查 `core/time/` 下所有源文件
- **THEN** 不存在 `import ... from 'react'` 语句
- **AND** 不存在 JSX 代码
