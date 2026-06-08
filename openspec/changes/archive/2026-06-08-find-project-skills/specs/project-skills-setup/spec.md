## MODIFIED Requirements

### Requirement: 项目级 Skills 安装
项目 SHALL 安装并配置核心技能，包括原有的 3 个代码质量技能（`code-review`、`simplify`、`verify`）以及经过 skills.sh 生态搜索后引入的游戏设计和前端开发相关技能。安装数量不低于 5 个。

#### Scenario: Skills 已安装验证
- **WHEN** 检查 `.claude/skills/` 目录
- **THEN** 至少包含 `code-review/`、`simplify/`、`verify/` 三个代码质量技能目录，以及至少 2 个来自 skills.sh 的新增技能目录（覆盖游戏设计和前端开发领域），每个包含可执行的技能定义文件

#### Scenario: Skills 可用性验证
- **WHEN** 用户输入 `/code-review`、`/simplify`、`/verify` 或新增技能的对应 slash 命令
- **THEN** 对应技能被正确触发，按项目规范执行对应流程

## ADDED Requirements

### Requirement: 第三方技能兼容性规则
所有安装到项目级的第三方技能 SHALL 遵循 CLAUDE.md 中定义的规则体系，当技能建议与项目规则冲突时，项目规则优先级更高。

#### Scenario: 规则优先级
- **WHEN** 第三方技能的建议违反核心规则（如在 lib/ 中建议使用 React 组件、推荐使用 any 类型等）
- **THEN** Agent 以 CLAUDE.md 规则为准，忽略冲突建议

#### Scenario: 技能目录隔离
- **WHEN** 第三方技能安装在 `.claude/skills/` 目录
- **THEN** 技能文件与项目自有的 OpenSpec 技能和定制技能共存于同一目录，通过文件名或子目录区分

### Requirement: 技能分类管理
项目 SHALL 按功能领域对已安装技能进行分类管理，分为：代码质量类、工作流类、游戏设计类、前端开发类。

#### Scenario: 分类清单
- **WHEN** 查看项目技能清单
- **THEN** 每个技能标注其分类（code-quality / workflow / game-design / frontend-dev），便于用户了解各技能的用途和适用场景
