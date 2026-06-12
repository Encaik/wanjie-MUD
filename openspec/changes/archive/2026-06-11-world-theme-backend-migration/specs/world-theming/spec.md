# world-theming

世界主题系统 — 将主题数据来源从前端硬编码迁移到后端 API，应用方式从 `data-world` CSS 选择器改为 JS 运行时 `setProperty` 注入。

## MODIFIED Requirements

### Requirement: Each world type SHALL have a corresponding theme configuration

The system MUST define a theme configuration for each world type. Each configuration MUST specify at minimum the following CSS variables with world-specific values for both light and dark modes:
- `--primary` (主色调)
- `--primary-foreground` (主色上的文字色)
- `--accent` (强调色)
- `--accent-foreground` (强调色上的文字色)
- `--background` (背景色)
- `--foreground` (前景文字色)
- `--border` (边框色)
- `--ring` (焦点环色)
- `--card` (卡片背景)
- `--card-foreground` (卡片文字)
- `--muted` (柔和色)
- `--muted-foreground` (柔和文字)
- `--secondary` (次要色)
- `--secondary-foreground` (次要色文字)

Variables not explicitly set by a world theme SHALL inherit from the default `:root`/`.dark` values in `themes.css`.

Theme configurations SHALL be stored in `WorldviewDefinition.themeConfig` on the backend and retrieved via `GET /api/v1/worldviews/[id]/theme`. The frontend SHALL NOT contain hardcoded world theme data.

#### Scenario: Cultivation world has warm amber theme

- **WHEN** the active world is "修仙" and `useWorldTheme` is `true`
- **THEN** `--primary` resolves to a warm amber/brown color
- **AND** `--background` resolves to a warm beige color
- **AND** the theme conveys a classical, scholarly atmosphere

#### Scenario: Tech world has cool blue theme

- **WHEN** the active world is "科技" and `useWorldTheme` is `true`
- **THEN** `--primary` resolves to a cool blue/cyan color
- **AND** `--background` resolves to a neutral cool-gray
- **AND** the theme conveys a futuristic, technological atmosphere

#### Scenario: Magic world has purple arcane theme

- **WHEN** the active world is "魔幻" and `useWorldTheme` is `true`
- **THEN** `--primary` resolves to a royal purple/magenta color
- **AND** the theme conveys a mystical, arcane atmosphere

#### Scenario: Apocalypse world has desaturated wasteland theme

- **WHEN** the active world is "末世" and `useWorldTheme` is `true`
- **THEN** `--primary` resolves to a muted rust-orange
- **AND** `--background` resolves to a dark desaturated tone
- **AND** the theme conveys a bleak, survival atmosphere

### Requirement: World theme switching SHALL be triggered by world change events

When the player enters a different world, the theme MUST automatically switch without page reload. The switching mechanism MUST use `document.documentElement.style.setProperty(varName, value)` to apply CSS variable overrides for each variable in the theme config. When the world theme is disabled by the user (`useWorldTheme = false`), the mechanism MUST call `removeProperty` to clear all injected variables, reverting to the default `:root`/`.dark` theme.

#### Scenario: Theme switches when player enters new world

- **WHEN** the player's active world changes from "修仙" to "科技" and `useWorldTheme` is `true`
- **THEN** `setProperty` replaces all CSS variable values with tech world theme values
- **AND** `--primary` changes from amber to cool blue
- **AND** no page reload occurs

#### Scenario: Theme falls back to default when world theme is disabled

- **WHEN** `useWorldTheme` is `false`
- **THEN** all world-theme `setProperty` values are removed via `removeProperty`
- **AND** CSS variables fall back to `:root` or `.dark` values from `themes.css`
- **AND** the application renders correctly

#### Scenario: Theme falls back to default when world has no theme config

- **WHEN** the current world's `themeConfig` is undefined
- **THEN** the application uses default `:root`/`.dark` theme
- **AND** no API error is surfaced to the user

### Requirement: World theme SHALL coexist with dark mode

Setting the dark mode class (`.dark` on `<html>`) MUST apply dark-theme overrides on top of the current world theme. When `useWorldTheme` is `true`, the dark mode toggle SHALL switch between `worldThemeData.lightTheme` and `worldThemeData.darkTheme` via `setProperty`. When `useWorldTheme` is `false`, the dark mode toggle SHALL rely on `themes.css` `.dark` cascade.

#### Scenario: Dark mode with cultivation world theme

- **WHEN** `<html>` has `class="dark"` and user is in "修仙" world with `useWorldTheme = true`
- **THEN** the rendered theme uses cultivation dark colors
- **AND** `setProperty` has applied `worldThemeData.darkTheme` values

#### Scenario: Switching dark mode off restores world light theme

- **WHEN** `class="dark"` is removed from `<html>` while in "tech" world with `useWorldTheme = true`
- **THEN** `setProperty` values switch from `darkTheme` to `lightTheme`
- **AND** no visual glitch occurs during transition

### Requirement: A ThemeProvider component SHALL manage theme state

A `ThemeProvider` React component MUST wrap the application root and manage the active theme mode (light/dark/system) and world-theme binding. It MUST expose the current theme via React Context for consumption by child components. It MUST fetch world theme data from the backend API when the world changes, and SHALL apply CSS variables via `setProperty` / `removeProperty`.

#### Scenario: ThemeProvider renders children when mounted

- **WHEN** ThemeProvider is mounted in `app/layout.tsx`
- **THEN** it renders its children without blocking
- **AND** reads `theme_prefs` from localStorage to initialize theme state
- **AND** applies cached world theme if available

#### Scenario: useTheme hook returns current theme info

- **WHEN** a component calls `useTheme()`
- **THEN** it receives `{ theme, setThemeMode, toggleDarkMode, setUseWorldTheme }` from the Theme Context
- **AND** `theme` includes `useWorldTheme`, `worldThemeData`, and `themeLoading` fields
- **AND** the values reflect the current visual state

## REMOVED Requirements

### Requirement: World theme configurations SHALL be defined in module data files

**Reason**: 世界主题数据已迁移到后端 `WorldviewDefinition.themeConfig`，前端不再维护副本。旧的 `modules/theme/data/worldThemes.ts` 文件将被删除。

**Migration**: 8 个内置世界观的主题数据已迁入各世界观 JSON 定义文件。前端通过 `GET /api/v1/worldviews/[id]/theme` 获取。现有 `worldThemes.ts` 的导入引用更新为 API 调用 + 类型导入。
