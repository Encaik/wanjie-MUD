/**
 * 旧 ID → 新 ID 兼容映射（过渡期使用）
 *
 * 物品系统迁移到三段式命名空间 ID 后，旧代码中硬编码的简单 ID
 * 通过此映射自动转换为新 ID，无需立即修改所有调用方。
 *
 * 过渡期结束后（所有旧 ID 引用清空），移除此文件和映射逻辑。
 */

/** 旧 ID → 新三段式 ID 映射表 */
export const LEGACY_ID_MAP: Record<string, string> = {
  // === 货币 (wanjie:common) ===
  'spirit_stone': 'wanjie:common:spirit_stone',
  'contribution': 'wanjie:common:contribution',
  'sect_point': 'wanjie:common:sect_point',
  'honor': 'wanjie:common:honor',
  'ascension_mark': 'wanjie:common:ascension_mark',
  'event_token': 'wanjie:common:event_token',

  // === 消耗品 ===
  'rejuvenation_pill': 'wanjie:common:rejuvenation_pill',
  'healing_pill': 'wanjie:common:healing_pill',
  'soul_restoration_pill': 'wanjie:common:soul_restoration_pill',
  'mana_restoration_pill': 'wanjie:common:mana_restoration_pill',
  'mana_healing_pill': 'wanjie:common:mana_healing_pill',
  'qi_gathering_pill': 'wanjie:cultivation:qi_gathering_pill',
  'essence_condensing_pill': 'wanjie:cultivation:essence_condensing_pill',
  'foundation_pill': 'wanjie:cultivation:foundation_pill',
  'golden_core_pill': 'wanjie:cultivation:golden_core_pill',
  'marrow_washing_pill': 'wanjie:cultivation:marrow_washing_pill',
  'immortal_spirit_pill': 'wanjie:cultivation:immortal_spirit_pill',

  // === 材料 ===
  'spirit_herb': 'wanjie:common:spirit_herb',
  'thousand_year_lingzhi': 'wanjie:common:thousand_year_lingzhi',
  'ten_thousand_year_lotus': 'wanjie:common:ten_thousand_year_lotus',
  'iron_ore': 'wanjie:common:iron_ore',
  'black_iron': 'wanjie:common:black_iron',
  'spirit_gem': 'wanjie:common:spirit_gem',
  'dragon_crystal': 'wanjie:common:dragon_crystal',
  'beast_claw': 'wanjie:common:beast_claw',
  'demon_core': 'wanjie:common:demon_core',
  'exp_stone_small': 'wanjie:common:exp_stone_small',
  'exp_stone_medium': 'wanjie:common:exp_stone_medium',
  'exp_stone_large': 'wanjie:common:exp_stone_large',

  // === 装备 (wanjie:cultivation) ===
  'iron_sword': 'wanjie:cultivation:iron_sword',
  'spirit_sword': 'wanjie:cultivation:spirit_sword',
  'flame_dragon_sword': 'wanjie:cultivation:flame_dragon_sword',
  'thunder_blade': 'wanjie:cultivation:thunder_blade',
  'hunting_bow': 'wanjie:cultivation:hunting_bow',
  'starfall_bow': 'wanjie:cultivation:starfall_bow',
  'cloth_hat': 'wanjie:cultivation:cloth_hat',
  'spirit_crown': 'wanjie:cultivation:spirit_crown',
  'cotton_robe': 'wanjie:cultivation:cotton_robe',
  'dragon_scale_armor': 'wanjie:cultivation:dragon_scale_armor',
  'cotton_leggings': 'wanjie:cultivation:cotton_leggings',
  'wind_walker_leggings': 'wanjie:cultivation:wind_walker_leggings',
  'cotton_boots': 'wanjie:cultivation:cotton_boots',
  'cloud_boots': 'wanjie:cultivation:cloud_boots',

  // === 功法 (wanjie:cultivation) ===
  'fire_scripture': 'wanjie:cultivation:fire_scripture',
  'thunder_fist_manual': 'wanjie:cultivation:thunder_fist_manual',
  'wind_sword_art': 'wanjie:cultivation:wind_sword_art',
  'iron_body_scripture': 'wanjie:cultivation:iron_body_scripture',
  'water_shield_art': 'wanjie:cultivation:water_shield_art',
  'light_armor_mantra': 'wanjie:cultivation:light_armor_mantra',

  // === 技能 (wanjie:cultivation) ===
  'fireball': 'wanjie:cultivation:fireball',
  'ice_lance': 'wanjie:cultivation:ice_lance',
  'thunder_storm': 'wanjie:cultivation:thunder_storm',
  'healing_light': 'wanjie:cultivation:healing_light',
  'spirit_shield': 'wanjie:cultivation:spirit_shield',
  'earth_quake': 'wanjie:cultivation:earth_quake',
  'heavy_strike': 'wanjie:cultivation:heavy_strike',
  'whirlwind_slash': 'wanjie:cultivation:whirlwind_slash',
  'lifesteal_strike': 'wanjie:cultivation:lifesteal_strike',
  'fatal_strike': 'wanjie:cultivation:fatal_strike',
  'counter_stance': 'wanjie:cultivation:counter_stance',
};
