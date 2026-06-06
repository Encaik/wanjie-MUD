/**
 * 地牢随机事件配置
 * 
 * 定义所有预定义的地牢事件
 * 根据 comprehensive-optimization-design.md 设计文档实现
 */

import { DungeonEvent, DungeonEventType, EVENT_TYPE_CONFIGS } from './types';

// ============================================
// 工具函数
// ============================================

/** 获取事件类型图标 */
function getEventIcon(type: DungeonEventType): string {
  return EVENT_TYPE_CONFIGS[type].icon;
}

/** 获取事件类型基础权重 */
function getEventBaseWeight(type: DungeonEventType): number {
  return EVENT_TYPE_CONFIGS[type].baseWeight;
}

// ============================================
// 神秘事件 (mystery)
// ============================================

/** 古老祭坛事件 */
export const EVENT_ANCIENT_ALTAR: DungeonEvent = {
  id: 'event_ancient_altar',
  type: 'mystery',
  name: '古老祭坛',
  description: '你发现了一座古老的祭坛，上面散发着神秘的光芒。',
  icon: getEventIcon('mystery'),
  weight: getEventBaseWeight('mystery'),
  conditions: {
    minLevel: 5,
  },
  choices: [
    {
      id: 'pray',
      text: '虔诚祈祷',
      hint: '向祭坛祈祷，可能获得祝福或反噬',
      outcomes: [
        {
          id: 'blessing',
          probability: 0.5,
          effects: [
            { type: 'gain_buff', buff: { type: 'stat_boost', stat: '灵根', value: 10, remainingCount: 5 } },
          ],
          message: '神灵回应了你的祈祷，你感到灵力大增！',
        },
        {
          id: 'backlash',
          probability: 0.3,
          effects: [
            { type: 'damage', value: 20 },
          ],
          message: '祭坛突然爆发出一阵暗光，你受到了反噬！',
        },
        {
          id: 'reward',
          probability: 0.2,
          effects: [
            { type: 'gain_spirit_stones', value: 100 },
          ],
          message: '祭坛中涌出一股灵气，凝聚成了灵石！',
        },
      ],
    },
    {
      id: 'absorb',
      text: '强行吸收祭坛能量',
      hint: '高风险高回报，可能永久提升属性',
      requirements: {
        minLevel: 30,
      },
      outcomes: [
        {
          id: 'permanent_boost',
          probability: 0.3,
          effects: [
            { type: 'gain_stat', stat: '体质', value: 5 },
          ],
          message: '你成功吸收了祭坛的精华，体质永久提升！',
        },
        {
          id: 'overload',
          probability: 0.5,
          effects: [
            { type: 'damage', value: 50 },
            { type: 'drain_mp', value: 30 },
          ],
          message: '能量过于强大，你的身体无法承受！',
        },
        {
          id: 'artifact',
          probability: 0.2,
          effects: [
            // 物品会在运行时动态生成
            { type: 'gain_item', value: 1 },
          ],
          message: '祭坛崩塌，露出了一件古老的神器！',
        },
      ],
    },
    {
      id: 'leave',
      text: '离开',
      hint: '安全离开，不做任何尝试',
      outcomes: [
        {
          id: 'safe_leave',
          probability: 1.0,
          effects: [],
          message: '你决定不冒险，继续前进。',
        },
      ],
    },
  ],
};

