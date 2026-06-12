## Context

项目当前已有主题系统雏形：`modules/theme/` 模块管理主题状态，`ThemeProvider` 包裹应用根，`themes.css` 通过 `[data-world]` CSS 选择器为 8 种世界提供亮/暗配色。但数据流是割裂的——世界主题硬编码在前端，后端 `WorldviewDefinition` 只有 `visualConfig`（Tailwind class 名，用于卡片预览），不包含完整的 CSS 变量数据。Mod 新增世界观无法携带主题。

**约束：**
- 默认亮/暗色（`:root`、`.dark`）永远留在前端 `themes.css`，不依赖后端
- 世界主题数据归属 `WorldviewDefinition`，前端不再保留副本
- 用户偏好存 localStorage
- 主题切换面板在游戏设置页

**相关现有 spec：** `world-theming`（将重写）、`worldview-definition`（加字段）、`style-loader`（优先级栈）

## Goals / Non-Goals

**Goals:**
1. 将世界主题数据迁入 `WorldviewDefinition.themeConfig`，通过 API 获取
2. 删除前端硬编码的世界主题（`worldThemes.ts` + `themes.css` 中的 `[data-world]` 块）
3. 实现 JS 运行时 CSS 变量注入（`setProperty`），打开/关闭世界主题
4. 支持用户选择：外观模式（light/dark/system）× 配色来源（world/default）
5. FOUC 防御：localStorage 缓存世界主题数据 + 用户偏好，首屏内联恢复

**Non-Goals:**
- 不改变默认亮/暗 CSS 变量值（`:root` / `.dark` 不变）
- 不改变 Tailwind `tokens.css` 的桥接方式
- 不改变 Mod 样式注入机制（`StyleLoader` + `<style>` 标签）
- 不改变 8 个世界的颜色设计（值不变，只改存储位置和应用方式）

## Decisions

### D1: 主题应用方式 — CSS 选择器 → JS `setProperty`

**决策：** 用 `document.documentElement.style.setProperty(var, val)` 设置世界主题变量，不再通过 `[data-world]` CSS 选择器。

**理由：**
- 世界主题数据来自后端 API（运行时数据），不再是构建时 CSS
- 支持"关闭世界主题"——`removeProperty` 即可回退到 `:root`/`.dark` 默认值
- 与用户偏好（`useWorldTheme` boolean）的联动更简单直接

**备选方案（已拒绝）：** 继续用 CSS 选择器 + 动态注入 `<style>` 标签。拒绝理由：需要动态生成 CSS、更复杂的 GC、开关逻辑绕。

**CSS 变量优先级（高→低）：**
```
1. documentElement.style.setProperty  ← 世界主题开启时设置
2. themes.css :root / .dark           ← 默认主题（永久兜底）
```
> 注：Mod `<style>` 标签仍有最高优先级（`StyleLoader` 机制不变，在 `setProperty` 之后注入）

### D2: 缓存策略 — localStorage 双层缓存

**决策：** 缓存两份独立数据：
- `theme_prefs`：`{ themeMode, useWorldTheme }` — 用户选择
- `world_theme_cache`：`{ worldviewId, lightTheme, darkTheme, timestamp }` — 主题数据

**理由：**
- 首屏使用 `<head>` 内联脚本同步读取 → 无闪烁
- 用户偏好与主题数据分离，便于独立更新
- `timestamp` 可做后台校验（API 返回 `lastModified`，客户端对比后刷新）

**FOUC 防御流程：**
```
HTML 解析 → <head> 内联脚本读取 localStorage
  → 恢复 useWorldTheme + themeMode + 缓存的 CSS 变量
  → setProperty 立即应用到 :root
  → React hydrate → ThemeProvider 挂载
  → 后台 fetch API 刷新 themeData（如果有更新则覆盖）
```

### D3: API 设计 — 独立的 `/worldviews/[id]/theme`

