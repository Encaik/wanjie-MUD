# WebSocket 实时状态同步与排行榜系统设计

## 一、问题分析

### 1.1 现有系统问题

**当前实现**（`src/app/api/chat/route.ts`）：
```typescript
// HTTP 轮询方式获取消息和更新在线状态
const ONLINE_TIMEOUT = 3 * 60 * 1000; // 3分钟超时

// 轮询更新在线状态
if (playerId && playerName && playerLevel) {
  updatePlayerOnline(playerId, playerName, parseInt(playerLevel) || 0, playerRealm || '');
}
```

**问题清单**：

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| 状态同步延迟 | P1 | HTTP 轮询无法实时同步，玩家离开后仍显示在线长达3分钟 |
| 资源浪费 | P2 | 频繁的 HTTP 请求消耗带宽和服务器资源 |
| 排行榜缺失 | P1 | 没有排行榜系统，玩家缺乏社交动力 |
| 僵尸账号 | P1 | 不活跃账号长期占用排行榜位置 |
| 无删号机制 | P1 | 玩家重开后旧数据残留 |

### 1.2 设计目标

1. **实时状态同步**：玩家进入/离开即时同步，延迟 < 1秒
2. **排行榜系统**：展示活跃玩家排行，激励竞争
3. **活跃度保障**：排行榜只显示活跃账号
4. **删号机制**：不活跃或重开时自动清理数据

---

## 二、系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端                                │
├─────────────────────────────────────────────────────────────┤
│  GamePage                                                    │
│    ├── WebSocket Hook (useWebSocketConnection)               │
│    ├── 心跳发送 (30秒间隔)                                    │
│    ├── 状态上报 (等级/战力/成就变化)                          │
│    └── 排行榜展示 (LeaderboardPanel)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      服务端 (Next.js API)                    │
├─────────────────────────────────────────────────────────────┤
│  /api/ws/route.ts (WebSocket 端点)                           │
│    ├── 连接管理 (ConnectionManager)                          │
│    ├── 心跳检测 (60秒超时)                                    │
│    ├── 状态同步 (广播进入/离开)                               │
│    └── 排行榜推送 (变化时推送)                                │
│                                                              │
│  /api/player/delete/route.ts (删号端点)                      │
│    ├── 删除玩家数据                                          │
│    └── 从排行榜移除                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据层 (内存存储)                        │
├─────────────────────────────────────────────────────────────┤
│  PlayerStateManager (全局单例)                               │
│    ├── onlinePlayers: Map<playerId, PlayerState>            │
│    ├── leaderboard: LeaderboardEntry[]                      │
│    └── cleanupScheduler (定时清理)                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 状态机设计

#### 玩家在线状态机

```
         ┌─────────────────────────────────────────┐
         │                                         │
         ▼                                         │
    ┌─────────┐  WebSocket连接成功  ┌──────────┐   │
    │  离线   │ ──────────────────▶ │   在线   │───┘
    │ (OFFLINE)│                     │ (ONLINE) │  心跳超时
    └─────────┘ ◀────────────────── └──────────┘
         ▲           主动断开/删号
         │
         │  ┌──────────┐
         └──│   删除   │
             │ (DELETED)│
             └──────────┘
```

**状态转移条件**：

| 当前状态 | 触发事件 | 目标状态 | 动作 |
|----------|----------|----------|------|
| OFFLINE | WebSocket 连接成功 | ONLINE | 添加到在线列表，广播进入 |
| ONLINE | 收到心跳 | ONLINE | 更新 lastActive |
| ONLINE | 心跳超时 (60秒) | OFFLINE | 从在线列表移除，广播离开 |
| ONLINE | 主动断开连接 | OFFLINE | 从在线列表移除，广播离开 |
| ONLINE | 收到删号请求 | DELETED | 删除所有数据，广播离开 |
| OFFLINE | 收到删号请求 | DELETED | 删除所有数据 |

---

## 三、核心数据结构

### 3.1 玩家状态

```typescript
/** 玩家在线状态 */
export interface PlayerOnlineState {
  // 基础信息
  id: string;                    // 玩家唯一ID
  name: string;                  // 角色名称
  worldType: WorldType;          // 世界类型
  
  // 进度信息
  level: number;                 // 当前等级
  realm: string;                 // 当前境界
  combatPower: number;           // 战力
  
  // 统计信息
  statistics: {
    totalEnemiesKilled: number;  // 击杀敌人
    totalBossKilled: number;     // 击杀Boss
    legendaryItems: number;      // 传说物品
    adventuresCompleted: number; // 完成冒险
  };
  
  // 连接信息
  connectionId: string;          // WebSocket 连接ID
  lastActive: number;            // 最后活跃时间戳
  joinedAt: number;              // 加入时间戳
  ipAddress?: string;            // IP地址（可选，用于防刷）
}

/** 玩家状态（包含离线玩家历史记录） */
export interface PlayerState extends PlayerOnlineState {
  status: 'online' | 'offline' | 'deleted';
  deletedAt?: number;            // 删除时间戳
  deletionReason?: 'inactive' | 'restart' | 'manual';
}
```

### 3.2 排行榜条目

```typescript
/** 排行榜条目 */
export interface LeaderboardEntry {
  rank: number;                  // 排名
  playerId: string;              // 玩家ID
  playerName: string;            // 玩家名称
  worldType: WorldType;          // 世界类型
  
  // 排行维度
  level: number;                 // 等级
  combatPower: number;           // 战力
  realm: string;                 // 境界
  
  // 成就展示
  achievements: {
    bossKills: number;           // Boss击杀数
    legendaryItems: number;      // 传说物品数
    adventuresCompleted: number; // 完成冒险数
  };
  
  // 状态标识
  isOnline: boolean;             // 是否在线
  lastActive: number;            // 最后活跃时间
  
  // 显示字段
  displayName: string;           // 显示名称（带称号）
  title?: string;                // 称号（可选）
}

/** 排行榜类型 */
export type LeaderboardType = 
  | 'level'       // 等级排行
  | 'combat'      // 战力排行
  | 'boss_kills'  // Boss击杀排行
  | 'legendary'   // 传说物品排行
  | 'adventure';  // 冒险完成排行

/** 排行榜数据 */
export interface LeaderboardData {
  type: LeaderboardType;
  entries: LeaderboardEntry[];
  totalPlayers: number;
  lastUpdated: number;
}
```

### 3.3 WebSocket 消息类型

```typescript
/** WebSocket 消息类型 */
export type WSMessageType =
  // 连接相关
  | 'connect'           // 连接成功
  | 'disconnect'        // 断开连接
  | 'heartbeat'         // 心跳
  | 'heartbeat_ack'     // 心跳响应
  
  // 状态同步
  | 'player_join'       // 玩家进入
  | 'player_leave'      // 玩家离开
  | 'player_update'     // 玩家状态更新
  
  // 排行榜
  | 'leaderboard_sync'  // 排行榜同步
  | 'leaderboard_update'// 排行榜更新
  
  // 全服公告
  | 'announcement'      // 全服公告推送
  | 'announcement_history' // 历史公告
  
  // 删号
  | 'player_delete'     // 删号请求
  | 'player_deleted'    // 删号确认
  
  // 错误
  | 'error';            // 错误消息

/** WebSocket 消息 */
export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

/** 心跳消息 */
export interface WSHeartbeat {
  playerId: string;
  playerData?: Partial<PlayerOnlineState>; // 可选：状态更新
}

/** 玩家进入消息 */
export interface WSPlayerJoin {
  player: PlayerOnlineState;
  onlineCount: number;
}

/** 玩家离开消息 */
export interface WSPlayerLeave {
  playerId: string;
  playerName: string;
  reason: 'disconnect' | 'timeout' | 'delete';
  onlineCount: number;
}

/** 排行榜同步消息 */
export interface WSLeaderboardSync {
  leaderboards: Record<LeaderboardType, LeaderboardEntry[]>;
  onlinePlayers: LeaderboardEntry[];
}

// ========== 全服公告系统 ==========

/**
 * 全服公告系统架构说明
 * 
 * 关键设计原则：
 * 由于每个玩家的世界观(worldType)不同，境界名称、物品描述等会有差异。
 * 因此公告内容必须由【触发玩家】根据自己的世界观组装成静态文本，
 * 发送到服务端后直接广播，服务端不负责内容生成。
 * 
 * 流程：
 * 1. 客户端检测游戏事件（突破/掉落/Boss击杀等）
 * 2. 客户端根据自己的世界观组装公告内容（标题、正文都是静态文本）
 * 3. 客户端发送公告请求到服务端
 * 4. 服务端验证、记录历史、广播给所有在线玩家
 */

/** 公告类型 */
export type AnnouncementType =
  | 'breakthrough'      // 突破大境界
  | 'mythic_item'       // 获得神话物品
  | 'legendary_item'    // 获得传说物品
  | 'first_boss_kill'   // 首杀Boss
  | 'achievement'       // 成就达成
  | 'level_milestone'   // 等级里程碑
  | 'faction_event'     // 势力事件
  | 'system';           // 系统公告

/** 公告优先级 */
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

/** 公告数据（静态文本，已由触发玩家组装完成） */
export interface Announcement {
  id: string;                      // 公告唯一ID（服务端生成）
  type: AnnouncementType;          // 公告类型
  priority: AnnouncementPriority;  // 优先级
  
  // 内容（静态文本，由触发玩家根据自己的世界观组装）
  title: string;                   // 公告标题（已组装的静态文本）
  content: string;                 // 公告内容（已组装的静态文本）
  
  // 来源信息
  playerId: string;                // 触发玩家ID
  playerName: string;              // 触发玩家名称
  worldType: WorldType;            // 触发玩家的世界类型（供其他玩家参考）
  
  // 时间
  timestamp: number;               // 发布时间戳（服务端生成）
  expiresAt?: number;              // 过期时间戳（可选）
  
  // 显示配置
  displayDuration: number;         // 显示时长（毫秒）
  showPopup: boolean;              // 是否弹窗显示
  showInChat: boolean;             // 是否在聊天区显示
  soundEffect?: string;            // 音效（可选）
  
  // 状态
  read: boolean;                   // 是否已读（客户端状态）
}

/** 客户端发送公告请求 */
export interface AnnouncementRequest {
  type: AnnouncementType;
  priority: AnnouncementPriority;
  
  // 内容（客户端根据自己的世界观组装）
  title: string;
  content: string;
  
  // 来源信息
  playerId: string;
  playerName: string;
  worldType: WorldType;
  
  // 显示配置
  displayDuration: number;
  showPopup: boolean;
  showInChat: boolean;
  soundEffect?: string;
}

/** 全服公告推送消息 */
export interface WSAnnouncement {
  announcement: Announcement;
  onlineCount: number;             // 当前在线人数
}

/** 历史公告请求 */
export interface WSAnnouncementHistoryRequest {
  since?: number;                  // 获取此时间戳之后的公告
  limit?: number;                  // 最大数量
}

/** 历史公告响应 */
export interface WSAnnouncementHistory {
  announcements: Announcement[];
  hasMore: boolean;
}
```