/** 神秘泉水事件 */
export const EVENT_MYSTERIOUS_SPRING: DungeonEvent = {
  id: 'event_mysterious_spring',
  type: 'mystery',
  name: '神秘泉水',
  description: '一眼散发着幽光的泉水，喝下它可能改变你的命运。',
  icon: getEventIcon('mystery'),
  weight: getEventBaseWeight('mystery'),
  conditions: {
    minLevel: 10,
  },
  choices: [
    {
      id: 'drink',
      text: '饮用泉水',
      outcomes: [
        {
          id: 'heal',
          probability: 0.35,
          effects: [
            { type: 'heal', value: 50 },
            { type: 'restore_mp', value: 30 },
          ],
          message: '甘甜的泉水治愈了你的伤势，精神也变得振奋！',
        },
        {
          id: 'poison',
          probability: 0.25,
          effects: [
            { type: 'damage', value: 30 },
            { type: 'gain_debuff', buff: { type: 'stat_boost', stat: '体质', value: -5, remainingCount: 3 } },
          ],
          message: '泉水有毒！你感到身体虚弱！',
        },
        {
          id: 'insight',
          probability: 0.25,
          effects: [
            { type: 'gain_exp', value: 100 },
          ],
          message: '饮用泉水后，你突然顿悟了一些修炼的道理！',
        },
        {
          id: 'stat_boost',
          probability: 0.15,
          effects: [
            { type: 'gain_stat', stat: '灵根', value: 2 },
          ],
          message: '泉水蕴含灵气，你的灵根得到了强化！',
        },
      ],
    },
    {
      id: 'fill_bottle',
      text: '装一瓶带走',
      requirements: {
        minLevel: 15,
      },
      outcomes: [
        {
          id: 'get_item',
          probability: 0.7,
          effects: [
            { type: 'gain_item', value: 1 },
          ],
          message: '你小心地装了一瓶神秘泉水，也许以后用得上。',
        },
        {
          id: 'spill',
          probability: 0.3,
          effects: [],
          message: '你不小心打翻了水瓶，泉水洒了一地...',
        },
      ],
    },
    {
      id: 'leave',
      text: '离开',
      outcomes: [
        {
          id: 'leave',
          probability: 1.0,
          effects: [],
          message: '你决定不冒险，继续前进。',
        },
      ],
    },
  ],
};

// ============================================
// 宝箱事件 (treasure)
// ============================================

/** 神秘宝箱事件 */
export const EVENT_MYSTERY_CHEST: DungeonEvent = {
  id: 'event_mystery_chest',
  type: 'treasure',
  name: '神秘宝箱',
  description: '一个古老的宝箱静静地躺在角落，散发着微弱的光芒。',
  icon: getEventIcon('treasure'),
  weight: 15,
  choices: [
    {
      id: 'open',
      text: '打开宝箱',
      hint: '可能获得宝物，也可能是陷阱',
      outcomes: [
        {
          id: 'rare_item',
          probability: 0.4,
          effects: [
            { type: 'gain_item', value: 1 },
          ],
          message: '宝箱打开，里面有一件稀有物品！',
        },
        {
          id: 'spirit_stones',
          probability: 0.3,
          effects: [
            { type: 'gain_spirit_stones', value: 200 },
          ],
          message: '宝箱里装满了灵石！',
        },
        {
          id: 'trap',
          probability: 0.2,
          effects: [
            { type: 'damage', value: 30 },
          ],
          message: '宝箱是一个陷阱！你受到了伤害！',
        },
        {
          id: 'legendary',
          probability: 0.1,
          effects: [
            { type: 'gain_item', value: 1 },
          ],
          message: '宝箱发出耀眼光芒，里面竟然是一件传说装备！',
        },
      ],
    },
    {
      id: 'examine',
      text: '仔细检查',
      hint: '需要30悟性',
      requirements: {
        stats: { 悟性: 30 },
      },
      outcomes: [
        {
          id: 'safe',
          probability: 0.7,
          effects: [],
          message: '你发现这是一个安全的宝箱，可以放心打开。',
        },
        {
          id: 'disarm_trap',
          probability: 0.3,
          effects: [
            { type: 'damage', value: 10 },
          ],
          message: '你发现了陷阱并成功拆除，但还是受了点轻伤。',
        },
      ],
    },
    {
      id: 'leave',
      text: '离开',
      outcomes: [
        {
          id: 'leave',
          probability: 1.0,
          effects: [],
          message: '你决定不冒险，继续前进。',
        },
      ],
    },
  ],
};

