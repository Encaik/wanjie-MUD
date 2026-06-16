/**
 * POST /api/v1/backstory/generate
 *
 * 基于角色属性、种族、世界观生成背景故事文本。
 * 使用模板系统，确定性地产出风格化的背景故事。
 */

import { NextRequest } from 'next/server';

import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';

const log = createLogger('Backstory Generate');

interface BackstoryRequest {
  name: string;
  gender: string;
  raceId: string;
  attributes: Record<string, number | string>;
  worldName: string;
}

// ============================================
// 种族背景模板（每族 4 个变体，每个 2-3 句）
// ============================================

const RACE_ORIGINS: Record<string, string[]> = {
  human: [
    '{name}出身于一个普通的凡人家庭，自幼便展现出与众不同的天赋。村中长辈常说，此子目光清澈如泉，似能看透世间万物的本质。在平凡的生活中，{name}从未停止对天地奥秘的探寻，心中始终燃烧着一团不灭的火焰。',
    '生于乱世之中，{name}在战火与离别中成长，磨砺出远超同龄人的坚韧意志。每当夜深人静，{name}总会仰望星空，思索着命运的真谛与天地的法则。这份早熟与深沉，注定了不凡的人生轨迹。',
    '{name}的家族世代传承着一门古老的技艺，到了这一代，血脉中的力量终于开始苏醒。幼时的一场奇遇让{name}意识到，自己与常人不同——那些在别人眼中模糊的光影，在{name}眼中却清晰如昼。从此，一条探索真相的道路在眼前展开。',
    '作为商贾之家的后嗣，{name}本该继承家业、安度一生。然而一次偶然的机会，{name}在祖宅的密室中发现了一卷残破的古籍，上面记载着关于天地灵气的奥秘。这本书彻底改变了{name}的命运，也点燃了内心深处对修行的渴望。',
  ],
  demon: [
    '在深山古林中长大的妖族后裔，{name}体内流淌着远古大妖的血脉。虽然妖兽一族早已融入人间，但{name}身上那股野性与本能从未消退。每当月圆之夜，体内的血脉便会沸腾，古老的记忆如潮水般涌来。',
    '作为妖族部落的年轻一代，{name}背负着振兴族群的使命。族人将最后的希望寄托于这个天资卓绝的后辈身上，期盼有朝一日能重现先祖的荣光。{name}深知责任重大，日夜苦修，不敢有丝毫懈怠。',
    '从小被遗弃在荒野的妖族弃儿，{name}凭本能与天赋在残酷的自然中活了下来。与野兽为伴、以天地为师，这份独特的成长经历赋予了{name}超乎寻常的感知力与生存智慧。如今，{name}已准备好踏入更广阔的世界。',
    '半妖之身的{name}自小便在人妖两族之间挣扎，既不被纯血妖族接纳，也难以融入人族社会。然而正是这种边缘的身份，让{name}学会了在夹缝中生存的智慧，也逐渐领悟到力量的真谛不在于血脉的纯粹，而在于内心的强大。',
  ],
  spirit: [
    '天地灵气孕育而生的灵族，{name}自诞生之日起便与大道共鸣。在一处古老的灵脉圣地中化形，{name}天生便能感知世间灵气的流动与变化。带着对万物本质的天然好奇，{name}踏入了凡尘，开始了一段寻觅自我与天命的旅程。',
    '在古老的灵脉深处沉睡了千年之后，{name}终于在灵气复苏的时代苏醒。作为灵族最后的血脉之一，{name}承载着已经消逝的灵族文明的全部记忆。面对这个既熟悉又陌生的世界，{name}必须找到自己存在的意义。',
    '一缕不灭的执念在天地间游荡了不知多少岁月，最终在机缘巧合下凝聚成形，化作了{name}。虽为灵体，但{name}对世间万物有着超乎寻常的热爱与眷恋。或许正是因为曾经失去，所以才更加珍惜眼前的一切。',
    '灵族祖地中的一颗灵种在沉寂了无数载后终于萌发，{name}应运而生。作为新生代的灵族，{name}继承了祖辈对天地至理的感悟，却又有着属于新一代的锐气与好奇。前方的道路虽然漫长，但{name}的心中充满了对未知的期待。',
  ],
};

