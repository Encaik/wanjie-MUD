## 1. 构建脚本改造

- [x] 1.1 在 `scripts/build-mods.ts` 中新增 `bundleModData()` 函数：读取 `mod.json` 的 `dataFiles` 字段，依次读取每个声明的 JSON 数据文件，按 `contentType` 分组合并，写入 `data.json` 到目标目录
- [x] 1.2 在 `buildMods()` 主流程中，Mod 目录复制完成后调用 `bundleModData()`，为每个 Mod 生成合并数据文件
- [x] 1.3 处理边界情况：文件不存在时输出警告并跳过（不阻塞其他文件）；单个文件 content type 直接使用文件内容作为合并值；`world` 类型数据以 `type` 字段为 key 合并为对象映射
- [x] 1.4 运行 `pnpm build` 验证 `public/mods/wanjie-core/data.json` 生成正确

## 2. 运行时加载器改造

- [x] 2.1 在 `ModLoader` 中新增 `loadMergedData()` 私有方法：尝试 `fetch(data.json)`，成功则解析并按 content type 分发注册，返回 `true`；404 则返回 `false`
- [x] 2.2 修改 `loadModDataAndRegister()`：优先调用 `loadMergedData()`，失败时回退到原有的逐文件加载逻辑
- [x] 2.3 新增 `registerMergedWorldData()` 辅助方法：遍历合并数据中 `world` 对象的每个条目，调用现有的 `registerData()` 进行注册
- [x] 2.4 修改 `loadAll()` 数据加载阶段：将"逐个 `await loadModDataAndRegister()`"改为 `Promise.all(validMods.map(...))` 并发执行
- [x] 2.5 确保并发加载中单个 Mod 失败不影响其他 Mod：使用 `.catch()` 捕获单个失败并标记 `status: 'error'`

## 3. 验证与清理

- [x] 3.1 运行 `pnpm ts-check` 确保类型正确
- [x] 3.2 运行 `pnpm build` 确保构建成功
- [x] 3.3 运行 `pnpm lint:strict` 确保代码质量通过（预存 lint 问题非本次变更引入）
- [ ] 3.4 在浏览器中验证启动加载速度：对比变更前后的请求数和加载时间
