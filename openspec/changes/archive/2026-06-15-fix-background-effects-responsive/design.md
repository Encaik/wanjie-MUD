## Context

### 现状

`MysticalBackground` 当前以内容子元素的形式分散在 5 个页面中：

```
views/home/StartScreen.tsx           → <MysticalBackground variant="runes" />
views/world-select/WorldSelect.tsx   → <MysticalBackground variant="stars" />
views/character-select/CharacterSelect.tsx → <MysticalBackground variant="destiny" intensity="…"/>
views/backstory/BackstoryView.tsx    → <MysticalBackground variant="fated" intensity="subtle" />
views/game/MainGame.tsx              → <MysticalBackground variant="runes" intensity="subtle" />
```

每个页面的根容器结构类似：
```tsx
<div className="min-h-dvh md:min-h-screen relative overflow-hidden ...">
  <MysticalBackground variant="runes" />
  {/* 页面内容 */}
</div>
```

水印文字核心渲染代码（`MysticalBackground.tsx` 第 302-311 行）：
```tsx
{watermark && (
  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
    <span className="absolute text-[75vw] font-bold text-nowrap ...">
      {watermark}
    </span>
  </div>
)}
```

**问题根因**：`text-[75vw]` 使每个汉字宽度约等于 75vw，两个汉字总宽度约 150vw。由于父容器 `overflow-hidden`，只有约 100vw / 150vw ≈ 67% 的内容可见——即第一个字完整 + 第二个字部分。在 1080p 屏幕上，由于总像素更少，裁剪感更明显，用户感知为"看不到两个字"。同时固定像素元素（`w-[650px]` 光晕环、`w-[500px]` 柔光团）在不同分辨率下占比差异大。

### 约束

- 不能改变 `MysticalBackground` 的 4 种变体视觉效果和粒子算法
- 不能改变 `animations.css` 中已有的 `@keyframes`
- 不能影响 SSR（服务端渲染无水合错误）
- 背景在 SPA 路由切换时不应闪烁或重启动画
- 不引入新的第三方依赖

## Goals / Non-Goals

**Goals:**

- 将 `MysticalBackground` 从各页面抽离到统一的布局层
- 实现分辨率自适应缩放：水印文字和固定像素元素在 1366×768 ~ 3840×2160 范围内视觉一致
- 路由切换时背景动画不重启（持续运行）
- 路由变化时自动切换背景变体（首页 → runes，世界选择 → stars 等）

**Non-Goals:**

- 不改变 4 种变体的视觉设计
- 不修改粒子生成算法或 `animations.css`
- 不改变 `MysticalBackground` 对外的 props 接口（scaleFactor 是新增可选 prop，向后兼容）
- 不处理移动端特殊适配（已有 `md:` 断点覆盖）

## Decisions

### 决策 1：使用 Layout 包裹模式而非 Portal

**选择：** 在 `app/layout.tsx` 中，`GameProvider` 内部包裹一个客户端 `BackgroundLayout` 组件，同时渲染背景层和 `children`：

```tsx
// app/layout.tsx
<GameProvider>
  <BackgroundLayout>{children}</BackgroundLayout>
</GameProvider>
```

```tsx
// views/layout/BackgroundLayout.tsx
'use client';

export function BackgroundLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scaleFactor = useResolutionScale();
  const variant = useMemo(() => pathnameToVariant(pathname), [pathname]);
  
  return (
    <>
      <MysticalBackground variant={variant} scaleFactor={scaleFactor} />
      {children}
    </>
  );
}
```

**理由：**
- 布局组件与 `children` 是兄弟节点，背景在路由切换时不卸载，动画不重启
- 通过 `usePathname()` 感知路由，自动切换变体（通过 key 变化触发变体过渡）
- 背景在 DOM 中位于内容之前（z-index 自然低于内容），无需手动管理层级
- 不需要 Portal，避免了 CSS 层叠上下文断裂问题

**备选方案（已否决）：**
- Portal 到 `<body>`：需要手动管理 z-index，且主题 CSS 变量可能丢失
- 每个页面保留背景但用 `layout.tsx` 的平行路由：Next.js 平行路由增加复杂性，且多个 slot 之间的状态同步困难

### 决策 2：路由 → 变体映射

**选择：** 白名单映射，根路径默认 `runes`，未匹配路径 fallback 为 `runes`：

```typescript
const ROUTE_VARIANT_MAP: Record<string, BgVariant> = {
  '/': 'runes',
  '/world-select': 'stars',
  '/character-select': 'destiny',
  '/backstory': 'fated',
  '/game': 'runes',
};

function pathnameToVariant(pathname: string): BgVariant {
  return ROUTE_VARIANT_MAP[pathname] ?? 'runes';
}
```

**理由：** 简单、显式、无歧义。未来新增路由时只需加一行映射。

### 决策 3：分辨率检测策略

**选择：** 使用 `useLayoutEffect` + `matchMedia` 检测实际视口宽度，输出缩放系数：

```typescript
function computeScaleFactor(width: number): number {
  // 基准：1920px = 1.0
  if (width < 1400) return 0.7;   // 1366×768 笔记本
  if (width < 2000) return 0.85;  // 1680×1050 等
  if (width < 2400) return 1.0;   // 1920×1080 基准
  return 1.15;                     // 2560×1440+
}
```

