/**
 * 新手引导任务定义（含弹窗）
 *
 * 将 TUTORIAL_GUIDE 的 5 阶段 9 步骤映射为 QuestDefinition，
 * 弹窗作为 quest.dialog 字段内嵌。弹窗在任务变为"可接取"时自动弹出。
 *
 * @module modules/quest/data
 */

import type { QuestDefinition } from '@/core/types';

/** 新手引导全部 9 个任务 */
export const TUTORIAL_QUEST_DEFINITIONS: QuestDefinition[] = [
  // ====== step_welcome ======
  {
    id: 'tutorial_welcome',
    name: '欢迎来到万界',
    description: '踏入万界修行路，领取初始物资',
    type: 'main',
    prerequisites: [],
    stages: [{
      id: 'stage_1',
      name: '进入游戏',
      description: '游戏启动时自动完成',
      objectives: [
        { type: 'custom', target: 'game_started', count: 1, description: '进入游戏' },
      ],
      completions: { done: { description: '完成' } },
    }],
    rewards: [
      { spiritStones: 200 },
      { items: [{ itemId: 'wanjie-core:cultivation:qi_gathering_pill', quantity: 5 }] },
      { items: [{ itemId: 'wanjie-core:cultivation:foundation_pill', quantity: 1 }] },
      { items: [{ itemId: 'wanjie:common:rejuvenation_pill', quantity: 3 }] },
    ],
    repeatable: false,
    boardIds: ['board_tutorial'],
    storylineId: 'storyline_tutorial',
    eventMapping: [
      { eventType: 'tutorial:game_started', targetField: '', objectiveType: 'custom' },
    ],
    dialog: {
      title: '欢迎来到万界修行录',
      content: [
        '你即将踏上一段跨越万千世界的修行之旅。',
        '',
        '在万界之中，你可以：',
        '• 修炼：消耗灵石提升修为，突破境界',
        '• 机缘：探索秘境，遭遇随机事件与敌人',
        '• 战斗：回合制战斗，手动或自动模式',
        '• 收集：获得功法、装备、丹药',
        '• 飞升：穿越到更高层次的世界',
        '',
        '作为初入修行的新人，你可以在任务面板领取初始物资：',
        '• 灵石 ×200  • 聚气丹 ×5  • 筑基丹 ×1  • 回春丹 ×3',
      ].join('\n'),
      confirmText: '踏入修行',
    },
  },

  // ====== step_use_pill ======
  {
    id: 'tutorial_use_pill',
    name: '使用聚气丹',
    description: '在背包中使用一颗聚气丹',
    type: 'main',
    prerequisites: [{ type: 'quest_completed', target: 'tutorial_welcome' }],
    stages: [{
      id: 'stage_1', name: '使用丹药', description: '使用背包中的聚气丹',
      objectives: [
        { type: 'use_item', target: 'wanjie-core:cultivation:qi_gathering_pill', count: 1, description: '使用聚气丹' },
      ],
      completions: { done: { description: '完成' } },
    }],
    rewards: [],
    repeatable: false, boardIds: ['board_tutorial'], storylineId: 'storyline_tutorial',
    dialog: {
      title: '丹药系统',
      content: [
        '丹药是修行中的重要辅助道具：',
        '',
        '• 聚气丹：使用后获得修炼加成效果，提高每次修炼获得的经验',
        '• 筑基丹：突破境界时使用，大幅提升突破成功率',
        '• 回春丹：战斗中恢复生命值',
        '',
        '使用丹药后会获得持续一段时间的增益效果。',
        '现在试试使用背包中的聚气丹吧！',
      ].join('\n'),
      confirmText: '知道了',
    },
  },

  // ====== step_first_cultivation ======
  {
    id: 'tutorial_first_cultivation',
    name: '进行一次修炼',
    description: '在修炼界面进行一次修炼',
    type: 'main',
    prerequisites: [{ type: 'quest_completed', target: 'tutorial_use_pill' }],
    stages: [{
      id: 'stage_1', name: '修炼', description: '进行一次修炼',
      objectives: [
        { type: 'cultivate', target: '', count: 1, description: '修炼一次' },
      ],
      completions: { done: { description: '完成' } },
    }],
    rewards: [
      { spiritStones: 50 },
      { items: [{ itemId: 'wanjie:common:rejuvenation_pill', quantity: 3 }] },
    ],
    repeatable: false, boardIds: ['board_tutorial'], storylineId: 'storyline_tutorial',
    dialog: {
      title: '修炼系统',
      content: [
        '修炼是提升实力的核心方式：',
        '',
        '• 每次修炼消耗灵石，获得经验值',
        '• 经验值满后可尝试突破境界',
        '• 境界突破会大幅提升你的属性',
        '• 使用丹药可获得修炼加成',
        '',
        '修炼消耗的灵石可通过战斗、任务等方式获取。',
        '现在进行你的第一次修炼吧！',
      ].join('\n'),
      confirmText: '开始修炼',
    },
  },

  // ====== step_enter_adventure ======
  {
    id: 'tutorial_enter_adventure',
    name: '进入机缘探索',
    description: '前往机缘界面选择探索',
    type: 'main',
    prerequisites: [{ type: 'quest_completed', target: 'tutorial_first_cultivation' }],
    stages: [{
      id: 'stage_1', name: '探索机缘', description: '进入一次机缘探索',
      objectives: [
        { type: 'custom', target: 'adventure_entered', count: 1, description: '进入机缘' },
      ],
      completions: { done: { description: '完成' } },
    }],
    rewards: [],
    repeatable: false, boardIds: ['board_tutorial'], storylineId: 'storyline_tutorial',
    eventMapping: [
      { eventType: 'adventure:entered', targetField: '', objectiveType: 'custom' },
    ],
    dialog: {
      title: '机缘系统',
      content: [
        '机缘探索是获取资源、功法和装备的主要途径：',
        '',
        '• 在地图上移动，探索未知区域',
        '• 遭遇各种随机事件（战斗、宝箱、NPC 等）',
        '• 击败最终 Boss 可获得丰厚奖励',
        '• 不同难度适合不同实力的玩家',
        '',
        '作为新人，建议从低难度开始，熟悉战斗后再挑战高难度。',
      ].join('\n'),
      confirmText: '去探索',
    },
  },

  // ====== step_first_kill ======
  {
    id: 'tutorial_first_kill',
    name: '击败第一个敌人',
    description: '在机缘中击败任意敌人',
    type: 'main',
    prerequisites: [{ type: 'quest_completed', target: 'tutorial_enter_adventure' }],
    stages: [{
      id: 'stage_1', name: '首战', description: '击败任意敌人',
      objectives: [
        { type: 'kill_enemy', target: '', count: 1, description: '击败敌人' },
      ],
      completions: { done: { description: '完成' } },
    }],
    rewards: [
      { spiritStones: 100 },
      { items: [{ itemId: 'wanjie-core:cultivation:qi_gathering_pill', quantity: 3 }] },
      { items: [{ itemId: 'wanjie-core:cultivation:foundation_pill', quantity: 1 }] },
      { items: [{ itemId: 'wanjie:common:rejuvenation_pill', quantity: 2 }] },
    ],
    repeatable: false, boardIds: ['board_tutorial'], storylineId: 'storyline_tutorial',
    eventMapping: [
      { eventType: 'combat:enemy_killed', targetField: '', objectiveType: 'kill_enemy' },
    ],
    dialog: {
      title: '战斗系统',
      content: [
        '战斗采用回合制，你需要选择合适的技能：',
        '',
        '• 你的速度决定出手顺序',
        '• 使用物理攻击或特殊攻击技能',
        '• 关注生命值变化，及时使用回春丹恢复',
        '• 战斗胜利获得经验和战利品',
        '• 也可开启自动战斗模式',
        '',
        '大胆应战吧，初期敌人并不强大！',
      ].join('\n'),
      confirmText: '去战斗',
    },
  },

  // ====== step_reach_level_3 (no dialog) ======
  {
    id: 'tutorial_reach_level_3',
    name: '提升至 3 级',
    description: '通过修炼和战斗将等级提升到 3 级',
    type: 'main',
    prerequisites: [{ type: 'quest_completed', target: 'tutorial_first_kill' }],
    stages: [{
      id: 'stage_1', name: '升到3级', description: '等级达到3级',
      objectives: [
        { type: 'reach_level', target: '3', count: 1, description: '等级达到3级' },
      ],
      completions: { done: { description: '完成' } },
    }],
    rewards: [],
    repeatable: false, boardIds: ['board_tutorial'], storylineId: 'storyline_tutorial',
  },

  // ====== step_join_faction ======
  {
    id: 'tutorial_join_faction',
    name: '加入一个势力',
    description: '在势力界面选择一个势力加入',
    type: 'main',
    prerequisites: [{ type: 'quest_completed', target: 'tutorial_reach_level_3' }],
    stages: [{
      id: 'stage_1', name: '加入势力', description: '加入任意势力',
      objectives: [
        { type: 'custom', target: '', count: 1, description: '加入势力' },
      ],
      completions: { done: { description: '完成' } },
    }],
    rewards: [
      { spiritStones: 150 },
      { items: [{ itemId: 'spirit_gathering_pill', quantity: 2 }] },
      { items: [{ itemId: 'wanjie:common:rejuvenation_pill', quantity: 5 }] },
    ],
    repeatable: false, boardIds: ['board_tutorial'], storylineId: 'storyline_tutorial',
    eventMapping: [
      { eventType: 'faction:joined', targetField: '', objectiveType: 'custom' },
    ],
    dialog: {
      title: '势力系统',
      content: [
        '加入势力可以获得更多成长资源：',
        '',
        '• 完成势力日常/周常任务获取贡献',
        '• 贡献可兑换势力专属物品和功法',
        '• 提升声望解锁更高等级的福利',
        '• 不同势力有不同的侧重方向',
        '',
        '选择一个你感兴趣的势力加入吧！',
      ].join('\n'),
      confirmText: '选势力',
    },
  },

  // ====== step_complete_adventure (no dialog) ======
  {
    id: 'tutorial_complete_adventure',
    name: '完成一次机缘探索',
    description: '击败机缘探索的 Boss 完成探索',
    type: 'main',
    prerequisites: [{ type: 'quest_completed', target: 'tutorial_join_faction' }],
    stages: [{
      id: 'stage_1', name: '完成探索', description: '完成一次机缘探索',
      objectives: [
        { type: 'custom', target: '', count: 1, description: '完成机缘' },
      ],
      completions: { done: { description: '完成' } },
    }],
    rewards: [],
    repeatable: false, boardIds: ['board_tutorial'], storylineId: 'storyline_tutorial',
    eventMapping: [
      { eventType: 'adventure:completed', targetField: '', objectiveType: 'custom' },
    ],
  },

  // ====== step_claim_achievement ======
  {
    id: 'tutorial_claim_achievement',
    name: '领取成就奖励',
    description: '在成就界面领取一个已完成的成就奖励',
    type: 'main',
    prerequisites: [{ type: 'quest_completed', target: 'tutorial_complete_adventure' }],
    stages: [{
      id: 'stage_1', name: '领取成就', description: '领取任意成就奖励',
      objectives: [
        { type: 'custom', target: '', count: 1, description: '领取成就' },
      ],
      completions: { done: { description: '完成' } },
    }],
    rewards: [
      { spiritStones: 300 },
      { items: [{ itemId: 'spirit_gathering_pill', quantity: 3 }] },
      { items: [{ itemId: 'wanjie-core:cultivation:golden_core_pill', quantity: 1 }] },
      { items: [{ itemId: 'vitality_pill', quantity: 2 }] },
    ],
    repeatable: false, boardIds: ['board_tutorial'], storylineId: 'storyline_tutorial',
    eventMapping: [
      { eventType: 'achievement:claimed', targetField: '', objectiveType: 'custom' },
    ],
    dialog: {
      title: '成就系统',
      content: [
        '成就记录你的修行历程：',
        '',
        '• 完成特定目标自动解锁成就',
        '• 已解锁的成就可以领取奖励',
        '• 成就奖励包含经验、灵石和稀有物品',
        '• 成就进度永久保存',
        '',
        '现在去领取你的第一个成就奖励吧！',
      ].join('\n'),
      confirmText: '去领取',
    },
  },
];
