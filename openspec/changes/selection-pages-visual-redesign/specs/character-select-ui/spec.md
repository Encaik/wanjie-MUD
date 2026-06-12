# character-select-ui

人物选择界面视觉增强——增加命星之镜、经脉图属性条、印章风天赋徽章等东方古典装饰元素。

## MODIFIED Requirements

### Requirement: 顶部世界信息条

角色选择页顶部 SHALL 展示当前已选世界的信息条，包含世界名称、类型图标、世界难度/类型信息，使用装饰性隅角和金线分隔增强视觉层次。同时保留返回世界选择的功能。

#### Scenario: 展示世界信息（增强样式）
- **WHEN** 角色选择页渲染且 `selectedWorld` 存在
- **THEN** 页面顶部 SHALL 显示带装饰隅角的信息条
- **AND** 世界名称 SHALL 以 serif 字体、tracking-wider 样式展示
- **AND** 世界类型图标和名称之间 SHALL 有金线分隔（`bg-gradient-to-r from-transparent via-primary/40 to-transparent h-px`）
- **AND** SHALL 显示世界难度（星级）和类型标签

#### Scenario: 可返回重新选世界
- **WHEN** 用户在世界信息条点击"返回星盘"
- **THEN** 系统 SHALL 清除 `selectedWorld` 并返回 `/world-select`
- **AND** 返回按钮文字 SHALL 使用叙事化语言（"← 返回星盘"而非"返回"）

### Requirement: 角色卡牌使用命星之镜视觉锚点

每个角色卡牌 SHALL 在顶部展示一个"命星之镜"圆形装饰元素，作为角色的视觉锚点。命星之镜 SHALL 包含性别符号和种族标识，使用铜镜质感的径向渐变背景。

#### Scenario: 命星之镜渲染
- **WHEN** 角色卡牌渲染
- **THEN** 卡片顶部 SHALL 显示一个圆形装饰框（w-16 h-16 rounded-full）
- **AND** 圆形背景 SHALL 使用铜镜质感渐变（`radial-gradient` 模拟，from amber-100/40 via amber-200/20 to amber-50/30）
- **AND** 圆形边框 SHALL 使用金色（`border-2 border-amber-400/40`）
- **AND** 圆形内部 SHALL 居中显示性别符号和种族名称

#### Scenario: 命星之镜 hover 发光
- **WHEN** 鼠标悬停在角色卡牌上
- **THEN** 命星之镜 SHALL 触发金边辉光动画（`gold-glow`，box-shadow 从 20px 到 40px）
- **AND** 辉光颜色 SHALL 为琥珀金（oklch 0.7 0.12 65）

### Requirement: 角色卡牌使用经脉图风格属性条

角色属性值 SHALL 以"经脉图"风格的进度条展示——更粗的条高、金色渐变填充、装饰性标签。

#### Scenario: 属性条渲染
- **WHEN** 角色卡牌渲染属性数值
- **THEN** 属性进度条 SHALL 使用 h-2（而非当前 h-1.5）高度
- **AND** 填充色 SHALL 使用金色渐变（`bg-gradient-to-r from-amber-400 to-amber-100`）替代当前的单色填充
- **AND** 属性标签 SHALL 使用 serif 字体、text-xs 字号
- **AND** 属性数值 SHALL 使用 tabular-nums 对齐

#### Scenario: 高属性值视觉突出
- **WHEN** 属性值 ≥ 12（高属性）
- **THEN** 进度条 SHALL 使用更亮的金色（from-amber-300 to-amber-50）
- **AND** 数值文字 SHALL 使用金色（text-amber-500）

### Requirement: 天赋展示使用印章风格徽章

角色天赋词条 SHALL 使用印章风格的视觉样式（双线 border、微微旋转、serif 字体），替代当前的圆角 Badge。

#### Scenario: 传说级天赋印章
- **WHEN** 角色拥有传说级（legendary）天赋
- **THEN** 天赋徽章 SHALL 使用印章风格（双线 border-amber-400/60、-rotate-1、font-serif）
- **AND** 左侧 SHALL 有 Sparkles 图标（text-amber-400）

#### Scenario: 普通天赋印章
- **WHEN** 角色拥有普通级（common）天赋
- **THEN** 天赋徽章 SHALL 使用印章风格但颜色更低调（双线 border-muted-foreground/30）

### Requirement: 人物选择页使用命运背景

角色选择页 SHALL 使用 MysticalBackground `variant="destiny"` 作为页面背景，营造"八颗命星悬浮于天道"的氛围。

#### Scenario: 命运背景渲染
- **WHEN** 角色选择页渲染
- **THEN** 页面 SHALL 使用 MysticalBackground `variant="destiny"`
- **AND** 金色光点 SHALL 更密集（80-100 个）
- **AND** SHALL 显示"命运"水印大字（opacity 0.04-0.06）

### Requirement: 角色卡牌性别区分使用色调而非彩条

角色性别区分 SHALL 使用暖/冷色调的微妙差异（卡片整体色温），替代当前顶部的粗性别色带。

#### Scenario: 男性角色卡牌
- **WHEN** 渲染男性角色卡牌
- **THEN** 卡片整体色调 SHALL 偏向微暖色（命星之镜偏暖铜色）
- **AND** SHALL NOT 使用明显的蓝色色带

#### Scenario: 女性角色卡牌
- **WHEN** 渲染女性角色卡牌
- **THEN** 卡片整体色调 SHALL 偏向微冷色（命星之镜偏银白）
- **AND** SHALL NOT 使用明显的粉色色带
