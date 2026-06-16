## Why

当前属性系统存在四个根本性问题：(1) `BaseStats` 的 5 个属性（体质/灵根/悟性/幸运/意志）以中文字符串硬编码为 JS 属性名，散落在 25 个源文件中，导致不同世界观无法拥有真正不同的属性集合——科技世界的"灵根"只是改了个显示名，底层仍然存在；(2) 角色生成使用 `Math.random()` 无种子，无法持久化和跨玩家复用；(3) 种族、天赋与属性系统耦合在代码逻辑中，无法作为 Mod 独立扩展；(4) 初始数值基数过高（全 50），后期战力膨胀后数值失去意义。

## What Changes

- **属性（Attribute）与核心值（CoreStat）分层解耦**：属性为世界观可变层（Mod 定义），核心值为世界通用层（固定 11 维战斗/养成维度），两者通过世界观中声明的映射公式关联
- **属性系统完全 Mod 驱动**：`WorldviewDefinition.stats` 从现有 `statDisplayNames`（改名映射）扩展为 `attributeDefinitions`（属性定义列表），每个属性包含 key、displayName、baseValue、category 及到核心值的 calculation 映射。**BREAKING**: 移除 `BaseStats`、`GrowthStats` 硬编码接口，改为 `Record<string, number>` + 元数据
- **核心值固定为 11 维**：HP / 物攻 / 特攻 / 物防 / 特防 / 速度 / 智力 / 毅力 / 寿命 / 感知 / 专项数值上限。战斗和养成公式统一消费核心值，不再引用具体属性名
- **新增种族（Race）Mod 内容类型**：种族定义基础属性加成、天赋池、天生能力，通过 `worldview.racePool` 加载
- **新增天赋（Talent）Mod 内容类型**：天赋与种族关联，定义属性或核心值修正，支持稀有度
- **角色 Seed 系统**：角色生成基于 seeded RNG（worldSeed 确定 8 个模板，用户选择后生成 characterSeed），角色持久化到 SQLite `characters` 表，预留跨玩家遭遇扩展点
- **数值重平衡（BG3 风格）**：属性基值从 50 降至 8，词条加成从 +2~12 压缩至 +1~3，核心值初始保持两位数级别，成长曲线拉伸
- **CRPG 对话检定**：剧情选项支持对属性或核心值进行 d20 检定

## Capabilities

### New Capabilities
- `attribute-corestat-decoupling`: 属性与核心值两层分离，属性 Mod 驱动，核心值固定 11 维，世界观定义映射公式
- `character-seed-system`: 角色生成基于 seeded RNG，worldSeed 确定模板，characterSeed 确定最终角色，持久化到 SQLite
- `race-mod-content-type`: 种族作为独立 Mod 内容类型，定义属性加成、天赋池、天生能力
- `talent-mod-content-type`: 天赋作为独立 Mod 内容类型，关联种族，定义属性/核心值修正
- `crpg-dialogue-checks`: 对话检定系统，支持属性检定和核心值检定的 d20 机制

### Modified Capabilities
- `worldview-registry`: `WorldviewDefinition.stats` 结构从 `statDisplayNames` 改为 `attributeDefinitions` + `coreStatFormulas`
- `world-generation-api`: 世界生成时需携带 `attributeDefinitions` 和 `coreStatFormulas` 到前端
- `core-systems-foundation`: 移除 `BaseStats`/`GrowthStats` 硬编码类型，`CharacterStats` 改为动态结构

## Impact

- **core/types/types.ts**: 移除 BaseStats/GrowthStats 接口，CharacterStats 重构为动态结构，新增 CoreStat、Attribute 相关类型
- **core/calculation/**: 计算引擎适配动态属性→核心值映射，STAT_NAME_MAP 重构
- **core/registry/WorldViewRegistry.ts**: WorldviewDefinition 扩展 attributeDefinitions、coreStatFormulas、racePool、talentPool
- **modules/identity/**: 角色生成器改用 seeded RNG，支持动态属性集合
- **modules/progression/**: 修炼/数值公式从引用具体属性名改为消费核心值
- **modules/combat/**: 战斗公式消费核心值
- **views/**: 属性面板、角色选择 UI 动态渲染属性列表
- **mods/wanjie-core/**: 8 个世界观 JSON 全部需要新增 attributeDefinitions 和 coreStatFormulas
- **app/api/**: 新增角色保存 API，角色生成 API 支持 seed 参数
- **app/api/v1/worlds/store.ts**: 新增 characters 表
- **影响 25 个源文件**中 `.体质` / `.灵根` 等硬编码属性访问
