# 架构决策记录

## 设计原则

- **五层架构**: 代码按职责分为 app/ → views/ → modules/ → core/ → shared/ 五层，每层有明确的依赖方向
- **内容唯一**: 同一份内容只在一个位置存在，禁止复制粘贴代码
- **纯函数优先**: 业务逻辑是纯函数（同入同出、无副作用、无 Math.random()）
- **事件驱动**: 跨模块通信通过事件总线，避免直接耦合
- **Registry 模式**: 可扩展内容通过注册中心管理，替代硬编码和 switch-case
- **确定性生成**: seed 驱动，相同输入永远返回相同输出

## 核心概念

### 五层架构

```
src/
├── app/       ← ① 路由层 — Next.js App Router 页面
├── views/     ← ② 视图层 — 页面级组件，组合模块 Panel
├── modules/   ← ③ 模块层 — 19 个自包含业务域
├── core/      ← ④ 核心层 — 游戏基础设施
└── shared/    ← ⑤ 公共层 — 跨模块工具性代码
```

**依赖方向**: `app → views → modules → core → shared`（上层依赖下层，不允许反向）

### 核心系统架构

```
core/
├── events/        ← 事件驱动通信系统
│   ├── eventBus.ts       — GameEventManager 单例
│   ├── eventRegistry.ts  — 事件类型注册
│   ├── eventMatcher.ts   — 事件匹配器
│   └── patternMatcher.ts — 模式匹配
│
├── calculation/   ← 统一数值计算引擎
│   ├── calculator/       — 计算器核心
│   ├── adapters/         — 适配器（将各系统效果转为统一格式）
│   ├── boundary/         — 边界检查
│   ├── effect/           — 效果注册与处理
│   └── coreStatFormulas.ts — 核心值公式
│
├── world/         ← 世界系统
│   ├── calculateCoreStats.ts  — 核心值计算
│   ├── generateWorld.ts       — 世界生成
│   ├── WorldPoolEngine.ts     — 世界池管理
│   └── WorldProviderRegistry.ts — 世界提供者注册
│
├── registry/      ← 数据注册中心
│   ├── WorldViewRegistry.ts    — 世界观注册
│   ├── AttributeRegistry.ts    — 属性注册
│   ├── RaceRegistry.ts         — 种族注册
│   ├── TalentRegistry.ts       — 天赋注册
│   └── WorldMechanicsRegistry.ts — 世界机制注册
│
├── types/         ← 核心类型定义
│   ├── types.ts         — 核心类型
│   └── typesExtension.ts — 扩展类型
│
├── mod/           ← Mod 系统
│   ├── ModLoader.ts    — Mod 加载
│   ├── ModValidator.ts — Mod 验证
│   └── ModManifest.ts  — Mod 清单
│
├── engine/        ← 引擎集成层
│   ├── gameSystems.ts    — 游戏系统编排
│   ├── expansionLogic.ts — 扩展逻辑
│   └── messageDB.ts      — 消息数据库
│
├── time/          ← 时间系统
│   ├── gameClock.ts     — 游戏时钟
│   ├── cooldown.ts      — 冷却管理
│   ├── offlineProcessor.ts — 离线处理
│   └── timerService.ts  — 计时器服务
│
└── logger/        ← 日志系统
    └── logger.ts       — 结构化日志
```

### 前后端分离

项目采用前后端分离架构——所有游戏逻辑在 Next.js API 路由中执行，前端只负责展示：

```
前端（浏览器）                  后端（Next.js API）
┌─────────────┐              ┌──────────────────┐
│ views/      │  HTTP/JSON   │ /api/v1/          │
│ modules/*   │ ──────────▶  │ ├── worldviews/   │
│ components/ │              │ ├── characters/   │
│             │ ◀──────────  │ ├── worlds/       │
│ 只负责渲染  │   响应数据     │ ├── backstory/    │
└─────────────┘              │ └── status/       │
                             └──────────────────┘
```

