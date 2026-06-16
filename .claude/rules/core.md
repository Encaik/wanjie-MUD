# 核心约束规则

> **级别：MUST（违反即错误）**
> 这些规则是硬约束，AI Agent 生成代码时必须遵守。违反将导致代码审查不通过。

---

## 一、五层架构（MUST）

项目采用五层架构，`src/` 下只有 5 个顶级目录：

```
src/
├── app/       ← ① 入口：Next.js App Router 路由
├── views/     ← ② 页面：与路由挂钩的页面级组件
├── modules/   ← ③ 功能模块：20+ 自包含业务域
├── core/      ← ④ 核心系统：游戏基础设施
└── shared/    ← ⑤ 公共：跨模块工具性代码
```

### 1.1 内容唯一原则（MUST）

**同一份内容只在五层模型中的一个位置存在。禁止复制粘贴代码。**

旧代码迁移时，旧位置可临时保留 barrel re-export（`export * from '新路径'`），过渡期后删除。

### 1.2 新文件放置决策树

```
新文件是什么？
├── Next.js 路由页面（page.tsx, layout.tsx）？ → app/
├── 与路由挂钩的页面组件（组合模块 Panel）？    → views/<route>/
├── 某个业务功能的逻辑/状态/组件/数据？        → modules/<domain>/
├── 游戏核心基础设施（事件、计算、世界、注册、Mod、引擎）？ → core/
└── 纯通用工具性代码（cn、logger、AI、WebSocket）？      → shared/
```

---

## 二、文件大小硬约束

| 文件类型 | 最大行数 | 级别 | 检查方式 |
|----------|----------|------|----------|
| 组件文件（`*.tsx`，非 shadcn/ui） | 300 | MUST | `pnpm check-sizes` |
| Hook 文件（`use*.ts`/`use*.tsx`） | 200 | MUST | `pnpm check-sizes` |
| 逻辑模块（`logic/` 目录） | 500 | SHOULD | `pnpm check-sizes` |
| 数据/配置文件（`data/` 目录） | 800 | SHOULD | `pnpm check-sizes` |

**超限处理**：
- 接近上限时（>80%）优先考虑拆分
- 超过上限时必须拆分，不得继续增涨
- 拆分后通过 `index.ts` 重新导出保持 API 兼容

---

## 三、目录职责表

| 目录 | 职责 | 允许 | 禁止 |
|------|------|------|------|
| `app/` | ① Next.js 路由入口 | layout.tsx, page.tsx, globals.css | 业务逻辑、状态管理 |
| `views/` | ② 与路由挂钩的页面 | 组合各模块 Panel、管理页面切换和弹窗 | 业务逻辑（应放 modules/） |
| `modules/<domain>/` | ③ 业务功能模块 | 类型、纯逻辑、状态、组件、数据、测试 | 跨模块通用代码（应放 shared/）、路由级页面（应放 views/）、核心基础设施（应放 core/） |
| `core/events/` | ④ 事件驱动通信系统 | GameEventManager 单例、事件类型定义、事件匹配器 | React 组件/Hooks、依赖 modules/ |
| `core/types/` | ④ 核心游戏类型 | CharacterStats、Quality、World、Protagonist 等基础类型 | 定义模块特有类型（应放 modules/） |
| `core/calculation/` | ④ 统一数值计算引擎 | 属性计算、效果优先级、边界保护 | React 组件/Hooks、依赖 modules/ |
| `core/world/` | ④ 世界系统 | WorldProviderRegistry、WorldPoolEngine、模板验证 | React 组件/Hooks |
| `core/registry/` | ④ 数据注册中心 | WorldDataRegistry、WorldMechanicsRegistry | React 组件/Hooks、依赖 modules/ |
| `core/server/` | ④ 服务端核心代码 | instrumentation、中间件等服务端基础设施 | React 组件/Hooks、依赖 modules/ |
| `core/mod/` | ④ Mod 系统 | Mod 加载、验证、清单管理 | React 组件/Hooks |
| `core/engine/` | ④ 引擎集成层 | 跨系统集成逻辑（gameSystems、expansionLogic、messageDB） | React 组件/Hooks |
| `shared/ui/` | ⑤ shadcn/ui 组件 | shadcn 官方组件 | **任何自定义代码** |
| `shared/components/` | ⑤ 跨模块通用组件 | 多模块共用的 UI 组件 | 单一模块专用的组件（应放 modules/） |
| `shared/lib/` | ⑤ 公共库 | AI 调用、WebSocket、多人游戏基础设施 | 核心游戏系统（应放 core/）、业务逻辑（应放 modules/） |
| `shared/utils/` | ⑤ 通用工具 | cn, logger, saveMigrator 等无领域逻辑的工具 | 游戏特定逻辑 |
| `shared/config/` | ⑤ 环境配置 | 环境变量、模式判断 | 业务配置（应放 modules/） |
| `shared/storage/` | ⑤ 数据持久化 | Supabase 客户端、数据库 schema | 业务规则 |
| `components/ui/` | shadcn 源目录 | shadcn CLI 管理，**只读** | 自定义代码 |
| `components/game/` | 待迁移的旧 UI | 仅存在于迁移过渡期 | 新代码 ❌ |
| `hooks/` | 待迁移的旧 Hooks | 仅存在于迁移过渡期 | 新代码 ❌ |
| `lib/` | 待迁移的旧 lib | 仅存在于迁移过渡期 | 新代码 ❌ |
| `contexts/` | 待迁移的旧 Context | 仅存在于迁移过渡期 | 新代码 ❌ |
| `types/` | 待清理的旧类型 | 仅存在于迁移过渡期 | 新代码 ❌、重复定义 ❌ |

