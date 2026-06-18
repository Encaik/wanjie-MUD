# src/modules/ — 业务功能模块

`modules/` 是游戏业务功能模块目录，每个子目录是一个自包含的业务域，有独立的类型定义、纯逻辑、状态管理、UI 组件和静态数据。

## 模块一览

### 角色系统

| 模块 | 职责 |
|------|------|
| [`identity/`](identity/) | 身份/角色定义 — 角色模板生成（Seed 驱动）、主角适配器、世界数据 |

### 成长系统

| 模块 | 职责 |
|------|------|
| [`ascension/`](ascension/) | 突破/进阶 — 境界突破、修为积累、瓶颈突破逻辑 |
| [`progression/`](progression/) | 进度/成长 — 玩家成长曲线、等级经验、修炼操作、突破/渡劫、闭关 |

### 战斗系统

| 模块 | 职责 |
|------|------|
| [`combat/`](combat/) | 战斗 — 回合制战斗、伤害计算、技能释放 |
| [`techniques/`](techniques/) | 功法/技能 — 功法修炼、技能学习、熟练度系统 |
| [`equipment/`](equipment/) | 装备 — 装备穿戴、属性加成、强化锻造 |
| [`exploration/`](exploration/) | 探索 — 通用探索工具（迷雾、路径提示、难度配置） |
| [`fortune/`](fortune/) | 🆕 机缘 — 地形网格探索、望气术视野、多层深度推进、机缘主题选择 |
| [`tower/`](tower/) | 爬塔 — 挑战爬塔、层数推进、挂机奖励 |

### 社交系统

| 模块 | 职责 |
|------|------|
| [`social/`](social/) | 社交/聊天 — 公告系统、聊天、排行榜、消息通知 |
| [`faction/`](faction/) | 宗门/阵营 — 势力系统、宗门任务、势力特性与加成 |
| [`npc/`](npc/) | NPC 交互 — NPC 态度计算、对话引擎、交易计算 |

### 经济与物品系统

| 模块 | 职责 |
|------|------|
| [`item/`](item/) | 🆕 统一物品系统 — 整合货币、消耗品、材料、装备、功法、技能、碎片七大品类。提供模板定义、实例管理、槽位装备、升级、碎片合成、物品生成等完整逻辑与 UI 组件（`ItemCard`、`ItemGrid`、`InventoryPanel`、`ItemTooltip`）。替代旧 economy/equipment/techniques/crafting 分散管理 |
| [`reward-pool/`](reward-pool/) | 🆕 奖励池系统 — 统一的奖励出口。通过 ItemFilter 动态过滤 ItemRegistry，支持 Static/Filter/PoolRef 三种条目类型（货币已统一为 Static 条目，自动按世界观解析），每个条目独立稀有度投骰，Mod 池子合并。替代各模块分散的掉落逻辑 |
| [`economy/`](economy/) | 经济/交易 — 货币管理、商店系统、每日特卖、商品配置（逐步迁移至 item/） |
| [`crafting/`](crafting/) | 炼制/制造 — 物品合成、炼器炼丹、配方系统（逐步迁移至 item/） |
| [`collection/`](collection/) | 收藏/图鉴 — 收集物跟踪、图鉴解锁、收集奖励 |

### 任务系统

| 模块 | 职责 |
|------|------|
| [`quest/`](quest/) | 任务 — 通用任务引擎：故事线/板块引擎、事件驱动追踪、QuestTemplate 模板编译、奖励池桥接、数据驱动 UI。任务内容（教程/主线/日常）与引擎解耦，内置和 Mod 共享 QuestTemplate 格式 |

### 叙事系统

| 模块 | 职责 |
|------|------|
| [`narrative/`](narrative/) | 叙事/剧情 — 文案管理、剧情节点、分支故事、叙事 Hook |

### 世界系统

| 模块 | 职责 |
|------|------|
| [`world-pool/`](world-pool/) | 世界池 — 世界生成池管理、世界分配策略 |
| [`world-rating/`](world-rating/) | 世界评级 — 世界评分系统、评价存储与展示 |

### 主题系统

| 模块 | 职责 |
|------|------|
| [`theme/`](theme/) | 主题 — 世界主题配置、CSS 变量注入、主题动态切换 |

### Mod 系统

| 模块 | 职责 |
|------|------|
| [`mod/`](mod/) | 模块化管理 — Mod 加载协调、Mod 组件注入、Mod 配置管理 |

## 核心原则

- 每个模块自包含：`types.ts` + `logic/` + `hooks/` + `components/` + `data/`
- 模块可以依赖 `core/` 和 `shared/`，但不可跨模块依赖 `hooks/` 或 `components/`
- 跨模块通信通过 `core/events/` 事件总线进行
- 新增、删除或重命名模块时请同步更新本文件
