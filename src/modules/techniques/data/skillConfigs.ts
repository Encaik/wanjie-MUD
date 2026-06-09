/**
 * 技能配置管理器
 * 
 * 统一管理所有技能（法技/斗技）的配置数据：
 * - 技能名称库
 * - 技能描述库
 * - 数值计算公式
 * - 稀有度加成
 */

import { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
import { 
  ItemRarity,
  TECHNIQUE_RARITY_CONFIG,
  EQUIPMENT_RARITY_CONFIG,
} from '@/modules/techniques/logic/skillTypes';

// ============================================
// 稀有度加成配置
// ============================================

/** 稀有度伤害倍率 */
export const RARITY_DAMAGE_MULTIPLIER: Record<ItemRarity, number> = {
  '普通': 1.0,
  '稀有': 1.3,
  '史诗': 1.6,
  '传说': 2.0,
  '神话': 2.5,
};

/** 稀有度特殊效果概率 */
export const RARITY_SPECIAL_EFFECT_CHANCE: Record<ItemRarity, number> = {
  '普通': 0.0,
  '稀有': 0.1,
  '史诗': 0.2,
  '传说': 0.35,
  '神话': 0.5,
};

/** 稀有度冷却缩减 */
export const RARITY_COOLDOWN_REDUCTION: Record<ItemRarity, number> = {
  '普通': 0,
  '稀有': 0,
  '史诗': 1,
  '传说': 1,
  '神话': 2,
};

// ============================================
// 元素关键词（从名称推断元素）
// ============================================

/** 火焰关键词 */
export const ELEMENT_KEYWORDS_FIRE = ['火', '炎', '烈焰', '焚', '熔'];

/** 冰霜关键词 */
export const ELEMENT_KEYWORDS_ICE = ['冰', '寒', '霜', '雪', '冻'];

/** 雷霆关键词 */
export const ELEMENT_KEYWORDS_THUNDER = ['雷', '电', '霆', '闪', '劈'];

/** 疾风关键词 */
export const ELEMENT_KEYWORDS_WIND = ['风', '疾', '旋', '飓', '罡'];

/** 大地关键词 */
export const ELEMENT_KEYWORDS_EARTH = ['土', '地', '岩', '石', '山'];

/** 光明关键词 */
export const ELEMENT_KEYWORDS_LIGHT = ['光', '圣', '阳', '明', '辉'];

/** 黑暗关键词 */
export const ELEMENT_KEYWORDS_DARK = ['暗', '冥', '幽', '鬼', '魔', '亡'];

/** 从名称推断元素 */
export function detectElementFromName(name: string): Element | null {
  if (ELEMENT_KEYWORDS_FIRE.some(k => name.includes(k))) return 'fire';
  if (ELEMENT_KEYWORDS_ICE.some(k => name.includes(k))) return 'ice';
  if (ELEMENT_KEYWORDS_THUNDER.some(k => name.includes(k))) return 'thunder';
  if (ELEMENT_KEYWORDS_WIND.some(k => name.includes(k))) return 'wind';
  if (ELEMENT_KEYWORDS_EARTH.some(k => name.includes(k))) return 'earth';
  if (ELEMENT_KEYWORDS_LIGHT.some(k => name.includes(k))) return 'light';
  if (ELEMENT_KEYWORDS_DARK.some(k => name.includes(k))) return 'dark';
  return null;
}

/** 元素中文名 */
export const ELEMENT_NAMES: Record<Element, string> = {
  fire: '火',
  ice: '冰',
  thunder: '雷',
  wind: '风',
  earth: '土',
  light: '光',
  dark: '暗',
};

/** 元素图标（Lucide 图标名） */
export const ELEMENT_ICONS: Record<Element, string> = {
  fire: 'Flame',
  ice: 'Snowflake',
  thunder: 'Zap',
  wind: 'Wind',
  earth: 'Mountain',
  light: 'Sun',
  dark: 'Moon',
};

// ============================================
// 武器类别关键词
// ============================================

/** 剑类关键词 */
export const WEAPON_KEYWORDS_SWORD = ['剑'];

/** 刀类关键词 */
export const WEAPON_KEYWORDS_BLADE = ['刀'];

/** 拳类关键词 */
export const WEAPON_KEYWORDS_FIST = ['拳', '爪', '掌', '手'];

/** 弓类关键词 */
export const WEAPON_KEYWORDS_BOW = ['弓'];

/** 枪类关键词 */
export const WEAPON_KEYWORDS_SPEAR = ['枪', '矛'];

/** 从名称推断武器类别 */
export function detectWeaponCategoryFromName(name: string): WeaponCategory | null {
  if (WEAPON_KEYWORDS_SPEAR.some(k => name.includes(k))) return 'spear';
  if (WEAPON_KEYWORDS_BOW.some(k => name.includes(k))) return 'bow';
  if (WEAPON_KEYWORDS_FIST.some(k => name.includes(k))) return 'fist';
  if (WEAPON_KEYWORDS_BLADE.some(k => name.includes(k))) return 'blade';
  if (WEAPON_KEYWORDS_SWORD.some(k => name.includes(k))) return 'sword';
  return null;
}

/** 武器类别中文名 */
export const WEAPON_CATEGORY_NAMES: Record<WeaponCategory, string> = {
  sword: '剑',
  blade: '刀',
  fist: '拳',
  bow: '弓',
  spear: '枪',
};

// ============================================
// 武器-元素默认映射
// ============================================

/** 武器类别默认元素 */
export const WEAPON_CATEGORY_DEFAULT_ELEMENT: Record<WeaponCategory, Element> = {
  sword: 'wind',
  blade: 'fire',
  fist: 'earth',
  bow: 'thunder',
  spear: 'ice',
};

// ============================================
// 法技名称库
// ============================================

/** 火焰法技名称 */
export const FIRE_TECHNIQUE_SKILL_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['火球术', '烈焰击', '灼烧术', '火焰冲击'],
  '稀有': ['爆炎斩', '火焰护盾', '炎爆术', '烈焰风暴'],
  '史诗': ['烈焰焚天', '凤凰之羽', '炎龙吐息', '焚尽一切'],
  '传说': ['焚天灭地', '炎神降临', '九天神火', '烈焰神罚'],
  '神话': ['创世之炎', '不灭神火', '万象焚灭', '永恒烈焰'],
};

