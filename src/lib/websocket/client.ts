/**
 * WebSocket 客户端工具
 */

import type { WSMessage, WSMessageType } from './types';

/** WebSocket 客户端选项 */
interface WsClientOptions {
  /** WebSocket 路径，如 '/ws/game' */
  path: string;
  /** 消息回调 */
  onMessage: (msg: WSMessage) => void;
  /** 连接成功回调 */
  onOpen?: () => void;
  /** 连接关闭回调 */
  onClose?: () => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 是否自动重连 */
  reconnect?: boolean;
  /** 重连间隔（毫秒） */
  reconnectInterval?: number;
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number;
}

/** WebSocket 客户端实例 */
interface WsClientInstance {
  /** 发送消息 */
  send: (msg: WSMessage) => void;
  /** 关闭连接 */
  close: () => void;
  /** 获取连接状态 */
  getReadyState: () => number;
}

/**
 * 创建 WebSocket 客户端连接
 */
export function createWsConnection(options: WsClientOptions): WsClientInstance {
  const {
    path,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    heartbeatInterval = 30000,
  } = options;

  let ws: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  // 连接
  function connect() {
    if (closed) return;

    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5000';
    const wsUrl = `${protocol}//${host}${path}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // 启动心跳
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' as WSMessageType, payload: null, timestamp: Date.now() }));
          }
        }, heartbeatInterval);

        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          if (msg.type === 'pong') return; // 忽略心跳响应
          onMessage(msg);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        onClose?.();

        // 自动重连
        if (reconnect && !closed) {
          reconnectTimer = setTimeout(connect, reconnectInterval);
        }
      };

      ws.onerror = () => {
        onError?.(new Error('WebSocket error'));
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      onError?.(err instanceof Error ? err : new Error('Failed to create WebSocket'));

      // 自动重连
      if (reconnect && !closed) {
        reconnectTimer = setTimeout(connect, reconnectInterval);
      }
    }
  }

  // 发送消息
  function send(msg: WSMessage) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  // 关闭连接
  function close() {
    closed = true;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) ws.close();
  }

  // 获取连接状态
  function getReadyState() {
    return ws?.readyState ?? WebSocket.CLOSED;
  }

  // 启动连接
  connect();

  return { send, close, getReadyState };
}

export default createWsConnection;
