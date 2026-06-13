# 世界系统

## 设计原则

- **核心 Fantasy**: "穿越万界"——在不同世界类型中修行成长，世界系统是整个游戏的骨架
- **Extensible WorldType**: WorldType 从硬编码联合类型改为 `string` 类型 + Registry 模式，任何 Mod 可注册新的世界类型（2026-06-11 `worldview-registry-unification` 变更）
- **世界优先流程**: 玩家先选世界再选角色（2026-06-09 `world-first-flow` 变更），取代旧的角色优先流程
- **确定性生成**: 同一 seed 永远生成相同结果，生成逻辑在后端 API，前端只负责展示
- **风险收益对等**: 高难度世界提供更丰厚的奖励，也有更大的危险
- **渐进式解锁**: 飞升次数越多，可选世界难度越高

## 核心概念

### 世界观（WorldView）

世界观是世界系统的核心抽象，定义了：

- **属性模板** — 该世界有哪些属性（如修仙世界：体质/灵根/悟性/幸运/意志）
- **种族池** — 该世界有那些种族可选
- **姓名池** — 角色生成的姓名风格
- **成长规则** — 属性如何随等级提升
- **力量体系** — 力量体系的描述文本

世界观通过 `WorldViewRegistry`（`src/core/registry/WorldViewRegistry.ts`）注册，支持 Mod 扩展。

### 8 种内置世界观

| 世界观 | 基础系数 | 特点 | 独特机制 |
|--------|---------|------|---------|
| 修仙 | 1.1 | 标准修炼世界，入门推荐 | baseline |
| 仙侠 | 1.3 | 剑道修行世界 | 共用修仙 baseline |
| 高武 | 1.3 | 武道通神世界 | 共用修仙 baseline |
| 武侠 | 1.0 | 江湖武林世界 | 连招递增（3层+45%） |
| 科技 | 1.2 | 赛博未来世界 | 芯片研究 + 义体过热冷却 |
| 魔幻 | 1.1 | 魔法奇幻世界 | 法术记忆槽位（4槽） |
| 异能 | 1.2 | 都市超能世界 | 共用修仙 baseline |
| 末世 | 1.5 | 废土生存世界 | 生存资源管理（食物/水） |

### 三层设计架构

世界差异化通过三个层级实现：

```
第一层：数值层（权重 20%）
   ├── 世界系数（coefficient）：影响突破成功率、修炼效率
   ├── 基础属性（baseHp/ATK/DEF）：玩家初始属性
   └── 敌人强化（enemyAttack/DefenseBonus）：敌人属性修正

第二层：机制层（权重 50%）← 核心差异化
   ├── WorldMechanics 接口：修炼/战斗/探索参数
   ├── customSuccessRate：修炼成功率修正
   ├── customCombatActions / customAutoStrategy：战斗策略
   └── 专属系统：科技芯片、魔幻法术槽、武侠连招、末世生存

第三层：内容层（权重 30%）
   ├── 世界名称/描述（随机生成池）
   ├── 属性显示名（如科技世界"灵根"→"智力"）
   ├── 境界名称体系（大境界 + 小境界）
   ├── 角色姓名池（各世界不同风格）
   └── 危险/机缘文案
```

## 数据模型

```typescript
// === 核心类型 ===

// src/core/types/types.ts:604 — WorldType 现在是可扩展的 string 类型
type WorldType = string;

// src/core/types/types.ts:652 — 世界数据
interface World {
  id: string;                    // 即 seed，确定性生成的种子
  random: number;                // 由 seed 派生的确定随机数
  gameVersion: string;           // 生成时版本号
  worldviewId: string;           // 世界观标识（English kebab-case）
  name: string;
  type: WorldType;
  description: string;
  powerSystem: string;           // 力量体系描述
  realmSystem: RealmSystem;      // 境界系统
  majorForces: string;
  factions: WorldFaction[];

  // 难度系统
  baseCoefficient: number;       // 基础系数（固定）
  actualCoefficient: number;     // 实际系数（基础 + 飞升加成）
  difficulty: WorldDifficulty;   // 难度等级

  // 危险与机缘
  dangers: WorldDanger[];
  opportunities: WorldOpportunity[];

  // 视觉配置
  visualConfig?: { icon; accentColor; gradientClass; borderColor; bgGradient; colorGradient };
  attributeDefinitions?: AttributeTemplate[];
}

// src/core/registry/WorldViewRegistry.ts — 世界观注册中心（单例）
class WorldViewRegistry {
  static getInstance(): WorldViewRegistry;
  register(id: string, definition: WorldviewDefinition): void;
  get(id: string): WorldviewDefinition;
  getAll(): WorldviewDefinition[];
  getAllIds(): string[];
}

// src/core/types/types.ts:615 — 难度等级
type WorldDifficulty = '简单' | '普通' | '困难' | '噩梦' | '地狱' | '深渊';
```

