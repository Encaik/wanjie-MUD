## Why

当前机缘系统（`modules/exploration/`）是游戏中玩家获取资源的主要途径——灵石消耗完后必须通过机缘来补充。但现有系统存在严重问题：

- **无策略选择**：网格全亮，玩家只需朝 Boss 走过去，每一步都是无脑操作
- **无风险/收益权衡**：所有路线等价，没有"深入还是撤退"的决策
- **无差异化体验**：5 个固定难度只是数值变化，体验一模一样
- **代码极度臃肿**：`adventure.ts` 1288 行，`useAdventure.ts` 2191 行，远超项目约束限制
- **不可扩展**：新节点类型、新地形、Mod 事件注入都没有入口

玩家反馈"用完货币后没动力玩下去"的根源就是机缘系统不具备可玩性，资源获取过程枯燥乏味。

## What Changes

- **新建 `modules/fortune/` 模块**：完整实现全新机缘系统，替代旧有 `modules/exploration/` 的机缘部分
- **地形策略层**：7 种地形（平地/密林/洞窟/山崖/毒沼/灵泉/遗迹），不同地形影响移动消耗、视野、节点出现概率
- **视野系统（望气术）**：受悟性+灵识属性驱动，4 级视野范围，地形会增减视野距离
- **深度楼层推进**：多层机缘（3-5 层可变），每层网格增大（5×5 → 13×13），奖励倍率递进，通关后选择撤退/继续
- **5 种机缘主题**：灵矿脉（灵石侧重）、古战场（碎片侧重）、药谷（丹药侧重）、秘境（稀有度+1）、魔渊（高传说概率但高惩罚）
- **15 种节点类型**：敌/精英/小Boss/守卫 + 宝箱/矿脉/药草/残卷 + 事件/游商/祭坛/试炼碑 + 传送阵/陷阱/迷雾
- **Mod 事件注入**：利用 Mod 系统已有的 `'opportunities'` 内容类型，事件可通过 Mod 注册
- **删除旧代码**：完全移除 `modules/exploration/` 中机缘相关文件，无向后兼容

## Capabilities

### New Capabilities
- `fortune-module`: 新的 `modules/fortune/` 模块，包含完整的地图生成、地形系统、视野系统、深度管理、奖励计算、事件引擎
- `fortune-terrain`: 7 种地形类型配置及效果计算
- `fortune-vision`: 4 级望气术视野计算及感应提示
- `fortune-depth`: 多层机缘推进与撤退机制
- `fortune-themes`: 5 种机缘主题配置及奖励侧重
- `fortune-events`: 事件引擎 + Mod 事件注册系统

### Modified Capabilities
- `exploration-module`: 移除机缘相关代码，保留通用探索功能（迷雾、路径提示等）
- `game-state`: 移除 `adventureGrid/adventurePosition/adventureConfig/adventurePhase/adventureLoot/adventureExperience` 等旧字段，替换为 `fortuneSlice`

## Impact

- **新增 `modules/fortune/`** — 约 20 个新文件
- **删除旧文件 9+ 个** — `adventure.ts`(1288行)、`useAdventure.ts`(2191行)、`rewardSystem.ts`、`opportunityConfig.ts`、`adventureStamina.ts`、`fogOfWar.ts` 等
- **重写页面** — `AdventurePage.tsx` → `FortunePage.tsx`，接入新 fortune 模块
- **GameState 结构变更** — 移除 adventure 字段簇，添加 fortuneSlice
- **modules/exploration/ 精简** — 保留通用探索工具，移除机缘专属代码
- **modules/README.md 更新** — 添加 fortune/ 条目
- **旧 migration 路径清理** — 移除 `@ts-nocheck` 和 `TODO: 统一物品系统迁移` 标记的相关旧代码
