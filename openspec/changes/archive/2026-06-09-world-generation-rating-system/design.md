## Context

当前世界系统有两套并存的加载路径，且数据结构设计不统一：

- **Mod 随机生成器**：`WorldDataRegistry` 注册 `WorldTypeData`（"配方"——名称前缀后缀池、描述池、危险机缘池） → `generateWorld(seed)` 从池中随机组合 → 产出 `World` 实例
- **固化世界模板**：`data/worlds/world_<seed>.json` 预生成 JSON 文件 → `AVAILABLE_WORLDS` 桶导入 → 直接作为 `World` 实例

**核心问题**：`WorldTypeData` 是配方（含池/数组用于随机选取），而固化模板应该是"成品世界"（所有字段为确定值）。两套数据结构完全不同：

| | 配方 WorldTypeData | 成品 WorldTemplate |
|---|---|---|
| 名称 | 前缀池 + 后缀池（随机拼接） | 固定的完整名称 |
| 描述 | 描述池（随机选取） | 固定的长描述 |
| 势力 | 势力描述池（随机选取） | 确定的具体势力列表 |
| 危险 | 危险池（按类型过滤） | 确定的具体危险实例 |
| 机缘 | 机缘池（按类型过滤） | 确定的具体机缘实例 |
| 剧情 | 无 | 可指定特殊剧情引用 |

这两套路径互不统合，`WorldSelect` 视图层需要自己决定从哪里拿数据。更严重的是，views/ 中有多处硬编码映射（世界类型 → 图标/颜色/主题），mod 新增的世界类型无法获得完整视觉呈现。

此外，`World` 接口的 `id` 和 `ratingScore` 字段已定义但从未实际使用——没有唯一的身份标识，评分无法关联到具体世界实例。同时，项目缺乏统一的游戏版本概念（`package.json` 的 `0.1.0` 未被代码引用），固化模板无法标记其创建时的游戏版本，当游戏数据结构升级后可能出现不兼容。

## Goals / Non-Goals

**Goals:**
- 建立统一的 `WorldProvider` 注入接口，让 mod 随机生成器和固化模板加载器以同一套契约提供世界数据
- 世界提供者通过注册中心注入，游戏代码只依赖抽象接口，不存在硬编码的世界来源
- 建立世界唯一身份 ID 系统，世界生成后产生确定性 ID 和 JSON 快照
- 建立世界评分系统，玩家可对游玩过的世界评分，评分持久化到 localStorage
- 建立世界混合池引擎，按可配置比例混合高分已有世界和随机新世界
- 消除 views/ 层所有硬编码的世界类型→视觉配置映射，改为从注册中心或 mod 数据动态获取

**Non-Goals:**
- 不涉及世界本身的 game logic 修改（战斗/修炼逻辑不在范围内）
- 不涉及 Supabase/远程数据库的评分存储（仅 localStorage）
- 不改变飞升系统的核心逻辑（`AscensionLogic` 的 `generateNewWorld` 仅接入新架构）
- 不改变 mod 加载流程本身（`ModLoader` 的行为不变，只新增 worldTemplate 支持）

## Decisions

### Decision 1: WorldProvider 接口设计 — 双模式

**选择**：定义 `WorldProvider` 接口，通过 `type` 区分两种生成模式。两种模式消费不同的源数据但产出统一的 `World` 实例。

```typescript
interface WorldProvider {
  id: string;
  name: string;
  type: 'random' | 'template';
  generateWorld(seed: string, ascensionCount: number): World;
  generateWorlds(seeds: string[], ascensionCount: number): World[];
  getMetadata(): WorldProviderMetadata;
}

interface WorldProviderMetadata {
  id: string;
  name: string;
  type: 'random' | 'template';
  worldCount: number;     // template 为固定数量，random 为 -1 表示无限
  worldTypes: string[];   // 涵盖的世界类型
  templateIds?: string[]; // template 类型时，列出所有模板 ID
}
```

