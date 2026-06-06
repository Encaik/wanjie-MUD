/**
 * 客户端公告生成器
 * 
 * 职责：
 * 1. 根据游戏事件生成公告文本
 * 2. 使用世界观配置（境界名称、势力名称等）
 * 3. 生成符合游戏风格的静态文本
 */

import type { GameEvent, AnnouncementRequest } from '@/types/announcement';
import { GameEventType } from '@/types/announcement';
import type { WorldType } from '@/types/base';
import { getAnnouncementConfig, shouldTriggerAnnouncement } from './config';

/**
 * 公告生成器上下文
 * 
 * 包含生成公告所需的所有上下文信息
 */
export interface AnnouncementContext {
  // 玩家信息
  playerId: string;
  playerName: string;
  playerLevel: number;
  playerRealm: string;
  worldType: WorldType;
  
  // 势力信息（可选）
  factionId?: string;
  factionName?: string;
}

/**
 * 公告生成器
 */
export class AnnouncementGenerator {
  private context: AnnouncementContext;

  constructor(context: AnnouncementContext) {
    this.context = context;
  }

  /**
   * 从游戏事件生成公告请求
   * 
   * @returns 公告请求，如果事件不应该触发公告则返回 null
   */
  generateRequest(event: GameEvent): AnnouncementRequest | null {
    // 检查是否应该触发公告
    if (!shouldTriggerAnnouncement(event)) {
      return null;
    }

    const config = getAnnouncementConfig(event.type);
    if (!config) return null;

    // 生成公告内容
    const content = this.generateContent(event);

    // 构建请求
    const request: AnnouncementRequest = {
      playerId: this.context.playerId,
      playerName: this.context.playerName,
      worldType: this.context.worldType,
      type: config.type,
      priority: config.priority,
      content,
      title: config.template.title,
      icon: config.template.icon,
      displayDuration: 5000,
      showPopup: true,
      showInChat: true,
    };

    return request;
  }

  /**
   * 生成公告内容
   */
  private generateContent(event: GameEvent): string {
    const data = event.data || {};
    
    switch (event.type) {
      case GameEventType.ASCENSION_SUCCESS:
        return this.generateAscensionSuccessContent(data);
      
      case GameEventType.ASCENSION_FAILURE:
        return this.generateAscensionFailureContent(data);
      
      case GameEventType.DEFEAT_BOSS:
        return this.generateBossDefeatContent(data);
      
      case GameEventType.PVP_VICTORY:
        return this.generatePvpVictoryContent(data);
      
      case GameEventType.OBTAIN_LEGENDARY:
      case GameEventType.OBTAIN_MYTHIC:
        return this.generateItemObtainContent(data, event.type === GameEventType.OBTAIN_MYTHIC);
      
      case GameEventType.SYNTHESIS_SUCCESS:
        return this.generateSynthesisContent(data);
      
      case GameEventType.ACHIEVEMENT_UNLOCK:
        return this.generateAchievementContent(data);
      
      case GameEventType.FACTION_JOIN:
        return this.generateFactionJoinContent(data);
      
      case GameEventType.FACTION_CONTRIBUTE:
        return this.generateFactionContributeContent(data);
      
      case GameEventType.DISCOVERY:
        return this.generateDiscoveryContent(data);
      
      default:
        return `${this.context.playerName} 触发了一个神秘事件`;
    }
  }

  // ========== 内容生成方法 ==========

  private generateAscensionSuccessContent(data: Record<string, unknown>): string {
    const fromRealm = data.fromRealm as string | undefined;
    const toRealm = data.toRealm as string | undefined;
    const worldName = data.worldName as string | undefined;
    
    if (fromRealm && toRealm) {
      return `【飞升成功】${this.context.playerName} 成功突破 ${fromRealm}，晋升为 ${toRealm}，飞升至「${worldName || '更高境界'}」！`;
    }
    
    return `【飞升成功】${this.context.playerName} 功德圆满，成功飞升至更高境界！`;
  }

  private generateAscensionFailureContent(data: Record<string, unknown>): string {
    const fromRealm = data.fromRealm as string | undefined;
    const reason = data.reason as string | undefined;
    
    if (fromRealm && reason) {
      return `【飞升失败】${this.context.playerName} 在突破 ${fromRealm} 时遭遇 ${reason}，渡劫失败...`;
    }
    
    return `【飞升失败】${this.context.playerName} 渡劫失败，功德受损...`;
  }

