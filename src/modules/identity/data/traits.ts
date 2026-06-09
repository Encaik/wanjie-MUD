/**
 * 特性/词条数据
 * 
 * 使用说明：
 * - 按 ImpactLevel（影响等级）分类：legendary、epic、rare、uncommon、common
 * - 每个词条包含：名称、描述、等级、正向属性、负向属性
 * - 特性分为四类：出身（origin）、特性（trait）、性格（personality）、天赋（talent）
 * 
 * 扩展方式：
 * 1. 在对应品质的数组中添加新的词条
 * 2. 确保每个词条有正有负（传说品质可无负向）
 * 3. 名称和描述应与品质匹配
 */

import { ImpactLevel, StatImpact } from '@/shared/lib/types';

/**
 * 词条定义
 */
export interface TraitDefinition {
  name: string;           // 词条名称
  description: string;    // 词条描述
  level: ImpactLevel;     // 品质等级
  positiveAttrs: string[]; // 正向影响的属性
  negativeAttrs: string[]; // 负向影响的属性
}

/**
 * 品质数值配置
 * 
 * 说明：
 * - 每个品质有正向和负向数值范围
 * - 正向属性会获得该范围内的随机正值
 * - 负向属性会获得该范围内的随机负值
 */
export const QUALITY_CONFIG: Record<ImpactLevel, {
  positiveRange: [number, number];
  negativeRange: [number, number];
}> = {
  legendary: {
    // 传说品质：正向强，负向弱或无
    positiveRange: [8, 12],
    negativeRange: [-3, -1],
  },
  epic: {
    // 史诗品质：正向较强，负向较小
    positiveRange: [6, 10],
    negativeRange: [-4, -2],
  },
  rare: {
    // 稀有品质：正向中等，负向中等
    positiveRange: [4, 7],
    negativeRange: [-5, -3],
  },
  uncommon: {
    // 优秀品质：正向较小，负向较小
    positiveRange: [3, 5],
    negativeRange: [-5, -3],
  },
  common: {
    // 普通品质：正向小，负向小
    positiveRange: [2, 4],
    negativeRange: [-4, -2],
  },
};

/**
 * 出身词条库
 * 
 * 命名规范：
 * - 传说：天命所归、神脉觉醒等顶级出身
 * - 史诗：名门世家、隐世宗门等优越出身
 * - 稀有：武学世家、书香门第等良好出身
 * - 优秀：落魄贵族、山村猎户等普通出身
 * - 普通：山野村夫、市井小民等平凡出身
 */
export const ORIGIN_TRAITS: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '天命所归', description: '命格尊贵，万法护佑', level: 'legendary', positiveAttrs: ['幸运', '灵根', '悟性'], negativeAttrs: [] },
    { name: '神脉觉醒', description: '远古神族血脉，天赋无双', level: 'legendary', positiveAttrs: ['体质', '灵根', '悟性'], negativeAttrs: [] },
    { name: '天骄降世', description: '天生异象，神魂不凡', level: 'legendary', positiveAttrs: ['灵根', '悟性', '幸运'], negativeAttrs: [] },
  ],
  epic: [
    { name: '名门世家', description: '底蕴深厚，资源丰富', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['意志'] },
    { name: '隐世宗门', description: '传承悠久，道法通玄', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['幸运'] },
    { name: '仙门遗脉', description: '先祖曾为仙门长老', level: 'epic', positiveAttrs: ['灵根', '幸运'], negativeAttrs: ['体质'] },
    { name: '皇族贵胄', description: '帝王血脉，气运加身', level: 'epic', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['意志'] },
  ],
  rare: [
    { name: '武学世家', description: '家传武学，根基扎实', level: 'rare', positiveAttrs: ['体质', '意志'], negativeAttrs: ['悟性'] },
    { name: '书香门第', description: '饱读诗书，聪慧过人', level: 'rare', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '商贾之家', description: '耳濡目染，机敏过人', level: 'rare', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['体质'] },
    { name: '江湖世家', description: '行走江湖，见多识广', level: 'rare', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['灵根'] },
  ],
  uncommon: [
    { name: '落魄贵族', description: '曾经的荣耀，如今的落寞', level: 'uncommon', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['幸运', '体质'] },
    { name: '山村猎户', description: '山野求生，体魄强健', level: 'uncommon', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '悟性'] },
    { name: '小商小贩', description: '市井谋生，精打细算', level: 'uncommon', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质', '悟性'] },
    { name: '工匠后代', description: '手艺传家，务实本分', level: 'uncommon', positiveAttrs: ['意志', '体质'], negativeAttrs: ['灵根', '幸运'] },
  ],
  common: [
    { name: '山野村夫', description: '朴实无华，吃苦耐劳', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '悟性'] },
    { name: '市井小民', description: '市井谋生，机变灵活', level: 'common', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['体质', '意志'] },
    { name: '农户子弟', description: '勤劳朴素，踏实肯干', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '幸运'] },
    { name: '渔民之子', description: '风浪中成长，坚韧不拔', level: 'common', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['悟性', '灵根'] },
  ],
};

