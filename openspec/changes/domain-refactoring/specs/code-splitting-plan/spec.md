## MODIFIED Requirements

### Requirement: useGameState 拆分方案
`src/hooks/useGameState.tsx` SHALL be refactored through domain extraction rather than in-place splitting. As each domain's state logic is extracted to `modules/<domain>/hooks/`, the remaining `useGameState.tsx` becomes a thin aggregation layer (≤300 lines).

#### Scenario: 域提取后精简
- **WHEN** 所有域 Hook 提取完成
- **THEN** `useGameState.tsx` 仅包含：GameState 组合、Context Provider、localStorage 持久化、消息加载，总行数 ≤300

#### Scenario: 渐进式迁移
- **WHEN** 域⑨ faction 提取完成
- **THEN** `useGameState.tsx` 中移除 faction 相关的内联状态逻辑，改用 `factionReducer`，旧字段标记 `@deprecated`

### Requirement: useAdventure 拆分方案
`src/hooks/adventure/useAdventure.ts`（2242 行）SHALL be migrated into `modules/exploration/hooks/` and split by sub-responsibility.

#### Scenario: 子 Hook 提取
- **WHEN** 创建 `modules/exploration/hooks/`
- **THEN** 拆分出 `useDungeon.ts`（地图生成/移动）、`useAdventureEvents.ts`（事件处理）、`useAdventureRewards.ts`（奖励结算）、`useStamina.ts`（行动力管理），每个 ≤200 行

### Requirement: Component splitting scope
Component splitting SHALL be achieved through domain reorganization rather than in-place decomposition. Components move to `modules/<domain>/components/` and are split as needed during migration.

#### Scenario: 域组件拆分
- **WHEN** 组件文件随域迁移
- **THEN** 超过 300 行的组件在迁移时拆分为子组件，放置在同一域的 `components/` 目录下

### Requirement: 拆分执行与验证
The "test-first → split → verify" flow SHALL be adapted for domain migration: "create skeleton → move logic → move hooks → move components → update references → verify".

#### Scenario: 增量迁移
- **WHEN** 执行每个域的迁移
- **THEN** 每次只迁移一个域，通过 `pnpm ts-check && pnpm lint && pnpm build && pnpm test` 后提交

#### Scenario: 迁移验收
- **WHEN** 所有 15 个域迁移完成
- **THEN** 项目零文件超过规则上限：组件 ≤300 行、Hook ≤200 行、logic ≤500 行、data ≤800 行
