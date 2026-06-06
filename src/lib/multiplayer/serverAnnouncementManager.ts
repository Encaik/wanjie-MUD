/**
 * 服务端公告管理器
 * 
 * 职责：
 * 1. 接收客户端发送的公告请求
 * 2. 验证请求合法性
 * 3. 防刷检查
 * 4. 生成公告ID、记录历史
 * 5. 广播给所有在线玩家
 * 
 * 注意：服务端不负责内容生成，内容由客户端组装
 */

import type { Announcement, AnnouncementRequest, AnnouncementPriority } from '@/types/announcement';
import { WS_CONFIG } from '../websocket/types';

/** 服务端公告管理器（全局单例） */
export class ServerAnnouncementManager {
  private static instance: ServerAnnouncementManager;

  // 公告历史
  private announcementHistory: Announcement[] = [];

  // 防刷屏：玩家ID -> 最后公告时间
  private playerLastAnnouncementTime: Map<string, number> = new Map();

  // 清理定时器
  private cleanupTimer?: ReturnType<typeof setInterval>;

  private constructor() {
    this.startCleanupScheduler();
  }

  /** 获取单例实例 */
  static getInstance(): ServerAnnouncementManager {
    if (!ServerAnnouncementManager.instance) {
      ServerAnnouncementManager.instance = new ServerAnnouncementManager();
    }
    return ServerAnnouncementManager.instance;
  }

  // ========== 公告处理 ==========

  /** 处理公告请求 */
  handleAnnouncementRequest(request: AnnouncementRequest): Announcement | null {
    // 1. 验证请求
    if (!this.validateRequest(request)) {
      return null;
    }

    // 2. 检查玩家冷却（神话级公告无视冷却）
    if (request.priority !== 'mythic' && request.priority !== 'legendary') {
      const lastTime = this.playerLastAnnouncementTime.get(request.playerId);
      if (lastTime && Date.now() - lastTime < WS_CONFIG.ANNOUNCEMENT_COOLDOWN) {
        return null;
      }
    }

    // 3. 生成公告（服务端只添加ID和时间戳）
    const announcement: Announcement = {
      id: this.generateAnnouncementId(),
      type: request.type,
      priority: request.priority,
      title: request.title,
      content: request.content,
      icon: request.icon || '📢',
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

    // 4. 添加到历史
    this.addToHistory(announcement);

    // 5. 更新玩家冷却时间
    this.playerLastAnnouncementTime.set(request.playerId, Date.now());

    return announcement;
  }

  /** 获取历史公告 */
  getHistory(since?: number, limit: number = 20): Announcement[] {
    let history = this.announcementHistory;

    if (since) {
      history = history.filter(a => a.timestamp > since);
    }

    return history.slice(-limit);
  }

  // ========== 内部方法 ==========

  /** 验证请求合法性 */
  private validateRequest(request: AnnouncementRequest): boolean {
    // 检查必要字段
    if (!request.playerId || !request.playerName) {
      console.warn('[AnnouncementManager] Missing player info');
      return false;
    }
    if (!request.title || !request.content) {
      console.warn('[AnnouncementManager] Missing title or content');
      return false;
    }

    // 检查内容长度
    if (request.title.length > 50 || request.content.length > 200) {
      console.warn('[AnnouncementManager] Content too long');
      return false;
    }

    // 过滤危险字符（XSS防护）
    if (this.containsDangerousChars(request.title) ||
        this.containsDangerousChars(request.content) ||
        this.containsDangerousChars(request.playerName)) {
      console.warn('[AnnouncementManager] Dangerous characters detected');
      return false;
    }

    return true;
  }

  /** 检查是否包含危险字符 */
  private containsDangerousChars(text: string): boolean {
    // 检查HTML标签
    if (/<[^>]*>/g.test(text)) return true;
    // 检查脚本注入
    if (/javascript:/i.test(text)) return true;
    return false;
  }

  /** 添加到历史记录 */
  private addToHistory(announcement: Announcement): void {
    this.announcementHistory.push(announcement);

    if (this.announcementHistory.length > WS_CONFIG.MAX_ANNOUNCEMENT_HISTORY) {
      this.announcementHistory.shift();
    }
  }

  /** 生成公告ID */
  private generateAnnouncementId(): string {
    return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /** 启动定时清理 */
  private startCleanupScheduler(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredRecords();
    }, WS_CONFIG.CLEANUP_INTERVAL);
  }

  /** 清理过期记录 */
  private cleanupExpiredRecords(): void {
    const now = Date.now();

    // 清理过期公告历史
    this.announcementHistory = this.announcementHistory.filter(
      a => now - a.timestamp < WS_CONFIG.ANNOUNCEMENT_EXPIRE_TIME
    );

    // 清理过期的冷却记录
    for (const [playerId, time] of this.playerLastAnnouncementTime) {
      if (now - time > WS_CONFIG.ANNOUNCEMENT_COOLDOWN * 2) {
        this.playerLastAnnouncementTime.delete(playerId);
      }
    }
  }

  /** 销毁实例（用于测试） */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.announcementHistory = [];
    this.playerLastAnnouncementTime.clear();
  }
}

// 导出单例获取函数
export const getServerAnnouncementManager = () => ServerAnnouncementManager.getInstance();
