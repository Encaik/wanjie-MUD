## Why

本项目是两人协作重构的老代码项目，各自改动较大，但缺少一个统一的游戏设计文档（GDD）。现有设计文档散落在 `design/`、`doc/design/`、`doc/architecture/`、`doc/review/` 等多个目录，且与 OpenSpec Change 工作流脱节——每个 Change 有自己的 design.md，但没有人维护全局视图。双方开发者无法通过阅读一个文档了解对方在游戏设计上的改动。

需要一个活的、可维护的游戏设计知识库：每次通过 OpenSpec Change 改动代码时，同步更新设计文档；归档时记录变更日志。这样任何一方通过阅读 `game-design/` 就能掌握游戏设计的全貌和演变历史。

## What Changes

- **创建 `game-design/` 目录**作为统一的游戏设计知识库，包含 10 个章节覆盖游戏各个系统（全景、世界、角色、成长、战斗、经济、社交、收集、架构、变更日志）
- **建立同步流程**：创建 OpenSpec Change 时同步更新对应章节，归档时追加 changelog
- **迁移已有设计文档**：将 `design/world-design.md`、`doc/design/avatar-selection-*.md`、`doc/design/world-selection-system-design.md`、`doc/architecture/module-map.md` 等内容合并到新的结构
- **更新 CLAUDE.md**：增加「设计文档同步规则」章节，明确触发时机和同步要求
- **本次先交付前 3 个章节（worlds、characters、architecture）**作为模板和可执行范例，其余章节在后续重构到对应系统时同步补充

## Capabilities

### New Capabilities
- `game-design-framework`: 游戏设计文档的整体框架——目录结构、README、变更日志、同步流程规则
- `game-design-worlds`: 世界系统设计文档（迁移自 design/world-design.md 等）
- `game-design-characters`: 角色系统设计文档（迁移自 doc/design/avatar-selection-*.md 等）
- `game-design-architecture`: 架构决策记录（迁移自 doc/architecture/module-map.md 等）

### Modified Capabilities
- `claude-rules`: 在 CLAUDE.md 中增加设计文档同步规则

## Impact

- **新文件**：`game-design/` 目录下约 12 个文件（index.md、README.md、overview.md、worlds.md、characters.md、architecture.md、changelog.md + 后续补充章节）
- **修改文件**：`CLAUDE.md` 增加同步规则章节
- **旧文件**：`design/world-design.md`、`doc/design/avatar-selection-*.md`、`doc/design/world-selection-system-design.md`、`doc/architecture/module-map.md` 标记为已迁移，原有文件保留不动（不删除历史记录）
- **流程变更**：后续所有 OpenSpec Change 需要增加「同步 game-design/」和「追加 changelog」两个步骤
