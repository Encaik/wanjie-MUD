# src/core/ — 游戏核心基础设施

`core/` 是游戏底层基础设施目录，提供事件系统、数值计算、世界管理、Mod 加载等机制性能力。**不包含业务逻辑**，不依赖 `modules/` 中的任何代码。

## 子模块一览

| 目录 | 职责 |
|------|------|
| [`calculation/`](calculation/) | 统一数值计算引擎 — 属性计算、效果优先级、边界保护 |
| [`engine/`](engine/) | 引擎集成层 — 跨系统集成逻辑（gameSystems、expansionLogic、messageDB） |
| [`events/`](events/) | 事件驱动通信系统 — GameEventManager 单例、事件类型定义、事件匹配器 |
| [`logger/`](logger/) | 系统日志 — 结构化日志记录 |
| [`message-log/`](message-log/) | 玩家消息日志 — 游戏内消息的记录、格式化和检索 |
| [`mod/`](mod/) | Mod 系统 — Mod 加载、验证、清单管理 |
| [`registry/`](registry/) | 数据注册中心 — WorldDataRegistry、WorldMechanicsRegistry |
| [`server/`](server/) | 服务端核心代码 — instrumentation、中间件等服务端基础设施 |
| [`statistics/`](statistics/) | 统计追踪器 — 事件驱动的统计更新纯函数，全部游戏统计的单一更新入口 |
| [`time/`](time/) | 时间系统 — 游戏时间模拟、离线收益计算 |
| [`types/`](types/) | 核心游戏类型 — CharacterStats、Quality、World、Protagonist 等基础类型 |
| [`world/`](world/) | 世界系统 — WorldProviderRegistry、WorldPoolEngine、模板验证 |

## 核心原则

- `core/` 中的代码必须是纯基础设施，不包含 React 组件或 Hooks
- `core/` 可以依赖 `shared/` 和标准库，但不可依赖 `modules/` 中的任何代码
- 新增子模块时请同步更新本文件
