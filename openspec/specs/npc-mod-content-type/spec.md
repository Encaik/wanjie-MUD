# npc-mod-content-type

## Purpose

NPC 作为独立的 Mod 内容类型，定义非玩家角色的完整数据模型：包含战斗属性（attributes、coreStats、race、talents，复用角色系统）、态度系统（-100 到 +100，影响对话/交易/战斗）、阵营归属、对话选项分支系统（核心值门槛 + CRPG d20 检定）、商品交易系统（态度折扣 + 库存补货）、AI 对话扩展点。

## Requirements

### Requirement: NPC Mod 内容类型注册

`ModContentType` 联合类型 SHALL 新增 `'npcs'`。Mod 清单（`mod.json`）的 `contentTypes` 和 `dataFiles` SHALL 支持声明 `npcs` 类型及其数据文件路径。

#### Scenario: Mod 清单声明 NPC 数据

- **WHEN** 解析 `mod.json` 中 `contentTypes: ["worldview", "npcs"]`
- **AND** `dataFiles: { "npcs": ["data/npcs/cultivation_npcs.json"] }`
- **THEN** Mod 加载器 SHALL 加载并校验这些 NPC 文件
- **AND** SHALL 将它们注册到 `NPCDataRegistry`

### Requirement: NPC 数据模型

每个 NPC SHALL 定义以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 全局唯一标识（kebab-case） |
| `name` | string | ✅ | 中文显示名 |
| `description` | string | ✅ | NPC 描述文本 |
| `worldviewRestrictions` | string[] | 否 | 限制出现的世界观 ID 列表 |
| `factionId` | string | 否 | 所属阵营 ID |
| `attributes` | Record<string, number> | ✅ | 属性值（key 需匹配目标世界观的 attributeDefinitions） |
| `coreStats` | Record<CoreStatKey, number> | ✅ | 核心值（可直接指定，也可由 attributes 计算） |
| `raceId` | string | 否 | 种族 ID（引用 races 注册中心） |
| `talentIds` | string[] | 否 | 天赋 ID 列表（引用 talents 注册中心） |
| `attitude` | NPCAttitudeConfig | ✅ | 态度配置 |
| `dialogueLines` | Record<string, NPCDialogueLine> | ✅ | 对话行库（ID → 对话行，含 NPC 文本 + 玩家选项分支） |
| `supportsAIDialogue` | boolean | ✅ | 是否支持 AI 对话 |
| `combatBehavior` | NPCCombatBehavior | ✅ | 战斗行为配置 |
| `shopItems` | NPCShopItem[] | 否 | 可交易物品列表（空数组或 undefined = 非商人 NPC） |

#### Scenario: 修仙世界 NPC 定义

- **WHEN** 加载一个修仙世界 NPC 的 JSON 数据
- **THEN** `attributes` SHALL 包含该世界观定义的属性 key（如 `体质: 12, 灵根: 15, 悟性: 10`）
- **AND** `coreStats` SHALL 包含全部 11 个核心值维度
- **AND** `raceId` SHALL 引用已注册的种族（如 `"human"` 或 `"demon"`）
- **AND** `talentIds` SHALL 引用已注册的天赋 ID

#### Scenario: NPC 战斗能力由 attributes + coreStats 决定

- **WHEN** NPC 进入战斗
- **THEN** 战斗系统 SHALL 从 NPC 的 `coreStats` 读取 HP/ATK/DEF/SPEED 等战斗数值
- **AND** SHALL 从 `attributes` 读取属性值用于属性检定
- **AND** SHALL 从 `talentIds` 应用天赋修正
- **AND** SHALL 遵循 `NPCCombatBehavior` 定义的战斗策略

#### Scenario: NPC 校验 — 必填字段完整性

- **WHEN** NPC JSON 缺少 `id`、`name`、`attributes`、`coreStats` 中任一必填字段
- **THEN** Mod 校验器 SHALL 返回错误信息
- **AND** 该 NPC SHALL NOT 被注册

#### Scenario: NPC 校验 — 属性 key 合法性

- **WHEN** NPC 的 `attributes` 包含 worldview 的 `attributeDefinitions` 中不存在的 key
- **THEN** Mod 校验器 SHALL 发出警告（允许注册但提示潜在问题）
- **AND** 该未知 key SHALL 在属性→核心值计算时被忽略

