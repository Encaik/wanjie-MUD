## Why

项目当前按技术分层（`components/`、`hooks/`、`lib/`）组织代码，一个业务功能（如"装备系统"）的代码散布在 5-6 个目录中。`GameState` 是一个 40+ 字段的单体对象，`useGameState.tsx` 有 2361 行（规则上限 200 行），`useAdventure.ts` 有 2242 行。任何修改都可能牵动全局。需要按四层架构（入口→页面→模块→公共）重新组织代码：`app/`、`pages/`、`modules/`、`shared/`，建立清晰的模块边界，降低耦合，使每个模块可以独立理解、独立修改、独立测试。

## What Changes

- **四层顶层目录**：`src/` 下只保留 4 个目录
  - `app/` — Next.js 路由入口（layout.tsx, page.tsx, globals.css）
  - `pages/` — 与路由挂钩的页面组件：`home/`（首页）、`character-select/`（选角）、`world-select/`（选世界）、`backstory/`（背景故事）、`game/`（主游戏）
  - `modules/` — 15 个业务功能模块，每个自包含类型、逻辑、状态、组件、数据
  - `shared/` — 纯公共内容：UI 组件、计算引擎、核心类型、事件总线、存储、工具
- **`pages/` 目录**：从 `components/pages/` 提升为顶层，存放 `game/`（GamePage 页面框架）等页面级组件
- **`modules/` 目录**：新增 15 个业务模块，替代原 `features/` 命名
- **`shared/` 目录**：整合原散落在各处的公共内容（`components/ui/`、`components/shared/`、`components/layout/`、`lib/calculation/`、`lib/game/events/`、`lib/game/types.ts`、`lib/config/`、`lib/websocket/`、`lib/multiplayer/`、`utils/`、`types/`、`storage/`）
- **GameState 拆分为模块 Slices**：从 40+ 扁平字段变为 `{ identity, progression, exploration, combat, economy, equipment, techniques, crafting, faction, tower, collection, ascension, time, social }` 各模块独立 Slice
- **Hook 重构**：每个模块 Hook 只访问自己模块的 Slice，不再接收完整 `GameState`；跨模块通信通过事件总线
- **原 `lib/game/utils/` 清空**：28 个文件按业务模块归类
- **原 `lib/data/` 清空**：32 个数据文件按业务模块归类
- **原 `components/game/` 清空**：80+ 个组件按业务模块归类
- **原 `hooks/` 清空**：各模块 Hook 搬入 `modules/<domain>/hooks/`
- **超限文件拆分**：`useGameState.tsx`(2361行)、`useAdventure.ts`(2242行)、`lib/game/types.ts`(1261行) 等按规范拆至合规大小
- **类型定义统一**：删除 `src/types/game.ts` 中与 `lib/game/types.ts` 重复的类型定义
- 迁移全程保持向后兼容，每一步通过 `pnpm ts-check && pnpm build && pnpm test` 验证

## Capabilities

### New Capabilities

- `module-narrative`: ⑮ 叙事文案模块 — 世界术语、事件文案、多世界风味文本，纯函数零状态
- `module-identity`: ① 身份创建模块 — 角色选择、世界选择、背景故事生成
- `module-social`: ⑭ 社交公告模块 — 全服公告、聊天室、排行榜
- `module-faction`: ⑨ 势力门派模块 — 加入/退出势力、势力任务、贡献度
- `module-tower`: ⑩ 试炼爬塔模块 — 塔层挑战、挂机收益
- `module-time`: ⑬ 时间系统模块 — 游戏时间推进、离线处理、离线奖励
- `module-collection`: ⑪ 收集成就模块 — 成就系统、图鉴收集、统计数据
- `module-crafting`: ⑧ 炼制系统模块 — 炼丹、炼器、配方管理
- `module-techniques`: ⑦ 功法系统模块 — 功法收集、装备、升级
- `module-ascension`: ⑫ 飞升系统模块 — 飞升流程、元树、周Boss
- `module-equipment`: ⑥ 装备物品模块 — 背包管理、装备槽位、品质稀有度、碎片合成
- `module-economy`: ⑤ 经济商店模块 — 商店买卖、货币管理、每日特卖
- `module-progression`: ② 成长修炼模块 — 修炼、突破、经验等级、闭关
- `module-combat`: ④ 战斗系统模块 — 回合战斗、敌人AI、技能克制、元素系统
- `module-exploration`: ③ 秘境探索模块 — 地图生成、移动探索、机缘事件、行动力

### Modified Capabilities

- `type-system-consolidation`: 模块重构后统一全局类型定义，删除 `src/types/game.ts` 中与 `shared/lib/game/types.ts` 重复的类型
- `code-splitting-plan`: 模块重构完成后，原有的文件拆分计划由各模块独立维护

## Impact

- **顶层结构**：`src/` 从 8 个目录精简为 4 个：`app/`、`pages/`、`modules/`、`shared/`
- **代码组织**：原 `lib/game/` 的 20 个子目录精简为 `shared/lib/` 下仅保留核心类型和事件总线；`modules/` 新增约 250+ 文件
- **状态管理**：`GameState` 结构从扁平单体变为模块 Slice 聚合；`useGameState.tsx` 从 2361 行精简为 ≤300 行，放于 `pages/game/`
- **导入路径**：全局 import 从 `@/lib/game/utils/xxx` 迁移为 `@/modules/<domain>/logic/xxx`，公共内容从 `@/shared/...`
- **共享基础设施**：`shared/ui/`、`shared/components/`、`shared/lib/`、`shared/utils/`、`shared/config/`、`shared/storage/`
