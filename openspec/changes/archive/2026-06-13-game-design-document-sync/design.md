## Context

项目经历了 50+ 次 OpenSpec 变更，大量设计决策记录在 `openspec/changes/**/design.md` 中。同时 `design/`、`doc/design/`、`doc/architecture/`、`doc/review/` 目录下有总计 30+ 个设计文档。这些文档存在以下问题：

1. **无全局视图**：没有一个文件能让新加入的开发者（或另一位协作者）快速理解游戏的整体设计
2. **内容过时**：`design/world-design.md` 的版本是 2026-06-09，代码中 WorldType 已从硬编码联合类型改为 registry 模式，但文档未更新
3. **与代码变更脱节**：每个 OpenSpec Change 有独立的 design.md，但没有人负责将这些变更合并到全局设计文档中
4. **查找困难**：要理解"角色属性系统"需要看 3-4 个不同位置的文档

当前两位开发者各自的改动都很大，且不了解对方的设计变更。需要一个「活的」设计知识库，作为协作的"共同参考点"。

## Goals / Non-Goals

**Goals:**
- 创建 `game-design/` 目录作为统一的设计知识库，一个目录读完全局
- 建立同步机制：OpenSpec Change 变更时自动关联到设计文档更新
- 迁移现有文档到新结构（本次先交付 worlds、characters、architecture 三章）
- 更新 CLAUDE.md 加入同步规则，使流程可持续
- 每章采用统一模板，5 分钟内可掌握一个系统的全貌

**Non-Goals:**
- 不替代 OpenSpec Change 的 design.md（变更粒度 vs 全局视图，两套并存）
- 不追求一次性覆盖所有系统（渐进式：本次 3 章 + 框架，后续随重构补充）
- 不删除旧文档（保留历史，只标记已迁移）
- 不包含游戏数值表/完整公式（超出系统级粒度范围）

## Decisions

### 1. 目录结构设计

采用**按游戏系统分章**的扁平结构，而非按功能分层：

```
game-design/
├── index.md              ← 目录索引 + 游戏元信息
├── README.md             ← 使用说明 + 同步流程
├── overview.md           ← 游戏全景（概念、循环、玩家旅程）
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

**理由**：
- 按系统分章符合开发者查找习惯（"我想了解世界系统"→ 直接看 worlds.md）
- 扁平结构降低导航成本，无需翻多级目录
- 每章独立，多人可同时编辑不同章节

### 2. 每章内容模板（系统级粒度）

每章固定 5 个区块，确保一致性：

```markdown
# 章节标题

## 设计原则
- 为什么这么做（关键设计决策和理由）
- 如果有历史变更，标注变更时间和原因

## 核心概念
- 该系统的核心数据/流程是什么
- 关键术语定义

## 数据模型
- 核心类型定义（代码位置引用）
- 关键关系（图或文字描述）

## 模块映射
| 概念 | 代码位置 | 说明 |

## 相关文档
- 详细设计文档链接
- 相关 OpenSpec Change 链接
```

**理由**：
- "设计原则"让读者先理解为什么这么设计（最重要的信息放最前面）
- "数据模型"直接指向代码类型定义，代码和文档双向可追溯
- "模块映射"帮助定位代码，降低"找到了文档但找不到代码"的摩擦
- 模板固定，后期维护成本低

### 3. 同步流程设计

嵌入到 OpenSpec Change 的创建和归档两个节点：

**创建 Change 时**（在 tasks.md 中增加检查项）：
```
☐ 如果本次变更涉及游戏设计改动 → 更新 game-design/ 对应章节
```

**归档 Change 时**（归档动作增加一步）：
```
☐ 追加一条记录到 game-design/changelog.md
```

**非 Change 小改动**：
- 顺手更新对应章节
- 不做强制要求（避免增加流程负担导致不执行）

**Changelog 记录格式**：
```markdown
## [日期] - Change 标题

- **改动**: 做了什么设计变更
- **原因**: 为什么改
- **涉及章节**: worlds.md, characters.md
- **开发者**: 谁改的
```

**理由**：
- Change 创建和归档是 OpenSpec 工作流中两个最明确的节点，不容易遗漏
- 非 Change 改动不做强制，降低心理门槛
- Changelog 格式够轻，写一条不超过 30 秒

### 4. 旧文档迁移策略

已知设计文档的迁移目标：

| 源文件 | 目标章节 | 说明 |
|--------|----------|------|
| `design/world-design.md` | `game-design/worlds.md` | 综合世界设计，核心源 |
| `doc/design/world-selection-system-design.md` | `game-design/worlds.md` | 并入世界系统 |
| `doc/design/avatar-selection-balance-design.md` | `game-design/characters.md` | 角色属性设计 |
| `doc/design/attribute-persistence-design.md` | `game-design/characters.md` | 属性持久化 |
| `doc/architecture/module-map.md` | `game-design/architecture.md` | 模块架构 |
| `doc/architecture/analysis-report.md` | `game-design/architecture.md` | 架构分析 |
| 其他 `doc/design/*.md` | 对应章节 | 后续逐步迁移 |

**策略**：
- 迁移不是复制粘贴——而是**消化吸收后重写**，保持系统级粒度
- 源文档的内容作为深度参考，在「相关文档」中链接
- 旧文件保持不动，不删除（不影响现有链接和索引）

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 同步流程流于形式，没人执行 | 在 tasks.md 中增加检查项，CLAUDE.md 中写规则，AI Agent 执行 Change 时会自动触发 |
| 文档和代码再次脱节 | 系统级粒度（非实现级）意味着文档描述的是稳定设计决策而非实现细节，变化频率较低 |
| 首次迁移工作量较大 | 本次只迁移 3 章 + 框架，控制在 1-2 天内完成；其余章节随重构自然补充 |
| 两人各自编辑同一章节导致冲突 | 按系统分章天然隔离了冲突范围；同一章节内用常规 git merge 解决 |
