## Why

`src/views/game/` 目录当前有 28 个文件平铺在同一层级。文件之间缺乏清晰的功能分组——布局骨架、面板导航、弹窗管理、设置面板、信息卡片、状态存储全部混在一起。新开发者无法快速识别：

- 哪些文件构成页面骨架？（GameHeader、LeftSidebar…）
- 哪些文件负责面板切换？（PanelNav、PanelContent、WanjiePanel）
- 哪些文件是弹窗？（DialogLayer 到各种 Dialog）
- 哪些文件是可复用信息卡片？（StatusPanel、MentalStateCard…）

## What Changes

按 **UI 区域** 将 28 个平铺文件分入 7 个功能子目录 + 1 个保持不变：

```
src/views/game/
├── index.ts                   # 桶导出
├── GameLayout.tsx             # 页面根布局（入口组件）
│
├── state/                     # 状态基础设施
│   ├── GameStore.tsx
│   ├── initialState.ts
│   └── routeGuard.ts
│
├── layout/                    # 页面布局骨架
│   ├── GameHeader.tsx
│   ├── LeftSidebar.tsx
│   ├── CenterPanel.tsx
│   ├── RightSidebar.tsx
│   └── MobileLayout.tsx
│
├── navigation/                # 面板导航系统
│   ├── PanelNav.tsx
│   ├── PanelContent.tsx
│   ├── DifficultySelect.tsx
│   └── WanjiePanel.tsx
│
├── dialogs/                   # 弹窗系统（基础设施 + 全部弹窗）
│   ├── DialogLayer.tsx
│   ├── useDialogController.ts
│   ├── UpgradePanel.tsx
│   ├── InheritanceSelect.tsx
│   ├── WorldReveal.tsx
│   ├── TribulationDialog.tsx
│   ├── CraftingDialog.tsx
│   ├── OfflineRewardDialog.tsx
│   ├── RankDetailDialog.tsx
│   └── ReputationDetailDialog.tsx
│
├── settings/                  # 设置功能域
│   ├── SettingsPanel.tsx
│   └── ThemeSettingsPanel.tsx
│
├── cards/                     # 信息展示卡片
│   ├── StatusPanel.tsx
│   ├── WorldInfoPanel.tsx
│   ├── MentalStateCard.tsx
│   └── SaveLoadPanel.tsx
│
├── hooks/                     # 通用页面 Hook
│   ├── useGameHooks.ts
│   ├── useAddMessage.ts
│   └── useGameSystems.ts
│
└── domainHooks/               # 领域功能 Hook（已独立，不变）
```

- 每个新子目录添加 `index.ts` 桶文件
- 更新 `views/game/index.ts` 所有导出路径
- 更新所有组件内部的相对导入（同目录用 `./`，跨目录用 `@/views/game/<子目录>/`）
- 更新外部引用：`shared/components/` 中 GameHeader 引用、5 个页面/模块中的 GameStore 引用
- **不修改任何组件内部逻辑**

## Impact

- **受影响文件**: 28 个移动文件 + 7 个新增桶文件 + `views/game/index.ts`（更新导出）+ `shared/components/index.ts`（GameHeader 引用）+ 5 个 GameStore 外部引用点
- **不受影响**: `domainHooks/` 目录、所有 `modules/` 业务代码、所有 `core/` 系统
- **破坏性**: 无——对外导出保持兼容，通过 `views/game/index.ts` 桶文件重新导出
