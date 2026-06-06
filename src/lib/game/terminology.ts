/**
 * 世界术语统一映射系统
 * 所有术语的key保持一致，value根据世界类型动态变化
 */

import { WorldType } from './types';

// 术语类型定义
export interface WorldTerminology {
  // 核心概念
  power: string;          // 力量：灵力/真气/能量/魔力/异能/仙力/内力/异能
  energy: string;         // 能量源：灵气/天地元气/能源/魔法元素/能量/仙气/真气/进化能
  practice: string;       // 修炼行为：修炼/修炼/强化/修行/觉醒/修炼/修炼/进化
  
  // 资源相关
  resource: string;       // 通用资源：灵石/武晶/能量块/魔晶/源能石/仙石/银两/补给点
  resourceDesc: string;   // 资源描述
  treasure: string;       // 宝物：法宝/武宝/装备/神器/强化物/仙宝/兵器/物资
  
  // 修炼相关
  core: string;           // 核心：丹田/丹田/核心/魔力核心/异能核心/仙府/气海/进化核
  breakthrough: string;   // 突破：突破/突破/进化/晋升/觉醒/突破/突破/进化
  
  // 属性名称
  statBody: string;       // 体质：肉身/体魄/体魄/体魄/体魄/仙体/内力/体魄
  statTalent: string;     // 灵根：灵根/血脉/基因/魔力/潜能/仙骨/资质/进化
  statWisdom: string;     // 悟性：悟性/武悟/智力/悟性/悟性/悟性/悟性/智力
  statLuck: string;       // 幸运：气运/机缘/运气/运势/运气/仙缘/机缘/运气
  statWill: string;       // 意志：道心/意志/意志/意志/意志/道心/意志/意志
  
  // 战斗相关
  enemy: string;          // 敌人统称：妖兽/武者/变异体/魔兽/变异者/妖魔/武者/感染者
  battle: string;         // 战斗：斗法/比武/战斗/战斗/对决/斗法/决斗/战斗
  
  // 秘境相关
  dungeon: string;        // 秘境名称：秘境/武域/遗迹/地下城/禁区/仙境/秘洞/废墟
  dungeonDesc: string;    // 秘境描述
  dungeonLocation: string;// 秘境入口
  
  // 丹药相关
  pill: string;           // 丹药统称：丹药/丹药/强化剂/药剂/强化剂/仙丹/丹药/强化剂
  breakthroughPill: string; // 突破丹药名称
  cultivationPill: string;  // 修炼丹药名称
}

