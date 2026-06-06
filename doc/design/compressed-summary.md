# 压缩摘要

## 用户需求与目标
- 原始目标: 按照 game-design-strict 设计并实现完整的数值体系（敌人功法/装备/碎片掉落合成系统）
- 当前目标: 实施阶段一优化（战斗策略系统），不考虑老版本兼容，直接用新逻辑重构替换
- 验收标准与约束:
  - 代码质量和架构要尽可能提高
  - 完成后在该文档中标记已完成
  - 基于评审报告中的 P0/P1 优先级问题进行设计
  - 设计方案需具备完整的可扩展性，便于未来功能扩展

## 项目概览
- 概述: 修仙类文字冒险游戏，包含修炼、战斗、装备、功法、成就、势力、飞升等系统
- 技术栈:
  - Next.js 16 (App Router)
  - React 19
  - TypeScript 5
  - shadcn/ui + Tailwind CSS 4
- 编码规范: 使用 TypeScript 类型安全，遵循模块化设计

## 关键决策
- **多货币架构**：使用 `CurrencyType` 枚举和 `CurrencyService` 统一管理所有货币
- **商品系统**：商品配置与商店配置分离，支持动态生成和静态配置
- **克制关系系统**：功法只有元素属性，装备具有元素和武器类别属性
- **克制关系显示**：功法面板显示元素克制循环图，装备面板显示武器克制循环图

## 核心文件修改
- 文件操作:
  - create: `doc/design/comprehensive-optimization-design.md` (综合优化设计方案)
  - create: `src/lib/game/battle/types.ts` (战斗策略系统类型定义)
  - create: `src/lib/game/battle/skillSystem.ts` (战斗技能系统)
  - create: `src/lib/game/battle/decisionSystem.ts` (战斗决策系统)
  - create: `src/lib/game/battle/eventSystem.ts` (战斗事件系统)
  - create: `src/lib/game/battle/battleController.ts` (战斗流程控制器)
  - create: `src/lib/game/battle/index.ts` (战斗系统模块入口)
  - create: `src/lib/game/adventureBattleIntegration.ts` (冒险战斗集成层)

## 实施进度

### ✅ 已完成 - 阶段一：战斗策略系统

**核心模块**:

1. **类型定义** (`src/lib/game/battle/types.ts`)
   - BattleActionType - 战斗行动类型（攻击/技能/防御/物品/逃跑）
   - BattleSkill - 战斗技能定义
   - ExtendedBattleState - 扩展战斗状态
   - DecisionOption - 决策选项
   - TurnResult - 回合结果
   - TriggeredEvent - 触发事件

2. **战斗技能系统** (`src/lib/game/battle/skillSystem.ts`)
   - 从功法生成战斗技能
   - 技能冷却管理
   - 技能推荐算法
   - 技能伤害计算

3. **战斗决策系统** (`src/lib/game/battle/decisionSystem.ts`)
   - 生成可用决策选项
   - 执行玩家/敌人行动
   - 回合流程控制
   - 自动战斗AI

4. **战斗事件系统** (`src/lib/game/battle/eventSystem.ts`)
   - 随机战斗事件（暴击/闪避/连击/护盾等）
   - Buff/Debuff管理
   - 特殊效果处理

5. **战斗流程控制器** (`src/lib/game/battle/battleController.ts`)
   - 战斗状态生命周期管理
   - 协调技能、决策、事件系统
   - 战斗结算

6. **冒险集成层** (`src/lib/game/adventureBattleIntegration.ts`)
   - 与现有冒险系统集成
   - 数据适配器

**验证结果**:
- ✅ TypeScript 类型检查通过
- ✅ 所有模块导出正常

## TODO
- ⏳ 重构战斗相关UI组件
- ⏳ 与 adventure.ts 的完整集成替换
- ⏳ 单元测试编写
- ⏳ 阶段二：经济平衡系统
- ⏳ 阶段三：地牢随机事件
- ⏳ 阶段四：终局玩法系统
