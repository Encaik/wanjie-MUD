## 1. 新建 API 端点

- [ ] 1.1 创建 `src/app/api/v1/worldviews/[id]/mechanics/route.ts`：GET 端点，从 WorldMechanicsRegistry 读取机制，仅返回 mechanics 对象，不返回全量 worldview 数据

## 2. 清理现有 API

- [ ] 2.1 清理 `src/app/api/v1/worldviews/route.ts`：删除重复的旧 worldTypes 回退死代码（lines 65-83），只保留 worldview 路径

## 3. 更新前端

- [ ] 3.1 修改 `src/views/world-select/WorldSelect.tsx`：用 fetch API 替代 `getWorldMechanics()` 调用，添加 loading/error 状态
- [ ] 3.2 修改 `src/modules/identity/logic/worlds/factory.ts`：删除 `getWorldMechanics()` 和 `hasUniqueMechanics()` 导出函数
- [ ] 3.3 修改 `src/modules/identity/logic/worldAudit.ts`：用 `worldview.mechanics` 替代 `hasUniqueMechanics()` 调用
- [ ] 3.4 修改 `src/modules/identity/index.ts`：移除 `getWorldMechanics` 和 `hasUniqueMechanics` 导出

## 4. 验证

- [ ] 4.1 运行 `pnpm ts-check` 确保无类型错误
- [ ] 4.2 运行 `pnpm test` 确保测试通过
- [ ] 4.3 运行 `pnpm build` 确保构建成功