// 世界术语映射表
export const worldTerminology: Record<WorldType, WorldTerminology> = {
  '修仙': {
    power: '灵力',
    energy: '灵气',
    practice: '修炼',
    resource: '灵石',
    resourceDesc: '修仙界通用货币，可用于修炼',
    treasure: '法宝',
    core: '丹田',
    breakthrough: '突破',
    statBody: '肉身',
    statTalent: '灵根',
    statWisdom: '悟性',
    statLuck: '气运',
    statWill: '道心',
    enemy: '妖兽',
    battle: '斗法',
    dungeon: '秘境',
    dungeonDesc: '探索神秘秘境，寻找仙缘宝物',
    dungeonLocation: '秘境入口',
    pill: '丹药',
    breakthroughPill: '筑基丹',
    cultivationPill: '聚气丹',
  },
  '高武': {
    power: '真气',
    energy: '天地元气',
    practice: '修炼',
    resource: '武晶',
    resourceDesc: '武道界通用资源，可用于修炼',
    treasure: '武宝',
    core: '丹田',
    breakthrough: '突破',
    statBody: '体魄',
    statTalent: '血脉',
    statWisdom: '武悟',
    statLuck: '机缘',
    statWill: '意志',
    enemy: '武者',
    battle: '比武',
    dungeon: '武域',
    dungeonDesc: '进入危险武域，挑战武道强者',
    dungeonLocation: '武域入口',
    pill: '丹药',
    breakthroughPill: '破境丹',
    cultivationPill: '聚气丹',
  },
  '科技': {
    power: '能量',
    energy: '能源',
    practice: '强化',
    resource: '能量块',
    resourceDesc: '科技世界通用能源，可用于强化',
    treasure: '装备',
    core: '核心',
    breakthrough: '进化',
    statBody: '体魄',
    statTalent: '基因',
    statWisdom: '智力',
    statLuck: '运气',
    statWill: '意志',
    enemy: '变异体',
    battle: '战斗',
    dungeon: '遗迹',
    dungeonDesc: '探索古代遗迹，获取科技资源',
    dungeonLocation: '遗迹入口',
    pill: '强化剂',
    breakthroughPill: '进化液',
    cultivationPill: '强化剂',
  },
  '魔幻': {
    power: '魔力',
    energy: '魔法元素',
    practice: '修行',
    resource: '魔晶',
    resourceDesc: '魔法世界通用货币，可用于修炼',
    treasure: '神器',
    core: '魔力核心',
    breakthrough: '晋升',
    statBody: '体魄',
    statTalent: '魔力',
    statWisdom: '悟性',
    statLuck: '运势',
    statWill: '意志',
    enemy: '魔兽',
    battle: '战斗',
    dungeon: '地下城',
    dungeonDesc: '深入地下城，面对魔法生物',
    dungeonLocation: '地下城入口',
    pill: '药剂',
    breakthroughPill: '魔力药剂',
    cultivationPill: '冥想药剂',
  },
  '异能': {
    power: '异能',
    energy: '能量',
    practice: '觉醒',
    resource: '源能石',
    resourceDesc: '异能世界通用资源，可用于强化',
    treasure: '强化物',
    core: '异能核心',
    breakthrough: '觉醒',
    statBody: '体魄',
    statTalent: '潜能',
    statWisdom: '悟性',
    statLuck: '运气',
    statWill: '意志',
    enemy: '变异者',
    battle: '对决',
    dungeon: '禁区',
    dungeonDesc: '进入异能禁区，挑战变异生物',
    dungeonLocation: '禁区入口',
    pill: '强化剂',
    breakthroughPill: '觉醒药剂',
    cultivationPill: '强化剂',
  },
  '仙侠': {
    power: '仙力',
    energy: '仙气',
    practice: '修炼',
    resource: '仙石',
    resourceDesc: '仙界通用货币，可用于修炼',
    treasure: '仙宝',
    core: '仙府',
    breakthrough: '突破',
    statBody: '仙体',
    statTalent: '仙骨',
    statWisdom: '悟性',
    statLuck: '仙缘',
    statWill: '道心',
    enemy: '妖魔',
    battle: '斗法',
    dungeon: '仙境',
    dungeonDesc: '探索仙境秘境，寻找仙缘',
    dungeonLocation: '仙境入口',
    pill: '仙丹',
    breakthroughPill: '渡劫丹',
    cultivationPill: '聚仙丹',
  },
  '武侠': {
    power: '内力',
    energy: '真气',
    practice: '修炼',
    resource: '银两',
    resourceDesc: '江湖通用货币，可用于修炼',
    treasure: '兵器',
    core: '气海',
    breakthrough: '突破',
    statBody: '内力',
    statTalent: '资质',
    statWisdom: '悟性',
    statLuck: '机缘',
    statWill: '意志',
    enemy: '武者',
    battle: '决斗',
    dungeon: '秘洞',
    dungeonDesc: '探索武林秘洞，获得武学秘籍',
    dungeonLocation: '秘洞入口',
    pill: '丹药',
    breakthroughPill: '洗髓丹',
    cultivationPill: '培元丹',
  },
  '末世': {
    power: '异能',
    energy: '进化能',
    practice: '进化',
    resource: '晶体',
    resourceDesc: '末世通用资源，可用于强化',
    treasure: '物资',
    core: '进化核',
    breakthrough: '进化',
    statBody: '体魄',
    statTalent: '进化',
    statWisdom: '智力',
    statLuck: '运气',
    statWill: '意志',
    enemy: '感染者',
    battle: '战斗',
    dungeon: '废墟',
    dungeonDesc: '探索城市废墟，寻找生存资源',
    dungeonLocation: '废墟入口',
    pill: '强化剂',
    breakthroughPill: '进化药剂',
    cultivationPill: '强化剂',
  }
};

