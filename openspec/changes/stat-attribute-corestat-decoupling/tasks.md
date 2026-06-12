# Implementation Tasks

## 1. 类型层 — 新类型定义与旧类型迁移

- [x] 1.1 在 `core/types/types.ts` 中新增 `AttributeDefinition`、`AttributeCategory`、`AttributeCalculation`、`CoreStatKey`、`CoreStatBaseValues`、`SpecialResourceDef` 类型
- [x] 1.2 新增 `RaceDefinition`、`InnateAbility` 类型到 `core/types/`
- [x] 1.3 新增 `TalentDefinition`、`TalentEffect` 类型到 `core/types/`
- [x] 1.4 新增 `DialogueCheck`、`CheckResult` 类型到 `core/types/`
- [x] 1.5 将 `BaseStats`、`GrowthStats` 转为 `Record<string, number>` 的 deprecated type alias
- [x] 1.6 新增 `CharacterAttributesV3` 新接口
- [x] 1.7 更新 `World` 接口新增 `attributeDefinitions`、`coreStatFormulas`、`racePool` 字段
- [x] 1.8 更新 `core/types/index.ts` 桶导出所有新类型
- [x] 1.9 运行 `pnpm ts-check` 确认新类型定义无误（仅剩 1 个预存错误与此无关）

## 2. Mod 数据层 — 世界观 JSON 扩展 + 种族/天赋数据

- [x] 2.1 在 `WorldviewDefinition` 中新增 `attributes: AttributeDefinition[]` 字段
- [x] 2.2 在 `WorldviewDefinition` 中新增 `coreStatFormulas: CoreStatBaseValues` 字段
- [x] 2.3 在 `WorldviewDefinition` 中新增 `racePool: string[]` 和 `talentPool: string[]` 字段
- [x] 2.4 在 `WorldviewDefinition` 中新增 `specialResource?: SpecialResourceDef` 字段
- [x] 2.5 更新 `mods/wanjie-core/data/worldview/cultivation.json` — 新增 `attributes`、`racePool`、`specialResource`
- [x] 2.6 更新其余 7 个世界观 JSON（martial / tech / magic / psi / xianxia / wuxia / apocalypse）
- [x] 2.7 创建 `mods/wanjie-core/data/races/` 目录，添加 `human.json`（人族）
- [x] 2.8 创建额外的种族 JSON（demon 妖族 + spirit 灵族，共 3 个种族）
- [x] 2.9 创建 `mods/wanjie-core/data/talents/` 目录，添加天赋 JSON（12 个天赋）
- [x] 2.10 更新 `mods/wanjie-core/mod.json` 的 `contentTypes` 和 `dataFiles` 声明 races、talents、attributes
- [x] 2.11 扩展 `ModContentType` 类型新增 `'attributes'`、`'races'` 和 `'talents'`
- [x] 2.12 在 `core/registry/schemas.ts` 中新增 attributes 校验（races/talents 基础结构检查）
- [x] 2.13 更新 `ModValidator.validateModData()` 处理 attributes 内容类型

## 3. 核心值计算引擎

- [x] 3.1 在 `core/world/` 中新增 `calculateCoreStats()` 纯函数（属性→核心值映射计算）
- [ ] 3.2 在 `core/calculation/` 中重构输入层，支持从 `Record<string, number>` + `AttributeDefinition[]` 读取属性
- [ ] 3.3 重写 `core/calculation/adapters/base.ts` 的 `STAT_NAME_MAP`，改为由 `AttributeDefinition.calculations` 动态生成映射
- [ ] 3.4 更新 `core/calculation/calculator/index.ts` 的 `extractCombatBaseValues()` 从动态属性映射中计算
- [ ] 3.5 更新 `core/calculation/context/types.ts` 的 `BaseStatsInput` 改为 `Record<string, number>`
- [ ] 3.6 更新 `core/calculation/helpers/contextHelper.ts` 的动态属性读取
- [ ] 3.7 更新 `core/calculation/services/statDetailService.ts` 的动态属性解析

## 4. 旧计算层迁移 — balanceConfig 到核心值

- [x] 4.1 创建 `core/calculation/coreStatFormulas.ts` — 15 个基于核心值的计算纯函数
- [ ] 4.2 将 `calculatePlayerMaxHp(coreStats)` 改为消费 `coreStats.maxHp` 而非 `体质` 参数
- [ ] 4.3 将 `calculatePlayerMaxMp(coreStats)` 改为消费 `coreStats.specialResourceCap`
- [ ] 4.4 将 `calculatePlayerAttack/Damage/Defense` 改为消费 `coreStats.physicalATK` 等
- [ ] 4.5 将 `calculatePlayerPower()` 改为消费核心值加权（而非直接引用属性名）
- [ ] 4.6 将 `calculateEnemyHp/Attack/Defense` 改为消费核心值
- [ ] 4.7 将 `calculateBreakthroughSuccessRate()` 改为消费 `coreStats.willpower`
- [ ] 4.8 在 `modules/progression/logic/balanceConfig.ts` 顶部 barrel re-export 新函数，标记旧函数 deprecated

