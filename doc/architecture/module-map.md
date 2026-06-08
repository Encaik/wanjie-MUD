# 万界修行录 — 模块地图

> 产出日期：2026-06-08 | 用途：AI 开发时快速定位代码归属

## 一、模块职责矩阵

### 一级模块

| 目录 | 职责 | 允许操作 | 禁止操作 |
|------|------|----------|----------|
| `src/app/` | Next.js 页面路由 + 全局布局 | 定义路由、导入页面级组件 | 放置业务逻辑 |
| `src/components/` | 纯 UI 组件 | 渲染 UI、接收 props、emit 事件 | 直接修改全局状态、包含业务规则 |
| `src/features/` | 领域业务编排 | 组合 lib 纯函数 + hooks、协调复杂交互 | 放置纯 UI 组件（应放 components/） |
| `src/hooks/` | React 状态管理 | 管理状态生命周期、组合多个 lib 函数 | 包含纯计算逻辑（应放 lib/） |
| `src/lib/` | 纯业务逻辑 | 纯函数、类型定义、数据配置、计算引擎 | 包含 React 组件/Hook、直接访问 DOM |
| `src/contexts/` | React Context Provider | 定义和提供上下文 | 包含复杂业务逻辑（应由 hooks 封装） |
| `src/storage/` | 数据持久化 | Supabase 客户端、数据库操作 | 包含业务规则 |
| `src/types/` | 全局通用类型 | 跨模块共享的基础类型 | 重复定义 lib 中已有的类型 |
| `src/utils/` | 通用工具函数 | 无领域逻辑的纯工具 | 包含游戏逻辑 |
| `src/tests/` | 测试 | 单元测试、集成测试、E2E | |

## 二、依赖关系图

```
                    ┌──────────────┐
                    │   src/app/   │  3 files, 323 lines
                    └──────┬───────┘
                           │ imports
                    ┌──────▼───────┐
                    │ components/  │  150 files, 30,463 lines
                    └──┬───┬───┬──┘
                       │   │   │
              ┌────────┘   │   └────────┐
              │ imports    │ imports    │
       ┌──────▼──────┐    │    ┌───────▼──────┐
       │  features/  │    │    │  contexts/   │  5 files
       └──────┬──────┘    │    └──────────────┘
              │            │
              └────────┐   │
                       │   │
                ┌──────▼───▼──┐
                │   hooks/    │  22 files, 8,688 lines
                └──────┬──────┘
                       │ imports
                ┌──────▼──────┐
                │   lib/      │  201 files, 66,925 lines
                │ ⚠️ 循环依赖 │  ← lib 中有 1 个文件回引 hooks!
                └──────┬──────┘
                       │ imports
                ┌──────▼──────┐
                │  storage/   │  3 files, 88 lines
                └─────────────┘
```

## 三、`src/lib/` 内部结构

```
lib/
├── calculation/           # 统一计算引擎（9 子目录）
│   ├── adapters/          # 适配器
│   ├── boundary/          # 边界检查
│   ├── calculator/        # 计算器核心
│   ├── context/           # 计算上下文
│   ├── effect/            # 效果注册
│   ├── helpers/           # 辅助函数
│   ├── service/           # 服务层
│   ├── services/          # 多服务（与 service/ 重复命名？）
│   ├── trace/             # 调用链追踪
│   └── types.ts           # 计算系统类型
│
├── config/                # 配置文件
├── data/                  # 静态游戏数据（14+ 大文件）
│   ├── achievementData.ts     # 成就数据 642行
│   ├── ascensionData.ts       # 飞升数据 647行
│   ├── cultivationPathData.ts # 修炼路径数据
│   ├── factionData.ts         # 势力数据 1704行 ⚠️
│   ├── realmData.ts           # 境界数据
│   ├── worldData.ts           # 世界数据 925行
│   ├── worldEffectsData.ts    # 世界效果数据 732行
│   └── ... (更多数据文件)
│
├── game/                  # 游戏核心逻辑
│   ├── adventure.ts       # 机缘 1286行 ⚠️
│   ├── balanceConfig.ts   # 数值平衡 711行
│   ├── cultivation.ts     # 修炼逻辑
│   ├── equipment.ts       # 装备系统
│   ├── expansionLogic.ts  # 扩展逻辑 1281行 ⚠️
│   ├── fragmentSystem.ts  # 碎片系统 883行
│   ├── items.ts           # 物品系统 587行
│   ├── types.ts           # 核心类型 1254行 ⚠️
│   ├── typesExtension.ts  # 类型扩展 917行 ⚠️
│   ├── ascension/         # 飞升子系统
│   ├── announcement/      # 公告系统
│   ├── battle/            # 战斗子系统
│   │   ├── decisionSystem.ts  # 1364行 ⚠️
│   │   └── ...
│   ├── dungeon/           # 地下城/秘境
│   │   ├── eventConfigs.ts    # 1127行 ⚠️
│   │   └── ...
│   ├── economy/           # 经济系统
│   ├── enemy/             # 敌人系统
│   ├── shop/              # 商店系统
│   ├── taskSystem/        # 任务系统
│   ├── tower/             # 塔系统
│   └── utils/             # 游戏工具
│
├── gameData/              # 游戏配置数据
│   ├── skillConfigs.ts
│   └── weaponConfigs.ts
│
├── multiplayer/           # 多人游戏
├── text/                  # 文案生成系统
│   ├── core/              # 核心文案引擎
│   ├── hooks/             # 文案 Hook
│   └── worlds/            # 各世界文案
│
├── util/                  # 通用工具
└── websocket/             # WebSocket 连接
```

