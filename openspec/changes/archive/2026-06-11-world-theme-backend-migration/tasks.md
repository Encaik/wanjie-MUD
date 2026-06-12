## 1. 后端基础 — 类型 + API

- [x] 1.1 `WorldviewDefinition` 接口新增 `themeConfig?: { light: Record<string, string>; dark: Record<string, string> }` 字段（`src/core/registry/WorldViewRegistry.ts`）
- [x] 1.2 新建 `GET /api/v1/worldviews/[id]/theme/route.ts`，从 `WorldViewRegistry` 读取 `themeConfig` 并返回；无配置时返回 404
- [x] 1.3 在 `app/api/init.ts` 中确认世界系统初始化时 themeConfig 随 worldview JSON 自动加载
- [x] 1.4 运行 `pnpm ts-check` 确保类型正确

## 2. 数据迁移 — 8 个世界观补 themeConfig

- [x] 2.1 创建 `modules/theme/data/themeConfigTemplate.ts`，从 `DEFAULT_LIGHT_THEME` / `DEFAULT_DARK_THEME` 导出完整变量名列表（作为迁移模板参照）
- [x] 2.2 修仙 (cultivation) worldview JSON 补 `themeConfig`（值从 `worldThemes.ts` 迁移，扩展至完整变量集）
- [x] 2.3 高武 (martial) worldview JSON 补 `themeConfig`
- [x] 2.4 科技 (tech) worldview JSON 补 `themeConfig`
- [x] 2.5 魔幻 (magic) worldview JSON 补 `themeConfig`
- [x] 2.6 异能 (esper) worldview JSON 补 `themeConfig`
- [x] 2.7 仙侠 (immortal) worldview JSON 补 `themeConfig`
- [x] 2.8 武侠 (wuxia) worldview JSON 补 `themeConfig`
- [x] 2.9 末世 (apocalypse) worldview JSON 补 `themeConfig`
- [ ] 2.10 验证：启动 dev server，访问 `/api/v1/worldviews/cultivation/theme`，返回完整 themeConfig

## 3. 前端模块重构 — types + state + hooks

- [x] 3.1 更新 `modules/theme/types.ts`：`ThemeSlice` 新增 `useWorldTheme`、`worldThemeData`、`themeLoading` 字段；新增 `WorldThemeData` 接口
- [x] 3.2 更新 `modules/theme/state.ts`：`createInitialThemeState` 适配新字段
- [x] 3.3 更新 `modules/theme/hooks/useTheme.ts`：Context value 新增 `setUseWorldTheme` 方法
- [x] 3.4 新建 `modules/theme/hooks/useThemeSettings.ts`：从 localStorage 读写 `theme_prefs`；提供 `setThemeMode`、`setUseWorldTheme`、`fetchWorldTheme(worldviewId)` 方法
- [x] 3.5 更新 `modules/theme/index.ts` 桶文件：导出新类型、新 hook
- [x] 3.6 删除 `modules/theme/data/worldThemes.ts`（确认所有导入已迁移）
- [x] 3.7 更新所有引用 `worldThemes.ts` / `worldThemeMap` 的文件，改为从新 hook 获取

## 4. 主题注入 — ThemeProvider 改造

- [x] 4.1 更新 `ThemeProvider`：挂载时读 localStorage 缓存 → 立即应用；后台 fetch API 刷新
- [x] 4.2 实现 `applyThemeVariables(vars: Record<string, string>)`：遍历调用 `setProperty`
- [x] 4.3 实现 `removeThemeVariables(varNames: string[])`：遍历调用 `removeProperty`
- [x] 4.4 实现 `useEffect` 响应 `useWorldTheme` + `isDark` + `worldThemeData` 变化，自动 apply/remove
- [x] 4.5 添加 SSR 守卫（`typeof document === 'undefined'` 检查）
- [x] 4.6 更新 `modules/theme/events.ts`：世界切换事件处理改为调用 `fetchWorldTheme` + 更新 `worldThemeData`

## 5. 用户偏好 + 设置页面

- [x] 5.1 实现 localStorage `theme_prefs` 读写逻辑（`themeMode` + `useWorldTheme`）
- [x] 5.2 创建 `views/game/ThemeSettingsPanel.tsx`：外观模式三选一 + 配色来源二选一 + 色块预览
- [x] 5.3 集成到游戏设置页面（如尚不存在设置页则新建 `views/game/settings/` 目录）
- [x] 5.4 内联 `<head>` 脚本：在 `app/layout.tsx` 中插入小脚本，同步读 localStorage 恢复主题（防 FOUC）

## 6. CSS 清理

- [x] 6.1 删除 `themes.css` 中全部 8 个 `[data-world]` 选择器块（保留 `:root` + `.dark` + `@custom-variant dark`）
- [x] 6.2 确认 `tokens.css` 无需变更（CSS 变量桥接不变）
- [x] 6.3 确认 `globals.css` / `index.css` 导入顺序正确

## 7. 集成验证

- [x] 7.1 清理所有来自 `worldThemes.ts` 的死导入（`grep "worldThemes" src/` 确认零引用）
- [x] 7.2 运行 `pnpm ts-check` 确认零类型错误
- [x] 7.3 运行 `pnpm build` 确认静态导出成功
- [x] 7.4 运行 `pnpm test` 确认无回归（181 tests, 14 files all passing）
- [ ] 7.5 手动验证：选科技世界 → 确认蓝色主题 → 切换暗色 → 确认暗色科技蓝 → 关闭世界主题 → 确认回退默认 → 刷新页面 → 确认无闪烁
