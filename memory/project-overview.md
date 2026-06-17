---
name: project-overview
description: 万界修行录项目概要 — 技术栈、架构、关键约束
metadata:
  type: project
---

# 万界修行录 (Wanjie Cultivation Record)

Next.js 16 文字类多人修仙 MUD 游戏，支持 8 种世界类型。

## 技术栈
- Next.js 16 (App Router) + TypeScript 严格模式
- React 19 + Tailwind CSS + shadcn/ui
- Supabase (数据持久化)
- Vitest (测试) + ESLint (代码检查)
- pnpm (包管理)

## 五层架构
```
src/
├── app/       ← ① Next.js 路由入口
├── views/     ← ② 页面组件
├── modules/   ← ③ 功能模块（20+ 业务域）
├── core/      ← ④ 核心系统（事件、计算、世界、注册、服务端、Mod、引擎）
└── shared/    ← ⑤ 公共工具（AI、WebSocket、cn、logger）
```

## 关键约束
- 同一份内容只在一处存在，禁止复制粘贴
- modules/<domain>/logic/ 纯函数，无 React/无副作用
- core/ 不依赖 modules/，不包含 React 组件
- 文件大小硬约束：组件 ≤300行，Hook ≤200行，logic ≤500行
- 禁止 any 类型
- 旧目录（hooks/、lib/、contexts/、components/game/）不要新增文件

**Why:** 项目处于从旧架构向五层架构迁移的过渡期，需要严格遵守架构约束。
**How to apply:** 每次新增或修改代码前，先确定文件应放在五层架构的哪一层。
