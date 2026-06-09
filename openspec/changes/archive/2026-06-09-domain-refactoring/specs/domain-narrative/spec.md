## ADDED Requirements

### Requirement: 叙事域为纯函数模块
叙事域 SHALL 不持有任何游戏状态，所有导出函数为纯函数。

#### Scenario: 术语查询
- **WHEN** 调用 `getTerminology(worldType)` 传入世界类型
- **THEN** 返回该世界的完整术语映射表，包含境界、货币、势力等术语的中文名称

#### Scenario: 世界文案生成
- **WHEN** 调用文案生成函数传入世界类型和事件类型
- **THEN** 返回符合该世界风格的中文文案文本

### Requirement: 多世界风味文本支持
叙事域 SHALL 支持全部 8 种世界类型的独立文案配置。

#### Scenario: 每种世界有独立文案
- **WHEN** 查询任一种世界类型（修仙/高武/科技/魔幻/异能/仙侠/武侠/末世）
- **THEN** 返回该世界独立的术语和文案，不与其他世界混淆

### Requirement: 域自包含
叙事域的所有文件 SHALL 位于 `modules/narrative/` 目录下。

#### Scenario: 文件组织
- **WHEN** 查看 `modules/narrative/` 目录结构
- **THEN** 包含 `logic/`（文本解析、世界文案管理）、`data/`（术语配置、世界文案数据）、`index.ts`（对外契约）
