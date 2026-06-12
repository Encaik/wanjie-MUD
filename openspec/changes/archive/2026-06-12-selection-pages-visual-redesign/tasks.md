## 1. 动画系统扩展

- [x] 1.1 在 `app/styles/animations.css` 中新增 `star-twinkle` 关键帧（不规则明灭：opacity 0.2→0.8→0.2→0.6，scale 1→1.3→0.8→1.1）
- [x] 1.2 在 `app/styles/animations.css` 中新增 `gold-glow` 关键帧（box-shadow 从 15px 到 30px 再到 15px）
- [x] 1.3 在 `app/styles/animations.css` 中新增 `constellation-fade` 关键帧（opacity 0→1）
- [x] 1.4 在 `app/styles/animations.css` 中新增 `spirit-rise` 关键帧（translateY 0→-40px + opacity 0.8→0）
- [x] 1.5 在 `app/styles/base.css` 的 `@layer utilities` 中新增对应的 `.animate-star-twinkle`、`.animate-gold-glow`、`.animate-constellation-fade`、`.animate-spirit-rise` 工具类

## 2. MysticalBackground 共享背景组件

- [x] 2.1 创建 `src/shared/components/MysticalBackground.tsx`（≤300 行），支持 `variant` prop（`runes` | `stars` | `destiny`）和 `intensity` prop（`subtle` | `full`）
- [x] 2.2 实现 runes 变体：8 个浮动汉字符文 + 8 个光点粒子 + 中央柔光团 + 旋转光晕环 + 水印大字（复用 StartScreen 现有逻辑）
- [x] 2.3 实现 stars 变体：60-80 个星点粒子（1-4px 随机，金色/琥珀为主）+ 8-12 条星座连线（SVG line 元素，opacity 0.15-0.3）+ 水印"万象"
- [x] 2.4 实现 destiny 变体：80-100 个金色光点粒子（密度高于 stars）+ 隐约命运之线（更细更密）+ 水印"命运"
- [x] 2.5 实现粒子位置/属性的种子确定性生成（不依赖 Math.random，用 seed 派生）
- [x] 2.6 实现 `prefers-reduced-motion` 降级（所有动画停止，粒子仍显示）
- [x] 2.7 更新 `src/shared/components/index.ts` 导出 MysticalBackground
- [x] 2.8 编写 `MysticalBackground.test.tsx`（渲染测试、variant 切换测试）

## 3. 世界选择页重构

- [x] 3.1 创建 `src/views/world-select/WorldCard.tsx`（≤300 行），包含四角隅饰、世界图标锚点（3rem）、印章 Badge、装饰分隔线、金边辉光 hover
- [x] 3.2 实现 WorldCard 的四角装饰（CSS pseudo-element 几何形）
- [x] 3.3 实现 WorldCard 的印章风格 Badge（双线 border + rotate -2deg + serif 字体）用于难度/类型/新手/挑战标记
- [x] 3.4 实现 WorldCard hover 效果：金边辉光（gold-glow）+ translateY(-4px) + 背景渐变增亮
- [x] 3.5 重构 `src/views/world-select/WorldSelect.tsx`：引入 MysticalBackground（stars）、4 列×2 行 grid 布局、简化标题装饰、使用 WorldCard
- [x] 3.6 更新 `src/views/world-select/index.ts` 导出 WorldCard

## 4. 人物选择页重构

- [x] 4.1 创建 `src/views/character-select/CharacterCard.tsx`（≤300 行），包含命星之镜、经脉图属性条、印章天赋徽章、核心值展示、选定按钮
- [x] 4.2 实现命星之镜（DestinyMirror）：圆形铜镜质感渐变 + 金色边框 + 性别/种族图标居中 + hover 时 gold-glow 动画
- [x] 4.3 实现经脉图属性条：h-2 高度 + `bg-gradient-to-r from-amber-400 to-amber-100` 填充 + 高属性值金色文字
- [x] 4.4 实现印章风格天赋徽章（双线 border + rotate + serif + 稀有度色）
- [x] 4.5 重构 `src/views/character-select/CharacterSelect.tsx`：引入 MysticalBackground（destiny）、使用 CharacterCard、简化标题
- [x] 4.6 重构 `src/views/character-select/WorldInfoBar.tsx`：增加装饰隅角 + 金线分隔 + 叙事化返回文案（"← 返回星盘"）+ 世界信息（难度星级、类型）
- [x] 4.7 更新 `src/views/character-select/index.ts` 导出 CharacterCard

## 5. 首页集成与统一

- [x] 5.1 重构 `src/views/home/StartScreen.tsx`，使用 MysticalBackground（runes variant）替代内联背景系统
- [x] 5.2 确保 StartScreen 视觉效果与重构前一致（回归检查）

## 6. 验证与收尾

- [x] 6.1 运行 `pnpm ts-check` 确保类型正确
- [x] 6.2 运行 `pnpm lint:strict` 确保 ESLint + 文件大小检查通过
- [x] 6.3 运行 `pnpm test` 确保现有测试通过
- [x] 6.4 运行 `pnpm build` 确保构建成功
- [x] 6.5 手动验证：首页 → 世界选择 → 人物选择三页视觉连贯性
- [x] 6.6 手动验证：桌面端 4 列布局 + hover 效果 + 移动端降级
- [x] 6.7 手动验证：暗色/亮色主题下的可读性
