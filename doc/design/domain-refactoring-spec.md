# 模块化重构规范

> 将代码从"技术分层"组织重构为四层架构（app / pages / modules / shared），降低模块耦合，提升可维护性。

---

## 一、目标

```
重构前（技术分层）                      重构后（四层架构）
─────────────────                      ─────────────────

src/                                   src/
├── components/game/  ← UI散落         ├── app/        ← ① 入口（Next.js 路由）
├── hooks/            ← 状态散落        ├── pages/      ← ② 页面（与功能无关的页面框架）
├── lib/game/         ← 逻辑散落        ├── modules/    ← ③ 功能模块（15个自包含业务域）
│   ├── adventure/                      │   ├── narrative/
│   ├── battle/                         │   ├── identity/
│   ├── utils/  ← 垃圾场                │   ├── social/
│   └── ...                             │   ├── faction/
├── lib/data/         ← 配置散落        │   ├── tower/
└── types/            ← 类型重复        │   ├── time/
                                        │   ├── collection/
一个功能跨越 5 个目录                   │   ├── crafting/
                                        │   ├── techniques/
                                        │   ├── ascension/
                                        │   ├── equipment/
                                        │   ├── economy/
                                        │   ├── progression/
                                        │   ├── combat/
                                        │   └── exploration/
                                        │
                                        └── shared/     ← ④ 公共内容（ui, components, lib, utils, storage）
                                            ├── ui/           shadcn 组件
                                            ├── components/   跨模块通用组件
                                            ├── lib/          计算引擎、事件总线、核心类型
                                            ├── utils/        cn, logger, saveMigrator
                                            ├── config/       环境配置
                                            └── storage/      数据库
```

**决策树：新文件放哪里？**
```
新文件是什么？
├── Next.js 路由页面？                              → app/
├── 与路由挂钩的页面组件（组合模块Panel，无业务逻辑）？ → pages/
├── 某个业务功能（逻辑+状态+组件）？                  → modules/<domain>/
└── 纯通用公共代码？                                  → shared/
```

---

## 二、四层职责

| 层 | 目录 | 职责 | 允许 | 禁止 |
|----|------|------|------|------|
| ① 入口 | `app/` | Next.js 路由入口 | layout.tsx, page.tsx, globals.css | 业务逻辑、状态管理 |
| ② 页面 | `pages/` | 与路由挂钩的页面组件 | 各路由页面（home/character-select/world-select/backstory/game），组合模块 Panel，管理页面切换 | 业务逻辑（应放 modules/） |
| ③ 模块 | `modules/` | 业务功能域 | 类型、纯逻辑、状态、功能组件、数据、测试 | 路由级页面组件（应放 pages/）、跨模块通用代码（应放 shared/） |
| ④ 公共 | `shared/` | 纯公共内容 | UI 组件、计算引擎、核心类型、工具、存储 | 任何业务逻辑 |

---

## 三、15 个业务模块总览

| # | 模块标识 | 中文名 | 职责 | 难度 | 预估文件数 |
|---|---------|--------|------|------|-----------|
| ⑮ | narrative | 叙事文案 | 世界术语、事件文案、多世界风味文本 | Tier 0 | ~20 |
| ① | identity | 身份创建 | 角色选择、世界选择、背景故事生成 | Tier 0 | ~15 |
| ⑭ | social | 社交公告 | 全服公告、聊天室、排行榜 | Tier 1 | ~15 |
| ⑨ | faction | 势力门派 | 加入/退出势力、势力任务、贡献度 | Tier 1 | ~20 |
| ⑩ | tower | 试炼爬塔 | 塔层挑战、挂机收益 | Tier 2 | ~10 |
| ⑬ | time | 时间系统 | 游戏时间推进、离线处理、离线奖励 | Tier 2 | ~10 |
| ⑪ | collection | 收集成就 | 成就系统、图鉴收集、统计数据 | Tier 2 | ~15 |
| ⑧ | crafting | 炼制系统 | 炼丹、炼器、配方管理 | Tier 3 | ~15 |
| ⑦ | techniques | 功法系统 | 功法收集、装备、升级 | Tier 3 | ~15 |
| ⑫ | ascension | 飞升系统 | 飞升流程、元树、周Boss、排行榜 | Tier 3 | ~20 |
| ⑥ | equipment | 装备物品 | 背包管理、装备槽位、品质稀有度、碎片合成 | Tier 4 | ~25 |
| ⑤ | economy | 经济商店 | 商店买卖、货币管理、每日特卖、商店等级 | Tier 4 | ~25 |
| ② | progression | 成长修炼 | 修炼、突破、经验等级、闭关、自动修炼 | Tier 5 | ~20 |
| ④ | combat | 战斗系统 | 回合战斗、敌人AI、技能克制、元素系统 | Tier 5 | ~30 |
| ③ | exploration | 秘境探索 | 地图生成、移动探索、机缘事件、行动力 | Tier 5 | ~25 |

