/**
 * modules/item/types.ts — 统一物品系统类型定义
 *
 * 所有可拥有、可使用、可装备、可消耗、可升级的实体统一为 Item 体系。
 * 分为两层：
 *   ItemTemplate  — 静态定义（名称/描述/基础数值/槽位信息）
 *   ItemInstance  — 运行时数据（等级/经验/词缀/装备状态）
 */

import type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
import type { WorldType } from '@/core/types';

// ══════════════════════════════════════════════════════════════════
// 稀有度
// ══════════════════════════════════════════════════════════════════

/** 六等稀有度（统一体系，替代旧的 ItemRarity / Quality / QualityTier） */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

// ══════════════════════════════════════════════════════════════════
// 物品分类
// ══════════════════════════════════════════════════════════════════

/** 物品大类 */
export type ItemCategory = 'currency' | 'consumable' | 'material' | 'equipment' | 'technique' | 'skill' | 'fragment';

/** 装备子类 */
export type EquipmentSubcategory = 'weapon_melee' | 'weapon_ranged' | 'armor_head' | 'armor_body' | 'armor_legs' | 'armor_feet';

/** 功法子类 */
export type TechniqueSubcategory = 'attack' | 'defense';

/** 技能子类 */
export type SkillSubcategory = 'magic_skill' | 'combat_skill';

/** 技能标签 */
export type SkillTag = 'instant' | 'channeling' | 'aoe' | 'dot' | 'hot' | 'shield'
  | 'lifesteal' | 'execute' | 'combo' | 'counter' | 'buff' | 'debuff';

// ══════════════════════════════════════════════════════════════════
// 技能效果
// ══════════════════════════════════════════════════════════════════

/** 技能效果 */
export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'shield' | 'special';
  baseValue: number;
  statScaling: number;
  target: 'self' | 'single' | 'all' | 'random';
  duration?: number;
  description?: string;
}

// ══════════════════════════════════════════════════════════════════
// 词缀
// ══════════════════════════════════════════════════════════════════

/** 物品随机词缀 */
export interface ItemAffix {
  id: string;
  name: string;
  type: 'prefix' | 'suffix';
  rarity: Rarity;
  description: string;
  effects: Record<string, number>; // statKey → value
}

// ══════════════════════════════════════════════════════════════════
// 槽位系统
// ══════════════════════════════════════════════════════════════════

/** 槽位标识 */
export type SlotId = string;

/** 槽位解锁条件 */
export interface UnlockCondition {
  type: 'level' | 'realm' | 'quest';
  minLevel?: number;
  minRealm?: number;
  questId?: string;
}

/** 槽位定义 */
export interface SlotDefinition {
  slotId: SlotId;
  displayName: string;
  /** 槽位大类 */
  category: 'equipment' | 'technique' | 'skill';
  /** 接受的物品类型 */
  acceptedCategory: ItemCategory;
  /** 接受的子类型 */
  acceptedSubcategory?: string;
  /** 接受的技能标签（仅技能槽） */
  acceptedSkillTag?: SkillTag;
  /** 是否动态创建/销毁（技能槽为 true） */
  isDynamic: boolean;
  /** 父槽位（技能槽指向所属装备/功法槽） */
  parentSlotId?: SlotId;
  /** 该类型槽位数（功法槽为 3） */
  maxCount?: number;
  /** 解锁条件 */
  unlockCondition?: UnlockCondition;
}

// ══════════════════════════════════════════════════════════════════
// ItemTemplate — 标记联合
// ══════════════════════════════════════════════════════════════════

/** 物品模板公共字段 */
interface ItemTemplateBase {
  templateId: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: Rarity;
  maxStack: number;
  maxLevel: number;
  baseStats: Record<string, number>;
  price: number;
  element: Element | null;
  worldType?: WorldType;
  worldviewRestrictions?: string[];
  /** 是否可掉落 */
  isDroppable: boolean;
}

/** 货币模板 */
export interface CurrencyTemplate extends ItemTemplateBase {
  category: 'currency';
  subcategory: string; // 'primary' | 'faction' | 'sect' | 'honor' | 'ascension' | 'event'
  maxStack: 999_999_999;
  maxLevel: 1;
  ext: Record<string, never>;
}

/** 消耗品模板 */
export interface ConsumableTemplate extends ItemTemplateBase {
  category: 'consumable';
  subcategory: 'pill_hp' | 'pill_mp' | 'pill_cultivation' | 'pill_breakthrough' | 'pill_stat' | 'scroll';
  ext: {
    effects: SkillEffect[];
    requiredLevel?: number;
    requiredRealm?: number;
    cooldownSeconds?: number;
  };
}

