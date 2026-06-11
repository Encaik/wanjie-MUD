/**
 * 势力系统数据配置（V2 重构版）
 * 
 * 设计思路：
 * 1. 每个势力有独特特性（FactionTrait），提供具体加成
 * 2. 不同势力有不同的专属内容（功法、装备、商店物品）
 * 3. 世界生成时从每个分组随机选择一个势力
 */

import { WorldType, WorldFaction } from '@/core/types';

// ============================================
// 势力类型
// ============================================

export type FactionType = 'sect' | 'empire' | 'guild' | 'alliance' | 'academy' | 'clan';

export const FactionTypeNames: Record<FactionType, string> = {
  sect: '宗门',
  empire: '皇朝',
  guild: '公会',
  alliance: '联盟',
  academy: '学院',
  clan: '家族',
};

// ============================================
// 势力特性系统
// ============================================

export type TraitEffectType = 'stat_bonus' | 'skill_bonus' | 'cultivation_bonus' | 'special_ability' | 'resource_bonus';

export interface FactionTraitEffect {
  type: TraitEffectType;
  params: Record<string, number | string | boolean>;
  displayText: string;
}

export interface FactionTrait {
  id: string;
  name: string;
  description: string;
  type: 'combat' | 'cultivation' | 'resource' | 'special';
  effects: FactionTraitEffect[];
}

// ============================================
// 势力配置（完整版）
// ============================================

export interface Faction {
  id: string;
  name: string;
  type: FactionType;
  worldType: WorldType;
  description: string;
  characteristics: string;
  motto: string;
  requirement: string;
  
  // 势力特性（V2新增）
  traits: FactionTrait[];
  
  // 专属内容（V2新增）
  exclusiveTechniques: string[];
  exclusiveEquipments: string[];
  exclusiveShopItems: string[];
}

export interface FactionGroup {
  groupName: string;
  groupDescription: string;
  factions: Faction[];
}

// ============================================
// 各世界势力配置（带特性）
// ============================================

