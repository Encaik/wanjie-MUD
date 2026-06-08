/**
 * 事件链数据
 *
 * 定义 5 条事件链，每条包含 3-5 个关联事件。
 * 完成整条链后获得独特奖励。
 * 支持分支选项和前置条件。
 */

import type { EventChain, ChainEventDef } from '@/lib/game/events/types';

// ============================================
// 事件链 1：仙人遗府
// ============================================

const RUINS_OF_IMMORTAL: EventChain = {
  chainId: 'ruins_of_immortal',
  name: '仙人遗府',
  description: '偶然发现一座上古仙人的遗府，里面隐藏着惊天的秘密...',
  worldTypes: ['修仙', '仙侠', '高武'],
  events: [
    {
      eventId: 'ruins_01_discovery',
      title: '遗府入口',
      description: '你在山中修炼时，发现了一处被藤蔓掩盖的古老石门。石门上刻着模糊的符文，散发着淡淡的灵气。',
      chainIndex: 1,
      choices: [
        {
          text: '推开石门进入',
          effects: { experience: 30 },
          result: '你用力推开沉重的石门，一股陈腐的气息扑面而来...',
          consequences: {
            flagChanges: [{ flag: 'ruins_entered', value: true, duration: -1 }],
          },
        },
        {
          text: '先观察周围环境',
          effects: { experience: 15, stats: { 悟性: 1 } },
          result: '你仔细观察石门上的符文，隐约领悟了一些上古修炼之法...',
        },
      ],
    },
    {
      eventId: 'ruins_02_trial',
      title: '试炼大厅',
      description: '进入石门后，你来到一个宽阔的大厅。中央立着一座石像，手中握着一把泛着微光的长剑。',
      chainIndex: 2,
      choices: [
        {
          text: '挑战石像守卫',
          effects: { experience: 50, stats: { 体质: 2 } },
          result: '石像突然活化！经过一番苦战，你击败了守卫，获得了它的认可。',
          consequences: {
            flagChanges: [{ flag: 'ruins_trial_passed', value: true, duration: -1 }],
          },
        },
        {
          text: '绕过大殿继续探索',
          effects: { experience: 20 },
          result: '你小心地绕过石像，发现了通往深处的密道...',
        },
      ],
    },
    {
      eventId: 'ruins_03_inheritance',
      title: '仙人传承',
      description: '在最深处，你发现了一枚玉简和一瓶丹药。玉简中记载着一门上古功法。',
      chainIndex: 3,
      choices: [
        {
          text: '接受仙人传承',
          effects: { experience: 80, stats: { 灵根: 3, 悟性: 2 } },
          result: '你将神识沉入玉简，大量修炼心得涌入脑海！',
          consequences: {
            flagChanges: [{ flag: 'ruins_completed', value: true, duration: -1 }],
          },
        },
        {
          text: '将遗物带走研究',
          effects: { experience: 40 },
          result: '你将玉简和丹药收入囊中，准备日后慢慢研究。',
        },
      ],
    },
  ],
  completionReward: {
    description: '获得上古仙人传承：稀有功法「太虚剑诀」+ 破境丹×3',
    effects: {},
  },
};

// ============================================
// 事件链 2：魔道诱惑
// ============================================