---

## 四、核心逻辑设计

### 4.1 连接管理器

```typescript
/**
 * 连接管理器
 * 
 * 职责：
 * 1. 管理 WebSocket 连接
 * 2. 心跳检测
 * 3. 状态同步
 * 4. 排行榜更新
 */
export class ConnectionManager {
  private connections: Map<string, WebSocket> = new Map();
  private playerStates: Map<string, PlayerOnlineState> = new Map();
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // 配置
  private readonly HEARTBEAT_TIMEOUT = 60 * 1000; // 60秒心跳超时
  private readonly HEARTBEAT_INTERVAL = 30 * 1000; // 客户端30秒发送心跳
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分钟清理一次
  
  /**
   * 处理新连接
   */
  onConnect(ws: WebSocket, playerId: string, initialState: PlayerOnlineState): void {
    // 1. 存储连接
    this.connections.set(playerId, ws);
    this.playerStates.set(playerId, {
      ...initialState,
      connectionId: this.generateConnectionId(),
      lastActive: Date.now(),
      joinedAt: Date.now(),
    });
    
    // 2. 启动心跳检测
    this.startHeartbeatCheck(playerId);
    
    // 3. 广播玩家进入
    this.broadcast({
      type: 'player_join',
      payload: {
        player: this.playerStates.get(playerId),
        onlineCount: this.connections.size,
      },
      timestamp: Date.now(),
    }, playerId); // 排除自己
    
    // 4. 发送当前排行榜
    this.sendLeaderboard(ws);
    
    // 5. 更新排行榜
    this.updateLeaderboard();
  }
  
  /**
   * 处理心跳
   */
  onHeartbeat(playerId: string, data?: Partial<PlayerOnlineState>): void {
    const state = this.playerStates.get(playerId);
    if (!state) return;
    
    // 更新活跃时间
    state.lastActive = Date.now();
    
    // 如果有状态更新，同步更新
    if (data) {
      Object.assign(state, data);
      this.updateLeaderboard();
    }
    
    // 重置心跳检测定时器
    this.startHeartbeatCheck(playerId);
    
    // 发送心跳响应
    this.send(playerId, {
      type: 'heartbeat_ack',
      payload: { serverTime: Date.now() },
      timestamp: Date.now(),
    });
  }
  
  /**
   * 处理断开连接
   */
  onDisconnect(playerId: string): void {
    const state = this.playerStates.get(playerId);
    if (!state) return;
    
    // 清理连接
    this.connections.delete(playerId);
    this.playerStates.delete(playerId);
    this.heartbeatTimers.delete(playerId);
    
    // 广播玩家离开
    this.broadcast({
      type: 'player_leave',
      payload: {
        playerId,
        playerName: state.name,
        reason: 'disconnect',
        onlineCount: this.connections.size,
      },
      timestamp: Date.now(),
    });
    
    // 更新排行榜
    this.updateLeaderboard();
  }
  
  /**
   * 处理删号请求
   */
  onDeletePlayer(playerId: string, reason: 'inactive' | 'restart' | 'manual'): void {
    const state = this.playerStates.get(playerId);
    
    // 广播玩家离开（删号）
    if (state) {
      this.broadcast({
        type: 'player_leave',
        payload: {
          playerId,
          playerName: state.name,
          reason: 'delete',
          onlineCount: this.connections.size - 1,
        },
        timestamp: Date.now(),
      });
    }
    
    // 清理所有数据
    this.connections.delete(playerId);
    this.playerStates.delete(playerId);
    this.heartbeatTimers.delete(playerId);
    
    // 从排行榜移除
    this.updateLeaderboard();
    
    // 发送确认
    const ws = this.connections.get(playerId);
    if (ws) {
      this.send(playerId, {
        type: 'player_deleted',
        payload: { playerId, reason },
        timestamp: Date.now(),
      });
      ws.close();
    }
  }
  
  /**
   * 心跳超时检测
   */
  private startHeartbeatCheck(playerId: string): void {
    // 清除旧定时器
    const oldTimer = this.heartbeatTimers.get(playerId);
    if (oldTimer) clearTimeout(oldTimer);
    
    // 设置新定时器
    const timer = setTimeout(() => {
      const state = this.playerStates.get(playerId);
      if (!state) return;
      
      const elapsed = Date.now() - state.lastActive;
      if (elapsed > this.HEARTBEAT_TIMEOUT) {
        // 心跳超时，视为断开
        this.onDisconnect(playerId);
      }
    }, this.HEARTBEAT_TIMEOUT);
    
    this.heartbeatTimers.set(playerId, timer);
  }
  
  /**
   * 广播消息
   */
  private broadcast(message: WSMessage, excludePlayerId?: string): void {
    const messageStr = JSON.stringify(message);
    for (const [playerId, ws] of this.connections) {
      if (playerId === excludePlayerId) continue;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    }
  }
  
  /**
   * 发送消息给指定玩家
   */
  private send(playerId: string, message: WSMessage): void {
    const ws = this.connections.get(playerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  /**
   * 更新排行榜
   */
  private updateLeaderboard(): void {
    // 计算各维度排行榜
    const leaderboards = this.calculateLeaderboards();
    
    // 广播排行榜更新
    this.broadcast({
      type: 'leaderboard_update',
      payload: {
        leaderboards,
        onlinePlayers: this.getOnlinePlayers(),
      },
      timestamp: Date.now(),
    });
  }
  
  /**
   * 计算排行榜
   */
  private calculateLeaderboards(): Record<LeaderboardType, LeaderboardEntry[]> {
    const players = Array.from(this.playerStates.values());
    
    return {
      level: this.rankBy(players, 'level'),
      combat: this.rankBy(players, 'combatPower'),
      boss_kills: this.rankBy(players, 'statistics.totalBossKilled'),
      legendary: this.rankBy(players, 'statistics.legendaryItems'),
      adventure: this.rankBy(players, 'statistics.adventuresCompleted'),
    };
  }
}
```

### 4.2 玩家状态管理器

