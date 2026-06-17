/**
 * 货币模板
 *
 * 6 种货币：灵石（主货币）、贡献点、宗门积分、荣誉值、飞升印记、活动代币
 */

import type { CurrencyTemplate } from '../../types';

/** 灵石 — 主货币，通用交易 */
export const SPIRIT_STONE: CurrencyTemplate = {
  templateId: 'wanjie:common:spirit_stone',
  name: '灵石',
  description: '天地灵气凝聚而成的晶石，修行界的通用货币。可用于购买道具、装备、功法。',
  category: 'currency',
  subcategory: 'primary',
  rarity: 'common',
  maxStack: 999_999_999,
  maxLevel: 1,
  baseStats: {},
  price: 1,
  element: null,
  isDroppable: true,
  ext: {},
};

/** 势力贡献点 */
export const CONTRIBUTION: CurrencyTemplate = {
  templateId: 'wanjie:common:contribution',
  name: '贡献点',
  description: '为所属势力做出贡献获得的功勋点数，可在势力商店兑换专属物品。',
  category: 'currency',
  subcategory: 'faction',
  rarity: 'common',
  maxStack: 999_999_999,
  maxLevel: 1,
  baseStats: {},
  price: 1,
  element: null,
  isDroppable: false,
  ext: {},
};

/** 宗门积分 */
export const SECT_POINT: CurrencyTemplate = {
  templateId: 'wanjie:common:sect_point',
  name: '宗门积分',
  description: '在宗门内部流通的积分，用于兑换宗门功法、丹药和修炼资源。',
  category: 'currency',
  subcategory: 'sect',
  rarity: 'uncommon',
  maxStack: 999_999_999,
  maxLevel: 1,
  baseStats: {},
  price: 2,
  element: null,
  isDroppable: false,
  ext: {},
};

/** 荣誉值 */
export const HONOR: CurrencyTemplate = {
  templateId: 'wanjie:common:honor',
  name: '荣誉值',
  description: '在竞技场中获得的荣誉点数，可在竞技商店兑换稀有装备和功法。',
  category: 'currency',
  subcategory: 'honor',
  rarity: 'rare',
  maxStack: 999_999_999,
  maxLevel: 1,
  baseStats: {},
  price: 5,
  element: null,
  isDroppable: false,
  ext: {},
};

/** 飞升印记 */
export const ASCENSION_MARK: CurrencyTemplate = {
  templateId: 'wanjie:common:ascension_mark',
  name: '飞升印记',
  description: '飞升成功后留下的印记，蕴含大道法则。可在飞升商店兑换高维世界物品。',
  category: 'currency',
  subcategory: 'ascension',
  rarity: 'epic',
  maxStack: 999_999_999,
  maxLevel: 1,
  baseStats: {},
  price: 1000,
  element: null,
  isDroppable: false,
  ext: {},
};

/** 活动代币 */
export const EVENT_TOKEN: CurrencyTemplate = {
  templateId: 'wanjie:common:event_token',
  name: '活动代币',
  description: '特殊活动期间获得的代币，可在活动商店兑换限定物品。活动结束后可能过期。',
  category: 'currency',
  subcategory: 'event',
  rarity: 'uncommon',
  maxStack: 999_999_999,
  maxLevel: 1,
  baseStats: {},
  price: 1,
  element: null,
  isDroppable: false,
  ext: {},
};

/** 所有货币模板 */
export const CURRENCY_TEMPLATES: CurrencyTemplate[] = [
  SPIRIT_STONE,
  CONTRIBUTION,
  SECT_POINT,
  HONOR,
  ASCENSION_MARK,
  EVENT_TOKEN,
];