关键 API 端点：
- `POST /api/v1/characters/templates` — 生成 8 个角色模板
- `POST /api/v1/characters/save` — 保存角色
- `GET /api/v1/characters/[seed]` — 获取角色数据
- `POST /api/v1/backstory/generate` — 生成背景故事
- `POST /api/v1/worlds/generate` — 生成世界
- `POST /api/v1/worlds/generate/details` — 世界详情
- `GET /api/v1/worldviews` — 获取世界观列表

### 关键架构决策

#### 决策 1: 从硬编码 WorldType 到 Registry 模式

**决策内容**: WorldType 从 `type WorldType = '修仙' | '高武' | ...` 硬编码联合类型改为 `type WorldType = string`，通过 WorldViewRegistry 管理

**理由**: 支持 Mod 扩展新的世界观类型，无需修改核心代码

**替代方案**: 维持联合类型 + 集中映射表（限制了扩展性，每次新增需改核心代码）

**变更**: `2026-06-11 worldview-registry-unification`

#### 决策 2: 从单层目录到五层架构

**决策内容**: 将原先集中在 `src/lib/`、`src/hooks/`、`src/components/game/` 的代码按职责拆分为五层

**理由**: 旧架构中 `src/lib/` 占比 56.6%（201 个文件）、`src/hooks/useGameState.tsx` 2552 行，难以维护；五层架构明确每层职责，降低认知负担

**替代方案**: 维持现状（不可维护）、按功能垂直拆分（跨模块耦合风险）

**变更**: 一系列架构相关 Change（`domain-refactoring`、`extract-core-systems` 等）

#### 决策 3: 事件驱动的跨模块通信

**决策内容**: 跨模块写入通过 `GameEventManager` 事件总线，而非直接 import 其他模块的 state

**理由**: 解耦模块间依赖，避免循环依赖（旧架构中 `lib → hooks` 存在违规引用）

**替代方案**: 直接调用对方模块的 setState（产生耦合）、中心化 Redux 模式（太重，与 React Context 不兼容）

**变更**: `2026-06-10 refactor-event-bus`、`event-registry`、`event-pattern-matching`

## 模块映射

| 概念 | 代码位置 | 说明 |
|------|----------|------|
| 路由层 | `src/app/` | Next.js page.tsx + API routes |
| 视图层 | `src/views/` | 页面级组件 |
| 模块层 | `src/modules/` | 19 个业务域 |
| 核心系统 | `src/core/` | 基础设施 |
| 公共工具 | `src/shared/` | 通用代码 |
| 事件总线 | `src/core/events/eventBus.ts` | GameEventManager |
| 计算引擎 | `src/core/calculation/` | 统一数值计算 |
| Mod 系统 | `src/core/mod/` | Mod 加载/验证 |
| 日志系统 | `src/core/logger/logger.ts` | 结构化日志 |
| 时间系统 | `src/core/time/` | 游戏时钟/离线处理 |

## 相关文档

| 来源 | 说明 |
|------|------|
| `doc/architecture/module-map.md` | 模块地图详细（源文档，已迁移） |
| `doc/architecture/analysis-report.md` | 架构分析报告（源文档，已迁移） |
| `doc/architecture/optimization-roadmap.md` | 优化路线图 |
| `openspec/changes/2026-06-09-domain-refactoring/` | 领域重构变更 |
| `openspec/changes/2026-06-10-extract-core-systems/` | 核心系统提取变更 |
| `openspec/changes/2026-06-10-refactor-event-bus/` | 事件总线重构变更 |
| `openspec/changes/2026-06-11-worldview-registry-unification/` | 世界观注册中心统一变更 |
| `.claude/rules/core.md` | 核心约束规则 |
| `.claude/rules/modules.md` | 模块开发规范 |
| `.claude/rules/data-flow.md` | 数据流规范 |