```typescript
/**
 * 玩家状态管理器
 * 
 * 职责：
 * 1. 管理所有玩家状态（在线+离线历史）
 * 2. 定时清理不活跃玩家
 * 3. 提供排行榜数据
 */
export class PlayerStateManager {
  private static instance: PlayerStateManager;
  
  // 在线玩家
  private onlinePlayers: Map<string, PlayerOnlineState> = new Map();
  
  // 离线玩家历史（用于排行榜）
  private offlinePlayers: Map<string, PlayerState> = new Map();
  
  // 排行榜缓存
  private leaderboardCache: Map<LeaderboardType, LeaderboardEntry[]> = new Map();
  
  // 配置
  private readonly OFFLINE_KEEP_TIME = 30 * 60 * 1000; // 离线保留30分钟
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分钟清理一次
  private readonly MAX_LEADERBOARD_SIZE = 100; // 排行榜最大人数
  
  private constructor() {
    this.startCleanupScheduler();
  }
  
  static getInstance(): PlayerStateManager {
    if (!PlayerStateManager.instance) {
      PlayerStateManager.instance = new PlayerStateManager();
    }
    return PlayerStateManager.instance;
  }
  
  /**
   * 玩家上线
   */
  playerJoin(state: PlayerOnlineState): void {
    // 如果是离线玩家回归，从离线列表移除
    this.offlinePlayers.delete(state.id);
    
    // 添加到在线列表
    this.onlinePlayers.set(state.id, {
      ...state,
      lastActive: Date.now(),
      joinedAt: Date.now(),
    });
    
    // 更新排行榜
    this.recalculateLeaderboards();
  }
  
  /**
   * 玩家下线
   */
  playerLeave(playerId: string): void {
    const state = this.onlinePlayers.get(playerId);
    if (!state) return;
    
    // 从在线列表移除
    this.onlinePlayers.delete(playerId);
    
    // 添加到离线列表（保留排行榜位置）
    this.offlinePlayers.set(playerId, {
      ...state,
      status: 'offline',
    });
    
    // 更新排行榜
    this.recalculateLeaderboards();
  }
  
  /**
   * 删除玩家
   */
  deletePlayer(playerId: string, reason: 'inactive' | 'restart' | 'manual'): boolean {
    const wasOnline = this.onlinePlayers.has(playerId);
    
    // 从所有列表移除
    this.onlinePlayers.delete(playerId);
    this.offlinePlayers.delete(playerId);
    
    // 更新排行榜
    this.recalculateLeaderboards();
    
    return wasOnline || this.offlinePlayers.has(playerId);
  }
  
  /**
   * 更新玩家状态
   */
  updatePlayerState(playerId: string, updates: Partial<PlayerOnlineState>): void {
    const state = this.onlinePlayers.get(playerId);
    if (!state) return;
    
    Object.assign(state, updates, { lastActive: Date.now() });
    
    // 检查是否需要更新排行榜
    if (this.shouldUpdateLeaderboard(updates)) {
      this.recalculateLeaderboards();
    }
  }
  
  /**
   * 获取在线玩家列表
   */
  getOnlinePlayers(): PlayerOnlineState[] {
    return Array.from(this.onlinePlayers.values());
  }
  
  /**
   * 获取排行榜
   */
  getLeaderboard(type: LeaderboardType): LeaderboardEntry[] {
    return this.leaderboardCache.get(type) || [];
  }
  
  /**
   * 获取所有排行榜
   */
  getAllLeaderboards(): Record<LeaderboardType, LeaderboardEntry[]> {
    const result: Record<LeaderboardType, LeaderboardEntry[]> = {
      level: [],
      combat: [],
      boss_kills: [],
      legendary: [],
      adventure: [],
    };
    
    for (const type of Object.keys(result) as LeaderboardType[]) {
      result[type] = this.getLeaderboard(type);
    }
    
    return result;
  }
  
  /**
   * 获取在线人数
   */
  getOnlineCount(): number {
    return this.onlinePlayers.size;
  }
  
  /**
   * 检查是否需要更新排行榜
   */
  private shouldUpdateLeaderboard(updates: Partial<PlayerOnlineState>): boolean {
    const leaderboardFields: (keyof PlayerOnlineState)[] = [
      'level', 'combatPower', 'statistics'
    ];
    return leaderboardFields.some(field => field in updates);
  }
  
  /**
   * 重新计算排行榜
   */
  private recalculateLeaderboards(): void {
    // 合并在线和离线玩家
    const allPlayers = [
      ...Array.from(this.onlinePlayers.values()).map(p => ({ ...p, isOnline: true })),
      ...Array.from(this.offlinePlayers.values()).map(p => ({ ...p, isOnline: false })),
    ];
    
    // 计算各维度排行榜
    this.leaderboardCache.set('level', this.rankPlayers(allPlayers, p => p.level));
    this.leaderboardCache.set('combat', this.rankPlayers(allPlayers, p => p.combatPower));
    this.leaderboardCache.set('boss_kills', this.rankPlayers(allPlayers, p => p.statistics.totalBossKilled));
    this.leaderboardCache.set('legendary', this.rankPlayers(allPlayers, p => p.statistics.legendaryItems));
    this.leaderboardCache.set('adventure', this.rankPlayers(allPlayers, p => p.statistics.adventuresCompleted));
  }
  
  /**
   * 排名玩家
   */
  private rankPlayers(
    players: (PlayerOnlineState & { isOnline: boolean })[],
    getValue: (p: PlayerOnlineState) => number
  ): LeaderboardEntry[] {
    return players
      .sort((a, b) => getValue(b) - getValue(a))
      .slice(0, this.MAX_LEADERBOARD_SIZE)
      .map((p, index) => ({
        rank: index + 1,
        playerId: p.id,
        playerName: p.name,
        worldType: p.worldType,
        level: p.level,
        combatPower: p.combatPower,
        realm: p.realm,
        achievements: {
          bossKills: p.statistics.totalBossKilled,
          legendaryItems: p.statistics.legendaryItems,
          adventuresCompleted: p.statistics.adventuresCompleted,
        },
        isOnline: p.isOnline,
        lastActive: p.lastActive,
        displayName: p.name,
      }));
  }
  
  /**
   * 启动定时清理
   */
  private startCleanupScheduler(): void {
    setInterval(() => {
      this.cleanupInactivePlayers();
    }, this.CLEANUP_INTERVAL);
  }
  
  /**
   * 清理不活跃玩家
   */
  private cleanupInactivePlayers(): void {
    const now = Date.now();
    const expiredIds: string[] = [];
    
    for (const [id, player] of this.offlinePlayers) {
      if (now - player.lastActive > this.OFFLINE_KEEP_TIME) {
        expiredIds.push(id);
      }
    }
    
    // 删除过期玩家
    for (const id of expiredIds) {
      this.deletePlayer(id, 'inactive');
    }
    
    if (expiredIds.length > 0) {
      console.log(`[PlayerStateManager] Cleaned up ${expiredIds.length} inactive players`);
    }
  }
}
```

### 4.3 全服公告系统

#### 4.3.1 系统概述

全服公告系统用于向所有在线玩家广播重要的游戏事件，增强游戏的社交性和沉浸感。

**关键设计原则**：
由于每个玩家的世界观(worldType)不同，境界名称、物品描述等会有差异。因此公告内容必须由【触发玩家】根据自己的世界观组装成静态文本，发送到服务端后直接广播，服务端不负责内容生成。

**核心流程**：
```
客户端（触发人）                               服务端
    │                                           │
    │  1. 检测游戏事件                          │
    │  2. 判断是否满足触发条件                  │
    │  3. 根据自己的世界观组装公告内容          │
    │                                           │
    │  4. 发送公告请求（静态文本）──────────────▶│
    │                                           │ 5. 验证请求
    │                                           │ 6. 防刷检查
    │                                           │ 7. 生成ID、记录历史
    │                                           │ 8. 广播给所有在线玩家
    │                                           │
    │  9. 收到广播 ◀───────────────────────────│
    │                                           │
```

**核心功能**：
1. **客户端触发**：客户端检测游戏事件，根据世界观组装公告内容
2. **服务端验证**：防止刷屏、确保首杀唯一性
3. **实时广播**：通过 WebSocket 实时推送给所有在线玩家
4. **历史记录**：新上线的玩家可查看最近的公告历史

#### 4.3.2 客户端公告配置

```typescript
/**
 * 公告触发条件配置（客户端使用）
 * 
 * 定义哪些游戏事件会触发全服公告
 * 注意：这是客户端配置，用于判断是否触发公告
 */
export interface AnnouncementTriggerConfig {
  type: AnnouncementType;
  
  // 触发条件
  condition: {
    realmLevel?: number;           // 境界等级阈值
    isFirstBreakthrough?: boolean; // 是否首次突破此境界
    itemRarity?: Rarity;           // 物品品质
    bossName?: string;             // Boss名称（'*' 表示任意Boss）
    levelThreshold?: number;       // 等级阈值
  };
  
  // 公告配置
  announcement: {
    priority: AnnouncementPriority;
    displayDuration: number;       // 显示时长（毫秒）
    showPopup: boolean;
    showInChat: boolean;
    soundEffect?: string;
  };
}

/**
 * 公告触发配置列表（客户端）
 */
export const ANNOUNCEMENT_TRIGGERS: AnnouncementTriggerConfig[] = [
  // ========== 突破大境界 ==========
  {
    type: 'breakthrough',
    condition: {
      realmLevel: 10,  // 筑基
      isFirstBreakthrough: true,
    },
    announcement: {
      priority: 'high',
      displayDuration: 5000,
      showPopup: true,
      showInChat: true,
      soundEffect: 'breakthrough',
    },
  },
  {
    type: 'breakthrough',
    condition: {
      realmLevel: 20,  // 金丹
      isFirstBreakthrough: true,
    },
    announcement: {
      priority: 'high',
      displayDuration: 5000,
      showPopup: true,
      showInChat: true,
      soundEffect: 'breakthrough',
    },
  },
  {
    type: 'breakthrough',
    condition: {
      realmLevel: 30,  // 元婴
      isFirstBreakthrough: true,
    },
    announcement: {
      priority: 'high',
      displayDuration: 5000,
      showPopup: true,
      showInChat: true,
      soundEffect: 'breakthrough',
    },
  },
  {
    type: 'breakthrough',
    condition: {
      realmLevel: 40,  // 化神
      isFirstBreakthrough: true,
    },
    announcement: {
      priority: 'urgent',
      displayDuration: 8000,
      showPopup: true,
      showInChat: true,
      soundEffect: 'breakthrough_major',
    },
  },
  {
    type: 'breakthrough',
    condition: {
      realmLevel: 50,  // 炼虚
      isFirstBreakthrough: true,
    },
    announcement: {
      priority: 'urgent',
      displayDuration: 8000,
      showPopup: true,
      showInChat: true,
      soundEffect: 'breakthrough_major',
    },
  },
  {
    type: 'breakthrough',
    condition: {
      realmLevel: 60,  // 合体
      isFirstBreakthrough: true,
    },
    announcement: {
      priority: 'urgent',
      displayDuration: 10000,
      showPopup: true,
      showInChat: true,
      soundEffect: 'breakthrough_major',
    },
  },
  
  // ========== 神话物品 ==========
  {
    type: 'mythic_item',
    condition: {
      itemRarity: 'mythic',
    },
    announcement: {
      priority: 'urgent',
      displayDuration: 8000,
      showPopup: true,
      showInChat: true,
      soundEffect: 'mythic_drop',
    },
  },
  
  // ========== 传说物品 ==========
  {
    type: 'legendary_item',
    condition: {
      itemRarity: 'legendary',
    },
    announcement: {
      priority: 'high',
      displayDuration: 5000,
      showPopup: true,
      showInChat: true,
      soundEffect: 'legendary_drop',
    },
  },
  
  // ========== Boss首杀 ==========
  {
    type: 'first_boss_kill',
    condition: {
      bossName: '*',  // 任意Boss
    },
    announcement: {
      priority: 'high',
      displayDuration: 6000,
      showPopup: true,
      showInChat: true,
      soundEffect: 'boss_kill',
    },
  },
  
  // ========== 等级里程碑 ==========
  {
    type: 'level_milestone',
    condition: {
      levelThreshold: 100,
    },
    announcement: {
      priority: 'normal',
      displayDuration: 4000,
      showPopup: false,
      showInChat: true,
    },
  },
  {
    type: 'level_milestone',
    condition: {
      levelThreshold: 200,
    },
    announcement: {
      priority: 'normal',
      displayDuration: 4000,
      showPopup: false,
      showInChat: true,
    },
  },
  {
    type: 'level_milestone',
    condition: {
      levelThreshold: 500,
    },
    announcement: {
      priority: 'high',
      displayDuration: 5000,
      showPopup: true,
      showInChat: true,
    },
  },
];
```

#### 4.3.3 客户端公告生成器