const DEMONIC_TEMPTATION: EventChain = {
  chainId: 'demonic_temptation',
  name: '魔道诱惑',
  description: '一次偶然的机会，你接触到了禁忌的魔道功法...',
  worldTypes: ['修仙', '仙侠', '魔幻', '高武'],
  events: [
    {
      eventId: 'demon_01_encounter',
      title: '魔修遭遇',
      description: '你在荒野中遇到了一位受伤的黑衣人。他的眼中闪烁着诡异的红光，身上散发着不祥的气息。',
      chainIndex: 1,
      choices: [
        {
          text: '出手救助黑衣人',
          effects: { experience: 25 },
          result: '你帮黑衣人包扎伤口，他感激地看了你一眼，从怀中取出一本古籍...',
          consequences: {
            npcRelations: [{ npcId: 'demon_elder', delta: 10 }],
            flagChanges: [{ flag: 'demon_helped', value: true, duration: -1 }],
          },
        },
        {
          text: '警惕地离开',
          effects: { experience: 10 },
          result: '你决定不招惹麻烦，迅速离开了现场。但黑衣人的目光让你难以忘怀。',
        },
      ],
    },
    {
      eventId: 'demon_02_temptation',
      title: '力量的诱惑',
      description: '黑衣人再次出现，这次他精神抖擞。"我观你资质不凡，可愿随我修习无上魔功？"',
      chainIndex: 2,
      choices: [
        {
          text: '接受魔功修炼',
          effects: { experience: 60, stats: { 体质: 3, 意志: -1 } },
          result: '你接受了魔功的修炼，力量在短时间内暴涨，但心中隐约有了一丝杂念...',
          consequences: {
            flagChanges: [
              { flag: 'demon_path_chosen', value: true, duration: -1 },
              { flag: 'demon_corruption', value: 1, duration: 5 },
            ],
          },
        },
        {
          text: '拒绝并劝其向善',
          effects: { experience: 40, stats: { 意志: 2 } },
          result: '你拒绝了魔功的诱惑。黑衣人沉默片刻，叹道："也许你说得对..."',
          consequences: {
            npcRelations: [{ npcId: 'demon_elder', delta: -5 }],
            flagChanges: [{ flag: 'demon_refused', value: true, duration: -1 }],
          },
        },
      ],
    },
    {
      eventId: 'demon_03_finale',
      title: '最终的抉择',
      description: '黑衣人被正道修士围攻，命悬一线。他看向你的眼神中带着最后一丝希望。',
      chainIndex: 3,
      choices: [
        {
          text: '挺身而出保护黑衣人',
          effects: { experience: 100, stats: { 意志: 4 } },
          result: '你不顾危险救下了黑衣人。他临终前将毕生修为传授于你，并嘱托你不要走上他的老路。',
          consequences: {
            flagChanges: [{ flag: 'demon_chain_completed', value: true, duration: -1 }],
          },
        },
        {
          text: '袖手旁观',
          effects: { experience: 30 },
          result: '黑衣人被正道修士击杀，一段传奇就此落幕。你心中有些怅然。',
        },
      ],
    },
  ],
  completionReward: {
    description: '获得魔道秘宝：禁术「天魔解体」+ 意志永久+5',
    effects: {},
  },
};

// ============================================
// 事件链 3：天材地宝
// ============================================

const HEAVENLY_TREASURE: EventChain = {
  chainId: 'heavenly_treasure',
  name: '天材地宝',
  description: '传闻有万年难得一遇的天材地宝即将出世，各方势力蠢蠢欲动...',
  worldTypes: ['修仙', '仙侠', '魔幻', '武侠', '高武'],
  events: [
    {
      eventId: 'treasure_01_rumor',
      title: '坊间传闻',
      description: '在坊市中，你听说附近的秘境中即将有"万年灵芝"出世。消息传得沸沸扬扬。',
      chainIndex: 1,
      choices: [
        {
          text: '四处打探更多消息',
          effects: { experience: 20 },
          result: '你从几位老前辈口中得知了灵芝可能出现的大致范围。',
          consequences: {
            flagChanges: [{ flag: 'treasure_intel_gathered', value: true, duration: -1 }],
          },
        },
        {
          text: '即刻前往秘境',
          effects: { experience: 30 },
          result: '你说走就走，第一时间赶往秘境。来得早不如来得巧！',
        },
      ],
    },
    {
      eventId: 'treasure_02_competition',
      title: '争夺之战',
      description: '到达秘境后，你发现已经有数位修士在此守候。万年灵芝就在前方，但谁先拿到就归谁！',
      chainIndex: 2,
      choices: [
        {
          text: '正面争夺',
          effects: { experience: 50, stats: { 体质: 2 } },
          result: '你凭借实力击败了竞争者，率先抢到了灵芝！',
          consequences: {
            flagChanges: [{ flag: 'treasure_won_by_force', value: true, duration: -1 }],
          },
        },
        {
          text: '智取：分散他人注意力',
          effects: { experience: 40, stats: { 悟性: 2 } },
          result: '你制造了一场小混乱，在众人分神之际悄悄取走了灵芝。',
        },
      ],
    },
    {
      eventId: 'treasure_03_use',
      title: '灵芝之力',
      description: '万年灵芝散发着浓郁的灵气。如何利用它才能最大化效果？',
      chainIndex: 3,
      choices: [
        {
          text: '直接服下',
          effects: { experience: 100, stats: { 体质: 3, 灵根: 3 } },
          result: '你将灵芝直接服下，磅礴的灵力在体内炸开，你的修为暴涨！',
          consequences: {
            flagChanges: [{ flag: 'treasure_chain_completed', value: true, duration: -1 }],
          },
        },
        {
          text: '炼制成丹药（需要炼制已解锁）',
          effects: { experience: 80, stats: { 灵根: 4 } },
          result: '你耐心地将灵芝炼制成丹药，药效更加温和持久。',
        },
      ],
    },
  ],
  completionReward: {
    description: '获得万年灵芝精华：灵根永久+8，解锁稀有炼丹配方',
    effects: {},
  },
};

