## Why

当前项目中"世界观"（Worldview，即修仙/武侠/科技等世界类型模板）和"世界"（World，即从世界观生成的具象世界实例）两个概念严重混叠。世界观定义数据分布在 `WorldDataRegistry`、`modules/narrative/data/worlds/` 和 `modules/identity/data/` 三套并行系统中，世界生成逻辑分裂在 `modules/identity/logic/generators.ts` 和 `app/api/v1/worlds/generate/generator.ts` 两处。核心问题：前端无法通过统一的 API 接口请求后端基于 Mod 加载的世界观来生成世界实例，世界观文本和世界生成数据没有形成清晰的上下游关系。

## What Changes

- **定义清晰的"世界观→世界"两层模型**：世界观（Worldview）是 Mod 加载的世界类型定义（规则、术语、机制、数据池），世界（World）是从世界观生成的具象实例
- **统一世界观数据入口**：将 `modules/narrative/data/worlds/` 的世界观文本（WorldTextDefinition）整合进 `WorldDataRegistry`，消除三套并行术语系统
- **世界观文本强类型化**：替换 `WorldDataRegistry.worldTexts` 的 `Record<string, unknown>` 为完整的 `WorldTextDefinition` 类型
- **统一世界生成管线**：将 `modules/identity/logic/generators.ts` 中的生成逻辑迁移到 `core/world/`，作为纯函数供 API 路由调用 — **BREAKING**：移除 `modules/identity/logic/generators.ts` 中的 `generateWorld` 函数
- **前端通过 API 生成世界**：前端删除本地世界生成代码，改为调用 `/api/v1/worlds/generate` 接口获取后端生成的 World
- **清理硬编码兜底**：移除 `worldData.ts`、`worldEffectsData.ts`、`traits.ts`、`namePools.ts` 中的硬编码兜底数据，改为从 `WorldDataRegistry` 读取（不存在时抛错而非静默降级）
- **重命名消除歧义**：`WorldTypeData` 重命名为 `WorldviewDefinition`，相关函数名同步更新 — **BREAKING**

## Capabilities

### New Capabilities
- `worldview-definition`: 世界观定义 — Mod 加载的世界类型完整定义，包含术语、文本、属性计算、境界系统、门派、危险、机遇、特性池、名称池等全部数据，作为生成世界的模板
- `world-generation-api`: 世界生成 API — 前端通过 REST API 请求后端基于指定世界观生成世界实例，支持批量生成、分阶段生成（基本信息/详情）

### Modified Capabilities
- `world-data-consolidation`: 世界观数据整合 — 将原分散在三处（registry、narrative、identity）的世界观相关数据统一到 WorldDataRegistry，使用强类型 WorldTextDefinition
- `world-provider-registry`: 世界观提供者注册 — WorldProvider 从"世界生成器"变为"世界观→世界"的生成工厂，接收 WorldviewDefinition 产出 World

## Impact

- **`src/core/types/types.ts`**：`WorldTypeData` → `WorldviewDefinition`，`World` 接口增加 `worldviewId` 字段
- **`src/core/registry/WorldDataRegistry.ts`**：`worldTexts` 字段类型变更为 `WorldTextDefinition`，合并 narrative 文本数据
- **`src/core/world/`**：新增世界生成纯函数，从 `WorldviewDefinition` 生成 `World`
- **`src/modules/narrative/data/worlds/`**：世界观文本迁移到 registry，原文件改为 barrel re-export（过渡期后删除）
- **`src/modules/identity/logic/generators.ts`**：移除 `generateWorld` 函数（迁移到 `core/world/`）
- **`src/modules/identity/data/`**：移除硬编码兜底数据，`worldData.ts`、`worldEffectsData.ts`、`traits.ts`、`namePools.ts` 改为纯 registry 读取
- **`src/app/api/v1/worlds/generate/`**：重构生成管线，调用 `core/world/` 的纯函数
- **`src/app/api/init.ts`**：更新初始化流程，加载世界观文本到 registry
- **前端**：删除本地世界生成调用，全部改为 API 请求
