## 1. 准备工作：Skills 安装与项目熟悉

- [x] 1.1 安装 `frontend-ui-ux-design` skill，获取 UI/UX 设计审查指导
- [x] 1.2 安装 `react-nextjs-development` skill，获取 Next.js/React 开发最佳实践
- [x] 1.3 梳理项目中所有可见页面和面板的完整清单，确认审查范围

## 2. 页面审查：入口页面（Pages）

- [x] 2.1 审查首页 [StartScreen.tsx](src/components/pages/home/StartScreen.tsx)：布局、标题排版、按钮样式、暗色主题适配
- [x] 2.2 审查世界选择页 [WorldSelect.tsx](src/components/pages/world-select/WorldSelect.tsx)：卡片列表布局、选中状态、hover 反馈、间距一致性
- [x] 2.3 审查角色选择页 [CharacterSelect.tsx](src/components/pages/character-select/CharacterSelect.tsx)：属性展示、按钮交互、移动端响应式
- [x] 2.4 审查背景故事页 [BackstoryView.tsx](src/components/pages/backstory/BackstoryView.tsx)：文本排版、阅读体验、暗色主题
- [x] 2.5 记录入口页面的视觉问题清单（按高/中/低优先级分类）

## 3. 页面审查：主游戏界面布局

- [x] 3.1 审查主布局 [MainGame.tsx](src/components/game/layout/MainGame.tsx)：整体布局结构、三栏比例、响应式断点
- [x] 3.2 审查左侧边栏 [LeftSidebar.tsx](src/components/game/layout/LeftSidebar.tsx)：面板堆叠、间距、暗色主题
- [x] 3.3 审查右侧边栏 [RightSidebar.tsx](src/components/game/layout/RightSidebar.tsx)：面板堆叠、间距、暗色主题
- [x] 3.4 审查中央面板 [CenterPanel.tsx](src/components/game/layout/CenterPanel.tsx)：标签导航、内容区域
- [x] 3.5 审查移动端布局 [MobileLayout.tsx](src/components/game/layout/MobileLayout.tsx)：移动端适配、触摸友好性
- [x] 3.6 记录布局组件的视觉问题清单

## 4. 页面审查：侧边栏面板

- [x] 4.1 审查状态面板 [StatusPanel.tsx](src/components/game/sidebar/StatusPanel.tsx)：属性展示、进度条、可读性
- [x] 4.2 审查世界信息面板 [WorldInfoPanel.tsx](src/components/game/sidebar/WorldInfoPanel.tsx)：信息层级、排版
- [x] 4.3 审查心神状态卡片 [MentalStateCard.tsx](src/components/game/sidebar/MentalStateCard.tsx)：情感化设计、颜色使用
- [x] 4.4 审查存档面板 [SaveLoadPanel.tsx](src/components/game/sidebar/SaveLoadPanel.tsx)：按钮布局、状态反馈
- [x] 4.5 记录侧边栏面板的视觉问题清单

## 5. 页面审查：标签页（Tabs）

- [x] 5.1 审查修炼面板 [CultivationPanel.tsx](src/components/game/tabs/CultivationPanel.tsx)：进度展示、突破状态
- [x] 5.2 审查冒险面板 [AdventurePanel.tsx](src/components/game/tabs/AdventurePanel.tsx)：列表布局、事件展示
- [x] 5.3 审查背包面板 [InventoryPanel.tsx](src/components/game/tabs/InventoryPanel.tsx)：物品网格/列表、空状态
- [x] 5.4 审查装备面板 [EquipmentPanel.tsx](src/components/game/tabs/EquipmentPanel.tsx)：装备槽位、属性对比
- [x] 5.5 审查商店面板 [ShopPanel.tsx](src/components/game/tabs/ShopPanel.tsx)：商品卡片、价格展示
- [x] 5.6 审查技能面板 [SkillsTab.tsx](src/components/game/tabs/SkillsTab.tsx)：技能列表、等级展示
- [x] 5.7 审查功法面板 [TechniquePanel.tsx](src/components/game/tabs/TechniquePanel.tsx)：功法详情、进度
- [x] 5.8 审查势力面板 [FactionPanel.tsx](src/components/game/tabs/FactionPanel.tsx)：声望展示、任务列表
- [x] 5.9 审查成就面板 [AchievementPanel.tsx](src/components/game/tabs/AchievementPanel.tsx)：成就卡片、解锁状态
- [x] 5.10 审查其他标签页（炼制、附魔、碎片、统计、爬塔、升级等）
- [x] 5.11 记录所有标签页的视觉问题清单

