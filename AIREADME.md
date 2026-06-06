# 万界修行录 - AI 开发指南

> 本文档为 AI Agent 开发指南，每次对话必须遵循此规则进行开发。

---

## 一、项目概述

**万界修行录** 是一款基于 Next.js 的多世界观文字修仙游戏，支持 8 种世界类型（修仙、高武、科技、魔幻、异能、仙侠、武侠、末世）。玩家可选择随机生成的角色和世界，融合生成背景故事后进行修炼、历练、机缘三大核心玩法。

### 1.1 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI 库 | React 19 + shadcn/ui |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 4 |
| 数据库 | Supabase (PostgreSQL) |
| 包管理 | pnpm 9+ |

### 1.2 世界类型

| 世界 | 描述 |
|------|------|
| 修仙世界 | 传统东方修仙 |
| 高武世界 | 武道修炼 |
| 科技世界 | 赛博朋克 |
| 魔幻世界 | 剑与魔法 |
| 异能世界 | 超能力觉醒 |
| 仙侠世界 | 御剑飞行 |
| 武侠世界 | 江湖武林 |
| 末世世界 | 末日求生 |

### 1.3 品质等级

从高到低：传说 > 史诗 > 稀有 > 精良 > 优秀 > 普通 > 劣质 > 基础

---

## 二、项目结构

```
src/
├── app/                          # Next.js 应用目录
│   ├── api/                      # API 路由
│   │   └── messages/             # 消息 API
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 首页入口
│   └── globals.css               # 全局样式
│
├── components/                   # React 组件
│   ├── ui/                       # shadcn/ui 基础组件
│   ├── game/                     # 游戏核心组件
│   │   ├── MainGame.tsx         # 主游戏容器
│   │   ├── CharacterInfo.tsx    # 角色信息
│   │   ├── CultivationPanel.tsx # 修炼面板
│   │   ├── AdventurePanel.tsx   # 机缘面板
│   │   └── ...
│   ├── pages/                    # 页面级组件
│   │   ├── character-select/    # 角色选择
│   │   ├── world-select/       # 世界选择
│   │   └── backstory/          # 背景故事
│   └── shared/                   # 共享组件
│
├── hooks/                        # React Hooks (已模块化拆分)
│   ├── useGameState.tsx         # 游戏主状态 (~1512 行)
│   ├── useGameHooks.ts          # hooks 集成
│   ├── useGameInitialization.ts # 初始化
│   ├── useGameMessages.ts       # 消息系统
│   ├── useGameAdventure.ts      # 机缘系统
│   ├── useGameAscension.ts      # 飞升系统
│   ├── useGameCrafting.ts       # 炼制系统
│   ├── useGameCultivation.ts    # 修炼系统
│   ├── useGameEquipment.ts      # 装备系统
│   ├── useGameFaction.ts        # 势力系统
│   ├── useGameInventory.ts      # 背包系统
│   ├── gameInitialState.ts      # 游戏初始状态
│   ├── index.ts                 # 统一导出
│   └── use-mobile.ts            # 移动端检测
│
├── lib/                          # 核心业务逻辑
│   ├── utils.ts                 # 工具函数
│   ├── game/                     # 游戏核心模块
│   │   ├── types.ts             # 类型定义
│   │   ├── index.ts             # 统一导出
│   │   ├── typesExtension.ts    # 扩展类型
│   │   ├── data/                # 静态数据
│   │   │   ├── enemies.ts       # 敌人数据
│   │   │   ├── events.ts        # 事件数据
│   │   │   ├── techniques.ts    # 功法数据
│   │   │   ├── equipment.ts     # 装备数据
│   │   │   ├── realms.ts        # 境界数据
│   │   │   ├── factions.ts      # 势力数据
│   │   │   └── achievements.ts  # 成就数据
│   │   ├── cultivation.ts       # 修炼逻辑
│   │   ├── adventure.ts         # 机缘逻辑
│   │   ├── combat.ts            # 战斗逻辑
│   │   ├── balanceConfig.ts     # 数值平衡
│   │   ├── terminology.ts       # 术语系统
│   │   ├── quality.ts           # 品质系统
│   │   ├── items.ts             # 物品系统
│   │   └── offlineProcessor.ts  # 离线处理
│   └── text/                    # 文案系统
│       ├── types.ts
│       ├── textDefinitions.ts
│       ├── valueProviders.ts
│       └── textResolver.ts
│
└── storage/                      # 数据存储层
    └── database/                 # 数据库相关
        └── supabase-client.ts
```

