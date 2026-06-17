/**
 * 分阶段新手引导定义
 *
 * 5 阶段 9 步骤的事件驱动引导流程。
 * 每个步骤在对应游戏事件触发时自动完成。
 *
 * 阶段 0: 初入仙途 — 欢迎引导（游戏开始时自动完成）
 * 阶段 1: 初识修炼 — 使用丹药 → 修炼
 * 阶段 2: 初露锋芒 — 进入机缘 → 击败敌人
 * 阶段 3: 融入世界 — 升到 3 级 → 加入势力
 * 阶段 4: 登堂入室 — 完成机缘 → 领取成就
 *
 * @module modules/quest
 */

import type { Protagonist, ItemDefinition } from '@/core/types';
import type { GameEvent } from '@/core/events';
import type { TaskReward } from '../types';

// TODO: 统一物品系统迁移 — 应从 modules/item/data/ 获取模板
const spiritStoneTemplate: ItemDefinition = { id: 'wanjie:common:spirit_stone', name: '灵石', type: '灵石' as const, rarity: '普通' as const, description: '修仙界的通用货币', stackable: true, maxStack: 999999, effects: [] };
const qiPillTemplate: ItemDefinition = { id: 'wanjie:cultivation:qi_gathering_pill', name: '聚气丹', type: '丹药' as const, rarity: '普通' as const, description: '用于辅助修炼', stackable: true, maxStack: 99, effects: [] };
const foundationPillTemplate: ItemDefinition = { id: 'wanjie:cultivation:foundation_pill', name: '筑基丹', type: '丹药' as const, rarity: '稀有' as const, description: '用于突破筑基境界', stackable: true, maxStack: 99, effects: [] };
const hpPillSmallTemplate: ItemDefinition = { id: 'wanjie:common:rejuvenation_pill', name: '回春丹', type: '丹药' as const, rarity: '普通' as const, description: '恢复少量生命值', stackable: true, maxStack: 99, effects: [] };
const concentratePillTemplate: ItemDefinition = { id: 'spirit_gathering_pill', name: '凝神丹', type: '丹药' as const, rarity: '稀有' as const, description: '用于加速修炼', stackable: true, maxStack: 99, effects: [] };
const goldCorePillTemplate: ItemDefinition = { id: 'wanjie:cultivation:golden_core_pill', name: '结金丹', type: '丹药' as const, rarity: '史诗' as const, description: '用于突破金丹境界', stackable: true, maxStack: 99, effects: [] };
const vitalityPillTemplate: ItemDefinition = { id: 'vitality_pill', name: '元气丹', type: '丹药' as const, rarity: '稀有' as const, description: '恢复较多生命值', stackable: true, maxStack: 99, effects: [] };
const noviceTokenTemplate: ItemDefinition = { id: 'novice_token', name: '新手纪念令牌', type: '消耗品' as const, rarity: '传说' as const, description: '完成新手引导的纪念品，象征修行之路的起点。', stackable: false, maxStack: 1, effects: [] };

// ============================================
// 类型定义
// ============================================

/** 引导弹窗 */
export interface TutorialDialog {
  /** 弹窗标题 */
  title: string;
  /** 弹窗正文（玩法说明，支持简单文本格式） */
  content: string;
  /** 弹窗视觉风格 */
  variant: 'welcome' | 'system-intro' | 'default';
  /** 确认按钮文字 */
  confirmText?: string;
}

/** 引导步骤 */
export interface TutorialStep {
  /** 步骤 ID（全局唯一） */
  id: string;
  /** 步骤名称 */
  name: string;
  /** 任务描述 */
  description: string;
  /** 提示文字（消息形式展示） */
  hint: string;
  /** 可选：首次激活时的引导弹窗 */
  dialog?: TutorialDialog;
  /** 触发完成的事件类型 */
  triggerEvent: string;
  /** 步骤完成条件检查 */
  condition: (event: GameEvent, protagonist: Protagonist) => boolean;
  /** 步骤奖励（可选，通常阶段完成时发放） */
  stepReward?: TaskReward;
}

