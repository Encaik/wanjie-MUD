## Context

当前项目的样式管理存在以下问题：

1. **单文件臃肿**：`src/app/globals.css`（385 行）混合了 Tailwind 主题令牌、CSS 变量定义（亮色/暗色）、关键帧动画、工具类、全局基础样式——五种不同职责的内容毫无分层
2. **无法切换世界主题**：8 种世界类型（修仙、高武、科技、魔幻、异能、仙侠、武侠、末世）共用同一套暖棕色主题，无法通过视觉区分当前所处世界
3. **Mod 不支持样式注入**：`ModContentType` 包含 world/traits/items 等游戏数据，但缺少 `'styles'` 类型——第三方 Mod 无法提供自定义主题或覆盖组件样式
4. **组件中硬编码颜色**：许多组件仍使用 `text-amber-500`、`bg-red-100` 等 Tailwind 原生色盘类名，而非全局语义化 CSS 变量
5. **品质色映射重复**：`rarityUtils.ts`（硬编码 Tailwind 类）和 `rarityStyles.ts`（quality-* 变量）维护了两套不一致的映射

### 约束条件

- **Tailwind v4 + PostCSS**：不使用 Tailwind v3 的 `tailwind.config.ts`，所有主题配置通过 CSS `@theme inline` 完成
- **Static Export**：项目使用 `next.config.ts` 的 `output: 'export'`，不能依赖服务端运行时 CSS 生成
- **四层架构**：新增代码必须放入 `modules/theme/` 或 `shared/` 中，不能污染 `app/`（仅路由）、`views/`（仅页面组合）
- **现有 CSS 变量名不变**：`--background`、`--primary`、`--quality-*` 等语义 Token 名称保持稳定，只改变它们的值和来源

## Goals / Non-Goals

**Goals:**

1. 将 `globals.css` 拆分为 4 个独立 CSS 文件：`tokens.css`（设计令牌声明）、`themes.css`（亮色/暗色/世界主题变量值）、`animations.css`（关键帧）、`base.css`（全局基础样式 + 工具类）
2. 建立世界→主题绑定系统，切换世界时自动切换 CSS 变量集合，无需刷新页面
3. 扩展 Mod 系统，支持 Mod 声明和注入样式文件（CSS 变量覆盖 + 新动画 + 新工具类）
4. 统一稀有度/品质色映射，消除 `rarityUtils.ts` 与 `rarityStyles.ts` 的重复
5. 建立主题状态管理（`modules/theme/`），通过 React Context 驱动运行时主题切换

**Non-Goals:**

- 不实现可视化主题编辑器（那是后续功能）
- 不改变 Tailwind v4 的 `@theme inline` 机制——仍通过 CSS 变量桥接
- 不迁移所有组件中的硬编码颜色（本次只建立基础设施和规范，批量替换在后续专项变更中进行）
- 不实现 CSS-in-JS 运行时（保持零 JS 运行时开销的 CSS 变量方案）

## Decisions

### 决策 1：CSS 文件拆分策略 → 按职责分 4 层

**选择**：拆分为 `tokens.css` / `themes.css` / `animations.css` / `base.css`，通过 `globals.css` 的 `@import` 聚合

**文件结构**：
```
src/app/styles/
├── tokens.css       # @theme inline 声明（色板映射）
├── themes.css       # :root / .dark / [data-world="xxx"] 的 CSS 变量值
├── animations.css   # @keyframes 定义
├── base.css         # @layer base 全局样式 + @layer utilities 工具类
└── index.css        # 聚合入口：@import 以上 4 个文件
```

**globals.css 简化为**：
```css
@import './styles/index.css';
```

**替代方案**：
- ❌ 保持单文件 + 注释分区：无法解决"谁覆盖谁"的优先级问题，Mod 注入时无法单独替换某一层
- ❌ 每个世界一个 CSS 文件：8 个世界 × 2 种模式（亮色/暗色）= 16 个文件，维护成本极高，且 90% 变量值相同

### 决策 2：世界主题切换机制 → `data-world` 属性 + CSS 属性选择器

**选择**：在 `<html>` 上设置 `data-world="cultivation"` 属性，各世界主题通过 `[data-world="cultivation"]` 选择器定义不同的 CSS 变量值

**CSS 优先级链**（从低到高）：
```
:root                          ← 默认值（米色暖调，作为无世界时的回退）
.dark                          ← 暗色模式覆盖
[data-world="cultivation"]     ← 世界主题覆盖
[data-world="cultivation"].dark ← 世界暗色模式（最高优先级）
```

**示例**：
```css
/* themes.css */
[data-world="cultivation"] {
  --primary: oklch(0.50 0.10 60);    /* 琥珀棕——修仙 */
}
[data-world="tech"] {
  --primary: oklch(0.55 0.15 240);   /* 科技蓝——科技 */
}
[data-world="magic"] {
  --primary: oklch(0.60 0.20 300);   /* 魔法紫——魔幻 */
}
```