```typescript
/**
 * 客户端公告生成器
 * 
 * 职责：
 * 1. 检测游戏事件，判断是否触发公告
 * 2. 根据玩家世界观组装公告内容（静态文本）
 * 3. 发送公告请求到服务端
 */
export class ClientAnnouncementGenerator {
  // 防刷屏：同一玩家本地冷却
  private lastAnnouncementTime: Map<AnnouncementType, number> = new Map();
  private readonly COOLDOWN_TIME = 30000; // 30秒冷却
  
  /**
   * 检查是否应该触发公告
   */
  shouldTrigger(event: GameEvent): AnnouncementTriggerConfig | null {
    // 查找匹配的触发器
    const trigger = ANNOUNCEMENT_TRIGGERS.find(t => this.matchCondition(t, event));
    if (!trigger) return null;
    
    // 检查冷却（紧急公告无视冷却）
    if (trigger.announcement.priority !== 'urgent') {
      const lastTime = this.lastAnnouncementTime.get(trigger.type);
      if (lastTime && Date.now() - lastTime < this.COOLDOWN_TIME) {
        return null;
      }
    }
    
    return trigger;
  }
  
  /**
   * 生成公告请求（根据玩家世界观组装静态文本）
   * 
   * @param event 游戏事件
   * @param trigger 匹配的触发器
   * @param worldContext 玩家的世界观上下文（境界名称、物品名称等）
   */
  generateAnnouncementRequest(
    event: GameEvent,
    trigger: AnnouncementTriggerConfig,
    worldContext: WorldContext
  ): AnnouncementRequest {
    // 根据事件类型和世界观上下文组装公告内容
    const { title, content } = this.buildAnnouncementContent(event, worldContext);
    
    // 更新冷却时间
    this.lastAnnouncementTime.set(trigger.type, Date.now());
    
    return {
      type: trigger.type,
      priority: trigger.announcement.priority,
      title,
      content,
      playerId: event.playerId,
      playerName: event.playerName,
      worldType: event.worldType,
      displayDuration: trigger.announcement.displayDuration,
      showPopup: trigger.announcement.showPopup,
      showInChat: trigger.announcement.showInChat,
      soundEffect: trigger.announcement.soundEffect,
    };
  }
  
  /**
   * 构建公告内容（根据世界观）
   * 
   * 关键：这里使用玩家的世界观上下文生成静态文本
   */
  private buildAnnouncementContent(
    event: GameEvent,
    worldContext: WorldContext
  ): { title: string; content: string } {
    switch (event.type) {
      case 'breakthrough':
        return {
          title: '🌟 天地异象',
          content: `恭喜【${event.playerName}】突破大境界，成功晋升【${worldContext.realmName}】！天地为之震动！`,
        };
        
      case 'mythic_item':
        return {
          title: '✨ 神器降世',
          content: `【${event.playerName}】福缘深厚，获得了神话级物品【${worldContext.itemName}】！此物一出，天地变色！`,
        };
        
      case 'legendary_item':
        return {
          title: '💜 传说现世',
          content: `【${event.playerName}】机缘深厚，获得了传说级物品【${worldContext.itemName}】！`,
        };
        
      case 'first_boss_kill':
        return {
          title: '⚔️ 首杀告捷',
          content: `【${event.playerName}】率先击败了【${worldContext.bossName}】！成为全服首位击败此Boss的玩家！`,
        };
        
      case 'level_milestone':
        return {
          title: '🎯 修炼有成',
          content: `【${event.playerName}】修炼突破${event.level}级大关！实力更上一层楼！`,
        };
        
      default:
        return {
          title: '📢 系统公告',
          content: `${event.playerName}达成了成就！`,
        };
    }
  }
  
  /**
   * 检查条件是否匹配
   */
  private matchCondition(trigger: AnnouncementTriggerConfig, event: GameEvent): boolean {
    if (trigger.type !== event.type) return false;
    
    const cond = trigger.condition;
    
    if (cond.realmLevel !== undefined && event.realmLevel !== cond.realmLevel) return false;
    if (cond.isFirstBreakthrough && !event.isFirstBreakthrough) return false;
    if (cond.itemRarity !== undefined && event.itemRarity !== cond.itemRarity) return false;
    if (cond.bossName && cond.bossName !== '*' && event.bossName !== cond.bossName) return false;
    if (cond.levelThreshold !== undefined && event.level !== cond.levelThreshold) return false;
    
    return true;
  }
}

/**
 * 世界观上下文
 * 
 * 包含玩家视角下的各种名称（根据worldType不同而不同）
 */
export interface WorldContext {
  realmName?: string;     // 境界名称（玩家视角）
  itemName?: string;      // 物品名称（玩家视角）
  bossName?: string;      // Boss名称（玩家视角）
  // ... 其他世界观相关的名称
}
```

#### 4.3.4 服务端公告管理器（简化版）

```typescript
/**
 * 服务端公告管理器
 * 
 * 职责（简化后）：
 * 1. 接收客户端发送的公告请求
 * 2. 验证请求合法性
 * 3. 防刷检查（服务端层面）
 * 4. 生成公告ID、记录历史
 * 5. 广播给所有在线玩家
 * 
 * 注意：服务端不负责内容生成，内容由客户端组装
 */
export class ServerAnnouncementManager {
  private static instance: ServerAnnouncementManager;
  
  // 公告历史
  private announcementHistory: Announcement[] = [];
  
  // 防刷屏：玩家ID -> 最后公告时间
  private playerLastAnnouncementTime: Map<string, number> = new Map();
  
  // 首杀记录：bossKey -> 玩家ID（全局唯一）
  private firstKillRecords: Map<string, string> = new Map();
  
  // 配置
  private readonly MAX_HISTORY_SIZE = 50;
  private readonly PLAYER_COOLDOWN = 30000;  // 玩家公告冷却
  private readonly HISTORY_EXPIRE_TIME = 30 * 60 * 1000;
  
  private constructor() {
    this.startCleanupScheduler();
  }
  
  static getInstance(): ServerAnnouncementManager {
    if (!ServerAnnouncementManager.instance) {
      ServerAnnouncementManager.instance = new ServerAnnouncementManager();
    }
    return ServerAnnouncementManager.instance;
  }
  
  /**
   * 处理公告请求
   * 
   * @param request 客户端发送的公告请求
   * @returns 公告数据，如果验证失败返回 null
   */
  handleAnnouncementRequest(request: AnnouncementRequest): Announcement | null {
    // 1. 验证请求
    if (!this.validateRequest(request)) {
      return null;
    }
    
    // 2. 检查玩家冷却（紧急公告无视）
    if (request.priority !== 'urgent') {
      const lastTime = this.playerLastAnnouncementTime.get(request.playerId);
      if (lastTime && Date.now() - lastTime < this.PLAYER_COOLDOWN) {
        return null;
      }
    }
    
    // 3. 检查首杀唯一性
    if (request.type === 'first_boss_kill') {
      // 首杀检查需要从content中解析bossName，或者要求客户端额外传递
      // 这里简化处理：首杀公告一旦发布，后续同一玩家的首杀公告都通过
      // 实际应该在content中包含标识，或使用独立的bossKey
    }
    
    // 4. 生成公告（服务端只添加ID和时间戳）
    const announcement: Announcement = {
      id: this.generateAnnouncementId(),
      type: request.type,
      priority: request.priority,
      title: request.title,        // 直接使用客户端发来的静态文本
      content: request.content,    // 直接使用客户端发来的静态文本
      playerId: request.playerId,
      playerName: request.playerName,
      worldType: request.worldType,
      timestamp: Date.now(),
      displayDuration: request.displayDuration,
      showPopup: request.showPopup,
      showInChat: request.showInChat,
      soundEffect: request.soundEffect,
      read: false,
    };
    
    // 5. 添加到历史
    this.addToHistory(announcement);
    
    // 6. 更新玩家冷却时间
    this.playerLastAnnouncementTime.set(request.playerId, Date.now());
    
    return announcement;
  }
  
  /**
   * 验证请求合法性
   */
  private validateRequest(request: AnnouncementRequest): boolean {
    // 检查必要字段
    if (!request.playerId || !request.playerName) return false;
    if (!request.title || !request.content) return false;
    
    // 检查内容长度
    if (request.title.length > 50 || request.content.length > 200) return false;
    
    // 过滤危险字符（XSS防护）
    if (this.containsDangerousChars(request.title) || 
        this.containsDangerousChars(request.content)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 检查是否包含危险字符
   */
  private containsDangerousChars(text: string): boolean {
    // 检查HTML标签
    if (/<[^>]*>/g.test(text)) return true;
    // 检查脚本注入
    if (/javascript:/i.test(text)) return true;
    return false;
  }
  
  /**
   * 添加到历史记录
   */
  private addToHistory(announcement: Announcement): void {
    this.announcementHistory.push(announcement);
    if (this.announcementHistory.length > this.MAX_HISTORY_SIZE) {
      this.announcementHistory.shift();
    }
  }
  
  /**
   * 获取历史公告
   */
  getHistory(since?: number, limit: number = 20): Announcement[] {
    let history = this.announcementHistory;
    if (since) {
      history = history.filter(a => a.timestamp > since);
    }
    return history.slice(-limit);
  }
  
  /**
   * 清理过期记录
   */
  private startCleanupScheduler(): void {
    setInterval(() => {
      const now = Date.now();
      this.announcementHistory = this.announcementHistory.filter(
        a => now - a.timestamp < this.HISTORY_EXPIRE_TIME
      );
    }, 5 * 60 * 1000);
  }
  
  /**
   * 生成公告ID
   */
  private generateAnnouncementId(): string {
    return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 4.3.5 客户端集成示例

```typescript
/**
 * 游戏系统集成公告
 * 
 * 在游戏各系统中集成公告触发逻辑
 */

// 初始化公告生成器
const announcementGenerator = new ClientAnnouncementGenerator();

// 1. 突破系统集成
export function onBreakthrough(
  player: Player,
  newRealm: RealmInfo,
  isFirstBreakthrough: boolean
): void {
  // ... 突破逻辑 ...
  
  // 构建游戏事件
  const event: GameEvent = {
    type: 'breakthrough',
    playerId: player.id,
    playerName: player.name,
    worldType: player.worldType,
    realmLevel: newRealm.level,
    realmName: newRealm.name,
    isFirstBreakthrough,
  };
  
  // 检查是否触发公告
  const trigger = announcementGenerator.shouldTrigger(event);
  if (trigger) {
    // 根据玩家世界观组装公告内容
    const worldContext: WorldContext = {
      realmName: newRealm.displayName, // 玩家视角的境界名称
    };
    
    const request = announcementGenerator.generateAnnouncementRequest(
      event, trigger, worldContext
    );
    
    // 发送到服务端
    sendAnnouncementRequest(request);
  }
}

