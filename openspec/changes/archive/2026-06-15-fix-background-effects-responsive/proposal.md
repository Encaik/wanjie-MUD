## Why

`MysticalBackground` 组件当前散布于各个页面视图（`views/home/StartScreen.tsx`、`views/world-select/WorldSelect.tsx`、`views/character-select/CharacterSelect.tsx`、`views/backstory/BackstoryView.tsx`、`views/game/MainGame.tsx`）中，每个页面独立引入。存在以下问题：

1. **分辨率兼容性差**：水印大字使用 `text-[75vw]` 固定视口比例，在 2K（2560px）屏幕上能完整展示两个汉字，但在 1080p（1920px）屏幕上文字过大导致被 `overflow-hidden` 裁剪，两个水印字只剩一个半可见；固定像素元素（旋转光晕环 `w-[650px]`、柔光团 `w-[500px]`）在小屏幕上占比过大，挤压内容空间
2. **重复引入**：5 个页面各自写 `<MysticalBackground variant="..." />`，未来新增页面容易遗漏
3. **页面切换闪烁**：SPA 客户端路由切换页面时，背景组件被卸载重建，导致动画重启和视觉闪烁
4. **职责不清**：背景氛围属于全局视觉层，应放在 layout 层级而非页面内容层

## What Changes

### 核心重构

1. **新建 `BackgroundLayout.tsx`**：客户端布局组件，统一承载 `MysticalBackground`，通过 `usePathname()` 匹配路由自动选择变体，包裹 `children`，背景在路由切换时保持挂载不销毁
2. **新建 `src/core/ui/resolution-scale.ts`**：分辨率缩放工具，检测实际像素密度，输出缩放系数供背景组件使用
3. **增强 `MysticalBackground.tsx`**：新增 `scaleFactor` prop，根据分辨率动态调整固定像素元素（柔光团、光晕环）尺寸和水印 `fontSize`，确保在 1080p ~ 4K 范围内视觉一致
4. **从各页面移除背景调用**：删除 5 个 views 中的 `<MysticalBackground>` 直接引用
5. **修改 `app/layout.tsx`**：在 `GameProvider` 内部包裹 `BackgroundLayout`

### 分辨率适配策略

| 分辨率 | 典型屏幕 | scaleFactor | 水印字号 | 光晕环 |
|--------|----------|-------------|----------|--------|
| < 1400px | 1366×768 笔记本 | 0.7 | ~52vw | 350px |
| 1400-2000px | 1920×1080 桌面 | 1.0 | ~55vw | 520px |
| > 2000px | 2560×1440 2K+ | 1.15 | ~65vw | 600px |

通过 `matchMedia('(resolution: ...)')` + `devicePixelRatio` 综合判断，非简单断点。

### 安全保障

11. **渐进增强**：`scaleFactor` 默认 1.0，不传时行为不变；CSS 自定义属性兜底
12. **不改变**：`MysticalBackground` 的 4 种变体视觉效果、`animations.css` 的 keyframes、粒子生成算法
13. **SSR 安全**：客户端 `useLayoutEffect` 检测分辨率，服务端始终渲染 scaleFactor=1 的版本

## Capabilities

### New Capabilities
- `background-layout`: 全局背景布局层，路由感知自动切换变体，跨页面保持挂载
- `resolution-scaling`: 分辨率检测与缩放系数计算工具

### Modified Capabilities
- `mystical-background`: 新增 `scaleFactor` prop 实现分辨率自适应

## Impact

- **新增**：`src/core/ui/` 目录（`resolution-scale.ts`）、`src/views/layout/BackgroundLayout.tsx`
- **修改**：`src/shared/components/MysticalBackground.tsx`（新增 scaleFactor prop）、`src/app/layout.tsx`（包裹 BackgroundLayout）、5 个 views 文件（移除直接背景调用）
- **无影响**：`animations.css`、`tokens.css`、`themes.css`、粒子算法、主题系统、世界加载、游戏状态管理
