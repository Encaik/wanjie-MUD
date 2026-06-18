/**
 * 世界观 → 心魔属性映射（worldResonance）
 *
 * 定义8种世界观各自的心魔主题、攻击偏向、视觉风格和文本池。
 * 心魔根据所在世界观呈现不同的形态和特性。
 *
 * @module modules/progression/logic/demonBreakthrough
 */

import type { WorldDemonConfig, DemonType, DemonAttackBias } from './types';

// ============================================
// 世界观心魔配置表
// ============================================

/** 8种世界观的心魔差异化配置 */
export const WORLD_DEMON_CONFIGS: Record<string, WorldDemonConfig> = {
  '修仙': {
    worldType: '修仙',
    demonTheme: '七情六欲、执念煞气',
    visualTheme: 'cultivation_ink',
    attackProfile: {
      bias: 'special',
      physicalMultiplier: 0.7,
      specialMultiplier: 1.4,
      willErosionMultiplier: 1.1,
    },
    temptationTemplates: {
      greed: [
        '修仙之路，资源为先。为何不取他人之物，成就自身大道？',
        '灵石、丹药、法宝……只要你想，这一切唾手可得。',
        '贪婪有何不可？天地万物皆可为修炼所用。',
      ],
      fear: [
        '渡劫天雷、道消身陨……你真的以为自己能逆天而行？',
        '放弃吧，凡人如何能与天道抗衡？',
        '每一次突破都是与死神共舞，你准备好了吗？',
      ],
      arrogance: [
        '你已经超越了所有人，何必再苦修？这天下谁能与你争锋？',
        '你乃天选之人，区区修炼规矩何必遵守？',
        '站在山巅俯瞰众生，不是很美妙吗？',
      ],
      regret: [
        '如果当初选择了那条路，现在早已飞升仙界了……',
        '错过的机缘永远不会再来，你注定遗憾终身。',
        '那些被你伤害过的人，他们的面孔你还记得吗？',
      ],
      doubt: [
        '你的道法真的正确吗？你的修法真的适合你吗？',
        '天地广阔，大道万千，你确定走对了吗？',
        '修仙之路漫漫，你可曾真正看清自己的道心？',
      ],
    },
    nameSuffixes: {
      greed: '之煞',
      fear: '之劫',
      arrogance: '之魔',
      regret: '之影',
      doubt: '之惑',
    },
  },

  '高武': {
    worldType: '高武',
    demonTheme: '武道瓶颈、血脉暴走',
    visualTheme: 'martial_flame',
    attackProfile: {
      bias: 'physical',
      physicalMultiplier: 1.5,
      specialMultiplier: 0.6,
      willErosionMultiplier: 1.0,
    },
    temptationTemplates: {
      greed: [
        '以力证道，强者为尊。夺取他人修为，才是武道捷径！',
        '这天下武功，唯快不破。抢来的功法也是功法！',
      ],
      fear: [
        '武道之路尸骨累累，下一个倒下的会不会是你？',
        '血脉暴走、真气逆流，你可曾想过失败的代价？',
      ],
      arrogance: [
        '一拳一脚皆是至理，天下谁能接你一拳？',
        '武道巅峰者，何须再向他人低头？',
      ],
      regret: [
        '若是当年拜入那位强者门下，现在已是武道宗师了……',
        '生死擂台上，你本可以手下留情的……',
      ],
      doubt: [
        '你的武道路子对吗？以力证道还是以技入道？',
        '根基不牢，武学境界终究是空中楼阁。',
      ],
    },
    nameSuffixes: {
      greed: '之欲',
      fear: '之惧',
      arrogance: '之狂',
      regret: '之疚',
      doubt: '之疑',
    },
  },

  '科技': {
    worldType: '科技',
    demonTheme: '系统故障、AI觉醒、基因崩溃',
    visualTheme: 'tech_matrix',
    attackProfile: {
      bias: 'will',
      physicalMultiplier: 0.6,
      specialMultiplier: 1.0,
      willErosionMultiplier: 1.6,
    },
    temptationTemplates: {
      greed: [
        '系统资源无限，升级权限只需绕过防火墙……',
        '更强的基因改造技术就在数据库里，为什么不黑进去？',
      ],
      fear: [
        '基因崩溃概率87.3%，你真的要继续吗？',
        'AI正在觉醒，人类终将被淘汰，你的挣扎有何意义？',
      ],
      arrogance: [
        '你的进化指数已经超越了99.9%的人类，还需要继续吗？',
        '科学造神，你已是新时代的先锋，凡人皆是蝼蚁。',
      ],
      regret: [
        '如果当初接受了那个实验协议，你现在已是完美生命体……',
        '废弃的实验室里，那些被牺牲的同伴你还记得吗？',
      ],
      doubt: [
        '机械与血肉的边界在哪里？你还是"人类"吗？',
        '进化到极致还是人类吗？你的意识还是原来的你吗？',
      ],
    },
    nameSuffixes: {
      greed: '故障',
      fear: '崩溃',
      arrogance: '溢出',
      regret: '碎片',
      doubt: '异常',
    },
  },

  '魔幻': {
    worldType: '魔幻',
    demonTheme: '恶魔契约、元素失控、魔力反噬',
    visualTheme: 'magic_circle',
    attackProfile: {
      bias: 'special',
      physicalMultiplier: 0.8,
      specialMultiplier: 1.3,
      willErosionMultiplier: 1.2,
    },
    temptationTemplates: {
      greed: [
        '与恶魔签订契约吧，无尽的魔力在等着你……',
        '元素之力，魔法之源，为何不全部据为己有？',
      ],
      fear: [
        '魔力反噬会把你烧成灰烬，你真的不怕吗？',
        '魔法的深渊在凝视着你，你看到了吗？',
      ],
      arrogance: [
        '你已经精通了所有元素魔法，连大魔导师都要仰望你。',
        '法神之位非你莫属，何必再向任何人学习？',
      ],
      regret: [
        '若是当初选择了黑暗魔法的道路，现在已是法神了……',
        '那个被你献祭的使魔，它的哀鸣你听到了吗？',
      ],
      doubt: [
        '元素真的在回应你吗？还是你只是在自言自语？',
        '魔法之路，是你在驾驭元素，还是元素在驾驭你？',
      ],
    },
    nameSuffixes: {
      greed: '之诱',
      fear: '之怖',
      arrogance: '之傲',
      regret: '之悔',
      doubt: '之迷',
    },
  },

  '异能': {
    worldType: '异能',
    demonTheme: '能力失控、人格分裂、基因记忆',
    visualTheme: 'psi_pulse',
    attackProfile: {
      bias: 'balanced',
      physicalMultiplier: 1.0,
      specialMultiplier: 1.1,
      willErosionMultiplier: 1.2,
    },
    temptationTemplates: {
      greed: [
        '你的异能潜力还远未开发，释放它，成为神！',
        '吸取其他异能者的力量，你将无可匹敌。',
      ],
      fear: [
        '异能暴走时你会杀死所有人，包括你自己……',
        '每一次觉醒都在摧毁你的人类本质。',
      ],
      arrogance: [
        'X级只是起点，你的真正力量连评测系统都无法测量。',
        '普通人在你眼中只是蝼蚁，这是不争的事实。',
      ],
      regret: [
        '如果当年没有觉醒这种能力，你会过得更好吧？',
        '那次异能暴走造成的伤亡，你永远无法弥补。',
      ],
      doubt: [
        '这能力真的是你吗？还是寄宿在你体内的某种东西？',
        '你是异能的主人，还是异能的容器？',
      ],
    },
    nameSuffixes: {
      greed: '之欲',
      fear: '之惶',
      arrogance: '之妄',
      regret: '之遗',
      doubt: '之裂',
    },
  },

  '仙侠': {
    worldType: '仙侠',
    demonTheme: '剑道执念、杀业心魔、剑意反噬',
    visualTheme: 'xianxia_sword',
    attackProfile: {
      bias: 'special',
      physicalMultiplier: 0.9,
      specialMultiplier: 1.3,
      willErosionMultiplier: 1.0,
    },
    temptationTemplates: {
      greed: [
        '天材地宝，能者居之。抢来便是你的机缘！',
        '剑道之路漫漫，为何不夺取他人剑意助自己修行？',
      ],
      fear: [
        '剑意反噬碎你道心，你可承受得起？',
        '一剑破万法？天地之大，你才见过几剑？',
      ],
      arrogance: [
        '剑心通明，天下剑修皆不如你。',
        '一剑开天门，谁敢不从？',
      ],
      regret: [
        '若是当年不拔那一剑，或许她还在你身边……',
        '剑下亡魂无数，你可曾为谁停留过？',
      ],
      doubt: [
        '剑道万千，你的剑究竟为何而挥？',
        '人剑合一是至高境界，但失去自我真的值得吗？',
      ],
    },
    nameSuffixes: {
      greed: '剑煞',
      fear: '剑劫',
      arrogance: '剑魔',
      regret: '剑影',
      doubt: '剑疑',
    },
  },

  '武侠': {
    worldType: '武侠',
    demonTheme: '心法反噬、恩怨情仇、走火入魔',
    visualTheme: 'wuxia_ink',
    attackProfile: {
      bias: 'physical',
      physicalMultiplier: 1.2,
      specialMultiplier: 0.7,
      willErosionMultiplier: 1.0,
    },
    temptationTemplates: {
      greed: [
        '武林至尊，宝刀屠龙。夺得此物便可号令天下！',
        '绝世武功秘籍就在眼前，偷学又如何？',
      ],
      fear: [
        '走火入魔、经脉尽断，若干年后谁会记得你？',
        '江湖险恶，恩恩怨怨，你真能全身而退吗？',
      ],
      arrogance: [
        '一掌一剑打遍天下无敌手，何人敢与你争锋？',
        '武林盟主之位非你莫属，谁来争就杀谁。',
      ],
      regret: [
        '若是当年不曾离开师门，现在已是掌门了……',
        '那场血战本可避免的，你本可以阻止的……',
      ],
      doubt: [
        '侠之大者为国为民，你真的做到了吗？',
        '武功再高也怕人心险恶，你练武的初心还在吗？',
      ],
    },
    nameSuffixes: {
      greed: '心魔',
      fear: '恶魇',
      arrogance: '狂魔',
      regret: '怨魂',
      doubt: '迷障',
    },
  },

  '末世': {
    worldType: '末世',
    demonTheme: '变异恐惧、生存焦虑、孤寂疯狂',
    visualTheme: 'apocalypse_waste',
    attackProfile: {
      bias: 'balanced',
      physicalMultiplier: 1.0,
      specialMultiplier: 1.0,
      willErosionMultiplier: 1.4,
    },
    temptationTemplates: {
      greed: [
        '末日世界的资源就该强者独占，弱肉强食是天理！',
        '吞噬其他幸存者的进化因子，你将无人能敌。',
      ],
      fear: [
        '在这个世界，死亡才是常态。你不过是苟延残喘……',
        '每一次进化都可能让你变成怪物，你不害怕吗？',
      ],
      arrogance: [
        '在这片废土上你就是王，没有人比你更强。',
        '你已经超越了人类，何必再遵守人类的道德？',
      ],
      regret: [
        '如果当初没有踏出避难所，那些同伴也许还活着……',
        '文明崩塌时，你本可以救更多人的。',
      ],
      doubt: [
        '进化到最后，你还能被称为"人类"吗？',
        '为了生存失去人性，值得吗？',
      ],
    },
    nameSuffixes: {
      greed: '变异体',
      fear: '幻象',
      arrogance: '疯狂',
      regret: '亡魂',
      doubt: '迷雾',
    },
  },
};

