## Context

万界修行录的任务系统需要从三套并行体系统一为一套。当前 `GameState` 中同时存在 `tutorialState`（新手引导）、`taskSystems`（通用任务面板）、`questState`（NPC 任务），三套体系各自管理状态、各自有不同的任务定义格式、各自独立追踪进度。

**关键约束：**
- `core/` 不能依赖 `modules/`，因此注册中心（Registry）放在 `core/`，引擎和 UI 放在 `modules/`
- `logic/` 纯函数：无 React、无浏览器 API、使用种子 RNG
- 组件 ≤ 300 行，Hook ≤ 200 行，logic 文件 ≤ 500 行
- 禁止 `any` 类型
- 直接删除/重写旧代码，不保留兼容层
- 任务奖励接入已有的 `modules/reward-pool/` 模块

**依赖关系：**
```
modules/quest/ ──────► core/quest/ (StoryLineRegistry, BoardRegistry)
     │                      │
     ├─ questEngine ────────┼──► core/events/ (EventBus)
     ├─ eventTracker ───────┤
     ├─ rewardBridge ───────┤
     │                      │
     └─► modules/reward-pool/ (poolEngine)
     └─► core/message-log/ (MessageManager)
```

## Goals / Non-Goals

**Goals:**
1. 统一 QuestState：所有任务类型共用一套状态管理
2. 故事线系统：phase/section/quest_ref 多层级，支持主线/支线/新手引导
3. 板块系统：任务分类 + 刷新规则 + 槽位管理
4. 事件驱动追踪：引擎订阅全局事件，自动匹配并更新目标进度
5. 接入奖励池：任务奖励走 reward-pool 模块
6. 手动领奖：completed ≠ claimed，所有任务统一为二阶段操作
7. Mod 注入故事线和板块：quests/ 文件夹支持三种 JSON
8. 消息集成：任务完成和领取奖励时生成消息记录
9. QuestPanel 动态板块 Tab：锁定/空/进行中/可领取/冷却中五种状态
10. 清理三套并行状态：删除 `taskSystems`、合并 `tutorialState` 到统一 QuestState

**Non-Goals:**
- 不做可视化任务编辑器
- 不改动 EventBus 核心机制
- 不改动 reward-pool 模块的核心引擎
- 不做任务排行榜/任务成就（那是成就模块的事）
- 不做多人同步任务（多人任务后续扩展）

## Architecture

### 统一后的模块结构

```
modules/quest/
├── index.ts                   ← 公共 API
├── types.ts                   ← 故事线、板块、追踪器相关类型（≤300行）
├── state.ts                   ← 统一 QuestState 类型 + reducer（≤200行）
├── events.ts                  ← 事件追踪器 + 消息模板注册（≤300行）
│
├── logic/
│   ├── index.ts
│   ├── questEngine.ts         ← [已存在] 阶段引擎（前置条件、目标追踪、阶段推进）
│   ├── storyEngine.ts         ← 故事线引擎（节点解锁、进度计算、下一任务获取）
│   ├── boardEngine.ts         ← 板块引擎（刷新、槽位分配、任务选取）
│   ├── eventTracker.ts        ← 事件驱动追踪（事件→目标映射、进度更新、完成检测）
│   ├── rewardDistributor.ts   ← [已存在] 奖励分发 + 奖励池桥接
│   ├── tutorialTasks.ts       ← [保留] 新手任务数据（迁移为 StoryLine）
│   ├── tutorialGuide.ts       ← [保留] 引导定义数据
│   └── __tests__/
│       ├── questEngine.test.ts
│       ├── storyEngine.test.ts
│       ├── boardEngine.test.ts
│       └── eventTracker.test.ts
│
├── hooks/
│   ├── index.ts
│   └── useQuest.ts            ← 统一 Hook（接受/提交/领取/追踪进度）
│
├── components/
│   ├── index.ts
│   └── QuestPanel.tsx          ← 重构为动态板块 Tab
│
└── data/
    ├── index.ts
    ├── storylines/             ← 内置故事线
    │   ├── index.ts
    │   └── tutorial.ts
    ├── boards/                 ← 内置板块
    │   ├── index.ts
    │   └── default.ts
    └── quests/                 ← 内置任务数据
        └── index.ts
```