---

## 三、组件开发规范

### 3.1 组件分类与放置

| 组件类型 | 放置位置 | 示例 |
|---------|---------|------|
| 游戏功能面板 | `components/game/` | `BattlePanel.tsx` |
| 页面级组件 | `components/pages/{module}/` | `WorldSelect.tsx` |
| 跨模块共享 | `components/shared/` | `Header.tsx` |
| UI 基础组件 | `components/ui/` | shadcn/ui 组件 |

### 3.2 组件命名规范

```
组件文件：PascalCase.tsx（如 BattlePanel.tsx）
Hook 文件：camelCase.tsx（如 useGameState.tsx）
工具函数：camelCase.ts（如 balanceConfig.ts）
类型文件：types.ts（统一命名）
数据文件：camelCase.ts（如 enemies.ts）
```

### 3.3 组件结构模板

```tsx
/**
 * 组件描述
 * 
 * 职责：[明确说明组件的单一职责]
 * 依赖：[列出依赖的 hooks/utils]
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ComponentProps {
  // 明确的 props 类型定义
}

export function ComponentName({ ...props }: ComponentProps) {
  // 1. Hooks 调用
  // 2. 派生状态
  // 3. 事件处理
  // 4. 渲染逻辑
}
```

---

## 四、模块开发规范

### 4.1 游戏模块（lib/game/）

每个模块必须：
1. **单一职责**：一个文件只做一件事
2. **统一导出**：在 `index.ts` 中添加导出
3. **类型定义**：所有类型放在 `types.ts`
4. **纯函数**：业务逻辑必须是纯函数，无副作用

### 4.2 模块职责划分

| 模块文件 | 职责 |
|---------|------|
| `types.ts` | 所有类型定义、接口、枚举 |
| `cultivation.ts` | 修炼、突破逻辑 |
| `adventure.ts` | 机缘秘境、地图探索 |
| `combat.ts` | 战斗逻辑 |
| `balanceConfig.ts` | 数值平衡、伤害计算 |
| `items.ts` | 物品数据、商店 |
| `techniques.ts` | 功法生成、管理 |
| `equipment.ts` | 装备生成、管理 |
| `realms.ts` | 境界配置数据 |
| `factions.ts` | 势力配置数据 |
| `achievements.ts` | 成就配置数据 |
| `terminology.ts` | 术语、多世界适配 |
| `offlineProcessor.ts` | 离线经验处理 |

### 4.3 数据文件（lib/game/data/）

静态配置数据统一放在 `data/` 目录：
- `enemies.ts` - 敌人名称池
- `events.ts` - 历练事件
- `techniques.ts` - 功法模板
- `equipment.ts` - 装备模板
- `realms.ts` - 境界配置
- `factions.ts` - 势力配置
- `achievements.ts` - 成就配置

---

## 五、状态管理规范

### 5.1 状态层级

```
全局游戏状态 → useGameState.tsx（单一数据源）
    ↓
功能 Hooks（按系统模块拆分）
    ├── useGameCultivation.ts     # 修炼系统
    ├── useGameAdventure.ts       # 机缘系统
    ├── useGameEquipment.ts       # 装备系统
    ├── useGameInventory.ts       # 背包系统
    ├── useGameCrafting.ts       # 炼制系统
    ├── useGameFaction.ts        # 势力系统
    ├── useGameAscension.ts      # 飞升系统
    └── useGameMessages.ts       # 消息系统
    ↓
组件本地状态 → useState（仅 UI 临时状态）
```

### 5.2 状态更新规则

- 所有游戏状态更新必须通过 `useGameState` 提供的方法
- 禁止组件直接修改状态对象
- 复杂操作封装在独立的 Hook 文件中

---

## 六、避免重复开发

### 6.1 开发前检查清单

在创建新组件/模块前，**必须**执行：

```
□ 搜索现有组件：grep_file("关键字", "src/components")
□ 搜索现有模块：grep_file("关键字", "src/lib/game")
□ 检查类型定义：read_file("src/lib/game/types.ts")
□ 检查统一导出：read_file("src/lib/game/index.ts")
□ 检查现有 Hook：read_file("src/hooks/useGameState.tsx")
```

### 6.2 复用优先原则

| 场景 | 行动 |
|------|------|
| 功能类似组件存在 | 扩展现有组件，通过 props 控制差异 |
| 通用逻辑存在 | 提取到 hooks 或 lib，多处复用 |
| 类型定义存在 | 导入现有类型，禁止重复定义 |
| UI 组件需要 | 优先使用 `components/ui/` |

