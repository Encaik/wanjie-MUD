## Context

万界修行录已有完善的 EventBus（`core/events/`）支持事件驱动架构，但统计系统和任务系统尚未利用它。本设计将统计追踪和任务进度全面迁移到事件驱动模式，同时重构新手引导为分阶段教学流程。

## Goals / Non-Goals

**Goals:**
- 所有游戏操作通过 EventBus 发射事件，不直接修改 `statistics`
- `core/statistics/` 纯函数处理事件 → 更新 GameStatistics
- 分阶段新手引导（5 阶段），弹窗解释玩法
- 引导完成平滑过渡到正式任务系统
- Tab 式任务中心面板，支持多任务系统独立展示
- 初始物品归入引导体系（阶段 0）

**Non-Goals:**
- 不改变 QuestEngine（NPC 对话驱动任务）核心逻辑
- 不合并 BattleStatistics 和 GameStatistics
- 不改变 AchievementSystem

## Decisions

### 1. 统计追踪器架构

```
                    ┌──────────────────────┐
                    │   EventBus            │
                    │   gameEventBus.emit() │
                    └──────┬───────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Statistics    │ │ Tutorial     │ │ Quest Progress   │
│ Tracker      │ │ Guide        │ │ Tracker          │
│ (core/)      │ │ (modules/    │ │ (modules/quest/) │
│ 纯函数处理    │ │  quest/)     │ │ 事件→任务进度     │
└──────┬────────┘ └──────┬───────┘ └──────┬───────────┘
       │                 │               │
       ▼                 ▼               ▼
GameState.       tutorialState     questState
statistics      (phase/step)      .activeQuests
```

**统计追踪器放在 `core/statistics/`**：
- 它是游戏基础设施，所有模块依赖它
- `GameStatistics` 类型定义本来就在 `core/types/`
- 纯函数，无 React/浏览器 API 依赖
- 旧 `StatisticsManager` 单例保留兼容，标记 deprecated

### 2. 事件类型规范

按域划分，命名格式 `domain:action`：

| 域 | 事件类型 | Payload |
|-----|----------|---------|
| combat | `combat:enemy_killed` | `{ tier, count? }` |
| combat | `combat:boss_killed` | `{ count? }` |
| combat | `combat:elite_killed` | `{ count? }` |
| cultivation | `cultivation:performed` | `{ count? }` |
| cultivation | `cultivation:breakthrough` | `{ count? }` |
| item | `item:used` | `{ templateId, count? }` |
| item | `item:obtained` | `{ templateId, rarity?, count? }` |
| economy | `economy:spirit_stones_gained` | `{ amount }` |
| economy | `economy:spirit_stones_spent` | `{ amount }` |
| adventure | `adventure:completed` | `{ difficulty?, count? }` |
| collection | `collection:technique_obtained` | `{ name }` |
| collection | `collection:equipment_obtained` | `{ name }` |
| collection | `collection:legendary_obtained` | `{ count? }` |
| collection | `collection:material_obtained` | `{ count? }` |
| collection | `collection:fragment_obtained` | `{ count? }` |
| faction | `faction:joined` | `{}` |
| faction | `faction:reputation_changed` | `{ level }` |
| faction | `faction:contribution_gained` | `{ amount }` |
| faction | `faction:donation_made` | `{ spiritStones }` |
| achievement | `achievement:claimed` | `{ count? }` |
| path | `path:selected` | `{}` |
| path | `path:level_up` | `{ newLevel }` |
| technique | `technique:proficiency_up` | `{ level }` |
| equipment | `equipment:enhanced` | `{ newLevel }` |
| equipment | `equipment:crafted` | `{ count? }` |
| bond | `bond:activated` | `{ level }` |
| crafting | `crafting:technique_synthesized` | `{ count? }` |
| crafting | `crafting:fragment_synthesized` | `{ count? }` |
| player | `player:level_up` | `{ newLevel }` |
| tutorial | `tutorial:step_completed` | `{ stepId }` |
| tutorial | `tutorial:phase_completed` | `{ phaseId }` |
| tutorial | `tutorial:completed` | `{}` |

### 3. 调用链：分散 → 集中

**当前（分散式）**：
```
useCultivation ──→ setGameState({ statistics: newStats })  ❌
useAdventure   ──→ setGameState({ statistics: newStats })  ❌
useInventory   ──→ setGameState({ statistics: newStats })  ❌
```

