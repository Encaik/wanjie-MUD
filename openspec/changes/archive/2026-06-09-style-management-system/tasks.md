## 1. CSS 文件拆分 — 将 globals.css 拆分为 4 层

- [x] 1.1 创建 `src/app/styles/` 目录，建立 `tokens.css`（`@theme inline` 声明块，从 `globals.css` 搬入）
- [x] 1.2 创建 `src/app/styles/themes.css`（`:root` 和 `.dark` 的 CSS 变量值，从 `globals.css` 搬入）
- [x] 1.3 创建 `src/app/styles/animations.css`（所有 `@keyframes` 定义，从 `globals.css` 搬入；同时将 `AnnouncementToast` 中动态注入的 `shrink`/`glow` 关键帧搬入此处）
- [x] 1.4 创建 `src/app/styles/base.css`（`@layer base` 全局样式 + `@layer utilities` 动画工具类，从 `globals.css` 搬入）
- [x] 1.5 创建 `src/app/styles/index.css` 聚合入口（`@import` 以上 4 个文件），修改 `globals.css` 为单行 `@import './styles/index.css'`
- [x] 1.6 运行 `pnpm build` 和 `pnpm dev` 验证拆分后构建成功、视觉效果完全不变

## 2. 主题模块基础设施 — 创建 `modules/theme/`

- [x] 2.1 创建 `modules/theme/types.ts`（定义 `WorldTheme`、`ThemeMode`、`ThemeConfig` 等类型）
- [x] 2.2 创建 `modules/theme/data/defaultTheme.ts`（将当前 `:root` 和 `.dark` 变量值导出为 typed 常量）
- [x] 2.3 创建 `modules/theme/state.ts`（主题状态 slice：`worldType`、`themeMode`、`activeThemeId`）
- [x] 2.4 创建 `modules/theme/events.ts`（监听 `WorldChanged` 事件 → 触发主题切换）
- [x] 2.5 创建 `modules/theme/logic/themeResolver.ts`（世界类型 → 主题配置映射的纯函数）
- [x] 2.6 创建 `modules/theme/hooks/useTheme.ts`（React Hook：读取当前主题状态 + 手动切换函数）
- [x] 2.7 创建 `modules/theme/components/ThemeProvider.tsx`（设置 `data-world` / `data-theme` 属性 + Context Provider）
- [x] 2.8 更新 `modules/theme/index.ts` 桶导出
- [x] 2.9 在 `app/layout.tsx` 中接入 `ThemeProvider`，包裹 children

## 3. StyleLoader 引擎 — 动态样式注入管理

- [x] 3.1 创建 `modules/theme/logic/styleLoader.ts`（单例类：注入/追踪/移除 `<style>` 标签、优先级排序、SSR 安全守卫）
- [x] 3.2 实现 `injectModStyles(modId, cssContent, priority)` 方法：创建 `<style data-mod>` 标签注入 `<head>`
- [x] 3.3 实现 `removeModStyles(modId)` 方法：按 `data-mod` 属性移除指定标签
- [x] 3.4 实现事件钩子：`onStylesLoaded`、`onStylesUnloaded`、`onStylesError` 回调注册与触发
- [x] 3.5 实现 SSR 安全守卫：`typeof document === 'undefined'` 时所有 DOM 操作 no-op
- [x] 3.6 编写 `styleLoader.test.ts` 单元测试（注入、移除、优先级、SSR no-op、错误隔离）

## 4. Mod 系统扩展 — 支持样式注入

- [x] 4.1 在 `ModContentType` union 中添加 `'styles'`，更新 `ALL_MOD_CONTENT_TYPES` 常量
- [x] 4.2 在 `ModLoader` 中集成 StyleLoader：Mod 加载完成后，如果 `contentTypes` 包含 `'styles'`，fetch 其 CSS 文件并通过 StyleLoader 注入
- [x] 4.3 在 Mod 卸载时调用 `StyleLoader.removeModStyles()`
- [x] 4.4 Mod CSS fetch 失败时：不阻塞其他 Mod 加载，记录警告，触发 `onStylesError`
- [x] 4.5 更新 `modules/mod/index.ts` 桶导出（如有新增导出）

## 5. 世界主题数据 — 8 种世界差异化视觉

- [x] 5.1 设计 8 种世界主题的关键变量值（每种世界覆盖 `--primary`、`--accent`、`--background`、`--foreground`、`--border`、`--ring` 等 6~10 个变量）
- [x] 5.2 创建 `modules/theme/data/worldThemes.ts`，定义 8 种世界的主题配置（包含亮色 + 暗色两套值）
- [x] 5.3 在 `src/app/styles/themes.css` 中添加 `[data-world="cultivation"]`、`[data-world="tech"]` 等 8 个选择器及其变量值（从 `worldThemes.ts` 的数据生成，或手动同步）
- [x] 5.4 验证：在浏览器 DevTools 中手动切换 `data-world` 属性，确认各世界主题颜色正确生效

## 6. 稀有度样式统一 — 消除重复映射

- [x] 6.1 将 `shared/utils/rarityStyles.ts` 的 `RARITY_STYLES` 和 `getRarityStyle` 迁移到 `modules/theme/data/rarityStyles.ts`（作为品质色的唯一来源）
- [x] 6.2 在旧路径保留 barrel re-export（`export * from '@/modules/theme/data/rarityStyles'`），避免破坏现有导入
- [x] 6.3 迁移 `modules/equipment/logic/rarityUtils.ts`：将硬编码 Tailwind 色盘类名（`text-gray-500`、`text-blue-500` 等）替换为 quality-* 语义变量，与 quality 8 级体系统一
- [x] 6.4 迁移 `modules/equipment/logic/rarityUtils.ts`：将 `RARITY_BADGE_STYLES` 中的硬编码色替换为 quality-* 语义变量
- [x] 6.5 运行 `pnpm ts-check` + `pnpm build` 验证无类型错误

## 7. 组件清理 — 消除动态 style 注入和硬编码颜色

- [x] 7.1 清理 `AnnouncementToast`：删除 `document.createElement('style')` 动态注入代码，改用 `animations.css` 中的 `shrink`/`glow` 关键帧
- [x] 7.2 审计 `src/shared/ui/` 中所有组件，确认无硬编码 Tailwind 原生色盘类名（`bg-amber-*`、`text-red-*` 等）
- [x] 7.3 运行 `pnpm lint:strict` + `pnpm test` 验证所有质量门禁通过

## 8. 验证与文档

- [x] 8.1 完整流程测试：启动应用 → 进入不同世界 → 验证主题自动切换 → 切换亮色/暗色模式 → 验证叠加效果
- [x] 8.2 Mod 样式注入测试：创建一个包含 `styles` 类型的测试 Mod，验证样式注入、优先级、卸载功能
- [x] 8.3 运行 `pnpm build` 确认 Static Export 构建成功
- [x] 8.4 运行 `pnpm check-sizes` 确认新文件不超标