### 6.3 禁止行为

- ❌ 创建功能重复的组件
- ❌ 在多个文件定义相同类型
- ❌ 直接修改 `components/ui/` 下的文件
- ❌ 在组件内硬编码业务逻辑
- ❌ 在 `lib/` 目录放置 React 组件

---

## 七、数值与配置规范

### 7.1 数值配置位置

| 配置类型 | 放置位置 |
|---------|---------|
| 战斗数值 | `balanceConfig.ts` |
| 势力配置 | `data/factions.ts` |
| 成就配置 | `data/achievements.ts` |
| 物品配置 | `items.ts` |
| 配方配置 | 各系统中 |

### 7.2 配置修改流程

1. **定位配置文件**：根据上述表格找到正确文件
2. **理解现有结构**：阅读现有配置项和注释
3. **遵循命名规范**：使用大写下划线命名常量
4. **添加类型注释**：每个配置项必须有 JSDoc 注释
5. **更新导出**：在 `index.ts` 添加导出（如需要）

---

## 八、代码风格

### 8.1 命名约定

```typescript
// 组件：PascalCase
export function BattlePanel() {}

// Hook：use 前缀 + PascalCase
export function useGameState() {}

// 函数：camelCase，动词开头
export function calculateDamage() {}
export function generateEnemy() {}

// 常量：UPPER_SNAKE_CASE
export const MAX_LEVEL = 100;

// 类型：PascalCase
export type EnemyTier = 'normal' | 'elite' | 'boss';
export interface BattleState {}
```

### 8.2 导入顺序

```typescript
// 1. React 相关
import { useState, useEffect } from 'react';

// 2. 第三方库
import { z } from 'zod';

// 3. 项目内部模块（@/ 别名）
import { Button } from '@/components/ui/button';
import { useGameState } from '@/hooks/useGameState';

// 4. 相对路径导入
import { LocalType } from './types';
```

---

## 九、禁止行为清单

| 行为 | 原因 |
|------|------|
| 在 `lib/game` 放置 React 组件 | 业务逻辑与 UI 分离 |
| 在 `components/ui` 添加自定义组件 | 使用 shadcn/ui 或放 shared |
| 重复定义类型 | 维护困难，类型不一致 |
| 组件内硬编码数值 | 无法调整，维护困难 |
| 直接修改 useGameState 状态对象 | 破坏状态不可变原则 |
| 创建未在 index.ts 导出的模块 | 隐藏依赖，难以追踪 |
| 跳过类型检查 | any 类型，运行时错误 |

---

## 十、文档目录

```
doc/
├── design/                      # 设计文档
│   ├── ascension-system-design.md    # 飞升系统设计
│   ├── attribute-system-design.md    # 属性系统设计
│   ├── numerical-design.md           # 数值策划
│   ├── text-system-design.md         # 文案系统设计
│   └── expansion-design.md           # 纵向深度扩展设计
│
└── review/                      # 评审文档
    └── code-review-plan.md          # 代码审查报告（P0 已解决）
```

---

## 十一、代码审查进度

**所有问题已解决** ✅

| 问题 | 状态 | 说明 |
|------|------|------|
| P0: 单体文件拆分 | ✅ 已解决 | 7 个 hooks 模块拆分完成 |
| P1: 重渲染风险 | ✅ 已处理 | 通过拆分降低风险 |
| P2: 代码行数精简 | ✅ 已处理 | useGameState.tsx 精简至 1512 行 |
| P3: 组件库规范化 | ✅ 已完成 | 使用 shadcn/ui (55 组件) |

详细审查报告见：`doc/review/code-review-plan.md`

---

## 十二、快速参考

### 常用文件路径

```
类型定义：src/lib/game/types.ts
统一导出：src/lib/game/index.ts
游戏状态：src/hooks/useGameState.tsx
主页面：src/app/page.tsx
主游戏组件：src/components/game/MainGame.tsx
数值配置：src/lib/game/balanceConfig.ts
```

### 快速搜索命令

```bash
# 搜索组件
grep_file("关键字", "src/components")

# 搜索模块
grep_file("关键字", "src/lib/game")

# 查看类型
read_file("src/lib/game/types.ts")

# 查看导出
read_file("src/lib/game/index.ts")
```

---

**重要**：每次开发任务开始前，AI Agent 必须先阅读此文件，并按照规范执行开发流程。
