## Context

万界修行录经历了从纯前端生成 → 后端 API 生成的架构迁移。目前前端同时存在两种路径：既有调用后端 API 的代码，也保留了完整的前端生成实现。`modules/identity/` 的 `generators.ts` 是核心遗留代码，包含 6 个完整的生成函数（角色、世界、背景故事），全部使用 `Math.random()` 且与后端 API 功能完全重叠。

同时，早期的世界类型索引使用中文显示名（`'修仙'`）作为 key，这与新引入的英文 `worldviewId`（`'cultivation'`）不兼容。`WORLD_COEFFICIENTS` 等常量和 `getWorldData()` 函数仍然以中文 type 作为参数和 key，导致新旧系统混合使用时索引混乱。

该变更是纯清理和重构——不引入新功能，只删除死代码和修复索引方式。

## Goals / Non-Goals

**Goals:**
- 删除 `modules/identity/` 中与后端 API 重叠的生成逻辑（约 10 个文件）
- 将所有中文 type 索引（`'修仙'`）迁移为英文 `worldviewId`（`'cultivation'`）
- 删除所有 `@deprecated` 函数和不兼容的兜底逻辑
- 保持 `pnpm ts-check` 和 `pnpm build` 通过

**Non-Goals:**
- 不改变 Character 和 World 类型的接口结构（`type` 字段保留用于显示）
- 不迁移 Character 接口本身的 stat 命名（`体质/灵根/悟性/幸运/意志` 等中文属性名）
- 不涉及 `core/` 层的行为改动
- 不新增功能或重构非相关的模块接口

## Decisions

### D1. 整文件删除策略

**决策：整文件删除，不保留任何过渡兼容代码。**

`generators.ts` 及其依赖链上的文件（`characterEvaluation.ts`、`traits.ts`、`data/traits.ts` 等）整文件删除。不在 `index.ts` 中保留 barrel re-export 或 `@deprecated` 别名。

**理由：** CLAUDE.md 核心约束 5.2 明确禁止过渡兼容代码。开发阶段，删除后类型检查会立即暴露所有引用点，一次性修复更安全。

**替代方案考虑：** 逐个函数标记 `@deprecated` 再等下一轮删除——被否决，会延长技术债务周期。

### D2. `WORLD_COEFFICIENTS` 迁移方案

**决策：删除 `WORLD_COEFFICIENTS` 硬编码常量，改为从 `WorldViewRegistry` 读取 `baseCoefficient`。**

当前状态：
```typescript
// identity/data/worldData.ts
WORLD_COEFFICIENTS: Record<WorldType, number> = {
  '修仙': 1.1,   // ← 中文 key
  '高武': 1.3,
  ...
};
```

目标：
- `WorldViewRegistry` 中的 `WorldviewDefinition.baseCoefficient` 已是权威来源
- `getWorldBaseCoefficient(worldviewId)` 直接从注册中心读取
- 所有 `WORLD_COEFFICIENTS[type]` 替换为 `getWorldBaseCoefficient(worldviewId)`

**理由：** 消除重复数据源，消除中文 key。`baseCoefficient` 已在 WorldviewDefinition 中且由 Mod 加载维护。

### D3. `getWorldData()` 参数迁移

**决策：`getWorldData(worldviewId)` 接受 `worldviewId`（英文），删除注册中心为空时的硬编码回退逻辑。**

当前 `getWorldData()` 在 `WorldViewRegistry` 无数据时回退到 `WORLD_DATA` 常量。删除该回退——如果注册中心为空，直接抛异常。

**理由：** 开发阶段注册中心不可能为空（`ensureWorldSystemInitialized()` 在 API 路由层已调用）。保留回退会隐藏初始化失败问题。

### D4. 角色生成 API 路由统一

**决策：删除 `api/v1/characters/generate/route.ts`，保留 `api/v1/characters/templates/route.ts` 作为唯一的角色模板生成接口。**

两个路由功能高度重叠，`templates` 路由是 V3 新系统（seed 驱动、确定性），`generate` 路由调用旧的 `generators.ts`。

需要检查前端是否还有调用 `POST /api/v1/characters/generate` 的代码，一并迁移到 `/characters/templates`。

### D5. `useGameState.tsx` 中 `selectCharacter()` 的清理

