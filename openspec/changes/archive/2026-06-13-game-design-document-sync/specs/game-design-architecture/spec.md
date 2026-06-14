# game-design-architecture

## Purpose

架构决策记录（Architecture Decision Record）。迁移和整合现有 `doc/architecture/module-map.md`、`doc/architecture/analysis-report.md`、`doc/architecture/optimization-roadmap.md` 等内容到新的 GDD 体系。

## ADDED Requirements

### Requirement: 架构章节内容

`game-design/architecture.md` SHALL 涵盖以下设计要点：

1. **五层架构概述** — app/、views/、modules/、core/、shared/ 的职责边界和依赖规则
2. **核心系统架构** — core/ 内部子系统（事件、计算、世界、注册、Mod、引擎）的关系
3. **前后端分离设计** — API 路由层、seed 驱动生成、确定性结果
4. **事件系统设计** — GameEventManager、事件总线模式、跨模块通信规则
5. **Mod 系统设计** — Mod 加载、验证、注册流程、Mod 内容类型
6. **计算引擎设计** — 统一数值计算、纯函数、ActionResult 模式

#### Scenario: 内容完整性
- **WHEN** 审查 architecture.md
- **THEN** 必须包含上述 6 个设计要点中的至少 5 个

### Requirement: 关键架构决策记录

architecture.md SHALL 记录影响架构的关键设计决策及其理由：

- 从硬编码 WorldType 联合类型到 Registry 模式的演进
- 从单层目录到五层架构的重构历程
- 前后端分离的时机和方式
- 纯函数原则的适用范围和例外

#### Scenario: 决策记录存在性
- **WHEN** 审查 architecture.md
- **THEN** 至少记录 3 个关键架构决策，每个决策包含「决策内容」「理由」「替代方案」

### Requirement: 架构图

architecture.md SHALL 包含 ASCII 架构图，展示五层之间的依赖关系和数据流向。

#### Scenario: 架构图存在
- **WHEN** 审查 architecture.md
- **THEN** 必须包含至少一个 ASCII 架构图（依赖关系图或数据流向图）
