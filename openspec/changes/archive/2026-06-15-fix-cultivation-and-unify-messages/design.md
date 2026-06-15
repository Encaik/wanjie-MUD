## Context

当前右侧栏（`RightSidebar.tsx`）使用 4 个 Tab 分别展示聊天、系统消息、排行榜和公告，信息分散、切换频繁。传统 MUD/网游通常将所有消息合并为单一信息流，通过频道筛选区分来源。

`core/message-log/` 已建立完整的消息通道系统：预设 5 个通道（`system`、`combat`、`cultivation`、`exploration`、`economy`），`MessageRecord` 已有 `channel` 字段。`MessagePanel`（`shared/components/MessagePanel.tsx`）是目前系统消息的展示组件，但仅支持单纯的 `MessageRecord[]` 渲染，无筛选能力、不接入聊天和公告。

本次改动在已有基础设施上扩展 `MessagePanel`，而非创建全新的消息组件。

同时，路由驱动重构后主角初始化背包为空，修炼功能因缺乏初始资源无法使用。

## Goals / Non-Goals

**Goals:**
- 主角创建时自动获得初始资源，让修炼功能立即可用
- 修复 GameStore 中灵石奖励不创建新条目导致奖励丢失的 Bug
- 扩展 `MessagePanel` 支持多消息源（系统 + 聊天 + 公告）和类型筛选
- 利用 `core/message-log/` 通道系统作为筛选依据
- 右侧栏精简为 2 Tab（消息 + 排行）

**Non-Goals:**
- 不重构背包系统
- 不修改聊天 WebSocket 协议
- 不修改排行榜面板功能
- 不修改 `core/message-log/` 核心逻辑
- 不修改 `MessageRecord` 类型定义

## Decisions

### 决策 1: 初始资源直接写入 protagonistAdapter

**选择**：在 `createProtagonistFromSaved` 中直接设置初始 `inventory`。

**理由**：背包系统尚未重构，最简单的方式是在主角创建时注入初始资源。后续背包系统重构时一并迁移。

### 决策 2: 扩展 MessagePanel 而非新建组件

**选择**：扩展已有 `shared/components/MessagePanel.tsx`，新增 props 和筛选 UI。

**理由**：
- 组件名为"消息面板"符合用户意图
- 已有完善的 `MessageRecord` 渲染逻辑（类型图标、奖励展示、时间格式化、虚拟分页）
- 避免创建功能重复的组件

**替代方案**：新建 `UnifiedMessageFeed` → 放弃，与已有 `MessagePanel` 功能高度重合。

### 决策 3: 聊天和公告适配为 MessageRecord 格式

**选择**：聊天消息和公告通过适配函数转为 `MessageRecord`，统一在 `MessagePanel` 中渲染。

**适配映射**：
```
ChatMessage  → MessageRecord { type:'info', channel:'chat', title: sender, content: text }
Announcement → MessageRecord { type:'info', channel:'announcement', title: '服务器公告', content: text }
```

**理由**：
- `MessagePanel` 已基于 `MessageRecord` 构建，适配成本最低
- 利用已有的格式化、渲染逻辑
- 单一数据流，性能可预测

### 决策 4: 筛选器使用 source 分组，内部通道自动归类

**选择**：筛选器提供 4 个选项：**全部 | 系统 | 聊天 | 公告**。其中"系统"包含 `core/message-log/` 所有预设通道（system、combat、cultivation、exploration、economy）的消息。

```
筛选逻辑：
  "全部"   → 显示所有消息
  "系统"   → channel ∈ {system, combat, cultivation, exploration, economy, undefined}
  "聊天"   → channel === 'chat'
  "公告"   → channel === 'announcement'
```

**理由**：
- "系统"作为游戏内消息的总称，用户不需要关心内部的 combat/cultivation 区分
- 聊天和公告是独立的消息来源，用户有明确的查看/隐藏需求
- 基于 `channel` 字段筛选，与 `core/message-log/` 通道系统对齐

### 决策 5: GameStore 灵石奖励使用 createInventoryItem

**选择**：对齐物品奖励逻辑，灵石也用 `createInventoryItem` 创建新条目。

**理由**：原代码 `findIndex + si >= 0` 的逻辑导致新玩家首次获得灵石时奖励被静默丢弃。

## Data Flow

```
RightSidebar
  ├── gameState.messages (MessageRecord[], 通过 state)
  ├── chatMessages (ChatMessage[], 通过 ChatRoom 回调)
  └── announcements (Announcement[], 通过 props)
       │
       ▼
  MessagePanel (扩展版)
  ├── Props: systemMessages + chatMessages + announcements
  ├── 适配: ChatMessage → MessageRecord, Announcement → MessageRecord
  ├── 合并: [...systemMessages, ...adaptedChat, ...adaptedAnnouncement]
  │          .sort((a, b) => b.timestamp - a.timestamp)
  ├── 筛选: 根据 channel 字段过滤
  └── 渲染: 已有 MessageItem (memo, 虚拟滚动)
```

## Risks / Trade-offs

- **[低风险] 初始资源平衡性**：200 灵石 + 5 丹药可能偏多或偏少 → 后续调整
- **[低风险] 消息合并性能**：系统消息截断到 100 条，聊天和公告各自限制 200 条，合并排序在千级数据量无压力
- **[无风险] 聊天消息"丢失"**：筛选隐藏≠丢弃，ChatRoom 维护自己的缓冲区