### 核心类型

```typescript
// ============================================
// 板块系统（新增）
// ============================================

type QuestCategory =
  | 'tutorial'
  | 'main_story'
  | 'side_story'
  | 'daily'
  | 'weekly'
  | 'faction'
  | 'event'
  | 'achievement';

interface QuestBoard {
  id: string;
  name: string;
  category: QuestCategory;
  description?: string;
  /** 刷新规则 */
  refreshRule: RefreshRule;
  /** 每次刷新生成的槽位数 */
  slotCount: number;
  /** 可用任务池（questId 列表） */
  questPool: string[];
  /** 是否随机选取槽位（false = 按顺序选取前 slotCount 个） */
  randomPick: boolean;
  /** 板块解锁条件 */
  unlockConditions?: QuestPrerequisite[];
  /** Mod 来源标识（内置为空） */
  sourceModId?: string;
}

type RefreshRule =
  | { type: 'never' }
  | { type: 'daily'; resetHour?: number }
  | { type: 'weekly'; resetDay?: number }
  | { type: 'custom'; cronExpression: string };

// ============================================
// 故事线系统（新增）
// ============================================

type StoryLineType = 'main' | 'side' | 'tutorial';

interface StoryNode {
  id: string;
  name: string;
  type: 'phase' | 'section' | 'quest_ref';
  order: number;
  description?: string;
  /** 任务引用（仅 type='quest_ref'） */
  questId?: string;
  /** 子节点（仅 type='phase'|'section'） */
  children?: StoryNode[];
  /** 节点解锁条件 */
  unlockCondition?: {
    type: 'quest_completed' | 'level' | 'realm' | 'node_completed';
    target: string;
  };
}

interface StoryLine {
  id: string;
  name: string;
  type: StoryLineType;
  description?: string;
  worldviewRestrictions?: string[];
  rootNodes: StoryNode[];
}

// ============================================
// 扩展 QuestDefinition（在现有基础上增加）
// ============================================

// 新增：事件→目标映射规则
interface EventObjectiveMapping {
  eventType: string;
  targetField: string;
  objectiveType: string;
  getDelta?: (event: GameEvent) => number;
}

// QuestDefinition 新增字段（伪代码，实际修改 core/types）
// - boardIds?: string[]
// - storylineId?: string
// - rewardPool?: { poolId: string; multiplier?: number }
// - difficulty?: 'easy' | 'normal' | 'hard' | 'epic'
// - eventMapping?: EventObjectiveMapping[]

// QuestObjective.type 新增：
// - 'custom' → 自定义条件（通过 eventMapping 匹配）

// ============================================
// 统一 QuestState（替换三套旧状态）
// ============================================

interface QuestState {
  /** 活跃任务（key = questId） */
  activeQuests: Record<string, ActiveQuest>;
  /** 已完成任务 ID 列表 */
  completedQuestIds: string[];
  /** 已领取奖励的任务 ID 列表 */
  claimedQuestIds: string[];

  /** 任务接取时间戳（questId → timestamp） */
  acceptedTimestamps: Record<string, number>;
  /** 任务完成时间戳（用于冷却计算） */
  completedTimestamps: Record<string, number>;

  /** 板块槽位状态（boardId → 当前槽位 questId 列表） */
  boardSlots: Record<string, string[]>;
  /** 板块上次刷新时间（boardId → timestamp） */
  boardLastRefresh: Record<string, number>;

  /** 故事线已完成节点 ID 列表 */
  storyCompletedNodeIds: string[];

  /** 阶段历史（questId → 完成的 stageId 列表） */
  stageHistory: Record<string, string[]>;
}
```

### 数据流

