## Why

当前项目的 UI/UX 界面视觉效果不一致、部分页面排版混乱、交互反馈不足，这直接影响了游戏的沉浸感和可玩性。在功能开发稳步推进的同时，视觉层面的打磨同样重要——美观、一致的界面能显著提升玩家体验和留存率。本次专项整改聚焦于纯视觉层面的优化，不改动任何功能逻辑，为后续的更大规模打磨建立标准。

## What Changes

- 安装和引入 `frontend-ui-ux-design` skill，为 UI 审查和优化提供专业指导
- 对全部游戏页面（首页、世界选择、角色选择、背景故事、主游戏界面）进行逐页视觉审查
- 对主游戏界面内的所有标签页（修炼、冒险、背包、装备、商店、技能、功法、势力、成就等）进行逐个审查
- 对布局组件（左右侧边栏、中央面板、移动端布局）进行视觉一致性审查
- 记录视觉问题清单，涵盖：排版间距不一致、颜色对比度不足、动画过渡缺失、响应式断点问题、空状态视觉表达、loading/错误状态样式
- 按问题优先级分批修复：高优先级（严重影响可读性和可用性）→ 中优先级（视觉不一致、细节粗糙）→ 低优先级（锦上添花、动效增强）
- 建立 UI 视觉标准参考基线，便于后续开发保持一致性

## Capabilities

### New Capabilities
<!-- No new functional capabilities — this is a visual polish change -->

### Modified Capabilities
<!-- No existing capability requirements are changing -->

## Impact

- **组件文件**：`src/components/game/` 下约 76 个 `.tsx` 文件，`src/components/pages/` 下 5 个 `.tsx` 文件，可能涉及 Tailwind CSS 类名调整、布局微调、动画添加
- **样式系统**：`tailwind.config` 或全局 CSS 变量可能需要补充（如新增动画关键帧、统一间距变量）
- **依赖**：无新增依赖，纯 CSS/Tailwind 层面修改
- **风险**：极低——所有修改仅限 JSX 结构和 CSS 类名，不触及 hooks、lib、storage 等逻辑层