/** 冰霜法技名称 */
export const ICE_TECHNIQUE_SKILL_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['冰刺术', '寒冰护甲', '冰霜击', '冻土术'],
  '稀有': ['冰封术', '极寒冲击', '霜冻新星', '寒冰风暴'],
  '史诗': ['绝对零度', '冰龙之息', '永恒冻土', '寒冰神罚'],
  '传说': ['世界冻结', '霜神之怒', '玄冰灭世', '万古冰封'],
  '神话': ['创世寒冰', '永恒冰封', '万象冻结', '永恒冻土'],
};

/** 雷霆法技名称 */
export const THUNDER_TECHNIQUE_SKILL_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['雷击术', '闪电链', '雷霆护盾', '电弧术'],
  '稀有': ['雷神之锤', '风暴召唤', '雷光闪', '雷霆万钧'],
  '史诗': ['天雷破', '雷龙咆哮', '万雷齐发', '雷霆神罚'],
  '传说': ['九天雷霆', '灭世雷劫', '神雷降临', '万劫神雷'],
  '神话': ['创世雷霆', '万雷归宗', '天罚之雷', '永恒雷霆'],
};

/** 疾风法技名称 */
export const WIND_TECHNIQUE_SKILL_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['风刃术', '疾风步', '风之护盾', '风卷术'],
  '稀有': ['风暴斩', '龙卷风', '风神之速', '疾风术'],
  '史诗': ['风卷残云', '虚空风暴', '飓风灭世', '风神神罚'],
  '传说': ['九天罡风', '风神降临', '万象皆空', '万古神风'],
  '神话': ['创世之风', '虚无风暴', '天地飓风', '永恒神风'],
};

/** 大地法技名称 */
export const EARTH_TECHNIQUE_SKILL_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['岩石击', '土墙术', '石化术', '落石术'],
  '稀有': ['地裂术', '岩浆喷发', '大地护盾', '地震术'],
  '史诗': ['山崩地裂', '大地之怒', '岩石巨像', '土神神罚'],
  '传说': ['天地崩塌', '地神降临', '万象崩塌', '万古神土'],
  '神话': ['创世大地', '永恒岩石', '万象石化', '永恒神土'],
};

