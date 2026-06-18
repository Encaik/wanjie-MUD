## Context

万界修行录的任务系统经过前一轮统一（`unified-quest-system`），已经在类型和引擎层面统一了 `QuestDefinition`、`StoryLine`、`QuestBoard`、`QuestEventTracker`。但**内容层**仍然与**代码层**耦合——教程任务硬编码在 TypeScript 文件中，新旧两套教程代码并存，模块公共 API 暴露了大量教程专用函数。

本变更的目标是完成**"内容-系统分离"**：任务系统是通用引擎，任务是模板数据，两者通过注册中心连接。新手引导只是内置模板数据包之一。

**关键约束**：
- `core/` 不能依赖 `modules/`，模板注册中心放在 `core/registry/`
- `logic/` 纯函数，不能引用 React / 浏览器 API
- 组件 ≤ 300 行，Hook ≤ 200 行，logic 文件 ≤ 500 行
- 禁止 `any` 类型
- 直接删除旧代码（`tutorialTasks.ts`、`tutorialGuide.ts`），不保留兼容层

## Goals / Non-Goals

**Goals:**
1. 定义标准任务模板格式 `QuestTemplate`：JSON 可序列化，覆盖阶段、目标、弹窗、奖励、条件
2. 创建 `QuestTemplateRegistry`：统一管理内置和 Mod 注册的模板
3. 教程任务迁移为标准模板：删除 `tutorialTasks.ts` 和 `tutorialGuide.ts`
4. `QuestPanel` 彻底通用化：所有显示逻辑由模板数据驱动
5. 模块 API 净化：`index.ts` 只导出通用引擎，不导出教程专用函数
6. 保持向后兼容：`QuestDefinition` 仍可用于内部引擎，模板编译为 QuestDefinition

**Non-Goals:**
- 不做可视化任务编辑器（那是 UI 工具的事）
- 不改动 `QuestDefinition` 核心类型（模板是它的上层封装）
- 不改动 EventBus、reward-pool 等核心基础设施
- 不做任务国际化（中文硬编码保留在模板中，后续统一处理）

## Architecture

### 核心思想：Template → QuestDefinition 的分层

```
┌────────────────────────────────────────────────────────┐
│                    QuestTemplate (数据层)                 │
│  纯 JSON 可序列化，内置和 Mod 共享同一格式               │
│  描述"这个任务是什么": name, stages, dialogs, rewards    │
└────────────────────┬───────────────────────────────────┘
                     │ compileTemplate()
                     ▼
┌────────────────────────────────────────────────────────┐
│                  QuestDefinition (引擎层)                │
│  TypeScript 类型，引擎运行时使用                         │
│  描述"引擎如何执行": check(), eventMapping, prerequisites │
└────────────────────┬───────────────────────────────────┘
                     │ QuestEngine / EventTracker
                     ▼
┌────────────────────────────────────────────────────────┐
│                     QuestPanel (UI 层)                   │
│  纯通用显示组件，接收 props，不关心任务是什么内容        │
│  渲染逻辑全部由模板/定义数据驱动                         │
└────────────────────────────────────────────────────────┘
```

### QuestTemplate 标准格式

