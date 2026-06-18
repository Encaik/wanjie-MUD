/**
 * 任务板块注册中心
 *
 * 管理 Mod 和内置模块注入的任务板块定义。
 * 单例模式，供 ModLoader、boardEngine 和 QuestPanel 使用。
 *
 * @module core/registry
 */

import type { QuestBoard, QuestCategory, QuestPrerequisite } from '@/core/types';

export class BoardRegistry {
  private static instance: BoardRegistry;
  private boards = new Map<string, QuestBoard>();

  static getInstance(): BoardRegistry {
    if (!BoardRegistry.instance) BoardRegistry.instance = new BoardRegistry();
    return BoardRegistry.instance;
  }

  static resetInstance(): void {
    BoardRegistry.instance = new BoardRegistry();
  }

  /** 注册单个板块 */
  register(board: QuestBoard): void {
    if (this.boards.has(board.id)) {
      throw new Error(`板块 ID 冲突: ${board.id}`);
    }
    this.boards.set(board.id, board);
  }

  /** 批量注册板块 */
  registerAll(boards: QuestBoard[]): void {
    for (const b of boards) this.register(b);
  }

  /** 按 ID 查询板块 */
  getById(id: string): QuestBoard | undefined {
    return this.boards.get(id);
  }

  /** 获取所有板块 */
  getAll(): QuestBoard[] {
    return Array.from(this.boards.values());
  }

  /** 按分类筛选 */
  getByCategory(category: QuestCategory): QuestBoard[] {
    return Array.from(this.boards.values()).filter(b => b.category === category);
  }

  /**
   * 获取玩家可访问的板块列表
   *
   * @param checkPrerequisites - 前置条件检查函数（外部注入，避免 core 依赖 modules）
   */
  getUnlockedBoards(
    checkPrerequisites: (conditions: QuestPrerequisite[]) => boolean,
  ): QuestBoard[] {
    return Array.from(this.boards.values()).filter(b => {
      if (!b.unlockConditions || b.unlockConditions.length === 0) return true;
      return checkPrerequisites(b.unlockConditions);
    });
  }

  get count(): number {
    return this.boards.size;
  }
}