---

## 四、功能模块结构模板

```
modules/<domain>/
├── index.ts          # 统一导出 + 模块对外契约
├── types.ts          # 模块内类型定义（≤300行）
├── state.ts          # 状态 Slice + Reducer（≤200行）
├── events.ts         # 事件订阅处理器
├── logic/            # 纯函数（每个 ≤500行）
│   ├── index.ts
│   └── __tests__/
├── hooks/            # React Hooks（每个 ≤200行）
│   └── index.ts
├── components/       # UI 组件（每个 ≤300行）
│   └── index.ts
└── data/             # 静态配置（每个 ≤800行）
    └── index.ts
```

---

## 五、禁止行为清单（MUST NOT）

### 5.1 架构破坏
- ❌ 在 `shared/` 中放入业务逻辑（业务逻辑属于 `modules/`）
- ❌ 在 `shared/` 中放入核心游戏系统（核心系统属于 `core/`）
- ❌ 在 `core/` 中依赖 `modules/` 的代码（`core/` 是底层基础设施）
- ❌ 在 `core/` 中放入 React 组件或 Hooks
- ❌ 在 `modules/` 中放入路由级页面（页面属于 `views/`）
- ❌ 在 `shared/ui/` 中添加或修改文件（shadcn 源在 `components/ui/`）
- ❌ 在模块 A 的 Hook 中直接修改模块 B 的 state slice
- ❌ 在旧目录（`components/game/`、`hooks/`、`lib/`、`contexts/`、`types/`）中新增文件
- ❌ 一份内容出现在两个位置
- ❌ 在 `public/mods/` 中直接编辑 Mod 源文件（源文件在根目录 `mods/`，`public/mods/` 是构建产物）

### 5.2 代码质量
- ❌ 在开发期间编写过渡兼容代码：禁止 `@deprecated` barrel re-export、`LegacyXxx` 类型别名、"向后兼容"包装函数、"兼容旧版"兜底方案等——一次完全迁移，不留冗余逻辑
- ❌ 使用 `any` 类型（ESLint error，除非有 `eslint-disable` + JSDoc 说明）
- ❌ 在组件内硬编码游戏数值（应放在模块 `data/` 中）
- ❌ 创建未在 `index.ts` 中导出的模块
- ❌ 在组件内定义可复用的纯函数（应提取到模块 `logic/` 或 `shared/utils/`）
- ❌ 直接修改 `useGameState` 返回的状态对象（破坏不可变性）
- ❌ 创建功能重复的组件或模块（开发前必须先搜索现有代码）

### 5.3 类型安全
- ❌ 函数参数无类型标注
- ❌ 函数返回值无类型标注（除非 void 且上下文明确）
- ❌ 使用 `as` 类型断言绕过类型检查（除非有充分理由 + 注释）