// 获取世界术语
export function getTerminology(worldType: WorldType): WorldTerminology {
  return worldTerminology[worldType] || worldTerminology['修仙'];
}

// 快捷获取方法
export function getResourceName(worldType: WorldType): string {
  return getTerminology(worldType).resource;
}

export function getResourceDesc(worldType: WorldType): string {
  return getTerminology(worldType).resourceDesc;
}

export function getDungeonName(worldType: WorldType): string {
  return getTerminology(worldType).dungeon;
}

export function getDungeonInfo(worldType: WorldType): { name: string; desc: string; location: string } {
  const term = getTerminology(worldType);
  return {
    name: term.dungeon,
    desc: term.dungeonDesc,
    location: term.dungeonLocation
  };
}

// 获取属性名称映射
export function getAttributeNames(worldType: WorldType): Record<string, string> {
  const term = getTerminology(worldType);
  return {
    '体质': term.statBody,
    '灵根': term.statTalent,
    '悟性': term.statWisdom,
    '幸运': term.statLuck,
    '意志': term.statWill,
  };
}

// 获取突破丹药名称（根据境界等级）
export function getBreakthroughPillName(worldType: WorldType, level: number): string {
  const term = getTerminology(worldType);
  
  // 根据等级返回不同品质的突破丹药名称
  if (level < 15) {
    // 低境界
    if (worldType === '修仙') return '筑基丹';
    if (worldType === '科技') return '低级进化液';
    if (worldType === '魔幻') return '低级魔力药剂';
    return term.breakthroughPill;
  } else if (level < 50) {
    // 中境界
    if (worldType === '修仙') return '结金丹';
    if (worldType === '科技') return '中级进化液';
    if (worldType === '魔幻') return '中级魔力药剂';
    return term.breakthroughPill;
  } else {
    // 高境界
    if (worldType === '修仙') return '渡劫丹';
    if (worldType === '科技') return '高级进化液';
    if (worldType === '魔幻') return '高级魔力药剂';
    return term.breakthroughPill;
  }
}

// 获取修炼丹药名称（根据品质）
export function getCultivationPillName(worldType: WorldType, quality: 'low' | 'mid' | 'high'): string {
  const term = getTerminology(worldType);
  
  const qualityNames: Record<WorldType, { low: string; mid: string; high: string }> = {
    '修仙': { low: '聚气丹', mid: '凝元丹', high: '化神丹' },
    '高武': { low: '聚气丹', mid: '凝元丹', high: '化神丹' },
    '科技': { low: '初级强化剂', mid: '中级强化剂', high: '高级强化剂' },
    '魔幻': { low: '初级冥想药剂', mid: '中级冥想药剂', high: '高级冥想药剂' },
    '异能': { low: '初级觉醒剂', mid: '中级觉醒剂', high: '高级觉醒剂' },
    '仙侠': { low: '聚仙丹', mid: '凝仙丹', high: '化仙丹' },
    '武侠': { low: '培元丹', mid: '凝气丹', high: '洗髓丹' },
    '末世': { low: '初级进化剂', mid: '中级进化剂', high: '高级进化剂' },
  };
  
  return qualityNames[worldType]?.[quality] || term.cultivationPill;
}

// 导出所有丹药名称（用于items.ts）
export function getAllPillNames(worldType: WorldType): {
  breakthroughLow: string;
  breakthroughMid: string;
  breakthroughHigh: string;
  cultivationLow: string;
  cultivationMid: string;
  cultivationHigh: string;
} {
  return {
    breakthroughLow: getBreakthroughPillName(worldType, 1),
    breakthroughMid: getBreakthroughPillName(worldType, 25),
    breakthroughHigh: getBreakthroughPillName(worldType, 60),
    cultivationLow: getCultivationPillName(worldType, 'low'),
    cultivationMid: getCultivationPillName(worldType, 'mid'),
    cultivationHigh: getCultivationPillName(worldType, 'high'),
  };
}