// ============================================
// 属性描述（覆盖所有世界观的 29 个属性键）
// ============================================

/** 最高属性 → 优秀品质描述 */
const HIGH_DESCRIPTORS: Record<string, string> = {
  constitution: '体魄强健，筋骨坚韧，拥有远超常人的生命力',
  insight: '悟性极高，一点即通，任何功法都能迅速掌握其精髓',
  luck: '气运加身，冥冥之中似有天道眷顾',
  willpower: '意志坚定如磐石，心志之坚足以撼动山河',
  spiritPower: '灵力充沛如江河，体内真气浩瀚不绝',
  spiritRoot: '灵根纯净无瑕，与天地灵气天然亲和',
  immortalRoot: '仙根深种，天生便有道骨仙风之气韵',
  swordHeart: '剑心通明，对剑道的领悟已臻化境',
  immortalLuck: '仙缘深厚，与仙道似乎有着宿命般的联系',
  daoHeart: '道心坚定，求道之志不可动摇',
  boneRoot: '根骨奇佳，武学资质万里挑一',
  wisdomRoot: '慧根深重，智慧如海，通透世间真理',
  fortune: '机缘过人，总能在关键时刻遇到贵人相助',
  perseverance: '坚韧不拔，纵使千难万险也绝不退缩',
  strength: '力大无穷，肉身之力堪比洪荒猛兽',
  magic: '魔力充盈，体内魔力如潮汐般澎湃不息',
  perception: '感知敏锐，细微之处皆逃不过其洞察',
  charm: '魅力非凡，天生便有一种令人折服的气质',
  spirit: '精神浩瀚，意志力远超常人数倍',
  physique: '体魄惊人，肉身如同一座不可撼动的铁塔',
  battleWill: '战意昂扬，越是绝境越能激发无穷斗志',
  fitness: '身体素质极佳，敏捷与耐力兼具',
  intelligence: '聪慧过人，逻辑与推理能力出类拔萃',
  reaction: '反应迅捷如电，危机时刻总能后发先至',
  tech: '技术天赋卓绝，对科技造物有着天然的掌控力',
  sourceEnergy: '源能充沛，体内异能之源如烈日般炽热',
  adaptability: '适应力惊人，无论何种环境都能迅速融入',
  apocInsight: '洞察力深邃，能在废墟中看见机遇的光芒',
  elementAffinity: '元素亲和力超群，自然之力对其格外眷顾',
};

/** 最低属性 → 短板描述 */
const LOW_DESCRIPTORS: Record<string, string> = {
  constitution: '体质稍弱，需在修行中不断淬炼肉身',
  insight: '悟性略显迟钝，需更多的时间与努力去参悟大道',
  luck: '运气平平，凡事需靠自身努力去争取',
  willpower: '心志偶有动摇，需不断磨砺才能坚定道心',
  spiritPower: '灵力尚浅，需勤加修炼方能有所成就',
  spiritRoot: '灵根驳杂，修行之路注定比他人更为坎坷',
  immortalRoot: '仙根尚且稚嫩，需历尽劫难方能成长',
  swordHeart: '剑心尚在蒙昧之中，需以岁月与汗水将其唤醒',
  immortalLuck: '仙缘淡薄，但或许正是因此才更懂得珍惜',
  daoHeart: '道心初萌未固，需在世事历练中不断锤炼',
  boneRoot: '根骨寻常，需以加倍的努力弥补天资的不足',
  wisdomRoot: '慧根尚浅，但勤能补拙，智慧亦可后天培养',
  fortune: '机缘看似平淡，但平凡之中亦有不凡的可能',
  perseverance: '初心易改，需不断提醒自己为何踏上此路',
  strength: '气力不足，需在每一次战斗中锤炼自身',
  magic: '魔力浅薄，需潜心钻研方可掌握更高深的法术',
  perception: '感知尚待磨炼，许多细微之处仍会从眼前溜走',
  charm: '气质朴实无华，虽不显眼却自有一种真诚的力量',
  spirit: '精神尚显薄弱，面对强大的意志冲击时容易动摇',
  physique: '体魄平平，战斗中需更多依赖技巧而非蛮力',
  battleWill: '斗志偶有起伏，需在血与火的洗礼中锻造无畏之心',
  fitness: '体能一般，长时间的消耗战中对毅力是极大的考验',
  intelligence: '智慧尚待开掘，但每一次学习都在拓展思维的边界',
  reaction: '反应略显迟缓，需以更多的预判弥补速度的不足',
  tech: '技术天赋尚待开发，但兴趣是最好的老师',
  sourceEnergy: '源能初醒未稳，需不断练习才能完全掌控',
  adaptability: '适应力尚显不足，每一次环境的改变都是一次成长',
  apocInsight: '洞察力初始萌芽，废土之上处处暗藏杀机',
  elementAffinity: '元素亲和力尚浅，自然的奥秘有待慢慢揭开',
};