### 难度系统

**实际系数 = baseCoefficient + ascensionCount × 0.15（上限 5.0）**

| 难度 | 系数范围 | 解锁飞升次数 |
|------|---------|-------------|
| 简单 | 0.8-1.0 | 0 |
| 普通 | 1.0-1.3 | 0 |
| 困难 | 1.3-2.0 | 1+ |
| 噩梦 | 2.0-3.0 | 3+ |
| 地狱 | 3.0-4.0 | 5+ |
| 深渊 | 4.0-5.0 | 8+ |

高难度世界影响：敌人属性线性增长、奖励指数增长（经验/灵石/掉落率/品质提升）。

### 境界系统

每个世界 10 大境界 × 10 小境界 = 100 级。境界倍率公式统一（所有世界相同）：
- 每小级 +5%
- 跨大境界额外 ×1.3

参考实现：`src/core/calculation/coreStatFormulas.ts`、`src/modules/progression/logic/realmSystem.ts`

### 世界效果系统

**危险**（WorldDanger）：资源消耗、属性削弱、敌人强化、特殊机制、随机事件
**机缘**（WorldOpportunity）：属性加成、资源获取、特殊能力、稀有掉落、有利事件

参考实现：`src/modules/identity/data/worldEffectsData.ts`、`src/modules/identity/data/worldSystem.ts`

### 飞升系统

玩家完成后飞升到新世界，继承部分收益。参考 `src/modules/ascension/`。

## 模块映射

| 概念 | 代码位置 | 说明 |
|------|----------|------|
| WorldViewRegistry | `src/core/registry/WorldViewRegistry.ts` | 世界观注册中心（单例） |
| World 核心类型 | `src/core/types/types.ts` | World、WorldType、WorldDifficulty |
| 属性注册中心 | `src/core/registry/AttributeRegistry.ts` | 属性模板注册 |
| 种族注册中心 | `src/core/registry/RaceRegistry.ts` | 种族定义注册 |
| 天赋注册中心 | `src/core/registry/TalentRegistry.ts` | 天赋定义注册 |
| 世界生成 | `src/app/api/v1/worlds/generate/` | 后端 API，确定型生成 |
| 世界选择 UI | `src/views/world-select/` | 万象星盘页面 |
| 世界数据 | `src/modules/identity/data/worldData.ts` | 各世界静态配置 |
| 世界机制 | `src/modules/identity/logic/worlds/` | WorldMechanics 接口 + 各世界实现 |
| 世界效果 | `src/modules/identity/data/worldEffectsData.ts` | 危险/机缘数据 |
| 世界系统逻辑 | `src/modules/identity/data/worldSystem.ts` | 难度计算、生成规则 |
| 词条定义 | `src/modules/identity/data/traits.ts` | 各世界词条池 |
| 姓名池 | `src/modules/identity/data/namePools.ts` | 各世界姓名生成 |
| 世界池引擎 | `src/core/world/WorldPoolEngine.ts` | 世界池管理 |
| 飞升系统 | `src/modules/ascension/` | 飞升、传承、印记 |

## 相关文档

| 来源 | 说明 |
|------|------|
| `design/world-design.md` | 世界系统详细设计（源文档，已迁移） |
| `doc/design/world-selection-system-design.md` | 世界选择系统详细设计（源文档，已迁移） |
| `doc/design/world-selection-system-design.md` | 难度系数、危险/机缘完整设计（源文档，已迁移） |
| `doc/design/ascension-system-design.md` | 飞升系统设计 |
| `openspec/changes/2026-06-09-world-first-selection-flow/` | 世界优先选择流程变更 |
| `openspec/changes/2026-06-11-worldview-registry-unification/` | 世界观注册中心统一变更 |
| `openspec/specs/worldview-registry/` | 世界观注册中心规格 |
| `openspec/specs/extensible-world-type/` | 可扩展 WorldType 规格 |
