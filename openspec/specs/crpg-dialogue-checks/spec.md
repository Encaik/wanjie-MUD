# crpg-dialogue-checks

## Purpose

剧情对话支持 CRPG 风格的属性/核心值检定系统。对话选项可关联检定（d20 + 修正 vs 难度），检定结果影响对话分支走向。此功能定义数据结构和检定接口，不包含完整 UI 实现。

## Requirements

### Requirement: 对话检定数据结构

每个对话选项 SHALL 支持可选的检定定义：

```typescript
interface DialogueCheck {
  type: 'attribute' | 'coreStat' | 'talent';
  target: string;         // 属性名 / 核心值 key / 天赋 ID
  difficulty: number;     // 难度等级 (1-30)
  successText: string;    // 成功时的文本
  failureText: string;    // 失败时的文本
  successBranch: string;  // 成功分支 ID
  failureBranch: string;  // 失败分支 ID
}
```

#### Scenario: 属性检定

- **WHEN** 对话选项定义 `{ type: "attribute", target: "悟性", difficulty: 12 }`
- **THEN** 成功条件 SHALL 为 `d20 + floor((悟性值 - 10) / 2) >= 12`
- **AND** 若角色的悟性为 16，修正为 `+3`，则需 d20 >= 9 才成功

#### Scenario: 核心值检定

- **WHEN** 对话选项定义 `{ type: "coreStat", target: "perception", difficulty: 15 }`
- **THEN** 成功条件 SHALL 为 `d20 + floor(感知值 / 阈值) >= 15`
- **AND** 阈值 SHALL 默认为 2（即感知值 / 2 作为修正）

#### Scenario: 天赋检定（自动通过）

- **WHEN** 对话选项定义 `{ type: "talent", target: "sword_mastery" }`
- **THEN** 若角色拥有该天赋 SHALL 自动成功
- **AND** 若角色没有该天赋 SHALL 自动失败
- **AND** SHALL NOT 进行 d20 投骰

### Requirement: 检定结果不影响角色状态

对话检定 SHALL 仅影响对话分支走向，SHALL NOT 直接修改角色的属性、核心值或其他状态。检定结果 SHALL 通过对话框/文本展示给玩家。

#### Scenario: 检定成功展示

- **WHEN** 角色通过 `[悟性检定]` 难度 12
- **THEN** UI SHALL 显示 "检定成功 (d20=14 + 修正3 = 17 vs DC12)"
- **AND** SHALL 展示成功分支文本

#### Scenario: 检定不影响属性

- **WHEN** 检定失败
- **THEN** 角色的悟性值 SHALL NOT 改变
- **AND** 仅对话流程受影响

### Requirement: 检定系统纯函数

检定计算 SHALL 由纯函数 `performDialogueCheck(check: DialogueCheck, attributes: Record<string, number>, coreStats: Record<CoreStatKey, number>, talents: string[], seed: number)` 执行。seed 参数 SHALL 用于 d20 投骰的确定性随机。

#### Scenario: 确定性检定

- **WHEN** 使用相同参数调用 `performDialogueCheck` 两次
- **THEN** 两次的 d20 结果 SHALL 相同
- **AND** 两次的检定结果（成功/失败）SHALL 相同

### Requirement: 检定难度分级

难度等级 SHALL 遵循以下标准：

| 难度 | DC 范围 | 说明 |
|------|---------|------|
| 简单 | 5-8 | 普通人也能通过 |
| 普通 | 9-12 | 需要一定能力 |
| 困难 | 13-16 | 需要专注于此领域 |
| 极难 | 17-20 | 需要精英级别的能力 |
| 传奇 | 21-25 | 只有传奇强者可能通过 |
| 神话 | 26-30 | 几乎不可能 |

#### Scenario: 早期剧情检定难度

- **WHEN** 游戏初期（角色属性约 8-15）的对话检定
- **THEN** 难度 SHALL 在 5-12 范围（简单到普通）
- **AND** 角色有 ~50-70% 的通过率（保证正向体验）
