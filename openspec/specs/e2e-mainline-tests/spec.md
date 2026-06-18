# e2e-mainline-tests

## Purpose

Playwright 驱动的游戏主线 E2E 测试，覆盖从首页创角到新手引导结束的完整玩家流程。`pnpm dev` 前置运行，无需 mock 任何 API（所有后端 API 均为 Next.js 内置 Route Handler，使用模板/种子确定性生成）。

## Requirements

### Requirement: Playwright 测试基础设施

项目 SHALL 安装 `@playwright/test` 并提供 `test:e2e` 脚本。`playwright.config.ts` SHALL 配置 `baseURL: 'http://localhost:3000'` 和可选的 `webServer` 自动启动 dev server。

#### Scenario: 运行 E2E 测试

- **GIVEN** `pnpm dev` 已在 `localhost:3000` 运行（或 webServer 自动启动）
- **WHEN** 执行 `pnpm test:e2e`
- **THEN** Playwright 在 Chromium 中运行所有测试
- **THEN** 通过/失败结果输出到终端

#### Scenario: 交互式调试

- **WHEN** 执行 `pnpm test:e2e:ui`
- **THEN** Playwright UI 模式启动，可逐步调试

---

### Requirement: S1 — 创角流程 E2E 测试

测试 SHALL 覆盖从首页到进入游戏的完整创角流程。

#### Scenario: 首页 → 世界选择

- **GIVEN** 用户在首页 `/`
- **WHEN** 点击"踏入万界"按钮
- **THEN** 页面跳转到 `/world-select`
- **THEN** 显示世界卡片

#### Scenario: 世界选择 → 角色选择

- **GIVEN** 用户在世界选择页 `/world-select`
- **WHEN** 点击第一个世界卡片
- **THEN** 页面跳转到 `/character-select`
- **THEN** 加载完成后显示 8 个角色模板卡片

#### Scenario: 角色选择 → 背景故事

- **GIVEN** 用户在角色选择页，模板已加载
- **WHEN** 点击第一个角色卡片并确认选择
- **THEN** 页面跳转到 `/backstory?seed=...&worldId=...`
- **THEN** 背景故事文本加载完成

#### Scenario: 背景故事 → 进入游戏

- **GIVEN** 用户在背景故事页，故事文本已显示
- **WHEN** 点击确认按钮
- **THEN** 页面跳转到 `/game/cultivation`
- **THEN** 游戏主界面渲染（Header + 三栏布局 + 修炼面板）

---

### Requirement: S2 — 新手引导全流程 E2E 测试

测试 SHALL 覆盖事件驱动的 5 阶段 9 步骤新手引导。

#### Scenario: 阶段0 — 领取初始物资

- **GIVEN** 玩家已进入游戏，Welcome 弹窗已出现
- **WHEN** 关闭欢迎弹窗，切换到任务面板 `/game/quest`
- **THEN** "新手引导" Tab 显示 step_welcome 已完成
- **WHEN** 点击"领取奖励"
- **THEN** 灵石和丹药到账（可切到背包验证）

#### Scenario: 阶段1 — 使用丹药 + 修炼

- **GIVEN** 阶段0已完成，背包中有聚气丹
- **WHEN** 切换到背包 `/game/backpack`，点击丹药 Tab，hover 聚气丹卡片，点击"使用"
- **THEN** 丹药使用成功（`item:used` 事件触发，step_use_pill 完成）
- **WHEN** 切换到修炼 `/game/cultivation`，点击"修炼"按钮
- **THEN** 修炼执行成功（`cultivation:performed` 事件触发，step_first_cultivation 完成）

#### Scenario: 阶段2 — 机缘探索 + 击杀敌人

- **GIVEN** 阶段1已完成
- **WHEN** 切换到机缘 `/game/adventure`，选择最低难度进入
- **THEN** 进入探索网格（`adventure:entered` 事件触发，step_enter_adventure 完成）
- **WHEN** 开启自动战斗，在网格中移动到遇敌
- **THEN** 战斗弹窗出现，自动战斗解决，敌人被击杀（`combat:enemy_killed` 触发，step_first_kill 完成）

#### Scenario: 阶段3 — 升级到3 + 加入势力

- **GIVEN** 阶段2已完成
- **WHEN** 继续修炼和战斗积累经验，角色等级达到 3
- **THEN** `player:level_up` 事件触发，step_reach_level_3 完成
- **WHEN** 切换到势力 `/game/faction`，选择一个势力加入
- **THEN** `faction:joined` 事件触发，step_join_faction 完成

#### Scenario: 阶段4 — 完成机缘 + 领取成就

- **GIVEN** 阶段3已完成
- **WHEN** 在机缘中击败 Boss（`adventure:completed` 事件触发）
- **THEN** step_complete_adventure 完成
- **WHEN** 切换到成就 `/game/achievement`，点击领取已解锁的成就
- **THEN** `achievement:claimed` 触发，step_claim_achievement 完成
- **THEN** 全部 5 阶段 9 步骤完成，进度 100%
