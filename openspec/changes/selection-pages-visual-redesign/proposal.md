## Why

世界选择页和人物选择页当前视觉效果简约，与首页（StartScreen）的沉浸式东方玄幻氛围严重割裂。首页有浮动符文、光点粒子、旋转光晕环、"万界"水印等丰富的氛围元素，但进入选择页后这些全部消失，退化为标准 shadcn 卡片网格 + 9px 小字的工具式界面。需要将首页的美学体系延续到选择页，形成统一的视觉旅程，打造"高级感"的东方古典星图风格。

## What Changes

- **提取 MysticalBackground 通用背景系统**：将首页的符文/粒子/光晕/水印系统抽象为可配置的共享组件，支持 `runes`（首页）、`stars`（世界选择）、`destiny`（人物选择）三种变体
- **重构世界选择页**：4列×2行布局、星图粒子背景、带四角装饰和印章 Badge 的丰富卡片、世界图标放大为视觉锚点、hover 金边辉光 + 粒子吸附
- **重构人物选择页**：命星之镜（圆形命运之镜）作为卡片视觉锚点、经脉图风格属性条、印章风格天赋徽章、世界味觉贯穿卡片
- **扩展动画系统**：新增 `star-twinkle`、`constellation-fade`、`gold-glow`、`spirit-rise` 等关键帧
- **PC 优先**：大卡片、宽间距、丰富粒子特效，移动端自动降级

## Capabilities

### New Capabilities
- `mystical-background`: 可配置的东方玄幻氛围背景系统，支持三种场景变体（runes/stars/destiny），包含光点粒子、柔光团、装饰性水印文字、星座连线等图层

### Modified Capabilities
- `world-select-ui`: 从"环绕星盘+两步确认"改为"星图卡片网格+一步踏入"；增加四角装饰、印章 Badge、粒子 hover 等丰富装饰元素；调整布局为 PC 优先 4 列×2 行
- `character-select-ui`: 增加命星之镜圆形装饰、经脉图属性条、印章风天赋徽章；WorldInfoBar 增加装饰隅角和金线分隔

## Impact

- **新增文件**: `shared/components/MysticalBackground.tsx`、`views/world-select/WorldCard.tsx`、`views/character-select/CharacterCard.tsx`
- **重构文件**: `views/world-select/WorldSelect.tsx`、`views/character-select/CharacterSelect.tsx`、`views/character-select/WorldInfoBar.tsx`
- **扩展文件**: `app/styles/animations.css`（新增 keyframes）、`app/styles/base.css`（新增工具类）
- **不受影响**: API 路由、数据流、状态管理、后端逻辑——纯前端视觉变更
