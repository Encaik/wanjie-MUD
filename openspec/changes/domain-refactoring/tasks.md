## 1. 准备工作

- [x] 1.1 验证项目可构建：`pnpm ts-check && pnpm lint && pnpm build && pnpm test`
- [x] 1.2 创建四层顶层目录结构：`views/`、`modules/`、`shared/`（`app/` 已存在）
- [x] 1.3 创建 `shared/` 子目录：`ui/`、`components/`、`lib/`、`utils/`、`config/`、`storage/`
- [x] 1.4 在 `tsconfig.json` 中确认 `@/*` 路径别名已覆盖所有子目录
- [x] 1.5 搬移 `components/ui/` → `shared/ui/`（暂复制，shadcn 源保留在 components/ui/）
- [x] 1.6 搬移 `components/shared/` + `components/layout/` → `shared/components/`（暂复制）
- [ ] 1.7 搬移 `lib/calculation/` → `shared/lib/calculation/`（随模块迁移逐步进行）
- [ ] 1.8 搬移 `lib/game/events/` → `shared/lib/events/`（随模块迁移逐步进行）
- [ ] 1.9 搬移 `lib/game/types.ts` → `shared/lib/types.ts`（收尾阶段统一处理）
- [x] 1.10 搬移 `lib/config/` → `shared/config/`（已搬移 + barrel re-export）
- [ ] 1.11 搬移 `lib/websocket/` → `shared/lib/websocket/`（随模块迁移逐步进行）
- [ ] 1.12 搬移 `lib/multiplayer/` → `shared/lib/multiplayer/`（随模块迁移逐步进行）
- [x] 1.13 搬移 `utils/` → `shared/utils/`（已搬移 + barrel re-export）
- [ ] 1.14 搬移 `storage/` → `shared/storage/`（收尾阶段统一处理）
- [ ] 1.15 删除 `src/types/`（合并到 `shared/lib/types.ts`，收尾阶段处理）
- [x] 1.16 创建 `views/` 子目录：`home/`、`character-select/`、`world-select/`、`backstory/`、`game/`

## 2. Tier 0 — 模块⑮ narrative（叙事文案）

- [x] 2.1 创建 `modules/narrative/` 骨架（types.ts, index.ts）
- [x] 2.2 搬移 `lib/text/core/` → `modules/narrative/logic/`
- [x] 2.3 搬移 `lib/text/WorldTextManager.ts` → `modules/narrative/logic/`
- [x] 2.4 搬移 `lib/text/worlds/*` (8 files) → `modules/narrative/data/worlds/`
- [x] 2.5 搬移 `lib/text/index.ts` → 合并到 `modules/narrative/index.ts`
- [x] 2.6 搬移 `lib/game/utils/terminology.ts` → `modules/narrative/logic/`
- [x] 2.7 搬移 `lib/data/terminology.ts` → `modules/narrative/data/`
- [x] 2.8 更新所有 import 路径为 `@/modules/narrative`，验证构建

## 3. Tier 0 — 模块① identity（身份创建）

- [x] 3.1 创建 `modules/identity/` 骨架（types.ts, state.ts, index.ts）
- [x] 3.2 搬移 `lib/game/utils/characterEvaluation.ts` → `modules/identity/logic/`
- [x] 3.3 搬移 `lib/game/utils/traits.ts` → `modules/identity/logic/`
- [x] 3.4 搬移角色/世界生成代码从 `lib/game/utils/generators.ts` → `modules/identity/logic/`
- [x] 3.5 搬移 `lib/game/worlds/*` → `modules/identity/logic/worlds/`
- [x] 3.6 搬移 `lib/data/traits.ts` → `modules/identity/data/`
- [x] 3.7 搬移 `lib/data/worldData.ts` → `modules/identity/data/`
- [x] 3.8 搬移 `lib/data/worldEffectsData.ts` + `worldEffectsUtils.ts` → `modules/identity/data/`
- [x] 3.9 搬移 `lib/data/worldSystem.ts` → `modules/identity/data/`
- [x] 3.10 搬移 `components/pages/character-select/*` → `views/character-select/`
- [x] 3.11 搬移 `components/pages/world-select/*` → `views/world-select/`
- [x] 3.12 搬移 `components/pages/backstory/*` → `views/backstory/`
- [x] 3.13 搬移 `components/pages/home/*` → `views/home/`
- [x] 3.14 更新所有 import 路径为 `@/modules/identity`，验证构建