/** 光明法技名称 */
export const LIGHT_TECHNIQUE_SKILL_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['光弹术', '圣光术', '光明护盾', '闪耀术'],
  '稀有': ['神圣之刃', '圣光审判', '光明祝福', '光之箭'],
  '史诗': ['天罚之光', '圣天使之翼', '光明圣域', '光神神罚'],
  '传说': ['创世之光', '神圣降临', '万象净化', '万古神光'],
  '神话': ['永恒光明', '神圣裁决', '天地圣光', '永恒神光'],
};

/** 黑暗法技名称 */
export const DARK_TECHNIQUE_SKILL_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['暗影击', '黑暗护盾', '腐蚀术', '暗之箭'],
  '稀有': ['暗影斩', '死亡凋零', '黑暗吞噬', '腐蚀之触'],
  '史诗': ['深渊之刃', '暗影领域', '死亡降临', '暗神神罚'],
  '传说': ['创世黑暗', '死神降临', '万象吞噬', '万古神暗'],
  '神话': ['永恒黑暗', '虚无之刃', '天地暗灭', '永恒神暗'],
};

/** 法技名称库映射 */
export const TECHNIQUE_SKILL_NAMES: Record<Element, Record<ItemRarity, string[]>> = {
  fire: FIRE_TECHNIQUE_SKILL_NAMES,
  ice: ICE_TECHNIQUE_SKILL_NAMES,
  thunder: THUNDER_TECHNIQUE_SKILL_NAMES,
  wind: WIND_TECHNIQUE_SKILL_NAMES,
  earth: EARTH_TECHNIQUE_SKILL_NAMES,
  light: LIGHT_TECHNIQUE_SKILL_NAMES,
  dark: DARK_TECHNIQUE_SKILL_NAMES,
};

// ============================================
// 斗技名称库
// ============================================

/** 剑类斗技名称 */
export const SWORD_TECHNIQUE_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['剑气斩', '连击', '剑意', '突刺'],
  '稀有': ['破甲斩', '剑舞', '剑气护体', '御剑术'],
  '史诗': ['万剑归宗', '剑神之怒', '剑意凌天', '剑网'],
  '传说': ['天外飞仙', '剑开天门', '一剑破万法', '剑道永恒'],
  '神话': ['创世剑意', '永恒剑心', '万象剑归', '剑道通天'],
};

/** 刀类斗技名称 */
export const BLADE_TECHNIQUE_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['刀气斩', '破击', '刀意', '横扫'],
  '稀有': ['霸刀斩', '狂刀', '刀气护体', '御刀术'],
  '史诗': ['灭世刀意', '刀神之怒', '霸道无双', '刀网'],
  '传说': ['一刀断天', '刀破虚空', '万劫刀', '刀道永恒'],
  '神话': ['创世刀意', '永恒刀心', '万象刀灭', '刀道通天'],
};

/** 拳类斗技名称 */
export const FIST_TECHNIQUE_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['拳劲', '连打', '拳意', '冲拳'],
  '稀有': ['碎岩拳', '霸拳', '拳气护体', '寸拳'],
  '史诗': ['灭世拳意', '拳神之怒', '霸道拳法', '拳网'],
  '传说': ['一拳破天', '拳破虚空', '万劫拳', '拳道永恒'],
  '神话': ['创世拳意', '永恒拳心', '万象拳灭', '拳道通天'],
};

/** 弓类斗技名称 */
export const BOW_TECHNIQUE_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['连射', '穿透', '箭意', '速射'],
  '稀有': ['穿云箭', '箭雨', '箭气护体', '曲射'],
  '史诗': ['灭世箭意', '箭神之怒', '百步穿杨', '箭网'],
  '传说': ['一箭破天', '箭破虚空', '万劫箭', '箭道永恒'],
  '神话': ['创世箭意', '永恒箭心', '万象箭灭', '箭道通天'],
};

/** 枪类斗技名称 */
export const SPEAR_TECHNIQUE_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['枪劲', '穿刺', '枪意', '突刺'],
  '稀有': ['破军枪', '霸王枪', '枪气护体', '横扫'],
  '史诗': ['灭世枪意', '枪神之怒', '龙胆枪法', '枪网'],
  '传说': ['一枪破天', '枪破虚空', '万劫枪', '枪道永恒'],
  '神话': ['创世枪意', '永恒枪心', '万象枪灭', '枪道通天'],
};

