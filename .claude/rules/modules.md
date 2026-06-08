# 模块开发规范

> **级别：SHOULD（违反需有合理理由）**
> 这些规则定义了各模块的开发模式，AI Agent 应遵循以确保代码一致性。

---

## 一、`src/lib/game/` — 游戏核心逻辑

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
lib/game/<domain>/
├── types.ts              # 领域类型定义（extends 核心类型）
├── <feature>.ts          # 纯函数实现
├── index.ts              # 统一导出
└── __tests__/            # 测试（如果存在）
```

### 1.3 类型定义
- 核心类型集中在 `lib/game/types.ts`
- 领域特有类型在 `lib/game/<domain>/types.ts`
- 领域类型通过 `extends` 继承核心类型
- 新增类型在所属模块的 `types.ts` 中定义

### 1.4 关键模块列表
| 文件 | 职责 | 最大行数 |
|------|------|----------|
| `types.ts` | 核心类型定义 | 800 |
| `balanceConfig.ts` | 战斗数值平衡 | 500 |
| `cultivation.ts` | 修炼/突破逻辑 | 500 |
| `adventure.ts` | 机缘/探索逻辑 | 500 |
| `combat.ts` | 战斗逻辑 | 500 |
| `items.ts` | 物品系统 | 500 |
| `equipment.ts` | 装备系统 | 500 |
| `offlineProcessor.ts` | 离线处理 | 500 |

---

## 二、`src/hooks/` — 状态管理

### 2.1 状态层级
```
useGameState (全局游戏状态 — 单一数据源)
    ├── 提供：state + dispatch 方法
    ├── 管理：游戏世界、角色、资源、时间
    └── 持久化：存档/读档逻辑

功能 Hooks（按系统拆分）
    ├── useGameCultivation    # 修炼状态
    ├── useGameAdventure      # 机缘状态
    ├── useGameEquipment      # 装备状态
    ├── useGameInventory      # 背包状态
    ├── useGameCrafting       # 炼制状态
    ├── useGameFaction        # 势力状态
    ├── useGameAscension      # 飞升状态
    └── useGameMessages       # 消息系统

组件本地状态（useState）
    └── 仅 UI 临时状态（展开/折叠、输入框值、动画状态）
```

### 2.2 Hook 开发规则
- 一个 Hook 文件只负责一个游戏系统
- 通过 `useGameState` 获取全局状态，不得绕过
- 复杂操作封装在独立的 Hook 文件中
- Hook 文件名：`use<SystemName>.ts`（如 `useCultivation.ts`）
- 导出名与文件名一致

### 2.3 Hook 模板
```typescript
/**
 * Hook: useSystemName
 *
 * 职责：[一句话描述该 Hook 管理的系统]
 * 依赖：[列出依赖的 hooks 和 lib 函数]
 */
import { useCallback, useMemo } from 'react';
import type { SystemState } from '@/lib/game/types';
import { doSomething } from '@/lib/game/module';

export function useSystemName() {
  const { state, updateState } = useGameState();

  const derivedValue = useMemo(() => {
    // 从 state 计算派生值
  }, [state.someField]);

  const action = useCallback((param: ParamType) => {
    // 使用 lib 纯函数计算新状态
    const newState = doSomething(state, param);
    updateState(newState);
  }, [state, updateState]);

  return { derivedValue, action };
}
```

---

## 三、`src/components/` — UI 组件

### 3.1 组件分类

| 子目录 | 用途 | 状态管理限制 |
|--------|------|-------------|
| `ui/` | shadcn/ui 组件（只读） | 禁止使用业务 Hook |
| `game/` | 游戏功能面板 | 可使用功能 Hook |
| `pages/` | 页面入口组件 | 可使用功能 Hook |
| `shared/` | 跨模块通用组件 | 仅 props，尽量无状态 |
| `layout/` | 全局布局 | 可使用路由/主题 Hook |

### 3.2 组件结构
```tsx
/**
 * 组件：ComponentName
 *
 * 职责：[一句话描述]
 * 依赖：[列出依赖的 Hooks]
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGameState } from '@/hooks/useGameState';

interface ComponentNameProps {
  /** [字段说明] */
  title: string;
  /** [字段说明] */
  onAction?: (result: ActionResult) => void;
}

export function ComponentName({ title, onAction }: ComponentNameProps) {
  // 1. Hooks 调用
  // 2. 派生状态（useMemo）
  // 3. 事件处理函数（useCallback 包裹需要稳定引用的）
  // 4. 条件渲染/早期返回
  // 5. JSX 返回
}
```

### 3.3 渲染规则
- JSX 嵌套深度不超过 4 层（超过则提取子组件）
- 条件渲染超过 3 个分支时使用映射表或策略模式
- 列表渲染必须提供 `key`
- 避免在 JSX 中编写复杂表达式（提取为变量或函数）

---

## 四、`src/features/` — 领域业务编排

### 4.1 定位
`features/` 是轻量级业务编排层，职责是：
- 组合多个 `lib/game` 纯函数
- 协调多个 Hook 的交互
- 包装复杂的状态流转逻辑
- **不** 包含纯 UI 组件（UI 应放 `components/`）
- **不** 重新实现已有的 `lib/game` 逻辑

### 4.2 结构
```
features/<domain>/
├── types.ts            # 领域特有类型
├── components/         # 轻量编排组件（组合而非新建）
├── index.ts            # 统一导出
└── __tests__/
```

### 4.3 何时使用 features/
- ✅ 需要组合多个 Hook + lib 函数完成复杂流程
- ✅ 跨多个游戏系统的协调逻辑
- ❌ 纯 UI 展示（放 `components/`）
- ❌ 纯计算逻辑（放 `lib/`）

---

## 五、`src/lib/data/` — 静态数据

### 5.1 数据文件规范
```typescript
/**
 * 数据文件：[名称]
 *
 * 描述：[数据用途]
 * 使用模块：[哪些模块引用此数据]
 */

/** [枚举/常量说明] */
export const DATA_NAME: Record<string, DataType> = {
  // ...
};
```

### 5.2 数据组织原则
- 按领域拆分（如 `factionData/` 下按世界类型拆分）
- 常量使用 `UPPER_SNAKE_CASE`
- 每个配置项必须有 JSDoc 注释
- 通过 `index.ts` 聚合导出