```typescript
/**
 * 标准任务模板 — 内置和 Mod 共用
 *
 * 这是"任务是什么"的声明式描述，与引擎逻辑解耦。
 * 模板可 JSON 序列化，支持从 .ts 数据文件或 .json Mod 文件加载。
 */
interface QuestTemplate {
  /** 模板唯一标识，内置使用 'builtin:' 前缀，Mod 使用 'mod:<modId>:' 前缀 */
  templateId: string;

  // === 基本信息 ===
  name: string;
  description: string;
  type: 'main' | 'side' | 'hidden' | 'daily' | 'weekly' | 'event';
  difficulty?: 'easy' | 'normal' | 'hard' | 'epic';

  // === 阶段定义 ===
  /** 任务阶段，每个阶段包含目标、完成条件和弹窗 */
  stages: QuestTemplateStage[];

  // === 对话/弹窗 ===
  /** 可选：任务接取时弹窗 */
  acceptDialog?: QuestTemplateDialog[];
  /** 可选：任务完成时弹窗 */
  completeDialog?: QuestTemplateDialog;

  // === 前置条件 ===
  prerequisites: QuestPrerequisite[];

  // === 奖励 ===
  /** 静态奖励（简单任务直接用，复杂任务走 rewardPool） */
  rewards?: QuestReward[];
  /** 奖励池配置（与静态奖励二选一或叠加） */
  rewardPool?: { poolId: string; multiplier?: number };

  // === 关联 ===
  /** 所属故事线 ID（可选） */
  storylineId?: string;
  /** 所属板块 ID 列表（可选） */
  boardIds?: string[];

  // === 世界观限制 ===
  worldviewRestrictions?: string[];

  // === 重复性 ===
  repeatable: boolean;
  cooldownSeconds?: number;

  // === 隐藏标记 ===
  hiddenInPanel?: boolean;

  // === 元信息 ===
  /** 模板来源：内置或 Mod ID */
  source: 'builtin' | string;
}

interface QuestTemplateStage {
  id: string;
  name: string;
  description: string;
  /** 阶段目标 */
  objectives: QuestTemplateObjective[];
  /** 完成方式（完成键 → 描述） */
  completions: Record<string, { description: string; nextStageId?: string }>;
  /** 阶段奖励 */
  stageRewards?: QuestReward[];
}

interface QuestTemplateObjective {
  type: string;          // kill_enemy | collect_item | reach_level | custom | ...
  target: string;        // 目标标识（enemyId, itemId, 等级值, ...）
  count: number;         // 需要完成次数
  hidden?: boolean;      // 隐藏目标（进度追踪但 UI 不显示）
  description: string;   // 人类可读描述
}

interface QuestTemplateDialog {
  title: string;
  content: string;       // 支持简单换行文本
  confirmText: string;   // 确认按钮文字
  variant?: 'welcome' | 'system-intro' | 'quest-start' | 'quest-complete' | 'reward';
}
```

### 模板→QuestDefinition 编译

```typescript
/**
 * 将 QuestTemplate 编译为 QuestDefinition
 *
 * 这是模板数据和引擎之间的桥梁。
 * 编译过程是纯函数，无副作用。
 */
function compileTemplate(template: QuestTemplate): QuestDefinition {
  return {
    id: template.templateId,
    name: template.name,
    description: template.description,
    type: template.type,
    difficulty: template.difficulty,
    prerequisites: template.prerequisites,
    stages: template.stages.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      objectives: s.objectives.map(o => ({
        type: o.type as QuestObjectiveType,
        target: o.target,
        count: o.count,
        hidden: o.hidden,
        description: o.description,
      })),
      completions: Object.fromEntries(
        Object.entries(s.completions).map(([key, val]) => [key, {
          description: val.description,
          nextStageId: val.nextStageId,
          stageRewards: s.stageRewards,
        }])
      ),
    })),
    rewards: template.rewards,
    rewardPool: template.rewardPool,
    repeatable: template.repeatable,
    cooldownSeconds: template.cooldownSeconds,
    boardIds: template.boardIds,
    storylineId: template.storylineId,
    hiddenInPanel: template.hiddenInPanel,
    worldviewRestrictions: template.worldviewRestrictions,
    dialog: template.acceptDialog?.[0] ? {
      title: template.acceptDialog[0].title,
      content: template.acceptDialog[0].content,
      confirmText: template.acceptDialog[0].confirmText,
    } : undefined,
    eventMapping: deriveEventMapping(template.stages),
    sourceModId: template.source === 'builtin' ? undefined : template.source,
  };
}
```

### 注册中心

```typescript
// core/registry/QuestTemplateRegistry.ts

/**
 * 任务模板注册中心
 *
 * 统一管理内置和 Mod 注册的任务模板。
 * 位于 core/ 因为 ModLoader（core/mod/）在加载阶段需要注册模板。
 */
class QuestTemplateRegistry {
  private static instance: QuestTemplateRegistry;
  private templates = new Map<string, QuestTemplate>();

  static getInstance(): QuestTemplateRegistry;
  register(template: QuestTemplate): void;
  registerAll(templates: QuestTemplate[]): void;
  get(id: string): QuestTemplate | undefined;
  getAll(): QuestTemplate[];
  getAllForWorldview(worldviewId: string): QuestTemplate[];

  /** 按板块 ID 获取模板列表 */
  getByBoardId(boardId: string): QuestTemplate[];

  /** 按故事线 ID 获取模板列表 */
  getByStorylineId(storylineId: string): QuestTemplate[];
}
```

### 数据流（修改后）