/** 材料模板 */
export interface MaterialTemplate extends ItemTemplateBase {
  category: 'material';
  subcategory: 'herb' | 'ore' | 'gem' | 'beast_part' | 'exp_fodder' | 'special';
  ext: {
    /** 经验材料提供的 exp 量 */
    expValue?: number;
    /** 适用升级的物品类别 */
    applicableCategory?: ItemCategory;
  };
}

/** 装备模板 */
export interface EquipmentTemplate extends ItemTemplateBase {
  category: 'equipment';
  subcategory: EquipmentSubcategory;
  maxStack: 1;
  ext: {
    equipSlot: SlotId;
    providesSkillSlots: number;
    acceptedSkillTag: SkillTag;
    weaponCategory: WeaponCategory | null;
    compatibleElement: Element | null;
    compatibleBonus: number;
  };
}

/** 功法模板 */
export interface TechniqueTemplate extends ItemTemplateBase {
  category: 'technique';
  subcategory: TechniqueSubcategory;
  maxStack: 1;
  ext: {
    providesSkillSlots: number;
    acceptedSkillTag: SkillTag;
    compatibleWeapon: WeaponCategory | null;
    compatibleBonus: number;
    baseMpCost: number;
    subElement?: Element;
  };
}

/** 技能模板 */
export interface SkillTemplate extends ItemTemplateBase {
  category: 'skill';
  subcategory: SkillSubcategory;
  maxStack: 1;
  ext: {
    requiredElement?: Element;
    weaponRestriction?: WeaponCategory;
    isUltimate?: boolean;
    cooldown: number;
    effects: SkillEffect[];
    tags: SkillTag[];
  };
}

/** 碎片模板 */
export interface FragmentTemplate extends ItemTemplateBase {
  category: 'fragment';
  subcategory: string; // 对应源物品的 subcategory
  maxLevel: 1;
  ext: {
    sourceTemplateId: string;
    sourceName: string;
    sourceCategory: ItemCategory;
    sourceRarity: Rarity;
  };
}

/** 物品模板标记联合 */
export type ItemTemplate =
  | CurrencyTemplate
  | ConsumableTemplate
  | MaterialTemplate
  | EquipmentTemplate
  | TechniqueTemplate
  | SkillTemplate
  | FragmentTemplate;

// ══════════════════════════════════════════════════════════════════
// ItemInstance — 运行时数据
// ══════════════════════════════════════════════════════════════════

/** 物品运行时实例 */
export interface ItemInstance {
  /** 唯一实例 ID */
  instanceId: string;
  /** 指向 ItemTemplate */
  templateId: string;

  /** 当前堆叠数量 */
  quantity: number;

  /** 当前等级（从 1 开始） */
  level: number;
  /** 当前经验值 */
  exp: number;

  /** 随机词缀 */
  affixes: ItemAffix[];

  /** 是否装备中 */
  equipped: boolean;
  /** 装备在哪个槽位 */
  equippedInSlot: SlotId | null;

  /** 装备的技能（仅当物品提供技能槽时有效，skillSlotId → skillInstanceId） */
  equippedSkills: Record<string, string | null>;

  /** 当前元素（实例层面可变异，null 时继承模板） */
  element: Element | null;

  /** 是否为碎片形态 */
  isFragment: boolean;

  /** 获得时间戳（unix ms） */
  obtainedAt: number;
  /** 来源 */
  source: 'drop' | 'shop' | 'craft' | 'quest' | 'initial';
}

// ══════════════════════════════════════════════════════════════════
// 操作结果
// ══════════════════════════════════════════════════════════════════

/** 装备操作结果 */
export interface EquipResult {
  success: boolean;
  message?: string;
  error?: string;
  updatedInventory?: ItemInstance[];
  updatedSlots?: Record<SlotId, string | null>;
}

/** 通用操作结果 */
export type ItemActionResult<T = ItemInstance> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// ══════════════════════════════════════════════════════════════════
// 解析后的物品（合并模板+实例，用于 UI 展示）
// ══════════════════════════════════════════════════════════════════

/** 合并了模板和实例数据的完整物品信息（用于 UI） */
export interface ResolvedItem {
  instanceId: string;
  templateId: string;
  name: string;
  description: string;
  category: ItemCategory;
  subcategory: string;
  rarity: Rarity;
  quantity: number;
  level: number;
  maxLevel: number;
  exp: number;
  expToNext: number;
  equipped: boolean;
  equippedInSlot: SlotId | null;
  equippedSkills: Record<string, string | null>;
  element: Element | null;
  affixes: ItemAffix[];
  isFragment: boolean;
  obtainedAt: number;
  source: string;
  /** 当前等级的实际数值 */
  actualStats: Record<string, number>;
  /** 价格 */
  price: number;
  /** 模板的 ext（按 category 不同） */
  ext: ItemTemplate['ext'];
  /** 原始实例引用 */
  instance: ItemInstance;
  /** 原始模板引用 */
  template: ItemTemplate;
}