/**
 * 特性词条库
 */
export const TRAIT_TRAITS: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '天命之子', description: '命运眷顾，机缘不断', level: 'legendary', positiveAttrs: ['幸运', '体质', '灵根'], negativeAttrs: [] },
    { name: '逆天改命', description: '我命由我不由天', level: 'legendary', positiveAttrs: ['意志', '悟性', '灵根'], negativeAttrs: [] },
    { name: '大道眷恋', description: '天地灵气自动归附', level: 'legendary', positiveAttrs: ['灵根', '悟性', '幸运'], negativeAttrs: [] },
  ],
  epic: [
    { name: '血脉觉醒', description: '远古血脉，潜力无限', level: 'epic', positiveAttrs: ['体质', '灵根'], negativeAttrs: ['意志'] },
    { name: '悟性超凡', description: '一目十行，举一反三', level: 'epic', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '灵根纯净', description: '天赋异禀，修炼神速', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['体质'] },
    { name: '气运惊人', description: '奇遇不断，机缘天成', level: 'epic', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['意志'] },
  ],
  rare: [
    { name: '逆境成长', description: '愈挫愈勇，突破极限', level: 'rare', positiveAttrs: ['意志', '体质'], negativeAttrs: ['幸运'] },
    { name: '坚韧不拔', description: '百折不挠，意志如铁', level: 'rare', positiveAttrs: ['意志', '体质'], negativeAttrs: ['幸运'] },
    { name: '体质异禀', description: '钢筋铁骨，力大无穷', level: 'rare', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根'] },
    { name: '心性坚韧', description: '心境如铁，难以动摇', level: 'rare', positiveAttrs: ['意志', '悟性'], negativeAttrs: ['幸运'] },
  ],
  uncommon: [
    { name: '勤奋刻苦', description: '笨鸟先飞，勤能补拙', level: 'uncommon', positiveAttrs: ['意志', '悟性'], negativeAttrs: ['幸运', '体质'] },
    { name: '谨慎行事', description: '三思后行，稳重可靠', level: 'uncommon', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质', '悟性'] },
    { name: '思维敏捷', description: '头脑灵活，反应迅速', level: 'uncommon', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质', '意志'] },
    { name: '机缘平平', description: '无特殊天赋，需加倍努力', level: 'uncommon', positiveAttrs: ['意志', '体质'], negativeAttrs: ['灵根', '幸运'] },
  ],
  common: [
    { name: '凡人之躯', description: '普普通通，稳扎稳打', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '幸运'] },
    { name: '资质一般', description: '天赋平平，后天补足', level: 'common', positiveAttrs: ['意志', '悟性'], negativeAttrs: ['灵根', '幸运'] },
    { name: '体格健壮', description: '身体不错，其他一般', level: 'common', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['灵根', '悟性'] },
    { name: '运气尚可', description: '机缘一般，努力为先', level: 'common', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['灵根', '体质'] },
  ],
};

/**
 * 性格词条库
 */
export const PERSONALITY_TRAITS: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '道心通明', description: '心如明镜，万法归一', level: 'legendary', positiveAttrs: ['悟性', '意志', '灵根'], negativeAttrs: [] },
    { name: '天命所钟', description: '命运女神的宠儿', level: 'legendary', positiveAttrs: ['幸运', '悟性', '意志'], negativeAttrs: [] },
    { name: '心如止水', description: '波澜不惊，万物不扰', level: 'legendary', positiveAttrs: ['意志', '悟性', '灵根'], negativeAttrs: [] },
  ],
  epic: [
    { name: '沉稳内敛', description: '深思熟虑，厚积薄发', level: 'epic', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['幸运'] },
    { name: '光明磊落', description: '坦荡正直，心怀正气', level: 'epic', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['悟性'] },
    { name: '热情开朗', description: '广结善缘，贵人相助', level: 'epic', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['灵根'] },
    { name: '孤僻高傲', description: '独来独往，心无旁骛', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['幸运'] },
  ],
  rare: [
    { name: '热血冲动', description: '勇往直前，无所畏惧', level: 'rare', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['悟性'] },
    { name: '腹黑深沉', description: '城府极深，步步为营', level: 'rare', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质'] },
    { name: '单纯善良', description: '赤子之心，福泽深厚', level: 'rare', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['悟性'] },
    { name: '谨慎多疑', description: '步步为营，不轻信人', level: 'rare', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['体质'] },
  ],
  uncommon: [
    { name: '优柔寡断', description: '犹豫不决，但思虑周全', level: 'uncommon', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['幸运', '体质'] },
    { name: '急功近利', description: '急于求成，行动力强', level: 'uncommon', positiveAttrs: ['幸运', '体质'], negativeAttrs: ['意志', '悟性'] },
    { name: '胆小谨慎', description: '小心谨慎，善于避险', level: 'uncommon', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['体质', '悟性'] },
    { name: '孤僻冷漠', description: '独来独往，专注修行', level: 'uncommon', positiveAttrs: ['意志', '灵根'], negativeAttrs: ['幸运', '悟性'] },
  ],
  common: [
    { name: '平凡性格', description: '性格平和，中规中矩', level: 'common', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['体质', '悟性'] },
    { name: '随遇而安', description: '不强求，顺其自然', level: 'common', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['灵根', '体质'] },
    { name: '朴实无华', description: '踏实本分，稳重可靠', level: 'common', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '幸运'] },
    { name: '心思细腻', description: '观察入微，善于学习', level: 'common', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质', '意志'] },
  ],
};

