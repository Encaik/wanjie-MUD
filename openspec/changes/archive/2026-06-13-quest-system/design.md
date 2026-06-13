## Context

项目已有 `npc-mod-content-type`（NPC 对话 + 态度 + 交易）、`crpg-dialogue-checks`（d20 检定）、`character-seed-system`（角色数据模型）。现有的 faction 任务系统（`modules/faction/logic/taskProgressSystem.ts`）覆盖了日常重复性任务，但缺失主线/支线剧情任务。

NPC 对话选项分支系统已支持三层把关（态度门槛 → 核心值门槛 → CRPG 检定），任务系统需要在此基础上注入"接取任务"和"提交任务"选项，并与任务状态联动。

## Goals / Non-Goals

**Goals:**
- 任务作为独立 Mod 内容类型，通过 JSON 文件定义
- 多阶段任务：一个任务包含多个 Stage，按序推进，支持分支
- 任务前置条件：多维度校验（等级、境界、已完成任务、阵营、态度值）
- NPC 集成：任务定义引用 NPC ID，对话引擎自动注入任务选项
- 任务类型：主线（main）、支线（side）、隐藏（hidden）、日常（daily）、事件（event）
- 任务状态持久化：玩家当前活跃任务、已完成任务、任务进度存入存档

**Non-Goals:**
- 不替代现有 faction 任务系统（两者并存，faction 任务保持现有实现）
- 不在此变更中实现任务 UI 面板（仅定义数据结构和逻辑层）
- 不实现任务自动生成/程序化生成（任务由 Mod JSON 静态定义）
- 不实现任务时间限制（第一阶段不做倒计时任务）

## Decisions

### Decision 1: 任务多阶段 + 分支结构

**选择**: 任务由 `QuestStage[]` 组成，每个 Stage 包含多个 objectives。Stage 的 `completions` 字段定义不同完成结果对应的下一 Stage：

```typescript
interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'side' | 'hidden' | 'daily' | 'event';
  worldviewRestrictions?: string[];
  prerequisites: QuestPrerequisite[];
  stages: QuestStage[];
  rewards: QuestReward[];        // 最终完成奖励
  repeatable: boolean;
  cooldownSeconds?: number;
}

interface QuestStage {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  /** 完成此 Stage 后的分支选项（key = 完成方式标识） */
  completions: Record<string, QuestStageCompletion>;
  /** 进入此 Stage 时触发的 NPC 对话行（可选） */
  npcDialogueOnEnter?: { npcId: string; lineId: string };
}

interface QuestStageCompletion {
  description: string;
  nextStageId?: string;           // undefined = 任务结束
  stageRewards?: QuestReward[];   // 本阶段奖励
}

interface QuestObjective {
  type: 'talk_to_npc' | 'kill_enemy' | 'collect_item' | 'reach_realm' | 'reach_level'
       | 'explore_location' | 'use_item' | 'dialogue_check' | 'custom';
  target: string;                  // 目标 ID（NPC ID / 物品 ID / 境界名 / 位置 ID）
  count?: number;                  // 数量要求
  description: string;             // 显示给玩家看的描述
  hidden?: boolean;                // 是否隐藏目标
}
```

**理由**: 多 Stage 支持"先找 NPC A 对话 → 再收集 5 个物品 → 回去找 NPC A" 的经典任务流程。`completions` 字典支持同一 Stage 的多种完成方式（如"武力解决"vs"说服解决"），导向不同分支。

### Decision 2: NPC 对话自动注入任务选项

**选择**: NPC 对话引擎（`dialogueEngine.ts`）在解析对话选项时，自动检查该 NPC 是否为 quest giver（有可接任务）或 turn-in NPC（有可提交任务），并注入对应的特殊选项。

注入规则：
- NPC 有可接任务且玩家满足前置条件 → 注入 `[任务] <任务名>` 选项
- NPC 有可提交任务（玩家当前活跃任务的目标 NPC） → 注入 `[提交] <任务名>` 选项
- 任务选项的 `statGates` 由任务前置条件自动生成
- 任务选项的 `resultBranch` 为任务定义的启动/提交对话行

