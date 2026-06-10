## ADDED Requirements

### Requirement: 禁止向后兼容 Barrel Re-export

项目 SHALL NOT 包含仅用于向后兼容的 `@deprecated` barrel re-export 文件。所有代码 MUST 从权威来源路径直接导入，不允许存在"旧路径保留用于向后兼容"的中间层。

#### Scenario: 迁移完成后的旧路径清理
- **WHEN** 一个模块或系统的权威来源从路径 A 迁移到路径 B
- **THEN** 旧路径 A 的 barrel re-export 文件 MUST 被删除，且所有调用方 MUST 更新为直接从路径 B 导入

#### Scenario: 新代码禁止添加兼容路径
- **WHEN** 开发者在开发新功能或重构现有功能时
- **THEN** 不得在旧路径创建 `export * from '新路径'` 的 barrel re-export 文件；所有导入路径 MUST 使用权威来源路径

### Requirement: 禁止 Legacy 兼容类型别名

项目 SHALL NOT 包含仅为兼容旧代码而存在的类型别名（如 `LegacyStats`、`LegacyFragmentGroup` 等）。数据模型变更时 MUST 同步更新所有调用方，不得通过类型别名保留旧接口。

#### Scenario: 类型体系升级
- **WHEN** 核心类型体系发生变更（如 `CharacterStats` 引入新的属性结构）
- **THEN** 所有使用旧类型的模块 MUST 同步更新为新类型，不得添加 `LegacyXxx` 类型别名来兼容旧代码

#### Scenario: 类型别名清理
- **WHEN** 旧类型的所有调用方已迁移完毕
- **THEN** `LegacyXxx` 类型别名及相关的工厂函数（如 `createCombinedStats`）MUST 被删除

### Requirement: 禁止兼容旧接口的包装函数

项目 SHALL NOT 包含标记为"兼容旧接口""兼容旧 API""向后兼容"的包装函数。每个功能点 MUST 只有一个对外接口，调用方 MUST 直接使用权威接口。

#### Scenario: 接口统一
- **WHEN** 某个功能的对外接口发生变更
- **THEN** 所有调用方 MUST 更新为直接调用新接口，不得保留旧接口包装函数

#### Scenario: 标记清理
- **WHEN** 发现代码中包含 `兼容旧版 API`、`// 向后兼容`、`@deprecated` 等注释标记的包装函数
- **THEN** 该包装函数 MUST 被删除，其调用方 MUST 改为直接调用权威接口

### Requirement: 禁止数据结构的单元素兼容字段

项目 SHALL NOT 在已升级为数组/集合的数据结构中保留标记为 `@deprecated` 的单元素 fallback 字段（如 `BattleState` 中 `enemies[0].xxx` 的兼容字段）。数据结构的演进 MUST 是直接替代而非并存。

#### Scenario: 数据结构从单元素升级为数组
- **WHEN** 数据结构中的某个元素从单值升级为数组（如 `enemy` → `enemies: []`）
- **THEN** 旧的单元素字段及所有兼容同步逻辑 MUST 被删除，调用方 MUST 通过数组访问

### Requirement: 开发期间禁止添加过渡兼容方案（硬约束）

在项目开发期间，所有代码变更 MUST 是一次性完全迁移，禁止添加任何形式的旧逻辑兼容方案、兜底方案或过渡期兼容代码。该规则 MUST 编入 `.claude/rules/core.md` 的禁止行为清单。

#### Scenario: 文件迁移
- **WHEN** 将功能模块从旧位置迁移到新位置
- **THEN** 必须直接创建新文件并更新所有引用；不得在旧位置保留 barrel re-export 作为"过渡期"方案

#### Scenario: 数据格式变更
- **WHEN** 修改数据结构的格式或字段名
- **THEN** 必须同步更新所有引用该数据结构的代码；不得添加 `legacyId`、`@deprecated` 字段等兼容方案

#### Scenario: 规则约束持久化
- **WHEN** 变更涉及 `.claude/rules/core.md` 中列出的架构规则
- **THEN** "禁止添加过渡兼容方案"规则 MUST 对 AI Agent 和人工开发者均具有约束力，违反视为代码审查不通过
