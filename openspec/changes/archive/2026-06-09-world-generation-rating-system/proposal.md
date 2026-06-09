## Why

当前世界系统存在两套并存且互不统合的加载路径：mod 动态加载世界类型（通过 `WorldDataRegistry`）和预生成的静态 JSON 世界模板（`data/worlds/` 目录）。同时，多处视图层存在硬编码的世界类型到视觉主题的映射，导致 mod 新增世界类型无法获得完整的视觉呈现。此外，`World` 接口的 `id` 和 `ratingScore` 字段虽已定义但从未实际使用，世界评分与复用机制完全缺失。此次改造旨在建立统一的世界来源抽象层，同时引入世界评分与混合选择机制，让 mod 世界和固化模板世界以同一套注入接口纳入游戏流程，消除所有硬编码映射。

## What Changes

- **新增 WorldProvider 注入接口**：定义统一的世界提供者契约，mod 世界生成器和固化模板加载器各自实现该接口，通过注册中心注入，游戏代码只依赖抽象接口
- **新增 WorldRating 评分系统**：玩家游玩后对世界进行评分（1-5星），评分数据持久化到 localStorage，影响世界在混合池中的权重
- **新增 WorldPool 混合选择引擎**：从已评分高分世界 + 随机新世界按可配置比例混合，产出最终的世界选择列表
- **新增 WorldIdentity 身份系统**：世界生成后拥有唯一 ID（基于类型+种子+时间戳），产出 JSON 快照，评分与快照关联
- **消除硬编码映射**：将 views/ 层中世界类型→图标/颜色/主题的硬编码映射迁移到 mod 数据或注册中心，支持 mod 世界注入完整视觉配置
- **Mod 世界模板支持**：mod 可声明 `worldTemplate: true` 表示这是一个固化世界模板（非随机生成），模板包含完整的预设世界数据（名称、势力、危险、机缘等）
- **重构世界选择流程**：`WorldSelect` 从 `WorldPool` 获取世界列表，而非从预生成 JSON 或硬编码数组
- **DEPRECATED**: `data/worlds/` 目录下的预生成 JSON 文件和 `AVAILABLE_WORLDS` 桶导出（改为通过 WorldProvider 加载）
- **DEPRECATED**: views/ 中的 `worldIcon`、`worldAccent`、`worldTheme`、`WORLD_ICONS`、`WORLD_COLORS`、`worldTypeConfig` 等硬编码映射

## Capabilities

### New Capabilities

- `world-provider-registry`: 世界提供者注册中心，定义 WorldProvider 接口，管理所有已注册的世界来源（mod 随机生成器、固化模板加载器），游戏代码仅通过注册中心获取世界列表
- `world-rating-system`: 世界评分系统，玩家完成一局游戏后可为世界评分（1-5星），评分持久化到 localStorage，支持更新评分，评分数据关联世界唯一 ID
- `world-pool-engine`: 世界混合池引擎，接收已评分世界和随机新世界的列表，按可配置的比例（如 60% 已评分高分 + 40% 随机新世界）混合产出最终世界选择列表，支持去重和排序策略
- `world-identity`: 世界身份系统，定义世界唯一 ID 生成规则（`{worldType}-{seed}-{timestamp}`），世界 JSON 快照导出格式，玩家评分与 ID 的关联存储

### Modified Capabilities

- `extensible-world-type`: WorldType 已从字面量联合改为 `string`，需确保所有消费方不再依赖硬编码的字面量类型，主题/图标/颜色等视觉配置改为从注册中心或 mod 数据动态获取
- `world-first-flow`: 世界选择流程从硬编码列表改为使用 WorldPool 混合引擎的输出，选择列表动态生成
- `world-mechanics-registry`: WorldMechanicsRegistry 需注册固化模板世界的预设 mechanics，而非仅从随机参数构建

## Impact

- **新增文件**: `src/shared/lib/world/provider/` (WorldProvider 接口 + 注册中心 + 实现)，`src/modules/world-rating/` (评分逻辑+状态+组件+数据)，`src/modules/world-pool/` (混合池逻辑)
- **修改文件**: `src/shared/lib/types.ts` (World/WorldProvider 类型扩展)，`src/modules/identity/logic/generators.ts` (生成器实现 WorldProvider 接口)，`src/modules/mod/` (mod 加载支持 worldTemplate)，`src/views/world-select/WorldSelect.tsx` (改为使用 WorldPool)，`src/views/game/WorldInfoPanel.tsx`、`src/views/game/WorldReveal.tsx`、`src/views/character-select/WorldInfoBar.tsx` (消除硬编码映射)
- **废弃文件**: `src/modules/identity/data/worlds/` 目录（预生成 JSON 及其桶导出），各 views/ 中的硬编码映射 map
- **Mod 影响**: `mods/wanjie-core/data/worlds.json` 需扩展（增加视觉配置字段），mod 可新增 `worldTemplate` 声明和 `templates/` 目录
