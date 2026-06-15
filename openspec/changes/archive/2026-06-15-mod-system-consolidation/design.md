## Context

### 现状

Mod 系统有三块彼此脱节的代码：

| 代码位置 | 角色 | 状态 |
|----------|------|------|
| `core/mod/ModLoader.ts` | 浏览器 fetch 加载器 + `ModManifest` 类型 | 只被测试引用，生产未用 |
| `core/mod/ModManifest.ts` | ModManifest 类型定义 | 被 ModValidator 引用 |
| `app/api/init.ts` | 内联的 fs 加载逻辑 + 注册流程 | **这是实际运行的生产路径** |
| `app/api/mod-types.ts` | 复制了一份 `ModManifest` | 仅仅因为 `core/mod/ModLoader.ts` 含 fetch 无法在服务端 import |

当前生产流程：
```
app/api/init.ts:ensureWorldSystemInitialized()
  → discoverMods()           // fs 扫描 mods/
  → readManifest()           // fs 读取 mod.json
  → loadModFromDisk()        // 只处理 worldview 类型，其他跳过
  → registerWorldProviders()
  → registerBuiltinMechanics()
```

### 约束

- 不能破坏 `instrumentation.ts` → `ensureWorldSystemInitialized()` 的启动链
- 不能改变 `mods/` 目录结构或 Mod JSON 格式
- 不能影响 `modules/mod/ModInitProvider` 的客户端渲染
- 构建脚本 `build-mods.ts` 保持不动

## Goals / Non-Goals

**Goals:**

- 将类型定义统一到 `core/mod/ModManifest.ts`，删除 `app/api/mod-types.ts`
- 在 `core/mod/` 下提供服务端和客户端两个加载器实现
- 替换 `app/api/init.ts` 中的内联加载逻辑为 `ServerModLoader` 调用
- 修复内容类型遗漏：`attributes`、`races`、`talents`、`npcs`、`quests` 等全量注册
- 清理废弃的客户端代码

**Non-Goals:**

- 不改变 `mods/` 目录结构和 Mod JSON 格式
- 不改变 `scripts/build-mods.ts` 构建流程
- 不改变 `WorldViewRegistry` / `WorldMechanicsRegistry` 的 API
- 不改变 `modules/mod/ModInitProvider` 对外的 Context 接口
- 不引入新的外部依赖

## Decisions

### 决策 1：`core/mod/` 内部按文件区分实现

**选择：** `core/mod/` 下统一放所有加载器代码，用文件命名区分运行时：

```
core/mod/
├── types.ts                    ← 共享类型（IModLoader, ModContentType, LoadState）
├── ModManifest.ts              ← ModManifest 定义（无 I/O）
├── ModValidator.ts             ← 纯函数校验（已有，保留）
├── loader/
│   ├── index.ts                ← barrel 导出
│   ├── base-loader.ts          ← 基类：依赖排序、进度回调、错误汇总
│   ├── server-loader.ts        ← extends base-loader: fs 实现
│   └── client-loader.ts        ← extends base-loader: fetch 实现
└── index.ts
```

**理由：** 共享的依赖排序和错误处理逻辑放在 `base-loader.ts` 中避免重复。服务端/客户端各自只实现 I/O 层面的差异。

### 决策 2：服务端加载器全量处理所有内容类型

**选择：** `ServerModLoader` 遍历 `dataFiles` 处理 `mod.json` 声明的每个内容类型，而非仅 `worldview`。

**理由：** `wanjie-core/mod.json` 声明了 `attributes`、`races`、`talents`、`npcs`、`quests`，但当前 `app/api/init.ts` 只注册了 `worldview`。这意味着其他内容类型的数据被构建脚本复制到了 `public/mods/`，但从未被加载到注册中心。这是 bug 修复。

**注册方式：** 每种内容类型的注册目标不同：
| 内容类型 | 注册目标 |
|----------|----------|
| `worldview` | `WorldViewRegistry` |
| `attributes` | 未来对应的 `AttributeRegistry`（尚不存在时暂不注册，仅加载待用） |
| `races` / `talents` / `npcs` / `quests` | 暂不注册，保留数据在加载器内存中供后续扩展 |
| `styles` | `ClientModLoader` 处理 |