## 4. Tier 1 — 模块⑭ social（社交公告）

- [ ] 4.1 创建 `modules/social/` 骨架（types.ts, state.ts, index.ts）
- [ ] 4.2 搬移 `lib/game/announcement/*` → `modules/social/logic/announcement/`
- [ ] 4.3 搬移 `lib/game/utils/messageDB.ts` → `modules/social/logic/`
- [ ] 4.4 搬移 `lib/multiplayer/` 逻辑部分 → `modules/social/logic/multiplayer/`
- [ ] 4.5 搬移 `components/game/announcement/*` → `modules/social/components/`
- [ ] 4.6 搬移 `components/game/leaderboard/*` → `modules/social/components/`
- [ ] 4.7 搬移 `components/game/shared/ChatRoom.tsx` → `modules/social/components/`
- [ ] 4.8 将消息记录从 GameState 迁移至 `SocialSlice`
- [ ] 4.9 更新所有 import 路径为 `@/modules/social`，验证构建

## 5. Tier 1 — 模块⑨ faction（势力门派）

- [ ] 5.1 创建 `modules/faction/` 骨架（types.ts, state.ts, events.ts, index.ts）
- [ ] 5.2 搬移 `lib/game/faction/factionQuests.ts` → `modules/faction/logic/`
- [ ] 5.3 搬移 `lib/game/taskSystem/factionTaskSystem.ts` → `modules/faction/logic/`
- [ ] 5.4 搬移 `lib/game/taskSystem/factionTaskSystemNew.ts` → `modules/faction/logic/`
- [ ] 5.5 搬移 `lib/data/factionData.ts` → `modules/faction/data/`；超 800 行则按世界类型拆分
- [ ] 5.6 搬移 `lib/data/factionProgressData.ts` → `modules/faction/data/`
- [ ] 5.7 搬移 `hooks/faction/useFaction.ts` → `modules/faction/hooks/`；拆分为 ≤200 行
- [ ] 5.8 搬移 `components/game/tabs/FactionPanel.tsx` → `modules/faction/components/`
- [ ] 5.9 将 factionProgress 从 GameState 迁移至 `FactionSlice`
- [ ] 5.10 更新所有 import 路径为 `@/modules/faction`，验证构建

## 6. Tier 2 — 模块⑩ tower（试炼爬塔）

- [ ] 6.1 创建 `modules/tower/` 骨架（types.ts, state.ts, index.ts）
- [ ] 6.2 搬移 `lib/game/tower/*` → `modules/tower/logic/`
- [ ] 6.3 搬移 `components/game/tabs/TowerPanel.tsx` → `modules/tower/components/`
- [ ] 6.4 将 towerState 从 GameState 迁移至 `TowerSlice`
- [ ] 6.5 更新所有 import 路径为 `@/modules/tower`，验证构建

## 7. Tier 2 — 模块⑬ time（时间系统）

- [ ] 7.1 创建 `modules/time/` 骨架（types.ts, state.ts, index.ts）
- [ ] 7.2 搬移 `lib/game/time/*` → `modules/time/logic/`
- [ ] 7.3 搬移 `lib/game/tower/idleSystem.ts` → `modules/time/logic/`
- [ ] 7.4 搬移 `components/game/dialogs/OfflineRewardDialog.tsx` → `modules/time/components/`
- [ ] 7.5 将 timeSystem + offlineResult 从 GameState 迁移至 `TimeSlice`
- [ ] 7.6 更新所有 import 路径为 `@/modules/time`，验证构建

## 8. Tier 2 — 模块⑪ collection（收集成就）

- [ ] 8.1 创建 `modules/collection/` 骨架（types.ts, state.ts, events.ts, index.ts）
- [ ] 8.2 搬移 `lib/game/achievement/*` → `modules/collection/logic/`
- [ ] 8.3 搬移 `lib/game/statistics/*` → `modules/collection/logic/`
- [ ] 8.4 搬移 `lib/game/utils/collectionSystem.ts` → `modules/collection/logic/`
- [ ] 8.5 搬移 `lib/data/achievementData.ts` → `modules/collection/data/`
- [ ] 8.6 搬移 `lib/data/bondData.ts` → `modules/collection/data/`
- [ ] 8.7 搬移 `components/game/tabs/AchievementPanel.tsx` → `modules/collection/components/`
- [ ] 8.8 搬移 `components/game/tabs/CollectionPanel.tsx` → `modules/collection/components/`
- [ ] 8.9 搬移 `components/game/tabs/StatisticsPanel.tsx` → `modules/collection/components/`
- [ ] 8.10 将 statistics + achievements 从 GameState 迁移至 `CollectionSlice`
- [ ] 8.11 更新所有 import 路径为 `@/modules/collection`，验证构建