## 四、`src/hooks/` 内部结构

```
hooks/
├── useGameState.tsx           # 主状态 2552行 🔴 P0
├── useGameHooks.ts            # Hooks 集成器
├── useGameInitialization.ts   # 初始化
├── useGameMessages.ts         # 消息系统
├── useGameAdventure.ts        # 机缘系统
├── useGameAscension.ts        # 飞升系统
├── useGameCrafting.ts         # 炼制系统
├── useGameCultivation.ts      # 修炼系统
├── useGameEquipment.ts        # 装备系统
├── useGameFaction.ts          # 势力系统
├── useGameInventory.ts        # 背包系统
├── gameInitialState.ts        # 初始状态
├── use-mobile.ts              # 移动端检测
├── index.ts                   # 统一导出
│
├── adventure/
│   └── useAdventure.ts        # 2240行 🔴 P0
├── ascension/
│   └── useAscension.ts        # 516行
├── crafting/
├── cultivation/
│   └── useCultivation.ts      # 577行
├── equipment/
├── faction/
│   └── useFaction.ts          # 1067行
├── messages/
└── utils/
```

## 五、`src/components/` 内部结构

```
components/
├── ui/                    # shadcn/ui 基础组件（55 个，禁止修改）
├── game/                  # 游戏核心组件
│   ├── layout/            # 布局（MainGame 1000行, LeftSidebar, RightSidebar, CenterPanel, MobileLayout）
│   ├── MainGame/          # 主游戏容器（TabNav, DialogManager）
│   ├── tabs/              # 功能面板（Cultivation, Adventure, Equipment, Faction 1124行, Alchemy, Forge, Collection, Achievement, Fragment, Technique 等）
│   ├── battle/            # 战斗 UI（BattleDialog 556行, BattleLogList, CombatantPanel, DecisionPanel 等）
│   ├── shop/              # 商店 UI（ShopPanel 684行, ProductCard, CurrencyBar 等）
│   ├── sidebar/           # 侧边栏（StatusPanel, WorldInfoPanel, MentalStateCard, SaveLoadPanel）
│   ├── dialogs/           # 对话框（CraftingDialog 535行, TribulationDialog, DifficultySelect 等）
│   ├── announcement/      # 公告系统
│   └── shared/            # 共享组件（DeveloperPanel 862行, Header, ChatRoom, MessagePanel 等）
├── pages/                 # 页面级组件
│   ├── home/              # 开始画面
│   ├── character-select/  # 角色选择
│   ├── world-select/      # 世界选择
│   ├── backstory/         # 背景故事
│   └── game/              # 游戏页面
├── shared/                # 跨页面共享组件
└── layout/                # 全局布局组件
```

## 六、`src/features/` 定位建议

| Feature | 当前状态 | 建议 |
|---------|----------|------|
| adventure/ | 15 files, 329 lines total (types.ts + components/) | 保留为业务编排层，UI 组件迁至 components/game/tabs/ |
| cultivation/ | types.ts + components/ | 同上 |
| faction/ | types.ts + components/ | 同上 |
| equipment/ | types.ts + components/ | 同上 |
| achievement/ | components/ only | 同上 |
| shop/ | components/ only | 同上 |
| technique/ | types.ts + components/ | 同上 |
| collection/ | components/ only | 保留，唯一不重叠的 feature |

## 七、快速查找表

| 要找什么 | 去哪里 |
|----------|--------|
| 游戏核心类型 | `src/lib/game/types.ts` |
| 战斗类型 | `src/lib/game/battle/types.ts` |
| 商店类型 | `src/lib/game/shop/types.ts` |
| 全局游戏状态 | `src/hooks/useGameState.tsx` |
| 机缘状态 | `src/hooks/adventure/useAdventure.ts` |
| 势力状态 | `src/hooks/faction/useFaction.ts` |
| 修炼状态 | `src/hooks/cultivation/useCultivation.ts` |
| 主游戏 UI | `src/components/game/layout/MainGame.tsx` |
| 战斗 UI | `src/components/game/battle/` |
| 商店 UI | `src/components/game/shop/` |
| 战斗数值配置 | `src/lib/game/balanceConfig.ts` |
| 势力数据 | `src/lib/data/factionData.ts` |
| 世界数据 | `src/lib/data/worldData.ts` |
| 成就数据 | `src/lib/data/achievementData.ts` |
| 文案系统 | `src/lib/text/` |
| 计算引擎 | `src/lib/calculation/` |
| 数据库操作 | `src/storage/database/` |
| 通用工具 | `src/utils/` |
