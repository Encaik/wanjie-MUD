## ADDED Requirements

### Requirement: 技能搜索覆盖六大领域
项目 SHALL 通过 `npx skills find` 对 6 个领域进行系统性搜索：代码层面（Next.js/React/TypeScript）、页面设计（UI/UX/Tailwind）、游戏设计（数值/关卡/叙事）、游戏开发（RPG/资源生成）、数据存储（Supabase）、质量保障（测试/QA）。

#### Scenario: 代码层面搜索
- **WHEN** 执行 `npx skills find "nextjs react code quality"` 和 `npx skills find "typescript best practices"`
- **THEN** 返回结果包含至少 5 个候选技能，涵盖全栈开发模式、React/Next.js 模式、TypeScript 最佳实践等

#### Scenario: 页面设计搜索
- **WHEN** 执行 `npx skills find "ui design frontend tailwind"`
- **THEN** 返回结果包含至少 3 个候选技能，涵盖前端 UI/UX 设计、Tailwind 组件设计等

#### Scenario: 游戏设计搜索
- **WHEN** 执行 `npx skills find "game design MUD text-based"` 和 `npx skills find "level design crafting puzzle"`
- **THEN** 返回结果包含至少 4 个候选技能，涵盖游戏设计、关卡设计、谜题设计、RPG 设计等

#### Scenario: 游戏开发搜索
- **WHEN** 执行 `npx skills find "game development rpg"`
- **THEN** 返回结果包含至少 3 个候选技能，涵盖游戏开发者、资源生成、桌游 RPG 设计等

#### Scenario: 数据存储搜索
- **WHEN** 执行 `npx skills find "data management supabase database"`
- **THEN** 返回结果包含至少 2 个 Supabase 相关技能

#### Scenario: 质量保障搜索
- **WHEN** 执行 `npx skills find "testing quality assurance game"`
- **THEN** 返回结果包含至少 2 个 QA/测试相关技能

### Requirement: 候选技能质量评估
项目 SHALL 对每个搜索结果进行质量评估，评估维度包括：安装量（> 100 为合格、> 500 为优秀）、来源可信度（知名作者/组织优先）、与项目技术栈契合度（Next.js + TypeScript + Supabase）、与项目规范兼容性。

#### Scenario: 安装量评估
- **WHEN** 候选技能安装量 > 500
- **THEN** 标记为"高信任"，优先推荐
- **WHEN** 候选技能安装量 100-500
- **THEN** 标记为"中信任"，需额外验证 GitHub 仓库星数和更新活跃度
- **WHEN** 候选技能安装量 < 100
- **THEN** 标记为"低信任"，除非功能独特且无可替代，否则不入选 P0/P1

#### Scenario: 契合度评估
- **WHEN** 候选技能面向 Vue/Angular 或其他非 React 框架
- **THEN** 标记为"不适用"，排除出推荐列表
- **WHEN** 候选技能面向通用领域（如通用游戏设计）但可适配文字 MUD
- **THEN** 标记为"部分适用"，降级推荐

### Requirement: 技能分级推荐报告
项目 SHALL 生成分级推荐报告，按 P0（必装，3-5 个）/ P1（推荐，5-8 个）/ P2（可选，其余）三级分类，每个技能包含名称、安装命令、安装量、功能描述、适用领域、推荐理由。

#### Scenario: 报告结构
- **WHEN** 报告生成完成
- **THEN** 报告包含以下章节：P0 必装技能（含安装命令）、P1 推荐技能、P2 可选技能、不适用技能（含排除理由）、安装建议（项目级 vs 全局）

#### Scenario: P0 技能清单
- **WHEN** 报告确定 P0 技能
- **THEN** P0 列表包含 3-5 个技能，覆盖：游戏设计/开发（≥ 1 个）、前端设计/开发模式（≥ 1 个）、至少一个其他领域（数据/测试/代码质量）

### Requirement: 搜索结果可追溯
报告 SHALL 包含每个搜索的原始命令、执行时间、返回结果数量，确保结果可复现和可审计。

#### Scenario: 搜索命令记录
- **WHEN** 阅读报告的搜索记录章节
- **THEN** 能看到每个 `npx skills find` 命令的完整参数和返回的技能数量
