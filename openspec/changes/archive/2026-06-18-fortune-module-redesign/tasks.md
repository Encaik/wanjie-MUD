## Stage 1: 核心骨架（数据+类型+生成器）

### 1.1 模块骨架
- [x] 创建 `modules/fortune/` 目录结构（index.ts, types.ts, state.ts, logic/, hooks/, components/, data/）
- [x] 实现 `types.ts`：FortuneTypeId, TerrainType, NodeType, FortuneNode, FortuneCell, FortuneMap, FortuneSession, FortuneSlice, FortuneEventTemplate 等全部类型
- [x] 实现 `state.ts`：fortuneSlice 初始状态 + reducer（开始/移动/节点处理/撤退/结束）
- [x] 实现 `index.ts` 桶导出
- [x] 验证：`pnpm ts-check` 类型通过

### 1.2 数据配置
- [x] 实现 `data/terrainConfig.ts`：7 种地形的配置表（移动消耗、视野修正、节点概率修正、进入效果）
- [x] 实现 `data/nodeTypeConfig.ts`：15 种节点的配置表（分类、基础奖励、出现条件、最小深度）
- [x] 实现 `data/fortuneTypeConfig.ts`：5 种机缘主题配置（地形分布权重、节点权重、奖励倍率、层数范围、解锁条件）
- [x] 实现 `data/defaultEvents.ts`：默认事件模板池（至少 15 个通用事件，覆盖 common/uncommon/rare/legendary）
- [x] 实现 `data/index.ts` 桶导出
- [x] 验证：`pnpm ts-check` 类型通过

### 1.3 地图生成器
- [x] 实现 `logic/mapGenerator.ts`：
  - `generateFortuneMap(type, depth, playerLevel, seed)` → FortuneMap
  - 区域生长地形生成算法
  - 按权重节点放置
  - 关键节点保证（守卫/出口）
  - 隐藏节点生成（高望气术才可见）
- [x] 实现 `logic/mapGenerator.test.ts`：确定性种子生成测试、地形分布验证、节点数量验证
- [x] 验证：`pnpm test` 测试通过

### 1.4 地形 + 视野系统
- [x] 实现 `logic/terrainSystem.ts`：
  - `getMoveCost(terrain)` → number
  - `resolveTerrainEffect(terrain, session)` → TerrainEffect
  - `getTerrainNodeModifiers(terrain)` → NodeWeightModifiers
- [x] 实现 `logic/visionSystem.ts`：
  - `calculateSenseLevel(悟性, 灵识)` → SenseLevel
  - `getEffectiveVision(senseLevel, terrain)` → number
  - `getVisibleCells(map, position, vision)` → VisibleCell[]
  - `senseDirection(map, position, vision)` → SenseHint[]
- [x] 实现 `logic/terrainSystem.test.ts` + `logic/visionSystem.test.ts`
- [x] 验证：`pnpm test` 测试通过

### 1.5 集成验证
- [x] 验证 Stage 1 所有文件符合大小限制
- [x] 验证所有导出通过桶文件

---

## Stage 2: 交互逻辑（节点+深度+奖励+事件）

### 2.1 节点解析器
- [x] 实现 `logic/nodeResolver.ts`：
  - `resolveNode(node, session, context)` → NodeResult
  - 战斗类节点 → 构建 ManualBattleState 数据（不在此处调用 combat，返回战斗数据给 Hook 层）
  - 资源类节点 → 调用 rewardCalculator 计算直接奖励
  - 交互类节点 → 事件/游商/祭坛/试炼碑 逻辑
  - 特殊类节点 → 传送/陷阱/迷雾 逻辑
- [x] 实现 `logic/nodeResolver.test.ts`
- [x] 验证：`pnpm test` 测试通过

### 2.2 奖励计算器
- [x] 实现 `logic/rewardCalculator.ts`：
  - `calculateNodeReward(nodeType, depth, fortuneType, playerLevel)` → CalculatedReward
  - `calculateFloorBonus(depth, fortuneType)` → FloorBonus
  - `calculateCompletionBonus(depth, fortuneType)` → CompletionBonus
  - 集成物品系统：调用 `modules/item/` 的生成接口
- [x] 实现 `logic/rewardCalculator.test.ts`
- [x] 验证：`pnpm test` 测试通过

### 2.3 深度管理器
- [x] 实现 `logic/depthManager.ts`：
  - `canEnterNextFloor(session)` → boolean
  - `getRetreatResult(session)` → RetreatResult
  - `getContinuePreview(session)` → FloorPreview
  - `calculateDeathPenalty(session, deathDepth)` → DeathPenalty
  - `getCompletionBonus(session)` → CompletionBonus
- [x] 实现 `logic/depthManager.test.ts`
- [x] 验证：`pnpm test` 测试通过

### 2.4 事件引擎
- [x] 实现 `logic/eventEngine.ts`：
  - `FortuneEventRegistry` 类（register/query/unregister）
  - `resolveEventChoice(event, choiceIndex, context)` → EventResult
  - `getDefaultEvents(worldType, fortuneType, depth)` → EventTemplate[]
- [x] 实现 `logic/eventEngine.test.ts`
- [x] 验证：`pnpm test` 测试通过