**改进后（事件驱动 + 集中处理）**：
```
useCultivation ──→ emit('cultivation:performed') ──────────┐
useAdventure   ──→ emit('adventure:completed') ────────────┤
useInventory   ──→ emit('item:used', { templateId }) ──────┤
                                                            │
                  ┌─────────────────────────────────────────┘
                  ▼
            GameStore (单一 useEffect)
                  │
                  ├─ 1. processStatisticsEvent(stats, event) → newStats
                  ├─ 2. checkTutorialProgress(event, tutorialState) → guideUpdate
                  ├─ 3. checkQuestProgress(event, questState) → questUpdate
                  └─ 4. setGameState(合并所有更新)
```

**节流**：GameStore 对 `'*'` 事件处理做 1 秒批量节流，累计事件后一次处理，避免高频战斗事件导致过度渲染。统计数据的实时性要求不高。

### 4. 新手引导分阶段设计

```
阶段 0: 初入仙途
  └─ 步骤 0: 领取新手礼包
      ├─ 弹窗: 欢迎弹窗，介绍游戏基本概念
      ├─ 触发方式: 手动点击领取
      └─ 奖励: 200 灵石 + 聚气丹×5 + 筑基丹×1 + 回春丹×3

阶段 1: 初识修炼
  ├─ 步骤 1: 使用聚气丹
  │   ├─ 弹窗: 介绍丹药系统和背包
  │   └─ 触发: item:used → templateId === 'qi_gathering_pill'
  ├─ 步骤 2: 进行一次修炼
  │   ├─ 弹窗: 介绍修炼系统和境界
  │   └─ 触发: cultivation:performed
  └─ 阶段奖励: 50 灵石 + 回春丹×3

阶段 2: 初露锋芒
  ├─ 步骤 3: 进入机缘探索
  │   ├─ 弹窗: 介绍机缘系统
  │   └─ 触发: adventure:entered (新事件)
  ├─ 步骤 4: 击败第一个敌人
  │   ├─ 弹窗: 介绍战斗系统
  │   └─ 触发: combat:enemy_killed
  └─ 阶段奖励: 100 灵石 + 聚气丹×3 + 筑基丹×1 + 回春丹×2

阶段 3: 融入世界
  ├─ 步骤 5: 等级提升至 3 级
  │   └─ 触发: player:level_up → newLevel >= 3
  ├─ 步骤 6: 加入一个势力
  │   ├─ 弹窗: 介绍势力系统
  │   └─ 触发: faction:joined
  └─ 阶段奖励: 150 灵石 + 聚气丹×3 + 筑基丹×2

阶段 4: 登堂入室
  ├─ 步骤 7: 完成一次机缘探索（击败 Boss）
  │   └─ 触发: adventure:completed
  ├─ 步骤 8: 领取一个成就奖励
  │   ├─ 弹窗: 介绍成就系统
  │   └─ 触发: achievement:claimed
  └─ 最终奖励: 300 灵石 + 传说品质新手纪念品 + 解锁正式任务系统
```

**数据模型**：
```typescript
interface TutorialGuideDefinition {
  phases: TutorialPhase[];
}

interface TutorialPhase {
  id: string;
  name: string;           // "初识修炼"
  order: number;
  steps: TutorialStep[];
  phaseReward: TaskReward;  // 阶段完成时发放
}

interface TutorialStep {
  id: string;
  name: string;           // "进行一次修炼"
  description: string;    // 任务描述
  hint: string;           // 消息提示
  dialog?: TutorialDialog; // 可选引导弹窗（步骤首次激活时弹出）
  triggerEvent: string;   // 触发完成的事件类型
  condition: (event: GameEvent, protagonist: Protagonist) => boolean;
  stepReward?: TaskReward; // 步骤奖励（可选）
}

interface TutorialDialog {
  title: string;          // 弹窗标题
  content: string;        // Markdown 玩法说明
  confirmText?: string;   // 确认按钮文字，默认"知道了"
}
```

### 5. 引导弹窗组件

`TutorialDialog` 放在 `src/shared/components/TutorialDialog.tsx`：

- 复用型弹窗组件，接收 `title`、`content`（Markdown）、`onConfirm`
- 使用 shadcn Dialog + Card 组合
- 支持可选的主题装饰（`variant: 'welcome' | 'system-intro' | 'default'`）
- 欢迎弹窗（阶段 0）使用较大尺寸和特殊视觉

### 6. 初始物品处理