/** 斗技名称库映射 */
export const WEAPON_TECHNIQUE_NAMES: Record<WeaponCategory, Record<ItemRarity, string[]>> = {
  sword: SWORD_TECHNIQUE_NAMES,
  blade: BLADE_TECHNIQUE_NAMES,
  fist: FIST_TECHNIQUE_NAMES,
  bow: BOW_TECHNIQUE_NAMES,
  spear: SPEAR_TECHNIQUE_NAMES,
};

// ============================================
// 技能数值公式
// ============================================

/** 法技基础伤害公式 */
export function calculateTechniqueSkillDamage(
  unlockLevel: number,
  rarity: ItemRarity,
  isUltimate: boolean = false
): number {
  const base = 10 + unlockLevel * 5;
  const multiplier = RARITY_DAMAGE_MULTIPLIER[rarity];
  return Math.floor(base * multiplier * (isUltimate ? 1.5 : 1));
}

/** 法技法力消耗公式 */
export function calculateTechniqueMpCost(
  unlockLevel: number,
  rarity: ItemRarity,
  isUltimate: boolean = false
): number {
  // 基础消耗
  const base = 10;
  // 解锁等级加成（每级+5）
  const levelBonus = unlockLevel * 5;
  // 稀有度加成（高稀有度技能消耗更高）
  const rarityMultiplier = RARITY_DAMAGE_MULTIPLIER[rarity];
  const rarityBonus = Math.floor((rarityMultiplier - 1) * 20);
  // 终极技能加成
  const ultimateBonus = isUltimate ? 30 : 0;
  
  return Math.floor((base + levelBonus + rarityBonus + ultimateBonus));
}

/** 法技冷却回合公式 */
export function calculateTechniqueCooldown(
  unlockLevel: number,
  rarity: ItemRarity,
  isUltimate: boolean = false
): number {
  // 基础CD：所有技能至少1回合
  const baseCD = 1;
  // 解锁等级加成（每2级+1回合）
  const levelBonus = Math.floor(unlockLevel / 2);
  // 终极技能额外CD
  const ultimateBonus = isUltimate ? 3 : 0;
  // 稀有度减少CD（高稀有度技能CD更短）
  const reduction = RARITY_COOLDOWN_REDUCTION[rarity];
  
  // 确保最小CD为1
  return Math.max(1, baseCD + levelBonus + ultimateBonus - reduction);
}

/** 斗技效果值公式 */
export function calculateTechniqueEffectValue(
  unlockLevel: number,
  rarity: ItemRarity,
  isUltimate: boolean = false
): number {
  const base = 5 + unlockLevel * 3;
  const multiplier = RARITY_DAMAGE_MULTIPLIER[rarity];
  return Math.floor(base * multiplier * (isUltimate ? 1.5 : 1));
}

/** 斗技冷却回合公式 */
export function calculateWeaponTechniqueCooldown(
  unlockLevel: number,
  rarity: ItemRarity
): number {
  // 基础CD：所有斗技至少1回合
  const baseCD = 1;
  // 解锁等级加成（每2级+1回合）
  const levelBonus = Math.floor(unlockLevel / 2);
  // 稀有度减少CD（高稀有度斗技CD更短）
  const reduction = RARITY_COOLDOWN_REDUCTION[rarity];
  
  // 确保最小CD为1
  return Math.max(1, baseCD + levelBonus - reduction);
}

// ============================================
// 解锁等级生成
// ============================================

/** 生成分散的解锁等级 */
export function generateUnlockLevels(
  count: number,
  maxLevel: number
): number[] {
  if (count <= 0) return [];
  if (count === 1) return [1];
  
  const levels: number[] = [];
  const step = Math.max(1, Math.floor(maxLevel / count));
  
  for (let i = 0; i < count; i++) {
    // 第一个技能在等级1解锁
    if (i === 0) {
      levels.push(1);
    } else {
      // 其他技能按比例分布，确保不重复且递增
      const level = Math.min(i * step + 1, maxLevel);
      if (level <= levels[levels.length - 1]) {
        levels.push(levels[levels.length - 1] + 1);
      } else {
        levels.push(level);
      }
    }
  }
  
  return levels;
}