/** 黄金宝箱事件 */
export const EVENT_GOLDEN_CHEST: DungeonEvent = {
  id: 'event_golden_chest',
  type: 'treasure',
  name: '黄金宝箱',
  description: '一个镶嵌着宝石的黄金宝箱，看起来价值不菲。',
  icon: getEventIcon('treasure'),
  weight: 8,
  conditions: {
    minLevel: 20,
  },
  isRare: true,
  choices: [
    {
      id: 'open',
      text: '打开宝箱',
      outcomes: [
        {
          id: 'great_reward',
          probability: 0.5,
          effects: [
            { type: 'gain_item', value: 1 },
            { type: 'gain_spirit_stones', value: 500 },
          ],
          message: '黄金宝箱中装满了宝物！',
        },
        {
          id: 'curse',
          probability: 0.3,
          effects: [
            { type: 'gain_debuff', buff: { type: 'stat_boost', stat: '幸运', value: -10, remainingCount: 5 } },
            { type: 'gain_item', value: 1 },
          ],
          message: '宝箱中有宝物，但也被诅咒了！你的幸运下降！',
        },
        {
          id: 'mimic',
          probability: 0.2,
          effects: [
            { type: 'trigger_battle', battleConfig: { enemyName: '宝箱怪', enemyLevel: 25, enemyTier: 'elite' } },
          ],
          message: '宝箱突然张开大嘴，是一只宝箱怪！',
        },
      ],
    },
    {
      id: 'leave',
      text: '离开',
      outcomes: [
        {
          id: 'leave',
          probability: 1.0,
          effects: [],
          message: '你决定不冒险，继续前进。',
        },
      ],
    },
  ],
};

// ============================================
// 商人事件 (merchant)
// ============================================

/** 流浪商人事件 */
export const EVENT_WANDERING_MERCHANT: DungeonEvent = {
  id: 'event_wandering_merchant',
  type: 'merchant',
  name: '流浪商人',
  description: '一个神秘的商人出现在你面前，他的货物看起来非常特别。',
  icon: getEventIcon('merchant'),
  weight: 8,
  conditions: {
    minLevel: 10,
  },
  choices: [
    {
      id: 'buy_rare',
      text: '购买稀有物品（500灵石）',
      requirements: {
        spiritStones: 500,
      },
      outcomes: [
        {
          id: 'purchase',
          probability: 1.0,
          effects: [
            { type: 'lose_spirit_stones', value: 500 },
            { type: 'gain_item', value: 1 },
          ],
          message: '你花费500灵石购买了一件稀有物品。',
        },
      ],
    },
    {
      id: 'trade_info',
      text: '交换情报（需要悟性30）',
      hint: '商人会告诉你关于这座地牢的秘密',
      requirements: {
        stats: { 悟性: 30 },
      },
      outcomes: [
        {
          id: 'info',
          probability: 1.0,
          effects: [
            { type: 'gain_buff', buff: { type: 'stat_boost', stat: '悟性', value: 5, remainingCount: 3 } },
            { type: 'reveal_map' },
          ],
          message: '商人告诉了你一些关于这座地牢的秘密，你受益匪浅。地图也被揭示了部分！',
        },
      ],
    },
    {
      id: 'ignore',
      text: '无视商人',
      outcomes: [
        {
          id: 'ignore',
          probability: 1.0,
          effects: [],
          message: '你无视了商人，继续前进。',
        },
      ],
    },
  ],
};

/** 黑市商人事件 */
export const EVENT_BLACK_MARKET_MERCHANT: DungeonEvent = {
  id: 'event_black_market_merchant',
  type: 'merchant',
  name: '黑市商人',
  description: '一个身着黑袍的商人，他的货物虽然昂贵，但都是珍品。',
  icon: getEventIcon('merchant'),
  weight: 5,
  conditions: {
    minLevel: 30,
  },
  isRare: true,
  choices: [
    {
      id: 'buy_legendary',
      text: '购买传说物品（2000灵石）',
      requirements: {
        spiritStones: 2000,
        minLevel: 30,
      },
      outcomes: [
        {
          id: 'purchase',
          probability: 1.0,
          effects: [
            { type: 'lose_spirit_stones', value: 2000 },
            { type: 'gain_item', value: 1 },
          ],
          message: '你花费2000灵石购买了一件传说品质的物品！',
        },
      ],
    },
    {
      id: 'sell_info',
      text: '出售情报（获得500灵石）',
      requirements: {
        stats: { 悟性: 40 },
      },
      outcomes: [
        {
          id: 'sell',
          probability: 1.0,
          effects: [
            { type: 'gain_spirit_stones', value: 500 },
          ],
          message: '你用关于地牢深处的情报换取了500灵石。',
        },
      ],
    },
    {
      id: 'leave',
      text: '离开',
      outcomes: [
        {
          id: 'leave',
          probability: 1.0,
          effects: [],
          message: '你决定不与黑市商人交易，继续前进。',
        },
      ],
    },
  ],
};

// ============================================
// 神殿事件 (shrine)
// ============================================

