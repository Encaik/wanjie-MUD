## 1. Token 层 — 阴影系统重定义

- [x] 1.1 暖色偏光阴影 token
- [x] 1.2 添加设计意图注释
- [x] 1.3 `pnpm ts-check` 通过

## 2. Button 视觉升级

- [x] 2.1 Button 内高光 + 圆角 rounded-sm
- [x] 2.2 Button hover lift + shadow 增强
- [x] 2.3 Button active 移除 scale 改为 translate-y-0
- [x] 2.4 所有 variant 一致化

## 3. Card 视觉升级

- [x] 3.1 Card 材质感渐变背景
- [x] 3.2 Card 组合阴影（外阴影 + 内描边）
- [x] 3.3 CardHeader 装饰线
- [x] 3.4 Card hover 边框色过渡

## 4. Dialog 视觉升级

- [x] 4.1 Dialog 材质感渐变背景
- [x] 4.2 DialogHeader 装饰线
- [x] 4.3 Dialog 组合阴影（外阴影 + 内描边）

## 5. Input / 表单组件 focus 重设计

- [x] 5.1 Input focus 重设计
- [x] 5.2 Textarea focus 一致化
- [x] 5.3 Select trigger focus 一致化
- [x] 5.4 Button/Input/Select 圆角统一 rounded-sm

## 6. Item 和 Tabs 视觉升级

- [x] 6.1 Item hover 左侧指示条
- [x] 6.2 Item 分隔线装饰样式
- [x] 6.3 TabsTrigger active 下划线
- [x] 6.4 TabsList rounded-lg → rounded-md

## 7. 浮层组件视觉升级

- [x] 7.1 Popover 材质感渐变 + 新阴影
- [x] 7.2 Sheet 材质感渐变 + 新阴影
- [x] 7.3 浮层组件阴影统一

## 8. 装饰性细节补全

- [x] 8.1 Empty 组件微渐变 + 浅虚线边框
- [x] 8.2 Progress 组件渐变指示条
- [x] 8.3 Skeleton 暖色渐变背景

## 9. 收尾验证

- [x] 9.1 `pnpm ts-check` ✅ + `pnpm build` ✅
- [ ] 9.2 切换暗色模式确认所有渐变和阴影在 `.dark` 下正常
- [ ] 9.3 `pnpm dev` 手动确认关键页面渲染正常