### 2.5 logic/ 集成
- [x] 实现 `logic/index.ts` 桶导出
- [x] 验证：`pnpm ts-check && pnpm test`

---

## Stage 3: UI 层（Hooks + 组件 + 页面）

### 3.1 Hook
- [x] 实现 `hooks/useFortune.ts`（≤200行）：
  - `useFortuneExplore()` → 管理探索状态、地图渲染数据、视野计算
  - `useFortuneActions()` → moveTo(), interact(), retreat(), continueDeeper()
  - 与 combat 引擎集成：战斗节点 → 设置 activeBattle
- [x] 实现 `hooks/index.ts`
- [x] 验证：`pnpm ts-check`

### 3.2 机缘大厅组件
- [x] 实现 `components/FortuneHub.tsx`（≤300行）：
  - 展示 5 种机缘主题卡片
  - 锁定/解锁状态
  - 点击进入机缘
- [x] 验证：`pnpm ts-check`

### 3.3 地图组件
- [x] 实现 `components/FortuneCell.tsx`（≤200行）：
  - 单格渲染：地形底色 + 节点图标 + 迷雾覆盖
  - 三种状态：hidden / revealed / visited
  - 当前所在格高亮
- [x] 实现 `components/FortuneMapView.tsx`（≤300行）：
  - 网格渲染 + 迷雾层
  - 视野内/外差异化渲染
  - 移动目标选择
  - 当前楼层/体力/收获状态栏
- [x] 验证：`pnpm build`

### 3.4 对话/面板组件
- [x] 实现 `components/FloorTransition.tsx`（≤200行）：
  - 楼层完成弹窗
  - 撤退/继续选择
  - 收获摘要展示
- [x] 实现 `components/FortuneResult.tsx`（≤200行）：
  - 结算面板：物品/灵石/碎片/经验总览
  - 死亡惩罚展示（如适用）
- [x] 验证：`pnpm build`

### 3.5 页面集成
- [x] 创建 `views/game/pages/FortunePage.tsx`：
  - 替换 `AdventurePage.tsx`
  - 阶段切换：hub → exploring → floor_transition → result
  - 集成旧有 `AdventureLootPanel` 或替换为新组件
- [x] 更新 `views/game/navigation/panelRegistry.tsx` 中的机缘面板注册
- [x] 更新 `views/game/dialogs/DialogLayer.tsx` 移除旧机缘相关弹窗
- [x] 实现 `components/index.ts` 桶导出
- [x] 验证：`pnpm build` 通过

---

## Stage 4: 清理与集成

### 4.1 GameState 迁移
- [x] 在 GameState 中添加 `fortuneSlice: FortuneSlice`
- [x] 移除旧字段：`adventureGrid`, `adventurePosition`, `adventureConfig`, `adventurePhase`, `adventureLoot`, `adventureExperience`, `adventureFragments`, `adventureSession`
- [x] 添加 saveMigrator：将旧存档中的 adventure 字段安全丢弃（或转换为 fortune 初始状态）
- [x] 更新所有引用旧 adventure 字段的代码
- [x] 验证：`pnpm ts-check` 零错误

### 4.2 删除旧机缘代码
- [x] 删除 `modules/exploration/logic/adventure/adventure.ts`
- [x] 删除 `modules/exploration/logic/adventure/adventureStamina.ts`
- [x] 删除 `modules/exploration/logic/adventure/adventureBattleNew.ts`
- [x] 删除 `modules/exploration/logic/adventure/adventureBattleIntegration.ts`
- [x] 删除 `modules/exploration/logic/adventure/types.ts`（如仅有机缘内容）
- [x] 删除 `modules/exploration/logic/adventure/fogOfWar.ts`
- [x] 删除 `modules/exploration/data/opportunityConfig.ts`
- [x] 删除 `modules/exploration/data/rewardSystem.ts`
- [x] 删除 `modules/exploration/hooks/useAdventure.ts`
- [x] 删除 `modules/exploration/components/AdventurePanel.tsx`
- [x] 删除 `modules/exploration/components/DifficultySelect.tsx`
- [x] 删除 `views/game/domainHooks/useAdventure.ts`
- [x] 删除 `views/game/pages/AdventurePage.tsx`
- [x] 删除 `views/game/navigation/DifficultySelect.tsx`
- [x] 更新 `modules/exploration/` 的 index.ts（移除机缘相关导出）
- [x] 验证：全局 grep 确认无残留引用

### 4.3 Mod 集成
- [x] 在 Mod 加载流程中集成 `fortuneEventRegistry` — 扫描 `opportunities/` 目录注册事件
- [x] 添加事件模板 JSON Schema 或示例文件
- [x] 验证：加载一个测试 Mod 验证事件注册和查询

### 4.4 文档更新
- [x] 更新 `modules/README.md`：添加 `fortune/` 条目，清理 `exploration/` 机缘相关描述
- [x] 如有必要，更新 `game-design/` 对应章节

### 4.5 最终验证
- [x] `pnpm ts-check` — 零错误
- [x] `pnpm lint:strict` — 零错误 + 文件大小合规
- [x] `pnpm build` — 构建成功
- [x] `pnpm test` — 全部测试通过
- [x] `pnpm dev` — 手动验证机缘入口 → 选择主题 → 探索 → 战斗 → 撤退/继续 → 结算 完整流程
