## Context

万界修行录当前按技术分层组织代码。重构目标是将代码重组为四层结构：

```
src/
├── app/        ← ① 入口：Next.js 路由
├── pages/      ← ② 页面：与功能无关的页面框架
├── modules/    ← ③ 功能模块：15个自包含业务域
└── shared/     ← ④ 公共内容：纯公共逻辑，方便复用
```

详细迁移文件映射见 `doc/design/domain-refactoring-spec.md`。

## Goals / Non-Goals

**Goals:**
- 将代码按四层架构（app / pages / modules / shared）重新组织
- `pages/` 存放所有与路由挂钩的页面组件（home、character-select、world-select、backstory、game），与功能模块解耦
- `modules/` 中每个模块自包含类型、逻辑、状态、组件、数据
- `shared/` 整合所有公共内容：UI 组件、计算引擎、核心类型、事件总线、工具、存储
- 将 `GameState` 从 40+ 扁平字段重组为模块 Slices 聚合
- 利用现有 `GameEventManager` 实现跨模块通信
- 将超限文件拆分至合规大小
- 迁移过程保持向后兼容，每一步可构建、可运行

**Non-Goals:**
- 不修改业务逻辑和游戏行为
- 不引入新功能
- 不修改 `shared/ui/`（原 shadcn 组件）
- 不修改计算引擎、存储、多人、websocket（搬入 `shared/` 但不变内容）
- 不改变构建流程或部署方式

## Decisions

### 1. 四层架构：app / pages / modules / shared

**选择：`src/` 下只保留 4 个顶级目录**

```
src/
├── app/              ← ① 入口：Next.js 路由 (layout.tsx, page.tsx, globals.css)
│
├── pages/            ← ② 页面：与路由挂钩的页面（每个路由一个子目录）
│   ├── home/         ←     首页入口
│   ├── character-select/ ← 选角页
│   ├── world-select/ ←     选世界页
│   ├── backstory/    ←     背景故事页
│   └── game/         ←     主游戏页（GamePage，组合所有模块面板）
│
├── modules/          ← ③ 功能模块：15个业务域（自包含）
│   ├── narrative/    ← ⑮
│   ├── identity/     ← ①
│   ├── ...
│   └── exploration/  ← ③
│
└── shared/           ← ④ 公共内容：纯公共逻辑，方便复用
    ├── ui/           ←    原 components/ui/（shadcn）
    ├── components/   ←    原 components/shared/ + layout/
    ├── lib/          ←    原 lib/calculation/ + lib/game/events/ + lib/game/types.ts
    ├── utils/        ←    原 utils/ + lib/config/
    ├── config/       ←    环境配置
    └── storage/      ←    原 storage/
```

理由：顶层只有 4 个目录，每个职责唯一且互不重叠。新增一个文件时，决策树非常简单：

```
新文件是什么？
├── Next.js 路由页面？                              → app/
├── 与路由挂钩的页面组件（组合模块Panel，无业务逻辑）？ → pages/
├── 某个业务功能（逻辑+状态+组件）？                  → modules/<domain>/
└── 纯通用公共代码？                                  → shared/
```

### 2. 模块命名：`modules/` vs `features/`

**选择：`modules/`**

理由：用户要求，`features/` 已被占用。`modules/` 更直观表示"功能模块"。

### 3. 模块内文件组织

**选择：统一模板**
```
modules/<domain>/
├── index.ts          # 对外契约
├── types.ts          # 模块 Slice + Action 类型（≤300行）
├── state.ts          # Reducer（≤200行）
├── events.ts         # 事件订阅处理器
├── logic/            # 纯业务逻辑（从 lib/game/ 搬来，每个 ≤500行）
├── hooks/            # React Hooks（每个 ≤200行）
├── components/       # UI 组件（每个 ≤300行）
├── data/             # 静态配置（每个 ≤800行）
└── __tests__/        # 本模块测试
```

### 4. pages/ 目录职责

**选择：`pages/` 存放所有与路由挂钩的页面组件**

```
pages/
├── home/              ← 首页入口（原 components/pages/home/）
├── character-select/  ← 选角页（原 components/pages/character-select/）
├── world-select/      ← 选世界页（原 components/pages/world-select/）
├── backstory/         ← 背景故事页（原 components/pages/backstory/）
└── game/              ← 主游戏页（原 components/pages/game/GamePage.tsx）
    ├── GamePage.tsx   ← 组合所有模块 Panel，管理 Tab 切换、弹窗
    └── useGameState.tsx ← 精简后的全局状态（仅组合+持久化，≤300行）
```

`pages/` 中的组件负责：
- 页面路由切换（对应 GamePhase：character-select → world-select → backstory → playing）
- 页面布局框架（header、sidebar、main content 区域）
- 弹窗管理（重置确认、升级面板等）
- 组合各模块的 Panel 组件

`pages/` 中的组件不负责：
- 任何业务逻辑（那是 `modules/` 的事）
- 具体的功能面板实现（模块 Panel 在 `modules/<domain>/components/`）

**`modules/identity/` 不再包含页面组件**：角色选择、世界选择、背景故事的页面组件移到 `pages/`，`modules/identity/` 只保留纯逻辑（角色生成、世界生成、背景故事生成）和数据配置。

### 5. shared/ 目录整合

**选择：将原散落 6 处的公共代码合并到 `shared/`**

| 原位置 | 新位置 |
|--------|--------|
| `components/ui/` | `shared/ui/` |
| `components/shared/` | `shared/components/` |
| `components/layout/` | `shared/components/` |
| `lib/calculation/` | `shared/lib/calculation/` |
| `lib/game/events/` | `shared/lib/events/` |
| `lib/game/types.ts` | `shared/lib/types.ts` |
| `lib/config/` | `shared/config/` |
| `lib/websocket/` | `shared/lib/websocket/` |
| `lib/multiplayer/` | `shared/lib/multiplayer/` |
| `utils/` | `shared/utils/` |
| `types/` | 删除（合并到 `shared/lib/types.ts`） |
| `storage/` | `shared/storage/` |

### 6. 跨模块通信

**选择：事件总线（现有 `GameEventManager`），放于 `shared/lib/events/`**

### 7. 迁移顺序

按模块独立度分层，从简单到复杂：

| Tier | 模块 | 理由 |
|------|------|------|
| 0 | ⑮ narrative, ① identity | 纯函数/零状态依赖 |
| 1 | ⑭ social, ⑨ faction | 自包含子状态 |
| 2 | ⑩ tower, ⑬ time, ⑪ collection | 自包含子系统 |
| 3 | ⑧ crafting, ⑦ techniques, ⑫ ascension | 有少量跨模块依赖 |
| 4 | ⑥ equipment, ⑤ economy | 被多个模块依赖 |
| 5 | ② progression, ④ combat, ③ exploration | 核心游戏循环，最后迁移 |

## Risks / Trade-offs

- **[风险] 合并冲突** → **缓解**：每个模块独立分支，完成后立即合并 main
- **[风险] 循环依赖** → **缓解**：事件总线解耦 + 依赖方向分析，每个模块完成后检查
- **[风险] 导入路径大面积变更** → **缓解**：旧路径 barrel 重新导出，过渡期两套路径都可用
- **[权衡] 目录变深**：`lib/game/equipment.ts` → `modules/equipment/logic/equipmentCalc.ts` → **接受**：深度换清晰度
- **[权衡] shared/ 仍然是技术分层**：`shared/` 内部仍按 ui/components/lib/utils 分 → **接受**：public 代码天然按技术维度组织
