/**
 * 事件数据 - 完整版
 * 
 * 使用说明：
 * - 事件分为四类：safe（安全）、risky（风险）、dangerous（危险）、battle（战斗）
 * - 经验值参考：安全事件 15-25，风险事件 25-40，危险事件 40-60，战斗事件 25-45
 * - 每个事件包含：标题、描述、多个选项
 * - 战斗事件包含 battle 属性
 * 
 * ID 范围：
 * - 安全事件: 101-199
 * - 风险事件: 1-99
 * - 危险事件: 201-299
 * - 战斗事件: 301-399
 */

import { AdventureEvent } from '@/core/types';

// ============================================
// 安全事件池（纯收益）
// ============================================

export const SAFE_EVENTS: AdventureEvent[] = [
  {
    id: 101,
    title: '意外收获',
    description: '你在一处隐蔽的角落发现了一个被人遗忘的储物箱，似乎完好无损。',
    choices: [
      {
        text: '打开看看',
        effects: { stats: { 幸运: 2 }, experience: 18 },
        result: '箱子里有一些有用的物资，运气不错！'
      }
    ]
  },
  {
    id: 102,
    title: '高人指点',
    description: '一位老者看你根骨不错，主动传授了你一些心得。',
    choices: [
      {
        text: '虚心请教',
        effects: { stats: { 悟性: 3 }, experience: 20 },
        result: '老者的指点让你茅塞顿开，悟性有所提升。'
      }
    ]
  },
  {
    id: 103,
    title: '平静修炼',
    description: '你找到了一处清幽之地，环境宜人，适合静心修炼。',
    choices: [
      {
        text: '就地打坐',
        effects: { stats: { 意志: 2, 灵根: 1 }, experience: 22 },
        result: '在这里修炼效果不错，你感到修为有所精进。'
      }
    ]
  },
  {
    id: 104,
    title: '天生好运',
    description: '你在路上捡到了一个钱袋，里面装着不少灵石。',
    choices: [
      {
        text: '收下钱袋',
        effects: { stats: { 幸运: 3 }, experience: 15 },
        result: '这真是意外之喜，你将灵石收入囊中。'
      }
    ]
  },
  {
    id: 105,
    title: '功法领悟',
    description: '你在一处石壁上看到了前人留下的功法残篇，颇有启发。',
    choices: [
      {
        text: '仔细研读',
        effects: { stats: { 悟性: 2, 灵根: 2 }, experience: 20 },
        result: '残篇虽然不完整，但对你仍有启发，你感到修炼更进一步了。'
      }
    ]
  },
  {
    id: 106,
    title: '友人相助',
    description: '一位旧友路过，看到你后热情地分享了一些修炼心得。',
    choices: [
      {
        text: '虚心接受',
        effects: { stats: { 悟性: 2, 意志: 1 }, experience: 18 },
        result: '友人的心得让你对修炼有了新的理解，收获颇丰。'
      }
    ]
  },
  {
    id: 107,
    title: '机缘巧合',
    description: '你在探险途中发现了一处灵气充沛的泉眼，水质清澈甘甜。',
    choices: [
      {
        text: '饮用灵泉',
        effects: { stats: { 体质: 2, 灵根: 2 }, experience: 22 },
        result: '灵泉水甘甜可口，饮用后你感到身体和灵根都得到了净化。'
      }
    ]
  },
];

// ============================================
// 风险事件池（有得有失）
// ============================================