// ============================================
// 事件链 4：师徒情深
// ============================================

const MASTER_AND_DISCIPLE: EventChain = {
  chainId: 'master_and_disciple',
  name: '师徒情深',
  description: '一位隐世高人看中了你的资质，想要收你为徒...',
  worldTypes: ['修仙', '仙侠', '高武', '武侠'],
  events: [
    {
      eventId: 'master_01_encounter',
      title: '高人的试探',
      description: '一位白发苍苍的老者出现在你面前，说要考验你的品性。',
      chainIndex: 1,
      choices: [
        {
          text: '恭敬行礼，虚心求教',
          effects: { experience: 20, stats: { 悟性: 1 } },
          result: '老者微微点头，对你的态度表示满意。"很好，心性不错。"',
          consequences: {
            npcRelations: [{ npcId: 'old_master', delta: 15 }],
            flagChanges: [{ flag: 'master_impressed', value: true, duration: -1 }],
          },
        },
        {
          text: '直言不讳，表现真性情',
          effects: { experience: 25, stats: { 意志: 1 } },
          result: '老者愣了一下，随即大笑："哈哈哈，有意思！老夫就喜欢你这样的！"',
          consequences: {
            npcRelations: [{ npcId: 'old_master', delta: 10 }],
          },
        },
      ],
    },
    {
      eventId: 'master_02_training',
      title: '严苛的训练',
      description: '老者开始传授你独门功法，但训练异常严苛。"吃得苦中苦，方为人上人。"',
      chainIndex: 2,
      choices: [
        {
          text: '咬牙坚持',
          effects: { experience: 50, stats: { 体质: 3, 意志: 2 } },
          result: '你咬牙扛过了地狱般的训练，老者眼中闪过一丝欣慰。',
          consequences: {
            npcRelations: [{ npcId: 'old_master', delta: 10 }],
            flagChanges: [{ flag: 'master_training_done', value: true, duration: -1 }],
          },
        },
        {
          text: '向师父请教更高效的修炼方法',
          effects: { experience: 40, stats: { 悟性: 2 } },
          result: '你虚心请教，老者很高兴，传授了你修炼的诀窍。',
        },
      ],
    },
    {
      eventId: 'master_03_farewell',
      title: '师父的离去',
      description: '老者的修为到了瓶颈，决定云游四海寻找突破契机。离别之际，他留下了最后的馈赠。',
      chainIndex: 3,
      choices: [
        {
          text: '接受师父的衣钵传承',
          effects: { experience: 100, stats: { 灵根: 4, 悟性: 3 } },
          result: '老者将毕生所学倾囊相授。"好好修炼，不要给为师丢脸。"',
          consequences: {
            flagChanges: [{ flag: 'master_chain_completed', value: true, duration: -1 }],
          },
        },
        {
          text: '请求随师父一起云游（需要道侣系统已解锁）',
          effects: { experience: 60 },
          result: '老者笑着摇头："你有自己的路要走。日后有缘自会再见。"',
        },
      ],
    },
  ],
  completionReward: {
    description: '获得师父衣钵：灵根+5、悟性+5，习得独门功法「天罡正气」',
    effects: {},
  },
};