## 6. 页面审查：弹窗与对话框

- [x] 6.1 审查战斗对话框 [BattleDialog.tsx](src/components/game/battle/BattleDialog.tsx)：战斗信息展示、血条、技能选择
- [x] 6.2 审查战斗结果弹窗 [BattleResultDialog.tsx](src/components/game/battle/BattleResultDialog.tsx)：奖励展示
- [x] 6.3 审查炼制对话框 [CraftingDialog.tsx](src/components/game/dialogs/CraftingDialog.tsx)：配方选择、材料展示
- [x] 6.4 审查天劫对话框 [TribulationDialog.tsx](src/components/game/dialogs/TribulationDialog.tsx)：进度动画
- [x] 6.5 审查其他弹窗（离线奖励、排行榜详情、声望详情、世界揭示等）
- [x] 6.6 记录弹窗组件的视觉问题清单

## 7. 页面审查：共享组件与游戏组件

- [x] 7.1 审查角色信息展示 [CharacterInfo.tsx](src/components/game/shared/CharacterInfo.tsx)
- [x] 7.2 审查消息面板 [MessagePanel.tsx](src/components/game/shared/MessagePanel.tsx)：消息列表、滚动、空状态
- [x] 7.3 审查聊天室 [ChatRoom.tsx](src/components/game/shared/ChatRoom.tsx)：输入框、消息气泡
- [x] 7.4 审查公告组件 [AnnouncementContainer.tsx](src/components/game/announcement/AnnouncementContainer.tsx)
- [x] 7.5 审查排行榜面板 [LeaderboardPanel.tsx](src/components/game/leaderboard/LeaderboardPanel.tsx)
- [x] 7.6 审查商店子组件（商品卡片、货币栏、每日特卖等）
- [x] 7.7 审查战斗子组件（守护者战斗、克制图表、战斗日志等）
- [x] 7.8 记录共享组件的视觉问题清单

## 8. 问题汇总与优先级排序

- [x] 8.1 汇总所有审查阶段记录的问题，去重合并
- [x] 8.2 按优先级分类：高（影响可读性/可用性）、中（视觉不一致）、低（动效/微调）
- [x] 8.3 输出完整问题清单到 `doc/visual-polish-issues.md`，每个问题包含：文件路径、问题描述、建议修复方案、优先级

## 9. 修复：高优先级视觉问题

- [x] 9.1 修复所有对比度不足、可读性受损的问题
- [x] 9.2 修复所有布局错位、元素重叠的问题
- [x] 9.3 修复所有功能可见性受损（按钮不可见、链接不明显）的问题
- [x] 9.4 修复所有缺失的关键空状态提示
- [x] 9.5 运行 `pnpm lint && pnpm ts-check` 确认无回归

## 10. 修复：中优先级视觉问题

- [x] 10.1 统一所有面板的间距系统（gap/padding/margin）
- [x] 10.2 统一按钮和交互元素的 hover/active/focus/disabled 状态
- [x] 10.3 修复暗色主题下的颜色不一致问题
- [x] 10.4 优化中文排版（行高、字距、标题层级）
- [x] 10.5 补充缺失的 loading 状态（skeleton/spinner）
- [x] 10.6 运行 `pnpm lint && pnpm ts-check` 确认无回归

## 11. 修复：低优先级视觉问题

- [x] 11.1 为关键交互添加过渡动画（面板展开/收起、标签切换）
- [x] 11.2 优化响应式断点下的布局细节
- [x] 11.3 微调组件圆角、阴影、边框等视觉细节
- [x] 11.4 运行 `pnpm lint && pnpm ts-check` 确认无回归

## 12. 收尾验证

- [x] 12.1 运行 `pnpm dev`，逐页目视检查所有修改页面
- [x] 12.2 运行 `pnpm build` 确认构建成功
- [x] 12.3 运行 `pnpm lint:strict` 完整质量门禁
- [x] 12.4 更新 `doc/visual-polish-issues.md`，标记已修复项
- [x] 12.5 将视觉标准 checklist 合并到项目文档中