### Requirement: 态度值系统（-100 到 +100）

NPC 对玩家的态度值 SHALL 为连续整数区间 `[-100, 100]`，划分为 7 个态度等级。态度值 SHALL 影响对话选项可用性、交易价格、战斗触发概率。

| 区间 | 等级 | 标签 | 行为影响 |
|------|------|------|----------|
| 81 ~ 100 | 崇拜 | Adoration | 折扣交易、透露隐藏信息、协助战斗 |
| 51 ~ 80 | 友好 | Friendly | 正常交易、愿意对话 |
| 21 ~ 50 | 善意 | Amiable | 基本交易 |
| -20 ~ 20 | 中立 | Neutral | 默认态度 |
| -50 ~ -21 | 冷淡 | Cold | 拒绝交易、简短对话 |
| -80 ~ -51 | 敌视 | Hostile | 可能发起战斗 |
| -100 ~ -81 | 仇恨 | Vengeful | 必定战斗、追杀 |

#### Scenario: 态度值决定对话可用性

- **WHEN** NPC 对玩家的态度值为 `-30`（冷淡）
- **AND** 某对话行的 `minAttitude` 为 `20`（需要善意以上）
- **THEN** 该对话行 SHALL NOT 出现在可用对话选项中
- **AND** 仅 `minAttitude <= -30` 的对话行可用

#### Scenario: 态度值决定战斗触发

- **WHEN** NPC 对玩家的态度值低于 `combatBehavior.aggressionThreshold`（默认 -50）
- **THEN** NPC SHALL 在遭遇时主动发起战斗
- **AND** 若态度值 >= -50，NPC SHALL NOT 主动攻击（除非玩家先攻击）

#### Scenario: 态度值边界保护

- **WHEN** 态度值变化导致计算结果 > 100
- **THEN** 态度值 SHALL 被 clamp 为 100
- **WHEN** 态度值变化导致计算结果 < -100
- **THEN** 态度值 SHALL 被 clamp 为 -100
- **AND** 达到边界后 SHALL 可以反向变化（从 100 下降，从 -100 上升）

### Requirement: 阵营关系影响态度值

NPC 可归属阵营（`factionId`）。阵营关系 SHALL 决定 NPC 对玩家的初始态度值，并影响态度值的变化速率。

```typescript
type FactionRelation = 'allied' | 'friendly' | 'neutral' | 'hostile' | 'atWar';
```

| 关系 | 初始态度 | 正向变化倍率 | 负向变化倍率 |
|------|----------|-------------|-------------|
| `allied` | +40 | ×1.5 | ×0.5 |
| `friendly` | +20 | ×1.2 | ×0.8 |
| `neutral` | 0 | ×1.0 | ×1.0 |
| `hostile` | -30 | ×0.5 | ×1.5 |
| `atWar` | -60 | ×0.3 | ×2.0 |

#### Scenario: 同盟阵营 NPC 初始态度

- **WHEN** NPC 所属阵营与玩家阵营关系为 `allied`
- **THEN** NPC 的初始态度值 SHALL 为 +40（友好等级）
- **AND** 玩家的正面行为（如送礼、协助）SHALL 获得 ×1.5 的态度提升

#### Scenario: 交战阵营 NPC 难以改善关系

- **WHEN** NPC 所属阵营与玩家阵营关系为 `atWar`
- **THEN** NPC 的初始态度值 SHALL 为 -60（敌视等级）
- **AND** 玩家的正面行为 SHALL 仅获得 ×0.3 的态度提升（极难改善）

#### Scenario: NPC 无阵营时默认中立

- **WHEN** NPC 没有 `factionId`
- **THEN** 初始态度值 SHALL 为 0（中立）
- **AND** 态度变化 SHALL 使用 ×1.0 的默认倍率

### Requirement: 玩家行为对态度值的影响

玩家对 NPC 或 NPC 所属阵营的行为 SHALL 触发态度值变化。变化量 SHALL 由纯函数 `calculateAttitudeChange(currentAttitude, action, factionRelation)` 计算。

#### Scenario: 帮助阵营成员提升态度

- **WHEN** 玩家完成任务帮助了 NPC 所属阵营的成员
- **THEN** 该阵营所有 NPC 对玩家的态度值 SHALL 提升 5~15（取决于任务重要程度）
- **AND** 变化 SHALL 受阵营关系的正向倍率修正

