## Why

项目中存在大量标记为 `@deprecated` 的向后兼容 barrel re-export 文件、`LegacyStats` 等仅用于兼容旧格式的类型别名、以及大量"兼容旧版""向后兼容"的注释代码块——这些冗余代码违反了五层架构"内容唯一原则"，增加导入路径的不确定性，并在开发期间引入"到底该用哪个路径"的认知负担。现在是清理的最佳时机：核心基础设施（`core/`）已稳定建立，旧路径的调用方数量有限（13 个文件），一次彻底清理即可消除所有冗余，不留过渡期。

## What Changes

- **删除 9 个 barrel re-export 文件**：`shared/lib/world/`、`shared/lib/types.ts`、`shared/lib/typesExtension.ts`、`shared/lib/registry/`、`shared/lib/expansionLogic.ts`、`shared/lib/events/`、`shared/lib/calculation/`、`shared/lib/mod/`、`shared/lib/messageDB.ts`、`shared/lib/gameSystems.ts`（全部仅包含 `@deprecated` 重导出）
- **删除 3 个向后兼容 re-export 文件**：`shared/utils/rarityStyles.ts`、`shared/components/Header.tsx`、`shared/ui/item-tooltip.tsx` 中的兼容重导出行
- **更新 13 个仍使用旧路径 `@/shared/lib/` 的源文件**，改为直接从 `@/core/` 或对应模块导入
- **清理 `LegacyStats` 类型及其所有引用**：将 `LegacyStats`（`Record<StatKey, number>`）替换为直接的类型定义或现有的 `BaseStats`/`GrowthStats`/`CharacterStats` 体系
- **清理战斗系统中的"单敌人兼容字段"**：`BattleState` 中标记 `@deprecated` 的 fallback 字段及其同步逻辑
- **清理其他兼容性代码**：`fragmentSystem` 中的 `LegacyFragmentGroup`、`cultivationStrategy` 中的兼容路径、`identity` 中的 `getWorldTerms` 兼容函数等
- **BREAKING**：向 `.claude/rules/core.md` 添加"开发期间禁止添加旧逻辑兼容方案"的硬约束规则
- **BREAKING**：删除所有旧路径 barrel re-export，依赖这些路径的外部代码（如果有）将编译失败

## Capabilities

### New Capabilities

- `code-no-compat-shims`: 强制要求开发期间代码实现逻辑只有一种，禁止添加 `@deprecated` barrel re-export、旧格式兼容分支、"向后兼容"兜底方案等冗余代码

### Modified Capabilities

无现有 spec 需要修改——此次变更是对现有架构规则的强制执行，不改变任何系统行为。

## Impact

- **受影响文件范围**：约 50-80 个源文件（删除 ~12 个 barrel 文件 + 更新 ~13 个旧路径导入 + 清理 `LegacyStats` 引用约 40+ 处 + 清理战斗兼容字段约 5 处 + 清理其他兼容代码约 10 处）
- **受影响模块**：`core/types`、`core/engine`、`modules/combat`、`modules/progression`、`modules/ascension`、`modules/exploration`、`modules/equipment`、`modules/crafting`、`modules/faction`、`modules/identity`
- **规则文件变更**：`.claude/rules/core.md` 新增一条禁止规则
- **风险评估**：纯机械性变更，不改变任何运行时行为——所有旧 barrel 只是 `export * from '新路径'`，调用方改为直接导入新路径即可
