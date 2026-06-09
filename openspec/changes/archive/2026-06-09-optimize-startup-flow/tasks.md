## 1. Mod 加载状态 Context 化

- [x] 1.1 在 `ModInitProvider` 中创建 `ModContext`，存储 `ModLoaderState`，导出 `useModContext()` Hook
- [x] 1.2 修改 `ModInitProvider`，移除 `ModLoadingOverlay` 的全屏渲染，仅通过 Context 传递状态
- [x] 1.3 在 `app/layout.tsx` 中确认 `ModInitProvider` 仍包裹 `GameProvider`，层级不变

## 2. StartScreen 融合加载进度

- [x] 2.1 修改 `StartScreen` Props，新增 `modLoadState?: ModLoaderState`
- [x] 2.2 在 `StartScreen` 中实现加载态：当 `phase === 'loading'` 时，保留背景装饰，卡片内容替换为加载进度指示器（旋转动画 + 进度文字 + 进度条）
- [x] 2.3 实现加载完成过渡：`phase` 从 `'loading'` 变为 `'ready'` 时，带 CSS fade-in 过渡显示"踏入万界"按钮
- [x] 2.4 实现错误态：`phase === 'error'` 时显示错误信息和"刷新页面"按钮
- [x] 2.5 "踏入万界"按钮在加载中处于禁用状态，显示"正在加载…"文案

## 3. 路由守卫同步化

- [x] 3.1 在 `useGameState` 中实现 `getRouteGuard(currentPath: string): string | null` 纯函数，根据 gameState 返回应重定向的路径
- [x] 3.2 修改 `app/page.tsx`：使用同步路由守卫替代 `useEffect` 中的 `router.replace`
- [x] 3.3 修改 `app/world-select/page.tsx`：同步守卫替代 useEffect；守卫不触发生成函数
- [x] 3.4 修改 `app/character-select/page.tsx`：同步守卫替代 useEffect；onBack 使用已有数据不重生
- [x] 3.5 修改 `app/backstory/page.tsx`：同步守卫替代 useEffect
- [x] 3.6 修改 `app/game/page.tsx`：同步守卫替代 useEffect

## 4. 数据生成缓存

- [x] 4.1 确认 `startNewGame()` 仅在用户点击"踏入万界"时调用一次，路由守卫不调用
- [x] 4.2 确认 `selectWorld()` 仅在用户选中世界时调用一次，路由守卫不调用
- [x] 4.3 确认 `refreshCharacters` 仅由用户手动点击"刷新"按钮触发
- [x] 4.4 验证从角色选择返回世界选择时，世界列表保持不变（无需重新生成）
- [x] 4.5 验证从背景故事返回角色选择时，角色列表保持不变

## 5. 验证与收尾

- [x] 5.1 运行 `pnpm ts-check` 确保无类型错误
- [x] 5.2 运行 `pnpm build` 确保构建成功
- [ ] 5.3 手动测试完整启动流程：首页加载 → 世界选择 → 角色选择 → 背景故事 → 游戏，确认无闪烁
- [ ] 5.4 手动测试回退操作：角色选择返回世界选择、背景故事返回角色选择，确认数据不重复生成
- [ ] 5.5 手动测试异常路径：直接 URL 访问各阶段页面，确认正确重定向
- [x] 5.6 删除或标记弃用 `ModLoadingOverlay`（保留文件但不再在正常流程中使用）