---

## 四、标准模块模板

每个模块遵循统一结构。`<domain>` 为模块标识（英文小写）。

```
modules/<domain>/
│
├── index.ts                  # 统一导出 + 模块对外契约
├── types.ts                  # 模块内类型定义（≤300行）
├── state.ts                  # 状态 Slice + Reducer（≤200行）
│
├── logic/                    # 纯函数（从 lib/game/ 搬来）
│   ├── index.ts
│   ├── <feature>.ts          # 核心逻辑（每个 ≤500行）
│   └── __tests__/            # 单元测试
│
├── hooks/                    # React Hooks（每个 ≤200行）
│   ├── index.ts
│   └── use<Domain>.ts        # 模块主Hook
│
├── components/               # UI 组件（每个 ≤300行）
│   ├── index.ts
│   └── <Component>.tsx
│
├── data/                     # 静态配置数据（每个 ≤800行）
│   ├── index.ts
│   └── <domain>Data.ts
│
└── events.ts                 # 事件订阅（本模块监听的外部事件）
```

### `types.ts` 模板

```typescript
/**
 * 模块 <中文名> — 类型定义
 *
 * 职责：<一句话>
 * 依赖模块：<列出依赖的其他模块>
 */

import type { Protagonist, World } from '@/shared/lib/types';

// ============================================
// 模块 State Slice
// ============================================

/** <模块>状态切片 */
export interface <Domain>Slice {
  // ...
}

/** 初始状态 */
export const initial<Domain>Slice: <Domain>Slice = {
  // ...
};

// ============================================
// 模块 Action
// ============================================

export type <Domain>Action =
  | { type: '<action_name>'; payload: <PayloadType> }
  // ...
```

### `state.ts` 模板

```typescript
import type { <Domain>Slice, <Domain>Action } from './types';

export function <domain>Reducer(
  slice: <Domain>Slice,
  action: <Domain>Action
): <Domain>Slice {
  switch (action.type) {
    case '<action_name>':
      return { ...slice, /* ... */ };
    default:
      return slice;
  }
}
```

### `events.ts` 模板

```typescript
import type { <Domain>Slice } from './types';
import type { GameEvent } from '@/shared/lib/events/types';

export const <domain>EventHandlers: Record<
  string,
  (slice: <Domain>Slice, event: GameEvent) => <Domain>Slice
> = {
  // BattleWon: (slice, event) => ({ ...slice, ... }),
};
```

### `index.ts` 模板

```typescript
/**
 * 模块 <中文名> — 对外契约
 */

// —— 类型 ——
export type { <Domain>Slice, <Domain>Action } from './types';
export { initial<Domain>Slice } from './types';

// —— 状态 ——
export { <domain>Reducer } from './state';

// —— 事件 ——
export { <domain>EventHandlers } from './events';

// —— 纯函数 ——
export { /* functions */ } from './logic/<feature>';

// —— Hooks ——
export { use<Domain> } from './hooks/use<Domain>';

// —— 组件 ——
export { <ComponentName> } from './components/<ComponentName>';
```

