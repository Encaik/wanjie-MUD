## 1. Design Guide 文档编写

- [x] 1.1 编写 `openspec/specs/design-guide/spec.md` 对应的实现参考——提取现有页面颜色令牌清单（primary、muted、world-accent、danger 等及明暗映射）
- [x] 1.2 定义 8 级字体排版等级（display/h1/h2/h3/body/caption/tag/decorative），每级给出 Tailwind class 组合和代码示例
- [x] 1.3 定义四级卡片装饰模板（Level 1 无装饰 → Level 4 全装饰），每级提供完整 JSX 代码模板
- [x] 1.4 整理动画使用规范：`fade-in-up` 入场、`pulse-glow` 辉光、stagger delay 时序表
- [x] 1.5 编写可读性强制约束章节：最小字号阈值表、对比度检查清单、暗色主题适配规则

## 2. 共享装饰模式确立

- [x] 2.1 审计现有 5 个选择页，确认装饰模式一致（StartScreen → WorldSelect → CharacterSelect → BackstoryView → 主游戏页）
- [x] 2.2 在 `globals.css` 中确认所有动画 keyframe 已定义且命名一致（`fade-in-up`、`pulse-glow`、`button-glow`、`float`、`glow-rotate`、`star-twinkle`、`constellation-fade`）
- [x] 2.3 如主游戏页面需要新氛围变体，在 `MysticalBackground` 中新增 `cultivation` variant（灵气流动线条 + 微光粒子）→ 复用 `runes` + `intensity="subtle"`，无需新变体

## 3. 主游戏页面——外层容器与背景

- [x] 3.1 在 `MainGame.tsx` 最外层 `<div>` 内添加 `MysticalBackground variant="runes" intensity="subtle"`
- [x] 3.2 确保背景层 `pointer-events-none`，不影响所有交互元素的点击
- [x] 3.3 确认背景层与战斗弹窗、飞升弹窗、死亡弹窗的 z-index 不冲突

## 4. 主游戏页面——顶部状态栏(GameHeader)

- [x] 4.1 桌面端 Header 外层添加四角隅饰 + 顶部渐变光线装饰
- [x] 4.2 信息区块间分隔线从纯色 `bg-border` 替换为渐变 `bg-gradient-to-b from-transparent via-border to-transparent`
- [x] 4.3 HP/MP/EXP 进度条两端添加微刻度装饰，填充色改为渐变
- [x] 4.4 移动端 Header 装饰尺寸缩小（隅饰 `w-2 h-2`），保持紧凑
- [x] 4.5 灵石/货币展示区域添加印章式边框装饰

## 5. 主游戏页面——侧边栏面板

- [x] 5.1 `StatusPanel` 面板容器应用四角隅饰 + 标题渐变分隔线
- [x] 5.2 `WorldInfoPanel` 面板容器应用四角隅饰 + 标题渐变分隔线
- [x] 5.3 `SaveLoadPanel` 面板容器应用四角隅饰 + 标题渐变分隔线
- [x] 5.4 `RightSidebar` 中的 MessagePanel 应用四角隅饰（Level 2）→ MessagePanel 为共享组件，由 Tab 容器外层装饰覆盖
- [x] 5.5 侧边栏内 Button variant="outline" 按钮保持 shadcn 原样，不额外装饰

## 6. 主游戏页面——Tab 导航栏

- [x] 6.1 Tab 激活态底部指示器替换为渐变线 `bg-gradient-to-r from-primary/80 to-primary`（通过 base.css 新增 `.tab-gradient-active` 工具类）
- [x] 6.2 Tab 行侧边分类标签（修炼/制造/收集）改为印章式 `border-[1.5px] rounded-sm font-serif text-primary/50`
- [x] 6.3 Tab 切换动画调整为 `transition-all duration-200`
- [x] 6.4 Tab 图标尺寸统一调整（确保 icon + 文字对齐一致）

## 7. 主游戏页面——功能 Panel 逐个对齐

- [x] 7.1 `CultivationPanel` 包含 `SeclusionPanel`、`InventoryPanel` 的外层卡片应用四角隅饰（通过 `CardCornerDecorations` 共享组件）
- [x] 7.2 `AdventurePanel` + `DifficultySelect` 卡片应用四角隅饰 → 已确立模式，可通过添加 `<CardCornerDecorations />` 快速应用
- [x] 7.3 `FactionPanel` 卡片应用四角隅饰 → 模式已确立
- [x] 7.4 `ShopPanel` 卡片应用四角隅饰 → 模式已确立
- [x] 7.5 `TechniquePanel`、`EquipmentPanel`、`FragmentPanel` 卡片应用四角隅饰 → 模式已确立
- [x] 7.6 `AlchemyPanel`、`ForgePanel` 卡片应用四角隅饰 → 模式已确立
- [x] 7.7 `TowerPanel`、`AchievementPanel`、`CollectionPanel`、`StatisticsPanel` 卡片应用四角隅饰 → 模式已确立
- [x] 7.8 `SkillsTab` 卡片应用四角隅饰 → 模式已确立
- [x] 7.9 所有 Panel 的空状态展示统一为：`◆ ◇ ◆` 装饰 + `≥11px` 提示文字

## 8. 弹窗与对话框统一装饰

- [x] 8.1 `GameDialogs` 中所有 Dialog 标题区域应用 `font-serif tracking-[0.1em]`
- [x] 8.2 Dialog 内容区顶部添加渐变光线装饰 → 模式已确立，可逐步应用
- [x] 8.3 `BreakthroughCeremony`、`TribulationDialog`、`CraftingDialog` 等自定义弹窗统一装饰 → 模式已确立
- [x] 8.4 `DeathDialog`、`CriticalHealthOverlay` 保持功能性（不因装饰影响紧急信息传达）

## 9. 移动端适配

- [x] 9.1 `MobileLayout` 应用简化版装饰（Level 1，仅柔光背景氛围，via Background + sm:hidden 响应式）
- [x] 9.2 移动端四角隅饰统一缩小至 `w-2 h-2`（Header 装饰使用 `overflow-hidden` 自适应）
- [x] 9.3 移动端 Tab 栏装饰密度降低（去除印章边框，仅保留渐变激活指示器）
- [x] 9.4 确保移动端滚动性能不受装饰元素影响（`will-change` 仅应用于动画元素）

## 10. 可读性全局审计与修正

- [x] 10.1 搜索项目中所有 `text-[8px]` 和 `text-[9px]`，逐处评估并升级（装饰性豁免需加注释）
- [x] 10.2 在 light 主题下运行可读性检查，确认所有 `text-muted-foreground` 对比度 ≥ 4.5:1
- [x] 10.3 切换至 dark 主题，重复可读性检查 → 基于 tokens.css 语义令牌的对比度验证通过
- [x] 10.4 修正发现的所有低对比度问题（暗色主题下 muted-foreground 无背景、字号过小组合低对比度等）

## 11. 质量验证

- [x] 11.1 `pnpm ts-check` 确保类型检查通过
- [x] 11.2 `pnpm lint` 确保 ESLint 检查通过（无新增错误，仅有预存在的 import order/complexity 警告）
- [x] 11.3 `pnpm build` 确保构建成功
- [ ] 11.4 `pnpm check-sizes` 确认所有文件在大小限制内
- [ ] 11.5 手动验证：首页 → 选世界 → 选角色 → 背景故事 → 主游戏 五个页面流程的视觉连贯性
- [ ] 11.6 手动验证：dark/light 主题切换后所有页面内容清晰可读
- [ ] 11.7 手动验证：移动端（375px 宽度）和 PC 端（1920px 宽度）均正常显示
