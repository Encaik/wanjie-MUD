# code-splitting-plan

## Purpose

TBD — see change project-quality-foundation for full context.

## ADDED Requirements

### Requirement: 大文件识别与优先级排序
项目 SHALL 识别所有超过 500 行的文件，按影响范围和拆分难度排序，输出优先级矩阵。

#### Scenario: 大文件清单
- **WHEN** 执行大文件扫描
- **THEN** 输出所有超过 500 行的文件列表，包含文件名、行数、模块归属、简短功能描述

#### Scenario: 优先级矩阵
- **WHEN** 生成拆分优先级
- **THEN** P0（紧急）：影响核心状态管理的文件（useGameState.tsx 2552行、useAdventure.ts 2240行）；P1（高优先级）：数据大文件（factionData.ts 1704行、expansionLogic.ts 1281行）；P2（中优先级）：其他超过 500 行的组件和工具

### Requirement: useGameState 拆分方案
`src/hooks/useGameState.tsx`（2552 行）SHALL 拆分为不超过 5 个文件，每个不超过 500 行。

#### Scenario: 职责识别
- **WHEN** 分析 useGameState.tsx
- **THEN** 识别出独立的职责域（初始化、消息处理、状态更新、持久化、游戏循环），每个域可独立提取

#### Scenario: 拆分后兼容
- **WHEN** 拆分完成
- **THEN** `useGameState.tsx` 导出保持 API 兼容，所有消费组件无需修改

### Requirement: useAdventure 拆分方案
`src/hooks/adventure/useAdventure.ts`（2240 行）SHALL 拆分为不超过 4 个文件，每个不超过 600 行。

#### Scenario: 子钩子提取
- **WHEN** 分析 useAdventure.ts 中的子逻辑
- **THEN** 提取出地图探索、战斗集成、奖励结算、事件处理四个子 Hook

#### Scenario: 测试覆盖
- **WHEN** 拆分完成
- **THEN** 每个提取的子 Hook 至少有 1 个对应的单元测试文件

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
