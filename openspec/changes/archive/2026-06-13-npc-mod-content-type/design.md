## Context

当前项目已有完整的玩家角色数据模型（`character-seed-system`）：`attributes: Record<string, number>` + `coreStats: Record<CoreStatKey, number>` + `raceId` + `talentIds[]`。种族（`race-mod-content-type`）和天赋（`talent-mod-content-type`）已作为独立 Mod 内容类型。对话检定系统（`crpg-dialogue-checks`）已定义 d20 检定接口。

NPC 系统需要在此基础上新增：态度值、阵营归属、对话行库、AI 对话支持。NPC 的战斗能力完全由 attributes → coreStats 计算管道产生（与玩家一致），但 NPC 的属性值由 Mod JSON 静态定义（不像玩家由种族+天赋+分配点动态生成）。

命名约定：NPC = 非玩家角色（可战斗/可对话），Attitude = 态度值（NPC 对玩家），Faction = 阵营/势力归属。

## Goals / Non-Goals

**Goals:**
- NPC 作为独立 Mod 内容类型，可通过 JSON 文件加载和扩展
- NPC 复用玩家角色的战斗数据模型（attributes、coreStats、race、talents），确保战斗计算统一
- 态度值系统：-100（敌视）到 +100（崇拜），影响对话、交易价格、战斗行为
- 阵营系统：NPC 可归属阵营，阵营关系影响态度值的初始值和变化速率
- 交易系统：NPC 可选作为商人，商品价格受态度折扣影响，支持库存和补货机制
- 对话选项分支系统：对话树结构，每个对话行包含 NPC 文本 + 玩家选项列表。选项支持三层把关（态度门槛 → 核心值门槛 → CRPG d20 检定），核心值不达标时选项灰掉并显示提示
- AI 对话扩展点：NPC 可标记支持 AI 对话（`supportsAIDialogue`），预留未来接入

**Non-Goals:**
- 不在此变更中实现完整的 AI 对话生成管线（仅预留标记字段和接口）
- 不在此变更中实现 NPC 的自主行为 AI（如 NPC 自行移动、自行决策）
- 不在此变更中实现跨 NPC 的复杂社交网络（仅通过阵营关联）
- 不在此变更中实现 NPC 动态生成（NPC 由 Mod JSON 静态定义，不由 seed 随机生成）

## Decisions

### Decision 1: NPC 复用玩家角色的战斗数据模型

**选择**: NPC 的数据模型中直接包含 `attributes: Record<string, number>` 和 `coreStats: Record<CoreStatKey, number>`，可选包含 `raceId` 和 `talentIds`。

```typescript
interface NPCDefinition {
  id: string;                          // 全局唯一标识
  name: string;                        // 显示名
  description: string;                 // 描述文本
  worldviewRestrictions?: string[];    // 限制出现的世界观
  factionId?: string;                  // 所属阵营 ID
  
  // 战斗相关（复用角色模型）
  attributes: Record<string, number>;
  coreStats: Record<CoreStatKey, number>;
  raceId?: string;
  talentIds?: string[];
  
  // NPC 专属字段
  attitude: NPCAttitudeConfig;         // 态度配置
  dialogueLines: Record<string, NPCDialogueLine>;  // 对话行库
  shopItems?: NPCShopItem[];           // 交易物品（空或 undefined = 非商人）
  supportsAIDialogue: boolean;         // 是否支持 AI 对话
  combatBehavior: NPCCombatBehavior;   // 战斗行为配置
}
```

**替代方案**: NPC 只存 `characterSeed` 引用，从 characters 表查询战斗数据。但 NPC 不一定有对应的 characterSeed（NPC 由 Mod 定义而非玩家创建），且会增加 DB 查询开销。

**理由**: NPC 直接包含战斗字段使其成为自包含的 Mod 数据单元。Mod 作者可以为 NPC 精确设定属性值（而非依赖随机生成），实现角色设计意图。

### Decision 2: 态度值为 -100 到 +100 连续值

**选择**: 使用整数区间 `[-100, 100]`，划分为 7 个态度等级：