**random 类型 provider 的数据流**：
```
WorldDataRegistry (WorldTypeData[] 配方)
  → ModRandomWorldProvider.generateWorld(seed)
    → 从 WorldTypeData 的名称池中随机选取前缀+后缀 → 拼出世界名称
    → 从描述池中随机选取一条描述
    → 从势力池中随机生成势力列表
    → 从危险/机缘池中按世界类型过滤后随机选取
    → 组装 World 实例
```

**template 类型 provider 的数据流**：
```
mod/templates/worlds/*.json (WorldTemplate[] 成品)
  → TemplateWorldProvider.generateWorld()
    → 直接读模板中的 world 字段（已确定的所有值）
    → 忽略 seed 参数（模板是确定性的）
    → 只需分配 id（由 identity 系统生成）
    → 组装 World 实例（ratingScore 初始为 0）
```

**替代方案**：
- 每个 world 一个 provider → 太重，mod 加载后会有大量 provider，注册开销大
- provider 返回 Promise → 所有数据都是同步获取（mod 数据已加载到内存），不需要异步
- 统一用配方模式表示模板（即模板被转为"只有一个选项的池"）→ 扭曲语义，且无法表示模板特有的 protected/tags/specialPlot 等元数据

**理由**：一个 provider 代表一个"世界来源"。wanjie-core mod 的随机生成器是一个 provider（type='random'），每个含 worldTemplate 的 mod 各自是一个 provider（type='template'）。两种 provider 产出相同形状的 `World` 实例，但内部构造逻辑完全不同。

### Decision 2: 世界唯一 ID 生成规则

**选择**：分层组合 ID，不同来源有不同的 ID 格式。

```
随机生成世界: {providerId}:{worldType}:{seed}
  示例: "wanjie-core:修仙:a0b1c2d3"
  
固化模板世界: {providerId}:tpl:{templateId}
  示例: "wanjie-template:tpl:huanjing"
```

**理由**：
- 包含 providerId 避免不同 mod 提供同类型世界的 ID 冲突
- 随机世界用 seed 保证确定性（同一 seed 总是产出同一世界）
- 模板世界用 templateId 标识具体模板
- 使用 `:` 分隔便于解析和调试

### Decision 3: 游戏版本概念与兼容性检查

**选择**：定义统一的游戏版本号常量，世界模板和世界快照记录其创建时的游戏版本，加载时进行兼容性检查。

```typescript
// src/shared/config/version.ts

/** 当前游戏版本号（与 package.json 同步，semver 格式） */
export const GAME_VERSION = '0.1.0';

/** 版本号解析结果 */
interface SemverParts {
  major: number;
  minor: number;
  patch: number;
}

/** 解析 semver 字符串 */
function parseSemver(version: string): SemverParts;

/**
 * 检查世界模板版本是否与当前游戏版本兼容。
 *
 * 兼容性规则：
 * - 主版本号不同 → 不兼容（数据结构可能有 breaking changes）
 * - 主版本号相同，次版本号不同 → 兼容但标记为"可能需要更新"
 * - 主版本号和次版本号相同 → 完全兼容
 *
 * @param templateVersion - 模板创建时的游戏版本
 * @returns 兼容性结果
 */
function checkWorldTemplateCompatibility(
  templateVersion: string
): 'compatible' | 'needs-update' | 'incompatible';
```

**版本在各处的应用**：

| 位置 | 版本字段 | 作用 |
|------|----------|------|
| `package.json` | `version: "0.1.0"` | 发布版本，构建时使用 |
| `src/shared/config/version.ts` | `GAME_VERSION` | 代码中引用的权威来源，构建脚本同步自 package.json |
| `WorldTemplate` | `gameVersion` | 记录模板创建时的游戏版本（必填） |
| `World` 快照 | `gameVersion` | 记录世界生成时的游戏版本（自动填入 `GAME_VERSION`） |
| `ModManifest` | `gameVersion` | 已存在，mod 声明兼容的游戏版本范围（如 `">=0.1.0"`） |