// ============================================
// 地理/环境描述（世界相关的补充句）
// ============================================

const LOCATION_FLAVOR: string[] = [
  '在这片充满机缘与挑战的天地间，{name}的故事才刚刚开始。',
  '前方的道路虽然漫长而未知，但{name}的眼中没有一丝畏惧。',
  '命运的车轮已经转动，{name}将在这广袤天地间留下属于自己的传说。',
  '天地广阔，万物有灵。{name}心中清楚，真正的修行从此刻才真正开始。',
  '每一次选择都将改变命运的走向，{name}深知自己已站在了人生的十字路口。',
  '踏上这条路便再无回头之可能，但{name}的心中充满了对未来的期待与笃定。',
];

// ============================================
// 生成逻辑
// ============================================

/** 获取属性的中文描述（最高 + 最低） */
function describeAttributes(attrs: Record<string, number | string>): string {
  // 过滤数值型属性并按值排序
  const numericAttrs = Object.entries(attrs)
    .filter(([, v]) => typeof v === 'number')
    .sort(([, a], [, b]) => (b as number) - (a as number));

  if (numericAttrs.length < 2) return '各方面资质均衡，虽无惊才绝艳之处，却也胜在稳健踏实';

  const highest = numericAttrs[0];
  const lowest = numericAttrs[numericAttrs.length - 1];

  const highDesc = HIGH_DESCRIPTORS[highest[0]] || `${highest[0]}极为出众`;
  const lowDesc = LOW_DESCRIPTORS[lowest[0]] || `${lowest[0]}是其需要不断精进的短板`;

  return `${highDesc}。然而${lowDesc}`;
}

/** 简单字符串 hash */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** 从数组确定性选取 */
function pickByHash<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

/** 替换模板中的 {name} 占位符（全局） */
function fillName(template: string, name: string): string {
  return template.replace(/{name}/g, name);
}

/** 生成完整背景故事 */
function generateBackstoryText(req: BackstoryRequest): string {
  const origins = RACE_ORIGINS[req.raceId] || RACE_ORIGINS.human;
  const nameHash = hashStr(req.name);

  // 选取种族起源（第 1-2 句）
  const origin = fillName(pickByHash(origins, nameHash), req.name);

  // 属性描述（第 3-4 句）
  const attrDesc = describeAttributes(req.attributes);

  // 世界结尾（第 5 句）
  const closing = fillName(pickByHash(LOCATION_FLAVOR, nameHash + 1), req.name);

  // 拼接：起源 + 属性描述 + 世界结尾
  const text = `${origin}${attrDesc}。${closing}`;

  return text;
}

// ============================================
// API 路由
// ============================================

export async function POST(request: NextRequest) {
  let body: BackstoryRequest;
  try {
    body = (await request.json()) as BackstoryRequest;
  } catch {
    return apiError(400, '请求体格式错误');
  }

  if (!body.name) {
    return apiError(400, '缺少 name 参数');
  }

  try {
    const backstory = generateBackstoryText(body);
    return apiSuccess({ backstory }, '背景故事已生成');
  } catch (err) {
    log.error('生成失败:', err);
    return apiError(500, '生成背景故事失败');
  }
}
