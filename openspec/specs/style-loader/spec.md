# Style Loader

## Purpose

提供样式加载引擎，管理 CSS 文件的动态注入、优先级排序、热切换和卸载，支持基础样式、世界主题、Mod 注入样式的层叠覆盖。

## Requirements

### Requirement: StyleLoader SHALL manage a priority-ordered style stack

The StyleLoader MUST maintain an ordered stack of style sources with the following priority layers (lowest to highest):

| 优先级 | 来源 | 生命周期 | 卸载条件 |
|--------|------|----------|----------|
| 0 | 基础样式 (tokens.css, base.css) | 永久（构建时注入） | 从不卸载 |
| 1 | 主题变量 (themes.css :root, .dark) | 永久（构建时注入） | 从不卸载 |
| 2 | 世界主题 ([data-world]) | 运行时切换 | 世界切换 |
| 3 | Mod 样式 (按依赖顺序) | Mod 加载/卸载 | Mod 卸载 |

#### Scenario: Style stack order is enforced
- **WHEN** a base style, a world theme, and two Mods are all active
- **THEN** CSS cascade resolution follows: base < world < Mod A < Mod B (B depends on A)
- **AND** a Mod B CSS rule overrides the same rule in Mod A, world theme, and base

#### Scenario: World theme switch preserves Mod styles
- **WHEN** the world changes from "修仙" to "科技"
- **THEN** the `data-world` attribute updates to "tech"
- **AND** all loaded Mod `<style>` elements remain in `<head>` unchanged
- **AND** Mod CSS still overrides world theme CSS

### Requirement: StyleLoader SHALL support hot theme switching

When the world theme changes, the transition MUST be instantaneous (CSS variable change only, no stylesheet reload or FOUC). No JavaScript-driven animation or transition delay is required for the theme switch itself.

#### Scenario: Instant theme switch on world change
- **WHEN** `data-world` attribute changes from "cultivation" to "tech"
- **THEN** all elements re-render with new CSS variable values within one frame
- **AND** no style recalculation delay or flash of unstyled content (FOUC) is observable

#### Scenario: Smooth transition for themed elements
- **WHEN** a component uses `transition-colors duration-300` class
- **THEN** color transitions animate smoothly over 300ms on theme switch
- **AND** non-color properties do not animate unless explicitly configured

### Requirement: StyleLoader SHALL track injected style elements

The StyleLoader MUST maintain a `Map<string, HTMLStyleElement>` tracking each injected style by Mod ID. This enables precise removal and replacement of individual Mod styles.

#### Scenario: Style element is tracked by Mod ID
- **WHEN** Mod "my-theme" is loaded and its CSS injected
- **THEN** `StyleLoader.getStyleElement("my-theme")` returns the `<style>` element
- **AND** the element is present in `<head>`

#### Scenario: Style element is removed from tracking on unload
- **WHEN** Mod "my-theme" is unloaded
- **THEN** `StyleLoader.getStyleElement("my-theme")` returns `undefined`
- **AND** the `<style>` element is removed from `<head>`

### Requirement: StyleLoader SHALL be accessible as a singleton

The StyleLoader MUST be implemented as a singleton class accessible via `StyleLoader.getInstance()`. This ensures a single source of truth for style state across the application.

#### Scenario: Singleton returns same instance
- **WHEN** `StyleLoader.getInstance()` is called from two different modules
- **THEN** both calls return the same object reference
- **AND** injected styles are visible from both call sites

#### Scenario: StyleLoader is tree-shakeable when unused
- **WHEN** no code imports StyleLoader
- **THEN** the StyleLoader code is not included in the JavaScript bundle

### Requirement: StyleLoader SHALL provide event hooks for style lifecycle

The StyleLoader MUST emit events or invoke callbacks on style lifecycle changes:
- `onStylesLoaded(modId: string)`: Called when a Mod's styles are successfully injected
- `onStylesUnloaded(modId: string)`: Called when a Mod's styles are removed
- `onStylesError(modId: string, error: Error)`: Called when a Mod's styles fail to load

#### Scenario: Style load callback fires on success
- **WHEN** Mod "my-theme" CSS is successfully fetched and injected
- **THEN** registered `onStylesLoaded` callbacks are invoked with `modId: "my-theme"`
- **AND** the callback receives the correct Mod ID

#### Scenario: Style error callback fires on fetch failure
- **WHEN** Mod "bad-theme" CSS fetch returns 404
- **THEN** registered `onStylesError` callbacks are invoked with `modId: "bad-theme"` and the Error object
- **AND** the callback does NOT throw (StyleLoader wraps in try-catch)

### Requirement: StyleLoader SHALL be environment-aware

The StyleLoader MUST detect whether it is running in a browser environment and gracefully no-op in server-side rendering (Next.js SSR/SSG). In SSR, `getInstance()` MUST return a stub that does nothing but does not throw.

#### Scenario: StyleLoader no-ops during SSR
- **WHEN** StyleLoader methods are called during Next.js static generation
- **THEN** no error is thrown
- **AND** no `<style>` element manipulation is attempted
- **AND** `typeof document === 'undefined'` guard is checked before DOM operations

#### Scenario: StyleLoader works after hydration
- **WHEN** the application hydrates on the client
- **THEN** StyleLoader detects browser environment and operates normally
- **AND** all previously registered callbacks fire correctly
