# World Theming

## Purpose

建立世界类型与视觉主题的绑定系统，使得 8 种游戏世界（修仙、高武、科技、魔幻、异能、仙侠、武侠、末世）各自拥有差异化视觉风格，切换世界时自动切换主题，无需刷新页面。

## ADDED Requirements

### Requirement: Each world type SHALL have a corresponding theme configuration

The system MUST define a theme configuration for each of the 8 world types. Each configuration MUST specify at minimum the following CSS variables with world-specific values:
- `--primary` (主色调)
- `--primary-foreground` (主色上的文字色)
- `--accent` (强调色)
- `--background` (背景色)
- `--foreground` (前景文字色)
- `--border` (边框色)
- `--ring` (焦点环色)

Variables not explicitly set by a world theme SHALL inherit from the default `:root` theme.

#### Scenario: Cultivation world has warm amber theme
- **WHEN** the active world is "修仙"
- **THEN** `--primary` resolves to a warm amber/brown color
- **AND** `--background` resolves to a warm beige color
- **AND** the theme conveys a classical, scholarly atmosphere

#### Scenario: Tech world has cool blue theme
- **WHEN** the active world is "科技"
- **THEN** `--primary` resolves to a cool blue/cyan color
- **AND** `--background` resolves to a neutral cool-gray
- **AND** the theme conveys a futuristic, technological atmosphere

#### Scenario: Magic world has purple arcane theme
- **WHEN** the active world is "魔幻"
- **THEN** `--primary` resolves to a royal purple/magenta color
- **AND** the theme conveys a mystical, arcane atmosphere

#### Scenario: Apocalypse world has desaturated wasteland theme
- **WHEN** the active world is "末世"
- **THEN** `--primary` resolves to a muted rust-orange
- **AND** `--background` resolves to a dark desaturated tone
- **AND** the theme conveys a bleak, survival atmosphere

### Requirement: World theme switching SHALL be triggered by world change events

When the player enters a different world, the theme MUST automatically switch without page reload. The switching mechanism MUST use `document.documentElement.setAttribute('data-world', <worldType>)` to apply the corresponding CSS variable overrides.

#### Scenario: Theme switches when player enters new world
- **WHEN** the player's active worldType changes from "修仙" to "科技"
- **THEN** `document.documentElement` attribute `data-world` changes from `"cultivation"` to `"tech"`
- **AND** all CSS variable values reflect the tech world theme
- **AND** no page reload occurs

#### Scenario: Theme falls back to default when no world is active
- **WHEN** no `data-world` attribute is set on `<html>`
- **THEN** all CSS variables use the default `:root` values (warm beige cultivation theme)
- **AND** the application renders correctly

### Requirement: World theme SHALL coexist with dark mode

Setting the dark mode class (`.dark` on `<html>`) MUST apply dark-theme overrides on top of the current world theme. The cascade priority MUST be: `:root` → `[data-world]` → `.dark` → `[data-world].dark`.

#### Scenario: Dark mode with cultivation world
- **WHEN** `<html>` has `class="dark"` and `data-world="cultivation"`
- **THEN** the rendered theme uses cultivation dark colors
- **AND** `[data-world].dark` takes highest CSS specificity

#### Scenario: Switching dark mode off restores world theme
- **WHEN** `class="dark"` is removed from `<html>` while `data-world="tech"`
- **THEN** theme reverts to tech world light colors
- **AND** no visual glitch occurs during transition

### Requirement: World theme configurations SHALL be defined in module data files

All world-specific theme variable values MUST be defined in `modules/theme/data/worldThemes.ts` as typed data, not scattered across CSS files or components. Each theme entry SHALL include: world type key, display label, theme variable overrides, and optional dark-mode-specific overrides.

#### Scenario: Theme data is in single source of truth
- **WHEN** a developer needs to modify the "修仙" world's primary color
- **THEN** they only need to change one value in `worldThemes.ts`
- **AND** the change propagates to both CSS generation and runtime theme resolution

#### Scenario: World themes are type-safe
- **WHEN** adding a new world theme entry
- **THEN** TypeScript enforces that all required theme variables are provided
- **AND** invalid property names produce a compile error

### Requirement: A ThemeProvider component SHALL manage theme state

A `ThemeProvider` React component MUST wrap the application root and manage the active theme mode (light/dark/system) and world-theme binding. It MUST expose the current theme via React Context for consumption by child components.

#### Scenario: ThemeProvider renders children when mounted
- **WHEN** ThemeProvider is mounted in `app/layout.tsx`
- **THEN** it renders its children without blocking
- **AND** `data-world` attribute is set on `<html>` based on initial game state

#### Scenario: useTheme hook returns current theme info
- **WHEN** a component calls `useTheme()`
- **THEN** it receives `{ worldType, themeMode, setThemeMode, isDark }` 
- **AND** the values reflect the current visual state