**理由：**
- `matchMedia` 无需轮询，浏览器原生响应式 API
- `useLayoutEffect` 在浏览器绘制前同步执行，避免闪烁
- 基于视口宽度而非 `devicePixelRatio`：CSS 像素是布局的实际单位，`devicePixelRatio` 只影响清晰度不影响布局
- 服务端默认返回 1.0，水合后客户端更新为正确值——视觉差异仅在首次渲染的一个帧内，用户不可感知

**备选方案（已否决）：**
- CSS `clamp()` / `vw` 方案：CSS 只能缩放字号，无法缩放固定 px 元素（光晕环、柔光团）
- `window.devicePixelRatio` 方案：Retina 笔记本（DPR=2, 实际宽度 1680px）会被误判为"大屏"

### 决策 4：水印字号调整

**选择：** 将水印从固定 `text-[75vw]` 改为动态计算：

```
水印 fontSize = baseSize * scaleFactor
其中 baseSize 根据字符数动态计算：
  - 2 字符：55vw（当前 75vw 太大，在 1080p 就裁剪严重）
  - 3+ 字符：40vw
```

通过 inline `style={{ fontSize: ... }}` 设置，因为需要动态计算。

**理由：**
- 按比例缩小到 55vw 后，两个字符约 110vw 宽，在 1080p 屏幕上可见约 90%，两个字符基本完整
- 配合 `scaleFactor` 在不同分辨率下进一步微调
- CSS `text-[75vw]` 被 inline style 覆盖

### 决策 5：从 views 移除背景的方式

**选择：** 直接删除各 view 中的 `<MysticalBackground>` 调用，同时移除该 view 根容器的 `relative overflow-hidden`（如果这些样式仅服务于背景）。

**理由：**
- 背景已由 layout 层提供，页面中重复的背景会导致双层渲染
- `relative` 和 `overflow-hidden` 如果仅用于背景裁剪，应一并移除；如果页面内容也依赖（如卡片内部装饰溢出），则保留
- 需逐文件检查确认

### 决策 6：`core/ui/` 目录放置分辨率工具

**选择：** 新建 `src/core/ui/resolution-scale.ts` 存放分辨率缩放工具。

**理由：**
- 分辨率检测属于 UI 基础设施，与游戏逻辑无关
- `shared/utils/` 是备选，但该工具与 `useLayoutEffect` / `matchMedia` 浏览器 API 耦合，不属于纯工具函数
- `core/ui/` 是 `core/` 下新增的 UI 基础设施目录，用于存放跨系统 UI 工具（后续可能有 `use-breakpoint.ts`、`use-reduced-motion.ts` 等）
- 纯函数 `computeScaleFactor()` 可单独导出，方便测试

## Risks / Trade-offs

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| 背景在 SPA 路由切换时可能有短暂视觉跳动 | 低 | Layout 组件不卸载，只有 `variant` prop 变化；变体切换通过 CSS transition 平滑过渡 |
| `useLayoutEffect` 在 SSR 时无法执行 | 低 | 服务端渲染 scaleFactor=1.0，客户端水合后立即同步修正；首次渲染差异在 1 帧内 |
| 删除页面中的 `overflow-hidden` 可能导致内容溢出 | 中 | 逐文件检查，确认 `overflow-hidden` 是否仅服务于背景裁剪；页面内容如依赖则保留 |
| 新增 `core/ui/` 目录未在 `core/README.md` 注册 | 低 | 同步更新 README |
| 水印字号从 75vw 缩到 55vw 可能影响 4K 屏视觉冲击力 | 低 | scaleFactor 在 2K+ 为 1.15，4K 屏水印约 63vw，视觉效果接近原版 |

## Migration Plan

### 步骤

```
当前状态：
  5 个 views 各自 <MysticalBackground variant="..." />
  背景随页面切换卸载/重建，动画重启
  
步骤 1: 创建分辨率检测工具
  src/core/ui/resolution-scale.ts
  → 包含 useResolutionScale() hook
  → 包含 computeScaleFactor() 纯函数
  
步骤 2: 增强 MysticalBackground
  → 新增可选 scaleFactor prop，默认 1.0
  → 水印 fontSize 支持动态计算
  → 固定像素元素（光晕环、柔光团）按 scaleFactor 缩放
  
步骤 3: 创建 BackgroundLayout
  src/views/layout/BackgroundLayout.tsx
  → usePathname() 匹配变体
  → useResolutionScale() 获取缩放系数
  
步骤 4: 修改 app/layout.tsx
  → GameProvider 内部包裹 BackgroundLayout
  
步骤 5: 逐页面移除背景调用
  → 删除 5 个 views 中的 <MysticalBackground />
  → 检查并清理仅服务于背景的 CSS 类
  
步骤 6: 验证
  → pnpm ts-check
  → pnpm build
  → 手动在不同分辨率测试
```

### 回滚策略

每个 view 中只需恢复一行 `<MysticalBackground variant="..." />`，即可回退到旧方案。`BackgroundLayout` 中的 background 与页面中的不会冲突（因为 layout 层背景会被页面 opaque 内容覆盖），但视觉上可能有细微叠加——为安全起见，回滚时同时删除 `layout.tsx` 中的 `BackgroundLayout` 包裹。