/** 修炼神殿事件 */
export const EVENT_CULTIVATION_SHRINE: DungeonEvent = {
  id: 'event_cultivation_shrine',
  type: 'shrine',
  name: '修炼神殿',
  description: '一座古老的神殿，据说在这里修炼可以获得神灵庇佑。',
  icon: getEventIcon('shrine'),
  weight: 5,
  conditions: {
    minLevel: 15,
  },
  choices: [
    {
      id: 'meditate',
      text: '冥想修炼',
      hint: '花费时间获得经验',
      outcomes: [
        {
          id: 'insight',
          probability: 0.6,
          effects: [
            { type: 'gain_exp', value: 150 },
            { type: 'gain_buff', buff: { type: 'stat_boost', stat: '灵根', value: 5, remainingCount: 5 } },
          ],
          message: '神殿中的灵气浓郁，你获得了大量修炼经验！',
        },
        {
          id: 'disturbance',
          probability: 0.3,
          effects: [
            { type: 'gain_exp', value: 50 },
          ],
          message: '修炼被打断，但你还是获得了一些经验。',
        },
        {
          id: 'enlightenment',
          probability: 0.1,
          effects: [
            { type: 'gain_stat', stat: '灵根', value: 3 },
            { type: 'gain_exp', value: 200 },
          ],
          message: '你在修炼中顿悟，灵根得到了永久提升！',
        },
      ],
    },
    {
      id: 'pray',
      text: '向神殿祈祷',
      outcomes: [
        {
          id: 'blessing',
          probability: 0.5,
          effects: [
            { type: 'heal', value: 30 },
            { type: 'restore_mp', value: 20 },
            { type: 'gain_buff', buff: { type: 'stat_boost', stat: '意志', value: 10, remainingCount: 5 } },
          ],
          message: '神殿的神灵接受了你的祈祷，赐予你祝福！',
        },
        {
          id: 'no_response',
          probability: 0.5,
          effects: [],
          message: '神殿一片寂静，似乎没有神灵回应。',
        },
      ],
    },
    {
      id: 'leave',
      text: '离开',
      outcomes: [
        {
          id: 'leave',
          probability: 1.0,
          effects: [],
          message: '你离开了神殿，继续探索。',
        },
      ],
    },
  ],
};

// ============================================
// 祝福事件 (blessing)
// ============================================

/** 神圣祝福事件 */
export const EVENT_DIVINE_BLESSING: DungeonEvent = {
  id: 'event_divine_blessing',
  type: 'blessing',
  name: '神圣祝福',
  description: '一道金光从天而降，你感到浑身充满了力量。',
  icon: getEventIcon('blessing'),
  weight: 5,
  conditions: {
    minLevel: 20,
  },
  choices: [
    {
      id: 'accept',
      text: '接受祝福',
      outcomes: [
        {
          id: 'powerful_blessing',
          probability: 0.6,
          effects: [
            { type: 'heal', value: 50 },
            { type: 'restore_mp', value: 30 },
            { type: 'gain_buff', buff: { type: 'stat_boost', stat: '灵根', value: 10, remainingCount: 5 } },
          ],
          message: '你接受了祝福，感到力量涌入体内！',
        },
        {
          id: 'gentle_blessing',
          probability: 0.3,
          effects: [
            { type: 'heal', value: 30 },
            { type: 'restore_mp', value: 20 },
          ],
          message: '祝福温和地治愈了你的伤势。',
        },
        {
          id: 'intense_blessing',
          probability: 0.1,
          effects: [
            { type: 'damage', value: 20 },
            { type: 'gain_buff', buff: { type: 'stat_boost', stat: '意志', value: 20, remainingCount: 10 } },
          ],
          message: '祝福的力量过于强大，你受到了一些伤害，但意志更加坚定了。',
        },
      ],
    },
    {
      id: 'refuse',
      text: '拒绝',
      outcomes: [
        {
          id: 'refuse',
          probability: 1.0,
          effects: [],
          message: '你警惕地拒绝了，继续前进。',
        },
      ],
    },
  ],
};

// ============================================
// 陷阱事件 (trap)
// ============================================