**安全措施：** 内容类型注册是幂等的；对于尚无对应 Registry 的类型，仅做数据结构校验和暂存，不写注册中心，不抛异常。

### 决策 3：分三阶段替换，每阶段可独立部署

**阶段 1 — 类型归一 + 新加载器实现（无行为变化）**
- 删除 `app/api/mod-types.ts`，统一到 `core/mod/ModManifest.ts`
- 重构 `ModManifest.ts`：提取 `IModManifest` 为 pure interface，移除 `ModLoader.ts` 中的 `fetch` 依赖，将 `ModLoadError`、`ModLoadCompleteEvent` 移到 `types.ts`
- 实现 `base-loader.ts`、`server-loader.ts`、`client-loader.ts`
- `app/api/init.ts` 不动

**阶段 2 — 替换服务端加载（风险阶段）**
- 用 `ServerModLoader` 替换 `app/api/init.ts` 中的内联加载函数
- 保持 `ensureWorldSystemInitialized()` 的导出签名不变
- 在 `core/server/mod-loader.ts`（或直接通过 `app/api/init.ts` 的 import）调用新加载器

**阶段 3 — 客户端加载 + 清理**
- 实现 `ClientModLoader` 连接 `public/mods/`
- 精简 `modules/mod/ModInitProvider`
- 清理废弃代码

### 决策 4：客户端加载器作为可选增强

**选择：** 客户端 `ClientModLoader` 独立加载主题/样式数据，不阻塞页面渲染。

**理由：**
- 服务端已经在启动时加载了核心数据，客户端不需要等待 Mod 加载才能渲染
- 主题/样式 Mod 加载失败不应阻止游戏运行
- `ClientModLoader` 通过 `fetch` 从 `public/mods/` 获取主题样式并注入 CSS
- 通过 `ModLoadPhase` 状态（`idle | loading | ready | error`）通知 UI

## Risks / Trade-offs

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| 阶段 2 替换 `app/api/init.ts` 导致启动失败 | **高** | 阶段 1 独立测试新加载器；阶段 2 先在 `ensureWorldSystemInitialized` 中并行运行新旧两套加载器做数据比对（校验模式），确认一致后再切换 |
| 内容类型全部加载后引发未预期的副作用 | 中 | 尚无对应 Registry 的类型仅暂存不注册，不影响现有逻辑 |
| 客户端 fetch 加载主题样式与现有主题逻辑冲突 | 低 | 客户端加载器作为新增能力，`ModInitProvider` 的 Context 接口不变，默认 fallback 到现有主题 |
| 删除 `app/api/mod-types.ts` 后其他地方直接引用它 | 低 | 搜索确认仅 `app/api/init.ts` 引用；统一类型后编译即检查 |
| 重构 `ModManifest.ts` 导致 ModValidator 测试失败 | 低 | `ModManifest` 的 data 结构不变，validator 只依赖接口字段 |

## Migration Plan

### 分步切换流程

```
当前状态：
  app/api/init.ts  = 实际加载 + 注册
  core/mod/        = 类型 + 校验 + (未使用的浏览器加载器)

步骤 1: 类型归一
  app/api/mod-types.ts → 合并到 core/mod/ModManifest.ts
  ModManifest.ts → 提取纯接口，移除 fetch 依赖

步骤 2: 实现新加载器
  core/mod/loader/base-loader.ts      ← 共享逻辑
  core/mod/loader/server-loader.ts    ← fs 实现
  core/mod/loader/client-loader.ts    ← fetch 实现

步骤 3: 并行验证
  app/api/init.ts 同时运行新旧两套加载
  比对结果（世界观列表、数量），确认一致

步骤 4: 切换
  app/api/init.ts → 改为调用 ServerModLoader
  删除旧的内联函数

步骤 5: 客户端 + 清理
  modules/mod/ → 接入 ClientModLoader 状态
  删除废弃组件
```

**回滚策略：** 阶段 2 切换后如发现问题，将 `app/api/init.ts` 回退到调用内联函数即可。两套加载器读同样的 `mods/` 目录，输出相同的数据结构。
