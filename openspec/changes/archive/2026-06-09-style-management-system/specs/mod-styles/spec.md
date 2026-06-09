# Mod Styles

## Purpose

扩展 Mod 系统使其支持样式注入，允许 Mod 作者在 `mod.json` 清单中声明 CSS 文件，Mod 加载时自动将样式注入页面，支持覆盖主题变量、添加新动画和工具类。

## ADDED Requirements

### Requirement: ModContentType SHALL include 'styles' type

The `ModContentType` union type in `src/shared/lib/mod/ModManifest.ts` MUST be extended to include `'styles'` as a valid content type. The `ALL_MOD_CONTENT_TYPES` constant MUST include `'styles'`.

#### Scenario: Mod manifest accepts 'styles' content type
- **WHEN** a Mod's `mod.json` declares `"contentTypes": ["styles"]`
- **THEN** the manifest validation passes
- **AND** the ModLoader recognizes the Mod as providing style content

#### Scenario: ALL_MOD_CONTENT_TYPES includes styles
- **WHEN** inspecting `ALL_MOD_CONTENT_TYPES` constant
- **THEN** the array contains the string `'styles'`

### Requirement: Mod SHALL declare CSS files in dataFiles.styles

A Mod providing styles MUST declare its CSS file path in the `dataFiles` field of `mod.json` using the key `"styles"`. The value MUST be a path relative to the Mod directory.

#### Scenario: Mod declares a single CSS file
- **WHEN** a Mod's `mod.json` contains `"dataFiles": { "styles": "styles/theme.css" }`
- **THEN** the StyleLoader fetches and injects `{modDir}/styles/theme.css`

### Requirement: StyleLoader SHALL inject Mod CSS as scoped style elements

When a Mod with styles is loaded, the StyleLoader MUST fetch the CSS file content and create a `<style>` element in `<head>`. The `<style>` element MUST have `data-mod="<modId>"` attribute for tracking and removal.

#### Scenario: Mod CSS is injected into page head
- **WHEN** a Mod with `contentTypes: ["styles"]` finishes loading
- **THEN** a `<style data-mod="<modId>">` element exists in `<head>`
- **AND** the style element contains the Mod's CSS content

#### Scenario: Mod CSS is removed on Mod unload
- **WHEN** a Mod is unloaded or fails to load
- **THEN** the corresponding `<style data-mod="<modId>">` element is removed from `<head>`
- **AND** no orphaned style elements remain

#### Scenario: Failed Mod CSS load does not crash StyleLoader
- **WHEN** a Mod's CSS file fetch fails (404, network error)
- **THEN** the Mod is marked as failed in StyleLoader state
- **AND** other Mods' styles continue to apply normally
- **AND** a console warning is emitted with the Mod ID and error reason

### Requirement: Mod styles SHALL load in dependency order

Styles from Mods MUST be injected in dependency-resolved order. If Mod B depends on Mod A, Mod A's styles MUST be injected before Mod B's styles, giving Mod B higher CSS specificity.

#### Scenario: Dependent Mod styles override base Mod styles
- **WHEN** Mod B depends on Mod A and both provide `--primary` overrides
- **THEN** Mod B's `<style>` element appears after Mod A's in `<head>`
- **AND** Mod B's `--primary` value wins in the cascade

#### Scenario: Circular dependency detection still applies
- **WHEN** Mod A depends on Mod B and Mod B depends on Mod A
- **THEN** StyleLoader detects the cycle and logs an error
- **AND** neither Mod's styles are injected until the cycle is resolved

### Requirement: Mod styles SHALL NOT break global styles on error

If a Mod's CSS contains syntax errors or invalid values, the browser's CSS parser MUST handle it gracefully (invalid rules ignored, valid rules applied). The StyleLoader MUST wrap the fetch in a try-catch to prevent unhandled promise rejections.

#### Scenario: Invalid CSS in Mod does not crash the app
- **WHEN** a Mod's CSS file contains `--primary: notacolor;`
- **THEN** the browser ignores the invalid declaration
- **AND** other CSS rules from the same Mod are still applied
- **AND** the application does not crash or show a white screen