#### Scenario: 攻击阵营成员降低态度

- **WHEN** 玩家攻击了 NPC 所属阵营的成员
- **THEN** 该阵营所有 NPC 对玩家的态度值 SHALL 降低 20~50（取决于伤害程度）
- **AND** 变化 SHALL 受阵营关系的负向倍率修正

#### Scenario: 直接与 NPC 交互影响态度

- **WHEN** 玩家赠送 NPC 喜欢的物品
- **THEN** NPC 态度值 SHALL 提升 10~20
- **WHEN** 玩家在对话中选择冒犯性选项
- **THEN** NPC 态度值 SHALL 降低 5~15

### Requirement: 对话选项分支系统

NPC 的对话 SHALL 以 `Record<string, NPCDialogueLine>` 存储，按 ID 索引，形成对话树结构。每个对话行包含 NPC 说的话和玩家可选选项列表。选项可设置核心值门槛、CRPG 检定（d20 投骰）、态度门槛，选中后跳转到目标对话行。

```typescript
interface NPCDialogueLine {
  id: string;                          // 行 ID
  text: string;                        // NPC 说的话
  options: NPCDialogueOption[];        // 玩家可选选项列表
  repeatable: boolean;                 // 是否可重复触发
  cooldownSeconds?: number;            // 冷却时间
  onEnter?: string[];                  // 进入此对话行时触发的事件 ID
}

interface NPCDialogueOption {
  id: string;                          // 选项 ID
  text: string;                        // 选项文本
  minAttitude?: number;                // 态度门槛
  /** 核心值门槛 — 任一不达标则选项禁用（灰掉） */
  statGates?: StatGate[];
  /** CRPG 检定 — 达标后仍需 d20 投骰 */
  check?: DialogueCheck;               // 复用 crpg-dialogue-checks 的 DialogueCheck
  resultBranch: string;                // 选中后跳转的对话行 ID
}

interface StatGate {
  coreStat: CoreStatKey;               // 核心值 key
  minValue: number;                    // 最低值
  failureHint: string;                 // 不达标时的灰掉提示，如 "需要至少 15 点智力"
}
```

#### Scenario: 对话选项基本分支

- **WHEN** NPC 对话行定义 3 个选项 `["询问商品", "聊聊天下大势", "告辞离开"]`
- **THEN** 玩家 SHALL 看到 3 个可点击选项
- **AND** 选中任一选项后 SHALL 跳转到 `resultBranch` 指定的对话行
- **AND** `告辞离开` 的 `resultBranch` SHALL 为 `"__exit__"`（结束对话）

#### Scenario: 核心值门槛 — 不达标时选项灰掉

- **WHEN** 某选项设置 `statGates: [{ coreStat: "intelligence", minValue: 15, failureHint: "需要至少 15 点智力才能理解" }]`
- **AND** 玩家当前的 `intelligence` 核心值为 `12`（不达标）
- **THEN** 该选项 SHALL 以灰色禁用状态显示
- **AND** SHALL 展示 `failureHint` 文本作为 tooltip 说明
- **AND** 玩家 SHALL NOT 可选择该选项

#### Scenario: 核心值门槛 — 达标时选项可用

- **WHEN** 某选项设置 `statGates: [{ coreStat: "intelligence", minValue: 15 }]`
- **AND** 玩家当前的 `intelligence` 核心值为 `18`（达标）
- **THEN** 该选项 SHALL 正常可用

#### Scenario: 多重核心值门槛

- **WHEN** 某选项设置 `statGates: [{ coreStat: "willpower", minValue: 12 }, { coreStat: "perception", minValue: 14 }]`
- **AND** 玩家 `willpower: 15` 达标但 `perception: 10` 不达标
- **THEN** 该选项 SHALL 被禁用
- **AND** SHALL 显示第一个不达标门槛的 `failureHint`

#### Scenario: CRPG 检定选项 — d20 投骰

- **WHEN** 某选项设置 `check: { type: "attribute", target: "悟性", difficulty: 12 }`
- **AND** 玩家所有 `statGates` 均达标
- **THEN** 选择该选项时 SHALL 执行 d20 检定
- **AND** 成功时 SHALL 跳转到 `check.successBranch`
- **AND** 失败时 SHALL 跳转到 `check.failureBranch`
- **AND** UI SHALL 展示检定结果（d20 值 + 修正 vs DC）

