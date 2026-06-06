/**
 * 游戏 WebSocket 端点处理器
 * 
 * 路径: /ws/game
 * 
 * 功能：
 * 1. 玩家在线状态同步
 * 2. 心跳检测
 * 3. 排行榜实时更新
 * 4. 全服公告广播
 * 5. 玩家删号通知
 * 
 * 认证机制：
 * 由于沙箱环境的 WebSocket 代理不支持 URL 查询参数，
 * 采用消息认证模式：客户端连接后发送 auth 消息进行认证
 */

import { WebSocket, type WebSocketServer } from 'ws';
import type { PlayerOnlineState, PlayerStatistics } from '@/types/multiplayer';
import type { WorldType } from '@/types/base';
import {
  WSMessage,
  WSHeartbeatPayload,
  WSConnectPayload,
  WSAnnouncementRequestPayload,
  WSDeletePlayerPayload,
} from '@/lib/websocket/types';
import { getConnectionManager, extractPlayerState } from '@/lib/multiplayer';

/** 连接上下文 */
interface ConnectionContext {
  playerId: string | null;
  authenticated: boolean;
  authTimeout: NodeJS.Timeout | null;
}

/** 默认统计数据 */
const DEFAULT_STATISTICS: PlayerStatistics = {
  totalEnemiesKilled: 0,
  totalBossKilled: 0,
  legendaryItems: 0,
  adventuresCompleted: 0,
};

/** 认证超时时间（毫秒） */
const AUTH_TIMEOUT = 10000;

export function setupGameHandler(wss: WebSocketServer) {
  const connectionManager = getConnectionManager();

  console.log('[WS-Game] Setting up game WebSocket handler');

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS-Game] New connection attempt');

    // 初始化连接上下文（未认证状态）
    const context: ConnectionContext = {
      playerId: null,
      authenticated: false,
      authTimeout: null,
    };

    // 设置认证超时（暂时禁用，调试用）
    // context.authTimeout = setTimeout(() => {
    //   if (!context.authenticated) {
    //     console.log('[WS-Game] Auth timeout, closing connection');
    //     ws.send(JSON.stringify({
    //       type: 'error',
    //       payload: { message: 'Authentication timeout' },
    //       timestamp: Date.now(),
    //     }));
    //     ws.close();
    //   }
    // }, AUTH_TIMEOUT);
    
    // 发送欢迎消息，测试客户端能否接收
    ws.send(JSON.stringify({
      type: 'welcome',
      payload: { message: 'Please authenticate' },
      timestamp: Date.now(),
    }));

    // 消息处理
    ws.on('message', (raw: Buffer) => {
      console.log('[WS-Game] Received message:', raw.toString().substring(0, 200));
      try {
        const msg: WSMessage = JSON.parse(raw.toString());
        handleMessage(ws, context, msg, connectionManager);
      } catch (err) {
        console.error('[WS-Game] Failed to parse message:', err);
      }
    });

    // 断开连接处理
    ws.on('close', () => {
      // 清除认证超时
      if (context.authTimeout) {
        clearTimeout(context.authTimeout);
      }
      
      // 如果已认证，从连接管理器移除
      if (context.authenticated && context.playerId) {
        console.log(`[WS-Game] Player ${context.playerId} disconnecting`);
        connectionManager.onDisconnect(context.playerId);
      }
    });

    // 错误处理
    ws.on('error', (err) => {
      console.error('[WS-Game] WebSocket error:', err);
      if (context.authTimeout) {
        clearTimeout(context.authTimeout);
      }
      if (context.authenticated && context.playerId) {
        connectionManager.onDisconnect(context.playerId);
      }
    });
  });
}

/** 认证消息载荷 */
interface AuthPayload {
  playerId: string;
  playerName: string;
  worldType?: PlayerOnlineState['worldType'];
  level?: number;
  realm?: string;
  combatPower?: number;
  statistics?: PlayerStatistics;
}

/** 处理消息 */
function handleMessage(
  ws: WebSocket,
  context: ConnectionContext,
  msg: WSMessage,
  connectionManager: ReturnType<typeof getConnectionManager>
): void {
  // 未认证时只处理 auth 消息
  if (!context.authenticated && msg.type !== 'auth') {
    console.log('[WS-Game] Rejecting message before auth:', msg.type);
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Please authenticate first' },
      timestamp: Date.now(),
    }));
    return;
  }

  switch (msg.type) {
    case 'auth': {
      handleAuth(ws, context, msg.payload as AuthPayload, connectionManager);
      break;
    }

    case 'heartbeat': {
      const payload = msg.payload as WSHeartbeatPayload;
      connectionManager.onHeartbeat(context.playerId!, payload.playerData);
      break;
    }

    case 'connect': {
      // 重连或状态更新
      const payload = msg.payload as WSConnectPayload;
      if (payload.initialState) {
        connectionManager.onHeartbeat(context.playerId!, payload.initialState);
      }
      break;
    }

    case 'announcement_request': {
      const payload = msg.payload as WSAnnouncementRequestPayload;
      connectionManager.onAnnouncementRequest(payload.request);
      break;
    }

    case 'delete_player': {
      const payload = msg.payload as WSDeletePlayerPayload;
      connectionManager.onDeletePlayer(context.playerId!, payload.reason);
      break;
    }

    case 'ping': {
      ws.send(JSON.stringify({
        type: 'pong',
        payload: null,
        timestamp: Date.now(),
      }));
      break;
    }

    default:
      console.warn('[WS-Game] Unknown message type:', msg.type);
  }
}

/** 处理认证 */
function handleAuth(
  ws: WebSocket,
  context: ConnectionContext,
  payload: AuthPayload,
  connectionManager: ReturnType<typeof getConnectionManager>
): void {
  console.log('[WS-Game] Auth request from:', payload.playerId, payload.playerName);

  // 验证必要参数
  if (!payload.playerId || !payload.playerName) {
    console.log('[WS-Game] Auth failed: missing playerId or playerName');
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Missing required parameters: playerId, playerName' },
      timestamp: Date.now(),
    }));
    ws.close();
    return;
  }

  // 清除认证超时
  if (context.authTimeout) {
    clearTimeout(context.authTimeout);
    context.authTimeout = null;
  }

  // 更新上下文
  context.playerId = payload.playerId;
  context.authenticated = true;

  // 创建初始状态
  const initialState = extractPlayerState(
    payload.playerId,
    payload.playerName,
    (payload.worldType as WorldType) || '修仙',
    payload.level || 1,
    payload.realm || '凡人',
    payload.combatPower || 0,
    payload.statistics || DEFAULT_STATISTICS
  );

  console.log('[WS-Game] Initial state:', initialState);

  // 注册连接
  connectionManager.onConnect(ws, payload.playerId, initialState);

  console.log(`[WS-Game] Player ${payload.playerName} (${payload.playerId}) authenticated. Online count: ${connectionManager.getOnlineCount()}`);

  // 发送认证成功响应
  ws.send(JSON.stringify({
    type: 'auth_success',
    payload: {
      playerId: payload.playerId,
      onlineCount: connectionManager.getOnlineCount(),
    },
    timestamp: Date.now(),
  }));
}