```
                         ┌──────────────────────────────┐
                         │      EventBus (core)          │
                         │   所有游戏事件统一入口          │
                         └──────────────┬───────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────┐
              │                         │                      │
              ▼                         ▼                      ▼
    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
    │ QuestEventTracker│    │  MessageManager  │    │  其他订阅者       │
    │ (modules/quest)  │    │  (core)          │    │                  │
    │                  │    │                  │    │                  │
    │ 1. 遍历 active   │    │ 匹配模板生成消息  │    │                  │
    │    Quests        │    │                  │    │                  │
    │ 2. 事件→目标     │    │ quest:completed   │    │                  │
    │    映射匹配      │    │ quest:claimed     │    │                  │
    │ 3. 更新进度      │    │ quest:progress    │    │                  │
    │ 4. 检测完成      │    └──────────────────┘    └──────────────────┘
    │ 5. 触发事件       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  dispatch() 更新  │
    │  QuestState       │
    │  (completedQuest  │
    │   Ids + timestamps│
    │   + boardSlots)   │
    └──────────────────┘
```

### 事件驱动追踪详解

```
事件→目标映射约定（内置默认 + 可自定义）：

事件类型                    → ObjectiveType    匹配规则
──────────────────────────────────────────────────────────
combat:enemy_killed         → kill_enemy        payload.enemyId === target
item:collected              → collect_item      payload.itemId === target
item:used                   → use_item          payload.templateId === target
progression:level_up        → reach_level       payload.newLevel >= Number(target)
progression:realm_broken    → reach_realm       payload.realm === target
cultivation:performed       → cultivate         次数累计（target 忽略）
exploration:location_entered→ explore_location  payload.locationId === target
npc:dialogue_triggered      → dialogue_check    payload.npcId === target
faction:joined              → join_faction      payload.factionId === target
tutorial:game_started       → talk_to_npc       payload 匹配（tutorial 专用）

* (通配符)                   → custom           由 eventMapping.getDelta 计算
```

### 奖励池桥接

```typescript
// quest.rewardPool 存在时走奖励池，否则走静态 rewards
function calculateQuestRewards(
  quest: QuestDefinition,
  active: ActiveQuest,
  context: RollContext
): RewardResult {
  if (quest.rewardPool) {
    const pool = getPool(quest.rewardPool.poolId);
    return rollPool(pool, {
      ...context,
      quantityMultiplier: (quest.rewardPool.multiplier ?? 1),
    });
  }
  // 静态路径：合并 quest.rewards + 阶段 rewards
  return mergeStaticRewards(quest, active);
}
```

### 板块刷新流程

```
板块刷新时机判断：
  daily  → 检查 boardLastRefresh 是否在同一天（按 resetHour）
  weekly → 检查 boardLastRefresh 是否在同一周（按 resetDay）
  never  → 从不刷新

刷新过程：
  boardEngine.refreshBoard(board, questState, rng)
    │
    ├─ 1. 从 questPool 中筛选可用任务：
    │     - 非活跃中
    │     - 未完成（或 repeatable 且冷却已过）
    │     - 满足前置条件
    │
    ├─ 2. 如果 randomPick = true：
    │     randomWeighted 选取 slotCount 个任务
    │   否则：按顺序取前 slotCount 个
    │
    └─ 3. 更新 boardSlots[board.id] = selectedQuestIds
          更新 boardLastRefresh[board.id] = Date.now()
```

### 板块五种 UI 状态

```
unlockConditions 未满足
    └─→ 🔒 锁定状态（灰色图标，不可点击）

unlockConditions 满足 + boardSlots 为空
    └─→ 📭 "暂无任务"（空状态提示）

boardSlots 中有 questId，但 questState.activeQuests 中不存在
    └─→ 📋 "可接取"（显示任务名 + 接取按钮）

boardSlots 中全部在 completedQuestIds 中
    └─→ 🎁 "全部完成，可领取奖励"（领取按钮高亮）

boardSlots 中全部在 claimedQuestIds 中
    ├─ repeatable=false → 永久完成 ✓
    └─ repeatable=true → ⏳ "冷却中 HH:MM:SS"
```

### Mod 注入结构

```
mods/<mod-id>/
├── mod.json                          # contentTypes: ["quests"]
└── quests/
    ├── quests.json                   # QuestDefinition[]
    ├── storylines.json               # StoryLine[]
    ├── boards.json                   # QuestBoard[]
    └── data.json                     # 构建产物（合并以上三个文件）
```

