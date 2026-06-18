/**
 * modules/fortune/data/defaultEvents.ts — 默认机缘事件模板
 *
 * 提供通用机缘事件池，按稀有度分级。Mod 可覆盖或追加事件。
 */

import type { FortuneEventTemplate } from '../types';

/**
 * 默认机缘事件模板池
 *
 * 覆盖 common / uncommon / rare / legendary 四个稀有度级别。
 * 所有事件 worldType 为 undefined（通用），fortuneType 为 undefined（通用）。
 */
export const DEFAULT_FORTUNE_EVENTS: FortuneEventTemplate[] = [
  // ─── Common 事件 (6) ───
  {
    id: 'fortune:common:spirit_spring',
    rarity: 'common',
    title: '灵气泉涌',
    description: '前方有一处灵气汇聚的小泉眼，泉水泛着微光。你可以稍作停留，汲取灵气恢复体力。',
    choices: [
      { text: '饮用灵泉水', effects: { hpChange: 20, experience: 10 }, resultText: '灵泉入体，伤势略微恢复，精神为之一振。' },
      { text: '收集泉水带走', effects: { spiritStones: 15 }, resultText: '你用容器装了一些灵泉，可以兑换灵石。' },
    ],
  },
  {
    id: 'fortune:common:injured_beast',
    rarity: 'common',
    title: '受伤的灵兽',
    description: '一只受伤的小灵兽蜷缩在路边，眼神中透露着求助。',
    choices: [
      { text: '出手救治', effects: { experience: 20, items: { 'wanjie:common:spirit_stone': 10 } }, resultText: '灵兽感激地蹭了蹭你，留下一小堆灵石后离去。' },
      { text: '视而不见', effects: {}, resultText: '你绕过灵兽继续前行。' },
    ],
  },
  {
    id: 'fortune:common:fallen_leaves',
    rarity: 'common',
    title: '枯叶之下',
    description: '一堆枯叶下隐约有东西在发光。',
    choices: [
      { text: '翻开枯叶查看', effects: { spiritStones: 20 }, resultText: '枯叶下埋着几块灵石，大概是前人遗落的。' },
      { text: '小心地用树枝拨开', effects: { spiritStones: 10, experience: 5 }, resultText: '你谨慎地拨开枯叶，发现一小堆灵石，没有陷阱。' },
    ],
  },
  {
    id: 'fortune:common:meditating_elder',
    rarity: 'common',
    title: '打坐的老者',
    description: '一位白发老者正在路边打坐，气息沉稳。他睁开眼看了你一眼。',
    choices: [
      { text: '恭敬行礼请教', effects: { experience: 30 }, resultText: '老者微微点头，简单指点了几句修行心得。' },
      { text: '安静地在一旁打坐', effects: { hpChange: 10, experience: 10 }, resultText: '在老者的气场中，你感到内心平静，略有感悟。' },
    ],
  },
  {
    id: 'fortune:common:strange_mushroom',
    rarity: 'common',
    title: '奇异的蘑菇',
    description: '路边长着一丛发光的蘑菇，散发着淡淡的药香。',
    choices: [
      { text: '采摘蘑菇', effects: { items: { 'wanjie:common:spirit_stone': 5 }, experience: 5 }, resultText: '蘑菇可以入药，你小心地收集了一些。' },
      { text: '生吃一朵试试', effects: { hpChange: -5, experience: 15 }, resultText: '蘑菇微毒，你感到一阵眩晕，但似乎悟到了什么……' },
    ],
  },
  {
    id: 'fortune:common:weathered_stele',
    rarity: 'common',
    title: '风化石碑',
    description: '一块风化严重的石碑立在路边，上面刻着模糊的文字。',
    choices: [
      { text: '仔细辨认碑文', effects: { experience: 25 }, resultText: '碑文记载了一段基础的修行法门，你细细揣摩，略有所得。' },
      { text: '绕碑三圈祭拜', effects: { spiritStones: 10, experience: 5 }, resultText: '祭拜完毕，石碑底座弹出一个暗格，里面有些灵石。' },
    ],
  },

  // ─── Uncommon 事件 (4) ───
  {
    id: 'fortune:uncommon:ancient_formation',
    rarity: 'uncommon',
    title: '上古阵法',
    description: '地面上刻着一个残破的上古阵法，阵纹依然流转着微弱的灵力。',
    choices: [
      { text: '站入阵中激活', effects: { experience: 50, hpChange: -15 }, resultText: '阵法激活，古老的灵力涌入体内，你获得了珍贵的感悟，但也受了些冲击。' },
      { text: '研究阵法构造', effects: { experience: 35 }, resultText: '你仔细观察阵法纹路，对灵力运转有了新的理解。' },
      { text: '收集阵法残片', effects: { fragments: [{ sourceName: '上古阵法残片', type: 'equipment', rarity: 'rare', count: 1 }] }, resultText: '你小心地收集了几片阵法残片。' },
    ],
  },
  {
    id: 'fortune:uncommon:merchant_caravan',
    rarity: 'uncommon',
    title: '遇险商队',
    description: '一支商队遭到妖兽袭击，货物散落一地。幸存者看到你后向你求救。',
    choices: [
      { text: '帮忙击退妖兽', effects: { startBattle: 'caravan_beast', experience: 40, spiritStones: 30 }, resultText: '你击退了妖兽，商人感激地奉上谢礼。' },
      { text: '帮忙收集散落的货物', effects: { spiritStones: 25, experience: 15 }, resultText: '你帮商人收集货物，他们分你一部分作为酬谢。' },
    ],
  },
  {
    id: 'fortune:uncommon:spirit_herb_patch',
    rarity: 'uncommon',
    title: '灵药丛',
    description: '一片灵气浓郁的区域，生长着好几种珍贵的灵药。但隐约有守护兽的气息。',
    choices: [
      { text: '冒险采集', effects: { items: { 'wanjie:common:spirit_stone': 40 }, experience: 20, hpChange: -10 }, resultText: '你赶在守护兽回来之前采集了一些灵药，不慎被荆棘划伤。' },
      { text: '绕道观察', effects: { experience: 30 }, resultText: '你远远观察灵药的生长环境，对药性有了更深的理解。' },
    ],
  },
  {
    id: 'fortune:uncommon:forgotten_manual',
    rarity: 'uncommon',
    title: '遗落的修炼手札',
    description: '一本泛黄的手札被遗落在石缝中，封面写着"修炼心得"四字。',
    choices: [
      { text: '认真阅读', effects: { experience: 45 }, resultText: '手札中记载了许多实用的修炼技巧，你受益匪浅。' },
      { text: '寻找更多遗物', effects: { fragments: [{ sourceName: '残缺功法页', type: 'technique', rarity: 'epic', count: 1 }] }, resultText: '你以手札为线索，在附近找到了几页残缺的功法。' },
    ],
  },

  // ─── Rare 事件 (3) ───
  {
    id: 'fortune:rare:ancient_sword_trial',
    rarity: 'rare',
    title: '古剑之试',
    description: '一柄散发着凌厉剑意的古剑插在巨石中，剑身刻着："拔出此剑者，可得我传承。但若力有不逮，必受反噬。"',
    choices: [
      { text: '奋力拔剑', effects: { startBattle: 'sword_guardian', fragments: [{ sourceName: '古剑碎片', type: 'equipment', rarity: 'legendary', count: 2 }] }, resultText: '你握住了剑柄……一股强大的剑意涌入体内！' },
      { text: '向古剑行礼致敬', effects: { experience: 60 }, resultText: '古剑微微颤动，一道剑意传入你的脑海，让你对剑道有了新的领悟。' },
      { text: '放弃挑战', effects: { experience: 10 }, resultText: '你恭敬地退后，古剑的剑意渐渐平息。' },
    ],
  },
  {
    id: 'fortune:rare:heavenly_fruit',
    rarity: 'rare',
    title: '天灵果',
    description: '一棵散发着七彩光芒的果树，树上结着一颗晶莹剔透的果实。传闻此果千年一结果，服之可大幅提升修为。',
    choices: [
      { text: '摘下果实立即服用', effects: { experience: 80, hpChange: 30 }, resultText: '天灵果入口即化，一股磅礴的灵力在体内炸开！你的修为大幅提升，伤势也完全恢复。' },
      { text: '小心保存带走', effects: { items: { 'wanjie:common:spirit_stone': 80 }, fragments: [{ sourceName: '天灵果核', type: 'equipment', rarity: 'legendary', count: 1 }] }, resultText: '你将天灵果小心收起，在果树下发现了前人留下的宝物。' },
    ],
  },
  {
    id: 'fortune:rare:formation_master',
    rarity: 'rare',
    title: '阵法师的遗产',
    description: '一位古代阵法师的洞府遗址。墙壁上刻满了复杂的阵纹，中央放着一个上了锁的阵盘。',
    choices: [
      { text: '尝试破解阵法', effects: { experience: 50, fragments: [{ sourceName: '阵法核心碎片', type: 'equipment', rarity: 'epic', count: 3 }] }, resultText: '你成功破解了外围阵法，获得了一些珍贵的阵法碎片。' },
      { text: '强行破开阵盘', effects: { startBattle: 'formation_guardian', spiritStones: 60 }, resultText: '阵盘破碎的瞬间，守护阵法激活了！' },
    ],
  },

  // ─── Legendary 事件 (2) ───
  {
    id: 'fortune:legendary:immortal_encounter',
    rarity: 'legendary',
    title: '仙人指路',
    description: '一道金光从天而降，一位仙风道骨的身影出现在你面前。"有缘人，你我有此一面之缘。"',
    choices: [
      { text: '跪求仙缘', effects: { experience: 150, fragments: [{ sourceName: '仙法残页', type: 'technique', rarity: 'mythic', count: 2 }] }, resultText: '仙人微微一笑，伸手一点，一道金光没入你的眉心。' },
      { text: '请教修行之道', effects: { experience: 120, hpChange: 50 }, resultText: '仙人耐心解答了你的疑惑，临走前施展法术治好了你所有的伤势。' },
      { text: '请求赐宝', effects: { fragments: [{ sourceName: '仙器碎片', type: 'equipment', rarity: 'mythic', count: 3 }], spiritStones: 150 }, resultText: '仙人随手从袖中取出几样宝物赠予你，随即化作金光消失。' },
    ],
  },
  {
    id: 'fortune:legendary:dragon_vein',
    rarity: 'legendary',
    title: '龙脉显现',
    description: '大地震颤，一条地脉龙气从地下冲出！金色的龙形灵力在天空中盘旋，这是千年难遇的龙脉显现！',
    choices: [
      { text: '冲入龙脉中心吸收龙气', effects: { experience: 200, hpChange: -30, fragments: [{ sourceName: '龙气结晶', type: 'technique', rarity: 'mythic', count: 3 }] }, resultText: '龙气狂暴地涌入体内，你咬紧牙关拼命吸收，获得了巨大的提升！' },
      { text: '在龙脉边缘小心吸收', effects: { experience: 100, spiritStones: 200 }, resultText: '你在龙脉边缘稳扎稳打地吸收灵气，收获了大量精纯的灵石。' },
      { text: '记录龙脉运行轨迹', effects: { experience: 80, fragments: [{ sourceName: '龙脉图录', type: 'technique', rarity: 'legendary', count: 2 }] }, resultText: '你仔细观察龙脉的运转规律，将其绘制成图，这是无价之宝。' },
    ],
  },
];

/** 按稀有度获取默认事件 */
export function getDefaultEventsByRarity(
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
): FortuneEventTemplate[] {
  return DEFAULT_FORTUNE_EVENTS.filter(e => e.rarity === rarity);
}

/** 获取匹配条件的默认事件 */
export function getDefaultEvents(
  minDepth?: number,
  maxDepth?: number
): FortuneEventTemplate[] {
  return DEFAULT_FORTUNE_EVENTS.filter(e => {
    if (minDepth !== undefined && e.minDepth !== undefined && e.minDepth > minDepth) return false;
    if (maxDepth !== undefined && e.maxDepth !== undefined && e.maxDepth < maxDepth) return false;
    return true;
  });
}
