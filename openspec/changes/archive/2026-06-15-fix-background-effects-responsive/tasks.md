## 1. 分辨率检测工具

- [x] 1.1 创建 `src/shared/utils/resolution-scale.ts`：`computeScaleFactor(width)` 纯函数 + `useResolutionScale()` hook（`useLayoutEffect` + `matchMedia` 监听 resize）— 调整：放在 `shared/utils/` 而非 `core/ui/`，因 `core/` 禁止 React Hooks
- [x] 1.2 更新 `src/shared/utils/index.ts` barrel 导出
- [x] 1.3 跳过（`core/ui/` 目录未创建，无需更新 `core/README.md`）

## 2. MysticalBackground 分辨率适配

- [x] 2.1 新增可选 `scaleFactor?: number` prop，默认 `1.0`
- [x] 2.2 水印层级改造：`text-[75vw]` 替换为动态 `fontSize`（55vw × scaleFactor，通过 inline style）；按字符数调整基准值（2字符→55vw，3字符→40vw）
- [x] 2.3 固定像素元素适配：光晕环 `650px` → `650 * scaleFactor`px，柔光团 `500px` → `500 * scaleFactor`px，额外柔光 `300px` → `300 * scaleFactor`px
- [x] 2.4 浮动符文字号适配：`text-4xl sm:text-5xl` → `2.25rem * scaleFactor` inline style
- [x] 2.5 TypeScript 类型检查 — 通过（见 7.1）

## 3. BackgroundLayout 布局组件

- [x] 3.1 创建 `src/views/layout/BackgroundLayout.tsx`：`usePathname()` 路由匹配 + `useResolutionScale()` + `<MysticalBackground>` 统一渲染
- [x] 3.2 实现路由→变体映射表（`/` → runes，`/world-select` → stars，`/character-select` → destiny，`/backstory` → fated，`/game` → runes）
- [x] 3.3 游戏内变体需支持 `intensity="subtle"`：通过 `SUBTLE_ROUTES` Set 单独处理 `/game` 路由

## 4. 接入 Layout 层

- [x] 4.1 修改 `src/app/layout.tsx`：在 `GameProvider` 内部用 `BackgroundLayout` 包裹 `children`
- [x] 4.2 Next.js 构建验证 — 通过（见 7.2）

## 5. 清理页面中的背景调用

- [x] 5.1 `views/home/StartScreen.tsx`：移除 `<MysticalBackground variant="runes" />`，`relative overflow-hidden` 保留（卡片装饰溢出依赖）
- [x] 5.2 `views/world-select/WorldSelect.tsx`：移除 `<MysticalBackground variant="stars" />`，`relative` 保留（z-10 内容依赖）
- [x] 5.3 `views/character-select/CharacterSelect.tsx`：移除 3 处 `<MysticalBackground variant="destiny" ... />`（loading/error/normal）
- [x] 5.4 `views/backstory/BackstoryView.tsx`：移除 `<MysticalBackground variant="fated" intensity="subtle" />`
- [x] 5.5 `views/game/MainGame.tsx`：移除 `<MysticalBackground variant="runes" intensity="subtle" />`
- [x] 5.6 检查：确认不再有页面直接 import `MysticalBackground`（仅 `BackgroundLayout.tsx` 引用）

## 6. 补充文件

- [x] 6.1 创建 `src/views/layout/index.ts` barrel 导出

## 7. 最终验证

- [x] 7.1 `pnpm ts-check` 全量类型检查通过 ✓
- [x] 7.2 `pnpm build` 构建成功 ✓
- [x] 7.3 `pnpm lint:strict` — ESLint 因 `eslint-plugin-import` 缺失无法运行（项目已有环境问题），文件大小检查通过 ✓
- [ ] 7.4 多分辨率视觉验证：1080p、2K、1366×768 三种典型分辨率下水印文字完整可见 — 需手动验证
- [ ] 7.5 路由切换验证：首页 → 世界选择 → 角色选择 → 游戏 → 返回首页，确认背景动画不中断 — 需手动验证
- [x] 7.6 跳过（`core/README.md` 无需更新，新增文件在 `shared/utils/` 和 `views/layout/`）
