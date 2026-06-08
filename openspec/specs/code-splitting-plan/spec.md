# code-splitting-plan

## Purpose

TBD — see change project-quality-foundation for full context.

## ADDED Requirements

### Requirement: 大文件识别与优先级排序
项目 SHALL 识别所有超过各自限制的文件（组件 > 300 行，Hook > 200 行，lib 模块 > 500 行），按影响范围和拆分难度排序，输出优先级矩阵。

#### Scenario: 大文件清单
- **WHEN** 执行大文件扫描
- **THEN** 输出所有超过限制的文件列表，包含文件名、行数、模块归属、当前行数和限制行数的比率

#### Scenario: 优先级矩阵
- **WHEN** 生成拆分优先级
- **THEN** P0（紧急）：useGameState.tsx (2553行/200限)、useAdventure.ts (2242行/200限)、useFaction.ts (1070行/200限)；P1（高优先级）：FactionPanel.tsx (1127行/300限)、MainGame.tsx (1005行/300限)、adventure.ts (1286行/500限)、expansionLogic.ts (1281行/500限)；P2（中优先级）：其他超过限制的组件、Hook 和 lib 文件

### Requirement: useGameState 拆分方案
`src/hooks/useGameState.tsx`（2553 行）SHALL 拆分为不超过 8 个文件，每个不超过 400 行，放置于 `src/hooks/game-state/` 目录中。

#### Scenario: 职责识别
- **WHEN** 分析 useGameState.tsx
- **THEN** 识别出类型定义、初始状态、reducer、save/load 操作、player 操作、game 操作、time 操作、Provider 组件等独立职责域

#### Scenario: 拆分后兼容
- **WHEN** 拆分完成
- **THEN** `useGameState` 导出保持 API 兼容，通过 facade re-export 所有消费组件无需修改

### Requirement: useAdventure 拆分方案
`src/hooks/adventure/useAdventure.ts`（2242 行）SHALL 拆分为不超过 6 个文件，每个不超过 400 行。

#### Scenario: 子钩子提取
- **WHEN** 分析 useAdventure.ts 中的子逻辑
- **THEN** 提取出探索、战斗、事件处理、奖励结算、体力管理等子 Hook

#### Scenario: 测试覆盖
- **WHEN** 拆分完成
- **THEN** 每个提取的子 Hook 通过现有测试验证行为不变

### Requirement: factionData 拆分方案
`src/lib/data/factionData.ts`（1704 行）SHALL 按势力类型拆分为独立文件，每个文件不超过 500 行。

#### Scenario: 按世界类型拆分
- **WHEN** 分析 factionData.ts 的数据结构
- **THEN** 按世界类型（修仙、高武、科技、魔幻、异能、仙侠、武侠、末世）拆分为 8 个数据文件

#### Scenario: 统一导出
- **WHEN** 拆分后
- **THEN** 通过 `src/lib/data/factionData/index.ts` 重新聚合导出，保持 API 兼容

### Requirement: 拆分执行与验证
每个文件的拆分 SHALL 遵循 "测试先行 → 拆分 → 验证" 流程，确保回归安全。

#### Scenario: 测试先行
- **WHEN** 拆分某个文件
- **THEN** 先为该文件编写（或补充）单元测试，覆盖核心逻辑路径

#### Scenario: 增量拆分
- **WHEN** 执行拆分
- **THEN** 每次只拆一个文件，通过 `pnpm test && pnpm ts-check && pnpm build` 后提交，确保每次变更可独立回滚

#### Scenario: 拆分验收
- **WHEN** 所有 P0/P1 文件拆分完成
- **THEN** 项目的最大文件行数不超过 800 行

### Requirement: Component splitting scope
The following component files SHALL be split into sub-components within their domain directory, each ≤ 300 lines:

| File | Current Lines | Target |
|------|--------------|--------|
| FactionPanel.tsx | 1127 | Split into 5 sub-components |
| MainGame.tsx | 1005 | Extract TabRouter, DialogManager |
| DeveloperPanel.tsx | 864 | Split by debug feature |
| SkillManagePanel.tsx | 721 | Split by skill operation |
| GamePage.tsx | 614 | Extract game phase handlers |

#### Scenario: Component decomposition verification
- **WHEN** running `pnpm check-sizes`
- **THEN** zero component files in `src/components/` exceed 300 lines (excluding `ui/`)