---

## 五、shared/ 目录结构

```
shared/
├── ui/                    ← 原 components/ui/（shadcn 组件，不改）
├── components/            ← 原 components/shared/ + layout/（跨模块通用组件）
├── lib/
│   ├── types.ts           ← 核心类型（精简后 ≤500行）
│   ├── calculation/       ← 原 lib/calculation/（计算引擎）
│   ├── events/            ← 原 lib/game/events/（事件总线）
│   ├── websocket/         ← 原 lib/websocket/
│   └── multiplayer/       ← 原 lib/multiplayer/
├── utils/                 ← 原 utils/（cn, logger, saveMigrator）
├── config/                ← 原 lib/config/（环境配置）
└── storage/               ← 原 storage/（数据库）
```

---

## 六、模块间通信契约

### 原则

```
✅ 允许：
  模块 A 的 logic 调用模块 B 的 logic（纯函数调用纯函数）
  模块 A 发出事件，模块 B 的 eventHandler 响应
  模块 A 的 Hook 读取 GameState 中模块 B 的 slice（只读）

❌ 禁止：
  模块 A 的 Hook 直接修改模块 B 的 slice
  模块 A 的 logic 直接 import 模块 B 的 Hook 或 组件
  循环依赖（A→B→A）
```

### 事件驱动通信

```
┌──────────┐   emit(BattleWon)   ┌──────────────┐
│ ③ 探索    │───────────────────▶│  EventBus     │
│(explore)  │                    │ (shared/lib/) │
└──────────┘                     │              │
                                  │ 订阅者处理：  │
                                  │ ② progression │ ← 加经验
                                  │ ⑥ equipment   │ ← 加掉落
                                  │ ⑨ faction      │ ← 更新任务
                                  │ ⑪ collection   │ ← 更新统计
                                  │ ⑭ social       │ ← 公告
                                  └──────────────┘
```

事件总线位于 `shared/lib/events/eventManager.ts`。

---

## 七、迁移顺序（按难度 Tier 排序）

### Tier 0：纯函数，零状态依赖

**模块⑮ narrative（叙事文案）** — 最简单

| 源文件 | 目标位置 |
|--------|---------|
| `lib/text/core/textResolver.ts` | `modules/narrative/logic/textResolver.ts` |
| `lib/text/core/types.ts` | `modules/narrative/types.ts` |
| `lib/text/WorldTextManager.ts` | `modules/narrative/logic/worldTextManager.ts` |
| `lib/text/worlds/*.ts` (8 files) | `modules/narrative/data/worlds/*.ts` |
| `lib/text/index.ts` | 合并到 `modules/narrative/index.ts` |
| `lib/game/utils/terminology.ts` | `modules/narrative/logic/terminology.ts` |
| `lib/data/terminology.ts` | `modules/narrative/data/terminology.ts` |

**模块① identity（身份创建）** — 简单

| 源文件 | 目标位置 |
|--------|---------|
| `lib/game/utils/characterEvaluation.ts` | `modules/identity/logic/characterEvaluation.ts` |
| `lib/game/utils/traits.ts` | `modules/identity/logic/traits.ts` |
| `lib/game/utils/generators.ts`（角色/世界生成部分） | `modules/identity/logic/generators.ts` |
| `lib/game/worlds/*` | `modules/identity/logic/worlds/*` |
| `lib/data/traits.ts` | `modules/identity/data/traits.ts` |
| `lib/data/worldData.ts` | `modules/identity/data/worldData.ts` |
| `lib/data/worldEffectsData.ts` | `modules/identity/data/worldEffectsData.ts` |
| `lib/data/worldSystem.ts` | `modules/identity/data/worldSystem.ts` |
| `lib/data/worldEffectsUtils.ts` | `modules/identity/data/worldEffectsUtils.ts` |
| `components/pages/character-select/*` | `pages/character-select/`（页面组件，不放模块） |
| `components/pages/world-select/*` | `pages/world-select/`（页面组件） |
| `components/pages/backstory/*` | `pages/backstory/`（页面组件） |
| `components/pages/home/*` | `pages/home/`（页面组件） |