| 区间 | 等级 | 标签 | 行为影响 |
|------|------|------|----------|
| 81 ~ 100 | 崇拜 | Adoration | 折扣交易、透露隐藏信息、协助战斗 |
| 51 ~ 80 | 友好 | Friendly | 正常交易、愿意对话 |
| 21 ~ 50 | 善意 | Amiable | 基本交易 |
| -20 ~ 20 | 中立 | Neutral | 默认态度 |
| -50 ~ -21 | 冷淡 | Cold | 拒绝交易、简短对话 |
| -80 ~ -51 | 敌视 | Hostile | 可能发起战斗 |
| -100 ~ -81 | 仇恨 | Vengeful | 必定战斗、追杀 |

**理由**: 连续值允许态度渐变（而非离散状态机），细粒度的态度变化让玩家行为有累积效应。7 个等级提供足够的游戏性分层。

### Decision 3: 阵营影响态度值的变化规则

**选择**: NPC 所属阵营定义与其他阵营（包括玩家可能的"阵营"）的关系。阵营关系分为 5 级：

```typescript
type FactionRelation = 'allied' | 'friendly' | 'neutral' | 'hostile' | 'atWar';
```

- `allied`: 初始态度 +40，正向变化 ×1.5
- `friendly`: 初始态度 +20
- `neutral`: 初始态度 0
- `hostile`: 初始态度 -30，负向变化 ×1.5
- `atWar`: 初始态度 -60，正向变化 ×0.3（极难改善）

玩家行为对态度值的修正：
- 帮助阵营成员：+5~15（取决于帮助程度）
- 攻击阵营成员：-20~50（取决于伤害程度）
- 完成阵营任务：+10~30

**理由**: 阵营作为态度计算的初始条件和倍率修正，避免每个 NPC 需要单独配置复杂的初始态度逻辑。

### Decision 4: 对话使用选项分支 + 核心值门槛 + CRPG 检定

**选择**: 对话以 `Record<string, NPCDialogueLine>` 形成对话树，每个对话行包含 NPC 说的话和玩家选项列表。选项支持三层把关机制：

```typescript
interface NPCDialogueLine {
  id: string;
  text: string;                      // NPC 说的话
  options: NPCDialogueOption[];      // 玩家可选选项
  repeatable: boolean;
  cooldownSeconds?: number;
  onEnter?: string[];                // 进入时触发的事件
}

interface NPCDialogueOption {
  id: string;
  text: string;                      // 选项文本
  minAttitude?: number;              // ① 态度门槛
  statGates?: StatGate[];            // ② 核心值门槛（灰掉判定）
  check?: DialogueCheck;             // ③ CRPG 检定（d20 投骰）
  resultBranch: string;              // 选中后跳转的对话行 ID
}

interface StatGate {
  coreStat: CoreStatKey;
  minValue: number;
  failureHint: string;               // 不达标提示，如 "需要至少 15 点智力"
}
```

**三层把关机制**:
1. **态度门槛** (`minAttitude`) — 好感度不足时选项直接隐藏或灰掉
2. **核心值门槛** (`statGates[]`) — 角色的核心值不达标时选项灰掉 + 显示提示。支持多重门槛（同时检查多个维度）
3. **CRPG 检定** (`check`) — 前两层通过后，仍需 d20 投骰。成功/失败走不同分支（复用 `crpg-dialogue-checks` 的 `DialogueCheck`）

**理由**: 三层把关将"角色能力"和"玩家选择"结合在一起——核心值门槛体现角色硬实力（智力不够就是看不懂），CRPG 检定体现角色软实力 + 运气成分（属性高更稳但不保证成功），态度门槛体现长期经营成果。选项灰掉时显示 `failureHint` 让玩家明确知道"为什么我不能选这个"，而非困惑。

### Decision 5: NPC 商品使用结构化列表 + 态度折扣

**选择**: 商品以 `NPCShopItem[]` 数组存储，价格由 `basePrice` + 态度折扣公式计算：

```typescript
interface NPCShopItem {
  itemId: string;                 // 物品 ID（引用物品系统）
  basePrice: number;              // 基准价格
  quantity?: number;              // 当前库存（undefined = 无限）
  maxQuantity?: number;           // 最大库存
  restockIntervalSeconds?: number; // 自动补货间隔（undefined = 不补货）
  minAttitude?: number;           // 最低态度要求
}
```

**价格公式**: `actualPrice = basePrice * (1 - attitudeDiscount)`

