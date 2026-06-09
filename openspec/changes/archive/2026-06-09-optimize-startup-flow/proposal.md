## Why

当前启动流程（Mod加载 → 首页 → 世界选择 → 角色选择 → 背景故事 → 游戏）存在三个体验问题：Mod加载使用独立全屏遮罩导致与首页切换时闪烁；世界选择和角色选择页面每次刷新都重新生成数据；路由守卫在 `useEffect` 中执行导致页面先渲染再跳转的闪烁。这些问题让玩家的启动体验不连贯、有跳脱感。

## What Changes

- **Mod加载进度融入启动界面**：将 `ModLoadingOverlay` 的独立全屏遮罩改为在 `StartScreen` 内嵌的加载状态，消除切换到首页时的视觉闪烁
- **世界生成结果缓存**：`generateWorlds()` 结果在 `startNewGame()` 中生成后保持稳定，页面刷新时不重新生成（通过 gameState 持久化和路由守卫保证）
- **角色生成与刷新分离**：`refreshCharacters` 保留手动刷新能力，但页面初次进入时使用已生成的角色列表，不重复调用
- **路由守卫优化**：在 `useGame()` 层面提供统一的阶段校验，路由页面直接使用校验结果进行同步重定向，避免先渲染后跳转
- **启动界面增加加载状态**：StartScreen 在 Mod 加载期间展示加载进度动画（替换之前的独立遮罩），加载完成后自动过渡到"踏入万界"按钮

## Capabilities

### New Capabilities
- `startup-loading-integration`: Mod 加载进度与首页 StartScreen 融合，消除额外的全屏遮罩切换闪烁
- `generation-cache`: 世界和角色生成的缓存机制，避免路由守卫触发时重复生成数据

### Modified Capabilities
- `world-first-flow`: 路由守卫逻辑从各页面 `useEffect` 移到 `useGame` 统一校验层，减少重复渲染和竞态条件

## Impact

- **组件变更**：`ModLoadingOverlay`（改为嵌入式、非全屏）、`ModInitProvider`（传递状态给子组件）、`StartScreen`（新增加载态 props）
- **Hook 变更**：`useModLoader`（可能需要暴露给 StartScreen）、`useGame`（新增阶段校验返回值供路由同步使用）
- **页面变更**：`app/page.tsx`（传递 mod 加载状态）、所有选择页面（同步路由守卫替代 useEffect 守卫）
- **依赖关系**：不影响其他模块的 logic/ 层，仅修改 views/ 和 modules/mod/components/ 的表现层