### Tier 1：自包含，少量状态

**模块⑭ social（社交公告）**

| 源文件 | 目标位置 |
|--------|---------|
| `lib/game/announcement/*` | `modules/social/logic/announcement/*` |
| `lib/multiplayer/*` | `modules/social/logic/multiplayer/*` |
| `lib/game/utils/messageDB.ts` | `modules/social/logic/messageDB.ts` |
| `components/game/announcement/*` | `modules/social/components/announcement/*` |
| `components/game/leaderboard/*` | `modules/social/components/leaderboard/*` |
| `components/game/shared/ChatRoom.tsx` | `modules/social/components/ChatRoom.tsx` |

**模块⑨ faction（势力门派）**

| 源文件 | 目标位置 |
|--------|---------|
| `lib/game/faction/factionQuests.ts` | `modules/faction/logic/factionQuests.ts` |
| `lib/game/taskSystem/factionTaskSystem.ts` | `modules/faction/logic/factionTaskSystem.ts` |
| `lib/game/taskSystem/factionTaskSystemNew.ts` | `modules/faction/logic/factionTaskSystemNew.ts` |
| `lib/data/factionData.ts` | `modules/faction/data/factionData.ts` |
| `lib/data/factionProgressData.ts` | `modules/faction/data/factionProgressData.ts` |
| `hooks/faction/useFaction.ts` | `modules/faction/hooks/useFaction.ts` |
| `components/game/tabs/FactionPanel.tsx` | `modules/faction/components/FactionPanel.tsx` |

### Tier 2：自包含子系统

（Tier 2-5 的文件映射表见 `tasks.md`，此处省略避免重复）

---

## 八、GameState 精简计划

重构后 GameState 从 40+ 扁平字段变为 15 个 Slice：

```typescript
interface GameState {
  // 全局
  phase: GamePhase;
  currentTab: ActionTab;
  devMode?: DevModeState;

  // 模块 Slices
  identity: IdentitySlice;
  progression: ProgressionSlice;
  exploration: ExplorationSlice;
  combat: CombatSlice;
  economy: EconomySlice;
  equipment: EquipmentSlice;
  techniques: TechniqueSlice;
  crafting: CraftingSlice;
  faction: FactionSlice;
  tower: TowerSlice;
  collection: CollectionSlice;
  ascension: AscensionSlice;
  time: TimeSlice;
  social: SocialSlice;
  // narrative 无状态（纯函数）
}
```

---

## 九、文件大小目标

| 文件类型 | 重构前（最大） | 重构后（目标） | 规则上限 |
|----------|---------------|---------------|---------|
| useGameState.tsx | 2361 行 | ≤300 行 | 200 |
| useAdventure.ts | 2242 行 | ≤200 行/个（拆为4+） | 200 |
| useFaction.ts | 1070 行 | ≤200 行 | 200 |
| useCultivation.ts | 726 行 | ≤200 行 | 200 |
| shared/lib/types.ts | 1261 行 | ≤500 行 | 800 |
| expansionLogic.ts | 1281 行 | ≤500 行 | 500 |
| fragmentSystem.ts | 885 行 | ≤500 行 | 500 |
| balanceConfig.ts | 715 行 | ≤500 行 | 500 |
| GamePage.tsx | 614 行 | ≤300 行 | 300 |

---

## 十、风险控制

1. **每次只迁移一个模块** — 一个分支一个模块，独立 review，独立合并
2. **先搬后改** — 搬运阶段不修改业务逻辑，只改路径和组织
3. **旧路径保留向后兼容** — 通过 barrel 重新导出，给其他代码过渡时间
4. **每个模块完成后立即合并到 main** — 避免长期分支导致的合并冲突
5. **保留原目录兜底** — 未迁移的文件暂时保留，逐步清空
6. **每步验证** — `pnpm ts-check && pnpm lint && pnpm build && pnpm test`