| 态度等级 | 折扣 | 说明 |
|----------|------|------|
| 崇拜 (81~100) | 40% | 挚友价 |
| 友好 (51~80) | 20% | 友情价 |
| 善意 (21~50) | 5% | 优惠价 |
| 中立 (-20~20) | 0% | 原价 |
| 冷淡以下 (< -20) | 拒绝交易 | — |

**理由**: 态度直接影响交易价格使好感度系统有"变现"渠道——玩家投入资源提升 NPC 好感度后可通过折扣获得回报。`minAttitude` 允许 NPC 将稀有物品锁定在高好感度后开放。库存 + 补货机制为游戏经济提供动态平衡手段，防止玩家无限购买刷资源。

### Decision 6: AI 对话为可选扩展点

**选择**: `supportsAIDialogue: boolean` 标记 + 预留 `aiDialogueConfig` 可选字段：

```typescript
interface NPCAIDialogueConfig {
  enabled: boolean;
  systemPrompt?: string;          // AI 角色设定
  contextTokens?: number;         // 上下文窗口大小
  allowedTopics?: string[];       // 允许的对话主题
  fallbackLines?: string[];       // AI 不可用时的回落对话
}
```

**理由**: 当前不实现 AI 管线，但数据结构预留使未来添加 AI 对话时只需扩展 `aiDialogueConfig`，无需修改 `NPCDefinition` 接口。

### Decision 7: NPC 战斗行为配置

**选择**: NPC 的战斗行为由 `NPCCombatBehavior` 定义：

```typescript
interface NPCCombatBehavior {
  aggressionThreshold: number;     // 态度低于此值可能主动攻击（默认 -50）
  fleeThreshold: number;           // HP 低于此比例时逃跑（0~1，0=不逃跑）
  combatStyle: 'melee' | 'ranged' | 'caster' | 'support';
  skillPriority: string[];         // 技能使用优先级（技能 ID 列表）
}
```

**理由**: 战斗行为配置与战斗计算解耦，Mod 作者可通过 JSON 调整 NPC 的战斗风格。

## Risks / Trade-offs

- **[风险] NPC 属性值需要与世界观属性定义一致**: NPC JSON 中的 `attributes` key 必须存在于目标世界观的 `AttributeDefinition[]` 中。校验器需交叉验证，不匹配的 key 在加载时警告。
- **[风险] 态度值状态持久化**: 态度值是运行时状态，需决定是否持久化到存档。初始设计中态度值从零开始（受阵营修正），存档时保存 `Record<npcId, attitude>` 映射。
- **[取舍] NPC 不动态生成**: NPC 由 Mod JSON 静态定义，不支持 seed 随机生成。这简化了 NPC 管理，但限制了 NPC 的多样性。未来可通过"NPC 模板 + seed 随机化"模式扩展。
- **[取舍] 对话行是静态文本**: 非 AI 对话行的文本在 Mod JSON 中硬编码，不支持运行时变量插值。可在未来扩展模板语法（如 `"你好，{playerName}"`）。

## Migration Plan

1. **Phase 0 — 类型层**: 新增 `NPCDefinition`、`NPCAttitudeConfig`、`NPCDialogueLine`、`NPCFaction`、`NPCCombatBehavior` 类型到 `core/types/`
2. **Phase 1 — Mod 数据层**: 创建 `mods/wanjie-core/data/npcs/` 目录，添加各世界观的示例 NPC JSON
3. **Phase 2 — 注册中心**: 新增 `NPCDataRegistry`，Mod 加载器支持 `npcs` 内容类型
4. **Phase 3 — 态度计算**: 实现态度值计算纯函数（初始值、变化规则、等级判定）
5. **Phase 4 — 对话系统对接**: 对话系统适配 NPC 对话行索引查询
6. **Phase 5 — 战斗对接**: 战斗系统消费 NPC 的 attributes + coreStats + combatBehavior
7. **Phase 6 — API**: 新增 NPC 查询 API 端点

## Open Questions

- **Q1**: 态度值是否需要跨会话持久化？还是每次进入世界时从阵营关系重新计算初始值？
- **Q2**: 玩家是否可以加入 NPC 的阵营？这将影响态度计算的双向性。
- **Q3**: AI 对话的具体提供商（OpenAI / Anthropic / 本地模型）和限流策略？
- **Q4**: NPC 死亡后是否可以复活？对态度值和阵营关系有何影响？