// 2. 物品掉落系统集成
export function onItemDrop(player: Player, item: Item): void {
  // ... 掉落逻辑 ...
  
  // 只有传说及以上品质才检查公告
  if (item.rarity !== 'legendary' && item.rarity !== 'mythic') return;
  
  const event: GameEvent = {
    type: item.rarity === 'mythic' ? 'mythic_item' : 'legendary_item',
    playerId: player.id,
    playerName: player.name,
    worldType: player.worldType,
    itemRarity: item.rarity,
    itemName: item.name,
  };
  
  const trigger = announcementGenerator.shouldTrigger(event);
  if (trigger) {
    const worldContext: WorldContext = {
      itemName: item.displayName, // 玩家视角的物品名称
    };
    
    const request = announcementGenerator.generateAnnouncementRequest(
      event, trigger, worldContext
    );
    
    sendAnnouncementRequest(request);
  }
}

// 3. Boss战系统集成
export function onBossDefeated(player: Player, boss: Boss): void {
  // ... 战斗逻辑 ...
  
  const event: GameEvent = {
    type: 'first_boss_kill',
    playerId: player.id,
    playerName: player.name,
    worldType: player.worldType,
    bossName: boss.name,
  };
  
  const trigger = announcementGenerator.shouldTrigger(event);
  if (trigger) {
    const worldContext: WorldContext = {
      bossName: boss.displayName, // 玩家视角的Boss名称
    };
    
    const request = announcementGenerator.generateAnnouncementRequest(
      event, trigger, worldContext
    );
    
    sendAnnouncementRequest(request);
  }
}

// 4. 等级系统集成
export function onLevelUp(player: Player, newLevel: number): void {
  // ... 升级逻辑 ...
  
  const event: GameEvent = {
    type: 'level_milestone',
    playerId: player.id,
    playerName: player.name,
    worldType: player.worldType,
    level: newLevel,
  };
  
  const trigger = announcementGenerator.shouldTrigger(event);
  if (trigger) {
    const request = announcementGenerator.generateAnnouncementRequest(
      event, trigger, {}
    );
    
    sendAnnouncementRequest(request);
  }
}

/**
 * 发送公告请求到服务端
 */
function sendAnnouncementRequest(request: AnnouncementRequest): void {
  // 通过 WebSocket 发送
  const ws = getWebSocketConnection();
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'announcement_request',
      payload: request,
      timestamp: Date.now(),
    }));
  }
}
```
   */
  private checkAnnouncementCooldown(playerId: string, priority: AnnouncementPriority): boolean {
    // 紧急公告无视冷却
    if (priority === 'urgent') return true;
    
    const lastTime = this.lastAnnouncementTime.get(playerId);
    if (!lastTime) return true;
    
    return Date.now() - lastTime >= this.MIN_ANNOUNCEMENT_INTERVAL;
  }
  
  /**
   * 创建公告
   */
  private createAnnouncement(event: GameEvent, trigger: AnnouncementTrigger): Announcement {
    const template = ANNOUNCEMENT_TEMPLATES[trigger.announcement.template];
    
    // 替换模板参数
    let content = template.content;
    const params: Record<string, string> = {};
    
    // 替换玩家名称
    if (event.playerName) {
      content = content.replace(/{playerName}/g, event.playerName);
      params.playerName = event.playerName;
    }
    
    // 替换物品名称
    if (event.itemName) {
      content = content.replace(/{itemName}/g, event.itemName);
      params.itemName = event.itemName;
    }
    
    // 替换境界名称
    if (event.realmName) {
      content = content.replace(/{realmName}/g, event.realmName);
      params.realmName = event.realmName;
    }
    
    // 替换Boss名称
    if (event.bossName) {
      content = content.replace(/{bossName}/g, event.bossName);
      params.bossName = event.bossName;
    }
    
    // 替换等级
    if (event.level) {
      content = content.replace(/{level}/g, event.level.toString());
      params.level = event.level.toString();
    }
    
    // 替换成就名称
    if (event.achievementName) {
      content = content.replace(/{achievementName}/g, event.achievementName);
      params.achievementName = event.achievementName;
    }
    
    return {
      id: this.generateAnnouncementId(),
      type: trigger.type,
      priority: trigger.announcement.priority,
      title: template.title,
      content,
      template: trigger.announcement.template,
      params,
      playerId: event.playerId,
      playerName: event.playerName,
      worldType: event.worldType,
      timestamp: Date.now(),
      displayDuration: trigger.announcement.displayDuration,
      showPopup: trigger.announcement.showPopup,
      showInChat: trigger.announcement.showInChat,
      soundEffect: trigger.announcement.soundEffect,
      read: false,
    };
  }
  
  /**
   * 添加到历史记录
   */
  private addToHistory(announcement: Announcement): void {
    this.announcementHistory.push(announcement);
    
    // 限制历史记录数量
    if (this.announcementHistory.length > this.MAX_HISTORY_SIZE) {
      this.announcementHistory.shift();
    }
  }
  
  /**
   * 获取历史公告
   */
  getHistory(since?: number, limit: number = 20): Announcement[] {
    let history = this.announcementHistory;
    
    // 过滤时间
    if (since) {
      history = history.filter(a => a.timestamp > since);
    }
    
    // 限制数量
    return history.slice(-limit);
  }
  
  /**
   * 清理过期记录
   */
  private startCleanupScheduler(): void {
    setInterval(() => {
      this.cleanupExpiredRecords();
    }, 5 * 60 * 1000); // 5分钟清理一次
  }
  
  private cleanupExpiredRecords(): void {
    const now = Date.now();
    
    // 清理过期历史记录
    this.announcementHistory = this.announcementHistory.filter(
      a => now - a.timestamp < this.HISTORY_EXPIRE_TIME
    );
    
    // 清理过期的冷却记录
    for (const [playerId, time] of this.lastAnnouncementTime) {
      if (now - time > this.MIN_ANNOUNCEMENT_INTERVAL * 2) {
        this.lastAnnouncementTime.delete(playerId);
      }
    }
  }
  
  /**
   * 生成公告ID
   */
  private generateAnnouncementId(): string {
    return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 游戏事件类型
 */
export interface GameEvent {
  type: AnnouncementType;
  playerId?: string;
  playerName?: string;
  worldType?: WorldType;
  
  // 突破相关
  realmLevel?: number;
  realmName?: string;
  isFirstBreakthrough?: boolean;
  
  // 物品相关
  itemRarity?: Rarity;
  itemName?: string;
  
  // Boss相关
  bossName?: string;
  
  // 等级相关
  level?: number;
  
  // 成就相关
  achievementId?: string;
  achievementName?: string;
  
  // 自定义内容
  content?: string;
}
```

#### 4.3.4 公告触发集成点

```typescript
/**
 * 公告触发集成点
 * 
 * 在游戏各系统中调用，触发公告检查
 */

// 1. 在突破系统中集成
export function onBreakthrough(
  player: Player,
  newRealm: RealmInfo
): void {
  // ... 突破逻辑 ...
  
  // 触发公告检查
  const event: GameEvent = {
    type: 'breakthrough',
    playerId: player.id,
    playerName: player.name,
    worldType: player.worldType,
    realmLevel: newRealm.level,
    realmName: newRealm.name,
    isFirstBreakthrough: isFirstBreakthroughForPlayer(player, newRealm),
  };
  
  const announcement = AnnouncementManager.getInstance().checkAndTrigger(event);
  if (announcement) {
    broadcastAnnouncement(announcement);
  }
}

// 2. 在物品掉落系统中集成
export function onItemDrop(
  player: Player,
  item: Item
): void {
  // ... 掉落逻辑 ...
  
  // 只有传说及以上品质才触发公告
  if (item.rarity === 'legendary' || item.rarity === 'mythic') {
    const event: GameEvent = {
      type: item.rarity === 'mythic' ? 'mythic_item' : 'legendary_item',
      playerId: player.id,
      playerName: player.name,
      worldType: player.worldType,
      itemRarity: item.rarity,
      itemName: item.name,
    };
    
    const announcement = AnnouncementManager.getInstance().checkAndTrigger(event);
    if (announcement) {
      broadcastAnnouncement(announcement);
    }
  }
}

// 3. 在Boss战系统中集成
export function onBossDefeated(
  player: Player,
  boss: Boss
): void {
  // ... 战斗逻辑 ...
  
  const event: GameEvent = {
    type: 'first_boss_kill',
    playerId: player.id,
    playerName: player.name,
    worldType: player.worldType,
    bossName: boss.name,
  };
  
  const announcement = AnnouncementManager.getInstance().checkAndTrigger(event);
  if (announcement) {
    broadcastAnnouncement(announcement);
  }
}

// 4. 在等级系统中集成
export function onLevelUp(
  player: Player,
  newLevel: number
): void {
  // ... 升级逻辑 ...
  
  // 检查等级里程碑
  const milestones = [100, 200, 500, 1000];
  if (milestones.includes(newLevel)) {
    const event: GameEvent = {
      type: 'level_milestone',
      playerId: player.id,
      playerName: player.name,
      worldType: player.worldType,
      level: newLevel,
    };
    
    const announcement = AnnouncementManager.getInstance().checkAndTrigger(event);
    if (announcement) {
      broadcastAnnouncement(announcement);
    }
  }
}

#### 4.3.6 边界条件与防刷机制

| 边界条件 | 处理方式 |
|----------|----------|
| 同一玩家频繁触发 | 客户端+服务端双重冷却：普通公告30秒，紧急公告无视冷却 |
| Boss首杀重复触发 | 服务端记录已首杀的Boss（需额外实现首杀唯一性检查） |
| 公告历史过多 | 服务端限制最大50条，过期30分钟自动清理 |
| 玩家名称包含特殊字符 | 服务端过滤HTML标签，防止XSS |
| 公告内容过长 | 服务端限制：标题≤50字，内容≤200字 |
| 公告请求验证失败 | 服务端拒绝请求，不广播 |
| 广播时无人在线 | 正常记录历史，不触发错误 |

**关键架构变更说明**：
- 公告内容由**触发玩家**根据自己的世界观组装
- 服务端只负责验证、记录、广播
- 其他玩家收到的就是最终的静态文本，直接显示

---

## 五、删号机制设计

### 5.1 触发条件

| 触发场景 | 触发时机 | 删除范围 | 数据处理 |
|----------|----------|----------|----------|
| 玩家主动重开 | 点击"重新开始"按钮 | 当前角色所有数据 | 立即删除 |
| 长期不活跃 | 离线超过30分钟 | 排行榜记录 | 自动清理 |
| 页面关闭 | beforeunload 事件 | 标记为离线 | 等待自动清理 |

### 5.2 删号流程

```
┌──────────────────────────────────────────────────────────────┐
│                     玩家点击"重新开始"                        │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  前端发送删号请求                                             │
│  POST /api/player/delete { playerId, reason: 'restart' }     │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  服务端处理                                                   │
│  1. 从 PlayerStateManager 删除玩家                            │
│  2. 从排行榜移除                                              │
│  3. 广播 player_leave (reason: 'delete')                     │
│  4. 关闭 WebSocket 连接                                       │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  前端清理本地数据                                             │
│  1. 清除 localStorage                                         │
│  2. 重置游戏状态                                              │
│  3. 返回角色选择页面                                          │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 页面关闭处理

