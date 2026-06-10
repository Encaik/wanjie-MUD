## 1. 基础设施搭建

- [x] 1.1 创建 `src/core/logger/` 目录结构（含 `__tests__/` 子目录）

## 2. 类型定义

- [x] 2.1 创建 `src/core/logger/types.ts`：定义 `LogLevel` 枚举（DEBUG/INFO/WARN/ERROR/SILENT）、`Logger` 接口（debug/info/warn/error 方法签名）

## 3. 核心 Logger 实现

- [x] 3.1 创建 `src/core/logger/logger.ts`：实现 `createLogger(name: string): Logger` 工厂函数，自动为每条日志添加 `[name]` 前缀
- [x] 3.2 实现 `setLogLevel(level: LogLevel)` 和 `getLogLevel(): LogLevel` 运行时级别控制
- [x] 3.3 实现默认级别逻辑：dev 环境 `DEBUG`，production 环境 `WARN`

## 4. 桶文件

- [x] 4.1 创建 `src/core/logger/index.ts`：统一导出 `LogLevel`、`Logger`、`createLogger`、`setLogLevel`、`getLogLevel`

## 5. 测试

- [x] 5.1 创建 `src/core/logger/__tests__/logger.test.ts`：测试 createLogger 前缀、日志级别过滤、setLogLevel/getLogLevel、默认级别

## 6. 替换 core/ 中的 console 调用

- [x] 6.1 替换 `src/core/mod/ModLoader.ts` 中的所有 `console.log/warn/error` 为 logger API（约 25 处）
- [x] 6.2 替换 `src/core/registry/WorldDataRegistry.ts` 中的 `console.warn` 调用
- [x] 6.3 替换 `src/core/registry/WorldMechanicsRegistry.ts` 中的 `console.warn` 调用
- [x] 6.4 替换 `src/core/events/eventBus.ts` 中的 `console.warn` 调用（如存在）
- [x] 6.5 替换 `src/core/events/eventRegistry.ts` 中的 `console` 调用（如存在）
- [x] 6.6 替换 `src/core/engine/gameSystems.ts` 中的 `console` 调用（如存在）
- [x] 6.7 替换 `src/core/calculation/` 目录下各文件中的 `console` 调用

## 7. 替换 shared/ 中的 console 调用

- [x] 7.1 替换 `src/shared/utils/saveUtils.ts` 中的所有 `console.log/error/warn` 调用
- [x] 7.2 替换 `src/shared/utils/typeGuards.ts` 中的 `console.warn` 调用

## 8. 替换 views/ 中的 console 调用

- [x] 8.1 替换 `src/views/game/MainGame.tsx` 中的 `console.log` 调用
- [x] 8.2 替换 `src/views/game/useGameState.tsx` 中的 `console.log/error/warn` 调用

## 9. 删除旧代码

- [x] 9.1 删除 `src/shared/utils/logger.ts`
- [x] 9.2 从 `src/shared/utils/index.ts` 中移除 `LogLevel` 和 `logger` 的导出

## 10. 验证

- [x] 10.1 运行 `pnpm ts-check` 确保类型正确
- [ ] 10.2 运行 `pnpm lint:strict` 确保代码质量
- [ ] 10.3 运行 `pnpm check-sizes` 确保文件大小合规
- [x] 10.4 运行 `pnpm test` 确保所有测试通过
- [x] 10.5 运行 `pnpm build` 确保构建成功
