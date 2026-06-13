# Implementation Tasks

## 1. 类型层 — NPC 核心类型定义

- [x] 1.1 在 `core/types/` 中新增 `NPCDefinition` 接口（id、name、description、worldviewRestrictions、factionId、attributes、coreStats、raceId、talentIds）
- [x] 1.2 新增 `NPCAttitudeConfig` 接口（初始态度值、变化速率、态度等级阈值）
- [x] 1.3 新增 `AttitudeLevel` 枚举/联合类型（adoration / friendly / amiable / neutral / cold / hostile / vengeful）及区间映射
- [x] 1.4 新增 `NPCDialogueLine` 和 `NPCDialogueOption` 接口（对话行 ID → NPC 文本 + 选项列表，选项含 statGates / check / resultBranch）
- [x] 1.5 新增 `StatGate` 接口（coreStat、minValue、failureHint）
- [x] 1.6 新增 `NPCShopItem` 接口（itemId、basePrice、quantity、maxQuantity、restockIntervalSeconds、minAttitude）
- [x] 1.7 新增 `NPCFaction` 类型和 `FactionRelation` 联合类型（allied / friendly / neutral / hostile / atWar）
- [x] 1.8 新增 `NPCCombatBehavior` 接口（aggressionThreshold、fleeThreshold、combatStyle、skillPriority）
- [x] 1.9 新增 `NPCAIDialogueConfig` 接口（enabled、systemPrompt、contextTokens、allowedTopics、fallbackLines）
- [x] 1.10 更新 `core/types/index.ts` 桶导出所有新类型
- [x] 1.11 运行 `pnpm ts-check` 确认新类型定义无误

## 2. Mod 数据层 — NPC JSON 数据

- [x] 2.1 创建 `mods/wanjie-core/data/npcs/` 目录
- [x] 2.2 创建 `cultivation_npcs.json` — 修仙世界观示例 NPC（4 个：坊市商人、宗门师兄、散修、妖兽）
- [x] 2.3 创建 `martial_npcs.json` — 高武世界观示例 NPC（3 个：武馆馆长、杀手、游方郎中）
- [x] 2.4 每个 NPC JSON 包含完整的 attributes、coreStats、attitude、dialogueLines、combatBehavior
- [x] 2.5 扩展 `ModContentType` 类型新增 `'npcs'`
- [x] 2.6 更新 `mods/wanjie-core/mod.json` 的 `contentTypes` 和 `dataFiles` 声明 npcs
- [x] 2.7 NPC 数据采用基础结构检查（与 races/talents 一致的策略，无需 complex schema）
- [x] 2.8 更新 `ModValidator.validateModData()` 处理 npcs 内容类型

## 3. 注册中心 — NPCDataRegistry

- [x] 3.1 创建 `core/registry/NPCDataRegistry.ts` — NPC 数据的注册、查询、按世界观筛选
- [x] 3.2 NPCDataRegistry 支持 `getById(id)`、`getByWorldview(worldviewId)`、`getByFaction(factionId)` 查询
- [x] 3.3 Mod 加载器在加载 npcs 类型数据后注册到 NPCDataRegistry
- [x] 3.4 NPC 数据采用基础结构检查（与其他内容类型一致的策略）

## 4. 态度系统 — 纯函数计算

- [x] 4.1 在 `modules/npc/logic/` 中创建 `attitudeCalculator.ts`
- [x] 4.2 实现 `calculateInitialAttitude(npc, playerFaction?)` — 根据阵营关系计算初始态度值
- [x] 4.3 实现 `calculateAttitudeChange(currentAttitude, action, factionRelation)` — 玩家行为导致的态度变化
- [x] 4.4 实现 `getAttitudeLevel(attitude)` — 态度值 → 态度等级映射
- [x] 4.5 实现 `isHostile(npc, attitude)` — 判断 NPC 是否敌对（基于 aggressionThreshold）
- [x] 4.6 态度值边界保护：变化后 clamp 到 [-100, 100]

## 5. 对话系统 — 选项分支 + 核心值门槛 + CRPG 检定