## 9. Tier 3 — 模块⑧ crafting（炼制系统）

- [ ] 9.1 创建 `modules/crafting/` 骨架（types.ts, state.ts, index.ts）
- [ ] 9.2 搬移 `lib/data/alchemyRecipes.ts` → `modules/crafting/data/`
- [ ] 9.3 搬移 `lib/data/forgeRecipes.ts` → `modules/crafting/data/`
- [ ] 9.4 搬移合成逻辑从 `lib/game/utils/fragmentSystem.ts` → `modules/crafting/logic/`
- [ ] 9.5 搬移 `hooks/crafting/*` → `modules/crafting/hooks/`
- [ ] 9.6 搬移 `components/game/tabs/AlchemyPanel.tsx` → `modules/crafting/components/`
- [ ] 9.7 搬移 `components/game/tabs/ForgePanel.tsx` → `modules/crafting/components/`
- [ ] 9.8 将 crafting + forging 从 GameState 迁移至 `CraftingSlice`
- [ ] 9.9 更新所有 import 路径为 `@/modules/crafting`，验证构建

## 10. Tier 3 — 模块⑦ techniques（功法系统）

- [ ] 10.1 创建 `modules/techniques/` 骨架（types.ts, state.ts, index.ts）
- [ ] 10.2 搬移 `lib/game/skill/*`（功法相关） → `modules/techniques/logic/`
- [ ] 10.3 搬移 `lib/game/utils/technique.ts` → `modules/techniques/logic/`
- [ ] 10.4 搬移 `lib/data/techniqueConfigs.ts` → `modules/techniques/data/`
- [ ] 10.5 搬移 `lib/data/techniqueBondData.ts` → `modules/techniques/data/`
- [ ] 10.6 搬移 `lib/data/techniques.ts` + `skillConfigs.ts` → `modules/techniques/data/`
- [ ] 10.7 搬移 `components/game/tabs/TechniquePanel.tsx` → `modules/techniques/components/`
- [ ] 10.8 将 techniques 相关字段从 Protagonist 迁移至 `TechniqueSlice`
- [ ] 10.9 更新所有 import 路径为 `@/modules/techniques`，验证构建

## 11. Tier 3 — 模块⑫ ascension（飞升系统）

- [ ] 11.1 创建 `modules/ascension/` 骨架（types.ts, state.ts, index.ts）
- [ ] 11.2 搬移 `lib/game/ascension/*` → `modules/ascension/logic/`
- [ ] 11.3 搬移 `lib/data/ascensionData.ts` → `modules/ascension/data/`
- [ ] 11.4 搬移 `lib/data/tribulationData.ts` → `modules/ascension/data/`
- [ ] 11.5 搬移 `hooks/ascension/useAscension.ts` → `modules/ascension/hooks/`
- [ ] 11.6 搬移 `contexts/AscensionContext.tsx` → `modules/ascension/components/`
- [ ] 11.7 将 ascensionFlow 从 GameState 迁移至 `AscensionSlice`
- [ ] 11.8 更新所有 import 路径为 `@/modules/ascension`，验证构建

## 12. Tier 4 — 模块⑥ equipment（装备物品）

