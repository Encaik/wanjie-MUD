## 1. 修复数据库持久化静默吞错

- [x] 1.1 在 `src/app/api/db/sqljs-wrapper.ts` 的 `#saveToDisk()` 方法中，将空的 `catch` 块改为通过 `createLogger('DB')` 输出 ERROR 日志，内容包含 `this.filePath` 和 `err` 信息

## 2. 增加数据库操作诊断日志

- [x] 2.1 在 `src/app/api/v1/worlds/store.ts` 中为 `saveWorld` 函数添加 DEBUG 日志（记录 worldId 和操作类型 insert/update）
- [x] 2.2 在 `src/app/api/v1/worlds/store.ts` 中为 `getWorldById` 函数添加 DEBUG 日志（记录查找的 id 和是否找到）

## 3. basic API 增加写入验证

- [x] 3.1-3.3 在 `src/app/api/v1/worlds/generate/basic/route.ts` 所有 6 个代码路径（V3 有/无 seed、随机世界观 V3、旧 API 回退 ×3）中，`saveWorld()` 后立即 `getWorldById()` 反查，失败则返回 500

## 4. 修复跨模块数据不同步（核心修复）

- [x] 4.1 `src/app/api/db/index.ts` `getDb()`: 添加文件 mtime 变更检测机制——当检测到数据库文件被其他 API 路由模块修改后，自动关闭旧实例并从磁盘重新加载
- [x] 4.2 `src/app/api/db/index.ts`: 新增 `touchDbMtime()` 导出函数，供 `saveWorld` 在写入后调用，同步时间戳避免将自身写入误判为外部变更
- [x] 4.3 `src/app/api/v1/worlds/store.ts` `saveWorld()`: 在 INSERT/UPDATE 后调用 `touchDbMtime()` 同步文件时间戳
- [x] 4.4 `src/app/api/db/index.ts`: 新增 `refreshDbFromDisk()` 导出函数，供未来其他读操作使用

## 5. 验证

- [x] 5.1 `pnpm ts-check` — 类型检查通过 ✅
- [x] 5.2 `pnpm build` — 构建成功 ✅
- [x] 5.3 手动测试 — 显式 seed (PASS1)、随机 seed (f6e83acf, 45dc3f45) 的 basic → GET → details 全链路均返回 200 ✅
- [x] 5.4 错误路径 — 不存在的 seed 正确返回 404 ✅
- [x] 5.5 跨 worldviewId — cultivation/martial/tech/magic 等多个世界观均测试通过 ✅
