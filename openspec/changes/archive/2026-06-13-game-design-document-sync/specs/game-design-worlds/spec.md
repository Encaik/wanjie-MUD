# game-design-worlds

## Purpose

世界系统设计文档。迁移和整合现有 `design/world-design.md`、`doc/design/world-selection-system-design.md` 等内容到新的 GDD 体系。

## ADDED Requirements

### Requirement: 世界系统章节内容

`game-design/worlds.md` SHALL 涵盖以下设计要点：

1. **8 种世界观定义** — 修仙、仙侠、高武、武侠、科技、魔幻、异能、末世的核心区别
2. **WorldViewRegistry** — 从硬编码到 registry 模式的架构演进
3. **难度与系数系统** — baseCoefficient、飞升加成、难度等级划分
4. **境界体系** — 各世界观不同的境界命名和成长曲线
5. **世界机制** — 危险、机缘、世界效果系统
6. **飞升系统** — 世界穿越、传承、印记
7. **世界生成流程** — seed 驱动的确定性生成、前后端分离

#### Scenario: 内容完整性
- **WHEN** 审查 worlds.md
- **THEN** 必须包含上述 7 个设计要点中的至少 6 个

#### Scenario: 代码引用
- **WHEN** 审查 worlds.md 的数据模型区块
- **THEN** 所有核心类型（World、WorldView、WorldMechanics 等）必须标注代码位置（文件路径:行号）

### Requirement: 旧文档迁移

现有设计文档 SHALL 被消化吸收后整合到 worlds.md 中，而非直接复制粘贴：

- `design/world-design.md` → 主要源，提取设计原则和核心概念
- `doc/design/world-selection-system-design.md` → 提取难度系数和选择策略

#### Scenario: 迁移不丢失信息
- **WHEN** 对比 worlds.md 和旧文档
- **THEN** 旧文档中的所有核心设计决策必须在 worlds.md 中有对应体现，或在「相关文档」中有链接引用

### Requirement: 模块映射完整性

worlds.md 的「模块映射」区块 SHALL 包含从设计概念到代码位置的完整映射：

| 概念 | 代码位置 | 说明 |
|------|----------|------|
| WorldViewRegistry | `src/core/registry/` | 世界观注册中心 |
| 世界生成 API | `src/app/api/v1/worlds/` | 后端 API |
| 世界选择 UI | `src/views/world-select/` | React 页面 |
| 世界池引擎 | `src/core/world/WorldPoolEngine.ts` | 世界池管理 |

#### Scenario: 模块映射覆盖
- **WHEN** 审查 worlds.md
- **THEN** 模块映射表至少覆盖 core/、modules/、views/ 三个层次的核心文件