/** 引导阶段 */
export interface TutorialPhase {
  /** 阶段 ID */
  id: string;
  /** 阶段名称 */
  name: string;
  /** 阶段序号 */
  order: number;
  /** 阶段描述 */
  description: string;
  /** 阶段内的步骤列表（按顺序） */
  steps: TutorialStep[];
  /** 阶段完成奖励（阶段内所有步骤完成后发放） */
  phaseReward: TaskReward;
}

/** 完整引导定义 */
export interface TutorialGuideDefinition {
  phases: TutorialPhase[];
}

// ============================================
// 步骤条件帮助函数
// ============================================

/** 条件：事件类型匹配 */
function eventIs(expectedType: string): (event: GameEvent) => boolean {
  return (event) => event.type === expectedType;
}

/** 条件：使用特定物品 */
function itemUsedIs(templateId: string): (event: GameEvent) => boolean {
  return (event) => event.type === 'item:used' && (event.payload as Record<string, unknown>)?.templateId === templateId;
}

/** 条件：等级达到 */
function levelReached(minLevel: number): (event: GameEvent, protagonist: Protagonist) => boolean {
  return (_event, p) => p.level >= minLevel;
}

// ============================================
// 引导定义
// ============================================

/** 新手引导完整定义 */
export const TUTORIAL_GUIDE: TutorialGuideDefinition = {
  phases: [
    // ========== 阶段 0: 初入仙途 ==========
    {
      id: 'phase_0_starter',
      name: '初入仙途',
      order: 0,
      description: '踏入修行世界，领取初始修炼物资',
      steps: [
        {
          id: 'step_welcome',
          name: '欢迎来到万界',
          description: '踏入万界修行路，领取初始物资',
          hint: '你已踏入万界修行之路。前往任务面板领取初始修炼物资，开始修行吧！',
          dialog: {
            title: '欢迎来到万界修行录',
            content: [
              '你即将踏上一段跨越万千世界的修行之旅。',
              '',
              '在万界之中，你可以：',
              '• **修炼**：消耗灵石提升修为，突破境界',
              '• **机缘**：探索秘境，遭遇随机事件与敌人',
              '• **战斗**：回合制战斗，手动或自动模式',
              '• **收集**：获得功法、装备、丹药',
              '• **飞升**：穿越到更高层次的世界',
              '',
              '作为初入修行的新人，你可以在任务面板领取初始物资：',
              '• 灵石 ×200',
              '• 聚气丹 ×5',
              '• 筑基丹 ×1',
              '• 回春丹 ×3',
              '',
              '打开任务面板，点击领取奖励开始你的修行之路吧！',
            ].join('\n'),
            variant: 'welcome',
            confirmText: '踏入修行',
          },
          triggerEvent: 'tutorial:game_started',
          condition: eventIs('tutorial:game_started'),
          stepReward: {
            spiritStones: 200,
            experience: 0,
            items: [
              { item: qiPillTemplate, quantity: 5 },
              { item: foundationPillTemplate, quantity: 1 },
              { item: hpPillSmallTemplate, quantity: 3 },
            ],
            message: '领取新手礼包：200 灵石 + 聚气丹×5 + 筑基丹×1 + 回春丹×3',
          },
        },
      ],
      phaseReward: {
        spiritStones: 0,
        experience: 10,
        items: [],
        message: '初入仙途完成！开始你的第一次修炼吧。',
      },
    },

    // ========== 阶段 1: 初识修炼 ==========
    {
      id: 'phase_1_cultivation',
      name: '初识修炼',
      order: 1,
      description: '学习丹药使用和修炼基础',
      steps: [
        {
          id: 'step_use_pill',
          name: '使用聚气丹',
          description: '在背包中使用一颗聚气丹',
          hint: '打开背包，找到聚气丹并点击使用。丹药可以提升修炼效果哦！',
          dialog: {
            title: '丹药系统',
            content: [
              '丹药是修行中的重要辅助道具：',
              '',
              '• **聚气丹**：使用后获得修炼加成效果，提高每次修炼获得的经验',
              '• **筑基丹**：突破境界时使用，大幅提升突破成功率',
              '• **回春丹**：战斗中恢复生命值',
              '',
              '使用丹药后会获得持续一段时间的增益效果。',
              '现在试试使用背包中的聚气丹吧！',
            ].join('\n'),
            variant: 'system-intro',
            confirmText: '知道了',
          },
          triggerEvent: 'item:used',
          condition: itemUsedIs('wanjie:cultivation:qi_gathering_pill'),
        },
        {
          id: 'step_first_cultivation',
          name: '进行一次修炼',
          description: '在修炼界面进行一次修炼',
          hint: '点击修炼界面中的"修炼"按钮。修炼消耗灵石，获得经验值。使用聚气丹后再修炼效果更佳！',
          dialog: {
            title: '修炼系统',
            content: [
              '修炼是提升实力的核心方式：',
              '',
              '• 每次修炼消耗灵石，获得**经验值**',
              '• 经验值满后可尝试**突破境界**',
              '• 境界突破会大幅提升你的属性',
              '• 使用丹药可获得修炼加成',
              '',
              '修炼消耗的灵石可通过战斗、任务等方式获取。',
              '现在进行你的第一次修炼吧！',
            ].join('\n'),
            variant: 'system-intro',
            confirmText: '开始修炼',
          },
          triggerEvent: 'cultivation:performed',
          condition: eventIs('cultivation:performed'),
        },
      ],
      phaseReward: {
        spiritStones: 50,
        experience: 20,
        items: [
          { item: hpPillSmallTemplate, quantity: 3 },
        ],
        message: '初识修炼完成！获得 50 灵石 + 回春丹×3',
      },
    },

    // ========== 阶段 2: 初露锋芒 ==========
    {
      id: 'phase_2_combat',
      name: '初露锋芒',
      order: 2,
      description: '学习机缘探索和战斗基础',
      steps: [
        {
          id: 'step_enter_adventure',
          name: '进入机缘探索',
          description: '前往机缘界面选择探索',
          hint: '点击"机缘"界面，选择一个低难度的秘境开始探索。你是新手，建议从简单的开始！',
          dialog: {
            title: '机缘系统',
            content: [
              '机缘探索是获取资源、功法和装备的主要途径：',
              '',
              '• 在地图上移动，探索未知区域',
              '• 遭遇各种**随机事件**（战斗、宝箱、NPC 等）',
              '• 击败最终 Boss 可获得丰厚奖励',
              '• 不同难度适合不同实力的玩家',
              '',
              '作为新人，建议从低难度开始，熟悉战斗后再挑战高难度。',
            ].join('\n'),
            variant: 'system-intro',
            confirmText: '去探索',
          },
          triggerEvent: 'adventure:entered',
          condition: eventIs('adventure:entered'),
        },
        {
          id: 'step_first_kill',
          name: '击败第一个敌人',
          description: '在机缘中击败任意敌人',
          hint: '遭遇敌人后进入战斗，使用技能击败它。注意观察自己的血量！',
          dialog: {
            title: '战斗系统',
            content: [
              '战斗采用回合制，你需要选择合适的技能：',
              '',
              '• 你的速度决定**出手顺序**',
              '• 使用**物理攻击**或**特殊攻击**技能',
              '• 关注**生命值**变化，及时使用回春丹恢复',
              '• 战斗胜利获得经验和战利品',
              '• 也可开启**自动战斗**模式',
              '',
              '大胆应战吧，初期敌人并不强大！',
            ].join('\n'),
            variant: 'system-intro',
            confirmText: '去战斗',
          },
          triggerEvent: 'combat:enemy_killed',
          condition: eventIs('combat:enemy_killed'),
        },
      ],
      phaseReward: {
        spiritStones: 100,
        experience: 30,
        items: [
          { item: qiPillTemplate, quantity: 3 },
          { item: foundationPillTemplate, quantity: 1 },
          { item: hpPillSmallTemplate, quantity: 2 },
        ],
        message: '初露锋芒完成！获得 100 灵石 + 聚气丹×3 + 筑基丹×1 + 回春丹×2',
      },
    },

    // ========== 阶段 3: 融入世界 ==========
    {
      id: 'phase_3_social',
      name: '融入世界',
      order: 3,
      description: '提升实力并加入势力',
      steps: [
        {
          id: 'step_reach_level_3',
          name: '提升至 3 级',
          description: '通过修炼和战斗将等级提升到 3 级',
          hint: '继续修炼和战斗积累经验。经验满后修炼可尝试突破境界提升等级。',
          triggerEvent: 'player:level_up',
          condition: (_event, p) => p.level >= 3,
        },
        {
          id: 'step_join_faction',
          name: '加入一个势力',
          description: '在势力界面选择一个势力加入',
          hint: '前往"势力"界面，查看可选势力。不同势力提供不同的福利和任务。',
          dialog: {
            title: '势力系统',
            content: [
              '加入势力可以获得更多成长资源：',
              '',
              '• 完成势力**日常/周常任务**获取贡献',
              '• 贡献可兑换势力专属物品和功法',
              '• 提升声望解锁更高等级的福利',
              '• 不同势力有不同的侧重方向',
              '',
              '选择一个你感兴趣的势力加入吧！',
            ].join('\n'),
            variant: 'system-intro',
            confirmText: '选势力',
          },
          triggerEvent: 'faction:joined',
          condition: eventIs('faction:joined'),
        },
      ],
      phaseReward: {
        spiritStones: 150,
        experience: 40,
        items: [
          { item: concentratePillTemplate, quantity: 2 },
          { item: hpPillSmallTemplate, quantity: 5 },
        ],
        message: '融入世界完成！获得 150 灵石 + 凝神丹×2 + 回春丹×5',
      },
    },

    // ========== 阶段 4: 登堂入室 ==========
    {
      id: 'phase_4_advanced',
      name: '登堂入室',
      order: 4,
      description: '掌握进阶玩法',
      steps: [
        {
          id: 'step_complete_adventure',
          name: '完成一次机缘探索',
          description: '击败机缘探索的 Boss 完成探索',
          hint: '挑战机缘中的最终 Boss。战前确保状态良好，备好回春丹！',
          triggerEvent: 'adventure:completed',
          condition: eventIs('adventure:completed'),
        },
        {
          id: 'step_claim_achievement',
          name: '领取成就奖励',
          description: '在成就界面领取一个已完成的成就奖励',
          hint: '前往"成就"界面，查看已解锁的成就并领取奖励。',
          dialog: {
            title: '成就系统',
            content: [
              '成就记录你的修行历程：',
              '',
              '• 完成特定目标自动**解锁成就**',
              '• 已解锁的成就可以**领取奖励**',
              '• 成就奖励包含经验、灵石和稀有物品',
              '• 成就进度永久保存',
              '',
              '现在去领取你的第一个成就奖励吧！',
            ].join('\n'),
            variant: 'system-intro',
            confirmText: '去领取',
          },
          triggerEvent: 'achievement:claimed',
          condition: eventIs('achievement:claimed'),
        },
      ],
      phaseReward: {
        spiritStones: 300,
        experience: 100,
        items: [
          { item: concentratePillTemplate, quantity: 3 },
          { item: goldCorePillTemplate, quantity: 1 },
          { item: vitalityPillTemplate, quantity: 2 },
          { item: noviceTokenTemplate, quantity: 1 },
        ],
        message: '🎉 恭喜完成全部新手引导！获得 300 灵石 + 凝神丹×3 + 结金丹×1 + 元气丹×2 + 传说新手纪念令牌！',
      },
    },
  ],
};

// ============================================
// 便捷查询函数
// ============================================

/** 根据 ID 获取步骤 */
export function getStepById(stepId: string): TutorialStep | undefined {
  for (const phase of TUTORIAL_GUIDE.phases) {
    const step = phase.steps.find(s => s.id === stepId);
    if (step) return step;
  }
  return undefined;
}

/** 根据 ID 获取阶段 */
export function getPhaseById(phaseId: string): TutorialPhase | undefined {
  return TUTORIAL_GUIDE.phases.find(p => p.id === phaseId);
}

/** 获取引导总步骤数 */
export function getTotalStepCount(): number {
  return TUTORIAL_GUIDE.phases.reduce((sum, p) => sum + p.steps.length, 0);
}

/** 获取引导总阶段数 */
export function getTotalPhaseCount(): number {
  return TUTORIAL_GUIDE.phases.length;
}