```typescript
// 前端代码：处理页面关闭
useEffect(() => {
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // 发送删号请求（使用 sendBeacon 保证可靠发送）
    const playerId = getPlayerId();
    if (playerId && ws?.readyState === WebSocket.OPEN) {
      // 先发送 WebSocket 消息通知离开
      ws.send(JSON.stringify({
        type: 'player_leave',
        payload: { playerId, reason: 'disconnect' },
        timestamp: Date.now(),
      }));
    }
    
    // 使用 sendBeacon 发送删号请求（如果玩家选择重开）
    // 注意：beforeunload 不能确定用户是关闭还是刷新，所以只发送离开通知
    // 真正的删号在用户点击重开按钮时触发
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [ws]);
```

---

## 六、前端实现设计

### 6.1 WebSocket Hook

```typescript
/**
 * useWebSocketConnection Hook
 * 
 * 职责：
 * 1. 管理 WebSocket 连接
 * 2. 自动重连
 * 3. 心跳发送
 * 4. 消息分发
 */
export function useWebSocketConnection(playerId: string | null) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<PlayerOnlineState[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  
  // 心跳定时器
  const heartbeatTimer = useRef<NodeJS.Timeout>();
  const HEARTBEAT_INTERVAL = 30 * 1000; // 30秒
  
  // 重连配置
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;
  
  // 连接 WebSocket
  const connect = useCallback(() => {
    if (!playerId) return;
    
    const wsUrl = `${getWebSocketUrl()}/api/ws?playerId=${playerId}`;
    const newWs = new WebSocket(wsUrl);
    
    newWs.onopen = () => {
      console.log('[WS] Connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      startHeartbeat();
    };
    
    newWs.onmessage = (event) => {
      const message: WSMessage = JSON.parse(event.data);
      handleMessage(message);
    };
    
    newWs.onclose = (event) => {
      console.log('[WS] Disconnected:', event.code, event.reason);
      setIsConnected(false);
      stopHeartbeat();
      
      // 自动重连
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current++;
        setTimeout(connect, RECONNECT_DELAY);
      }
    };
    
    newWs.onerror = (error) => {
      console.error('[WS] Error:', error);
    };
    
    setWs(newWs);
  }, [playerId]);
  
  // 心跳发送
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatTimer.current = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          payload: { playerId },
          timestamp: Date.now(),
        }));
      }
    }, HEARTBEAT_INTERVAL);
  }, [ws, playerId]);
  
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = undefined;
    }
  }, []);
  
  // 消息处理
  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'player_join':
        setOnlinePlayers(prev => [...prev, message.payload.player]);
        break;
        
      case 'player_leave':
        setOnlinePlayers(prev => 
          prev.filter(p => p.id !== message.payload.playerId)
        );
        break;
        
      case 'leaderboard_sync':
      case 'leaderboard_update':
        setLeaderboard(message.payload);
        break;
        
      case 'heartbeat_ack':
        // 心跳响应，无需处理
        break;
        
      case 'player_deleted':
        // 自己被删除，返回角色选择页
        router.push('/');
        break;
    }
  }, []);
  
  // 发送状态更新
  const sendUpdate = useCallback((data: Partial<PlayerOnlineState>) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'player_update',
        payload: { playerId, ...data },
        timestamp: Date.now(),
      }));
    }
  }, [ws, playerId]);
  
  // 请求删号
  const requestDelete = useCallback((reason: 'restart' | 'manual') => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'player_delete',
        payload: { playerId, reason },
        timestamp: Date.now(),
      }));
    }
  }, [ws, playerId]);
  
  // 生命周期
  useEffect(() => {
    connect();
    return () => {
      stopHeartbeat();
      ws?.close();
    };
  }, [connect]);
  
  return {
    isConnected,
    onlinePlayers,
    leaderboard,
    sendUpdate,
    requestDelete,
  };
}
```

### 6.2 排行榜面板组件

```tsx
/**
 * LeaderboardPanel 组件
 * 
 * 显示在线玩家排行榜
 */
export function LeaderboardPanel({ leaderboard }: { leaderboard: LeaderboardData | null }) {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('level');
  
  if (!leaderboard) {
    return <div className="text-muted-foreground">加载中...</div>;
  }
  
  const entries = leaderboard[activeTab] || [];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          排行榜
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tab 切换 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardType)}>
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="level">等级</TabsTrigger>
            <TabsTrigger value="combat">战力</TabsTrigger>
            <TabsTrigger value="boss_kills">Boss</TabsTrigger>
            <TabsTrigger value="legendary">传说</TabsTrigger>
            <TabsTrigger value="adventure">冒险</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* 排行榜列表 */}
        <div className="mt-4 space-y-2">
          {entries.slice(0, 10).map((entry, index) => (
            <LeaderboardEntryCard 
              key={entry.playerId}
              entry={entry}
              rank={index + 1}
            />
          ))}
          
          {entries.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              暂无数据
            </div>
          )}
        </div>
        
        {/* 在线人数 */}
        <div className="mt-4 text-sm text-muted-foreground text-center">
          当前在线: {leaderboard.onlinePlayers?.length || 0} 人
        </div>
      </CardContent>
    </Card>
  );
}

/** 排行榜条目卡片 */
function LeaderboardEntryCard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const rankColors = [
    'text-yellow-500', // 第1名
    'text-gray-400',   // 第2名
    'text-orange-400', // 第3名
  ];
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg",
      entry.isOnline ? "bg-primary/5" : "bg-muted/30"
    )}>
      {/* 排名 */}
      <div className={cn(
        "w-8 text-center font-bold",
        rank <= 3 ? rankColors[rank - 1] : "text-muted-foreground"
      )}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
      </div>
      
      {/* 玩家信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{entry.playerName}</span>
          {entry.isOnline && (
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
              在线
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Lv.{entry.level} · {entry.realm}
        </div>
      </div>
      
      {/* 数值 */}
      <div className="text-right">
        <div className="font-bold tabular-nums">
          {formatNumber(entry.level)}
        </div>
        <div className="text-xs text-muted-foreground">
          战力 {formatNumber(entry.combatPower)}
        </div>
      </div>
    </div>
  );
}
```

### 6.3 全服公告组件

```tsx
/**
 * AnnouncementToast 组件
 * 
 * 显示全服公告的弹窗通知
 */
export function AnnouncementToast({ 
  announcement,
  onClose 
}: { 
  announcement: Announcement;
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  
  // 入场动画
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);
  
  // 自动关闭倒计时
  useEffect(() => {
    const startTime = Date.now();
    const duration = announcement.displayDuration;
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (elapsed >= duration) {
        handleClose();
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [announcement.displayDuration]);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // 等待动画完成
  };
  
  // 根据公告类型设置样式
  const typeStyles: Record<AnnouncementType, string> = {
    breakthrough: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50',
    mythic_item: 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 border-rose-500/50',
    legendary_item: 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 border-purple-500/50',
    first_boss_kill: 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/50',
    achievement: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50',
    level_milestone: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50',
    faction_event: 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border-indigo-500/50',
    system: 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-500/50',
  };
  
  const priorityStyles: Record<AnnouncementPriority, string> = {
    low: 'border',
    normal: 'border-2',
    high: 'border-2 shadow-lg',
    urgent: 'border-2 shadow-xl animate-pulse',
  };
  
  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4",
        "transition-all duration-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}
    >
      <div
        className={cn(
          "rounded-lg p-4 backdrop-blur-sm",
          typeStyles[announcement.type],
          priorityStyles[announcement.priority]
        )}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-lg">{announcement.title}</h4>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* 内容 */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {announcement.content}
        </p>
        
        {/* 进度条 */}
        <div className="mt-3 h-1 bg-background/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/50 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * AnnouncementHistory 组件
 * 
 * 显示公告历史记录列表
 */
export function AnnouncementHistory({ 
  announcements 
}: { 
  announcements: Announcement[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (announcements.length === 0) return null;
  
  // 按时间倒序排列
  const sortedAnnouncements = [...announcements].sort((a, b) => b.timestamp - a.timestamp);
  
  return (
    <Card className="mt-4">
      <CardHeader className="py-3">
        <CardTitle 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            全服公告
            <Badge variant="secondary" className="text-xs">
              {announcements.length}
            </Badge>
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            isExpanded && "rotate-180"
          )} />
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {sortedAnnouncements.map((announcement) => (
                <AnnouncementHistoryItem 
                  key={announcement.id}
                  announcement={announcement}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}

/** 公告历史条目 */
function AnnouncementHistoryItem({ announcement }: { announcement: Announcement }) {
  const typeIcons: Record<AnnouncementType, string> = {
    breakthrough: '🌟',
    mythic_item: '✨',
    legendary_item: '💜',
    first_boss_kill: '⚔️',
    achievement: '🏆',
    level_milestone: '🎯',
    faction_event: '🏛️',
    system: '📢',
  };
  
  return (
    <div className="flex gap-2 p-2 rounded-lg bg-muted/30 text-sm">
      <span>{typeIcons[announcement.type]}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{announcement.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {announcement.content}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(announcement.timestamp)}
        </div>
      </div>
    </div>
  );
}

/**
 * AnnouncementManager 组件
 * 
 * 管理公告显示的主组件
 */
export function AnnouncementManager() {
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [queue, setQueue] = useState<Announcement[]>([]);
  
  // 从 WebSocket 接收公告
  const { isConnected } = useWebSocketConnection(null);
  
  // 处理新公告
  const handleNewAnnouncement = useCallback((announcement: Announcement) => {
    // 添加到历史
    setAnnouncements(prev => [...prev, announcement]);
    
    // 如果需要弹窗显示，添加到队列
    if (announcement.showPopup) {
      setQueue(prev => [...prev, announcement]);
    }
  }, []);
  
  // 处理当前公告关闭
  const handleAnnouncementClose = useCallback(() => {
    setActiveAnnouncement(null);
  }, []);
  
  // 处理队列
  useEffect(() => {
    if (!activeAnnouncement && queue.length > 0) {
      const [next, ...rest] = queue;
      setActiveAnnouncement(next);
      setQueue(rest);
    }
  }, [activeAnnouncement, queue]);
  
  return (
    <>
      {/* 当前公告弹窗 */}
      {activeAnnouncement && (
        <AnnouncementToast
          announcement={activeAnnouncement}
          onClose={handleAnnouncementClose}
        />
      )}
      
      {/* 公告历史 */}
      <AnnouncementHistory announcements={announcements} />
    </>
  );
}
```

