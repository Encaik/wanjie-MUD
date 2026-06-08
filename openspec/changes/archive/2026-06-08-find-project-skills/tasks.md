## 1. 技能搜索与收集

- [x] 1.1 执行代码层面搜索：`npx skills find "nextjs react code quality"` 和 `npx skills find "typescript best practices"`，记录结果
- [x] 1.2 执行页面设计搜索：`npx skills find "ui design frontend tailwind"`，记录结果
- [x] 1.3 执行游戏设计搜索：`npx skills find "game design MUD text-based"` 和 `npx skills find "level design crafting puzzle"`，记录结果
- [x] 1.4 执行游戏开发搜索：`npx skills find "game development rpg"`，记录结果
- [x] 1.5 执行数据存储搜索：`npx skills find "data management supabase database"`，记录结果
- [x] 1.6 执行质量保障搜索：`npx skills find "testing quality assurance game"` 和 `npx skills find "code review refactor simplify"`，记录结果

## 2. 技能评估与分级

- [x] 2.1 对每个候选技能进行安装量评估（>500 高信任、100-500 中信任、<100 低信任）
- [x] 2.2 对每个候选技能进行来源可信度评估（作者/组织知名度、GitHub 仓库活跃度）
- [x] 2.3 对每个候选技能进行技术栈契合度评估（Next.js + TypeScript + Supabase 兼容性）
- [x] 2.4 按 P0（必装）/ P1（推荐）/ P2（可选）三级分类，确定 3-5 个 P0 技能

## 3. 生成技能发现报告

- [x] 3.1 创建技能搜索汇总报告，包含所有 6 个领域的搜索结果
- [x] 3.2 为每个推荐技能编写：名称、安装命令、安装量、功能描述、适用领域、推荐理由
- [x] 3.3 列出不适用技能及排除理由（如框架不匹配、功能重复等）
- [x] 3.4 将报告写入项目文档（`doc/reference/skills-discovery-report.md`）

## 4. 安装 P0 技能

- [x] 4.1 安装游戏设计/开发相关 P0 技能到项目级别（game-developer ✅ + level-design ✅，已安装到 .agents/skills/）
- [x] 4.2 安装前端设计/开发模式相关 P0 技能 — 因网络代理限制（127.0.0.1:7890 被拒）未能安装 react-nextjs-development 和 frontend-ui-ux-design，记录在报告中待后续手动安装
- [x] 4.3 安装其他领域 P0 技能 — supabase-database 安装失败（同上网络限制），待后续手动安装
- [x] 4.4 运行 `npx skills check` 验证 — game-developer 和 level-design 安全评分均为 Safe/Low Risk，0 socket 告警

## 5. 兼容性验证

- [x] 5.1 逐项检查 — game-developer 无直接冲突（偏通用游戏模式），level-design 无冲突（纯设计方法论）
- [x] 5.2 检查 — 两技能均无 TypeScript 代码生成模式，不涉及 any 类型风险
- [x] 5.3 检查 — game-developer 偏向 Unity/Unreal，可能给出不适用于 React/TS 的实现建议（标记为部分兼容）；level-design 无代码生成，无冲突
- [x] 5.4 记录兼容性检查结果到安装报告（doc/reference/skills-discovery-report.md 第八、九章）

## 6. 更新项目文档

- [x] 6.1 更新 `AIREADME.md` 的 Skills 章节，添加新增技能的说明和 slash 命令
- [x] 6.2 更新 `openspec/specs/project-skills-setup/spec.md`（通过 openspec-sync-specs 同步 delta）
- [x] 6.3 生成 P1/P2 可选技能安装指南（已包含在 doc/reference/skills-discovery-report.md 中）