/** 毒气陷阱事件 */
export const EVENT_POISON_TRAP: DungeonEvent = {
  id: 'event_poison_trap',
  type: 'trap',
  name: '毒气陷阱',
  description: '你触发了陷阱！一阵毒气向你扑来。',
  icon: getEventIcon('trap'),
  weight: 8,
  choices: [
    {
      id: 'hold_breath',
      text: '屏住呼吸',
      outcomes: [
        {
          id: 'avoid',
          probability: 0.4,
          effects: [],
          message: '你成功屏住呼吸，躲过了毒气！',
        },
        {
          id: 'partial',
          probability: 0.4,
          effects: [
            { type: 'damage', value: 20 },
            { type: 'gain_debuff', buff: { type: 'stat_boost', stat: '体质', value: -5, remainingCount: 3 } },
          ],
          message: '你吸入了一些毒气，感到身体不适。',
        },
        {
          id: 'fail',
          probability: 0.2,
          effects: [
            { type: 'damage', value: 40 },
            { type: 'gain_debuff', buff: { type: 'stat_boost', stat: '体质', value: -10, remainingCount: 5 } },
          ],
          message: '毒气太浓，你受到了严重伤害！',
        },
      ],
    },
    {
      id: 'use_item',
      text: '使用解毒丹',
      hint: '需要携带解毒丹',
      requirements: {
        itemId: 'antidote_pill',
      },
      outcomes: [
        {
          id: 'cure',
          probability: 1.0,
          effects: [
            { type: 'lose_item', value: 1 },
          ],
          message: '你及时服下解毒丹，完全抵御了毒气！',
        },
      ],
    },
    {
      id: 'force_through',
      text: '强行突破',
      requirements: {
        stats: { 体质: 40 },
      },
      outcomes: [
        {
          id: 'breakthrough',
          probability: 0.6,
          effects: [
            { type: 'damage', value: 10 },
          ],
          message: '凭借强健的体质，你强行冲过了毒气区域！',
        },
        {
          id: 'fail',
          probability: 0.4,
          effects: [
            { type: 'damage', value: 30 },
            { type: 'gain_debuff', buff: { type: 'stat_boost', stat: '体质', value: -5, remainingCount: 3 } },
          ],
          message: '体质还是不够强，你受到了伤害！',
        },
      ],
    },
  ],
};

/** 石头陷阱事件 */
export const EVENT_ROCK_TRAP: DungeonEvent = {
  id: 'event_rock_trap',
  type: 'trap',
  name: '落石陷阱',
  description: '头顶传来异响，落石正在向你砸来！',
  icon: getEventIcon('trap'),
  weight: 8,
  choices: [
    {
      id: 'dodge',
      text: '闪避',
      outcomes: [
        {
          id: 'perfect_dodge',
          probability: 0.3,
          effects: [],
          message: '你敏捷地闪开了所有落石！',
        },
        {
          id: 'partial_dodge',
          probability: 0.5,
          effects: [
            { type: 'damage', value: 15 },
          ],
          message: '你躲开了大部分落石，但还是被擦伤了。',
        },
        {
          id: 'hit',
          probability: 0.2,
          effects: [
            { type: 'damage', value: 40 },
          ],
          message: '你被落石重重砸中！',
        },
      ],
    },
    {
      id: 'shield',
      text: '用护甲抵挡',
      requirements: {
        stats: { 意志: 30 },
      },
      outcomes: [
        {
          id: 'block',
          probability: 0.7,
          effects: [
            { type: 'damage', value: 5 },
          ],
          message: '你用护甲成功挡住了落石！',
        },
        {
          id: 'armor_break',
          probability: 0.3,
          effects: [
            { type: 'damage', value: 20 },
          ],
          message: '落石砸坏了你的护甲，你受到了一些伤害。',
        },
      ],
    },
  ],
};

// ============================================
// 隐藏房间事件 (hidden_room)
// ============================================