export const RISKY_EVENTS: AdventureEvent[] = [
  {
    id: 1,
    title: '密林遇袭',
    description: '你在穿越一片密林时，突然听到身后传来窸窸窣窣的声音。回头一看，三只凶兽正虎视眈眈地盯着你。',
    choices: [
      {
        text: '正面对抗（高风险高回报）',
        effects: { stats: { 体质: 4, 意志: 3, 幸运: -1 }, experience: 35 },
        result: '你勇敢地迎战，经过一番激战，成功击退凶兽。战斗让你的体魄更加强健，但也受了些伤。'
      },
      {
        text: '巧妙周旋（稳妥之策）',
        effects: { stats: { 悟性: 2 }, experience: 25 },
        result: '你运用智慧，设下陷阱分散凶兽注意力，成功脱身。这次经历让你的悟性有所提升。'
      },
      {
        text: '极速逃离（保守选择）',
        effects: { stats: { 幸运: 1, 意志: -1 }, experience: 12 },
        result: '你转身就跑，凭借运气成功甩掉了凶兽。虽然有些狼狈，但至少保住了性命，却也错过了一些机缘。'
      }
    ]
  },
  {
    id: 2,
    title: '神秘老者',
    description: '路旁坐着一位白发老者，看起来平平无奇，但你能感受到他身上若有若无的气息。他向你招了招手。',
    choices: [
      {
        text: '上前请教（可能获得传承）',
        effects: { stats: { 悟性: 5, 意志: -1 }, experience: 32 },
        result: '老者微笑着传你几句心法，虽然简短，却让你茅塞顿开。但老者要求你保守秘密，不能外传。'
      },
      {
        text: '保持警惕（稳妥）',
        effects: { stats: { 意志: 2 }, experience: 22 },
        result: '你谨慎地保持距离，老者意味深长地看了你一眼后消失不见。你不知道是否错过了什么。'
      },
      {
        text: '转身离开（放弃）',
        effects: { stats: { 幸运: -1 }, experience: 10 },
        result: '你转身离去，错过了可能的机缘。心中隐隐有些后悔。'
      }
    ]
  },
  {
    id: 3,
    title: '残破遗迹',
    description: '你发现了一座残破的古老建筑，虽然破败不堪，但隐约可见内部光芒闪烁，似乎有宝物存在。',
    choices: [
      {
        text: '深入探索（可能有陷阱）',
        effects: { stats: { 幸运: 6, 体质: -3 }, experience: 40 },
        result: '你在遗迹内发现了一个古老的储物盒，打开时触发了防御阵法，受了些伤但收获颇丰。'
      },
      {
        text: '谨慎观察（低风险）',
        effects: { stats: { 悟性: 3 }, experience: 15 },
        result: '你仔细观察遗迹的构造，发现了一些古老的阵法痕迹。虽然没有找到宝物，但让你对功法有了新的理解。'
      },
      {
        text: '绕道而行（放弃）',
        effects: { stats: { 意志: 1 }, experience: 8 },
        result: '你觉得此地太过诡异，决定绕道而行。虽然错过了可能的机缘，但平安无事。'
      }
    ]
  },
  {
    id: 4,
    title: '拍卖盛会',
    description: '你来到了一座繁华的城池，恰好遇到百年一遇的拍卖盛会。各色宝物琳琅满目，令你目不暇接。',
    choices: [
      {
        text: '参与拍卖（消耗资源换取机缘）',
        effects: { stats: { 幸运: 5, 意志: -2 }, experience: 25 },
        result: '你花了不少资源，拍得了一件宝物。虽然付出了代价，但这笔交易还算值得。'
      },
      {
        text: '观察行情（免费学习）',
        effects: { stats: { 悟性: 4 }, experience: 12 },
        result: '你没有参与竞拍，而是观察各路强者的出价和举止。这让你对这个世界的格局有了更深的理解。'
      },
      {
        text: '寻找其他机缘（错过机会）',
        effects: { stats: { 幸运: -1 }, experience: 5 },
        result: '拍卖会上的东西太贵，你决定离开。虽然没有损失，但也没有收获。'
      }
    ]
  },
  {
    id: 5,
    title: '修行瓶颈',
    description: '经过一段时间的修炼，你感到自己的进展缓慢，似乎遇到了瓶颈。',
    choices: [
      {
        text: '闭关突破（风险较大）',
        effects: { stats: { 意志: 8, 体质: -4, 悟性: 3 }, experience: 35 },
        result: '你强行闭关突破，虽然最终成功，但耗费了大量精力，身体也受到了一些损伤。'
      },
      {
        text: '外出历练（渐进方式）',
        effects: { stats: { 体质: 3, 悟性: 3, 幸运: 1 }, experience: 20 },
        result: '你决定外出历练，在生死边缘寻找突破。稳步前进虽然没有惊喜，但也没有风险。'
      },
      {
        text: '暂缓修炼（休息调整）',
        effects: { stats: { 意志: 2 }, experience: 10 },
        result: '你决定暂时放下，先休整一番。虽然没有突破，但状态恢复了不少。'
      }
    ]
  },
  {
    id: 6,
    title: '势力邀请',
    description: '一个不大不小的势力向你发出了邀请，承诺可以提供修炼资源和保护。',
    choices: [
      {
        text: '加入势力（获得资源但受限）',
        effects: { stats: { 灵根: 3, 意志: -3, 幸运: 1 }, experience: 20 },
        result: '你加入了这个势力，获得了修炼资源，但也需要执行任务，自由受到限制。'
      },
      {
        text: '婉拒邀请（保持自由）',
        effects: { stats: { 意志: 4, 幸运: -1 }, experience: 12 },
        result: '你婉拒了邀请，决定独自修行。虽然少了一些资源，但你的意志更加坚定。'
      },
      {
        text: '提出条件（折中方案）',
        effects: { stats: { 悟性: 2, 幸运: 2 }, experience: 15 },
        result: '你提出了一些条件，势力考虑后同意提供一些资源，但不需要你正式加入。各取所需。'
      }
    ]
  },
  {
    id: 7,
    title: '意外发现',
    description: '你在修炼时，意外发现自己的体内似乎有一股神秘的力量在涌动。',
    choices: [
      {
        text: '引导力量（可能失控）',
        effects: { stats: { 灵根: 8, 体质: -5, 意志: 2 }, experience: 40 },
        result: '你尝试引导这股力量，过程惊险万分，险些走火入魔。最终成功引导，但身体受到了损伤。'
      },
      {
        text: '小心观察（稳妥研究）',
        effects: { stats: { 悟性: 4 }, experience: 18 },
        result: '你小心翼翼地观察这股力量，发现它与你的修炼功法有微妙的关联。这让你对功法有了更深的理解。'
      },
      {
        text: '暂时忽略（保守选择）',
        effects: { stats: { 意志: 1 }, experience: 8 },
        result: '你决定暂时忽略这股力量，专注于当前修炼。稳健的做法让你保持了稳定的进步。'
      }
    ]
  },
  {
    id: 8,
    title: '生死危机',
    description: '在一次探险中，你不慎落入一个陷阱，四周布满了致命的危险。',
    choices: [
      {
        text: '拼死一搏（置之死地而后生）',
        effects: { stats: { 体质: 10, 意志: 6, 幸运: -3 }, experience: 50 },
        result: '你在生死之间爆发出了惊人的潜力，虽然身负重伤，但成功脱困并因祸得福，获得了巨大提升。'
      },
      {
        text: '冷静分析（寻找生机）',
        effects: { stats: { 悟性: 6, 幸运: 3 }, experience: 30 },
        result: '你冷静下来仔细分析困境，找到了破绽。成功脱险后，你的悟性和运气都有所提升。'
      },
      {
        text: '等待救援（被动等待）',
        effects: { stats: { 意志: -2, 幸运: 4 }, experience: 15 },
        result: '你选择等待救援，幸运地被路过的强者救下。虽然保住了性命，但信心受到了打击。'
      }
    ]
  },
  {
    id: 9,
    title: '宝地现世',
    description: '传闻一处上古大能的洞府现世，无数强者蜂拥而至。你也来到了这里。',
    choices: [
      {
        text: '深入核心（富贵险中求）',
        effects: { stats: { 幸运: 10, 意志: 4, 体质: -5 }, experience: 60 },
        result: '你冒险深入核心区域，在激烈的争夺中受了伤，但也得到了大量资源，真是险中求胜！'
      },
      {
        text: '外围探索（安全为主）',
        effects: { stats: { 悟性: 4 }, experience: 25 },
        result: '你在外围小心探索，虽然没有找到惊天宝物，但也收获了不少，而且安全无虞。'
      },
      {
        text: '退避三舍（明哲保身）',
        effects: { stats: { 意志: 2, 幸运: -1 }, experience: 10 },
        result: '你觉得此地太过凶险，选择退避。虽然没有得到什么，但至少全身而退。'
      }
    ]
  },
  {
    id: 10,
    title: '同门之争',
    description: '你的同门似乎对你心生嫉妒，处处针对你，甚至暗中下绊子。',
    choices: [
      {
        text: '正面对峙（恩怨分明）',
        effects: { stats: { 意志: 6, 体质: 3, 幸运: -2 }, experience: 25 },
        result: '你直接找上门，与对方摊牌。经过一番较量，你赢得了尊重，但也得罪了一些人。'
      },
      {
        text: '暗中反击（以牙还牙）',
        effects: { stats: { 悟性: 4, 幸运: 1, 意志: -1 }, experience: 18 },
        result: '你暗中布局，让对方自食其果。这次经历让你学会了更多的处世之道，但内心有些不安。'
      },
      {
        text: '忍气吞声（息事宁人）',
        effects: { stats: { 意志: -3, 幸运: 2 }, experience: 8 },
        result: '你选择忍让，虽然避免了冲突，但心中的不甘让你意志有所动摇。不过塞翁失马，焉知非福。'
      }
    ]
  },
  {
    id: 11,
    title: '功法残卷',
    description: '你在一位陨落强者的洞府中，发现了一部残缺的功法。',
    choices: [
      {
        text: '尝试修炼（风险极大）',
        effects: { stats: { 悟性: 8, 意志: 5, 体质: -4, 灵根: -2 }, experience: 45 },
        result: '你凭借过人的悟性参悟了残卷，但功法残缺导致你修炼时险些走火入魔，受了内伤。'
      },
      {
        text: '谨慎研究（循序渐进）',
        effects: { stats: { 悟性: 5 }, experience: 25 },
        result: '你仔细研究残卷，虽然没有完全参悟，但也领悟了一些皮毛，受益匪浅。'
      },
      {
        text: '上交势力（获得奖励）',
        effects: { stats: { 幸运: 2, 意志: 1 }, experience: 18 },
        result: '你将残卷上交势力，获得了一笔奖励。虽然没有功法传承，但也是一种收获。'
      }
    ]
  },
];

