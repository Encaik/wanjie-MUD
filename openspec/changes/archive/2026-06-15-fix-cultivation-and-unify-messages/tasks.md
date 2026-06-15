## 1. 修炼修复 — 初始资源

- [x] 1.1 在 `protagonistAdapter.ts` 中给主角添加初始背包物品：200 灵石、5 聚气丹、1 筑基丹、3 回春丹
- [x] 1.2 修复 `GameStore.tsx` 中灵石奖励处理：使用 `createInventoryItem` 创建新条目，对齐物品奖励逻辑
- [x] 1.3 运行 `pnpm ts-check` 验证类型

## 2. 消息面板扩展

- [x] 2.1 编写聊天→MessageRecord、公告→MessageRecord 适配函数（`shared/utils/messageAdapters.ts`）
- [x] 2.2 扩展 `MessagePanel` props：新增 `chatMessages`、`announcements`、筛选状态
- [x] 2.3 在 `MessagePanel` 顶部添加筛选组件（全部 / 系统 / 聊天 / 公告），基于 `channel` 字段过滤
- [x] 2.4 仅有多类消息时才显示筛选组件；仅系统消息时保持旧版无筛选体验
- [x] 2.5 实现聊天未读红点提示：筛选未覆盖聊天时，新消息到达显示标记

## 3. 右侧栏重构

- [x] 3.1 重构 `RightSidebar.tsx`：4 Tab 精简为 2 Tab（消息 + 排行）
- [x] 3.2 消息 Tab 接入扩展后的 `MessagePanel`，传入 systemMessages + chatMessages + announcements
- [x] 3.3 排行榜 Tab 保持原有 `LeaderboardPanel` 不变
- [x] 3.4 移除独立的 `ChatRoom` 和 `AnnouncementHistory` 渲染（聊天数据由 ChatRoom 管理，消息展示统一在 MessagePanel）
- [x] 3.5 `MobileLayout.tsx` 检查是否需要适配（移动端不使用 RightSidebar，确认无影响）

## 4. 验证与收尾

- [x] 4.1 运行 `pnpm ts-check` 确保类型安全
- [x] 4.2 运行 `pnpm build` 确保构建成功
- [x] 4.3 运行 `pnpm test` 确保已有测试不回归
- [x] 4.4 `MessagePanel.tsx` 271行 / `MessageItem.tsx` 191行 / `RightSidebar.tsx` 135行，均合规
- [ ] 4.5 手工验证：新游戏 → 修炼可用 → 右侧消息统一流 + 筛选正常
