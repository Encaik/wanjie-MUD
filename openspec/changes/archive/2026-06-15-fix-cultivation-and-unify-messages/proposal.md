## Why

路由驱动重构后，主角初始化时背包为空（`inventory: []`），修炼需要 20 灵石但玩家没有任何初始资源，新手引导任务又要求先修炼才能获得灵石奖励，形成死锁。同时右侧栏将聊天、系统消息、公告拆成 3 个独立 Tab，信息碎片化，不符合传统 MUD/网游的沉浸式消息体验。

## What Changes

- 主角创建时发放初始资源：200 灵石、5 聚气丹、1 筑基丹、3 回春丹
- 修复 GameStore 中新手任务灵石奖励不创建新 inventory 条目的 Bug
- 将右侧栏 4 Tab 精简为 2 Tab：**消息**（统一面板 + 筛选器）+ **排行**
- 扩展 `MessagePanel`（`shared/components/MessagePanel.tsx`），新增消息筛选组件
- 筛选器使用 `core/message-log/` 的预设通道分类，加上聊天和公告源
- 聊天消息、公告适配为 `MessageRecord` 格式，统一在消息面板中按时间倒序展示
- 聊天新消息在非聊天筛选时以红点提示

## Capabilities

### New Capabilities

- `unified-message-feed`: 统一消息面板，基于 `core/message-log/` 通道系统，合并系统消息、WebSocket 聊天、服务器公告为单一按时间排序的信息流，提供消息类型筛选器

### Modified Capabilities

<!-- 不涉及已有 spec 的需求级修改 -->

## Impact

- `src/modules/identity/logic/protagonistAdapter.ts` — 添加初始背包物品
- `src/views/game/state/GameStore.tsx` — 修复灵石奖励 Bug
- `src/views/game/layout/RightSidebar.tsx` — 重构 Tab 结构（4→2）
- `src/shared/components/MessagePanel.tsx` — 扩展为支持多消息源 + 筛选组件
- `src/core/message-log/` — 利用已有通道系统；可能需要为聊天/公告注册通道
- `src/modules/social/components/ChatRoom.tsx` — 聊天消息回调适配
- `src/modules/social/components/AnnouncementHistory.tsx` — 可能不再需要独立渲染
