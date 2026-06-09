# 模块开发规范

> **级别：SHOULD（违反需有合理理由）**
> 这些规则定义了各层的开发模式，AI Agent 应遵循以确保代码一致性。

---

## 一、`modules/<domain>/logic/` — 纯业务逻辑

### 1.1 纯函数原则
所有导出函数 MUST 是纯函数：
- 相同输入 → 相同输出（无 `Math.random()`，接收随机种子作为参数）
- 无副作用（不修改输入参数、不读写外部状态）
- 不依赖 React 或浏览器 API

```typescript
// ✅ 正确：纯函数
export function calculateDamage(attacker: CombatStats, defender: CombatStats, seed: number): DamageResult { ... }

// ❌ 错误：有副作用
export function calculateDamage(attacker: CombatStats, defender: CombatStats): DamageResult {
  const roll = Math.random(); // 隐式依赖全局状态
  ...
}
```

### 1.2 模块组织
```
modules/<domain>/
├── index.ts          # 统一导出 + 模块对外契约
├── types.ts          # 领域类型定义（≤300行）
├── state.ts          # 状态 Slice + Reducer（≤200行）
├── events.ts         # 事件订阅处理器（可选）
├── logic/            # 纯业务逻辑（每个文件 ≤500行）
│   ├── index.ts
│   └── __tests__/
├── hooks/            # React Hooks（每个 ≤200行）
│   └── index.ts
├── components/       # UI 组件（每个 ≤300行）
│   └── index.ts
└── data/             # 静态配置（每个 ≤800行）
    └── index.ts
```

### 1.3 类型定义
- 核心共享类型在 `shared/lib/types.ts`
- 模块特有类型在 `modules/<domain>/types.ts`
- 模块类型通过 `extends` 继承核心类型
- 不得在模块中重复定义 `shared/lib/types.ts` 已有的类型

---

## 二、`views/` — 页面组件

### 2.1 页面职责
`views/` 存放与路由挂钩的页面级组件，每个路由一个子目录：

```
views/
├── home/              ← / (首页)
├── character-select/  ← 选角页
├── world-select/      ← 选世界页
├── backstory/         ← 背景故事页
└── game/              ← 主游戏页
```

### 2.2 页面规则
- 页面组件负责：组合模块 Panel、Tab 切换、弹窗管理
- 页面组件不负责：业务逻辑（那是 `modules/` 的事）
- 页面组件通过 `modules/<domain>/hooks/` 获取状态
- 页面内 UI 临时状态（展开/折叠、输入框值）使用 `useState`

---

## 三、`modules/<domain>/hooks/` — 状态管理

### 3.1 Hook 规则
- 一个 Hook 文件只负责一个关注点
- 通过模块自己的 state slice 获取状态，不得绕过
- Hook 只访问自己模块的 slice，不跨模块直接修改状态
- 跨模块通信通过事件总线（`shared/lib/events/`）

### 3.2 Hook 模板
```typescript
/**
 * Hook: use<Feature>
 *
 * 职责：[一句话描述]
 * 依赖模块：[列出依赖的模块]
 */
import { useCallback, useMemo } from 'react';
import type { <Domain>Slice } from '../types';
import { <domain>Reducer } from '../state';

export function use<Feature>() {
  // 只访问自己模块的 slice + dispatch
  // 不直接修改其他模块的状态
}
```

---

## 四、`modules/<domain>/components/` — UI 组件

### 4.1 组件结构
```tsx
/**
 * 组件：<ComponentName>
 *
 * 职责：[一句话]
 * 依赖：[Hooks]
 */
import { Button } from '@/components/ui/button';
import { use<Feature> } from '../hooks/use<Feature>';

interface <ComponentName>Props {
  /** [字段说明] */
  title: string;
}

export function <ComponentName>({ title }: <ComponentName>Props) {
  // 1. Hooks 调用
  // 2. 派生状态（useMemo）
  // 3. 事件处理
  // 4. JSX 返回
}
```

### 4.2 渲染规则
- JSX 嵌套深度不超过 4 层
- 条件渲染超过 3 个分支时使用映射表
- 列表渲染必须提供 `key`
- 避免在 JSX 中编写复杂表达式

---

## 五、`shared/` — 公共内容

### 5.1 目录职责
| 目录 | 职责 |
|------|------|
| `shared/ui/` | shadcn 组件（只读，源在 `components/ui/`） |
| `shared/components/` | 跨模块通用组件 |
| `shared/lib/` | 计算引擎、事件总线、核心类型、websocket、multiplayer |
| `shared/utils/` | 无领域逻辑的通用工具（cn, logger, saveMigrator） |
| `shared/config/` | 环境配置 |
| `shared/storage/` | 数据库客户端和 schema |

### 5.2 公共代码规则
- `shared/` 中的代码不得依赖任何 `modules/` 中的代码
- `shared/` 中的代码不得包含游戏业务逻辑
- 新增跨模块通用工具时，优先考虑是否放入 `shared/utils/`

---

## 六、模块间通信

### 6.1 通信规则
```
✅ 允许：
  模块 A 的 logic 调用模块 B 的 logic（纯函数调用纯函数）
  模块 A 发出事件，模块 B 的 eventHandler 响应
  模块 A 的 Hook 读取其他模块的 slice（只读）

❌ 禁止：
  模块 A 的 Hook 直接修改模块 B 的 slice
  模块 A 的 logic 直接 import 模块 B 的 Hook 或组件
  循环依赖（A → B → A）
```

### 6.2 事件通信
使用 `shared/lib/events/eventManager.ts` 中的 `GameEventManager` 进行跨模块通信。

```typescript
// 模块 A：发出事件
import { gameEventManager } from '@/shared/lib/events/eventManager';
gameEventManager.emit({ type: 'BattleWon', payload: { ... } });

// 模块 B：订阅事件
// modules/<domain>/events.ts
export const <domain>EventHandlers = {
  BattleWon: (slice, event) => ({ ...slice, ... }),
};
```