export const WORLD_FACTION_GROUPS: Record<WorldType, FactionGroup[]> = {
  '修仙': [
    {
      groupName: '五大仙门',
      groupDescription: '五大仙门各据一方，暗流涌动',
      factions: [
        {
          id: 'xian_sword_sect',
          name: '青云剑宗',
          type: 'sect',
          worldType: '修仙',
          description: '修仙界第一剑修圣地，剑道传承万年，弟子剑法通神。',
          characteristics: '剑修为主，攻击凌厉',
          motto: '剑心通明，万剑归宗',
          requirement: '需有剑道天赋',
          traits: [
            {
              id: 'sword_heart',
              name: '剑心通明',
              description: '剑修之道，心剑合一',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 10 }, displayText: '攻击力+10%' },
                { type: 'skill_bonus', params: { skillType: 'sword', damageBonus: 15 }, displayText: '剑系功法伤害+15%' }
              ]
            },
            {
              id: 'sword_cultivation',
              name: '剑道精进',
              description: '剑修修炼效率提升',
              type: 'cultivation',
              effects: [
                { type: 'cultivation_bonus', params: { cultivationSpeed: 10 }, displayText: '修炼速度+10%' },
                { type: 'cultivation_bonus', params: { breakthroughChance: 5 }, displayText: '突破成功率+5%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_sword_qingyun', 'technique_sword_tianya'],
          exclusiveEquipments: ['equip_sword_qingfeng'],
          exclusiveShopItems: ['shop_sword_manual', 'shop_sword_material']
        },
        {
          id: 'xian_alchemy_sect',
          name: '丹鼎宗',
          type: 'sect',
          worldType: '修仙',
          description: '丹道圣地，炼丹术冠绝天下，可炼制各种灵丹妙药。',
          characteristics: '丹道专精，资源丰富',
          motto: '丹成得道，药石通神',
          requirement: '需有炼丹天赋',
          traits: [
            {
              id: 'alchemy_master',
              name: '丹道宗师',
              description: '炼丹效率提升，丹药品质提升',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { alchemySuccess: 15 }, displayText: '炼丹成功率+15%' },
                { type: 'resource_bonus', params: { pillQuality: 10 }, displayText: '丹药品质+10%' }
              ]
            },
            {
              id: 'medicine_body',
              name: '药体淬炼',
              description: '常年服用丹药，体质增强',
              type: 'cultivation',
              effects: [
                { type: 'stat_bonus', params: { maxHp: 15 }, displayText: '最大生命+15%' },
                { type: 'stat_bonus', params: { hpRegen: 20 }, displayText: '生命恢复+20%' }
              ]
            },
            {
              id: 'pill_discount',
              name: '丹药折扣',
              description: '势力内部购买丹药优惠',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { pillDiscount: 20 }, displayText: '丹药购买折扣20%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_alchemy_danhuo', 'technique_alchemy_liandan'],
          exclusiveEquipments: ['equip_alchemy_cauldron'],
          exclusiveShopItems: ['shop_herb_pack', 'shop_pill_recipe']
        },
        {
          id: 'xian_puppet_sect',
          name: '傀儡门',
          type: 'sect',
          worldType: '修仙',
          description: '以傀儡术闻名于世，弟子擅长操控傀儡作战。',
          characteristics: '傀儡辅助，防御稳固',
          motto: '机关算尽，傀儡随心',
          requirement: '需有操控天赋',
          traits: [
            {
              id: 'puppet_mastery',
              name: '傀儡精通',
              description: '傀儡术威力提升',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { defense: 15 }, displayText: '防御力+15%' },
                { type: 'skill_bonus', params: { skillType: 'puppet', damageBonus: 20 }, displayText: '傀儡系功法伤害+20%' }
              ]
            },
            {
              id: 'mechanic_mind',
              name: '机关妙算',
              description: '战斗中可触发机关反击',
              type: 'special',
              effects: [
                { type: 'special_ability', params: { counterChance: 10, counterDamage: 30 }, displayText: '10%几率触发机关反击(30%伤害)' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_puppet_control', 'technique_puppet_iron'],
          exclusiveEquipments: ['equip_puppet_core'],
          exclusiveShopItems: ['shop_puppet_part', 'shop_mechanism']
        },
        {
          id: 'xian_magic_sect',
          name: '幻灵宗',
          type: 'sect',
          worldType: '修仙',
          description: '幻术与咒法大家，弟子善于施展各种幻术迷惑敌人。',
          characteristics: '幻术为主，诡谲多变',
          motto: '虚幻即真，幻化万千',
          requirement: '需有幻术天赋',
          traits: [
            {
              id: 'illusion_master',
              name: '幻术大成',
              description: '幻术威力提升，敌人更难命中',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { evasion: 12 }, displayText: '闪避率+12%' },
                { type: 'skill_bonus', params: { skillType: 'illusion', damageBonus: 18 }, displayText: '幻术系功法伤害+18%' }
              ]
            },
            {
              id: 'mind_attack',
              name: '攻心为上',
              description: '攻击有几率降低敌人攻击力',
              type: 'special',
              effects: [
                { type: 'special_ability', params: { debuffChance: 15, attackDebuff: 10 }, displayText: '15%几率降低敌人攻击10%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_illusion_dream', 'technique_illusion_mirror'],
          exclusiveEquipments: ['equip_illusion_mask'],
          exclusiveShopItems: ['shop_illusion_scroll', 'shop_dream_herb']
        },
        {
          id: 'xian_body_sect',
          name: '金刚门',
          type: 'sect',
          worldType: '修仙',
          description: '体修圣地，弟子以肉身证道，力大无穷。',
          characteristics: '体修专精，防御强悍',
          motto: '金刚不坏，肉身成圣',
          requirement: '需有强健体质',
          traits: [
            {
              id: 'diamond_body',
              name: '金刚不坏',
              description: '肉身强横，防御惊人',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { defense: 20 }, displayText: '防御力+20%' },
                { type: 'stat_bonus', params: { damageReduction: 10 }, displayText: '伤害减免+10%' }
              ]
            },
            {
              id: 'body_cultivation',
              name: '体修精进',
              description: '体修修炼效率提升',
              type: 'cultivation',
              effects: [
                { type: 'cultivation_bonus', params: { cultivationSpeed: 8 }, displayText: '修炼速度+8%' },
                { type: 'cultivation_bonus', params: { breakthroughHp: 50 }, displayText: '突破时额外获得50点生命上限' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_body_jingang', 'technique_body_tietou'],
          exclusiveEquipments: ['equip_armor_jingang'],
          exclusiveShopItems: ['shop_body_pill', 'shop_training_item']
        },
        {
          id: 'xian_thunder_sect',
          name: '雷霄宗',
          type: 'sect',
          worldType: '修仙',
          description: '雷修圣地，掌控九天神雷，战力惊人。',
          characteristics: '雷法凌厉，爆发力强',
          motto: '雷霆万钧，斩妖除魔',
          requirement: '需有雷灵根',
          traits: [
            {
              id: 'thunder_power',
              name: '雷霆之力',
              description: '雷法威力提升，暴击增加',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { critChance: 8 }, displayText: '暴击率+8%' },
                { type: 'skill_bonus', params: { skillType: 'thunder', damageBonus: 25 }, displayText: '雷系功法伤害+25%' }
              ]
            },
            {
              id: 'thunder_speed',
              name: '雷霆迅捷',
              description: '速度提升，先手概率增加',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { speed: 15 }, displayText: '速度+15%' },
                { type: 'special_ability', params: { firstStrikeChance: 20 }, displayText: '20%几率先手攻击' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_thunder_nine', 'technique_thunder_god'],
          exclusiveEquipments: ['equip_thunder_rod'],
          exclusiveShopItems: ['shop_thunder_jade', 'shop_lightning_charm']
        },
      ],
    },
    {
      groupName: '三大世家',
      groupDescription: '世家底蕴深厚，资源富足',
      factions: [
        {
          id: 'xian_li_family',
          name: '李氏世家',
          type: 'clan',
          worldType: '修仙',
          description: '千年世家，族人遍布修仙界各处，势力庞大。',
          characteristics: '人脉广阔，资源丰富',
          motto: '千年传承，万世基业',
          requirement: '需为血脉族人或立下大功',
          traits: [
            {
              id: 'family_network',
              name: '世家网络',
              description: '人脉广阔，消息灵通',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { shopDiscount: 10 }, displayText: '商店折扣10%' },
                { type: 'resource_bonus', params: { rewardBonus: 15 }, displayText: '任务奖励+15%' }
              ]
            },
            {
              id: 'family_inheritance',
              name: '世家传承',
              description: '资源充足，修炼便利',
              type: 'cultivation',
              effects: [
                { type: 'cultivation_bonus', params: { cultivationSpeed: 12 }, displayText: '修炼速度+12%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_family_sword', 'technique_family_defense'],
          exclusiveEquipments: ['equip_family_jade'],
          exclusiveShopItems: ['shop_family_resource', 'shop_connection_scroll']
        },
        {
          id: 'xian_wang_family',
          name: '王氏世家',
          type: 'clan',
          worldType: '修仙',
          description: '炼器世家，掌控无数灵矿，财富惊人。',
          characteristics: '财富雄厚，装备精良',
          motto: '匠心独运，器成大道',
          requirement: '需为血脉族人或炼器天才',
          traits: [
            {
              id: 'forge_master',
              name: '炼器世家',
              description: '炼器成功率提升',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { forgeSuccess: 15 }, displayText: '炼器成功率+15%' },
                { type: 'resource_bonus', params: { equipQuality: 10 }, displayText: '装备品质+10%' }
              ]
            },
            {
              id: 'wealth_power',
              name: '财富之力',
              description: '资源充足，交易优惠',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { shopDiscount: 15 }, displayText: '商店折扣15%' },
                { type: 'stat_bonus', params: { startingGold: 500 }, displayText: '初始灵石+500' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_forge_flame', 'technique_forge_hammer'],
          exclusiveEquipments: ['equip_forge_hammer'],
          exclusiveShopItems: ['shop_ore_pack', 'shop_forge_recipe']
        },
        {
          id: 'xian_zhang_family',
          name: '张氏世家',
          type: 'clan',
          worldType: '修仙',
          description: '阵法世家，族中阵法师无数，固若金汤。',
          characteristics: '阵法专精，防御无双',
          motto: '阵成天地，万象归一',
          requirement: '需为血脉族人或阵法天才',
          traits: [
            {
              id: 'array_mastery',
              name: '阵法精通',
              description: '阵法威力提升',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { defense: 12 }, displayText: '防御力+12%' },
                { type: 'skill_bonus', params: { skillType: 'array', damageBonus: 20 }, displayText: '阵法系功法伤害+20%' }
              ]
            },
            {
              id: 'array_protection',
              name: '阵法护体',
              description: '战斗开始时获得护盾',
              type: 'special',
              effects: [
                { type: 'special_ability', params: { battleStartShield: 15 }, displayText: '战斗开始获得15%最大HP护盾' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_array_defense', 'technique_array_attack'],
          exclusiveEquipments: ['equip_array_flag'],
          exclusiveShopItems: ['shop_array_material', 'shop_formation_scroll']
        },
      ],
    },
    {
      groupName: '散修联盟',
      groupDescription: '散修聚集，互助互利',
      factions: [
        {
          id: 'xian_free_alliance',
          name: '散修联盟',
          type: 'alliance',
          worldType: '修仙',
          description: '散修聚集之地，虽无强大背景，但胜在自由。',
          characteristics: '自由灵活，资源共享',
          motto: '道友互助，共证大道',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'free_spirit',
              name: '逍遥自在',
              description: '无拘无束，心境开阔',
              type: 'cultivation',
              effects: [
                { type: 'cultivation_bonus', params: { mentalStability: 20 }, displayText: '心境稳定+20%' },
                { type: 'cultivation_bonus', params: { breakthroughChance: 3 }, displayText: '突破成功率+3%' }
              ]
            },
            {
              id: 'mutual_aid',
              name: '互助互利',
              description: '散修互助，资源共享',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { taskRewardBonus: 10 }, displayText: '任务奖励+10%' },
                { type: 'resource_bonus', params: { explorationBonus: 15 }, displayText: '探索收益+15%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_free_wind', 'technique_free_escape'],
          exclusiveEquipments: ['equip_free_cloak'],
          exclusiveShopItems: ['shop_scrolls', 'shop_misc']
        },
      ],
    },
  ],

  '高武': [
    {
      groupName: '武道圣地',
      groupDescription: '武道圣地统领天下武者',
      factions: [
        {
          id: 'wu_saint_land',
          name: '武道圣地',
          type: 'sect',
          worldType: '高武',
          description: '天下武道之源，传承最古老的武学秘典。',
          characteristics: '武道正统，攻防兼备',
          motto: '武道通神，一力破万法',
          requirement: '需有武道天赋',
          traits: [
            {
              id: 'martial_orthodox',
              name: '武道正统',
              description: '武学传承源远流长',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 8, defense: 8 }, displayText: '攻击力+8%，防御力+8%' },
                { type: 'skill_bonus', params: { skillType: 'martial', damageBonus: 15 }, displayText: '武学功法伤害+15%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_martial_origin', 'technique_martial_supreme'],
          exclusiveEquipments: ['equip_martial_unifrom'],
          exclusiveShopItems: ['shop_martial_manual', 'shop_training_gear']
        },
        {
          id: 'wu_body_sect',
          name: '战神殿',
          type: 'sect',
          worldType: '高武',
          description: '专修肉身的武道宗门，弟子肉身强横，力能扛鼎。',
          characteristics: '体修专精，力量惊人',
          motto: '肉身成神，战无不胜',
          requirement: '需有强健体质',
          traits: [
            {
              id: 'war_god_body',
              name: '战神之体',
              description: '肉身强横，力量无穷',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 15, maxHp: 10 }, displayText: '攻击力+15%，最大生命+10%' },
                { type: 'stat_bonus', params: { strength: 20 }, displayText: '力量属性+20%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_war_god_fist', 'technique_war_god_armor'],
          exclusiveEquipments: ['equip_war_god_gauntlet'],
          exclusiveShopItems: ['shop_body_stone', 'shop_strength_pill']
        },
      ],
    },
    {
      groupName: '上古血脉',
      groupDescription: '上古血脉传承，天赋异禀',
      factions: [
        {
          id: 'wu_dragon_clan',
          name: '龙族',
          type: 'clan',
          worldType: '高武',
          description: '上古龙族后裔，血脉强大，天生神力。',
          characteristics: '血脉传承，力量强大',
          motto: '龙威浩荡，血脉无敌',
          requirement: '需有龙族血脉',
          traits: [
            {
              id: 'dragon_blood',
              name: '龙族血脉',
              description: '龙血觉醒，实力大增',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 12, maxHp: 15 }, displayText: '攻击力+12%，最大生命+15%' },
                { type: 'special_ability', params: { dragonBreath: true, damage: 50 }, displayText: '解锁龙息技能(50%伤害)' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_dragon_transform', 'technique_dragon_roar'],
          exclusiveEquipments: ['equip_dragon_scale'],
          exclusiveShopItems: ['shop_dragon_blood', 'shop_dragon_art']
        },
        {
          id: 'wu_phoenix_clan',
          name: '凤族',
          type: 'clan',
          worldType: '高武',
          description: '凤凰血脉传承者，掌控火焰之力。',
          characteristics: '火焰掌控，恢复力强',
          motto: '浴火重生，凤鸣九天',
          requirement: '需有凤族血脉',
          traits: [
            {
              id: 'phoenix_blood',
              name: '凤凰血脉',
              description: '凤血觉醒，涅槃重生',
              type: 'special',
              effects: [
                { type: 'stat_bonus', params: { maxHp: 10 }, displayText: '最大生命+10%' },
                { type: 'special_ability', params: { reviveOnce: 30 }, displayText: '首次死亡复活30%HP' }
              ]
            },
            {
              id: 'phoenix_flame',
              name: '凤凰火焰',
              description: '掌控火焰之力',
              type: 'combat',
              effects: [
                { type: 'skill_bonus', params: { skillType: 'fire', damageBonus: 25 }, displayText: '火系功法伤害+25%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_phoenix_flame', 'technique_phoenix_rebirth'],
          exclusiveEquipments: ['equip_phoenix_feather'],
          exclusiveShopItems: ['shop_phoenix_ash', 'shop_flame_core']
        },
      ],
    },
    {
      groupName: '天武皇朝',
      groupDescription: '皇朝疆域辽阔，武者众多',
      factions: [
        {
          id: 'wu_empire',
          name: '天武皇朝',
          type: 'empire',
          worldType: '高武',
          description: '以武立国的强大皇朝，疆域辽阔，武者众多。',
          characteristics: '资源丰富，体系完善',
          motto: '以武治国，万民归心',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'empire_resources',
              name: '皇朝资源',
              description: '国家支持，资源充足',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { salary: 100 }, displayText: '每日俸禄+100灵石' },
                { type: 'resource_bonus', params: { shopDiscount: 10 }, displayText: '商店折扣10%' }
              ]
            },
            {
              id: 'empire_training',
              name: '皇家武学',
              description: '体系完善，成长迅速',
              type: 'cultivation',
              effects: [
                { type: 'cultivation_bonus', params: { cultivationSpeed: 10 }, displayText: '修炼速度+10%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_imperial_sword', 'technique_imperial_guard'],
          exclusiveEquipments: ['equip_imperial_armor'],
          exclusiveShopItems: ['shop_imperial_resource', 'shop_royal_manual']
        },
      ],
    },
  ],

  '科技': [
    {
      groupName: '星际政权',
      groupDescription: '星际政权掌控宇宙秩序',
      factions: [
        {
          id: 'tech_federation',
          name: '星际联邦',
          type: 'alliance',
          worldType: '科技',
          description: '人类最大的星际政权，科技实力领先。',
          characteristics: '科技领先，资源丰富',
          motto: '科技改变命运，星际开拓未来',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'federation_tech',
              name: '联邦科技',
              description: '科技水平领先',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { researchSpeed: 15 }, displayText: '研究速度+15%' },
                { type: 'resource_bonus', params: { craftingSuccess: 10 }, displayText: '制造成功率+10%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_nanotech', 'technique_quantum'],
          exclusiveEquipments: ['equip_power_armor'],
          exclusiveShopItems: ['shop_tech_module', 'shop_blueprints']
        },
        {
          id: 'tech_empire',
          name: '银河帝国',
          type: 'empire',
          worldType: '科技',
          description: '强大的星际帝国，军事力量雄厚。',
          characteristics: '军事强大，秩序严明',
          motto: '帝国荣耀，星河永存',
          requirement: '需宣誓效忠',
          traits: [
            {
              id: 'empire_military',
              name: '帝国军威',
              description: '军事训练严格',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 10, defense: 10 }, displayText: '攻击力+10%，防御力+10%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_combat_ai', 'technique_mecha'],
          exclusiveEquipments: ['equip_battlesuit'],
          exclusiveShopItems: ['shop_weapon_mod', 'shop_military_gear']
        },
      ],
    },
    {
      groupName: '三大财团',
      groupDescription: '三大财团掌控经济命脉',
      factions: [
        {
          id: 'tech_corp',
          name: '量子科技财团',
          type: 'guild',
          worldType: '科技',
          description: '星际最大的科技公司，掌握量子科技核心技术。',
          characteristics: '科技资源丰富，装备精良',
          motto: '科技创造财富，创新改变世界',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'quantum_tech',
              name: '量子科技',
              description: '量子技术领先',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { creditBonus: 20 }, displayText: '信用点获取+20%' },
                { type: 'resource_bonus', params: { shopDiscount: 15 }, displayText: '商店折扣15%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_quantum_shield', 'technique_quantum_weapon'],
          exclusiveEquipments: ['equip_quantum_core'],
          exclusiveShopItems: ['shop_quantum_chip', 'shop_energy_cell']
        },
        {
          id: 'tech_bio_corp',
          name: '基因科技财团',
          type: 'guild',
          worldType: '科技',
          description: '基因改造领域的领导者，拥有最先进的基因技术。',
          characteristics: '基因优化，寿命延长',
          motto: '基因进化，生命永恒',
          requirement: '需接受基因改造',
          traits: [
            {
              id: 'gene_enhance',
              name: '基因强化',
              description: '基因改造提升体质',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { maxHp: 20, hpRegen: 30 }, displayText: '最大生命+20%，生命恢复+30%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_gene_boost', 'technique_biomorph'],
          exclusiveEquipments: ['equip_gene_implant'],
          exclusiveShopItems: ['shop_gene_serum', 'shop_bio_implant']
        },
        {
          id: 'tech_ai_corp',
          name: '智能科技财团',
          type: 'guild',
          worldType: '科技',
          description: 'AI技术的先驱，拥有最先进的人工智能。',
          characteristics: 'AI辅助，计算力强',
          motto: '智能无限，未来已来',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'ai_assist',
              name: 'AI辅助',
              description: '人工智能辅助决策',
              type: 'special',
              effects: [
                { type: 'stat_bonus', params: { critChance: 10 }, displayText: '暴击率+10%' },
                { type: 'special_ability', params: { autoDodge: 8 }, displayText: '8%几率自动闪避' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_ai_tactical', 'technique_ai_overload'],
          exclusiveEquipments: ['equip_ai_chip'],
          exclusiveShopItems: ['shop_ai_core', 'shop_neural_link']
        },
      ],
    },
    {
      groupName: '机械军团',
      groupDescription: '机械生命与人类共存',
      factions: [
        {
          id: 'tech_ai_alliance',
          name: '机械军团',
          type: 'alliance',
          worldType: '科技',
          description: 'AI与人类共存的势力，拥有最先进的机械改造技术。',
          characteristics: '机械改造，计算力强',
          motto: '机械飞升，永生不朽',
          requirement: '需接受机械改造',
          traits: [
            {
              id: 'cyborg_enhance',
              name: '机械改造',
              description: '机械躯体强化',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { defense: 15, damageReduction: 8 }, displayText: '防御力+15%，伤害减免+8%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_cyborg_weapon', 'technique_cyborg_defense'],
          exclusiveEquipments: ['equip_cyborg_body'],
          exclusiveShopItems: ['shop_robot_part', 'shop_upgrade_kit']
        },
      ],
    },
    {
      groupName: '银河学院',
      groupDescription: '银河学院培养无数精英',
      factions: [
        {
          id: 'tech_academy',
          name: '银河学院',
          type: 'academy',
          worldType: '科技',
          description: '全宇宙最顶尖的学府，培养无数科技精英。',
          characteristics: '知识渊博，研发能力强',
          motto: '知识就是力量，探索永无止境',
          requirement: '需通过入学考核',
          traits: [
            {
              id: 'academy_knowledge',
              name: '学院智慧',
              description: '知识积累深厚',
              type: 'cultivation',
              effects: [
                { type: 'cultivation_bonus', params: { cultivationSpeed: 15 }, displayText: '修炼速度+15%' },
                { type: 'resource_bonus', params: { researchBonus: 20 }, displayText: '研究效率+20%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_academic_analysis', 'technique_academic_innovation'],
          exclusiveEquipments: ['equip_academic_device'],
          exclusiveShopItems: ['shop_research_data', 'shop_knowledge_pack']
        },
      ],
    },
  ],

  '魔幻': [
    {
      groupName: '魔法议会',
      groupDescription: '魔法议会掌控魔法秩序',
      factions: [
        {
          id: 'magic_council',
          name: '魔法议会',
          type: 'alliance',
          worldType: '魔幻',
          description: '魔法世界的最高权力机构，汇集各族魔法大师。',
          characteristics: '魔法精通，资源丰富',
          motto: '魔法永恒，真理不朽',
          requirement: '需有魔法天赋',
          traits: [
            {
              id: 'magic_mastery',
              name: '魔法精通',
              description: '魔法造诣深厚',
              type: 'combat',
              effects: [
                { type: 'skill_bonus', params: { skillType: 'magic', damageBonus: 20 }, displayText: '魔法伤害+20%' },
                { type: 'stat_bonus', params: { mpRegen: 20 }, displayText: '法力恢复+20%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_arcane_blast', 'technique_arcane_shield'],
          exclusiveEquipments: ['equip_arcane_staff'],
          exclusiveShopItems: ['shop_mana_potion', 'shop_spell_scroll']
        },
      ],
    },
    {
      groupName: '三大王国',
      groupDescription: '三大王国各据一方',
      factions: [
        {
          id: 'magic_kingdom',
          name: '精灵王国',
          type: 'empire',
          worldType: '魔幻',
          description: '精灵族的永恒国度，自然魔法源远流长。',
          characteristics: '自然魔法，生命悠长',
          motto: '自然之道，永恒长存',
          requirement: '需有精灵血统',
          traits: [
            {
              id: 'elf_nature',
              name: '精灵之血',
              description: '自然之力庇护',
              type: 'special',
              effects: [
                { type: 'stat_bonus', params: { evasion: 10 }, displayText: '闪避率+10%' },
                { type: 'special_ability', params: { natureHeal: 5 }, displayText: '每回合恢复5%HP' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_nature_heal', 'technique_nature_wrath'],
          exclusiveEquipments: ['equip_elf_bow'],
          exclusiveShopItems: ['shop_nature_herb', 'shop_elf_artifact']
        },
        {
          id: 'magic_dwarf',
          name: '矮人王国',
          type: 'empire',
          worldType: '魔幻',
          description: '矮人族的地下王国，锻造技艺精湛。',
          characteristics: '锻造专精，装备精良',
          motto: '匠心独运，锤炼传奇',
          requirement: '需通过试炼',
          traits: [
            {
              id: 'dwarf_forge',
              name: '矮人锻造',
              description: '锻造技艺精湛',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { forgeSuccess: 20 }, displayText: '锻造成功率+20%' },
                { type: 'stat_bonus', params: { equipmentBonus: 10 }, displayText: '装备效果+10%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_rune_weapon', 'technique_rune_armor'],
          exclusiveEquipments: ['equip_dwarf_hammer'],
          exclusiveShopItems: ['shop_rune_stone', 'shop_forge_material']
        },
        {
          id: 'magic_human',
          name: '人类王国',
          type: 'empire',
          worldType: '魔幻',
          description: '人类建立的强大王国，骑士与法师并存。',
          characteristics: '体系完善，职业丰富',
          motto: '荣耀与勇气，王国永存',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'human_versatile',
              name: '人类适应性',
              description: '多才多艺',
              type: 'cultivation',
              effects: [
                { type: 'cultivation_bonus', params: { cultivationSpeed: 10 }, displayText: '修炼速度+10%' },
                { type: 'skill_bonus', params: { allSkillBonus: 5 }, displayText: '所有技能伤害+5%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_knight_charge', 'technique_mage_fireball'],
          exclusiveEquipments: ['equip_knight_sword'],
          exclusiveShopItems: ['shop_knight_gear', 'shop_mage_supplies']
        },
      ],
    },
    {
      groupName: '法师协会',
      groupDescription: '法师协会传承魔法知识',
      factions: [
        {
          id: 'magic_guild',
          name: '法师协会',
          type: 'guild',
          worldType: '魔幻',
          description: '魔法师的组织，汇集各系魔法传承。',
          characteristics: '魔法传承丰富，流派众多',
          motto: '追寻魔法真理，探索元素奥秘',
          requirement: '需有魔法天赋',
          traits: [
            {
              id: 'magic_guild_knowledge',
              name: '魔法知识',
              description: '魔法学识深厚',
              type: 'cultivation',
              effects: [
                { type: 'cultivation_bonus', params: { magicMastery: 15 }, displayText: '魔法精通+15%' },
                { type: 'resource_bonus', params: { spellDiscount: 20 }, displayText: '法术卷轴折扣20%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_elemental_master', 'technique_ritual_power'],
          exclusiveEquipments: ['equip_mage_robe'],
          exclusiveShopItems: ['shop_spell_tome', 'shop_elemental_core']
        },
      ],
    },
    {
      groupName: '神圣教会',
      groupDescription: '神圣教会传播光明信仰',
      factions: [
        {
          id: 'magic_church',
          name: '神圣教会',
          type: 'sect',
          worldType: '魔幻',
          description: '信仰光明之神的宗教势力，拥有神圣魔法传承。',
          characteristics: '神圣魔法，治愈能力强',
          motto: '光明永照，信仰永恒',
          requirement: '需有坚定信仰',
          traits: [
            {
              id: 'holy_light',
              name: '圣光庇护',
              description: '光明之神的庇护',
              type: 'special',
              effects: [
                { type: 'stat_bonus', params: { holyDamage: 15 }, displayText: '神圣伤害+15%' },
                { type: 'special_ability', params: { holyHeal: 10 }, displayText: '治疗效果+10%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_holy_light', 'technique_divine_shield'],
          exclusiveEquipments: ['equip_holy_symbol'],
          exclusiveShopItems: ['shop_holy_water', 'shop_prayer_scroll']
        },
      ],
    },
  ],

  '异能': [
    {
      groupName: '异能管理局',
      groupDescription: '官方机构管理异能者秩序',
      factions: [
        {
          id: 'ability_bureau',
          name: '异能管理局',
          type: 'alliance',
          worldType: '异能',
          description: '官方异能者管理机构，维护异能者秩序。',
          characteristics: '体系完善，资源丰富',
          motto: '秩序与自由并存，异能造福人类',
          requirement: '需为觉醒异能者',
          traits: [
            {
              id: 'bureau_resource',
              name: '官方资源',
              description: '政府支持',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { salary: 150 }, displayText: '每日津贴+150' },
                { type: 'resource_bonus', params: { shopDiscount: 12 }, displayText: '商店折扣12%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_ability_boost', 'technique_ability_control'],
          exclusiveEquipments: ['equip_suppress_bracelet'],
          exclusiveShopItems: ['shop_ability_serum', 'shop_control_device']
        },
      ],
    },
    {
      groupName: '自由联盟',
      groupDescription: '反抗组织追求异能者自由',
      factions: [
        {
          id: 'ability_resistance',
          name: '自由异能联盟',
          type: 'alliance',
          worldType: '异能',
          description: '反抗管理局统治的异能者组织，追求异能者自由。',
          characteristics: '自由至上，战斗力强',
          motto: '自由不可战胜，异能者永不为奴',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'freedom_power',
              name: '自由意志',
              description: '意志坚定',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 12, critChance: 8 }, displayText: '攻击力+12%，暴击率+8%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_freedom_strike', 'technique_rebellion'],
          exclusiveEquipments: ['equip_freedom_badge'],
          exclusiveShopItems: ['shop_black_market', 'shop_underground']
        },
      ],
    },
    {
      groupName: '科技集团',
      groupDescription: '科技集团研究异能技术',
      factions: [
        {
          id: 'ability_corp',
          name: '超凡科技集团',
          type: 'guild',
          worldType: '异能',
          description: '研究异能的商业巨头，掌握异能增幅技术。',
          characteristics: '科技辅助异能，装备精良',
          motto: '异能改变世界，科技创造未来',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'tech_enhance',
              name: '科技增幅',
              description: '科技提升异能',
              type: 'combat',
              effects: [
                { type: 'skill_bonus', params: { abilityDamage: 18 }, displayText: '异能伤害+18%' },
                { type: 'resource_bonus', params: { amplifierBonus: 25 }, displayText: '增幅器效果+25%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_amplifier_overload', 'technique_tech_boost'],
          exclusiveEquipments: ['equip_amplifier_device'],
          exclusiveShopItems: ['shop_amp_core', 'shop_enhance_module']
        },
      ],
    },
    {
      groupName: '觉醒学院',
      groupDescription: '学院培养年轻异能者',
      factions: [
        {
          id: 'ability_academy',
          name: '觉醒学院',
          type: 'academy',
          worldType: '异能',
          description: '异能者培训学府，专门培养年轻异能者。',
          characteristics: '培养体系完善，成长快速',
          motto: '觉醒自我，超越极限',
          requirement: '需通过入学测试',
          traits: [
            {
              id: 'academy_training',
              name: '学院培养',
              description: '系统化训练',
              type: 'cultivation',
              effects: [
                { type: 'cultivation_bonus', params: { cultivationSpeed: 18 }, displayText: '修炼速度+18%' },
                { type: 'cultivation_bonus', params: { breakthroughChance: 8 }, displayText: '突破成功率+8%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_awakening_boost', 'technique_mind_expand'],
          exclusiveEquipments: ['equip_training_suit'],
          exclusiveShopItems: ['shop_training_manual', 'shop_ability_test']
        },
      ],
    },
  ],

  '仙侠': [
    {
      groupName: '剑仙门派',
      groupDescription: '剑仙门派御剑乘风，逍遥天地',
      factions: [
        {
          id: 'xianxia_sword_sect',
          name: '天剑门',
          type: 'sect',
          worldType: '仙侠',
          description: '剑道至高宗门，剑仙传承千古。',
          characteristics: '剑修专精，攻击凌厉',
          motto: '以剑入道，剑心通明',
          requirement: '需有剑道天赋',
          traits: [
            {
              id: 'sword_immortal',
              name: '剑仙之道',
              description: '剑修传承',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 12 }, displayText: '攻击力+12%' },
                { type: 'skill_bonus', params: { skillType: 'sword', damageBonus: 22 }, displayText: '剑系功法伤害+22%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_heavenly_sword', 'technique_sword_flight'],
          exclusiveEquipments: ['equip_flying_sword'],
          exclusiveShopItems: ['shop_sword_manual', 'shop_sword_formation']
        },
        {
          id: 'xianxia_cloud_sect',
          name: '云霄剑宗',
          type: 'sect',
          worldType: '仙侠',
          description: '云雾缭绕的剑修圣地，剑法飘逸。',
          characteristics: '剑法飘逸，身法灵动',
          motto: '云霄之上，剑意长存',
          requirement: '需有剑道天赋',
          traits: [
            {
              id: 'cloud_sword',
              name: '云霄剑意',
              description: '剑法飘逸',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { evasion: 15, speed: 10 }, displayText: '闪避率+15%，速度+10%' },
                { type: 'skill_bonus', params: { skillType: 'sword', damageBonus: 18 }, displayText: '剑系功法伤害+18%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_cloud_step', 'technique_cloud_sword'],
          exclusiveEquipments: ['equip_cloud_cloak'],
          exclusiveShopItems: ['shop_cloud_material', 'shop_flight_art']
        },
      ],
    },
    {
      groupName: '丹道圣地',
      groupDescription: '丹道圣地炼制仙丹灵药',
      factions: [
        {
          id: 'xianxia_dan_sect',
          name: '仙丹宗',
          type: 'sect',
          worldType: '仙侠',
          description: '丹道圣地，可炼制各种仙丹灵药。',
          characteristics: '丹道专精，资源丰富',
          motto: '丹成仙道，药石通灵',
          requirement: '需有炼丹天赋',
          traits: [
            {
              id: 'immortal_pill',
              name: '仙丹传承',
              description: '丹道造诣',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { alchemySuccess: 18 }, displayText: '炼丹成功率+18%' },
                { type: 'resource_bonus', params: { pillEffect: 25 }, displayText: '丹药效果+25%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_pill_fire', 'technique_immortal_pill'],
          exclusiveEquipments: ['equip_dan_cauldron'],
          exclusiveShopItems: ['shop_immortal_herb', 'shop_pill_recipe']
        },
      ],
    },
    {
      groupName: '散修联盟',
      groupDescription: '散修聚集，互通有无',
      factions: [
        {
          id: 'xianxia_free',
          name: '散修联盟',
          type: 'alliance',
          worldType: '仙侠',
          description: '散修聚集之地，互通有无。',
          characteristics: '自由灵活，资源共享',
          motto: '道友互助，共证仙道',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'free_cultivation',
              name: '逍遥修仙',
              description: '无拘无束',
              type: 'cultivation',
              effects: [
                { type: 'cultivation_bonus', params: { cultivationSpeed: 8 }, displayText: '修炼速度+8%' },
                { type: 'resource_bonus', params: { tradeBonus: 15 }, displayText: '交易收益+15%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_free_escape', 'technique_free_spirit'],
          exclusiveEquipments: ['equip_free_talisman'],
          exclusiveShopItems: ['shop_misc_scroll', 'shop_cultivation_item']
        },
      ],
    },
  ],

  '武侠': [
    {
      groupName: '五大门派',
      groupDescription: '五大门派统领江湖正道',
      factions: [
        {
          id: 'wuxia_shaolin',
          name: '少林派',
          type: 'sect',
          worldType: '武侠',
          description: '天下武学之源，禅武合一。',
          characteristics: '武学正宗，攻防兼备',
          motto: '禅武合一，普度众生',
          requirement: '需有向佛之心',
          traits: [
            {
              id: 'shaolin_orthodox',
              name: '少林正宗',
              description: '武学传承',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 8, defense: 12 }, displayText: '攻击力+8%，防御力+12%' },
                { type: 'skill_bonus', params: { skillType: 'martial', damageBonus: 15 }, displayText: '武学伤害+15%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_shaolin_fist', 'technique_shaolin_staff'],
          exclusiveEquipments: ['equip_monk_robe'],
          exclusiveShopItems: ['shop_shaolin_manual', 'shop_buddhist_item']
        },
        {
          id: 'wuxia_wudang',
          name: '武当派',
          type: 'sect',
          worldType: '武侠',
          description: '道家武学圣地，以柔克刚。',
          characteristics: '道家武学，防御稳固',
          motto: '道法自然，太极生两仪',
          requirement: '需有道心',
          traits: [
            {
              id: 'wudang_taiji',
              name: '太极之道',
              description: '以柔克刚',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { defense: 15, evasion: 10 }, displayText: '防御力+15%，闪避率+10%' },
                { type: 'special_ability', params: { counterChance: 15, counterDamage: 50 }, displayText: '15%几率反击50%伤害' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_taiji_fist', 'technique_taiji_sword'],
          exclusiveEquipments: ['equip_taoist_robe'],
          exclusiveShopItems: ['shop_taoist_manual', 'shop_taiji_scroll']
        },
        {
          id: 'wuxia_emei',
          name: '峨眉派',
          type: 'sect',
          worldType: '武侠',
          description: '以女性为主的门派，剑法轻灵。',
          characteristics: '剑法轻灵，身法敏捷',
          motto: '峨眉剑影，巾帼不让',
          requirement: '需为女性',
          traits: [
            {
              id: 'emei_sword',
              name: '峨眉剑法',
              description: '剑法轻灵',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 10, speed: 15 }, displayText: '攻击力+10%，速度+15%' },
                { type: 'skill_bonus', params: { skillType: 'sword', damageBonus: 18 }, displayText: '剑法伤害+18%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_emei_sword', 'technique_emei_needle'],
          exclusiveEquipments: ['equip_emei_sword'],
          exclusiveShopItems: ['shop_emei_manual', 'shop_female_gear']
        },
        {
          id: 'wuxia_huashan',
          name: '华山派',
          type: 'sect',
          worldType: '武侠',
          description: '剑法犀利，紫霞神功独步天下。',
          characteristics: '剑法犀利，内功深厚',
          motto: '华山论剑，剑道独尊',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'huashan_sword',
              name: '华山剑气',
              description: '剑法凌厉',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 15 }, displayText: '攻击力+15%' },
                { type: 'skill_bonus', params: { skillType: 'sword', damageBonus: 20 }, displayText: '剑法伤害+20%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_zixia_power', 'technique_huashan_sword'],
          exclusiveEquipments: ['equip_huashan_sword'],
          exclusiveShopItems: ['shop_zixia_manual', 'shop_sword_secret']
        },
        {
          id: 'wuxia_kongtong',
          name: '崆峒派',
          type: 'sect',
          worldType: '武侠',
          description: '拳掌功夫了得，七伤拳威震武林。',
          characteristics: '拳掌专精，攻击刚猛',
          motto: '崆峒拳意，刚猛无匹',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'kongtong_fist',
              name: '崆峒七伤',
              description: '拳法刚猛',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 12, critDamage: 20 }, displayText: '攻击力+12%，暴击伤害+20%' },
                { type: 'skill_bonus', params: { skillType: 'fist', damageBonus: 22 }, displayText: '拳掌伤害+22%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_qishang_fist', 'technique_kongtong_palm'],
          exclusiveEquipments: ['equip_kongtong_glove'],
          exclusiveShopItems: ['shop_fist_manual', 'shop_power_pill']
        },
      ],
    },
    {
      groupName: '丐帮',
      groupDescription: '天下第一大帮',
      factions: [
        {
          id: 'wuxia_beggar',
          name: '丐帮',
          type: 'alliance',
          worldType: '武侠',
          description: '天下第一大帮，弟子遍布江湖。',
          characteristics: '势力庞大，消息灵通',
          motto: '行侠仗义，扶危济困',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'beggar_network',
              name: '丐帮网络',
              description: '消息灵通',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { infoBonus: 30 }, displayText: '情报获取+30%' },
                { type: 'resource_bonus', params: { treasureFind: 15 }, displayText: '宝物发现+15%' }
              ]
            },
            {
              id: 'beggar_kungfu',
              name: '打狗棒法',
              description: '丐帮绝学',
              type: 'combat',
              effects: [
                { type: 'skill_bonus', params: { skillType: 'staff', damageBonus: 25 }, displayText: '棒法伤害+25%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_dog_beating_staff', 'technique_eighteen_palms'],
          exclusiveEquipments: ['equip_bamboo_staff'],
          exclusiveShopItems: ['shop_beggar_resource', 'shop_intel_item']
        },
      ],
    },
    {
      groupName: '武林盟',
      groupDescription: '江湖正道联盟',
      factions: [
        {
          id: 'wuxia_alliance',
          name: '武林盟',
          type: 'alliance',
          worldType: '武侠',
          description: '江湖正道联盟，维护武林秩序。',
          characteristics: '正道联盟，资源丰富',
          motto: '匡扶正义，替天行道',
          requirement: '需为正道人士',
          traits: [
            {
              id: 'alliance_justice',
              name: '正道之威',
              description: '正道加持',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 8, defense: 8 }, displayText: '攻击力+8%，防御力+8%' },
                { type: 'resource_bonus', params: { reputation: 20 }, displayText: '声望获取+20%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_justice_blade', 'technique_alliance_seal'],
          exclusiveEquipments: ['equip_alliance_badge'],
          exclusiveShopItems: ['shop_alliance_resource', 'shop_justice_item']
        },
      ],
    },
  ],

  '末世': [
    {
      groupName: '幸存者联盟',
      groupDescription: '废土上最大的人类组织',
      factions: [
        {
          id: 'apocalypse_survivor',
          name: '幸存者联盟',
          type: 'alliance',
          worldType: '末世',
          description: '废土上最大的人类幸存者组织，拥有多个基地。',
          characteristics: '势力庞大，资源丰富',
          motto: '团结求生，重建文明',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'survivor_unity',
              name: '幸存者团结',
              description: '团队协作',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { scavenging: 15 }, displayText: '搜刮效率+15%' },
                { type: 'stat_bonus', params: { maxHp: 10 }, displayText: '最大生命+10%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_survival_skill', 'technique_team_tactics'],
          exclusiveEquipments: ['equip_survivor_gear'],
          exclusiveShopItems: ['shop_survival_supplies', 'shop_base_material']
        },
      ],
    },
    {
      groupName: '避难所',
      groupDescription: '战前避难所的联合体',
      factions: [
        {
          id: 'apocalypse_vault',
          name: '避难所联盟',
          type: 'alliance',
          worldType: '末世',
          description: '战前避难所的联合体，科技实力强大。',
          characteristics: '科技先进，物资充足',
          motto: '保存火种，延续文明',
          requirement: '需通过审核',
          traits: [
            {
              id: 'vault_tech',
              name: '避难所科技',
              description: '科技优势',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { techBonus: 20 }, displayText: '科技效率+20%' },
                { type: 'resource_bonus', params: { craftingSuccess: 15 }, displayText: '制造成功率+15%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_vault_defense', 'technique_vault_weapon'],
          exclusiveEquipments: ['equip_vault_armor'],
          exclusiveShopItems: ['shop_high_tech', 'shop_vault_resource']
        },
      ],
    },
    {
      groupName: '进化者',
      groupDescription: '变异进化者的组织',
      factions: [
        {
          id: 'apocalypse_mutant',
          name: '进化者联盟',
          type: 'alliance',
          worldType: '末世',
          description: '变异进化者的组织，成员拥有强大的变异能力。',
          characteristics: '战斗力强，变异能力',
          motto: '进化即生存，适者生存',
          requirement: '需为变异进化者',
          traits: [
            {
              id: 'mutant_power',
              name: '变异力量',
              description: '变异能力',
              type: 'combat',
              effects: [
                { type: 'stat_bonus', params: { attack: 15, maxHp: 15 }, displayText: '攻击力+15%，最大生命+15%' },
                { type: 'special_ability', params: { mutationSkill: true }, displayText: '解锁变异技能' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_mutation_strength', 'technique_mutation_heal'],
          exclusiveEquipments: ['equip_mutation_core'],
          exclusiveShopItems: ['shop_mutation_serum', 'shop_evolution_item']
        },
      ],
    },
    {
      groupName: '掠夺者',
      groupDescription: '废土掠夺者的松散联盟',
      factions: [
        {
          id: 'apocalypse_raider',
          name: '掠夺者联盟',
          type: 'alliance',
          worldType: '末世',
          description: '废土掠夺者的松散联盟，行事不择手段。',
          characteristics: '战斗经验丰富，掠夺资源',
          motto: '强者生存，弱者淘汰',
          requirement: '无特殊要求',
          traits: [
            {
              id: 'raider_loot',
              name: '掠夺本能',
              description: '掠夺效率',
              type: 'resource',
              effects: [
                { type: 'resource_bonus', params: { lootBonus: 25 }, displayText: '战利品+25%' },
                { type: 'stat_bonus', params: { attack: 10 }, displayText: '攻击力+10%' }
              ]
            }
          ],
          exclusiveTechniques: ['technique_raider_ambush', 'technique_raider_fury'],
          exclusiveEquipments: ['equip_raider_armor'],
          exclusiveShopItems: ['shop_black_market', 'shop_illegal_weapon']
        },
      ],
    },
  ],
};

// ============================================
// 势力生成函数
// ============================================

/**
 * 根据世界类型生成势力列表
 *
 * @param worldType - 世界类型
 * @param rng - 随机数生成器（可选，用于确定性生成）
 */
export function generateWorldFactions(worldType: WorldType, rng: () => number = Math.random): WorldFaction[] {
  const groups = WORLD_FACTION_GROUPS[worldType] || [];
  const selectedFactions: WorldFaction[] = [];

  for (const group of groups) {
    if (group.factions.length > 0) {
      const faction = group.factions[Math.floor(rng() * group.factions.length)];
      selectedFactions.push({
        id: faction.id,
        name: faction.name,
        type: FactionTypeNames[faction.type],
        description: faction.description,
      });
    }
  }

  return selectedFactions;
}

export function generateFactionDescription(worldType: WorldType, factions: WorldFaction[]): string {
  const groups = WORLD_FACTION_GROUPS[worldType] || [];
  const parts: string[] = [];
  
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const faction = factions[i];
    if (faction) {
      if (group.factions.length > 1) {
        parts.push(`${group.groupName}之${faction.name}`);
      } else {
        parts.push(faction.name);
      }
    }
  }
  
  if (parts.length === 0) return '各方势力割据';
  if (parts.length === 1) return parts[0];
  
  return parts.slice(0, -1).join('、') + '与' + parts[parts.length - 1];
}

export function generateFactionBackgroundDescription(worldType: WorldType, factions: WorldFaction[]): string {
  const groups = WORLD_FACTION_GROUPS[worldType] || [];
  const descriptions: string[] = [];
  
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const faction = factions[i];
    if (faction) {
      if (group.factions.length > 1) {
        descriptions.push(`${group.groupName}以${faction.name}为首，${group.groupDescription}`);
      } else {
        descriptions.push(`${faction.name}${group.groupDescription}`);
      }
    }
  }
  
  return descriptions.join('。') + '。';
}

// ============================================
// 便捷函数
// ============================================

export const WORLD_FACTIONS: Record<WorldType, Faction[]> = Object.fromEntries(
  Object.entries(WORLD_FACTION_GROUPS).map(([worldType, groups]) => [
    worldType,
    groups.flatMap(g => g.factions),
  ])
) as Record<WorldType, Faction[]>;

export function getFactionsByWorld(worldType: WorldType): Faction[] {
  return WORLD_FACTIONS[worldType] || [];
}

export function getFactionById(factionId: string): Faction | undefined {
  for (const factions of Object.values(WORLD_FACTIONS)) {
    const faction = factions.find(f => f.id === factionId);
    if (faction) return faction;
  }
  return undefined;
}

/**
 * 计算势力特性加成
 * 汇总所有类型的加成效果
 */
export function calculateFactionBonuses(factionId: string | null): Record<string, number> {
  if (!factionId) return {};
  
  const faction = getFactionById(factionId);
  if (!faction || !faction.traits) return {};
  
  const bonuses: Record<string, number> = {};
  
  for (const trait of faction.traits) {
    for (const effect of trait.effects) {
      // 处理所有数值类型的参数
      for (const [key, value] of Object.entries(effect.params)) {
        if (typeof value === 'number') {
          bonuses[key] = (bonuses[key] || 0) + value;
        }
      }
    }
  }
  
  return bonuses;
}

/**
 * 获取势力特性描述列表（用于UI展示）
 */
export function getFactionTraitDisplay(factionId: string | null): { name: string; description: string; effects: string[] }[] {
  if (!factionId) return [];
  
  const faction = getFactionById(factionId);
  if (!faction || !faction.traits) return [];
  
  return faction.traits.map(trait => ({
    name: trait.name,
    description: trait.description,
    effects: trait.effects.map(e => e.displayText)
  }));
}
