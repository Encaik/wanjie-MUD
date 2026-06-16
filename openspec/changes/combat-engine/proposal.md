## Why

当前项目没有独立的战斗引擎，战斗逻辑散落在探险模块中。需要一个统一的、基于新核心值系统的战斗引擎，支持回合制战斗、速度出手权、技能随机选择与冷却、多种开场类型。

## What Changes

- 新建 `src/core/combat/` — 核心战斗引擎模块
- 战斗流程：开场类型 → 速度计算 → 装备修正 → 回合制攻防
- 伤害公式采用宝可梦式：`((2×Level+10)/250 × (ATK/DEF) × Power + 2) × Modifiers`
- 物攻对物防，特攻对特防
- 技能随机选择 + 时间冷却
- 速度决定出手顺序，开场类型可提供先手/速度加成

## Capabilities

### New Capabilities
- `combat-engine`: 核心回合制战斗引擎

## Impact

- `src/core/combat/` — 新模块
- 依赖 `src/core/world/calculateCoreStats.ts` 的核心值
