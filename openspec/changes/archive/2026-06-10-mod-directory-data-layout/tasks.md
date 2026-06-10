## 1. ModManifest 类型与校验

- [x] 1.1 修改 `ModManifest.dataFiles` 类型：从 `Record<string, string>` 改为 `Record<string, string | string[]>`
- [x] 1.2 更新 `validateManifest` 校验逻辑：数组值中每个元素必须是非空字符串、数组不能为空；单字符串值保持原有校验
- [x] 1.3 更新 `parseManifest` 中 `dataFiles` 的解析逻辑，支持读取数组值
- [x] 1.4 更新 JSDoc 注释，说明 `dataFiles` 字段支持字符串和数组两种格式

## 2. WorldTypeData 三标识体系

- [x] 2.1 修改 `WorldTypeData` 接口：新增 `id: number`、`type: string`（英文 kebab-case），原有中文 `id` 重命名为 `name`
- [x] 2.2 在 `WorldDataRegistry` 中新增 `getWorldTypeByEnglishType(type: string)` 查询方法
- [x] 2.3 保留 `getWorldType(id: string)` 兼容旧中文 ID 查找（内部转调英文 type 查询）
- [x] 2.4 更新 `registerWorldType`：自动从数据中提取 `id`、`type`、`name` 三字段；对旧格式（中文 id）自动填充 `name` 并生成英文 `type`

## 3. ModLoader 数组加载

- [x] 3.1 修改 `loadModDataAndRegister`：检查 `dataFiles` 值是字符串还是数组；字符串走原有逻辑，数组遍历处理
- [x] 3.2 数组模式下，遍历每个文件路径，fetch 并解析 JSON，每个 JSON 对象作为单条目传入 `registerData`
- [x] 3.3 `registerData` 增加单条目对象处理分支：当数据自身是目标类型（含 `type` 字段的世界数据、含 `id` 字段的危险数据等）时直接注册，否则走原有容器解析逻辑
- [x] 3.4 错误隔离：单个文件 fetch 失败或 JSON 解析失败时记录 warn 并继续处理数组中的后续文件

## 4. 数据文件迁移

- [x] 4.1 创建 `public/mods/wanjie-core/data/world/` 目录，将 `worlds.json` 中的 8 个世界拆分为独立文件（`cultivation.json`、`martial.json`、`tech.json`、`magic.json`、`psi.json`、`xianxia.json`、`wuxia.json`、`apocalypse.json`）
- [x] 4.2 每个世界 JSON 文件使用三标识格式：`"id": 1, "type": "cultivation", "name": "修仙世界"`，其余字段保持不变
- [x] 4.3 创建 `public/mods/wanjie-core/data/dangers/` 目录，将 `dangers.json` 拆分为独立文件
- [x] 4.4 创建 `public/mods/wanjie-core/data/opportunities/` 目录，将 `opportunities.json` 拆分为独立文件
- [x] 4.5 创建 `public/mods/wanjie-core/data/factions/` 目录，将 `factions.json` 拆分为独立文件（按势力 ID）
- [x] 4.6 创建 `public/mods/wanjie-core/data/realms/` 目录，将 `realms.json` 拆分为独立文件（按世界 type）
- [x] 4.7 创建 `public/mods/wanjie-core/data/traits/` 目录，将 `traits.json` 拆分为独立文件（按世界 type）
- [x] 4.8 创建 `public/mods/wanjie-core/data/names/` 目录，将 `names.json` 拆分为独立文件（按世界 type）
- [x] 4.9 创建 `public/mods/wanjie-core/data/text/` 目录，将 `text.json` 拆分为独立文件（按世界 type）

## 5. Mod 清单更新

- [x] 5.1 更新 `public/mods/wanjie-core/mod.json` 的 `dataFiles`：将已拆分为目录的内容类型值改为数组格式，列出所有文件路径
- [x] 5.2 保留旧的单文件数据（`worlds.json` 等）作为过渡备份，标记 `@deprecated`

## 6. 验证

- [x] 6.1 运行 `pnpm ts-check` 确保 TypeScript 类型正确
- [x] 6.2 运行 `pnpm lint:strict` 确保代码规范通过
- [x] 6.3 运行 `pnpm test` 确保所有测试通过（84 tests passed）
- [x] 6.4 运行 `pnpm build` 确保静态构建成功
- [x] 6.5 手动验证 `pnpm dev` 下游戏能正常选择世界并开始游戏
- [x] 6.6 验证 `fetch` 请求数量合理（数组模式下 HTTP/2 多路复用，8 个世界文件并行加载）
