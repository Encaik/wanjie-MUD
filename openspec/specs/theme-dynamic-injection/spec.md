# theme-dynamic-injection

## Purpose

JS 运行时通过 `documentElement.style.setProperty` 将世界主题 CSS 变量动态注入页面，替代早期版本的 CSS 选择器方案，支持用户开关世界主题。

## Requirements

### Requirement: World theme SHALL be applied via setProperty

当 `useWorldTheme` 为 `true` 且世界主题数据已加载时，系统 SHALL 通过 `document.documentElement.style.setProperty(varName, value)` 将主题变量设置到 `:root` 元素。该方法 SHALL 在 ThemeProvider 组件中调用，响应 `useWorldTheme`、`isDark`、`worldThemeData` 的变化。

#### Scenario: Apply tech world light theme

- **WHEN** `useWorldTheme = true`、`isDark = false`、`worldThemeData.lightTheme` 包含科技世界配色
- **THEN** `document.documentElement.style` 包含 `--primary: oklch(0.50 0.13 245)`
- **AND** `document.documentElement.style` 包含 `--background: oklch(0.96 0.005 250)`
- **AND** 至少 15 个 CSS 变量被设置

#### Scenario: Switch to dark mode preserves world theme

- **WHEN** 当前应用科技世界亮色主题，用户切换为暗色模式
- **THEN** `setProperty` 用 `darkTheme` 的值替换 `lightTheme` 的值
- **AND** `--primary` 变更为暗色版本 `oklch(0.68 0.12 245)`
- **AND** `<html class="dark">` 同步设置

### Requirement: Disabling world theme SHALL remove injected variables

当 `useWorldTheme` 切换为 `false` 时，系统 SHALL 通过 `document.documentElement.style.removeProperty(varName)` 移除所有之前注入的 CSS 变量。移除后，页面 SHALL 回退到 `themes.css` 中 `:root` 或 `.dark` 定义的默认值。

#### Scenario: Disable world theme reverts to default

- **WHEN** 用户关闭"使用世界主题"（`useWorldTheme = false`）
- **THEN** 所有 `setProperty` 设置的变量被 `removeProperty` 移除
- **AND** 页面使用 `themes.css :root` 的默认亮色值（或 `.dark` 的默认暗色值）

#### Scenario: Toggle between world and default is instantaneous

- **WHEN** 用户在设置面板快速切换配色来源
- **THEN** 页面颜色在 1 帧内更新
- **AND** 无过渡动画（除非元素自身有 `transition-colors`）

### Requirement: Theme variables SHALL be cached in localStorage

世界主题数据 SHALL 在成功获取后缓存到 `localStorage` key `world_theme_cache`。缓存结构 SHALL 包含 `worldviewId`、`lightTheme`、`darkTheme` 和 `timestamp`。

#### Scenario: Theme data cached after API fetch

- **WHEN** API 返回科技世界主题数据
- **THEN** `localStorage.world_theme_cache` 写入 `{ worldviewId: "tech", lightTheme: {...}, darkTheme: {...}, timestamp: <当前时间> }`
- **AND** 下次进入同一世界时优先读取缓存

#### Scenario: Cache hit prevents FOUC on reload

- **WHEN** 页面重新加载且 localStorage 中有 `world_theme_cache`
- **THEN** `<head>` 内联脚本读取缓存并调用 `setProperty`
- **AND** CSS 变量在水合前已生效
- **AND** 后台 fetch API 刷新缓存数据

### Requirement: Theme injection SHALL be environment-aware

主题注入操作 SHALL 检测运行环境：在 SSR/SSG 中 SHALL no-op（`typeof document === 'undefined'` 守卫），在浏览器中 SHALL 正常执行。

#### Scenario: No-op during server-side rendering

- **WHEN** `setProperty` 或 `removeProperty` 在 Next.js SSR 期间被调用
- **THEN** 不抛出异常
- **AND** 不执行任何 DOM 操作

#### Scenario: Normal operation after hydration

- **WHEN** 应用在客户端完成水合
- **THEN** ThemeProvider 检测到浏览器环境并正常执行变量注入

### Requirement: Theme transition SHALL be smooth

当主题变量值发生变化时，使用了 `transition-colors` 或 `transition-all` 的 UI 元素 SHALL 平滑过渡（约 300ms）。未使用过渡类的元素 SHALL 立即更新。

#### Scenario: Buttons animate on theme switch

- **WHEN** 世界主题从修仙切换到科技
- **AND** 按钮使用 `transition-colors duration-300`
- **THEN** 按钮颜色在 300ms 内从琥珀色过渡到科技蓝
- **AND** 过渡曲线为 ease-in-out
