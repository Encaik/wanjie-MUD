# Style Tokens

## Purpose

将 `globals.css` 从单文件拆分为按职责分层的 CSS 文件体系（设计令牌层、主题层、动画层、基础样式层），每个文件职责单一、可被独立覆盖，为世界主题切换和 Mod 样式注入提供架构基础。

## Requirements

### Requirement: CSS files SHALL be split into four concern-separated layers

The global stylesheet `src/app/globals.css` MUST be split into four files under `src/app/styles/`:

| 文件 | 职责 | 内容 |
|------|------|------|
| `tokens.css` | 设计令牌声明 | `@theme inline` 块——将 CSS 变量桥接到 Tailwind 类名 |
| `themes.css` | 主题变量值 | `:root` / `.dark` / `[data-world]` 选择器中 CSS 变量具体值 |
| `animations.css` | 关键帧定义 | 所有 `@keyframes` 定义，无选择器 |
| `base.css` | 全局基础样式 + 工具类 | `@layer base` 全局样式 + `@layer utilities` 动画工具类 |

`globals.css` MUST be simplified to only `@import` these files via a single aggregation entry point.

#### Scenario: tokens.css contains only @theme inline declarations
- **WHEN** inspecting `src/app/styles/tokens.css`
- **THEN** the file contains exactly one `@theme inline { ... }` block mapping `--color-*`, `--radius-*`, `--font-*`, `--shadow-*` tokens to CSS variables
- **AND** contains NO CSS variable value assignments (no `:root { }` blocks)

#### Scenario: themes.css contains all CSS variable value assignments
- **WHEN** inspecting `src/app/styles/themes.css`
- **THEN** it contains `:root { }` block with all default light-theme CSS variable values
- **AND** it contains `.dark { }` block with dark-theme CSS variable values
- **AND** it contains `[data-world="..."] { }` blocks for each world-specific theme
- **AND** it contains NO `@keyframes` definitions

#### Scenario: animations.css contains only @keyframes
- **WHEN** inspecting `src/app/styles/animations.css`
- **THEN** every top-level block is a `@keyframes <name> { ... }` definition
- **AND** contains NO CSS variable assignments
- **AND** contains NO selector-based rules

#### Scenario: base.css contains global base styles and utility classes
- **WHEN** inspecting `src/app/styles/base.css`
- **THEN** it contains `@layer base { ... }` for global resets and body styles
- **AND** it contains `@layer utilities { ... }` for animation utility classes (e.g., `.animate-float`)
- **AND** it contains NO `@keyframes` definitions
- **AND** it contains NO CSS variable value assignments

#### Scenario: globals.css is simplified to aggregation entry
- **WHEN** inspecting `src/app/globals.css`
- **THEN** it contains only `@import` statements pointing to `./styles/index.css`
- **AND** the file is no more than 10 lines

#### Scenario: Build succeeds with split files
- **WHEN** running `pnpm build`
- **THEN** the build completes without CSS-related errors
- **AND** the static export output includes all styles

### Requirement: All existing CSS variable names SHALL remain unchanged

The splitting MUST NOT rename any existing CSS custom property (e.g., `--background`, `--primary`, `--quality-mythic`, `--radius`, `--font-serif`).

#### Scenario: Existing component styles are unaffected
- **WHEN** comparing before/after screenshots after file splitting
- **THEN** all components render with identical visual appearance (colors, fonts, spacing, shadows)
- **AND** no visual regression is observable

#### Scenario: Dark mode still works via .dark class
- **WHEN** the `<html>` element has class `dark`
- **THEN** all components render with dark theme colors
- **AND** the dark theme color values are identical to pre-split values

### Requirement: Animation keyframes SHALL NOT be injected via JavaScript

Component files MUST NOT dynamically create `<style>` elements for `@keyframes` definitions. All `@keyframes` definitions MUST be placed in `animations.css`.

#### Scenario: No component injects keyframes via JavaScript
- **WHEN** inspecting `src/modules/` and `src/shared/ui/` component files
- **THEN** no component file contains `document.createElement('style')` for `@keyframes` injection
- **AND** all keyframe animations are defined in `src/app/styles/animations.css`

### Requirement: Semantic CSS variable token naming SHALL follow a consistent convention

CSS variables used for theming MUST follow the pattern `<category>-<property>` for single-concept tokens (e.g., `--primary`, `--radius-lg`) and `<category>-<subcategory>-<property>` for multi-concept tokens (e.g., `--quality-mythic`, `--sidebar-accent-foreground`). No new ad-hoc variable naming is permitted.

#### Scenario: New quality color variables follow existing pattern
- **WHEN** adding any new quality-tier color variable
- **THEN** the variable name matches `--quality-<tier>` pattern
- **AND** the tier name is one of: mythic, legendary, epic, rare, uncommon, common, poor, basic