- [ ] 12.1 创建 `modules/equipment/` 骨架（types.ts, state.ts, events.ts, index.ts）
- [ ] 12.2 搬移 `lib/game/utils/equipment.ts` → `modules/equipment/logic/`
- [ ] 12.3 搬移 `lib/game/utils/items.ts` → `modules/equipment/logic/`
- [ ] 12.4 搬移 `lib/game/utils/slotUtils.ts` → `modules/equipment/logic/`
- [ ] 12.5 搬移 `lib/game/utils/rarityUtils.ts` + `quality.ts` → `modules/equipment/logic/`
- [ ] 12.6 搬移 `lib/game/utils/upgradeSystem.ts` → `modules/equipment/logic/`
- [ ] 12.7 搬移碎片管理逻辑从 `lib/game/utils/fragmentSystem.ts` → `modules/equipment/logic/`
- [ ] 12.8 搬移 `lib/data/equipment.ts` + `equipmentAffixData.ts` → `modules/equipment/data/`
- [ ] 12.9 搬移 `lib/data/weaponConfigs.ts` + `raritySystem.ts` → `modules/equipment/data/`
- [ ] 12.10 搬移 `hooks/equipment/*` + `hooks/utils/inventoryUtils.ts` → `modules/equipment/hooks/`
- [ ] 12.11 搬移 `components/game/tabs/EquipmentPanel.tsx` → `modules/equipment/components/`
- [ ] 12.12 将 inventory + equipment slots 从 GameState 迁移至 `EquipmentSlice`
- [ ] 12.13 更新所有 import 路径为 `@/modules/equipment`，验证构建

## 13. Tier 4 — 模块⑤ economy（经济商店）

- [ ] 13.1 创建 `modules/economy/` 骨架（types.ts, state.ts, index.ts）
- [ ] 13.2 搬移 `lib/game/shop/*` → `modules/economy/logic/shop/`
- [ ] 13.3 搬移 `lib/game/economy/*` → `modules/economy/logic/economy/`
- [ ] 13.4 搬移 `components/game/shop/*` → `modules/economy/components/`
- [ ] 13.5 将 currencies + shopState 从 GameState 迁移至 `EconomySlice`
- [ ] 13.6 更新所有 import 路径为 `@/modules/economy`，验证构建

## 14. Tier 5 — 模块② progression（成长修炼）

- [ ] 14.1 创建 `modules/progression/` 骨架（types.ts, state.ts, events.ts, index.ts）
- [ ] 14.2 搬移 `lib/game/cultivation/*` → `modules/progression/logic/`
- [ ] 14.3 搬移 `lib/game/utils/realmSystem.ts` → `modules/progression/logic/`
- [ ] 14.4 搬移 `lib/game/utils/experienceSystem.ts` → `modules/progression/logic/`
- [ ] 14.5 搬移修炼相关平衡配置从 `lib/game/utils/balanceConfig.ts` → `modules/progression/logic/`
- [ ] 14.6 搬移 `lib/data/realmData.ts` + `realmCore.ts` → `modules/progression/data/`
- [ ] 14.7 搬移 `lib/data/cultivationPathData.ts` → `modules/progression/data/`
- [ ] 14.8 搬移 `hooks/cultivation/useCultivation.ts` → `modules/progression/hooks/`；拆分为 ≤200 行
- [ ] 14.9 搬移 `hooks/cultivation/useSeclusion.ts` → `modules/progression/hooks/`
- [ ] 14.10 搬移 `components/game/tabs/CultivationPanel.tsx` → `modules/progression/components/`
- [ ] 14.11 搬移 `components/game/tabs/SeclusionPanel.tsx` → `modules/progression/components/`
- [ ] 14.12 搬移 `components/game/tabs/CultivationPathSelect.tsx` → `modules/progression/components/`
- [ ] 14.13 将 stats + level + realm + exp 从 Protagonist 迁移至 `ProgressionSlice`
- [ ] 14.14 更新所有 import 路径为 `@/modules/progression`，验证构建

## 15. Tier 5 — 模块④ combat（战斗系统）

- [ ] 15.1 创建 `modules/combat/` 骨架（types.ts, state.ts, events.ts, index.ts）
- [ ] 15.2 搬移 `lib/game/battle/*` → `modules/combat/logic/battle/`
- [ ] 15.3 搬移 `lib/game/combat/*` → `modules/combat/logic/engine/`
- [ ] 15.4 搬移 `lib/game/enemy/*` → `modules/combat/logic/enemy/`
- [ ] 15.5 搬移 `lib/game/utils/restraintSystem.ts` → `modules/combat/logic/`
- [ ] 15.6 搬移 `lib/game/utils/combatPower.ts` → `modules/combat/logic/`
- [ ] 15.7 搬移 `lib/game/stats/calculator.ts` → `modules/combat/logic/`
- [ ] 15.8 搬移 `lib/data/enemies.ts` + `demonData.ts` → `modules/combat/data/`
- [ ] 15.9 搬移 `hooks/combat/useBattle.ts` → `modules/combat/hooks/`
- [ ] 15.10 搬移 `components/game/battle/*` → `modules/combat/components/battle/`
- [ ] 15.11 搬移 `components/game/BattlePanel.tsx` → `modules/combat/components/`
- [ ] 15.12 将 battleState + activeBattle 从 GameState 迁移至 `CombatSlice`
- [ ] 15.13 更新所有 import 路径为 `@/modules/combat`，验证构建