## 5. 角色生成器 — Seed 驱动 + 动态属性

- [ ] 5.1 在 `src/modules/identity/logic/` 中创建 `characterTemplates.ts` — `generateCharacterTemplates(worldSeed, worldviewId)` 纯函数
- [ ] 5.2 模板生成使用 seeded RNG（`createRng(worldSeed + ':templates')`）
- [ ] 5.3 模板包含种族选取（从 `worldview.racePool` 中确定性选取）
- [ ] 5.4 模板包含天赋选取（从种族的 `talentPool` 中按稀有度概率选取）
- [ ] 5.5 模板属性由 `种族.baseAttributeBonuses + 天赋修正 + 随机分配点` 构成
- [ ] 5.6 创建 `createCharacterSeed(worldSeed, templateIndex, customizations)` 函数
- [ ] 5.7 重构 `generateCharacter()` 支持 `seed` 参数和动态属性维度
- [ ] 5.8 将旧的 `Math.random()` 角色生成路径标记 deprecated

## 6. 存储层 — characters 表 + 角色 API

- [ ] 6.1 在 `src/app/api/db/schema.ts` 中新增 `charactersTable` 定义
- [ ] 6.2 在 `src/app/api/v1/worlds/store.ts`（或新建 `src/app/api/v1/characters/store.ts`）中实现角色 CRUD
- [ ] 6.3 实现 `POST /api/v1/characters/templates` — 生成 8 个模板
- [ ] 6.4 实现 `POST /api/v1/characters/save` — 保存确认角色
- [ ] 6.5 实现 `GET /api/v1/characters?worldSeed=X` — 查询世界下的角色
- [ ] 6.6 角色数据格式包含 `npcTemplateVersion` 字段（预留 NPC 化）

## 7. 世界观 API 更新

- [ ] 7.1 更新 `GET /api/v1/worldviews` 摘要返回 `attributeCount`、`raceCount`、`attributePreview`
- [ ] 7.2 更新 `GET /api/v1/worldviews/[id]` 返回完整 `attributeDefinitions` 和 `coreStatFormulas`
- [ ] 7.3 更新 `POST /api/v1/worlds/generate/basic` 新管线路径 — 生成包含 `attributeDefinitions` 的世界
- [ ] 7.4 确认 `POST /api/v1/worlds/generate/details` 新管线路径使用查DB→补全→保存流程（已在上个 commit 修复）

## 8. 前端 — 动态属性 UI

- [ ] 8.1 更新 `src/views/character-select/CharacterSelect.tsx` — 属性面板改为动态渲染（遍历 `attributeDefinitions`）
- [ ] 8.2 更新角色卡片展示种族信息 + 天赋列表
- [ ] 8.3 更新 `src/modules/progression/components/CultivationPanel.tsx` — 属性展示改为动态
- [ ] 8.4 更新所有 `.体质` / `.灵根` 等硬编码为 `attributes['体质']` 或从元数据获取
- [ ] 8.5 数值重平衡 — 将默认属性基值从 50 改为 8，词条加成从 +2~12 改为 +1~3
- [ ] 8.6 更新初始 HP/MP/攻击 计算以适配低基数
- [ ] 8.7 更新角色选择页调用新的 templates API（替代旧 `generateCharacters`）
- [ ] 8.8 种族选择 UI — 在角色选择中展示可选种族

## 9. 存档迁移

- [ ] 9.1 在 `shared/utils/saveMigrator.ts` 中新增迁移逻辑：旧 `CharacterStats` → 新 `{ attributes, coreStats }`
- [ ] 9.2 迁移时保留旧属性值映射（50→换算到新基数）
- [ ] 9.3 迁移时新增 `attributeDefinitions` 到 `World` 对象

## 10. 测试与验证

- [ ] 10.1 为 `calculateCoreStats()` 编写单元测试（覆盖多世界观、多属性组合）
- [ ] 10.2 为 `generateCharacterTemplates()` 编写单元测试（确定性验证、跨世界观验证）
- [ ] 10.3 为 `performDialogueCheck()` 编写单元测试
- [ ] 10.4 为种族/天赋校验器编写单元测试
- [ ] 10.5 运行 `pnpm test` 确保所有现有测试通过或更新
- [ ] 10.6 运行 `pnpm ts-check` 确保零类型错误
- [ ] 10.7 运行 `pnpm build` 确保构建成功
- [ ] 10.8 运行 `pnpm lint:strict` 确保质量门通过

## 11. 清理

- [ ] 11.1 删除 `src/app/api/v1/worlds/generate/generator.ts` 中仅依赖旧 modules/ 数据的旧管线代码
- [ ] 11.2 删除 `BaseStats` / `GrowthStats` deprecated alias（所有引用消除后）
- [ ] 11.3 删除 `WorldStatsData` 旧接口（被 `AttributeDefinition[]` + `CoreStatBaseValues` 替代）
- [ ] 11.4 删除 `STAT_NAME_MAP` 硬编码映射（被动态生成替代）
- [ ] 11.5 运行全量质量门（`pnpm lint:strict && pnpm ts-check && pnpm test && pnpm build`）