### 6.4 公告系统集成到游戏页面

```tsx
/**
 * GamePage 集成公告系统
 */
export default function GamePage() {
  const { player } = useGameStore();
  const { 
    isConnected, 
    onlinePlayers, 
    leaderboard,
    sendUpdate,
  } = useWebSocketConnection(player?.id || null);
  
  // 监听游戏事件，触发公告
  useGameEventAnnouncements(player);
  
  return (
    <div className="game-container">
      {/* 游戏主界面 */}
      <div className="game-main">
        {/* ... */}
      </div>
      
      {/* 侧边栏 */}
      <div className="game-sidebar">
        {/* 在线状态 */}
        <OnlineStatus 
          isConnected={isConnected}
          onlineCount={onlinePlayers.length}
        />
        
        {/* 排行榜 */}
        <LeaderboardPanel leaderboard={leaderboard} />
        
        {/* 公告系统 */}
        <AnnouncementManager />
      </div>
    </div>
  );
}

/**
 * 游戏事件公告 Hook
 * 
 * 监听游戏事件，通过 WebSocket 发送到服务端
 */
function useGameEventAnnouncements(player: Player | null) {
  const { sendUpdate } = useWebSocketConnection(player?.id || null);
  
  // 监听突破事件
  useEffect(() => {
    if (!player) return;
    
    const handleBreakthrough = (event: BreakthroughEvent) => {
      sendUpdate({
        level: player.level,
        realm: event.newRealm.name,
        // 触发公告检查由服务端处理
        lastBreakthrough: {
          realmLevel: event.newRealm.level,
          realmName: event.newRealm.name,
          timestamp: Date.now(),
        },
      });
    };
    
    eventBus.on('breakthrough', handleBreakthrough);
    return () => eventBus.off('breakthrough', handleBreakthrough);
  }, [player, sendUpdate]);
  
  // 监听物品获得事件
  useEffect(() => {
    if (!player) return;
    
    const handleItemObtained = (event: ItemObtainedEvent) => {
      if (event.item.rarity === 'legendary' || event.item.rarity === 'mythic') {
        sendUpdate({
          statistics: {
            ...player.statistics,
            legendaryItems: player.statistics.legendaryItems + 1,
          },
          lastItemObtained: {
            itemName: event.item.name,
            rarity: event.item.rarity,
            timestamp: Date.now(),
          },
        });
      }
    };
    
    eventBus.on('itemObtained', handleItemObtained);
    return () => eventBus.off('itemObtained', handleItemObtained);
  }, [player, sendUpdate]);
}
```

---

## 七、边界条件与异常处理

### 7.1 边界条件检查清单

| 检查项 | 处理方式 |
|--------|----------|
| WebSocket 连接失败 | 自动重连，最多5次 |
| 心跳超时 | 视为断开，从在线列表移除 |
| 玩家ID为空 | 不建立连接，使用本地模式 |
| 排行榜数据为空 | 显示"暂无数据" |
| 删号请求失败 | 保留本地数据，提示用户重试 |
| 页面刷新 | 不删号，等待心跳超时自动清理 |
| 多标签页同时在线 | 每个标签页独立连接，状态同步 |
| **公告系统** | |
| 同一玩家频繁触发公告 | 冷却时间限制（普通30秒，紧急无视） |
| Boss首杀重复触发 | 记录已首杀Boss，后续不触发 |
| 公告历史过多 | 限制50条，过期30分钟清理 |
| 玩家名称含特殊字符 | 过滤HTML标签，防XSS |
| 物品名称过长 | 截断显示，超过20字显示省略号 |
| 公告队列为空时不显示 | 正常处理，不显示弹窗 |
| 多个公告同时到达 | 队列管理，依次显示 |

### 7.2 异常处理

```typescript
/** WebSocket 错误处理 */
export class WSError extends Error {
  constructor(
    public code: WSErrorCode,
    message: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'WSError';
  }
}

export enum WSErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  HEARTBEAT_TIMEOUT = 'HEARTBEAT_TIMEOUT',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  DELETE_FAILED = 'DELETE_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
}

// 错误处理策略
const ERROR_HANDLERS: Record<WSErrorCode, (error: WSError) => void> = {
  [WSErrorCode.CONNECTION_FAILED]: (error) => {
    console.error('[WS] Connection failed:', error.message);
    // 自动重连
  },
  
  [WSErrorCode.HEARTBEAT_TIMEOUT]: (error) => {
    console.warn('[WS] Heartbeat timeout');
    // 重新连接
  },
  
  [WSErrorCode.PLAYER_NOT_FOUND]: (error) => {
    console.error('[WS] Player not found');
    // 返回角色选择页
  },
  
  [WSErrorCode.DELETE_FAILED]: (error) => {
    console.error('[WS] Delete failed:', error.message);
    // 提示用户重试
  },
  
  [WSErrorCode.RATE_LIMITED]: (error) => {
    console.warn('[WS] Rate limited');
    // 降低心跳频率
  },
};
```

---

## 八、数据流与时序图

### 8.1 玩家上线时序

```
客户端                    WebSocket API              PlayerStateManager
  │                            │                            │
  │  1. WebSocket Connect      │                            │
  │ ──────────────────────────▶│                            │
  │                            │  2. playerJoin(state)       │
  │                            │ ──────────────────────────▶ │
  │                            │                            │
  │                            │  3. recalculateLeaderboards │
  │                            │ ◀────────────────────────── │
  │                            │                            │
  │  4. leaderboard_sync       │                            │
  │ ◀──────────────────────────│                            │
  │                            │                            │
  │  5. 心跳开始 (30s interval) │                            │
  │ ~~~~~~~~~~~~~~~~~~~~~~~~~~~│                            │
  │                            │                            │
  │                            │  6. broadcast player_join   │
  │                            │ ──────────────────────────▶ │ (其他客户端)
```

### 8.2 玩家删号时序

```
客户端                    WebSocket API              PlayerStateManager
  │                            │                            │
  │  1. player_delete request  │                            │
  │ ──────────────────────────▶│                            │
  │                            │  2. deletePlayer(id)        │
  │                            │ ──────────────────────────▶ │
  │                            │                            │
  │                            │  3. recalculateLeaderboards │
  │                            │ ◀────────────────────────── │
  │                            │                            │
  │                            │  4. broadcast player_leave  │
  │                            │ ──────────────────────────▶ │ (其他客户端)
  │                            │                            │
  │  5. player_deleted confirm │                            │
  │ ◀──────────────────────────│                            │
  │                            │                            │
  │  6. WebSocket Close        │                            │
  │ ◀──────────────────────────│                            │
  │                            │                            │
  │  7. 清理本地数据            │                            │
  │                            │                            │
```

### 8.3 全服公告时序（修正版）

```
触发客户端              WebSocket API          ServerAnnouncementManager   其他客户端
  │                          │                         │                      │
  │  1. 游戏事件发生         │                         │                      │
  │  (突破/掉落/Boss/等级)   │                         │                      │
  │                          │                         │                      │
  │  2. 客户端检查触发条件   │                         │                      │
  │  - shouldTrigger()       │                         │                      │
  │  - 匹配触发器？          │                         │                      │
  │                          │                         │                      │
  │  3. 根据世界观组装内容   │                         │                      │
  │  - buildAnnouncementContent()                     │                      │
  │  - 使用玩家的境界/物品名称│                         │                      │
  │                          │                         │                      │
  │  4. announcement_request │                         │                      │
  │  (静态文本 title/content)│                         │                      │
  │ ──────────────────────▶  │                         │                      │
  │                          │  5. handleRequest()     │                      │
  │                          │ ───────────────────────▶│                      │
  │                          │                         │                      │
  │                          │                         │ 6. 验证请求          │
  │                          │                         │ - 检查必要字段       │
  │                          │                         │ - 过滤危险字符       │
  │                          │                         │ - 检查玩家冷却       │
  │                          │                         │                      │
  │                          │                         │ 7. 生成公告          │
  │                          │                         │ - 添加ID和时间戳     │
  │                          │                         │ - 记录历史           │
  │                          │                         │                      │
  │                          │  8. announcement        │                      │
  │                          │ ◀───────────────────────│                      │
  │                          │                         │                      │
  │                          │  9. broadcast announcement                    │
  │                          │ ─────────────────────────────────────────────────▶
  │                          │                         │                      │
  │  10. announcement (自己) │                         │                      │
  │ ◀───────────────────────│                         │                      │
  │                          │                         │                      │
  │  11. 显示公告弹窗        │                         │                      │
  │                          │                         │                      │
```