## 16. Tier 5 — 模块③ exploration（秘境探索）

- [ ] 16.1 创建 `modules/exploration/` 骨架（types.ts, state.ts, events.ts, index.ts）
- [ ] 16.2 搬移 `lib/game/adventure/*` → `modules/exploration/logic/adventure/`
- [ ] 16.3 搬移 `lib/game/dungeon/*` → `modules/exploration/logic/dungeon/`
- [ ] 16.4 搬移 `lib/game/events/*` → `modules/exploration/logic/events/`
- [ ] 16.5 搬移 `lib/game/utils/adventureDifficulties.ts` → `modules/exploration/logic/`
- [ ] 16.6 搬移 `lib/data/events.ts` + `eventChains.ts` → `modules/exploration/data/`
- [ ] 16.7 搬移 `lib/data/opportunityConfig.ts` + `rewardSystem.ts` → `modules/exploration/data/`
- [ ] 16.8 搬移 `hooks/adventure/useAdventure.ts` → `modules/exploration/hooks/`；拆分为多个 ≤200 行 Hook
- [ ] 16.9 搬移 `components/game/tabs/AdventurePanel.tsx` → `modules/exploration/components/`
- [ ] 16.10 搬移 `components/game/dialogs/DifficultySelect.tsx` → `modules/exploration/components/`
- [ ] 16.11 将 adventure 相关字段从 GameState 迁移至 `ExplorationSlice`
- [ ] 16.12 更新所有 import 路径为 `@/modules/exploration`，验证构建

## 17. 页面层 — views/game/

- [ ] 17.1 将 `useGameState.tsx` 精简版放于 `views/game/useGameState.tsx`（≤300 行，仅组合+持久化）
- [ ] 17.2 将 `components/pages/game/GamePage.tsx` → `views/game/GamePage.tsx`
- [ ] 17.3 GamePage 改为从 `@/modules/<domain>` 引入各模块 Panel 组件
- [ ] 17.4 清理 `components/game/layout/` → 移到 `shared/components/`（GameLayout 等）

## 18. 收尾清理

- [ ] 18.1 删除所有 `@deprecated` 旧字段，精简 GameState
- [ ] 18.2 精简 `shared/lib/types.ts`：移除已迁移到各模块的领域类型，保留核心类型 ≤500 行
- [ ] 18.3 删除 `src/types/game.ts` 中重复定义（已合并到 `shared/lib/types.ts`）
- [ ] 18.4 删除 `src/lib/game/typesExtension.ts`（内容已迁移到各模块）
- [ ] 18.5 清空 `src/lib/game/utils/`（剩余通用工具迁至 `shared/utils/`）
- [ ] 18.6 清理空的旧目录（`src/hooks/`、`src/lib/game/` 子目录、`src/lib/data/`、`src/lib/text/`、`src/components/`、`src/contexts/`）
- [ ] 18.7 迁移 `src/tests/` 到对应模块的 `modules/<domain>/__tests__/`
- [ ] 18.8 运行完整质量门禁：`pnpm lint:strict && pnpm ts-check && pnpm build && pnpm test`
- [ ] 18.9 更新 `AIREADME.md` 和 `CLAUDE.md` 中的四层目录结构和规则
- [ ] 18.10 更新 `doc/architecture/module-map.md` 架构文档

## 19. 验证清单

- [ ] 19.1 `pnpm dev` 开发服务器正常启动
- [ ] 19.2 完整游戏流程：选角 → 选世界 → 背景故事 → 修炼 → 探索 → 战斗 → 商店 → 飞升
- [ ] 19.3 存档/读档功能正常
- [ ] 19.4 离线处理功能正常
- [ ] 19.5 `pnpm build` 静态导出成功
- [ ] 19.6 零文件超过规则上限
- [ ] 19.7 `src/` 顶层只有 4 个目录：`app/`、`pages/`、`modules/`、`shared/`