**切换触发**：`modules/theme/` 监听游戏状态中的 `worldType` 变化，调用 `document.documentElement.setAttribute('data-world', worldType)`

**替代方案**：
- ❌ 动态注入 `<style>` 标签：每次切换需要清理旧标签 + 创建新标签，DOM 操作更重
- ❌ CSS `@layer` 级联：Tailwind v4 已经大量使用 `@layer`，再加自定义层容易冲突，且动态切换需要重建样式表
- ❌ CSS 自定义属性直接 JS 赋值：需要逐个变量设置（30+ 个），不如属性选择器一次性切换

### 决策 3：Mod 样式注入机制 → 扩展 ModContentType + StyleLoader

**选择**：在 `ModContentType` 中新增 `'styles'` 类型，Mod 在 `dataFiles` 中声明 CSS 文件路径，`StyleLoader` 按依赖顺序注入为 `<style>` 标签

**Mod 清单扩展**（`mod.json` 示例）：
```json
{
  "id": "dark-cultivation-theme",
  "name": "暗黑修仙主题",
  "contentTypes": ["styles"],
  "dataFiles": {
    "styles": "styles/theme.css"
  }
}
```

**StyleLoader 职责**：
- 加载 Mod 提供的 CSS 文件（fetch 文本内容）
- 创建 `<style data-mod="<modId>" data-priority="<priority>">` 标签注入 `<head>`
- 按优先级排序：`基础 < 世界主题 < Mod（按依赖顺序）`
- Mod 卸载时移除对应 `<style>` 标签
- Mod 加载失败时不影响全局样式（隔离错误边界）

**优先级层**：
```
0 — 基础 (tokens.css, base.css)         ← 始终存在
1 — 主题 (:root, .dark)                  ← 始终存在
2 — 世界主题 ([data-world])              ← 运行时切换
3 — Mod 覆盖 (Mod A)                     ← 依赖顺序
4 — Mod 覆盖 (Mod B 依赖 A)             ← 高优先级
```

**替代方案**：
- ❌ Mod 通过 `<link>` 标签引入：需要 Mod 提供编译好的 CSS 文件 URL，与 Static Export 不兼容
- ❌ Mod 通过 JS 对象声明变量值：灵活但限制了 Mod 作者只能覆盖变量，不能添加新动画或工具类

### 决策 4：主题状态管理 → `modules/theme/` 模块

**选择**：将主题管理作为独立模块 `modules/theme/`，放在四层架构的功能模块层

**模块结构**：
```
modules/theme/
├── index.ts            # 桶导出
├── types.ts            # ThemeConfig, WorldTheme, ThemeMode 类型
├── state.ts            # 主题状态 slice
├── events.ts           # 监听世界切换事件 → 触发主题切换
├── logic/
│   ├── index.ts
│   ├── themeResolver.ts    # 世界类型 → 主题配置映射
│   └── styleLoader.ts      # 动态 CSS 标签管理
├── hooks/
│   ├── index.ts
│   └── useTheme.ts         # React Hook：当前主题、切换函数
├── components/
│   └── ThemeProvider.tsx    # 主题 Context Provider（在 app/layout 中使用）
└── data/
    ├── index.ts
    ├── worldThemes.ts      # 8 种世界的主题变量配置
    └── defaultTheme.ts     # 默认主题变量值（当前 globals.css 中的值）
```

**主题切换流程**：
```
1. 游戏状态 worldType 变化
2. WorldSelectPanel 触发事件 { type: 'WorldChanged', payload: { worldType } }
3. modules/theme/events.ts 监听事件
4. themeResolver 查找对应 ThemeConfig
5. document.documentElement.setAttribute('data-world', worldType)
6. CSS 级联自动应用新变量 → 所有组件即时重绘
```

**替代方案**：
- ❌ 放在 `shared/lib/` 中：主题管理包含游戏特定的世界映射逻辑，属于业务模块而非公共代码
- ❌ 放在 `views/` 中：主题状态是全局的，不应限于某一页面

### 决策 5：品质色映射统一 → 以 `quality-*` 变量为唯一来源

**选择**：`rarityUtils.ts` 中的硬编码 Tailwind 色盘类名（`text-gray-500`、`text-blue-500` 等）替换为 quality-* 语义变量（`text-quality-poor`、`text-quality-uncommon` 等）；删除 `rarityUtils.ts` 中与 `rarityStyles.ts` 重复的映射常量