// ============================================
// 危险事件池（高风险高回报）
// ============================================

export const DANGEROUS_EVENTS: AdventureEvent[] = [
  {
    id: 201,
    title: '暗杀伏击',
    description: '你正在赶路时，突然感到背后一阵寒意，似乎有人暗中盯上了你。',
    choices: [
      {
        text: '转身反击',
        effects: { stats: { 体质: -5, 意志: 3 }, experience: 15 },
        result: '你反应迅速，转身反击。虽然击退了刺客，但也受了不轻的伤。'
      },
      {
        text: '紧急躲避',
        effects: { stats: { 幸运: -3, 体质: -2 }, experience: 8 },
        result: '你紧急躲避，但还是被暗器擦伤。刺客见一击不中，立刻撤退了。'
      },
      {
        text: '假装不知',
        effects: { stats: { 体质: -8, 意志: -2 }, experience: 5 },
        result: '你假装不知，试图反制，但低估了对方的实力。对方重创你后扬长而去。'
      }
    ]
  },
  {
    id: 202,
    title: '修炼走火',
    description: '在一次深度修炼中，你感到体内的能量开始失控，似乎有走火入魔的征兆。',
    choices: [
      {
        text: '强行压制',
        effects: { stats: { 意志: 5, 体质: -6, 灵根: -2 }, experience: 20 },
        result: '你凭借坚强的意志强行压制住了暴动的能量，但身体受到了损伤，资质也受到了一些影响。'
      },
      {
        text: '顺势引导',
        effects: { stats: { 悟性: 3, 体质: -4, 幸运: -2 }, experience: 25 },
        result: '你尝试顺势引导能量，虽然勉强成功，但过程中消耗了大量精气神。'
      },
      {
        text: '紧急中断',
        effects: { stats: { 意志: -3, 体质: -3 }, experience: 10 },
        result: '你紧急中断修炼，虽然没有走火入魔，但这次修炼前功尽弃，还伤了根基。'
      }
    ]
  },
  {
    id: 203,
    title: '毒物侵袭',
    description: '你不慎误入了一片毒瘴之地，四周弥漫着致命的毒气。',
    choices: [
      {
        text: '屏息冲出',
        effects: { stats: { 体质: -4, 意志: 2 }, experience: 12 },
        result: '你屏住呼吸强行冲出毒瘴，虽然成功脱险，但吸入了一些毒气，身体受损。'
      },
      {
        text: '就地寻找解药',
        effects: { stats: { 悟性: 2, 体质: -3, 幸运: -1 }, experience: 15 },
        result: '你在附近寻找解毒的草药，虽然找到了一些，但耽误了时间，还是中了些毒。'
      },
      {
        text: '等待救援',
        effects: { stats: { 意志: -2, 体质: -5, 幸运: 1 }, experience: 8 },
        result: '你选择等待救援，虽然最终被人救出，但已经在毒瘴中待了太久，身体受到了严重损害。'
      }
    ]
  },
  {
    id: 204,
    title: '误入禁地',
    description: '你误入了一处被标记为禁地的区域，四周充满了诡异的气息。',
    choices: [
      {
        text: '快速撤离',
        effects: { stats: { 幸运: -2, 体质: -2 }, experience: 5 },
        result: '你立刻转身撤离，但还是受到了禁地中诡异气息的侵扰，身体和精神都受到了影响。'
      },
      {
        text: '探索一番',
        effects: { stats: { 幸运: 3, 体质: -6, 意志: -2 }, experience: 20 },
        result: '你冒险探索，发现了一些有价值的东西，但付出的代价也不小，受到了禁地力量的反噬。'
      },
      {
        text: '深入调查',
        effects: { stats: { 悟性: 2, 体质: -8, 灵根: -3, 幸运: -3 }, experience: 15 },
        result: '你深入调查禁地的秘密，虽然获得了一些知识，但受到了严重的反噬，身心俱损。'
      }
    ]
  },
];

