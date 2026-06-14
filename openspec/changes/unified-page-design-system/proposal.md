## Why

开始页面(StartScreen)、世界选择页(WorldSelect)、人物选择页(CharacterSelect)、背景故事页(BackstoryView) 已形成一套成熟的东方玄幻视觉设计语言——符文粒子背景、四角隅饰卡片、渐变装饰线、序列动画、印章式Badge、钻石菱形符分隔符等。但主游戏页面(MainGame)及其子组件尚未完全纳入这套设计体系，导致页面间视觉体验断裂，部分区域对比度不足、文字过小、暗色主题下内容不够清晰。本次变更旨在将这套已验证的设计语言系统化为 **Design Guide (design.md)**，并据此统一调整所有页面。

## What Changes

- **新建 Design Guide 文档** — 从现有高质量页面（首页、选择页）中提取设计词汇，形成正式的 `design.md`，涵盖：颜色令牌、字体排版等级、卡片与边框装饰体系、动画曲线与时序、明暗主题适配、可读性强制约束（最小字号、最小对比度）
- **统一背景氛围系统** — 为不同页面定义对应的 `MysticalBackground variant`，主游戏页面引入低密度符文/星点背景增强沉浸感
- **重构主游戏页面视觉** — GameHeader、LeftSidebar、CenterPanel、RightSidebar 全面应用 Design Guide 词汇：卡片四角隅饰、渐变分隔线、印章式标签、统一按钮风格
- **修正可读性问题** — 全局审查并修正所有 `text-[8px]`、`text-[9px]`、`text-[10px]` 等过小字号，确保最小正文不低于 11px (约 0.6875rem)；暗色主题下确保 `text-muted-foreground` 对比度不低于 4.5:1
- **统一 Tab 与面板组件** — 游戏内 Tab 栏、各种功能面板(Dialog、Panel)采用与选择页卡片一致的装饰语言
- **建立文件级设计约束** — 新增 ESLint 规则或构建检查，防止回退到过小字号/低对比度样式

## Capabilities

### New Capabilities

- `design-guide`: 从现有页面提取的完整设计系统文档，作为所有页面视觉实现的单一事实来源。包含颜色语义令牌、字体排版等级、卡片装饰体系、动画规范、明暗双主题代码示例、可读性强制阈值。
- `game-page-redesign`: 按照 design-guide 重新设计主游戏页面的视觉方案，涵盖顶部状态栏、侧边栏、中央操作区、消息面板、Tab 导航栏的完整重设计规格。

### Modified Capabilities

无现有 capability 的 spec 级行为变更——本次为纯视觉层变更，不改动功能需求。

## Impact

- **受影响文件**: `src/views/game/MainGame.tsx`、`src/views/game/GameHeader.tsx`、`src/views/game/LeftSidebar.tsx`、`src/views/game/CenterPanel.tsx`、`src/views/game/RightSidebar.tsx`、`src/views/game/StatusPanel.tsx`、`src/views/game/MobileLayout.tsx` 及所有 `modules/*/components/` 中的 Panel 组件
- **受影响共享组件**: `src/shared/components/MysticalBackground.tsx`（可能扩展 variant）、`src/shared/ui/card.tsx`（不修改 shadcn 源，通过包装使用）
- **不影响**: 游戏逻辑、数据流、状态管理、API 调用
- **破坏性**: 无——视觉层变更，功能行为保持不变
