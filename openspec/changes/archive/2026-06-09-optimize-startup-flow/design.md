## Context

当前启动流程存在三层问题：

1. **Mod 加载层**：`ModInitProvider` → `useModLoader()` → `ModLoadingOverlay` 使用 `fixed inset-0 z-50` 全屏遮罩，当 `phase` 从 `loading` 变为 `ready` 时，整个遮罩消失，`children`（GameProvider → HomePage → StartScreen）一次性挂载渲染，造成突兀的视觉切换。

2. **数据生成层**：`startNewGame()` 调用 `generateWorlds()`，`selectWorld()` 调用 `generateCharacters()`。但各页面的路由守卫 `useEffect` 依赖 `gameState.phase` 等字段，守卫触发重定向时可能再次进入页面并再次触发守卫，产生多余的 setState 和重新渲染。

3. **路由守卫层**：所有页面（`world-select/page.tsx`, `character-select/page.tsx`, `backstory/page.tsx`, `game/page.tsx`）都在 `useEffect` 中执行路由守卫，导致页面先渲染（可能显示空白或错误状态），然后在 effect 中检测条件不满足再重定向——这就是"闪烁"的直接原因。

当前架构：
```
RootLayout
├── ThemeProvider
├── ModInitProvider
│   ├── ModLoadingOverlay (fixed; z-50)  ← 全屏遮罩
│   └── children (当 phase=ready 时)
│       └── GameProvider
│           └── HomePage  → StartScreen
```

## Goals / Non-Goals

**Goals:**
- 消除 Mod 加载→首页的视觉闪烁，让过渡平滑
- 消除路由守卫造成的先渲染后跳转闪烁
- 避免世界/角色数据在一次会话中被重复生成
- 启动路径所有步骤（加载→世界选择→角色选择→背景故事→游戏）保持体验连贯

**Non-Goals:**
- 不改动 GameProvider 的核心状态管理架构（`useState` + `setGameState`）
- 不改动 `generateWorlds()` / `generateCharacters()` 的纯函数实现
- 不引入新的第三方动画库
- 不改变游戏开始后的核心玩法逻辑

## Decisions

### 决策 1：Mod 加载状态通过 ModContext 向下传递

**选择**：在 `ModInitProvider` 内部创建 `ModContext`，存储 `ModLoaderState`，子组件通过 `useModContext()` 读取。`ModInitProvider` 不再渲染 `ModLoadingOverlay`。

**替代方案**：
- 直接将 `useModLoader()` 移到 `app/page.tsx`：但 `page.tsx` 仅在 `/` 路由下挂载，其他路由（如 `/game`）也需要 Mod 就绪的保证。保留在 `layout.tsx` 层级确保全局可用。
- 使用 props 层层传递：会造成 props drilling，Context 更干净。

**原理**：Context 是 React 的标准跨层级传递方案。`ModInitProvider` 在 `layout.tsx` 中包裹所有页面，确保任何路由都能读取到 Mod 加载状态。

### 决策 2：StartScreen 通过 props 接收 modLoadState 并内部切换展示

**选择**：`StartScreen` 接受可选的 `modLoadState: ModLoaderState` prop。当 `phase === 'loading'` 时，用加载动画替换按钮区域（保留背景装饰层）。当 `phase === 'ready'` 时，显示完整按钮界面带淡入动画。

**替代方案**：
- 在 `ModInitProvider` 中根据当前路由决定展示方式：违反了分层架构（provider 不应知道路由）。
- 创建新的 `SplashScreen` 组件同时处理加载和首页：增加不必要的组件层级。

**原理**：`StartScreen` 已经有精致的背景装饰层（符文、光点、柔光），加载期间保留这些视觉元素可以保持品牌一致性。CSS transition（opacity）即可实现平滑过渡。

### 决策 3：路由守卫使用同步方案替代 useEffect

**选择**：在 `useGameState` 中导出一个 `getRouteGuard(pathname: string): string | null` 纯函数，根据当前 `gameState` 返回应该重定向到的路径，或 `null` 表示允许访问。路由页面在渲染时调用 Router Guard，如果需要重定向则立即 `<Redirect to={...} />`，不渲染页面内容。

**替代方案**：
- Next.js middleware：middleware 不能访问客户端 state（gameState 在 React state 中），不适用。
- 继续保持 useEffect 但加 `isRedirecting` state 防止渲染：复杂度不减，且仍有一次无意义渲染。

**原理**：同步校验在同一个渲染帧中完成重定向，浏览器不会先 paint 旧页面再跳转，根本上消除闪烁。

#### 路由守卫检查表

| 当前路径 | 允许条件 | 否则重定向到 |
|----------|----------|-------------|
| `/` | 无限制（但在游戏中时 redirect → `/game`） | `/game`（如果 playing） |
| `/world-select` | `gameState.phase === 'world-select' && gameState.worlds.length > 0` | 游戏中有主角 → `/game`；其他 → `/` |
| `/character-select` | `gameState.phase === 'character-select' && gameState.selectedWorld && gameState.characters.length > 0` | 游戏中有主角 → `/game`；有 world → `/world-select`；其他 → `/` |
| `/backstory` | `gameState.phase === 'backstory' && gameState.protagonist` | 游戏中有主角 → `/game`；有 character → `/character-select`；有 world → `/world-select`；其他 → `/` |
| `/game` | `gameState.phase === 'playing' && gameState.protagonist` | 有 character + world → `/backstory`；有 world → `/character-select`；有 worlds → `/world-select`；其他 → `/` |

### 决策 4：生成函数调用点集中管理，路由守卫不触发生成

**选择**：
- `generateWorlds()` 仅在 `startNewGame()` 中调用
- `generateCharacters()` 仅在 `selectWorld()` 中调用
- `refreshCharacters` Hook 保留但仅响应用户手动点击"刷新"按钮
- 路由守卫和页面路由组件的渲染阶段不触发任何生成函数

**原理**：单一职责——路由守卫负责"保护入口"，不负责"准备数据"。数据由用户明确的确认操作生成。

## Risks / Trade-offs

- **[风险] 同步路由守卫在服务端渲染（SSR）时可能表现不一致** → **缓解**：所有受影响页面已标记 `'use client'`，在客户端渲染。路由守卫逻辑仅依赖 React state，不存在 SSR hydration mismatch。
- **[风险] ModContext 增加了一层 Context 嵌套** → **缓解**：Mod loading 只在启动阶段有意义，运行时不频繁更新，性能影响可忽略。Context 嵌套层级从 3 变 4，在可接受范围。
- **[权衡] 用户直接修改 URL 到 `/world-select` 无数据时会立即重定向到 `/`** → **可接受**：这是设计意图。用户应通过首页开始游戏流程。

## Open Questions

- 是否需要保留 `ModLoadingOverlay` 组件作为 fallback（在 ModInitProvider 检测到异常循环时使用）？→ 建议保留但改为非默认路径。
- 路由守卫同步逻辑是否应该放到 `shared/lib/` 作为纯函数，而非留在 `useGameState` 中？→ 建议先放 `useGameState` 中，后续视复用需求提取。
