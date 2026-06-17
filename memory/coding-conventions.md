---
name: coding-conventions
description: 项目编码约定 — 导入顺序、命名、JSDoc、状态更新模式
metadata:
  type: project
---

# 编码约定

## 导入顺序
1. React 相关
2. 第三方库
3. `@/` 别名（core/ 在前，modules/、shared/ 在后）
4. 相对路径

## 命名约定
- 组件：PascalCase（`BattlePanel.tsx`）
- Hook：useCamelCase（`useGameState.ts`）
- 函数：camelCase，动词开头（`calculateDamage`）
- 常量：UPPER_SNAKE_CASE（`MAX_PLAYER_LEVEL`）
- Props callback：`on` + 动词过去式（`onCultivate`）
- 布尔 props：`is`/`has`/`show` 前缀

## 状态更新
- 始终用 `setGameState(prev => ...)` 函数式更新
- 不依赖闭包中的旧值
- 跨模块写通过事件总线（`core/events/`）

## ActionResult 模式
所有 logic/ 函数返回 `{ success: true, data }` 或 `{ success: false, error }`

**Why:** 这些约定确保 20+ 模块的代码风格一致，降低认知负担。
**How to apply:** 每次写新代码时对照检查；ESLint 的 import/order 规则会自动检查导入顺序。
