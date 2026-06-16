# 实施任务

## 1. RadarChart 迁移到 recharts

- [x] 1.1 重写 `src/shared/components/RadarChart.tsx`
  - 删除手写 SVG 实现（polygon 网格、line 轴线、circle 数据点、手写 tooltip）
  - 改用 recharts 组件：`RadarChart`、`PolarGrid`、`PolarAngleAxis`、`PolarRadiusAxis`、`Radar`
  - 用 shadcn `ChartContainer`（来自 `@/shared/ui/data-display/chart`）包裹
  - 保持 `RadarAxis`、`RadarSeries`、`RadarChartProps` 接口不变
  - 内部将 axes + series 转换为 recharts 的 data 数组格式
  - 使用 `ChartConfig` 为每个 series 配置颜色和 tooltip 标签
  - 添加 `animationBegin` 渐进动画
  - 文件大小 ≤ 200 行

- [x] 1.2 确认 `shared/components/index.ts` 中的 RadarChart 导出不变

- [x] 1.3 运行 `pnpm ts-check` 确保无类型错误

## 2. 进度条统一

- [x] 2.1 替换 `src/modules/collection/components/StatisticsPanel.tsx` 中的手写 `ProgressBar`
  - 删除内联 `ProgressBar` 函数定义（约 35 行）
  - 导入 `Progress` from `@/shared/ui/feedback/progress`
  - 调用处改为 `<Progress value={percent} className="h-1.5" />`（label 和数字保持原样）
  - 确认文件仍在 300 行限制内

- [x] 2.2 运行 `pnpm ts-check` 确认无类型错误

## 3. 质量验证

- [x] 3.1 运行 `pnpm ts-check` 确保零类型错误
- [x] 3.2 运行 `pnpm build` 确保构建成功
- [x] 3.3 运行 `pnpm check-sizes` 确保所有文件在限制内
- [x] 3.4 运行 `pnpm lint`（仅变更文件）确保无 lint 错误
- [x] 3.5 运行 `pnpm dev` 手动验证：
  - 角色选择页双雷达图（经脉五维 + 核心四维）正常渲染
  - 雷达图有入场动画
  - tooltip hover 正常工作
  - 明/暗主题切换正常
  - StatisticsPanel 的成就进度条正常显示

## 4. 规则固化

- [x] 4.1 在 `.claude/rules/core.md` 新增 5.5 "可视化组件与图表库（MUST）" 规则
  - 禁止手写 SVG 图表
  - 禁止手写进度条
  - 强制使用已安装的库（recharts、Radix UI Progress）
