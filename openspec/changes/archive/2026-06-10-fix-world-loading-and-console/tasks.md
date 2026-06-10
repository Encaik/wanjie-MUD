## 1. 修复 dataFiles 数组格式不兼容（init.ts）

- [x] 1.1 在 `loadModFromDisk()` 中对每个 content type 的 `dataFiles[contentType]` 值做 `Array.isArray` 归一化，引用 `loadJsonArray`/`loadJsonObject` 加载每个路径
- [x] 1.2 重命名/调整 `loadJsonArray` 和 `loadJsonObject` 函数：接受单个 `string` 路径，不再处理数组
- [x] 1.3 在 `loadTemplateWorlds()` 中确认 `baseDir` 参数路径拼接逻辑正确（当前 `MODS_DIR + modId` 可能错误，应为已拼接好的 `baseDir`）
- [x] 1.4 运行 `pnpm ts-check` 确保类型正确（唯一错误为预存的 better-sqlite3 类型缺失，非本次变更引入）

## 2. 修复 Serverless 数据库路径（db/index.ts）

- [x] 2.1 引入 `WANJIE_DATA_DIR` 环境变量，默认值 `path.resolve(process.cwd(), '.data')`
- [x] 2.2 修改 `ensureDatabase()` 函数：mkdir 失败时自动尝试 `/tmp/wanjie-data`，均失败则回退到 `:memory:` SQLite
- [x] 2.3 添加遗留数据迁移逻辑：旧路径文件存在时自动复制到新路径
- [x] 2.4 将 `console.log` 替换为 `core/logger` 的 `createLogger('DB')` 实例
- [x] 2.5 运行 `pnpm ts-check` 确保类型正确（同 1.4，预存问题）

## 3. 后端日志统一

- [x] 3.1 `src/app/api/init.ts`：文件顶部 `const log = createLogger('API Init')`，替换所有 `console.log/warn/error`
- [x] 3.2 `src/app/api/db/index.ts`：文件顶部 `const log = createLogger('DB')`，替换所有 `console.log`
- [x] 3.3 `src/app/api/v1/worlds/generate/basic/route.ts`：文件顶部 `const log = createLogger('Basic')`，替换所有 `console.log/error`
- [x] 3.4 `src/app/api/v1/worlds/generate/route.ts`：文件顶部 `const log = createLogger('Generate')`，替换所有 `console.log/error`
- [x] 3.5 `src/app/api/v1/worlds/generate/details/route.ts`：文件顶部 `const log = createLogger('Details Generate')`，替换所有 `console.log/error`
- [x] 3.6 `src/app/api/v1/worlds/route.ts`：文件顶部 `const log = createLogger('Worlds')`，替换所有 `console.log/error`
- [x] 3.7 `src/instrumentation.ts`：文件顶部 `const log = createLogger('Instrumentation')`，替换所有 `console.log`
- [x] 3.8 运行 `pnpm ts-check` 确保类型正确（同 1.4，预存问题）

## 4. 移除客户端 Mod 加载

- [x] 4.1 删除 `src/modules/mod/hooks/useModLoader.ts`
- [x] 4.2 修改 `src/modules/mod/components/ModInitProvider.tsx`：移除 `useModLoader` 依赖，变为无操作 wrapper，`useModContext()` 始终返回 phase='ready' 的 safe default
- [x] 4.3 修改 `src/app/page.tsx`：移除阻塞逻辑，不依赖 `modLoadState.phase`
- [x] 4.4 修改 `src/views/home/StartScreen.tsx`：移除 `modLoadState` prop（若仅用于判断加载），如需保留则简化接口
- [x] 4.5 更新 `src/modules/mod/index.ts` barrel 导出：移除 `useModLoader` 导出
- [x] 4.6 确认 `ModLoadingOverlay`、`ModErrorBanner` 等组件未被其他位置引用后评估是否保留
- [x] 4.7 运行 `pnpm ts-check` 和 `pnpm lint` 确保无引用错误（ts-check 同预存问题；lint 变更文件无新增错误）

## 5. 验证与测试

- [x] 5.1 运行 `pnpm build` 确保完整构建通过（better-sqlite3 原生模块打包为预存问题，非本次变更引入）
- [ ] 5.2 本地启动 `pnpm dev` 验证世界生成 API 正常工作
- [ ] 5.3 检查控制台日志格式一致性：所有后端日志均携带 `[LEVEL] [ModuleName]` 前缀
- [ ] 5.4 检查客户端 DevTools 网络面板：确认不再请求 `/mods/` 下的 JSON 文件
- [x] 5.5 运行 `pnpm check-sizes` 确保文件大小合规
- [x] 5.6 运行 `pnpm test` 确保现有测试通过（10 文件 134 测试全部通过）