// ============================================
// 事件链 5：世界裂隙
// ============================================

const WORLD_RIFT: EventChain = {
  chainId: 'world_rift',
  name: '世界裂隙',
  description: '天空中突然裂开了一道缝隙，从里面涌出了不属于这个世界的力量...',
  worldTypes: ['科技', '末世', '异能', '魔幻'],
  events: [
    {
      eventId: 'rift_01_appearance',
      title: '天裂',
      description: '一道巨大的裂隙出现在天际。从裂隙中涌出了奇异的能量，周围的生物开始变异。',
      chainIndex: 1,
      choices: [
        {
          text: '前往裂隙附近调查',
          effects: { experience: 40 },
          result: '你顶着强大的能量波动靠近裂隙，收集到了一些珍贵的能量样本。',
          consequences: {
            flagChanges: [{ flag: 'rift_investigated', value: true, duration: -1 }],
          },
        },
        {
          text: '先观察事态发展',
          effects: { experience: 15, stats: { 悟性: 1 } },
          result: '你在安全距离观察裂隙的变化，若有所思...',
        },
      ],
    },
    {
      eventId: 'rift_02_energy',
      title: '异界能量',
      description: '裂隙中涌出的能量虽然危险，但也蕴含着巨大的机遇。如何利用它？',
      chainIndex: 2,
      choices: [
        {
          text: '尝试吸收异界能量',
          effects: { experience: 60, stats: { 体质: 3 } },
          result: '你将来之不易的异界能量引入体内——成功了！你的实力获得了飞跃！',
          consequences: {
            flagChanges: [
              { flag: 'rift_energy_absorbed', value: true, duration: -1 },
              { flag: 'rift_mutation', value: 1, duration: 3 },
            ],
          },
        },
        {
          text: '小心翼翼地收集能量样本',
          effects: { experience: 35 },
          result: '你收集了大量能量样本，这些样本对研究者来说价值连城。',
        },
      ],
    },
    {
      eventId: 'rift_03_close',
      title: '封印裂隙',
      description: '裂隙在不断扩大，如果不加以封印，整个世界都可能被异界吞噬。',
      chainIndex: 3,
      choices: [
        {
          text: '贡献力量封印裂隙',
          effects: { experience: 120, stats: { 意志: 4, 灵根: 2 } },
          result: '你燃烧自身力量协助封印了裂隙。世界恢复了宁静，而你获得了世界的馈赠。',
          consequences: {
            flagChanges: [{ flag: 'rift_chain_completed', value: true, duration: -1 }],
          },
        },
        {
          text: '在裂隙消失前尽可能收集能量',
          effects: { experience: 60, stats: { 体质: 2 } },
          result: '你疯狂收集能量，虽然裂隙最终被他人封印，但你已收获颇丰。',
        },
      ],
    },
  ],
  completionReward: {
    description: '获得异界馈赠：全属性+3，习得异界技能「次元斩」',
    effects: {},
  },
};

// ============================================
// 全部事件链
// ============================================

/** 所有事件链 */
export const EVENT_CHAINS: EventChain[] = [
  RUINS_OF_IMMORTAL,
  DEMONIC_TEMPTATION,
  HEAVENLY_TREASURE,
  MASTER_AND_DISCIPLE,
  WORLD_RIFT,
];

/** 按 ID 索引的事件链映射表 */
export const EVENT_CHAINS_BY_ID: Record<string, EventChain> = {};
for (const chain of EVENT_CHAINS) {
  EVENT_CHAINS_BY_ID[chain.chainId] = chain;
}

/** 按世界类型索引的事件链映射表 */
export function getEventChainsForWorld(worldType: string): EventChain[] {
  return EVENT_CHAINS.filter(chain => chain.worldTypes.includes(worldType));
}