### 5.4 核心基础设施复用（MUST）

- ❌ 在 `core/` 之外重新实现 `core/` 已有的功能（如自己写 logger、自己写事件总线、自己写计算引擎）
- ❌ 绕过 `core/` 提供的 API 直接用底层方式实现（如用 `console.log` 代替 `createLogger()`、用自定义事件代替 `gameEventBus`）
- ❌ 在 `modules/` 或 `shared/` 中创建与 `core/` 功能重复的系统
- ✅ 开发前必须确认 `core/` 中是否已有对应能力：`core/logger/`（系统日志）、`core/message-log/`（玩家消息）、`core/events/`（事件总线）、`core/calculation/`（数值计算）、`core/types/`（核心类型）、`core/world/`（世界系统）、`core/registry/`（数据注册）、`core/server/`（服务端核心）、`core/engine/`（引擎集成）

### 5.5 可视化组件与图表库（MUST）

**图表、进度条、数据可视化等 UI 组件必须使用已安装的库实现，禁止手写 SVG/Canvas 渲染。**

项目已安装的图表与 UI 库：

- `recharts` — 图表库（折线图、柱状图、雷达图、饼图等）
- `@radix-ui/react-progress` — 进度条
- shadcn/ui `ChartContainer`（`@/shared/ui/data-display/chart`）— recharts 的 shadcn 风格包装器

**规则**：

- ❌ 禁止手写 SVG `<polygon>`、`<line>`、`<circle>` 等元素来实现图表（如雷达图、折线图、柱状图）
- ❌ 禁止手写 `<div>` + CSS `width%` 来实现进度条——使用 `@/shared/ui/feedback/progress` 的 `Progress` 组件
- ❌ 禁止在组件内定义仅自己使用的 `ProgressBar`、`ChartXxx` 等内联可视化组件
- ✅ 图表需求 → 使用 `recharts` + shadcn `ChartContainer`（`@/shared/ui/data-display/chart`）
- ✅ 进度条需求 → 使用 `@/shared/ui/feedback/progress` 的 `Progress` 组件
- ✅ 开发前先检查 `@/shared/ui/` 和 `package.json` 中是否已有对应库

**理由**：手写 SVG/CSS 实现存在以下问题：

- 无法利用库的动画、响应式、无障碍能力
- 无法自动适配明/暗主题 CSS 变量
- 增加维护负担（三角函数计算、跨浏览器兼容）
- 违反"同一份内容只在一处存在"原则（重复造轮子）

---

### 5.6 README 文档同步（MUST）

`src/core/README.md` 和 `src/modules/README.md` 是模块总览文档，新增、删除或重命名核心或业务模块时必须同步更新。

- ❌ 新增子模块后忘记在对应 README.md 中添加描述
- ❌ 删除子模块后忘记在对应 README.md 中移除描述
- ❌ 重命名子模块后忘记在对应 README.md 中更新名称和描述
- ✅ 变更涉及 `src/core/` 或 `src/modules/` 的子模块时，变更前后必须检查并同步更新对应 README.md

---

## 六、导入路径

- 跨模块导入：使用 `@/` 别名（如 `@/modules/narrative`、`@/core/types`、`@/shared/utils/cn`）
- 同模块导入：使用相对路径（如 `./types`、`../logic/calculator`）
- 禁止深层相对路径：`../../../` 超过 2 层时必须改用 `@/`
- 核心系统导入：使用 `@/core/events`、`@/core/types`、`@/core/calculation` 等

---

## 七、变更约束

### 7.1 变更前必须
1. 搜索现有代码：`grep "关键字" src/` 确认无重复
2. 阅读相关 `types.ts`：避免重复定义类型
3. 阅读相关 `index.ts`：了解现有导出
4. 确定文件应放在五层架构的哪一层

### 7.2 变更后必须
1. 更新对应 `index.ts` 桶文件
2. 运行 `pnpm ts-check` 确保类型正确
3. 运行 `pnpm build` 确保构建成功
4. 如果涉及模块 `logic/` 变更，运行 `pnpm test`
5. 确认没有在旧目录中新增文件（迁移过渡期）
