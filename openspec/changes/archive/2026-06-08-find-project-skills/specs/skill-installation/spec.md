## ADDED Requirements

### Requirement: P0 技能安装
项目 SHALL 安装不低于 3 个 P0 级第三方技能。安装命令使用 `npx skills add <owner/repo@skill> -g -y`（全局安装）或 `npx skills add <owner/repo@skill> -y`（项目级安装）。

#### Scenario: 游戏领域技能安装
- **WHEN** 确定游戏设计/开发相关的 P0 技能
- **THEN** 至少 1 个游戏相关技能安装到项目级别（`.claude/skills/` 目录下可见）

#### Scenario: 前端开发技能安装
- **WHEN** 确定前端设计/开发模式相关的 P0 技能
- **THEN** 至少 1 个前端相关技能安装到用户全局或项目级别

#### Scenario: 安装验证
- **WHEN** 所有 P0 技能安装完成
- **THEN** 运行 `npx skills check` 确认所有技能状态正常，无损坏或冲突

### Requirement: 技能兼容性验证
安装到项目级的技能 SHALL 通过与 CLAUDE.md 规则体系的兼容性检查，确保不引入冲突建议。

#### Scenario: 规则冲突检测
- **WHEN** 技能的建议涉及目录职责（如建议在 lib/ 中放 React 组件）
- **THEN** 标注为潜在冲突，记录在安装报告中。Agent 使用时以 CLAUDE.md 规则为准

#### Scenario: 类型安全检测
- **WHEN** 技能的建议涉及放宽类型检查（如推荐使用 any 类型）
- **THEN** 标注为与项目 `no-explicit-any` 规则冲突，使用时需手动豁免

### Requirement: 安装记录报告
安装完成后 SHALL 生成安装记录报告，包含每个已安装技能的名称、版本、安装位置（项目/全局）、安装时间、兼容性检查结果。

#### Scenario: 报告内容
- **WHEN** 安装流程完成
- **THEN** 报告至少包含：技能名称、安装命令、安装位置、兼容性状态（通过/有冲突/未检查）

### Requirement: 可选 P1 技能安装指南
项目 SHALL 为 P1 级推荐技能提供一键安装指南，用户可根据需要选择安装。

#### Scenario: 安装指南
- **WHEN** 用户查看安装指南
- **THEN** 每个 P1 技能列出安装命令、功能简述、建议安装位置（项目级或全局）