**WorldTemplate 的 gameVersion 字段**：
```typescript
interface WorldTemplate {
  id: string;
  gameVersion: string;  // 必填，模板创建时的游戏版本
  world: Omit<World, 'id' | 'ratingScore'>;
  // ...
}
```

**加载时的兼容性处理**：
- `compatible`：正常加载，无警告
- `needs-update`：正常加载，但世界卡片上显示"可能需要更新"提示（黄色标签）
- `incompatible`：仍加载（不阻塞），但世界卡片标记为"版本不兼容"（红色标签），玩家可选择尝试但可能遇到数据问题

**理由**：
- 主版本号变更意味着数据结构 breaking changes（如 World 接口字段增删），旧模板可能缺少新字段或包含废弃字段
- 采用"不阻塞不兼容模板"策略，因为大部分情况下旧模板仍可游玩（最多差一些新特性），由玩家自行决定是否尝试
- `package.json` 作为版本权威来源，构建脚本自动同步到 `GAME_VERSION` 常量，避免手动维护不一致
- 渐进式设计：当前 `0.1.0`，1.0.0 之前均视为兼容（开发阶段容忍差异）

**替代方案**：
- 版本号存在 `package.json`，代码动态 `import` → Next.js 静态导出不支持动态读 package.json，需要构建时注入
- 不允许不兼容模板加载 → 太严格，mod 作者更新有滞后，玩家应有选择权
- 全自动迁移 → 过度设计，目前仅需检测+提示

### Decision 4: WorldProvider 注册与 mod 集成

**选择**：`WorldProviderRegistry` 作为新注册中心，mod 加载完成后，`ModLoader` 调用 `registerBuiltinProviders()` 自动从已注册的 `WorldDataRegistry` 创建对应的 provider。

```
ModLoader.loadAll()
  → WorldDataRegistry 被填充（现有流程不变）
  → registerBuiltinMechanics()（现有流程不变）
  → registerWorldProviders() **NEW**
    → 遍历 WorldDataRegistry 中所有世界类型
    → 为每个随机生成世界类型创建一个 ModRandomWorldProvider
    → 检查 mod 的 worldTemplate 声明，为每个模板创建 TemplateWorldProvider
    → 所有 provider 注册到 WorldProviderRegistry
```

**理由**：不影响现有 mod 加载流程，仅在其末尾追加 provider 注册步骤。Provider 是"理解"层——它理解如何从 mod 数据构造 World 实例，而不是 mod 数据本身。

### Decision 5: 固化模板与随机配方的数据结构分离

**关键认知**：`WorldTypeData`（当前存在于 `WorldDataRegistry`）是"配方"——包含名称前缀/后缀池、描述池、力量体系池、危险池等，供随机生成器从中随机组合。固化模板则是"成品世界"——所有字段都是确定值，不需要随机选择步骤。

两者的数据结构应明确区分：

```typescript
// === 配方（已存在，用于随机生成）===
// WorldTypeData: 包含池/数组字段，随机生成时从中选取
interface WorldTypeData {
  id: string;
  name: string;
  description: string;
  baseCoefficient: number;
  namePrefixes: string[];       // 池：从中随机选取前缀
  nameSuffixes: string[];       // 池：从中随机选取后缀
  descriptions: string[];       // 池：从中随机选取描述
  powerSystems?: string[];      // 池：从中随机选取力量体系
  majorForces?: string[];       // 池：从中随机选取势力描述
  dangers?: WorldImpactData[];  // 池：从中随机选取危险
  opportunities?: WorldImpactData[]; // 池：从中随机选取机缘
  stats?: WorldStatsData;
  builtin?: boolean;
  mechanics?: Record<string, unknown>;
}

// === 成品（新增，固化模板直接提供）===
// WorldTemplate: 所有字段为确定值，等价于一个已经生成好的 World
interface WorldTemplate {
  id: string;                               // 模板唯一 ID
  gameVersion: string;                      // 模板创建时的游戏版本（必填，semver 格式）
  world: Omit<World, 'id' | 'ratingScore'>; // 完整的世界数据（不含 id，由 identity 系统分配）
  // 以下为模板特有的元数据字段（World 接口中不存在的）
  protected?: boolean;                      // 是否锁定评分（不被低分淘汰）
  tags?: string[];                          // 模板标签（"新手友好"、"高难"等）
  author?: string;                          // 模板作者
  previewText?: string;                     // 预览文案
}
```

