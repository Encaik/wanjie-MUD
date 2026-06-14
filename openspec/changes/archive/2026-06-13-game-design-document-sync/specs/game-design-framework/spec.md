# game-design-framework

## Purpose

游戏设计文档的整体框架——包括目录结构、README、变更日志和同步流程规则。本框架确保文档的可维护性、可导航性和可持续性。

## ADDED Requirements

### Requirement: 设计文档目录结构

项目 SHALL 在项目根目录下创建 `game-design/` 目录，包含以下文件结构：

```
game-design/
├── index.md              ← 目录索引 + 项目元信息
├── README.md             ← 使用说明 + 同步流程
├── overview.md           ← 游戏全景（核心概念 + 核心循环 + 玩家旅程）
├── worlds.md             ← 世界系统
├── characters.md         ← 角色系统
├── progression.md        ← 成长系统（后续补充）
├── combat.md             ← 战斗系统（后续补充）
├── economy.md            ← 经济系统（后续补充）
├── social.md             ← 社交系统（后续补充）
├── collection.md         ← 收集系统（后续补充）
├── architecture.md       ← 架构决策记录
└── changelog.md          ← 设计变更时间线
```

#### Scenario: 目录结构验证
- **WHEN** 实施完成
- **THEN** `game-design/` 目录下必须存在 index.md、README.md、overview.md、worlds.md、characters.md、architecture.md、changelog.md 七个文件

### Requirement: 每章内容模板

每个系统章节 SHALL 遵循统一的五区块模板：

1. **设计原则** — 为什么这么设计，关键决策和理由
2. **核心概念** — 该系统的核心数据和流程，关键术语定义
3. **数据模型** — 核心类型定义（标注代码位置），关键关系图
4. **模块映射** — 概念到代码位置的映射表
5. **相关文档** — 详细设计文档和 OpenSpec Change 链接

#### Scenario: 模板一致性
- **WHEN** 审查任意系统章节
- **THEN** 该章节必须包含设计原则、核心概念、数据模型、模块映射、相关文档五个区块（允许少量区块合并，但不得缺少任一核心内容）

### Requirement: 同步流程规则

项目 SHALL 在 `game-design/README.md` 中定义设计文档同步流程，并在 CLAUDE.md 中引用：

- 创建 OpenSpec Change 时：如果设计有变动，更新 `game-design/` 对应章节
- 归档 OpenSpec Change 时：追加记录到 `game-design/changelog.md`
- 非 Change 小改动：顺手更新

#### Scenario: 同步流程文档化
- **WHEN** 实施完成
- **THEN** `game-design/README.md` 必须包含上述三条同步规则

### Requirement: 变更日志格式

`game-design/changelog.md` SHALL 使用统一的变更记录格式：

```markdown
## [日期] - 变更标题

- **改动**: 设计变更内容描述
- **原因**: 为什么做这个变更
- **涉及章节**: 被修改的章节列表
- **开发者**: 执行变更的开发者
```

#### Scenario: 变更日志格式验证
- **WHEN** 追加新记录到 changelog.md
- **THEN** 每条记录必须包含「改动」「原因」「涉及章节」三个字段
