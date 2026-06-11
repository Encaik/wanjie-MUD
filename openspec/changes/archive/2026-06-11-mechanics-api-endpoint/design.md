## Context

当前前端获取世界机制的方式：
```
WorldSelect.tsx → getWorldMechanics(world.type) → WorldMechanicsRegistry.getInstance().get(id)
```

这绕过了服务端架构——`WorldMechanicsRegistry` 是服务端单例，前端不应直接访问。

WorldMechanics 数据已随 `WorldviewDefinition.mechanics` 字段加载，服务端 init.ts 将其注册到 WorldMechanicsRegistry。前端应通过 HTTP API 获取。

## Goals / Non-Goals

**Goals:**
- 新建 `GET /api/v1/worldviews/[id]/mechanics` API
- 前端 `WorldSelect.tsx` 通过 API 获取机制信息
- 删除前端对 `WorldMechanicsRegistry` 的直接引用

**Non-Goals:**
- 不修改 `WorldMechanics` 类型定义
- 不修改服务端 `init.ts` 的注册逻辑
- 不移除 `WorldMechanicsRegistry` 本身（服务端仍使用）

## Decisions

### Decision 1: API 端点设计

**选择**: `GET /api/v1/worldviews/[id]/mechanics` — 作为 worldview 的子资源。

**原因**: Mechanics 是世界观的一部分，RESTful 路径清晰。与现有 `v1/worldviews/` 路由一致性。

**响应格式**:
```json
{
  "worldviewId": "cultivation",
  "mechanics": {
    "worldType": "修仙",
    "cultivation": { ... },
    "combat": { ... },
    "exploration": { ... },
    "uniqueMechanic": { ... }
  }
}
```

### Decision 2: 前端获取方式

**选择**: `WorldSelect.tsx` 在客户端 useEffect 中 fetch，使用 React state 缓存结果。

**原因**: 避免引入全局状态管理。WorldSelect 只需在渲染世界卡片时显示机制描述，适合组件级 fetch。

### Decision 3: factory.ts 处理

**选择**: 删除 `getWorldMechanics()` 和 `hasUniqueMechanics()` 导出函数。

**原因**: 这两个函数是前端直接访问服务端单例的唯一入口。删除后强制所有调用方走 API。

### Decision 4: API 仅返回必要数据

**选择**: 所有 worldview 相关 API 端点 SHALL 只返回前端实际需要的字段子集，SHALL NOT 返回完整的 `WorldviewDefinition`（含 namePrefixes、nameSuffixes、descriptions、dangers、opportunities、factions、traits、namePool、texts 等生成池数据）。

**原因**: 全量 worldview 数据包含大量生成池和内部配置，暴露给前端存在信息泄露风险。前端只需要摘要信息（id、name、description、visualConfig）和按需查询的 mechanics。

**应用**:
- `GET /api/v1/worldviews` — 仅返回 WorldviewSummary（已实现）
- `GET /api/v1/worldviews/[id]/mechanics` — 仅返回 mechanics 对象
- 清理 worldviews/route.ts 中重复的旧 worldTypes 回退死代码

## Risks / Trade-offs

- **[风险] API 调用增加网络延迟** → 机制数据很小（~1KB），对用户体验影响可忽略
- **[权衡] worldAudit.ts 失去 hasUniqueMechanics** → 改用 `worldview.mechanics != null` 判断，效果等价