**当前**：`protagonistAdapter.createProtagonistFromSaved()` 硬编码初始物品。

**改进后**：
- `protagonistAdapter` 不再创建初始物品（`items: []`、`inventory: []`）
- 角色创建完成后，引导系统检测玩家进入游戏 → 激活阶段 0
- 阶段 0 弹窗欢迎 + 玩家点击"领取" → `emit('tutorial:starter_pack_claimed')` → 物品发放

过渡兼容方案：由于旧角色已有物品，阶段 0 检查背包是否已有初始物品 → 有则自动完成阶段 0。

### 7. 引导 → 正式任务过渡

```
引导期间：
  ├─ 任务面板默认显示"新手引导" Tab
  ├─ 新手引导 Tab 展示当前阶段/步骤/进度条
  ├─ 势力任务/NPC 任务 Tab 显示"完成新手引导后解锁"
  └─ 游戏事件同时推进引导步骤和统计更新

触发 tutorial:completed：
  ├─ 发放最终奖励（传说品质新手纪念品）
  ├─ 弹出庆祝弹窗
  ├─ tutorialState.completed = true
  └─ 任务面板自动切换到"NPC 任务" Tab

引导完成后：
  ├─ NPC 对话中出现任务选项（QuestEngine 不受影响）
  ├─ 势力日常/周常任务可见
  └─ 成就系统继续正常运行
```

### 8. 任务中心面板设计

**Tab 结构**：
```
┌─────────────────────────────────────────────────┐
│  [新手引导]    [势力任务]    [NPC 任务]          │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tab 内容区                                     │
│  ├─ 新手引导: 分阶段进度 + 当前步骤 + 弹窗触发  │
│  ├─ 势力任务: 日常/周常任务列表                  │
│  └─ NPC 任务: QuestEngine 进行中的任务           │
│                                                 │
└─────────────────────────────────────────────────┘
```

**视觉设计要点**：
- Tab 使用柔和的渐变色区分激活态
- 新手引导 Tab 激活时带 Sparkles 图标装饰
- 进度条使用 `game-cultivation → game-mental` 渐变
- 已完成步骤显示绿色对勾 + 删除线
- 使用 `CardCornerDecorations` 装饰卡片四角
- 使用 `recharts` 的 `Progress` 组件展示阶段进度

### 9. 目录结构变更

```
新增:
src/core/statistics/
├── index.ts              # 统一导出
├── types.ts              # 统计事件类型定义
├── eventTypes.ts         # 事件类型常量（EventRegistry 注册）
├── updaters.ts           # 事件→统计更新纯函数（从 collection 迁移）
└── statisticsTracker.ts  # processStatisticsEvent() 主函数

src/shared/components/TutorialDialog.tsx  # 引导弹窗复用组件

修改:
src/modules/quest/logic/
├── tutorialGuide.ts       # [新增] 分阶段引导定义
└── taskProgressTracker.ts # [新增] 事件驱动任务进度检查

src/modules/quest/components/
└── QuestPanel.tsx          # [重写] Tab 式任务中心

src/views/game/state/
└── GameStore.tsx           # [修改] 集中事件处理 useEffect

src/modules/identity/logic/
└── protagonistAdapter.ts   # [修改] 移除初始物品

废弃（保留兼容）:
src/modules/collection/logic/statistics/statisticsSystem.ts  # StatisticsManager → deprecated
src/modules/quest/logic/tutorialTasks.ts                      # 旧 TUTORIAL_TASKS → deprecated
```

### 10. 迁移策略

| Step | 内容 | 破坏性 | 向后兼容 |
|------|------|--------|----------|
| 1 | 创建 `core/statistics/`，迁移 updaters | 无 | ✅ 旧代码仍可用 |
| 2 | 定义事件类型 + EventRegistry 注册 | 无 | ✅ |
| 3 | GameStore 添加集中事件处理 | 无 | ✅ 并行运行 |
| 4 | 逐个模块迁移：Hook emit 替代直接 setState | 无 | ✅ 渐进 |
| 5 | 实现 tutorialGuide + taskProgressTracker | 无 | ✅ 旧 tutorialTasks 保留 |
| 6 | 重构 QuestPanel 为 Tab 式 | 无 | ✅ |
| 7 | 移除 protagonistAdapter 初始物品 | **有** | 阶段 0 兼容处理 |
| 8 | 清理废弃代码 | **有** | ❌ |