**WorldTemplate 中 world 字段与随机生成 World 的差异**：
- `name`：确定的完整名称（如"暗黑深渊"），而非从前缀后缀池拼接
- `description`：确定的长描述文本，而非从描述池中选取
- `factions`：确定的具体势力列表（`WorldFaction[]`），每个势力有确定的 name/type/description
- `dangers`：确定的具体危险实例（`WorldDanger[]`），而非从危险池过滤
- `opportunities`：确定的具体机缘实例（`WorldOpportunity[]`），而非从机缘池过滤
- `powerSystem`：确定的力量体系描述文本
- `realmSystem`：可选的境界体系覆盖（不提供则使用世界类型的默认境界体系）
- `specialPlot`：可选的特定剧情引用（模板世界的核心特色）

**替代方案**：
- 模板直接复用 `World` 类型 → 不行，因为 World 接口中有 `ratingScore: number` 和 `id: string` 这两个由系统分配的字段，且模板需额外元数据（protected、tags 等）
- 模板定义为 `Partial<World>` → 不行，模糊了"成品"和"配方"的边界，导致消费方需要处理可选字段

**理由**：`WorldTemplate.world` 是一个"即用型" `World` 减去系统分配的字段（id 由 identity 系统生成，ratingScore 由评分系统统计）。模板作者的职责是提供一个完整的、精心设计的世界内容，系统的职责是赋予它身份和追踪评分。

### Decision 6: mod 固化模板的文件组织

**选择**：模板放在 mod 的 `templates/worlds/` 目录下，每个 JSON 文件一个模板：

```
mods/my-mod/
├── mod.json
├── data/
│   └── worlds.json          ← 世界类型配方（WorldTypeData[]，用于随机生成）
└── templates/
    └── worlds/
        ├── dark-realm.json   ← 固化成品世界（WorldTemplate）
        └── lost-forest.json  ← 固化成品世界（WorldTemplate）
```

`mod.json` 中声明模板目录：

```json
{
  "id": "my-world-mod",
  "contentTypes": ["world"],
  "worldTemplates": ["dark-realm", "lost-forest"]
}
```

**理由**：
- `data/worlds.json`（配方）与 `templates/worlds/*.json`（成品）在物理上分离，语义清晰
- 模板 JSON 可能很大（包含完整的 danger/opportunity 实例），独立文件便于编辑
- `worldTemplates` 数组注册模板 ID，加载时按 ID 查找对应 JSON 文件
- 配方提供"无限"的随机世界，模板提供"有限"的精选世界——两者互补

### Decision 7: 世界评分的存储结构

**选择**：评分存储在 localStorage，key 为 `world-ratings`：

```typescript
interface WorldRatingsStore {
  [worldId: string]: {
    totalScore: number;    // 累计评分（用于计算平均分）
    ratingCount: number;   // 评分次数
    lastRated: number;     // 最后评分时间戳
    comments?: string[];   // 可选评价文本
  }
}
```

**理由**：
- localStorage 足够（单个世界评分数据 < 1KB，数百个评分总共 < 100KB）
- 不需要 Supabase 远程存储（游戏是离线优先的静态导出应用）
- 存储平均分需要的分子和分母，而非每次重新计算

### Decision 8: 混合池比例策略

**选择**：可配置的两级比例。

```typescript
interface WorldPoolConfig {
  // 第一级：来源比例
  sourceRatio: {
    rated: number;    // 已评分高分世界占比，默认 0.6
    random: number;   // 随机新世界占比，默认 0.4
  };
  // 第二级：随机来源内部比例
  randomSourceRatio: {
    modRandom: number;    // mod 随机生成器占比，默认 0.7
    modTemplate: number;  // mod 固化模板占比，默认 0.3
  };
  // 高分阈值
  highScoreThreshold: number;  // 平均评分 >= 此值才算"高分"，默认 3.5
  // 总池大小
  poolSize: number;  // 最终产出世界数量，默认 8
}
```