/**
 * 获取指定世界观的心魔配置
 *
 * @param worldType - 世界观类型标识
 * @returns 该世界观的心魔配置，未找到返回修仙默认配置
 */
export function getWorldDemonConfig(worldType: string): WorldDemonConfig {
  return WORLD_DEMON_CONFIGS[worldType] ?? WORLD_DEMON_CONFIGS['修仙'];
}

/**
 * 根据世界观和攻击偏向获取心魔的基础属性值
 *
 * @param worldType - 世界观类型标识
 * @param playerLevel - 玩家等级
 * @returns 心魔基础战斗属性
 */
export function getWorldDemonBaseStats(
  worldType: string,
  playerLevel: number,
): { physicalAttack: number; specialAttack: number; willErosion: number } {
  const config = getWorldDemonConfig(worldType);
  const { attackProfile: ap } = config;

  // 基础值随等级线性增长
  const baseAtk = 20 + playerLevel * 2;
  const baseErosion = 15 + playerLevel * 1.5;

  return {
    physicalAttack: Math.floor(baseAtk * ap.physicalMultiplier),
    specialAttack: Math.floor(baseAtk * ap.specialMultiplier),
    willErosion: Math.floor(baseErosion * ap.willErosionMultiplier),
  };
}

/**
 * 获取世界观对应的视觉预设
 *
 * @param worldType - 世界观类型标识
 * @returns 视觉预设描述
 */