**决策：** 单独端点，不合并到现有 `/worldviews` 或 `/worldviews/[id]/mechanics`。

**理由：**
- 主题数据独立于 mechanics，职责清晰
- 用户每次进入游戏都需要主题数据，单独端点便于缓存策略
- 载荷小（~1KB），适合高频请求

**API 设计：**
```
GET /api/v1/worldviews/[id]/theme

Response 200:
{
  "worldviewId": "tech",
  "displayName": "科技世界",
  "lightTheme": {
    "--primary": "oklch(0.50 0.13 245)",
    "--background": "oklch(0.96 0.005 250)",
    ...
  },
  "darkTheme": {
    "--primary": "oklch(0.68 0.12 245)",
    "--background": "oklch(0.16 0.01 245)",
    ...
  }
}

Response 404:
{ "error": "世界观 'xxx' 未配置主题" }
```

### D4: themeConfig 数据结构

**决策：** 最小化字段，只覆盖关键语义变量。

```typescript
// WorldviewDefinition 新增
themeConfig: {
  light: Record<string, string>;  // "--primary": "oklch(...)"
  dark: Record<string, string>;
}
```

覆盖约 15 个变量：`--background`、`--foreground`、`--card`、`--card-foreground`、`--popover`、`--popover-foreground`、`--primary`、`--primary-foreground`、`--secondary`、`--secondary-foreground`、`--muted`、`--muted-foreground`、`--accent`、`--accent-foreground`、`--border`、`--input`、`--ring`

### D5: 内联脚本 — 防 FOUC 的最小脚本

**决策：** 在 `app/layout.tsx` 的 `<head>` 中插入一个短小的 `<script>`（非 `dangerouslySetInnerHTML`，使用 Next.js `Script` 组件 `strategy="beforeInteractive"`），同步读取 localStorage 并应用缓存的 CSS 变量。

**备选方案（已拒绝）：** 使用 `next/script` 的 `beforeInteractive`。拒绝理由：需要在 React 水合之前执行，`beforeInteractive` 不保证在所有情况下都领先于 CSS 解析。改用原始 `<script>` 标签放在 `<head>` 最顶部。

### D6: 主题切换触发时机

**决策：** 在 `ThemeProvider` 挂载时 + 世界切换事件时 + 用户手动切换时应用主题。

流程：
```
useEffect (mount) → 读 localStorage 偏好 + 缓存
                  → if (useWorldTheme && cache) 立即应用缓存
                  → 后台 fetch /api/v1/worldviews/[id]/theme
                  → 更新缓存 + 重新应用

subscribeThemeEvents (world_changed) → 同上流程

用户点击设置面板 → 即时切换 + 写 localStorage
```

## Risks / Trade-offs

- **[风险] 首次访问无缓存 → 短暂 FOUC** → 缓解：默认主题作为 fallback 本就可用；世界主题 API 响应 < 200ms，FOUC 窗口很小
- **[风险] `setProperty` 性能** → ~15 个变量设置是一次性的同步操作，无性能问题；不在动画循环中
- **[风险] 前端与后端主题数据不一致** → 缓存带 `timestamp`，后台刷新时对比；用户几乎感知不到差异
- **[权衡] 删除了 theme.css 的 8 个 [data-world] 块** → 回滚时需要恢复 CSS，但数据已全部迁入 worldview JSON，不会丢失
- **[权衡] 内联脚本增加首屏尺寸** → 脚本约 300 bytes（压缩后 ~150 bytes），远小于被移除的 CSS 选择器块（约 2KB），净减少

## Open Questions

1. **`themeConfig` 是否应设为必填？** 所有 8 个内置世界观都有主题数据，Mod 世界观建议有（否则退化为默认主题）。建议：可选字段，无值时 API 返回 404 或空对象，前端退化为默认主题。
2. **是否需要 Admin/开发者界面编辑主题？** 非本期范围，Mod 作者在 JSON 中手动编辑即可。