  private generateBossDefeatContent(data: Record<string, unknown>): string {
    const bossName = data.bossName as string | undefined;
    const bossLevel = data.bossLevel as number | undefined;
    
    if (bossName) {
      return `【Boss 击杀】${this.context.playerName} 以惊世修为，斩杀了 Lv.${bossLevel || '?'} 的「${bossName}」，威震一方！`;
    }
    
    return `【Boss 击杀】${this.context.playerName} 击败了强大的敌人！`;
  }

  private generatePvpVictoryContent(data: Record<string, unknown>): string {
    const enemyName = data.enemyName as string | undefined;
    const enemyCombatPower = data.enemyCombatPower as number | undefined;
    const enemyRealm = data.enemyRealm as string | undefined;
    
    if (enemyName) {
      return `【PVP 胜利】${this.context.playerName} 在论道中战胜了 ${enemyRealm ? enemyRealm + ' ' : ''}${enemyName}（战力 ${enemyCombatPower?.toLocaleString() || '?'}），展现实力！`;
    }
    
    return `【PVP 胜利】${this.context.playerName} 在论道中取得了胜利！`;
  }

  private generateItemObtainContent(data: Record<string, unknown>, isMythic: boolean): string {
    const itemName = data.itemName as string | undefined;
    const source = data.source as string | undefined;
    const qualityText = isMythic ? '神话' : '传说';
    
    if (itemName) {
      const sourceText = source ? `从 ${source} 中` : '';
      return `【获得${qualityText}物品】${this.context.playerName} ${sourceText}获得了${qualityText}级「${itemName}」，天降异象！`;
    }
    
    return `【获得${qualityText}物品】${this.context.playerName} 获得了${qualityText}级物品！`;
  }

  private generateSynthesisContent(data: Record<string, unknown>): string {
    const itemName = data.itemName as string | undefined;
    const itemQuality = data.itemQuality as string | undefined;
    
    const qualityNames: Record<string, string> = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
      mythic: '神话',
    };
    const qualityText = qualityNames[itemQuality || ''] || itemQuality || '未知';
    
    if (itemName) {
      return `【合成成功】${this.context.playerName} 历经千辛万苦，成功合成了${qualityText}级「${itemName}」！`;
    }
    
    return `【合成成功】${this.context.playerName} 成功合成了${qualityText}级物品！`;
  }

  private generateAchievementContent(data: Record<string, unknown>): string {
    const achievementName = data.achievementName as string | undefined;
    const achievementDescription = data.achievementDescription as string | undefined;
    
    if (achievementName) {
      return `【成就解锁】${this.context.playerName} 达成了「${achievementName}」成就${achievementDescription ? `：${achievementDescription}` : ''}！`;
    }
    
    return `【成就解锁】${this.context.playerName} 解锁了新成就！`;
  }

  private generateFactionJoinContent(data: Record<string, unknown>): string {
    const factionName = data.factionName as string | undefined;
    const factionRank = data.factionRank as string | undefined;
    
    if (factionName) {
      return `【加入势力】${this.context.playerName} 正式加入「${factionName}」${factionRank ? `，成为 ${factionRank}` : ''}！`;
    }
    
    return `【加入势力】${this.context.playerName} 加入了新的势力！`;
  }

  private generateFactionContributeContent(data: Record<string, unknown>): string {
    const contribution = data.contribution as number | undefined;
    const reward = data.reward as string | undefined;
    
    if (contribution) {
      return `【势力贡献】${this.context.playerName} 向势力贡献了 ${contribution.toLocaleString()} 点资源${reward ? `，获得 ${reward}` : ''}！`;
    }
    
    return `【势力贡献】${this.context.playerName} 为势力做出了重大贡献！`;
  }

  private generateDiscoveryContent(data: Record<string, unknown>): string {
    const locationName = data.locationName as string | undefined;
    const locationType = data.locationType as string | undefined;
    const difficulty = data.difficulty as string | undefined;
    
    if (locationName) {
      return `【发现秘境】${this.context.playerName} 在探索中发现了${locationType ? locationType : '秘境'}「${locationName}」${difficulty ? `（难度：${difficulty}）` : ''}！`;
    }
    
    return `【发现秘境】${this.context.playerName} 发现了新的秘境！`;
  }
}

/**
 * 创建公告生成器
 */
export function createAnnouncementGenerator(context: AnnouncementContext): AnnouncementGenerator {
  return new AnnouncementGenerator(context);
}
