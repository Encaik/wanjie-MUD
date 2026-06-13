# game-design-characters

## Purpose

角色系统设计文档。迁移和整合现有 `doc/design/avatar-selection-balance-design.md`、`doc/design/attribute-persistence-design.md` 等内容到新的 GDD 体系。

## ADDED Requirements

### Requirement: 角色系统章节内容

`game-design/characters.md` SHALL 涵盖以下设计要点：

1. **属性系统** — 5 项基本属性（体质、灵根、悟性、幸运、意志）的设计目的和游戏效果
2. **核心值系统** — 11 维 CoreStat（maxHp、physicalATK 等），属性到核心值的映射公式
3. **属性分类** — 数值型属性（NumericAttribute）和枚举型属性（EnumAttribute）
4. **种族系统** — RaceRegistry、内置种族定义、世界观种族池
5. **天赋系统** — TalentRegistry、稀有度分级、天赋与种族的关联
6. **词条系统** — 出身/特性/性格/天赋四维词条、品质等级（common→legendary）
7. **角色评估** — 多维度评分（战斗/修炼/生存/探索）、协同效应、角色定位
8. **角色生成流程** — seed 驱动确定性生成、前端展示模板、API 落地

#### Scenario: 内容完整性
- **WHEN** 审查 characters.md
- **THEN** 必须包含上述 8 个设计要点中的至少 6 个

### Requirement: 旧文档迁移

现有设计文档 SHALL 被消化吸收后整合到 characters.md 中：

- `doc/design/avatar-selection-balance-design.md` → 属性价值矩阵、多维度评估
- `doc/design/attribute-persistence-design.md` → 属性持久化机制

#### Scenario: 迁移完整性
- **WHEN** 对比 characters.md 和旧文档
- **THEN** 所有核心设计决策（属性价值矩阵、多维度评估方法）必须在 characters.md 中有所体现

### Requirement: 角色生成流程说明

characters.md SHALL 用流程图或文字描述角色生成的完整流程：

```
玩家选择世界 → API 生成 8 个角色模板（seed 驱动）
              → 模板包含：姓名、性别、种族、天赋、属性、核心值
              → 玩家选择 → API 保存角色 → 进入背景故事
```

#### Scenario: 流程清晰
- **WHEN** 阅读 characters.md
- **THEN** 角色生成流程必须清晰可循，包含输入（worldSeed）、处理（模板生成）、输出（CharacterTemplate）三个环节