```
┌─────────────────────────────────────────────────┐
│              数据加载阶段（启动时）                │
│                                                   │
│  modules/quest/data/   →  QuestTemplateRegistry    │
│  (内置模板, .ts)           .registerAll()          │
│                                                   │
│  mods/<id>/quests/     →  QuestTemplateRegistry    │
│  (Mod 模板, .json)         .registerAll()          │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│             运行时引擎 (modules/quest/logic/)      │
│                                                   │
│  QuestEventTracker ──── EventBus                 │
│  StoryEngine ───────── StoryLineRegistry         │
│  BoardEngine ───────── BoardRegistry             │
│  QuestEngine ───────── QuestTemplateRegistry      │
│     │                    + compileTemplate()      │
│     │                                             │
│     └── 需要 QuestDefinition 时：                  │
│         getTemplate(id) → compileTemplate(tmpl)    │
│         或缓存编译结果避免重复编译                  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│               UI 层 (QuestPanel)                  │
│                                                   │
│  接收 QuestState + 通过 Hook 获取模板列表          │
│  所有渲染逻辑由模板数据驱动：                      │
│  - Tab 列表来自 BoardRegistry.getAll()            │
│  - 任务卡片内容来自 QuestTemplate                   │
│  - 弹窗内容来自 template.acceptDialog              │
│  - 奖励展示来自 template.rewards                   │
└─────────────────────────────────────────────────┘
```

### 教程迁移设计

**旧代码（删除）→ 新位置（数据）映射：**

| 旧位置 | 内容 | 迁移方向 |
|--------|------|----------|
| `tutorialTasks.ts` 中的 `TUTORIAL_TASKS` (7 步) | 旧版线性任务 | ❌ 直接删除（已被新版替代） |
| `tutorialGuide.ts` 中的 `TUTORIAL_GUIDE` (5 phase, 9 step) | 分阶段引导定义 | → `data/quests/tutorial.ts` 改为 `QuestTemplate[]` |
| `tutorialGuide.ts` 中的 `spiritStoneTemplate` 等硬编码物品 | 旧 `ItemDefinition` 内联定义 | → 改用 `itemId` 字符串引用 ItemRegistry |
| `taskProgressTracker.ts` 中的 `TutorialState` | 教程专用状态 | → 使用统一的 `QuestState`（通过 storyEngine.getStoryProgress） |
| `tutorialTasks.ts` 中的 `getTutorialWelcomeMessage()` | 欢迎消息函数 | → 作为 `tutorial_welcome` 模板的 `acceptDialog.content` |

**新版教程数据示例（QuestTemplate 格式）：**

```typescript
// modules/quest/data/quests/tutorial.ts
import type { QuestTemplate } from '@/core/types';
import { TUTORIAL_STORYLINE_ID, TUTORIAL_BOARD_ID } from './ids';

export const TUTORIAL_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    templateId: 'builtin:tutorial_welcome',
    name: '欢迎来到万界',
    description: '踏入万界修行路，领取初始物资',
    type: 'main',
    source: 'builtin',
    stages: [{
      id: 'stage_1',
      name: '进入游戏',
      description: '游戏启动时自动完成',
      objectives: [
        { type: 'custom', target: 'game_started', count: 1, description: '进入游戏' },
      ],
      completions: { done: { description: '完成' } },
    }],
    prerequisites: [],
    rewards: [
      { spiritStones: 200 },
      { items: [{ itemId: 'wanjie-core:cultivation:qi_gathering_pill', quantity: 5 }] },
      { items: [{ itemId: 'wanjie-core:cultivation:foundation_pill', quantity: 1 }] },
      { items: [{ itemId: 'wanjie:common:rejuvenation_pill', quantity: 3 }] },
    ],
    repeatable: false,
    boardIds: [TUTORIAL_BOARD_ID],
    storylineId: TUTORIAL_STORYLINE_ID,
    acceptDialog: [{
      title: '欢迎来到万界修行录',
      content: '你即将踏上一段跨越万千世界的修行之旅...',
      confirmText: '踏入修行',
      variant: 'welcome',
    }],
  },
  // ... 其余 8 个任务 ...
];
```

### QuestPanel 通用化

**旧问题：**
- 教程欢迎消息从 `getTutorialWelcomeMessage()` 函数获取（硬编码逻辑）
- 弹窗类型判断用 `variant` 字段但渲染逻辑分支多
- 教程进度追踪用 `TutorialState` 而非通用 `QuestState`