#### Scenario: 态度门槛 + 核心值门槛 + CRPG 检定组合

- **WHEN** 某选项设置 `minAttitude: 30` + `statGates: [{ coreStat: "perception", minValue: 12 }]` + `check: { ... }`
- **THEN** 必须同时满足态度 ≥ 30 AND 感知 ≥ 12 才能选择
- **AND** 选中后仍需通过 d20 检定才能走成功分支
- **AND** 任一条件不满足则按对应规则禁用或失败

#### Scenario: 无门槛直接选项

- **WHEN** 某选项未设置 `minAttitude`、`statGates`、`check`
- **THEN** 该选项 SHALL 始终可选
- **AND** 选中后 SHALL 直接跳转到 `resultBranch`

#### Scenario: 对话行冷却与可重复性

- **WHEN** 某对话行 `repeatable: false` 已被触发过
- **THEN** 该对话行 SHALL NOT 再次出现在可用列表中
- **AND** 系统 SHALL 在运行时追踪已触发对话行 ID 集合
- **WHEN** 某对话行 `repeatable: true, cooldownSeconds: 300` 刚被触发
- **THEN** 300 秒内该对话行 SHALL NOT 出现在可用列表中
- **AND** 冷却结束后 SHALL 重新变为可用

#### Scenario: 进入对话行触发事件

- **WHEN** 玩家跳转到某对话行，该行的 `onEnter` 包含 `["unlock_quest_01", "attitude_change_npc_+5"]`
- **THEN** 系统 SHALL 触发对应的游戏事件
- **AND** 事件 SHALL 在对话行文本展示前执行

### Requirement: AI 对话扩展点

NPC SHALL 包含 `supportsAIDialogue: boolean` 标记和可选的 `aiDialogueConfig` 字段。当前 SHALL NOT 实现完整 AI 管线，仅预留数据接口。

```typescript
interface NPCAIDialogueConfig {
  enabled: boolean;
  systemPrompt?: string;
  contextTokens?: number;
  allowedTopics?: string[];
  fallbackLines?: string[];
}
```

#### Scenario: 标记支持 AI 对话的 NPC

- **WHEN** NPC 的 `supportsAIDialogue` 为 `true`
- **AND** `aiDialogueConfig.enabled` 为 `true`
- **THEN** 对话 UI SHALL 显示"自由对话"选项（预留按钮，当前可置灰）
- **AND** 对话系统 SHALL 优先使用 AI 生成对话，不可用时回退到 `fallbackLines`

#### Scenario: 不支持 AI 对话的 NPC

- **WHEN** NPC 的 `supportsAIDialogue` 为 `false`
- **THEN** 对话 UI SHALL NOT 显示"自由对话"选项
- **AND** 所有对话 SHALL 来自 `dialogueLines` 静态文本

### Requirement: NPC 商品/交易物品

NPC 可选地作为商人角色，通过 `shopItems: NPCShopItem[]` 字段声明可交易物品列表。`shopItems` 为空数组或 undefined 表示该 NPC 不是商人。

```typescript
interface NPCShopItem {
  itemId: string;                // 物品/道具 ID（引用物品系统）
  basePrice: number;             // 基准价格（货币单位）
  quantity?: number;             // 当前库存（undefined = 无限供应）
  maxQuantity?: number;          // 最大库存（用于自动补货）
  restockIntervalSeconds?: number; // 补货间隔（undefined = 不自动补货）
  minAttitude?: number;          // 最低态度要求（低于此值不售卖）
}
```

#### Scenario: 商人 NPC 拥有交易物品

- **WHEN** NPC 的 `shopItems` 包含 `[{ itemId: "healing_pill", basePrice: 50, quantity: 10 }]`
- **THEN** 玩家与该 NPC 交互时 SHALL 看到"交易"选项
- **AND** 交易界面 SHALL 展示 `healing_pill` 及其价格
- **AND** 购买后 `quantity` SHALL 减 1

#### Scenario: 非商人 NPC 无交易选项

- **WHEN** NPC 的 `shopItems` 为空数组或 undefined
- **THEN** 玩家交互选项 SHALL NOT 包含"交易"

#### Scenario: 态度影响交易价格