export function getWorldVisualPreset(worldType: string): {
  theme: string;
  formDescription: string;
  atmosphereDescription: string;
} {
  const config = getWorldDemonConfig(worldType);
  const themes: Record<string, { form: string; atmosphere: string }> = {
    cultivation_ink: {
      form: '煞气凝聚成的人形黑影，周身缭绕着紫黑色的煞气，双目如血。',
      atmosphere: '水墨般的世界，灵气化作黑色墨滴在空中飘散。',
    },
    martial_flame: {
      form: '燃烧的战意化成的火焰巨人，浑身散发着灼热的斗气。',
      atmosphere: '战场残影环绕四周，震天的厮杀声在耳畔回响。',
    },
    tech_matrix: {
      form: '无数闪烁的代码流组成的数字幻影，屏幕碎裂般的故障特效。',
      atmosphere: '数字矩阵笼罩天地，绿色代码如雨落下，系统警报声此起彼伏。',
    },
    magic_circle: {
      form: '魔法阵中浮现的暗影，元素之力在周身扭曲成诡异的漩涡。',
      atmosphere: '魔法阵在空中旋转，元素乱流撕裂虚空，仿佛深渊在凝视。',
    },
    psi_pulse: {
      form: '能力失控后的人格镜像，与本体几乎一模一样，但眼中闪烁着疯狂。',
      atmosphere: '异能波动如涟漪般扩散，周遭空间扭曲变形，时间似乎凝固。',
    },
    xianxia_sword: {
      form: '剑意反噬而成的剑魔，万千剑影环绕，剑气纵横。',
      atmosphere: '剑冢幻象中万剑齐鸣，每一把剑都在诉说着主人的遗憾。',
    },
    wuxia_ink: {
      form: '走火入魔的心魔化身，经脉逆行、真气外泄成黑雾。',
      atmosphere: '雨夜古刹中，恩怨情仇如走马灯般在眼前闪过。',
    },
    apocalypse_waste: {
      form: '废土中诞生的变异幻象，扭曲的肢体和闪烁的辐射光。',
      atmosphere: '末日荒漠中，文明废墟在远方燃烧，辐射尘遮蔽天空。',
    },
  };

  const preset = themes[config.visualTheme] ?? themes['cultivation_ink'];
  return {
    theme: config.visualTheme,
    formDescription: preset.form,
    atmosphereDescription: preset.atmosphere,
  };
}
