## Why

当前 NPC 系统存在三个根本性问题：(1) NPC 没有独立的 Mod 内容类型——NPC 数据散落在世界观 JSON 的 factions 子字段中，无法作为独立 Mod 扩展；(2) NPC 缺乏与玩家角色统一的数据模型——NPC 需要属性、核心值、种族、天赋等战斗相关字段，但当前 NPC 只是纯文本描述；(3) NPC 与玩家的交互缺乏动态性——没有态度/好感度系统，没有阵营关系影响，对话是静态文本无法分支。

此外，角色 Seed 系统（`character-seed-system`）已建立了玩家角色的完整数据模型，NPC 应该复用这套模型而非另起炉灶。

## What Changes

- **新增 NPC Mod 内容类型**：`ModContentType` 新增 `'npcs'`，NPC 数据通过 Mod JSON 文件独立加载
- **NPC 数据模型设计**：NPC 复用玩家角色的核心战斗字段（`attributes`、`coreStats`、`raceId`、`talentIds`），新增 NPC 专属字段（态度系统、阵营、对话行、AI 对话开关）
- **态度（Attitude）系统**：NPC 对玩家的态度值（-100 到 +100），影响对话选项可用性、交易价格、战斗触发概率。态度值受阵营关系和玩家行为影响
- **阵营（Faction）系统**：NPC 所属阵营，用于决定初始态度值计算规则和跨 NPC 态度联动
- **交易（Shop）系统**：NPC 可选作为商人，通过 `shopItems` 字段声明可交易物品，价格受态度折扣影响（最高 -40%），支持库存管理和自动补货
- **对话选项分支系统**：对话树结构——每个对话行 NPC 说一段话，玩家从选项列表中选择。选项支持三层把关：① 态度门槛、② 核心值门槛（不达标时选项灰掉 + 显示提示）、③ CRPG d20 检定（成功/失败走不同分支）。通过 `resultBranch` / `successBranch` / `failureBranch` 跳转形成对话树
- **AI 对话扩展点**：NPC 可标记 `supportsAIDialogue`，为后续接入 AI 对话生成预留接口

## Capabilities

### New Capabilities
- `npc-mod-content-type`: NPC 作为独立 Mod 内容类型，包含完整数据模型、态度系统、阵营系统、对话行系统、AI 对话扩展点

### Modified Capabilities
- `character-seed-system`: NPC 复用玩家角色的 attributes/coreStats/race/talent 数据模型，`characters` 表预留的 `characterType` 参数对接
- `core-systems-foundation`: 新增 `NPCDefinition`、`AttitudeLevel`、`FactionRelation`、`StatGate` 等核心类型
- `crpg-dialogue-checks`: NPC 对话选项集成 `DialogueCheck` 检定系统，d20 投骰决定对话分支走向

## Impact

- **core/types/**: 新增 `NPCDefinition`、`NPCAttitude`、`NPCShopItem`、`NPCDialogueLine`、`NPCFaction` 类型
- **core/registry/**: 新增 `NPCDataRegistry` 注册中心
- **modules/npc/logic/**: 新增 `shopCalculator.ts`（价格折扣计算）、`attitudeCalculator.ts`（态度变化计算）
- **mods/wanjie-core/**: 新增 `data/npcs/` 目录及示例 NPC JSON（含商人 NPC）
- **modules/combat/**: NPC 战斗能力由 attributes + coreStats + talents 决定
- **modules/npc/logic/dialogueEngine.ts**: 对话引擎 — 选项分支解析、核心值门槛判定、CRPG检定集成
- **modules/shop/**: 交易界面对接 NPC 商品数据和价格计算
- **app/api/**: 新增 NPC 查询 API（按世界/阵营/态度筛选）
