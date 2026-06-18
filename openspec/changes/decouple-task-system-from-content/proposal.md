## Why

当前任务系统虽然在类型层面统一了 `QuestDefinition`，但任务系统（显示/追踪/完成/领奖）与任务内容（教程任务、主线任务、势力任务等）仍然深度耦合：

- **任务内容以 TypeScript 源码形式存在**：`data/quests/tutorial.ts`（148 行）、`logic/tutorialGuide.ts`（300+ 行）、`logic/tutorialTasks.ts`（404 行）将教程任务写成 TypeScript 常量，任务就是代码，无法独立于代码修改
- **新旧两套教程并行**：`tutorialTasks.ts`（旧版 7 步线性任务）和 `data/quests/tutorial.ts`（新版 9 步 QuestDefinition）+ `logic/tutorialGuide.ts`（5 阶段引导定义）同时存在，互不兼容但都未被清理
- **没有统一的"任务模板"概念**：内置任务和 Mod 任务使用同一套 `QuestDefinition` 类型，但没有标准化的模板格式来描述"这是一个任务，包含这些阶段、目标、弹窗、奖励"。Mod 的 `quests.json` 和内置的 `.ts` 文件格式不一致
- **任务面板变化依赖任务内容**：每当新增或修改教程步骤，`QuestPanel` 可能需要随之调整（如教程专用的弹窗逻辑、欢迎消息获取）。实际应该是通用面板 + 数据驱动
- **`index.ts` 导出了教程专用函数**：`isNewbie`、`getTutorialWelcomeMessage`、`claimTutorialReward`、`TUTORIAL_GUIDE`、`checkTutorialProgress` 等教程专有函数占据模块公共 API，说明教程仍被视为"特殊系统"而非"通用任务系统的一个内置内容"

**核心理念**：任务系统 = 通用引擎（显示、追踪、完成、领奖），任务内容 = 数据（用模板定义），两者不耦合。新手引导只是内置流程任务里的一个内容包，未来新增其他引导流程（如回归玩家引导）不需要改一行任务系统代码。

## What Changes

- **定义标准任务模板格式 `QuestTemplate`**：一个 JSON/数据驱动的任务定义格式，覆盖所有任务内容字段（阶段、目标、弹窗、奖励、前置条件、故事线关联、板块关联）。内置任务和 Mod 任务共享此模板
- **教程任务迁移为纯数据**：将 `data/quests/tutorial.ts` 的 TypeScript 定义改为 JSON 可序列化的模板数据（留在 `data/` 目录但格式标准化）
- **清理两套旧教程代码**：彻底删除 `logic/tutorialTasks.ts`（旧版 7 步线性任务）和 `logic/tutorialGuide.ts`（5 阶段引导定义 + 硬编码物品定义），其数据内容迁移到标准模板
- **`QuestPanel` 彻底通用化**：移除教程专用逻辑（欢迎消息写死、弹窗类型硬编码），所有任务的弹窗和提示由模板数据驱动
- **`index.ts` 公共 API 净化**：移除所有教程专用导出（`TUTORIAL_GUIDE`、`isNewbie`、`getTutorialWelcomeMessage` 等），只保留通用引擎 API
- **统一加载路径**：内置任务从 `modules/quest/data/` 加载模板，Mod 任务从 `mods/<id>/quests/quests.json` 加载模板，两者通过同一 `registerTemplate()` 接口注册
- **`taskProgressTracker.ts` 重写为通用进度追踪**：不再硬编码教程阶段，改为读取任意任务模板的阶段数据来追踪进度

## Capabilities

### New Capabilities
- `quest-template-format`: 标准任务模板格式（`QuestTemplate`），JSON 可序列化，包含阶段、目标、弹窗、奖励、条件等所有字段
- `quest-template-registry`: 任务模板注册中心，统一管理内置和 Mod 注册的任务模板
- `generic-quest-progress-tracker`: 通用进度追踪器，读取模板数据驱动进度，不硬编码任何任务

### Modified Capabilities
- `quest-system`: 扩展以支持标准模板格式的数据驱动加载
- `quest-panel-redesign`: QuestPanel 彻底通用化，移除所有教程硬编码
- `tutorial-guide`: 教程内容整体迁移为标准模板，不再作为独立系统

### Removed Capabilities
- `legacy-tutorial-tasks`: 删除 `tutorialTasks.ts` 旧版 7 步任务
- `legacy-tutorial-guide`: 删除 `tutorialGuide.ts` 硬编码引导定义

## Impact

- **删除 `modules/quest/logic/tutorialTasks.ts`** — 404 行旧教程代码彻底移除
- **删除 `modules/quest/logic/tutorialGuide.ts`** — 300+ 行硬编码引导定义移除
- **新增 `core/types/questTemplate.ts`** — `QuestTemplate` 类型定义（~80 行）
- **新增 `core/registry/QuestTemplateRegistry.ts`** — 模板注册中心（~100 行）
- **重写 `modules/quest/data/quests/tutorial.ts`** — 改为标准模板格式（~120 行纯数据）
- **重写 `modules/quest/logic/taskProgressTracker.ts`** — 通用化，不硬编码教程阶段
- **修改 `modules/quest/components/QuestPanel.tsx`** — 移除教程专用逻辑
- **修改 `modules/quest/index.ts`** — 删除教程专用导出，新增通用 API
- **修改 `core/mod/`** — Mod 加载器使用 `QuestTemplateRegistry.registerAll()`
- **modules/README.md 更新** — 更新 quest/ 条目描述