// ============================================
// 战斗事件池（必须战斗）
// ============================================

export const BATTLE_EVENTS: AdventureEvent[] = [
  {
    id: 301,
    title: '拦路劫匪',
    description: '一伙劫匪挡住了你的去路，领头的人凶神恶煞地看着你："留下买路财！"看来不战不行了。',
    choices: [
      {
        text: '迎战劫匪（战斗）',
        effects: { stats: { 意志: 2, 幸运: 1 }, experience: 25 },
        result: '你击败了劫匪，从他们身上搜出了一些财物。这场战斗让你更加坚定了修行之心。',
        battle: { enemyType: 'enemy', levelOffset: 0 }
      }
    ]
  },
  {
    id: 302,
    title: '妖兽拦路',
    description: '一只凶猛的妖兽出现在你面前，它的眼中充满了嗜血的光芒。这似乎是它的领地，不击败它就无法继续前进。',
    choices: [
      {
        text: '斩杀妖兽（战斗）',
        effects: { stats: { 体质: 2, 灵根: 1 }, experience: 30 },
        result: '经过一番激战，你斩杀了这只妖兽。它的精血让你的体质得到了淬炼。',
        battle: { enemyType: 'enemy', levelOffset: 1 }
      }
    ]
  },
  {
    id: 303,
    title: '仇敌相遇',
    description: '冤家路窄！你遇到了曾经的仇敌，他看到你后冷笑道："天堂有路你不走，地狱无门自来投！"',
    choices: [
      {
        text: '决一死战（战斗）',
        effects: { stats: { 意志: 3, 幸运: 2 }, experience: 35 },
        result: '仇敌倒在了你的脚下，这段恩怨终于了结。你的心境更加通透了。',
        battle: { enemyType: 'enemy', levelOffset: 2 }
      }
    ]
  },
  {
    id: 304,
    title: '守护宝物',
    description: '你发现了一个散发着宝光的宝箱，但旁边卧着一只强大的守护兽，它警觉地看着你。想要宝物，必须先打败它。',
    choices: [
      {
        text: '击败守护兽（战斗）',
        effects: { stats: { 悟性: 2, 幸运: 3 }, experience: 40 },
        result: '守护兽倒下了，你获得了宝箱中的宝物。这番努力没有白费！',
        battle: { enemyType: 'boss', levelOffset: 1 }
      }
    ]
  },
  {
    id: 305,
    title: '遭遇魔修',
    description: '一个浑身散发着诡异气息的魔修挡在你面前，狞笑道："你的灵魂，我要了！"',
    choices: [
      {
        text: '斩杀魔修（战斗）',
        effects: { stats: { 意志: 4, 悟性: 2 }, experience: 45 },
        result: '你斩杀了魔修，他的邪术被破，你的道心更加稳固。',
        battle: { enemyType: 'boss', levelOffset: 2 }
      }
    ]
  },
];

/**
 * 所有事件的合集
 */
export const ALL_EVENTS: AdventureEvent[] = [
  ...SAFE_EVENTS,
  ...RISKY_EVENTS,
  ...DANGEROUS_EVENTS,
  ...BATTLE_EVENTS,
];

/**
 * 事件风险类型
 */
export type EventRisk = 'safe' | 'risky' | 'dangerous' | 'battle';

/**
 * 根据风险类型获取事件池
 */
export function getEventsByRisk(risk: EventRisk): AdventureEvent[] {
  switch (risk) {
    case 'safe':
      return SAFE_EVENTS;
    case 'risky':
      return RISKY_EVENTS;
    case 'dangerous':
      return DANGEROUS_EVENTS;
    case 'battle':
      return BATTLE_EVENTS;
    default:
      return RISKY_EVENTS;
  }
}

/**
 * 随机获取一个事件
 */
export function getRandomEventFromData(risk?: EventRisk): AdventureEvent {
  const events = risk ? getEventsByRisk(risk) : ALL_EVENTS;
  return events[Math.floor(Math.random() * events.length)];
}
