# 核心约束规则

> **级别：MUST（违反即错误）**
> 这些规则是硬约束，AI Agent 生成代码时必须遵守。违反将导致代码审查不通过。

---

## 一、文件大小硬约束

| 文件类型 | 最大行数 | 级别 | 检查方式 |
|----------|----------|------|----------|
| 组件文件（`*.tsx`，非 UI 基础组件） | 300 | MUST | `pnpm check-sizes` |
| Hook 文件（`use*.ts`/`use*.tsx`） | 200 | MUST | `pnpm check-sizes` |
| 工具/逻辑模块（`lib/`，非 data 目录） | 500 | SHOULD | `pnpm check-sizes` |
| 数据/配置文件（`lib/data/`、`lib/gameData/`） | 800 | SHOULD | `pnpm check-sizes` |

**超限处理**：
- 接近上限时（>80%）优先考虑拆分
- 超过上限时必须拆分，不得继续增涨
- 拆分后通过 `index.ts` 重新导出保持 API 兼容

## 二、目录职责表

| 目录 | 允许 | 禁止 |
|------|------|------|
| `src/app/` | 页面路由、全局布局、metadata | 业务逻辑、复杂状态管理 |
| `src/components/ui/` | shadcn/ui 官方组件 | **任何自定义代码** |
| `src/components/game/` | 游戏 UI 组件 | 纯业务逻辑（应放 lib/） |
| `src/components/pages/` | 页面级组件 | 跨页面使用的组件（应放 game/ 或 shared/） |
| `src/components/shared/` | 跨模块共享的通用组件 | 游戏特定逻辑 |
| `src/components/layout/` | 全局布局组件 | 业务逻辑 |
| `src/features/` | 领域业务编排（组合 lib + hooks） | 纯 UI 组件（应放 components/） |
| `src/hooks/` | React 状态管理、副作用处理 | 纯计算逻辑（应放 lib/）、UI 渲染 |
| `src/lib/` | 纯函数、类型定义、数据配置、计算引擎 | **React 组件/Hook**、**DOM 操作**、**副作用** |
| `src/lib/game/` | 游戏核心业务逻辑（纯函数） | React 相关代码、直接 HTTP 调用 |
| `src/lib/data/` | 静态游戏数据配置 | 业务逻辑 |
| `src/lib/calculation/` | 统一计算引擎 | 混入游戏特定逻辑 |
| `src/storage/` | 数据持久化（Supabase/DB） | 业务规则 |
| `src/types/` | 全局通用类型 | 重复定义 lib 中已有的类型 |
| `src/contexts/` | React Context Provider | 复杂业务逻辑（应由 hooks 封装） |
| `src/utils/` | 无领域逻辑的通用工具 | 游戏逻辑 |
| `src/tests/` | 测试文件 | 生产代码 |

## 三、禁止行为清单（MUST NOT）

### 3.1 架构破坏
- ❌ 在 `src/lib/` 中 import React 组件或 Hook（破坏依赖方向）
- ❌ 在 `src/lib/` 中操作 DOM 或使用 `window` 对象
- ❌ 在 `src/components/ui/` 中添加或修改文件
- ❌ 在 `src/types/` 中重复定义 `src/lib/game/types.ts` 已有的类型

### 3.2 代码质量
- ❌ 使用 `any` 类型（ESLint error，除非有 `eslint-disable` + JSDoc 说明）
- ❌ 在组件内硬编码游戏数值（应放在 `balanceConfig.ts` 或对应 data 文件）
- ❌ 创建未在 `index.ts` 中导出的模块
- ❌ 在组件内定义可复用的纯函数（应提取到 `lib/` 或 `utils/`）
- ❌ 直接修改 `useGameState` 返回的状态对象（破坏不可变性）
- ❌ 创建功能重复的组件或模块（开发前必须先搜索现有代码）

### 3.3 类型安全
- ❌ 函数参数无类型标注
- ❌ 函数返回值无类型标注（除非 void 且上下文明确）
- ❌ 使用 `as` 类型断言绕过类型检查（除非有充分理由 + 注释）

## 四、文件组织

### 4.1 模块结构模板
```
src/lib/game/<module>/
├── types.ts         # 模块类型定义
├── <module>.ts      # 主要业务逻辑
├── index.ts         # 统一导出
└── __tests__/       # 单元测试
```

### 4.2 导入路径
- 跨模块导入：使用 `@/` 别名（如 `@/lib/game/types`）
- 同模块导入：使用相对路径（如 `./types`）
- 禁止深层相对路径：`../../../` 超过 2 层时必须改用 `@/`

### 4.3 新文件放置决策树
```
新文件是 React 组件？
  ├── 是基础 UI 组件？→ src/components/ui/（仅 shadcn）
  ├── 是游戏专用组件？→ src/components/game/<domain>/
  ├── 是页面级组件？→ src/components/pages/<page>/
  └── 是跨模块共享？→ src/components/shared/

新文件是 React Hook？
  └── src/hooks/<domain>/

新文件是纯函数/类型/数据？
  ├── 是游戏业务逻辑？→ src/lib/game/<module>/
  ├── 是游戏数据配置？→ src/lib/data/
  ├── 是计算引擎相关？→ src/lib/calculation/
  └── 是通用工具？→ src/utils/

新文件是数据库操作？
  └── src/storage/database/
```

## 五、变更约束

### 5.1 变更前必须
1. 搜索现有代码：`grep "关键字" src/` 确认无重复
2. 阅读相关 `types.ts`：避免重复定义类型
3. 阅读相关 `index.ts`：了解现有导出
4. 检查 `doc/architecture/module-map.md`：确认放置位置

### 5.2 变更后必须
1. 更新对应 `index.ts` 桶文件
2. 运行 `pnpm ts-check` 确保类型正确
3. 运行 `pnpm build` 确保构建成功
4. 如果涉及 `lib/game/` 变更，运行 `pnpm test`
