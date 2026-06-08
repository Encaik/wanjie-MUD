## Why

项目目前已安装 3 个核心技能（`code-review`、`simplify`、`verify`），覆盖了代码质量的基本面。但在游戏设计（数值策划、关卡/秘境设计、世界观叙事）、UI/UX 设计、Next.js 开发模式、Supabase 数据层等方面仍缺少专门的技能支持。通过从 skills.sh 生态系统引入经过验证的第三方技能，可以在这些领域为 AI Agent 提供领域专长，提升开发质量和效率。

## What Changes

- 搜索并评估 skills.sh 生态系统中与项目相关的技能（游戏设计、游戏开发、前端设计、Next.js/React 模式、TypeScript 实践、Supabase 等）
- 按领域分类整理推荐技能清单，包含安装量、来源、质量评估
- 为每个推荐技能标注优先级（P0 必装 / P1 推荐 / P2 可选）
- 安装高优先级技能到项目 `.claude/skills/` 或用户全局配置
- 确保新技能与现有 CLAUDE.md 规范体系兼容

## Capabilities

### New Capabilities

- `skill-discovery-report`: 对 skills.sh 生态系统的搜索结果汇总报告，包含跨 6 个领域（代码层面、页面设计、游戏设计、游戏开发、数据存储、质量保障）的 28+ 个候选技能
- `skill-installation`: 高优先级技能的安装与验证流程，确保安装的技能与项目规范体系兼容且能正常工作

### Modified Capabilities

- `project-skills-setup`: 从原有 3 个技能扩展到涵盖更多领域（如 game-design、frontend-design、supabase 等），更新项目技能清单

## Impact

- 新增 `.claude/settings.json` 技能注册条目（如安装项目级技能）
- 可能更新 `AIREADME.md` 中的 Skills 章节，添加新技能的说明
- 部分技能安装到用户全局 `~/.claude/skills/`，不影响项目文件结构
- 已通过 `npx skills find` 获取所有搜索结果，信息收集已完成
