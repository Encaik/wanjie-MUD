## Why

当前 8 个世界观的亮/暗主题配色同时硬编码在前端三处（`themes.css`、`worldThemes.ts`、`WorldviewDefinition.visualConfig`），Mod 新增世界观无法携带主题配色，且"关闭世界主题使用默认主题"的用户偏好完全不可控。主题作为世界观的固有属性，应跟随世界观数据一起存储在后端，前端通过 API 获取并按用户偏好动态应用。

## What Changes

- **后端 WorldviewDefinition 新增 themeConfig**：包含 `light` 和 `dark` 两套 CSS 变量映射（~15 个变量），作为世界观定义的必填字段
- **新增 API 端点**：`GET /api/v1/worldviews/[id]/theme`，返回世界观的完整主题数据
- **前端删除硬编码世界主题**：移除 `modules/theme/data/worldThemes.ts` 文件，移除 `themes.css` 中所有 `[data-world]` 选择器块
- **主题应用方式从 CSS 选择器改为 JS 动态注入**：通过 `documentElement.style.setProperty` 设置 CSS 变量覆盖；关闭世界主题时 `removeProperty` 回退到默认值
- **用户主题偏好系统**：新增 `useWorldTheme` 开关和 `themeMode`（light/dark/system）选择，存入 localStorage
- **FOUC 防御**：localStorage 缓存世界主题数据，页面加载时内联脚本立即恢复，后台 fetch 刷新
- **设置页面新增主题面板**：游戏设置页中展示外观模式切换 + 世界主题/默认主题切换 + 当前主题预览

## Capabilities

### New Capabilities

- `world-theme-api`：后端 API 端点 `GET /api/v1/worldviews/[id]/theme`，从 WorldviewDefinition 返回主题配置
- `theme-user-preferences`：用户可切换亮色/暗色/跟随系统 + 世界主题/默认主题，偏好存储在 localStorage
- `theme-dynamic-injection`：JS 运行时通过 `setProperty` 注入 CSS 变量，替代 CSS 选择器方案

### Modified Capabilities

- `world-theming`：**BREAKING** 架构变更 — 主题数据来源从前端硬编码迁移到后端 API，应用方式从 `data-world` 属性 + CSS 选择器改为 JS 运行时 `setProperty`。旧 CSS 选择器机制移除，`worldThemes.ts` 文件删除
- `worldview-definition`：`WorldviewDefinition` 新增必填字段 `themeConfig: { light: Record<string, string>; dark: Record<string, string> }`
- `style-loader`：StyleLoader 优先级栈中"世界主题"层的实现方式从 CSS 选择器切换为 JS 运行时注入

## Impact

- **`core/registry/WorldViewRegistry.ts`** — `WorldviewDefinition` 接口新增 `themeConfig` 字段
- **`app/api/v1/worldviews/[id]/theme/route.ts`** — 新建 API 端点
- **8 个世界观定义 JSON/注册文件** — 补 `themeConfig` 数据（值从 `worldThemes.ts` 迁移）
- **`modules/theme/data/worldThemes.ts`** — 删除
- **`modules/theme/data/defaultTheme.ts`** — 保留（默认兜底）
- **`modules/theme/types.ts`** — `ThemeSlice` 新增 `useWorldTheme`、`worldThemeData`、`themeLoading` 字段
- **`modules/theme/state.ts`** — 适配新字段
- **`modules/theme/events.ts`** — 世界切换时触发后端 fetch
- **`modules/theme/components/ThemeProvider.tsx`** — 集成世界主题获取 + CSS 变量注入 + FOUC 防御
- **`modules/theme/hooks/useThemeSettings.ts`** — 新建主题设置 Hook
- **`app/styles/themes.css`** — 删除所有 `[data-world]` 选择器块，仅保留 `:root` + `.dark`
- **`views/game/settings/`** — 新增主题设置面板组件
- **导入路径在 10-15 个文件中更新**（删除 `worldThemes.ts` 后的引用清理）
