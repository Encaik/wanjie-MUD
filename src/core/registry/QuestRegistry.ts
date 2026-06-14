/**
 * 任务注册中心
 *
 * 管理 Mod 加载的任务定义，供 NPC 对话系统和 API 查询。
 *
 * @module core/registry
 */

import type { QuestDefinition, QuestState } from '@/core/types';

export class QuestRegistry {
  private static instance: QuestRegistry;
  private quests = new Map<string, QuestDefinition>();

  static getInstance(): QuestRegistry {
    if (!QuestRegistry.instance) QuestRegistry.instance = new QuestRegistry();
    return QuestRegistry.instance;
  }

  static resetInstance(): void {
    QuestRegistry.instance = new QuestRegistry();
  }

  register(quest: QuestDefinition): void {
    if (this.quests.has(quest.id)) {
      throw new Error(`任务 ID 冲突: ${quest.id}`);
    }
    this.quests.set(quest.id, quest);
  }

  registerAll(quests: QuestDefinition[]): void {
    for (const q of quests) this.register(q);
  }

  getById(id: string): QuestDefinition | undefined {
    return this.quests.get(id);
  }

  getAll(): QuestDefinition[] {
    return Array.from(this.quests.values());
  }

  /** 按世界观筛选 */
  getByWorldview(worldviewId: string): QuestDefinition[] {
    return Array.from(this.quests.values())
      .filter(q => !q.worldviewRestrictions || q.worldviewRestrictions.length === 0
        || q.worldviewRestrictions.includes(worldviewId));
  }

  /** 查询某 NPC 关联的所有任务（quest giver 或 objective target） */
  getQuestsByNPC(npcId: string): QuestDefinition[] {
    return Array.from(this.quests.values()).filter(q =>
      q.stages.some(s =>
        s.objectives.some(o => o.type === 'talk_to_npc' && o.target === npcId)
        || s.npcDialogueOnEnter?.npcId === npcId
      )
    );
  }

  /**
   * 获取玩家当前可接的任务列表
   * @param worldviewId - 世界观 ID
   * @param questState - 玩家任务状态
   * @param checkPrerequisites - 前置条件检查函数（外部注入，避免 registry 依赖 modules）
   */
  getAvailableQuests(
    worldviewId: string,
    questState: QuestState,
    checkPrerequisites: (quest: QuestDefinition) => boolean,
  ): QuestDefinition[] {
    return this.getByWorldview(worldviewId).filter(q => {
      // 已完成且不可重复的任务跳过
      if (!q.repeatable && questState.completedQuests.includes(q.id)) return false;
      // 重复任务检查冷却（简化：只看是否在 claimedRewards 中）
      if (q.repeatable && questState.claimedRewards.includes(q.id)) return false;
      // 已在活跃任务中跳过
      if (questState.activeQuests[q.id]) return false;
      // 前置条件
      return checkPrerequisites(q);
    });
  }

  get count(): number {
    return this.quests.size;
  }
}