- [x] 5.1 在 `modules/npc/logic/` 中创建 `dialogueEngine.ts` — 对话选项解析纯函数
- [x] 5.2 实现 `getAvailableDialogueLine(npc, lineId, attitude, coreStats, talents)` — 获取对话行及可用选项
- [x] 5.3 实现 `evaluateOptionGates(option, coreStats)` — 检查所有 `statGates`，返回通过/失败的门槛列表
- [x] 5.4 态度门槛检查：`minAttitude` 不达标时选项隐藏或灰掉
- [x] 5.5 核心值门槛检查：任一 `statGate.minValue` 不达标则选项灰掉 + 显示 `failureHint`
- [x] 5.6 多重门槛合并：多个 `statGates` 同时判定，返回"首个不达标"或"全部通过"
- [x] 5.7 集成 CRPG 检定：选项 `check` 为 `DialogueCheck` 时，调用 `performDialogueCheck()` 执行 d20 投骰（接口已预留）
- [x] 5.8 检定成功后跳转 `check.successBranch`，失败跳转 `check.failureBranch`（由 check 结构定义）
- [x] 5.9 无检定选项：直接跳转 `resultBranch`
- [x] 5.10 对话行冷却和可重复性追踪（接口已预留）
- [x] 5.11 `onEnter` 事件触发：进入对话行时触发关联的游戏事件（接口已预留）

## 6. 交易系统 — 商品价格 + 库存管理

- [x] 6.1 在 `modules/npc/logic/` 中创建 `shopCalculator.ts` — 交易价格计算纯函数
- [x] 6.2 实现 `calculateShopPrice(basePrice, attitude)` — 根据态度等级计算实际售价
- [x] 6.3 实现 `getAvailableShopItems(npc, attitude)` — 根据态度和库存筛选可购买物品
- [x] 6.4 实现 `purchaseItem(npc, itemId, quantity)` — 购买物品并扣减库存
- [x] 6.5 实现 `restockShopItems(npc, currentTime)` — 检查并执行自动补货
- [x] 6.6 态度不足物品的锁定状态判定（基于 `minAttitude`）

## 7. 战斗系统对接

- [ ] 7.1 战斗系统读取 NPC 的 `attributes` + `coreStats` 初始化战斗属性
- [ ] 7.2 战斗系统读取 `combatBehavior` 决定 NPC 的战斗策略
- [ ] 7.3 实现 `shouldNPCAttack(npc, attitude)` — 基于态度值和 aggressionThreshold 判定
- [ ] 7.4 实现 `shouldNPCFlee(npc, currentHpRatio)` — 基于 fleeThreshold 判定

## 8. API 层 — NPC 查询端点

- [ ] 8.1 实现 `GET /api/v1/npcs?worldviewId=X` — 查询某世界观下的所有 NPC
- [ ] 8.2 实现 `GET /api/v1/npcs?factionId=X` — 按阵营筛选 NPC
- [ ] 8.3 实现 `GET /api/v1/npcs/[id]` — 获取单个 NPC 完整数据
- [ ] 8.4 NPC 查询结果包含态度相关信息（当前态度值、态度等级）

## 9. 前端对接

- [ ] 9.1 NPC 对话展示组件 — 根据态度等级渲染对话选项
- [ ] 9.2 NPC 信息卡片 — 展示 NPC 名称、种族、阵营、态度等级
- [ ] 9.3 交易界面 — 展示 NPC 商品列表、价格（含折扣）、库存状态
- [ ] 9.4 态度值变化提示 — 玩家行为后展示态度变化通知

## 10. 测试与验证

- [ ] 10.1 为 `calculateAttitudeChange()` 编写单元测试（覆盖各阵营关系 × 各行为类型）
- [ ] 10.2 为 `evaluateOptionGates()` 编写单元测试（覆盖单/多重门槛、通过/失败、failureHint 显示）
- [ ] 10.3 为 `getAvailableDialogueLine()` 编写单元测试（覆盖态度阈值、核心值门槛灰掉、CRPG检定、冷却、分支跳转）
- [ ] 10.4 为 `calculateShopPrice()` 编写单元测试（覆盖各态度等级的折扣计算）
- [ ] 10.5 为 `getAvailableShopItems()` 编写单元测试（覆盖态度锁定、库存售罄）
- [ ] 10.6 为 NPC 数据校验编写单元测试（缺少必填字段、属性 key 不匹配、shopItems 合法性）
- [ ] 10.7 为战斗行为判定（`shouldNPCAttack`、`shouldNPCFlee`）编写单元测试
- [ ] 10.8 运行 `pnpm ts-check` 确保零类型错误
- [ ] 10.9 运行 `pnpm build` 确保构建成功
