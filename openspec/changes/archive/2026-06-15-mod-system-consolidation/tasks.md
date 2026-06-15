## 1. 阶段一：类型归一 + 目录结构

- [x] 1.1 创建 `core/mod/types.ts`，定义共享类型和 IModLoader 接口
- [x] 1.2 重构 `core/mod/ModManifest.ts`：移除 fetch 依赖，只保留纯类型 + 校验函数
- [x] 1.3 将 ModLoadError 等类型移到 `core/mod/types.ts`
- [x] 1.4 创建 `core/mod/loader/index.ts` barrel 导出
- [x] 1.5 更新 `core/mod/index.ts` barrel 导出
- [x] 1.6 删除 `app/api/mod-types.ts`（确认唯一引用方为 app/api/init.ts）
- [x] 1.7 更新 `app/api/init.ts` 的 import 路径
- [x] 1.8 TypeScript 类型检查通过

## 2. 阶段一：加载器实现

- [x] 2.1 创建 `core/mod/loader/base-loader.ts`（依赖排序、进度回调、错误汇总）
- [x] 2.2 创建 `core/mod/loader/server-loader.ts`（fs 发现 + 全量内容类型注册）
- [x] 2.3 创建 `core/mod/loader/client-loader.ts`（fetch 发现 + styles/theme 加载）
- [x] 2.4 创建 `core/mod/loader/__tests__/server-loader.test.ts`
- [x] 2.5 创建 `core/mod/loader/__tests__/client-loader.test.ts`
- [x] 2.6 运行 `pnpm test` 确认测试通过（8 passed）

## 3. 阶段二：并行验证 + 切换

- [x] 3.1 替换 `app/api/init.ts` 为 `ServerModLoader` 调用
- [x] 3.2 更新所有 API 路由调用方添加 `await`
- [x] 3.3 TypeScript 检查通过
- [x] 3.4 `pnpm build` 构建成功

## 4. 阶段三：客户端加载 + 清理

- [x] 4.1 ModInitProvider 集成 ClientModLoader
- [x] 4.2 ModErrorBanner 接入警告列表
- [x] 4.3 删除废弃的 ModLoadingOverlay（确认无有效引用）
- [x] 4.4 TypeScript 检查通过

## 5. 最终验证

- [x] 5.1 构建成功
- [x] 5.2 全部 233 个测试通过
- [x] 5.3 `app/api/init.ts` 无残留内联加载代码
- [x] 5.4 确认所有内容类型的数据文件存在（8 attributes + 3 races + 1 talents + 2 npcs + 1 quests）
