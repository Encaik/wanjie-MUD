## Context

当前系统存在三标识体系（`id`/`type`/`name`），但 `World.type` 字段仍存储中文显示名（如"武侠世界"），而 `WorldViewRegistry` 的键为英文 kebab-case（如"wuxia"）。`World` 接口已有 `worldviewId` 字段指向正确的英文 ID，但多处消费代码（`getNamePoolFromRegistry`、`getWorldData`、`getStatLabels`）在使用 `world.type`（中文名）查找注册中心，导致查找失败。

`world-type-english-id` spec 已规定"新增代码 MUST 使用英文 `type`"，但迁移尚未完成，遗留的中文查找路径在多个模块中同时存在。

## Goals / Non-Goals

**Goals:**
- 修复世界选择→角色选择流程的运行时崩溃（`姓名池未加载` 错误）
- 修复属性体系标签在所有世界观下显示相同文案的问题
- 为世界选择页添加重新生成按钮和世界观类型筛选
- 为角色选择页确保刷新按钮可见可用
- 统一消费层使用 `worldviewId`（英文 kebab-case）查找注册中心

**Non-Goals:**
- 不修改 `World.type` 字段的语义（保持中文名向后兼容）
- 不改变 `WorldViewRegistry` 的键体系（维持英文 kebab-case）
- 不重构整个 `generators.ts` 文件
- 不引入新的数据格式或 API 端点

## Decisions

### 决策 1：消费层统一使用 `worldviewId` 而非 `type`

**选择**：在所有调用 `registry.get()` 的地方，使用 `worldviewId`（英文 kebab-case，来自 `World.worldviewId` 或 `WorldviewDefinition.id`）替代 `world.type`。

**备选方案**：
- A) 在 `WorldViewRegistry` 中增加中文名→英文ID反向映射：增加维护负担，容易不一致
- B) 修改 `World.type` 为英文 ID：破坏所有依赖中文 `type` 的旧代码，风险过大
- C) 在 `getNamePoolFromRegistry` 等函数内部做名称转换：治标不治本，转换逻辑分散

**选择理由**：`World` 接口已经定义了 `worldviewId` 字段（`world-type-english-id` spec 要求），消费代码应使用该字段查找注册中心。这是最小侵入性的修改，且符合 spec 要求。

### 决策 2：`generateCharacters` 接收 `worldviewId` 参数

**选择**：修改 `generateCharacter` 和 `generateCharacters` 的签名，增加 `worldviewId: string` 参数，内部调用 `getNamePoolFromRegistry(worldviewId)` 和 `getTraitPoolFromRegistry(worldviewId)`。

**备选方案**：
- A) 让函数内部从 `worldType`（中文名）推导英文 ID：增加不必要的映射复杂度
- B) 保持 `worldType` 参数不变，调用前转换：不符合"逐步迁移到英文 type"的方向

### 决策 3：世界选择页筛选逻辑

**选择**：在 WorldSelect 视图层使用客户端筛选（从已加载的世界列表中按 `worldviewId` 过滤），而非发起新 API 请求。刷新按钮调用 `startNewGame` 重新生成世界列表。

**备选方案**：
- A) 后端筛选 API：增加网络延迟，对 8 个世界的列表来说过度设计
- B) 服务端组件筛选：当前页面已是 client component，架构不支持

### 决策 4：属性标签修复点

**选择**：修改 `getStatLabels` 和 `getWorldData`，使其接受 `worldviewId`（英文）而非 `worldType`（中文）。调用方（`WorldInfoBar`、`WorldSelect`）改为传递 `world.worldviewId`。

## Risks / Trade-offs

- **[风险] 旧代码路径可能仍使用中文 `type` 查找** → 缓解：通过 TypeScript 类型系统确保 `getWorldData` 等函数明确接受英文 ID；在 `getNamePoolFromRegistry` 中增加防御性日志（开发模式下警告中文名传入）
- **[风险] UI 变更可能引入视觉回归** → 缓解：刷新/筛选按钮使用现有 shadcn/ui 组件，保持与现有 UI 风格一致
- **[取舍] `World.type` 语义模糊（既不是纯中文也不是纯英文）** → 接受现状，在后续全面迁移中解决，不在此变更中处理