/** 隐藏宝库事件 */
export const EVENT_HIDDEN_VAULT: DungeonEvent = {
  id: 'event_hidden_vault',
  type: 'hidden_room',
  name: '隐藏宝库',
  description: '你发现了一个隐藏的宝库，里面堆满了宝藏！',
  icon: getEventIcon('hidden_room'),
  weight: 5,
  conditions: {
    minLevel: 25,
  },
  isRare: true,
  choices: [
    {
      id: 'take_all',
      text: '全部拿走',
      hint: '贪婪可能招来危险',
      outcomes: [
        {
          id: 'success',
          probability: 0.4,
          effects: [
            { type: 'gain_spirit_stones', value: 1000 },
            { type: 'gain_item', value: 2 },
          ],
          message: '你成功拿走了所有宝藏！',
        },
        {
          id: 'trap',
          probability: 0.4,
          effects: [
            { type: 'gain_spirit_stones', value: 500 },
            { type: 'damage', value: 50 },
          ],
          message: '宝库设有保护机制，你触发陷阱但还是拿到了一些宝藏！',
        },
        {
          id: 'guardian',
          probability: 0.2,
          effects: [
            { type: 'trigger_battle', battleConfig: { enemyName: '宝库守护者', enemyLevel: 35, enemyTier: 'miniboss' } },
          ],
          message: '宝库守护者苏醒了！',
        },
      ],
    },
    {
      id: 'take_carefully',
      text: '小心取走部分',
      hint: '安全但收益较少',
      outcomes: [
        {
          id: 'safe_loot',
          probability: 0.8,
          effects: [
            { type: 'gain_spirit_stones', value: 400 },
            { type: 'gain_item', value: 1 },
          ],
          message: '你小心地取走了部分宝藏，没有触发任何机关。',
        },
        {
          id: 'minor_trap',
          probability: 0.2,
          effects: [
            { type: 'gain_spirit_stones', value: 200 },
            { type: 'damage', value: 15 },
          ],
          message: '你不小心触发了一个小机关，但还是拿到了一些宝藏。',
        },
      ],
    },
    {
      id: 'leave',
      text: '离开',
      outcomes: [
        {
          id: 'leave',
          probability: 1.0,
          effects: [],
          message: '你决定不冒险，继续前进。',
        },
      ],
    },
  ],
};

// ============================================
// 精英守护者事件 (elite_guardian)
// ============================================

/** 沉睡守护者事件 */
export const EVENT_SLEEPING_GUARDIAN: DungeonEvent = {
  id: 'event_sleeping_guardian',
  type: 'elite_guardian',
  name: '沉睡守护者',
  description: '一个强大的守护者正在沉睡，击败它可能获得丰厚奖励。',
  icon: getEventIcon('elite_guardian'),
  weight: 3,
  conditions: {
    minLevel: 30,
  },
  isRare: true,
  choices: [
    {
      id: 'sneak',
      text: '悄悄绕过',
      outcomes: [
        {
          id: 'success',
          probability: 0.5,
          effects: [],
          message: '你成功绕过了守护者，继续前进。',
        },
        {
          id: 'wake',
          probability: 0.5,
          effects: [
            { type: 'trigger_battle', battleConfig: { enemyName: '守护者', enemyLevel: 40, enemyTier: 'elite' } },
          ],
          message: '你不小心惊醒了守护者！',
        },
      ],
    },
    {
      id: 'attack',
      text: '发起突袭',
      hint: '获得先手优势',
      requirements: {
        minLevel: 35,
      },
      outcomes: [
        {
          id: 'surprise',
          probability: 0.6,
          effects: [
            { type: 'trigger_battle', battleConfig: { enemyName: '守护者', enemyLevel: 38, enemyTier: 'elite' } },
          ],
          message: '你成功突袭，守护者措手不及！',
        },
        {
          id: 'fail',
          probability: 0.4,
          effects: [
            { type: 'trigger_battle', battleConfig: { enemyName: '守护者', enemyLevel: 42, enemyTier: 'elite' } },
          ],
          message: '守护者在你攻击前就醒了过来！',
        },
      ],
    },
    {
      id: 'leave',
      text: '离开',
      outcomes: [
        {
          id: 'leave',
          probability: 1.0,
          effects: [],
          message: '你决定不与守护者纠缠，继续探索其他区域。',
        },
      ],
    },
  ],
};

// ============================================
// 休息相关事件
// ============================================

