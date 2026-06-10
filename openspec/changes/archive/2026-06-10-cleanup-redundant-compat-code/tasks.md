## 1. Barrel Re-export 文件删除

- [x] 1.1 全局搜索确认旧路径无外部引用：`grep -r "from '@/shared/lib/world'"`、`grep -r "from '@/shared/lib/registry'"` 等，确保删除安全
- [x] 1.2 更新仍使用 `@/shared/lib/world` 的源文件，改为 `@/core/world`（零引用，无需更新）
- [x] 1.3 更新仍使用 `@/shared/lib/events` 的源文件，改为 `@/core/events`（零引用，无需更新）
- [x] 1.4 更新仍使用 `@/shared/lib/calculation` 的源文件，改为 `@/core/calculation`（零引用，无需更新）
- [x] 1.5 更新仍使用 `@/shared/lib/mod` 的源文件，改为 `@/core/mod`（零引用，无需更新）
- [x] 1.6 更新仍使用 `@/shared/lib/types` 的源文件（13 个），改为直接从 `@/core/types` 或对应模块导入
- [x] 1.7 删除以下 barrel re-export 文件：`shared/lib/world/index.ts`、`shared/lib/registry/index.ts`、`shared/lib/expansionLogic.ts`、`shared/lib/events/index.ts`、`shared/lib/calculation/index.ts`、`shared/lib/mod/index.ts`、`shared/lib/messageDB.ts`、`shared/lib/gameSystems.ts`、`shared/lib/typesExtension.ts`、`shared/lib/types.ts`
- [x] 1.8 更新 `shared/utils/rarityStyles.ts` 的调用方，改为直接从 `@/modules/theme` 导入，然后删除该文件
- [x] 1.9 更新 `shared/components/Header.tsx` 的调用方，改为直接从 `@/views/game` 导入，然后删除该文件
- [x] 1.10 清理 `shared/ui/item-tooltip.tsx` 中的向后兼容重导出（第 11-13 行），确认调用方已从正确路径导入
- [x] 1.11 运行 `pnpm ts-check` 验证阶段一无类型错误

## 2. LegacyStats 类型消除

- [x] 2.1 分析所有 `LegacyStats` 使用场景，确定替换策略：纯 flat stat 字典场景用 `FlatStats`
- [x] 2.2 在 `core/types/types.ts` 中移除 `LegacyStats` 导出，以 `FlatStats` 替代
- [x] 2.3 更新 `core/engine/expansionLogic.ts` 中约 12 处 `LegacyStats` 引用
- [x] 2.4 更新 `core/types/typesExtension.ts` 中约 4 处 `LegacyStats` 引用
- [x] 2.5 更新 `core/calculation/types.ts` 中"兼容旧系统"注释及引用
- [x] 2.6 更新 `modules/combat/` 中的引用（`types.ts`、`skillSystem.ts`、`data/demonData.ts`、`decisionSystem.ts`）
- [x] 2.7 更新 `modules/progression/` 中的引用（`cultivation.ts`、`cultivationStrategy.ts`、`data/cultivationPathData.ts`、`components/`）
- [x] 2.8 更新 `modules/ascension/` 中的引用（`ascensionLogic.ts`、`data/tribulationData.ts`、`data/ascensionData.ts`）
- [x] 2.9 更新 `modules/exploration/` 中的引用（`dungeon/`、`adventure/`）
- [x] 2.10 更新 `modules/equipment/data/equipmentAffixData.ts` 中的引用
- [x] 2.11 更新 `views/game/useGameState.tsx` 和 `views/game/MentalStateCard.tsx` 中的引用
- [x] 2.12 删除 `createCombinedStats` 等仅用于向后兼容的工厂函数
- [x] 2.13 运行 `pnpm ts-check` 验证阶段二无类型错误

## 3. 战斗系统单敌人兼容字段清理

- [x] 3.1 清理 `modules/combat/logic/battle/types.ts` 中 7 个 `@deprecated` 标记和"向后兼容"注释
- [x] 3.2 清理 `modules/combat/logic/battle/decisionSystem.ts` 中"同步更新向后兼容字段"和"向后兼容：检查单敌人"逻辑
- [x] 3.3 清理 `modules/combat/logic/battle/battleController.ts` 中"第一个敌人的属性"和"敌人基础属性"向后兼容逻辑
- [x] 3.4 更新 `modules/combat/components/BattleDialog.tsx` 中"单敌人显示（兼容旧系统）"渲染
- [x] 3.5 清理 `modules/combat/logic/battle/skillSystem.ts` 中"兼容旧接口"注释标记的函数
- [x] 3.6 运行 `pnpm ts-check` 验证阶段三无类型错误

## 4. 杂项兼容代码清理与规则更新

- [x] 4.1 清理 `modules/crafting/logic/fragmentSystem.ts` 中 `LegacyFragmentGroup` → `FragmentGroup` 并清理兼容注释
- [x] 4.2 清理 `modules/faction/hooks/useFaction.ts` 中标记为"兼容旧接口"的注释
- [x] 4.3 清理 `modules/faction/logic/tutorialTaskSystem.ts` 中"兼容旧代码"注释
- [x] 4.4 清理 `modules/identity/data/worldData.ts` 中"仅为向后兼容保留"的注释
- [x] 4.5 清理 `modules/identity/data/worldEffectsData.ts` 中"保留此函数仅为兼容旧代码"的注释
- [x] 4.6 清理 `modules/identity/logic/generators.ts` 中"兼容旧代码"注释
- [x] 4.7 清理 `modules/faction/components/FactionPanel.tsx` 中"废弃属性"及"兼容旧存档"注释
- [x] 4.8 在 `.claude/rules/core.md` 中强化"禁止过渡兼容代码"规则，移除 barrel re-export 豁免
- [x] 4.9 运行 `pnpm ts-check` 验证类型正确
- [x] 4.10 运行 `pnpm build` 确保构建成功
- [x] 4.11 运行 `pnpm test` 确保测试通过（84 passed）
