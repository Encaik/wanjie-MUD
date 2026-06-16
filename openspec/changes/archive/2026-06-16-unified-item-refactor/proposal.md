# 提案：统一物品系统迁移与旧模块删除

## 概述

将技能、功法、装备、碎片、炼制、商店等所有物品相关功能，从分散的旧模块（`techniques/`、`equipment/`、`economy/`、`crafting/`）迁移至已实现的统一物品系统（`modules/item/`），删除所有旧逻辑和废弃代码。

## 动机

### 当前问题

项目已实现 `modules/item/` 统一物品系统，定义了七大品类（货币/消耗品/材料/装备/功法/技能/碎片）的类型模板、实例管理、槽位装备、升级、碎片合成等完整逻辑。但实际功能模块仍在使用旧系统：

```
新系统 modules/item/  ← 已实现，但只有 BackpackPage 使用
旧系统 modules/equipment/ + techniques/ + economy/ + crafting/  ← 实际在跑
```

这导致：

1. **代码重复** — 旧模块定义了独立的 `Equipment`、`Technique`、`TechniqueSkill`、`SkillSlot`、`ItemRarity` 类型，与新系统 `EquipmentTemplate`、`TechniqueTemplate`、`SkillTemplate`、`Rarity` 功能重叠
2. **数据不一致** — `Protagonist` 同时携带 `items[]`（新）和 `equipments[]`/`techniques[]`/`inventory[]`（旧）两套物品数据
3. **槽位耦合** — 旧槽位系统存在技能槽依附装备/功法槽的父子关系，结构复杂且不易扩展
4. **维护负担** — 约 55 个旧文件、8000+ 行代码需要维护，且不符合五层架构的物品系统定位

### 预期收益

- 删除 ~55 个旧文件，减少约 8000 行重复/废弃代码
- 所有物品操作通过统一 API（`addItem`/`removeItem`/`equipItem`/`upgradeItem`/`fragmentItem` 等）
- 简化的扁平槽位系统，三种槽位独立管理
- 物品职责清晰分离：装备→属性加成、功法→修炼系统、技能→战斗系统

## 范围

### 包含

- 删除 `modules/equipment/`、`modules/techniques/`、`modules/economy/`、`modules/crafting/` 四个旧模块
- 删除 `core/types/types.ts` 中 `Protagonist` 的 10+ 个废弃字段
- 重写 7 个页面：BackpackPage（增强）、新装备管理页面、新炼制页面、ShopPage（重写）
- 合并导航面板：次要面板从 10 个减少到 5 个
- 删除 6 个旧路由，新增 2 个路由
- 重写 4 个 domainHooks 为纯新路径
- 断开 `modules/combat/` 对旧类型的依赖（战斗系统后续独立重构）
- 更新 `core/types/types.ts` 移除旧类型 import
- 更新 `src/modules/README.md` 和 `src/core/README.md`

### 不包含

- 战斗系统重构（后续独立 change）
- 新的物品模板内容填充（仅保留模板定义结构，数据在后续迭代中添加）
- Supabase 数据迁移（`src/shared/storage/`）

## 设计决策

1. **槽位扁平化** — 装备/功法/技能槽各自独立，移除父子依赖关系
2. **物品职责分离** — 装备管属性、功法管修炼、技能管战斗
3. **页面合并** — 装备+功法+技能→装备管理页面；炼丹+炼器→炼制页面；碎片合成→背包页面
4. **一次性删除** — 不保留旧模块的 barrel re-export 或过渡代码，参照禁止规则 5.2
5. **战斗断开** — 直接移除 combat/ 中旧类型引用，不做渐进兼容

## 风险

| 风险 | 缓解 |
|------|------|
| 战斗系统暂时不可用 | 移除对旧技能类型的引用，战斗逻辑保留但技能相关功能 stub |
| 页面合并后 UX 下降 | 使用 Tab 分类切换，保持每类物品的清晰视图 |
| 炼制系统从占位到正式化的复杂度 | 新炼制逻辑复用 item/ 的 `generateItemInstance` 和 `synthesizeFragments` |

## 关联

- 依赖：`modules/item/` 统一物品系统（已完成）
- 后续：战斗系统重构（独立 change）