**新设计：**
```
QuestPanel(props)
  │
  ├─ useQuest() hook
  │   └─ 返回 { boards, activeQuests, storyProgress, ... }
  │      这些数据完全由注册中心 + 引擎计算，不区分教程/主线/日常
  │
  ├─ TabBar
  │   └─ boards.map(board => <Tab key={board.id} {...board} />)
  │       // 纯数据驱动，BoardRegistry.getAll() 返回什么就渲染什么
  │
  ├─ TaskList (per board)
  │   └─ tasks.map(template => <TaskCard>
  │         ├─ 任务名、描述、进度 → 全来自 template 字段
  │         ├─ 奖励预览 → template.rewards → rewardDistributor 计算
  │         └─ 操作按钮 → 「接取」「领取奖励」由 questState 状态决定
  │       </TaskCard>)
  │
  └─ TaskDialog (触发于 template.acceptDialog)
      └─ <Dialog>
            <DialogTitle>{dialog.title}</DialogTitle>
            <DialogContent>{dialog.content}</DialogContent>
            <DialogConfirm>{dialog.confirmText}</DialogConfirm>
          </Dialog>
          // 不需要知道这是教程还是主线，只是渲染模板中的 dialog 字段
```

### 状态映射

教程进度不再使用 `TutorialState`，而是通过 `storyEngine.getStoryProgress(storylineId, questState)` 获取通用进度：

```typescript
// 旧：checkTutorialProgress(event, tutorialState, protagonist)
// 新：applyEventToQuests(event, questState) + getStoryProgress(storylineId, questState)

// 教程阶段 = 故事线节点完成状态
// storyCompletedNodeIds 包含所有已完成节点（tutorial 的 phase 也是 node）
```

### Mod 加载器适配

```
mods/<mod-id>/quests/quests.json
  └─ QuestTemplate[] (纯 JSON，无 TypeScript)

ModLoader.loadContentType('quests', data)
  └─ 解析 JSON
  └─ 校验格式（Zod schema 或手动校验）
  └─ QuestTemplateRegistry.getInstance().registerAll(templates)
  └─ 不需要额外步骤，模板自动进入编译管线
```

## Decisions

### D1: 模板放在数据层而非核心类型层

**Decision:** `QuestTemplate` 类型放在 `core/types/`，但具体模板数据放在 `modules/quest/data/` 或用 Mod JSON 提供。

**理由:** 模板是"特定任务的内容"，不是核心游戏类型。`core/types/` 只定义模板的形状（类型），实际数据放在内容层。

### D2: 保留 QuestDefinition 作为引擎运行时类型

**Decision:** 不删除 `QuestDefinition`，而是将 `QuestTemplate` 作为其上游数据格式。引擎内部仍使用 `QuestDefinition`。

**理由:** `QuestDefinition` 的 `check()` 函数、`eventMapping` 等运行时字段不适合放入纯数据模板。编译步骤将数据模板转为运行时定义，引擎不直接消费模板。

### D3: 完全删除 tutorialTasks.ts 和 tutorialGuide.ts

**Decision:** 不留兼容层，不保留 deprecated re-export，直接删除。

**理由:** 遵循项目"不写过渡兼容代码"原则。新版教程模板已在 `data/quests/tutorial.ts` 中准备就绪，旧代码无引用价值。

### D4: taskProgressTracker.ts 重写为通用进度追踪器

**Decision:** `checkTutorialProgress()` 等函数不再存在。教程进度通过 `storyEngine.getStoryProgress('storyline_tutorial', questState)` 计算。

**理由:** 教程是一个 `type='tutorial'` 的故事线，其进度追踪与主线故事线完全一致。不应该为教程写特殊逻辑。

### D5: 模板编译缓存

**Decision:** 在 `getTemplate()` 调用时惰性编译并缓存，使用 `Map<string, QuestDefinition>` 作为编译缓存。

**理由:** 避免每次查询都重新编译模板，同时避免预编译所有模板（启动性能）。

## Risks / Mitigations

| 风险 | 缓解 |
|------|------|
| 旧教程代码删除后，依赖它的 UI 组件破壊 | 编译验证：`pnpm ts-check` 确保所有引用迁移完毕 |
| 教程迁移后行为不一致（步骤顺序、奖励数量） | 模板数据与旧代码逐字段对比，确认等价 |
| `taskProgressTracker.ts` 重写引入教程进度回归 | 已有测试 `taskProgressTracker.test.ts`（如存在）更新为新 API |
| 模板格式太复杂，导致 Mod 作者难以上手 | 提供 `TUTORIAL_QUEST_TEMPLATES` 作为最佳实践示例 |
| 编译步骤增加运行时开销 | 惰性编译 + 缓存，首次访问后零开销 |