- **WHEN** NPC 对玩家态度值为 `+60`（友好）
- **AND** `healing_pill` 的 `basePrice` 为 50
- **THEN** 实际售价 SHALL 为 `basePrice * (1 - 0.2) = 40`（友好折扣 20%）
- **WHEN** NPC 对玩家态度值为 `+90`（崇拜）
- **THEN** 实际售价 SHALL 为 `basePrice * (1 - 0.4) = 30`（崇拜折扣 40%）

#### Scenario: 态度不足时拒绝交易

- **WHEN** NPC 的某物品 `minAttitude` 为 `20`
- **AND** 玩家态度值为 `10`（善意）
- **THEN** 该物品 SHALL 显示为"锁定"状态
- **AND** SHALL 提示"需要好感度达到善意方可购买"
- **AND** 该 NPC 的其他无 `minAttitude` 限制的物品 SHALL 仍可交易

#### Scenario: 售罄物品不可购买

- **WHEN** 某物品的 `quantity` 降为 0
- **THEN** 交易界面 SHALL 显示"已售罄"
- **AND** SHALL NOT 允许玩家购买

#### Scenario: 自动补货

- **WHEN** 某物品 `quantity: 0`、`maxQuantity: 10`、`restockIntervalSeconds: 3600`
- **THEN** 3600 秒后 `quantity` SHALL 恢复为 `maxQuantity`
- **AND** 补货期间该物品 SHALL 始终显示为"售罄"

#### Scenario: 无限供应物品

- **WHEN** NPC 某物品 `quantity` 为 undefined
- **THEN** 该物品 SHALL 可无限购买
- **AND** 交易界面 SHALL NOT 显示库存数量

### Requirement: NPC 战斗行为配置

每个 NPC SHALL 定义 `combatBehavior` 配置，控制 NPC 在战斗中的决策逻辑。

```typescript
interface NPCCombatBehavior {
  aggressionThreshold: number;
  fleeThreshold: number;
  combatStyle: 'melee' | 'ranged' | 'caster' | 'support';
  skillPriority: string[];
}
```

#### Scenario: 敌意阈值决定主动攻击

- **WHEN** NPC 的 `aggressionThreshold` 为 `-30`
- **AND** 玩家态度值为 `-40`（低于阈值）
- **THEN** NPC SHALL 在遭遇时主动发起战斗
- **WHEN** 玩家态度值为 `0`（高于阈值）
- **THEN** NPC SHALL NOT 主动攻击

#### Scenario: 逃跑阈值决定撤退行为

- **WHEN** NPC 的 `fleeThreshold` 为 `0.2`（HP 低于 20% 时逃跑）
- **AND** 战斗中 NPC 当前 HP 降至最大 HP 的 15%
- **THEN** NPC SHALL 尝试逃跑（退出战斗）
- **WHEN** `fleeThreshold` 为 `0`（不逃跑）
- **THEN** NPC SHALL 战斗至 HP 归零

#### Scenario: 战斗风格影响技能选择

- **WHEN** NPC 的 `combatStyle` 为 `"caster"`
- **THEN** 战斗 AI SHALL 优先选择远程/法术类技能
- **AND** `skillPriority` SHALL 定义技能使用的优先顺序

### Requirement: NPCDataRegistry 注册中心

系统 SHALL 提供 `NPCDataRegistry` 单例类（位于 `src/core/registry/NPCDataRegistry.ts`），作为所有 NPC 数据的唯一管理入口。

#### Scenario: 按世界观查询 NPC

- **WHEN** 调用 `NPCDataRegistry.getInstance().getByWorldview('cultivation')`
- **THEN** SHALL 返回所有未设置 `worldviewRestrictions` 或 `worldviewRestrictions` 包含 `'cultivation'` 的 NPC 列表

#### Scenario: 按阵营查询 NPC

- **WHEN** 调用 `NPCDataRegistry.getInstance().getByFaction('righteous_sect')`
- **THEN** SHALL 返回所有 `factionId === 'righteous_sect'` 的 NPC 列表

#### Scenario: 按 ID 查询单个 NPC

- **WHEN** 调用 `NPCDataRegistry.getInstance().getById('merchant_wang')`
- **THEN** SHALL 返回对应的 `NPCDefinition` 对象
- **AND** 若不存在 SHALL 返回 `undefined`
