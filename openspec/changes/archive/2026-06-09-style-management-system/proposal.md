## Why

当前 `globals.css` 已达 385 行，将 Tailwind 主题配置、CSS 变量、关键帧动画、工具类全部塞入单文件，缺乏分层架构。同时，UI 组件库与游戏世界之间缺乏样式绑定机制——无法根据当前世界切换视觉主题，Mod 系统也不支持注入样式。随着 8 种世界类型的差异化需求增长，必须建立一套可扩展、可组合的样式管理体系。

## What Changes

- **拆分 globals.css** 为分层 CSS 文件：设计令牌层（tokens）、主题层（themes）、动画层（animations）、基础样式层（base），每个文件职责单一
- **新增 `modules/theme/` 模块**：管理主题状态、世界→主题映射、运行时主题切换
- **新增世界主题映射**：每种世界类型绑定独立主题（CSS 变量集合），切换世界时自动切换主题
- **扩展 Mod 系统支持样式注入**：`ModContentType` 新增 `'styles'` 类型，Mod 可提供 CSS 文件覆盖或扩展主题变量
- **新增 `StyleLoader` 基础设施**：管理 CSS 文件动态加载、优先级、卸载，支持 Mod 注入的样式层叠
- **统一稀有度/品质色映射**：消除 `rarityUtils.ts`（硬编码 Tailwind 色）与 `rarityStyles.ts`（quality-* 变量）的重复定义，以 quality-* 为唯一来源
- **消除组件中的硬编码颜色类**：逐步替换 `bg-amber-*`、`text-red-*` 等原生 Tailwind 色盘为语义化 Token

## Capabilities

### New Capabilities

- `style-tokens`: 设计令牌分层管理——将 `globals.css` 拆分为 tokens.css（CSS 变量定义）、themes.css（主题集合）、animations.css（关键帧）、base.css（全局基础样式），每个文件独立可被覆盖
- `world-theming`: 世界→主题绑定系统——定义 8 种世界的独立主题（修仙/高武/科技/魔幻/异能/仙侠/武侠/末世），运行时根据当前世界自动切换 CSS 变量集合
- `mod-styles`: Mod 样式注入——扩展 `ModContentType` 支持 `'styles'`，Mod 清单可声明提供的样式文件，StyleLoader 按依赖顺序加载并合并
- `style-loader`: 样式加载引擎——管理 CSS 文件的动态注入、优先级排序（基础 < 世界主题 < Mod 覆盖）、热切换（无刷新切换主题）、卸载与回退

### Modified Capabilities

<!-- No existing spec requirements are changed; this is a new system. -->

## Impact

- **文件变更**：`src/app/globals.css` → 拆分为 4+ 文件（`src/app/styles/` 目录）；新增 `src/modules/theme/` 模块目录；修改 `src/shared/lib/mod/ModManifest.ts` 添加 `'styles'` 内容类型
- **依赖关系**：`modules/theme/` 依赖 `shared/lib/mod/`（ModLoader）、`shared/lib/events/`（事件总线）
- **运行时影响**：主题切换通过 CSS 变量变更实现，无 JS 重渲染开销；Mod 样式通过 `<link>` 或 `<style>` 标签动态注入
- **数据迁移**：`rarityUtils.ts` 中的硬编码颜色常量需要迁移到 quality-* 变量体系；组件中的硬编码色盘类名需要批量替换为语义化类名
- **无破坏性变更**：现有 CSS 变量名保持不变，主题切换仅影响变量值；旧 globals.css 通过 `@import` 拆分文件保持向后兼容