**理由**：
- 两级比例让 mod 作者和玩家（通过配置）都能控制体验
- 已评分世界确保好内容被复现，随机世界确保新鲜感
- 固化模板提供精制内容，随机生成提供多样性

### Decision 9: 消除硬编码视觉映射

**选择**：在 `WorldDataRegistry` 的 `WorldTypeData` 中新增 `visualConfig` 字段：

```typescript
interface WorldVisualConfig {
  icon: string;           // emoji 或图标标识
  accentColor: string;    // CSS 颜色值
  gradientClass: string;  // Tailwind 渐变类名
  theme?: ThemeOverrides; // 主题 CSS 变量覆盖
}
```

各 views/ 中的硬编码映射迁移为读取 `WorldDataRegistry.getInstance().getWorldType(type)?.visualConfig`。

**替代方案**：
- 创建单独的 `WorldVisualRegistry` → 过度设计，视觉配置天然属于世界类型定义的一部分
- 保留硬编码作为 fallback → 违背了"mod 世界可获得完整视觉呈现"的目标

**理由**：视觉配置和世界类型配置一起放在 mod 数据中是自然的——mod 作者决定世界的外观。如果 mod 未提供 visualConfig，使用通用默认视觉（灰度中性色 + 通用图标），而不是硬编码映射到某个已存在的世界。

## Risks / Trade-offs

- **[兼容性]** localStorage 中的评分数据格式升级需要 migration → 使用版本号字段，读取时检查版本并执行迁移
- **[性能]** 大量 mod 注册（数十个 worldTemplate）时 provider 遍历可能变慢 → provider 只生成被选中的世界（懒生成），不在注册时预生成所有 World 实例
- **[冲突]** 两个 mod 注册了相同 providerId → 在注册时检测冲突，后注册的发出警告并覆盖
- **[去重]** 同一个 seed 的随机世界可能被多个玩家评分 → 去重逻辑在世界池外（评分时即按 worldId 聚合）
- **[模组作者体验]** mod 作者需要写完整的 World JSON 模板（包含 dangers、opportunities 等）→ 提供 validate 脚本，mod 打包时自动校验

## Migration Plan

1. **Phase 1**：新增核心接口和注册中心（`WorldProvider`, `WorldProviderRegistry`, `WorldIdentity`），不影响现有流程
2. **Phase 2**：实现两个内置 provider（`ModRandomWorldProvider` 对接现有 `generateWorld`，弃用 `AVAILABLE_WORLDS`），`WorldSelect` 切换到使用 provider
3. **Phase 3**：实现评分系统（UI + localStorage 存储），游戏结束/飞升后展示评分入口
4. **Phase 4**：实现混合池引擎，替换 `WorldSelect` 的简单列表为混合结果
5. **Phase 5**：消除 views/ 硬编码映射，迁移到 `WorldDataRegistry.visualConfig`
6. **Phase 6**：扩展 mod 格式支持 `worldTemplate`，实现 `TemplateWorldProvider`

**回滚策略**：每个 Phase 独立可回滚。Phase 1 的接口定义不影响运行时行为，Phase 2 保留 `AVAILABLE_WORLDS` 的 barrel re-export（标记 deprecated）直到 Phase 4 稳定。

## Open Questions

1. 评分是否应该影响世界在混合池中的权重连续地（按分数比例），还是二值地（高分/非高分）？当前设计采用二值方式（阈值），可后续改为连续权重。
2. 固化模板世界被评分后，同一模板再次被选中时，之前生成的那个 worldId 是否复用？当前设计为复用（因为 worldId 相同），这意味着评分是针对"模板在世界池中的表现"。
3. 是否需要支持 mod 作者锁定某世界的评分（如官方精选世界不允许低分将其淘汰）？当前设计未涵盖，可在 `WorldTemplate` 接口中新增 `protected: boolean` 字段后续扩展。
