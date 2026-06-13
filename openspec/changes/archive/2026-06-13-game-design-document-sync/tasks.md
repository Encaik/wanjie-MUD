## 1. 框架搭建

- [x] 1.1 创建 `game-design/` 目录结构
- [x] 1.2 创建 `game-design/index.md` — 目录索引 + 项目元信息
- [x] 1.3 创建 `game-design/README.md` — 使用说明 + 同步流程（包含三条同步规则）
- [x] 1.4 创建 `game-design/changelog.md` — 设计变更日志（含初始记录：本 Change）

## 2. 游戏全景

- [x] 2.1 创建 `game-design/overview.md` — 覆盖以下内容：
  - 核心概念（穿越万界、修行成长）
  - 核心循环（冒险→战斗→成长→飞升）
  - 玩家旅程（启动页 → 世界选择 → 角色选择 → 背景故事 → 游戏主循环）
  - 游戏阶段（初期探索 → 中期成长 → 后期飞升）

## 3. 迁移世界系统文档

- [x] 3.1 创建 `game-design/worlds.md` — 消化吸收并整合以下源文档：
  - `design/world-design.md`（主要源：8 种世界类型、三层架构、难度系统、境界体系）
  - `doc/design/world-selection-system-design.md`（难度系数公式、危险/机缘效果）
- [x] 3.2 在 worlds.md 中添加模块映射表（core/registry/、core/world/、modules/、views/）
- [x] 3.3 在 worlds.md 中标注所有核心类型（World、WorldView、WorldMechanics 等）的代码位置

## 4. 迁移角色系统文档

- [x] 4.1 创建 `game-design/characters.md` — 消化吸收并整合以下源文档：
  - `doc/design/avatar-selection-balance-design.md`（5 项属性、多维度评估、属性价值矩阵）
  - `doc/design/attribute-persistence-design.md`（属性持久化机制）
- [x] 4.2 在 characters.md 中添加角色生成流程说明（seed 驱动确定性生成）
- [x] 4.3 在 characters.md 中添加核心类型（AttributeTemplate、CharacterTemplate、CoreStatKey 等）的代码位置

## 5. 迁移架构文档

- [x] 5.1 创建 `game-design/architecture.md` — 消化吸收并整合以下源文档：
  - `doc/architecture/module-map.md`（五层架构、依赖关系图、模块职责矩阵）
  - `doc/architecture/analysis-report.md`（架构分析、代码质量指标）
- [x] 5.2 在 architecture.md 中添加 ASCII 架构图
- [x] 5.3 在 architecture.md 中记录至少 3 个关键架构决策（含决策内容、理由、替代方案）

## 6. 同步规则落地

- [x] 6.1 更新 `CLAUDE.md` — 增加「设计文档同步规则」章节（创建 Change 时更新、归档时追加 changelog）

## 7. 验证

- [x] 7.1 审查所有 game-design/ 文件的模板一致性（五区块模板：设计原则、核心概念、数据模型、模块映射、相关文档）
- [x] 7.2 确认 CLAUDE.md 中已包含同步规则
- [x] 7.3 在旧文档 `design/world-design.md`、`doc/design/world-selection-system-design.md`、`doc/design/avatar-selection-balance-design.md`、`doc/design/attribute-persistence-design.md`、`doc/architecture/module-map.md`、`doc/architecture/analysis-report.md` 文件头添加已迁移标记
- [x] 7.4 运行 `pnpm build` 确认项目构建正常（确保未引入代码变更）
