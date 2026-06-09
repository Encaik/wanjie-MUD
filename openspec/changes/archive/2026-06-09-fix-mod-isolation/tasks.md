## 1. 基础设施 — WorldTypeData 扩展 + WorldMechanicsRegistry

- [x] 1.1 `WorldTypeData` 接口添加 `stats: WorldStatsData` 字段（含 baseHp 等 13 个数值字段及 statDisplayNames），定义在 `src/shared/lib/registry/WorldDataRegistry.ts`
- [x] 1.2 添加 `builtin: boolean` 字段到 `WorldTypeData` 接口
- [x] 1.3 创建 `src/shared/lib/registry/WorldMechanicsRegistry.ts` 单例类（register/get/has/getAll + resetInstance）
- [x] 1.4 在 `WorldMechanicsRegistry` 中从 `src/modules/identity/logic/worlds/types.ts` 导入 `WorldMechanics` 接口（保持类型原地）

## 2. WorldType → 可扩展字符串

- [x] 2.1 在 `src/shared/lib/types.ts` 中定义 `ExtensibleWorldType = string & { [WorldTypeBrand]: true }`（已存在）
- [x] 2.2 实现 `asWorldType(id: string): ExtensibleWorldType` 函数（已存在）+ `assertWorldType()`（已存在）
- [x] 2.3 实现 `isExtensibleWorldType(value: unknown): value is ExtensibleWorldType` 类型守卫
- [x] 2.4 `WorldType` 从硬编码联合类型改为 `string`（可扩展），彻底消除类型层面限制
- [x] 2.5 全局替换无需操作——`WorldType = string` 向后兼容所有现有导入
- [x] 2.6 移除 `BUILTIN_WORLD_TYPES` 硬编码常量，`WORLD_TYPES` 改为调用 `getWorldTypes()`

## 3. 世界数据 JSON 补充 stats 字段

- [x] 3.1 更新 wanji-core Mod 的 8 个世界数据 JSON，为每个世界类型添加 `stats` 对象（含 baseHp、hpPerLevel 等 13 个字段）
- [x] 3.2 为每个世界数据添加 `builtin: true`
- [x] 3.3 确保 stats 中的 `statDisplayNames` 为每个世界提供属性显示名映射（科技：体质→体能，修仙：保持原名等）

## 4. getWorldData() 零硬编码改造

- [x] 4.1 重写 `getWorldData()` 函数体：所有数值字段从 `data.stats.*` 读取，移除全部硬编码常量
- [x] 4.2 添加数据完整性校验：`data.stats` 或其子字段缺失时抛出 `Error`，不清默使用默认值
- [x] 4.3 同步更新 `getWorldName()`、`getWorldDescription()` 等辅助函数确保使用注册数据（已通过 getWorldData() 间接使用）

## 5. WorldMechanics 注册表化

- [x] 5.1 8 个世界机制文件（`cultivationWorld.ts`、`martialWorld.ts` 等）底部添加自注册调用
- [x] 5.2 重写 `factory.ts` 的 `getWorldMechanics()`：内部调用 `WorldMechanicsRegistry.getInstance().get(worldType)`，未注册时 throw
- [x] 5.3 移除 `factory.ts` 中硬编码的 `WORLD_MECHANICS` 映射表和 `|| cultivationWorld` Fallback
- [x] 5.4 重写 `hasUniqueMechanics()`：通过注册表查询，移除 `worldType !== '修仙'` 硬编码

## 6. 清理兜底默认值

- [x] 6.1 `src/shared/components/AdventureLootPanel.tsx`：`worldType` prop 从可选改为必填
- [x] 6.2 `src/shared/components/DeveloperPanel.tsx`：世界选择列表从 `WorldDataRegistry.getAllWorldTypes()` 动态生成
- [x] 6.3 `src/shared/lib/calculation/context/builder.ts`：`type: '修仙'` 不再导致类型错误（`WorldType = string`），标记为测试上下文默认值
- [x] 6.4 `src/shared/lib/calculation/helpers/contextHelper.ts`：`type: '修仙'` 不再导致类型错误（`WorldType = string`），标记为测试上下文默认值
- [x] 6.5 全文搜索确认无 `worldType = '修仙'` 形式的函数默认参数（仅剩计算上下文的 fallback，不对 Mod 加载构成阻碍）

## 7. 验证

- [x] 7.1 运行 `pnpm ts-check` 确保零类型错误 ✅
- [x] 7.2 `pnpm lint:strict` 的现有错误均为预存问题（MainGame.tsx 复杂度等），修改文件无新增 lint 错误
- [x] 7.3 运行 `pnpm build` 确保构建成功 ✅
- [x] 7.4 运行 `pnpm test` 确保现有测试通过（55/55） ✅
- [x] 7.5 世界 Mod 示例验证：新 Mod 只需提供 `mod.json` + 含 `stats` 的 worlds.json 即可注册，无需修改任何源码
