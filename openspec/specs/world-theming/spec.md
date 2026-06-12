# World Theming

## Purpose

建立世界类型与视觉主题的绑定系统，使得各游戏世界拥有差异化视觉风格。主题数据存储在后端 `WorldviewDefinition.themeConfig`，通过 API 获取，前端使用 `setProperty` 动态注入 CSS 变量。用户可选择使用世界主题或默认主题。

## Requirements

### Requirement: Each world type SHALL have a corresponding theme configuration

The system MUST define a theme configuration for each world type. Each configuration MUST specify at minimum the following CSS variables with world-specific values for both light and dark modes:
- `--primary`、`--primary-foreground`、`--accent`、`--accent-foreground`
- `--background`、`--foreground`
- `--border`、`--ring`
- `--card`、`--card-foreground`、`--muted`、`--muted-foreground`
- `--secondary`、`--secondary-foreground`

Variables not explicitly set by a world theme SHALL inherit from the default `:root`/`.dark` values in `themes.css`.

Theme configurations SHALL be stored in `WorldviewDefinition.themeConfig` on the backend and retrieved via `GET /api/v1/worldviews/[id]/theme`. The frontend SHALL NOT contain hardcoded world theme data.

#### Scenario: Cultivation world has warm amber theme

- **WHEN** the active world is "修仙" and `useWorldTheme` is `true`
- **THEN** `--primary` resolves to a warm amber/brown color
- **AND** `--background` resolves to a warm beige color

#### Scenario: Tech world has cool blue theme

- **WHEN** the active world is "科技" and `useWorldTheme` is `true`
- **THEN** `--primary` resolves to a cool blue/cyan color

#### Scenario: Magic world has purple arcane theme

- **WHEN** the active world is "魔幻" and `useWorldTheme` is `true`
- **THEN** `--primary` resolves to a royal purple/magenta color

#### Scenario: Apocalypse world has desaturated wasteland theme

- **WHEN** the active world is "末世" and `useWorldTheme` is `true`
- **THEN** `--primary` resolves to a muted rust-orange

### Requirement: World theme switching SHALL be triggered by world change events

When the player enters a different world, the theme MUST automatically switch without page reload. The switching mechanism MUST use `document.documentElement.style.setProperty(varName, value)` to apply CSS variable overrides. When the world theme is disabled (`useWorldTheme = false`), `removeProperty` clears all injected variables, reverting to the default theme.

#### Scenario: Theme switches when player enters new world

- **WHEN** the player's active world changes from "修仙" to "科技" and `useWorldTheme` is `true`
- **THEN** `setProperty` replaces all CSS variable values with tech world theme values
- **AND** no page reload occurs

#### Scenario: Theme falls back to default when world theme is disabled

- **WHEN** `useWorldTheme` is `false`
- **THEN** all world-theme `setProperty` values are removed via `removeProperty`
- **AND** CSS variables fall back to `:root` or `.dark` values from `themes.css`

#### Scenario: Theme falls back to default when world has no theme config

- **WHEN** the current world's `themeConfig` is undefined
- **THEN** the application uses default `:root`/`.dark` theme
- **AND** no API error is surfaced to the user

### Requirement: World theme SHALL coexist with dark mode

Setting the dark mode class (`.dark` on `<html>`) MUST apply dark-theme overrides. When `useWorldTheme` is `true`, dark mode SHALL switch between `worldThemeData.lightTheme` and `worldThemeData.darkTheme` via `setProperty`. When `useWorldTheme` is `false`, dark mode SHALL rely on `themes.css` `.dark` cascade.

#### Scenario: Dark mode with cultivation world theme

- **WHEN** `<html>` has `class="dark"` and user is in "修仙" world with `useWorldTheme = true`
- **THEN** the rendered theme uses cultivation dark colors
- **AND** `setProperty` has applied `worldThemeData.darkTheme` values

#### Scenario: Switching dark mode off restores world light theme

- **WHEN** `class="dark"` is removed from `<html>` while in "tech" world with `useWorldTheme = true`
- **THEN** `setProperty` values switch from `darkTheme` to `lightTheme`
- **AND** no visual glitch occurs during transition

### Requirement: A ThemeProvider component SHALL manage theme state

A `ThemeProvider` React component MUST wrap the application root and manage the active theme mode (light/dark/system) and world-theme binding. It MUST fetch world theme data from the backend API when the world changes, and SHALL apply CSS variables via `setProperty` / `removeProperty`.

#### Scenario: ThemeProvider renders children when mounted

- **WHEN** ThemeProvider is mounted in `app/layout.tsx`
- **THEN** it renders its children without blocking
- **AND** reads `theme_prefs` from localStorage to initialize theme state
- **AND** applies cached world theme if available

#### Scenario: useTheme hook returns current theme info

- **WHEN** a component calls `useTheme()`
- **THEN** it receives `{ theme, setThemeMode, toggleDarkMode, setUseWorldTheme }` from the Theme Context
- **AND** `theme` includes `useWorldTheme`, `worldThemeData`, and `themeLoading` fields
