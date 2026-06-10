## Context

项目在五层架构重构过程中，将核心系统从 `shared/lib/` 迁移到了 `core/` 目录。迁移时在旧位置保留了 `@deprecated` barrel re-export 文件作为"过渡期"方案。现在核心层已稳定，这些中间层变成了纯粹的噪音。同时，`LegacyStats` 等类型别名和战斗系统中的单敌人兼容字段也属于同类冗余——它们存在只为兼容旧代码调用方式。

项目规则（`.claude/rules/core.md` 第 5.2 节）已明确规定"禁止在开发期间编写过渡兼容代码"，但历史上遗留的冗余尚未清理。本次变更是一次性彻底清理，不留任何过渡期代码。

## Goals / Non-Goals

**Goals:**
- 删除所有 `@deprecated` barrel re-export 文件（约 12 个）
- 更新所有仍使用旧路径的源文件（约 13 个）
- 消除 `LegacyStats` 类型别名，替换为直接的 `Record<StatKey, number>` 或整合进现有类型体系
- 清理战斗系统中 `BattleState` 的单敌人兼容字段及同步逻辑
- 清理其他标记为"向后兼容"的包装函数和导出
- 在 `.claude/rules/core.md` 中添加硬约束规则，防止未来再出现同类问题

**Non-Goals:**
- 不改变任何运行时行为或游戏逻辑
- 不修改 `public/mods/`（构建产物，非源文件）
- 不涉及 `components/ui/`（shadcn 管理，只读）
- 不改变数据持久化格式（Supabase schema）
- 不引入新的目录结构或架构层次

## Decisions

### 决策 1: 分阶段按类型清理

**选择**：按冗余代码类型分 4 个阶段执行，而非按模块分阶段。

**阶段顺序**：
1. Barrel re-export 文件删除 + 旧路径导入更新
2. `LegacyStats` 类型消除
3. 战斗系统单敌人兼容字段清理
4. 杂项兼容代码清理 + 规则更新

**理由**：barrel 文件删除是最机械、最安全的第一步，之后 `LegacyStats` 的清理会更清晰（因为导入路径已经统一）。按类型清理确保每一步的验证范围明确。

**替代方案**：按模块逐一清理（如先清理 `modules/combat`、再清理 `modules/progression`...）。被否决原因：同一模块可能存在多种冗余类型，按模块会导致上下文频繁切换。

### 决策 2: LegacyStats 的处理方式

**选择**：在 `core/types/types.ts` 中保留 `LegacyStats` 类型定义，但移除其"向后兼容"语义，重命名为语义更清晰的名称或直接在各使用处展开为 `Record<StatKey, number>`。

**分析**：`LegacyStats = Record<StatKey, number>` 本质上是一个合法的类型——"按属性键索引的数值字典"。问题在于它的命名暗示了"临时兼容"。"Legacy" 这个词本身就是冗余标记。处理方式：
- 如果使用处确实需要一个 `{ [stat]: number }` 的字典 → 直接写 `Record<StatKey, number>` 或 `Partial<Record<StatKey, number>>`
- 如果使用处应该用 `BaseStats` + `GrowthStats` → 改为使用正确的类型体系

**理由**：消除 "Legacy" 前缀消除了"这段代码是临时的"信号，强制调用方明确表达意图。

### 决策 3: 规则植入位置

**选择**：在 `.claude/rules/core.md` 第 5.2 节"代码质量"中新增一条禁止项。

**理由**：该规则属于代码质量标准（禁止冗余/过渡代码），放在现有禁止行为清单中保持一致性。修改现有文件而非创建新文件，避免规则碎片化。

### 决策 4: 导入路径的最终形式

**选择**：所有导入使用 `@/core/` 路径，不再经过 `@/shared/lib/`。

验证方式：`grep -r "from '@/shared/lib/" src/` 应返回空结果（`shared/lib/multiplayer/` 等非 deprecated 的子目录除外）。

## Risks / Trade-offs

- **[风险] 外部依赖旧路径**：如果有项目外代码（如独立脚本、配置文件）依赖 `@/shared/lib/types` 等旧路径，删除后会导致编译失败 → **缓解**：`grep` 全项目（包括 `scripts/`、`mods/`、配置文件）确认无外部引用后再删除
- **[风险] `shared/lib/types.ts` 包含跨模块便利导出**：该文件不仅 re-export `core/types`，还汇集了 `Element`、`Faction`、`DifficultyLevel` 等跨模块类型。删除后调用方需要从多个模块分别导入 → **缓解**：这正是期望的行为——调用方应明确声明依赖的具体模块
- **[风险] `LegacyStats` 使用面广**：约 40+ 处引用分布在 10+ 个模块中，批量替换可能引入错误 → **缓解**：使用 IDE 辅助重构（`F2` 重命名），逐模块验证 TypeScript 编译
- **[风险] 战斗兼容字段删除可能影响战斗逻辑**：`decisionSystem.ts` 中有多处"同步更新向后兼容字段"的逻辑 → **缓解**：战斗系统有测试覆盖，先跑测试确认行为，再逐步删除冗余同步代码

## Migration Plan

1. **执行前**：运行 `pnpm ts-check && pnpm build && pnpm test` 建立基准
2. **按阶段执行**：每个阶段完成后运行 `pnpm ts-check` 确保无类型错误
3. **全部完成后**：运行 `pnpm lint:strict && pnpm build && pnpm test` 全量验证
4. **回滚策略**：每个阶段是独立的 git commit，可通过 `git revert` 按阶段回滚

## Open Questions

- `shared/lib/types.ts` 删除后，目前从中导入 `Element`、`Faction` 等跨模块类型的文件需要从各自模块分别导入——是否需要在某个统一位置（如 `core/types/` 的 index）汇出这些跨模块通用类型？还是让调用方分别导入？**倾向于分别导入**（明确依赖），但如果一个文件需要从 5+ 个不同模块导入类型，会产生大量 import 语句——可在实现时根据实际情况判断。
