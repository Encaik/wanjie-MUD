## Why

世界机制数据已在 `WorldviewDefinition.mechanics` 中随世界观一起加载，但前端仍通过 `getWorldMechanics()` 直接调用 `WorldMechanicsRegistry` 单例获取。这违反了服务端数据加载架构——mod 数据走服务端，前端应通过 API 获取。

## What Changes

- 新建 `GET /api/v1/worldviews/[id]/mechanics` API 端点，返回指定世界观的机制信息
- 前端 `WorldSelect.tsx` 通过 API 获取机制描述，不再直接调用 `getWorldMechanics()`
- **BREAKING**: 删除 `factory.ts` 中的 `getWorldMechanics()` 和 `hasUniqueMechanics()` 函数（移除前端对 `WorldMechanicsRegistry` 的直接访问）
- `worldAudit.ts` 改从 API 获取或从 WorldviewDefinition 读取 mechanics 字段
- `WorldMechanicsRegistry` 保留为服务端专用（init.ts 注册，API 层查询）

## Capabilities

### New Capabilities

- `mechanics-api`: 世界机制 API 端点——通过 `GET /api/v1/worldviews/[id]/mechanics` 获取世界观的机制配置

### Modified Capabilities

- `world-mechanics-registry`: WorldMechanicsRegistry 限定为服务端专用，前端不再直接访问

## Impact

- **新建**: `src/app/api/v1/worldviews/[id]/mechanics/route.ts`
- **修改**: `src/views/world-select/WorldSelect.tsx`（API 调用替代直接查询）
- **修改**: `src/modules/identity/logic/worlds/factory.ts`（删除或标记服务端专用）
- **修改**: `src/modules/identity/logic/worldAudit.ts`（改用 worldview.mechanics）
- **修改**: `src/modules/identity/index.ts`（移除 getWorldMechanics 导出）
