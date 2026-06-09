# 万界修行录

基于 Next.js 16 构建的文字多人修行 MUD 项目。玩家可在内置世界与 Mod 扩展世界中创建角色、选择背景、进入主循环，并体验修炼、探索、战斗、技艺、社交、飞升等系统。

## 项目特性

- 世界体系可扩展：当前提供一组内置世界，并支持通过 Mod 注册更多世界类型
- 多阶段流程：开始页 -> 世界选择 -> 角色创建 -> 背景故事 -> 主游戏
- 模块化系统：修炼、探索、战斗、技艺、经济、门派、社交、飞升、收藏等业务域拆分
- Mod 驱动世界数据：世界类型与部分配置通过注册中心和 Mod 初始化加载
- 静态导出部署：默认使用 `next export` 模式，可部署到 Vercel、GitHub Pages 等静态站点
- 前端技术栈：Next.js 16、React 19、TypeScript、Tailwind CSS 4、shadcn/ui、Vitest、ESLint

## 技术栈

- 框架：Next.js 16 App Router
- UI：React 19、Tailwind CSS 4、Radix UI、shadcn/ui
- 语言：TypeScript（strict）
- 数据与服务：Supabase
- 测试：Vitest、Testing Library、jsdom
- 构建工具：pnpm、tsx

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> 项目中的 Supabase 客户端会直接读取以上两个变量，未配置时会在运行时报错。

### 3. 启动开发环境

```bash
pnpm dev
```

默认访问：

```text
http://localhost:3000
```

## 常用命令

```bash
pnpm dev            # 启动开发服务器
pnpm build          # 生成静态构建
pnpm build:github   # 使用 /wanjie-MUD 作为 BASE_PATH 构建
pnpm start          # 本地预览 out 目录
pnpm lint           # ESLint 检查
pnpm lint:strict    # ESLint + 文件大小检查
pnpm ts-check       # TypeScript 类型检查
pnpm test           # 运行测试
pnpm test:watch     # 监听模式测试
pnpm test:coverage  # 生成覆盖率
pnpm build-mods     # 构建 Mod 相关产物
pnpm validate-mods  # 校验 Mod 数据
pnpm generate-world # 生成世界数据
pnpm check-sizes    # 检查文件大小约束
```

## 目录结构

项目遵循四层架构：

```text
src/
├── app/       # Next.js 路由入口，仅放 page.tsx / layout.tsx
├── views/     # 页面级视图，负责组合模块与管理界面状态
├── modules/   # 业务模块，按领域拆分 logic/hooks/components/data
└── shared/    # 公共组件、工具、配置、存储、基础设施
```

主要业务模块示例：

- `identity`：世界、角色、特质与生成逻辑
- `progression`：修炼、闭关、境界成长
- `exploration`：冒险、地城、事件链
- `combat`：战斗面板、敌人、克制与结算
- `techniques`：功法、技能、装备位管理
- `economy`：货币、商店、商品刷新
- `faction`：阵营、宗门、任务推进
- `social`：公告、聊天室、排行榜
- `ascension`：飞升、天劫、Meta 树
- `theme` / `mod`：主题样式与 Mod 初始化

## 页面流程

- `/`：开始页，支持新游戏与导入存档
- `/world-select`：选择世界类型
- `/character-select`：创建角色
- `/backstory`：背景与世界叙事
- `/game`：主游戏界面

## 部署说明

项目已启用静态导出配置：

- `output: 'export'`
- `trailingSlash: true`
- 生产环境支持通过 `BASE_PATH` 控制部署子路径

### GitHub Pages

```bash
pnpm build:github
```

该命令会以 `BASE_PATH=/wanjie-MUD` 构建静态资源，适合仓库名与站点子路径一致的 GitHub Pages 部署方式。

### 其他静态托管

```bash
pnpm build
```

构建完成后，静态文件位于 `out/` 目录。

## 开发约定

- 使用 pnpm 作为包管理器
- 新增代码遵循四层架构与模块边界
- `modules/<domain>/logic/` 保持纯函数，不引入 React 或副作用
- 跨模块写操作通过事件总线，不直接修改其他模块状态
- 组件、Hook、逻辑文件需遵守项目内文件大小限制

## 授权

本项目使用 [MIT License](./LICENSE)。