ModLoader 处理 quests content type：
```
loadModDataAndRegister(modId, manifest)
  └─ contentType === 'quests'
     ├─ 读取 quests.json → QuestRegistry.registerAll()
     ├─ 读取 storylines.json → StoryLineRegistry.registerAll()
     └─ 读取 boards.json → BoardRegistry.registerAll()
```

新增注册中心（放在 core/ 因为它们被 ModLoader 引用）：
```
core/registry/
├── QuestRegistry.ts     ← [已存在] 扩展 registerAll 支持批量
├── StoryLineRegistry.ts ← [新增] 故事线注册
└── BoardRegistry.ts     ← [新增] 板块注册
```

### 状态迁移路径

```
旧状态                        新统一 QuestState
────────────────────────      ──────────────────
tutorialState              →  questState.storyCompletedNodeIds（tutorial 节点）
  .completedStepIds        →  questState.completedQuestIds（tutorial 任务 ID）
  .claimedRewardStepIds    →  questState.claimedQuestIds（tutorial 任务 ID）
  
taskSystems.tutorial       →  questState.boardSlots['tutorial']
  .completedTaskIds        →  questState.completedQuestIds
  .claimedTaskIds          →  questState.claimedQuestIds

taskSystems.faction        →  questState.boardSlots['faction']
  .completedTaskIds        →  questState.completedQuestIds

questState                 →  questState（字段名保持一致，扩展新字段）
  .activeQuests            →  questState.activeQuests
  .completedQuests         →  questState.completedQuestIds
  .stageHistory            →  questState.stageHistory
```

## Decisions

### D1: 注册中心位置 — 放在 core/ 而非 modules/

**Decision:** `StoryLineRegistry` 和 `BoardRegistry` 放在 `core/registry/`。

**理由:** ModLoader（位于 `core/mod/`）在加载阶段需要注册故事线和板块。`core/` 不能依赖 `modules/`，所以注册中心必须放在 `core/`。

### D2: 故事线节点 — 树形而非扁平列表

**Decision:** `StoryNode` 使用 `children` 递归结构，而非扁平列表 + 排序字段。

**理由:** 扁平列表需要排序字段和多层过滤查询，树形结构天然表达层级关系，查询"下一任务"只需 traversing 到叶子节点。

### D3: 事件追踪器 — 单例订阅而非轮询

**Decision:** `QuestEventTracker` 在初始化时注册为全局 '*' 事件监听器，每次游戏事件触发时同步检查所有活跃任务。

**理由:** 轮询浪费计算资源，事件驱动保证"事件发生时立即追踪"，且与现有 MessageManager 的事件模式一致。

### D4: 奖励池 — quest.rewardPool 字段而非全局映射

**Decision:** 在 `QuestDefinition` 上增加 `rewardPool` 字段，而非维护 questId→poolId 的全局映射表。

**理由:** 数据与定义就近放置，查询和修改都更直观。静态 rewards 保留作为简单任务的 rewardPool 替代。

### D5: 故事线分支 — 预留但默认线性

**Decision:** 故事线节点 `unlockCondition` 支持 `node_completed` 类型（表示完成某节点后解锁），但默认故事线不在 `StoryNode` 级别定义分支（分支逻辑由任务内的 `QuestStage.completions` 处理）。

**理由:** 满足用户"默认线性，保留分支扩展性"的要求。分支剧情通过任务内 `completions` 的不同 key 走向不同结局，故事线层面只需按序推进已解锁节点。

## Risks / Mitigations

| 风险 | 缓解 |
|------|------|
| 旧状态迁移可能导致存档损坏 | 存档加载时添加迁移函数，将旧字段映射到新 questState |
| 事件追踪器性能（每事件遍历所有活跃任务） | 活跃任务数量通常 ≤10，遍历开销可忽略；大型优化留到后续 |
| 教程引导逻辑（tutorialGuide.ts）依赖旧 tutorialState | 重写为 storyEngine 的一个特例，tutorial 是 StoryLine type='tutorial' |
| 板块刷新时机与时间系统集成 | 使用 `core/time/TimeState` 判定跨天/跨周，不依赖系统时钟 |