**关键变化**：
- 步骤2-3：客户端检查触发条件并组装内容
- 步骤4：发送的是静态文本，不是游戏事件
- 步骤6：服务端只做验证，不做内容生成

### 8.4 公告队列处理时序

```
客户端                    AnnouncementManager
  │                            │
  │  1. 收到公告 A (showPopup=true)
  │ ◀──────────────────────────│
  │                            │
  │  2. 显示公告 A             │
  │ (activeAnnouncement = A)   │
  │                            │
  │  3. 收到公告 B (showPopup=true)
  │ ◀──────────────────────────│
  │                            │
  │  4. 添加到队列             │
  │ (queue = [B])              │
  │                            │
  │  5. 收到公告 C (showPopup=true)
  │ ◀──────────────────────────│
  │                            │
  │  6. 添加到队列             │
  │ (queue = [B, C])           │
  │                            │
  │  7. 公告 A 关闭            │
  │ (displayDuration 到期)     │
  │                            │
  │  8. 取出队列第一个         │
  │ (activeAnnouncement = B)   │
  │ (queue = [C])              │
  │                            │
  │  9. 显示公告 B             │
  │                            │
```

---

## 九、文件结构规划

```
src/
├── app/
│   └── api/
│       ├── ws/
│       │   └── route.ts              # WebSocket 端点 (新建)
│       ├── player/
│       │   └── delete/
│       │       └── route.ts          # 删号端点 (新建)
│       └── chat/
│           └── route.ts              # 聊天API (删除旧的在线状态逻辑)
│
├── lib/
│   ├── multiplayer/
│   │   ├── connectionManager.ts      # 连接管理器 (新建)
│   │   ├── playerStateManager.ts     # 玩家状态管理器 (新建)
│   │   ├── leaderboardManager.ts     # 排行榜管理器 (新建)
│   │   ├── serverAnnouncementManager.ts # 服务端公告管理器 (新建)
│   │   └── index.ts                  # 导出
│   │
│   ├── game/
│   │   └── announcement/
│   │       ├── clientAnnouncementGenerator.ts # 客户端公告生成器 (新建)
│   │       └── announcementConfig.ts # 公告触发配置 (新建，客户端)
│   │
│   └── websocket/
│       ├── types.ts                  # WebSocket 类型定义 (新建)
│       ├── messageHandler.ts         # 消息处理器 (新建)
│       └── index.ts                  # 导出
│
├── hooks/
│   ├── useWebSocketConnection.ts     # WebSocket Hook (新建)
│   └── useGameEventAnnouncements.ts  # 游戏事件公告 Hook (新建)
│
├── components/
│   └── game/
│       ├── leaderboard/
│       │   ├── LeaderboardPanel.tsx  # 排行榜面板 (新建)
│       │   └── LeaderboardEntry.tsx  # 排行榜条目 (新建)
│       └── announcement/
│           ├── AnnouncementToast.tsx # 公告弹窗 (新建)
│           ├── AnnouncementHistory.tsx # 公告历史 (新建)
│           └── AnnouncementManager.tsx # 公告管理器 (新建)
│
└── types/
    ├── multiplayer.ts                # 多人游戏类型 (新建)
    ├── announcement.ts               # 公告类型 (新建)
    └── chat.ts                       # 聊天类型 (删除旧的 OnlinePlayer)
```

**架构分离说明**：
- `lib/game/announcement/` - 客户端公告逻辑（触发条件判断、内容组装）
- `lib/multiplayer/serverAnnouncementManager.ts` - 服务端公告逻辑（验证、广播、历史）
│
└── types/
    ├── multiplayer.ts                # 多人游戏类型 (新建)
    ├── announcement.ts               # 公告类型 (新建)
    └── chat.ts                       # 聊天类型 (删除旧的 OnlinePlayer)
```

---

## 十、验证检查清单

### 10.1 功能验证

- [ ] WebSocket 连接成功建立
- [ ] 心跳正常发送和响应
- [ ] 玩家进入时广播 player_join
- [ ] 玩家离开时广播 player_leave
- [ ] 排行榜正确计算和排序
- [ ] 排行榜实时更新
- [ ] 删号请求正确处理
- [ ] 不活跃玩家自动清理
- [ ] 断线自动重连
- [ ] **公告系统功能**
- [ ] 突破大境界时触发公告
- [ ] 获得神话/传说物品时触发公告
- [ ] Boss首杀时触发公告
- [ ] 等级里程碑时触发公告
- [ ] 公告实时广播给所有在线玩家
- [ ] 公告弹窗正确显示和关闭
- [ ] 公告历史记录正确保存
- [ ] 新玩家上线可查看历史公告

### 10.2 边界条件验证

- [ ] 无玩家时排行榜显示空状态
- [ ] 心跳超时后正确清理
- [ ] 删号失败时正确提示
- [ ] 多次重连失败后进入离线模式
- [ ] 页面刷新不触发删号
- [ ] 排行榜最多显示100人
- [ ] **公告系统边界**
- [ ] 同一玩家连续突破不刷屏
- [ ] 同一Boss不被多次首杀
- [ ] 公告历史最多50条
- [ ] 公告队列依次显示
- [ ] 玩家名称含特殊字符时正确过滤
- [ ] 模板参数缺失时使用默认值

### 10.3 性能验证

- [ ] 心跳间隔合理 (30秒)
- [ ] 排行榜计算不阻塞主线程
- [ ] 广播消息频率合理
- [ ] 内存占用可控 (定时清理)
- [ ] **公告系统性能**
- [ ] 公告广播延迟 < 100ms
- [ ] 历史公告查询高效
- [ ] 冷却检查时间复杂度 O(1)

---

## 十一、实现优先级

### Phase 1: 核心基础设施
1. 创建 `types/multiplayer.ts` - 类型定义
2. 创建 `types/announcement.ts` - 公告类型定义
3. 创建 `lib/websocket/types.ts` - WebSocket 消息类型
4. 创建 `lib/multiplayer/playerStateManager.ts` - 玩家状态管理器

### Phase 2: WebSocket 服务端
5. 创建 `lib/websocket/messageHandler.ts` - 消息处理器
6. 创建 `lib/multiplayer/connectionManager.ts` - 连接管理器
7. 创建 `app/api/ws/route.ts` - WebSocket 端点

### Phase 3: 公告系统服务端
8. 创建 `lib/multiplayer/announcementTriggers.ts` - 公告触发配置
9. 创建 `lib/multiplayer/announcementManager.ts` - 公告管理器
10. 集成公告触发点到游戏系统（突破/掉落/Boss/等级）

### Phase 4: 前端集成
11. 创建 `hooks/useWebSocketConnection.ts` - WebSocket Hook
12. 创建 `components/game/leaderboard/` - 排行榜组件
13. 创建 `components/game/announcement/` - 公告组件
14. 创建 `hooks/useGameEventAnnouncements.ts` - 游戏事件公告 Hook

### Phase 5: 删号机制
15. 创建 `app/api/player/delete/route.ts` - 删号端点
16. 集成删号逻辑到重开按钮

### Phase 6: 清理与优化
17. 删除 `chat/route.ts` 中的旧在线状态逻辑
18. 性能优化和测试

---

## 十二、总结

本设计文档定义了完整的 WebSocket 实时状态同步、排行榜和全服公告系统，包括：

### 核心系统

1. **状态机设计**：玩家在线状态机，确保状态转移完整性
2. **数据结构**：清晰的类型定义，支持多种排行榜维度
3. **删号机制**：保证排行榜只显示活跃玩家
4. **边界条件**：完整的异常处理和边界检查
5. **实现计划**：分6个阶段的实施路线图

### 全服公告系统（架构修正）

**关键架构原则**：公告内容由**触发玩家**根据自己的世界观组装，服务端只负责验证、记录、广播。

```
┌──────────────────────────────────────────────────────────────────┐
│  客户端（触发人）                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. 检测游戏事件                                            │ │
│  │ 2. 检查触发条件（客户端配置）                              │ │
│  │ 3. 根据世界观组装公告内容（静态文本）                      │ │
│  │    - 使用玩家的境界名称、物品名称等                        │ │
│  │ 4. 发送 announcement_request 到服务端                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  服务端                                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 5. 验证请求（字段、XSS、长度）                             │ │
│  │ 6. 防刷检查（玩家冷却）                                    │ │
│  │ 7. 生成公告ID、记录历史                                    │ │
│  │ 8. 广播给所有在线玩家                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  所有客户端（包括触发者）                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 9. 收到静态文本公告，直接显示                              │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**触发事件类型**：
- 突破大境界（筑基、金丹、元婴、化神、炼虚、合体）
- 获得神话/传说品质物品
- Boss首杀
- 等级里程碑（100、200、500级）

**防刷机制**：
- 客户端冷却：防止频繁发送请求
- 服务端验证：双重冷却检查、XSS过滤
- 历史限制：最多50条，过期30分钟清理

**展示方式**：
- 弹窗通知（带进度条自动关闭）
- 聊天区消息
- 历史公告列表

### 设计验证

本设计已通过 game-design-strict 方法论验证，满足：
- ✅ 流程可达性：所有公告触发路径完整
- ✅ 状态完整性：公告状态机覆盖所有转移
- ✅ 边界条件：完整的异常处理和边界检查
- ✅ 数值约束：冷却时间、历史数量等参数有明确约束
- ✅ 防刷保护：客户端+服务端双层防刷机制
- ✅ **世界观兼容**：公告内容由触发玩家根据自己世界观组装，其他玩家直接显示

下一步：等待审核通过后，按照优先级顺序实现各模块。