**理由**: 任务与对话解耦——Mod 作者只需在任务 JSON 中引用 NPC ID，无需手动修改 NPC 对话 JSON。降低 Mod 创作门槛。

### Decision 3: 任务前置条件多维度

**选择**: 前置条件以 `QuestPrerequisite[]` 数组定义，所有条件必须同时满足：

```typescript
interface QuestPrerequisite {
  type: 'level' | 'realm' | 'quest_completed' | 'faction' | 'attitude'
       | 'coreStat' | 'attribute' | 'item_owned';
  target: string;        // 目标值（level=5, realm=筑基, quest=quest_001, faction=righteous_sect, etc.）
  minValue?: number;     // 最小值
  maxValue?: number;     // 最大值（可选）
}
```

**理由**: 简单数组结构便于 JSON 定义，无需复杂的 AND/OR 逻辑树（第一阶段需求中的前置条件通常是 AND 关系）。

### Decision 4: 任务类型分工

| 类型 | 可重复 | 说明 | 示例 |
|------|--------|------|------|
| `main` | 否 | 主线剧情，不可重复 | 拜入青云宗 |
| `side` | 否 | 支线任务，完成后不可重复 | 帮助王掌柜收集灵药 |
| `hidden` | 否 | 隐藏任务，需特定条件触发 | 发现散修的秘密洞府 |
| `daily` | 是 | 日常任务，有冷却时间 | 每日清剿妖兽 |
| `event` | 否 | 世界事件触发的一次性任务 | 妖兽潮入侵 |

**理由**: `daily` 类型与 faction 任务系统互补——faction 任务维持现有实现，quest 系统覆盖剧情向的日常。未来可迁移 faction 任务到 quest 系统。

### Decision 5: 与旧 faction 任务系统共存

**选择**: 任务系统（`modules/quest/`）与 faction 任务系统（`modules/faction/logic/`）各自独立运行，通过不同的 state slice 管理。Quest 系统管理剧情/分支任务，Faction 系统管理日常/重复任务。

**理由**: 避免大规模重构现有代码。两个系统之间的桥梁：faction 任务可以是 quest 的 objective（`type: 'custom'` + 自定义 completion check）。

### Decision 6: 任务状态持久化

**选择**: 任务状态存储在 `GameState.questState` 中：

```typescript
interface QuestState {
  activeQuests: Record<string, ActiveQuest>;
  completedQuests: string[];
  claimedRewards: string[];
  stageHistory: Record<string, string[]>;  // questId → 已完成的 stageId 列表
}

interface ActiveQuest {
  questId: string;
  currentStageId: string;
  objectives: Record<string, number>;  // objective type → 当前进度
  startedAt: number;
}
```

**理由**: 扁平结构便于序列化到存档。`stageHistory` 追踪玩家在任务中的分支选择，用于后续剧情引用。

## Risks / Trade-offs

- **[风险] 任务与 faction 系统功能重叠**: 两者都支持日常任务，可能导致困惑。通过明确分工（剧情 vs 重复）和文档说明解决。
- **[风险] NPC 对话自动注入可能导致对话结构意外**: 注入的任务选项可能与 Mod 作者手写的选项冲突。通过任务选项使用 `[任务]` / `[提交]` 前缀区分。
- **[取舍] 第一阶段不做任务 UI**: 任务数据结构和逻辑先行，UI 延后。玩家通过 NPC 对话查看和接取任务，任务进度通过 message 通知。

## Migration Plan

1. **Phase 0 — 类型层**: 新增 Quest 相关类型到 `core/types/`
2. **Phase 1 — Mod 数据层**: 创建示例任务 JSON，扩展 ModContentType
3. **Phase 2 — 注册中心**: QuestRegistry 注册中心
4. **Phase 3 — 任务引擎**: 任务状态管理、进度追踪、前置条件校验
5. **Phase 4 — NPC 集成**: 对话引擎注入任务选项
6. **Phase 5 — 奖励发放**: 经验/灵石/物品/态度变化等多类型奖励
7. **Phase 6 — API**: 任务查询 API