**映射关系**：
| RarityUtils 旧值 | 正确映射 | 原因 |
|---|---|---|
| `text-gray-500` (普通) | `text-quality-poor` | 普通 → 灰色系(poor) |
| `text-blue-500` (稀有) | `text-quality-uncommon` | 稀有 → 蓝色系(uncommon) |
| `text-purple-500` (史诗) | `text-quality-rare` | 史诗 → 紫色系(rare) |
| `text-yellow-500` (传说) | `text-quality-epic` | 传说 → 黄色系(epic) |
| `text-red-500` (神话) | `text-quality-legendary` | 神话 → 橙色系(legendary) |

**注意**：`rarityUtils.ts` 的 `ItemRarity` 只有 5 级（普通/稀有/史诗/传说/神话），而 quality-* 系统有 8 级。后续可考虑扩展 `ItemRarity` 以对齐 8 级体系，但不在本次变更范围内。

### 决策 6：动画管理 → 独立文件 + 命名约定

**选择**：所有 `@keyframes` 定义集中在 `animations.css`，对应的工具类在 `base.css` 的 `@layer utilities` 中

**Mod 可注入新动画**：Mod 的 CSS 文件中可以定义新的 `@keyframes`，通过 `StyleLoader` 注入

**替代方案**：
- ❌ 在组件中通过 JS 动态注入 `<style>`（如 `AnnouncementToast` 的做法）：分散管理，难以追踪，容易内存泄漏

## Risks / Trade-offs

**[风险] 世界主题过多导致 CSS 变量爆炸** → 每个世界只覆盖差异化的 8~12 个关键变量（primary、background、border、accent 等），其余保持默认值；世界主题配置集中在 `worldThemes.ts` 单一文件中，便于审查规模

**[风险] Tailwind v4 `@theme inline` 无法动态修改** → `@theme inline` 声明的是令牌名称（如 `--color-primary: var(--primary)`），实际颜色值由 CSS 变量决定；我们只改变变量的值，不改变令牌声明，因此不受此限制

**[风险] Mod 样式冲突** → StyleLoader 使用 `data-mod` 属性标记每个注入的样式，卸载/更新时精确移除；依赖顺序加载确保后加载的 Mod 优先级更高

**[风险] Static Export 下无法服务端生成 CSS** → 所有 CSS 在构建时已生成（`tokens.css`、`themes.css` 等），Mod 样式通过 fetch + `<style>` 注入，不需要服务端运行时

**[权衡] 主题切换时会有 FOUT（无样式闪烁）** → 在 `<html>` 上预设 `data-world` 属性（服务端渲染或初始化脚本设置），React hydration 前即应用正确主题；Mod 样式由于 fetch 延迟无法避免闪烁，但 Mod 样式通常是增量覆盖而非基础主题

## Migration Plan

### 阶段 1：文件拆分（无行为变更）
1. 在 `src/app/styles/` 创建 4 个 CSS 文件 + 1 个聚合入口
2. 将 `globals.css` 内容按职责搬入对应文件，保持原有变量名和值不变
3. 修改 `globals.css` 为纯 `@import` 聚合入口
4. 验证：`pnpm build` 成功，视觉完全不变

### 阶段 2：模块与基础设施
1. 创建 `modules/theme/` 模块（types, state, logic, hooks, components, data）
2. 在 `app/layout.tsx` 中接入 `ThemeProvider`
3. 实现 `StyleLoader` 和 Mod 样式注入能力
4. 扩展 `ModContentType` 添加 `'styles'`

### 阶段 3：世界主题数据
1. 为 8 种世界设计差异化主题变量（每种世界覆盖 8~12 个关键变量）
2. 写入 `worldThemes.ts`
3. 在 `themes.css` 中添加 `[data-world="xxx"]` 选择器

### 阶段 4：统一与清理
1. 迁移 `rarityUtils.ts` 硬编码颜色为 quality-* 变量
2. 清理 `AnnouncementToast` 等组件中的动态 `<style>` 注入，改为使用 `animations.css` 中的定义
3. 将 `RARITY_STYLES` 从 `shared/utils/rarityStyles.ts` 迁移到 `modules/theme/data/` 中（它现在是品质色的唯一来源）

### 回滚策略
- 每个阶段独立提交，出问题时 `git revert` 单个提交即可
- 阶段 1 纯拆分，出问题直接还原 `globals.css` 即可
- 如果阶段 2~4 出现问题，CSS 变量名未变，降级为无世界主题模式（不设置 `data-world` 属性即可）

## Open Questions

1. **世界主题差异化程度**：8 种世界各需差异化哪些变量？先做 primary/accent/border/background 4 个核心变量，后续根据体验反馈扩展
2. **Mod CSS 文件格式**：Mod 是提供纯 CSS 还是提供 JSON 变量映射？建议先支持纯 CSS（灵活性最高），后续按需增加 JSON 映射模式
3. **主题持久化**：用户手动选择的主题（亮色/暗色/跟世界）是否需要持久化到 localStorage？建议后续迭代中处理