/** 灵泉休息点事件 */
export const EVENT_SPIRIT_SPRING: DungeonEvent = {
  id: 'event_spirit_spring',
  type: 'blessing',
  name: '灵泉',
  description: '一眼散发着灵气的泉水，看起来可以恢复你的状态。',
  icon: getEventIcon('blessing'),
  weight: 10,
  choices: [
    {
      id: 'drink',
      text: '饮用泉水',
      outcomes: [
        {
          id: 'heal',
          probability: 0.7,
          effects: [
            { type: 'heal', value: 40 },
            { type: 'restore_mp', value: 30 },
          ],
          message: '甘甜的泉水让你恢复了大量的生命和法力！',
        },
        {
          id: 'overcharge',
          probability: 0.3,
          effects: [
            { type: 'heal', value: 60 },
            { type: 'restore_mp', value: 40 },
            { type: 'gain_buff', buff: { type: 'stat_boost', stat: '灵根', value: 5, remainingCount: 3 } },
          ],
          message: '泉水蕴含强大的灵气，你的状态完全恢复，还获得了临时增益！',
        },
      ],
    },
    {
      id: 'fill_bottle',
      text: '装瓶带走',
      outcomes: [
        {
          id: 'fill',
          probability: 1.0,
          effects: [
            { type: 'gain_item', value: 1 },
          ],
          message: '你装了一瓶灵泉水，可以留着以后使用。',
        },
      ],
    },
    {
      id: 'leave',
      text: '离开',
      outcomes: [
        {
          id: 'leave',
          probability: 1.0,
          effects: [],
          message: '你决定继续前进。',
        },
      ],
    },
  ],
};

// ============================================
// 导出所有事件
// ============================================

/** 所有预定义事件列表 */
export const DUNGEON_EVENTS: DungeonEvent[] = [
  // 神秘事件
  EVENT_ANCIENT_ALTAR,
  EVENT_MYSTERIOUS_SPRING,
  
  // 宝箱事件
  EVENT_MYSTERY_CHEST,
  EVENT_GOLDEN_CHEST,
  
  // 商人事件
  EVENT_WANDERING_MERCHANT,
  EVENT_BLACK_MARKET_MERCHANT,
  
  // 神殿事件
  EVENT_CULTIVATION_SHRINE,
  
  // 祝福事件
  EVENT_DIVINE_BLESSING,
  EVENT_SPIRIT_SPRING,
  
  // 陷阱事件
  EVENT_POISON_TRAP,
  EVENT_ROCK_TRAP,
  
  // 隐藏房间事件
  EVENT_HIDDEN_VAULT,
  
  // 精英守护者事件
  EVENT_SLEEPING_GUARDIAN,
];

/** 按类型分组的事件映射 */
export const EVENTS_BY_TYPE: Record<DungeonEventType, DungeonEvent[]> = {
  treasure: [EVENT_MYSTERY_CHEST, EVENT_GOLDEN_CHEST],
  mystery: [EVENT_ANCIENT_ALTAR, EVENT_MYSTERIOUS_SPRING],
  trap: [EVENT_POISON_TRAP, EVENT_ROCK_TRAP],
  merchant: [EVENT_WANDERING_MERCHANT, EVENT_BLACK_MARKET_MERCHANT],
  shrine: [EVENT_CULTIVATION_SHRINE],
  hidden_room: [EVENT_HIDDEN_VAULT],
  elite_guardian: [EVENT_SLEEPING_GUARDIAN],
  blessing: [EVENT_DIVINE_BLESSING, EVENT_SPIRIT_SPRING],
};

/** 按ID索引的事件映射 */
export const EVENTS_BY_ID: Record<string, DungeonEvent> = Object.fromEntries(
  DUNGEON_EVENTS.map(event => [event.id, event])
);

/** 获取事件 */
export function getEventById(eventId: string): DungeonEvent | undefined {
  return EVENTS_BY_ID[eventId];
}

/** 获取指定类型的事件 */
export function getEventsByType(type: DungeonEventType): DungeonEvent[] {
  return EVENTS_BY_TYPE[type] || [];
}

/** 获取符合条件的事件列表 */
export function getAvailableEvents(
  playerLevel: number,
  playerHpPercent: number,
  difficulty: number
): DungeonEvent[] {
  return DUNGEON_EVENTS.filter(event => {
    if (!event.conditions) return true;
    
    if (event.conditions.minLevel && playerLevel < event.conditions.minLevel) {
      return false;
    }
    if (event.conditions.maxLevel && playerLevel > event.conditions.maxLevel) {
      return false;
    }
    if (event.conditions.minHpPercent && playerHpPercent < event.conditions.minHpPercent) {
      return false;
    }
    if (event.conditions.difficultyRange) {
      const [min, max] = event.conditions.difficultyRange;
      if (difficulty < min || difficulty > max) {
        return false;
      }
    }
    
    return true;
  });
}
