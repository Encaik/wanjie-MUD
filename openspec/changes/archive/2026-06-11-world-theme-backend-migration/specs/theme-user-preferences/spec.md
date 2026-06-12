# theme-user-preferences

主题用户偏好 — 用户可切换外观模式（亮色/暗色/跟随系统）和配色来源（世界主题/默认主题），偏好存储在 localStorage。

## ADDED Requirements

### Requirement: User SHALL be able to select appearance mode

系统 SHALL 提供三种外观模式：`light`（亮色）、`dark`（暗色）、`system`（跟随系统）。用户选择后 SHALL 立即生效，并持久化到 `localStorage` key `theme_prefs`。

#### Scenario: Switch to dark mode

- **WHEN** 用户在设置面板选择 "暗色" 模式
- **THEN** `<html>` 元素添加 `class="dark"`
- **AND** `localStorage.theme_prefs.themeMode` 为 `"dark"`
- **AND** 所有 CSS 变量使用对应暗色值

#### Scenario: Switch to system mode

- **WHEN** 用户在设置面板选择 "跟随系统"
- **AND** 系统偏好为暗色
- **THEN** `<html>` 元素添加 `class="dark"`
- **AND** 当系统偏好切换为亮色时，`<html>` 的 `class="dark"` 自动移除

#### Scenario: Mode persists across page reloads

- **WHEN** 用户选择 "暗色" 模式后刷新页面
- **THEN** 页面加载时立即应用暗色模式
- **AND** 无亮色闪烁（FOUC）

### Requirement: User SHALL be able to toggle world theme

系统 SHALL 提供 `useWorldTheme` 开关，允许用户选择使用当前世界专属主题或默认主题。该偏好存储在 `localStorage` key `theme_prefs`。

#### Scenario: Enable world theme

- **WHEN** 用户开启"使用世界主题"且当前世界为"科技世界"
- **THEN** 页面 CSS 变量使用科技世界的配色（冷蓝系）
- **AND** `localStorage.theme_prefs.useWorldTheme` 为 `true`

#### Scenario: Disable world theme

- **WHEN** 用户关闭"使用世界主题"
- **THEN** 页面 CSS 变量移除所有 `setProperty` 设置
- **AND** 页面回退到默认主题（`:root` 或 `.dark` 的值）
- **AND** `localStorage.theme_prefs.useWorldTheme` 为 `false`

#### Scenario: Toggle persists across page reloads

- **WHEN** 用户关闭世界主题后刷新页面
- **THEN** 默认主题立即生效
- **AND** 不发送世界主题 API 请求（或不应用返回数据）

### Requirement: Theme settings panel SHALL be in game settings page

游戏设置页面（`views/game/settings/`）SHALL 包含主题设置区域，展示外观模式选择器和配色来源选择器，以及当前生效主题的颜色预览。

#### Scenario: Settings panel shows current theme status

- **WHEN** 用户打开游戏设置页面
- **THEN** 外观模式显示当前选择（亮色/暗色/系统高亮）
- **AND** 配色来源显示 "世界主题（科技世界）" 或 "默认主题"
- **AND** 预览区展示当前主题的 5 个关键色块（primary、background、foreground、accent、border）

#### Scenario: Switching color source updates preview immediately

- **WHEN** 用户在设置面板切换配色来源
- **THEN** 预览色块和页面全局样式实时更新
- **AND** 无需保存按钮（即时生效）

### Requirement: Theme preferences SHALL be read from localStorage on init

应用启动时 SHALL 同步读取 `localStorage` 中的 `theme_prefs`，在 React 水合前应用外观模式和配色来源。

#### Scenario: Cold start with saved preferences

- **WHEN** 用户上次选择了暗色 + 科技世界主题，再次打开应用
- **THEN** `<head>` 内联脚本读取 `theme_prefs`
- **AND** 在水合前设置 `<html class="dark">` 并应用缓存的科技世界 CSS 变量
- **AND** 页面无亮色闪烁