**决策：删除 `selectCharacter()` 回调及其内部的 `generateBackstory()` 调用。**

`selectCharacter()` 已标注 `@deprecated V3`。V3 替代函数 `startGameWithCharacter()` 已存在，使用从后端 API 获取的角色数据。前端不再需要手动生成背景故事。

### D6. `worldSystem.ts` 拆分

**决策：文件保留，但删除其中的生成函数。**

- 删除：`generateWorldDangers()`、`generateWorldOpportunities()`（前端生成逻辑，由后端 API `POST /api/v1/worlds/generate` 取代）
- 保留并迁移：`getWorldBaseCoefficient()`、`calculateWorldDifficultyCoefficient()`、`getWorldDifficultyFromCoefficient()`

### D7. DB Schema 更新

**决策：`worldsTable` 增加 `worldviewId` 字段，`type` 保留作为展示字段。**

`worldviewId` 在现有数据中已存在于 `data` JSON 字段的 `worldviewId` 属性中。新字段作为冗余索引，避免每次查询时解析 JSON。

## World 类型约束

变更后 `World` 接口中两个字段的职责明确分离：

| 字段 | 职责 | 值示例 | 约束 |
|------|------|--------|------|
| `worldviewId` | 逻辑索引/外键 | `"cultivation"` | 必须与 `WorldviewDefinition.id` 匹配 |
| `type` | 仅前端显示 | `"修仙"` | 不应作为任何查找/索引的输入 |

所有现有 `getXxx(world.type)` 调用需评估：
- 如果该函数需要做查找/索引 → 改为 `worldviewId`
- 如果该函数仅做显示/标签 → 可保持 `type`

## 波及的文件图谱

```
                           generators.ts   ← 删除
                          /       |       \
          characterEvaluation.ts  traits.ts  data/traits.ts
               ↓ 删除              ↓ 删除      ↓ 删除
          data/namePools.ts      data/worldTraitPools.ts  data/worlds/index.ts
               ↓ 删除              ↓ 删除                  ↓ 删除
          ModRandomWorldProvider.ts  ← 删除
          
          worldData.ts  ← 修改：WORLD_COEFFICIENTS key + getWorldData() 参数
               ↓
          worldSystem.ts  ← 修改：删除生成函数，保留纯查询
               ↓
          balanceConfig.ts  ← 修改：getWorldData(worldviewId)
          statsCalc.ts       ← 修改：getWorldBaseCoefficient(worldviewId)
          statDisplayNames.ts ← 修改：getWorldData(worldviewId)
          adventure*.ts      ← 修改：getWorldData(worldviewId)
          generator.ts(API)  ← 修改：resolveWorldType → worldviewId
          
          useGameState.tsx  ← 修改：删除 selectCharacter() + generateBackstory()
          characters/generate/route.ts  ← 删除或重定向到 templates
          core/types/types.ts  ← 修改：删除 getBuiltinWorldTypes()
          app/api/db/schema.ts ← 修改：+worldviewId 字段
```

## Risks / Trade-offs

- **[R1] 遗漏的 `world.type` 查找调用**：如果某处用 `world.type` 做索引但未被 grep 覆盖，迁移后可能运行时报错。→ 缓解：`pnpm build` 只保证编译不报错。需要 review 所有 `world.type` 调用点，或者加运行时断言 `assertWorldviewMatches()`
- **[R2] `WORLD_COEFFICIENTS` 取值可能变化**：从硬编码常量改为注册中心读取后，如果注册中心的数据与旧常量不一致，难度系数会变。→ 缓解：该 change 中保持 `getWorldBaseCoefficient()` 先读取注册中心，若不存在则 fallback 到原常量值（仅过渡，下一轮删除）
- **[R3] `getWorldData('cultivation')` vs `getWorldData('修仙')`**：旧代码调用方传参是中文 type 还是 worldviewId 不统一。→ 缓解：通过 `grep -r "getWorldData"` 逐个审查所有 20+ 调用点，手动判断参数值
- **[R4] DB 迁移风险**：已有 worlds 表数据不含 `worldviewId` 字段。→ 缓解：`worldviewId` 可以从 `data` JSON 字段中提取（`worldviewId` 已在 World 对象中），添加字段时同步回填