/**
 * 天赋词条库
 */
export const TALENT_TRAITS: Record<ImpactLevel, TraitDefinition[]> = {
  legendary: [
    { name: '先天道体', description: '灵气亲和，修炼如虎添翼', level: 'legendary', positiveAttrs: ['灵根', '悟性', '体质'], negativeAttrs: [] },
    { name: '神识通天', description: '精神超凡，感知敏锐', level: 'legendary', positiveAttrs: ['悟性', '意志', '灵根'], negativeAttrs: [] },
    { name: '剑道通神', description: '剑道天赋，举世无双', level: 'legendary', positiveAttrs: ['悟性', '灵根', '意志'], negativeAttrs: [] },
  ],
  epic: [
    { name: '先天灵体', description: '灵气亲和，修炼神速', level: 'epic', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['体质'] },
    { name: '神识强大', description: '精神超凡，感知敏锐', level: 'epic', positiveAttrs: ['悟性', '意志'], negativeAttrs: ['体质'] },
    { name: '剑道通灵', description: '剑道天赋，举世无双', level: 'epic', positiveAttrs: ['悟性', '灵根'], negativeAttrs: ['体质'] },
    { name: '气运惊人', description: '奇遇不断，机缘天成', level: 'epic', positiveAttrs: ['幸运', '悟性'], negativeAttrs: ['意志'] },
  ],
  rare: [
    { name: '血脉觉醒', description: '远古血脉，潜力无限', level: 'rare', positiveAttrs: ['体质', '灵根'], negativeAttrs: ['悟性'] },
    { name: '体魄强横', description: '铜皮铁骨，恢复惊人', level: 'rare', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根'] },
    { name: '坚韧意志', description: '突破瓶颈，势如破竹', level: 'rare', positiveAttrs: ['意志', '悟性'], negativeAttrs: ['幸运'] },
    { name: '修行资质', description: '修行资质不错', level: 'rare', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['体质'] },
  ],
  uncommon: [
    { name: '修行天赋', description: '有一点修行天赋', level: 'uncommon', positiveAttrs: ['灵根', '悟性'], negativeAttrs: ['体质', '幸运'] },
    { name: '意志坚定', description: '意志还算坚定', level: 'uncommon', positiveAttrs: ['意志', '体质'], negativeAttrs: ['灵根', '幸运'] },
    { name: '体魄不错', description: '身体还算健康', level: 'uncommon', positiveAttrs: ['体质', '意志'], negativeAttrs: ['灵根', '悟性'] },
    { name: '悟性尚可', description: '理解能力不错', level: 'uncommon', positiveAttrs: ['悟性', '幸运'], negativeAttrs: ['体质', '灵根'] },
  ],
  common: [
    { name: '天赋平庸', description: '普普通通，需努力', level: 'common', positiveAttrs: ['意志', '体质'], negativeAttrs: ['灵根', '幸运'] },
    { name: '资质一般', description: '资质一般，后天补足', level: 'common', positiveAttrs: ['意志', '幸运'], negativeAttrs: ['灵根', '体质'] },
    { name: '体格正常', description: '身体健康，正常水平', level: 'common', positiveAttrs: ['体质', '幸运'], negativeAttrs: ['灵根', '悟性'] },
    { name: '运气平平', description: '机缘一般，努力为先', level: 'common', positiveAttrs: ['幸运', '意志'], negativeAttrs: ['灵根', '体质'] },
  ],
};

/**
 * 属性列表
 */
export const ALL_ATTRS = ['体质', '灵根', '悟性', '幸运', '意志'] as const;
export type AttrName = typeof ALL_ATTRS[number];
