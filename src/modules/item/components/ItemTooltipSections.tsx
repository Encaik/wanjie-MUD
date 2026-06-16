'use client';

/**
 * ItemTooltip 品类专属分区组件
 *
 * 从 ItemTooltip 分离以控制文件大小。
 * 每个品类渲染不同的详情信息。
 */

import { Badge } from '@/shared/ui/data-display/badge';
import { Progress } from '@/shared/ui/feedback/progress';

import { RARITY_CONFIG } from '../data/rarity';

import type { ResolvedItem, Rarity, ItemAffix } from '../types';

/** 属性 key 中文映射 */
export const STAT_LABEL: Record<string, string> = {
  atk: '攻击', def: '防御', hp: '生命', mp: '法力',
  speed: '速度', critRate: '暴击率', critDmg: '暴击伤害',
  dodge: '闪避', hit: '命中', tenacity: '韧性', penetration: '穿透',
  cultivationSpeed: '修炼速度', breakthroughRate: '突破率',
  luck: '运气', comprehension: '悟性',
};

/** 技能标签中文 */
export const SKILL_TAG_LABEL: Record<string, string> = {
  instant: '瞬发', channeling: '吟唱', aoe: '范围',
  dot: '持续伤', hot: '持续疗', shield: '护盾',
  lifesteal: '吸血', execute: '斩杀', combo: '连击',
  counter: '反击', buff: '增益', debuff: '减益',
};

/** 效果类型中文 */
export const EFFECT_TYPE_LABEL: Record<string, string> = {
  heal: '恢复', damage: '伤害', buff: '增益', debuff: '减益', shield: '护盾', special: '特殊',
};

/** 类别中文 */
export const CATEGORY_LABEL: Record<string, string> = {
  currency: '货币', consumable: '消耗品', material: '材料',
  equipment: '装备', technique: '功法', skill: '技能', fragment: '碎片',
};

/** 子类中文 */
export const SUBCATEGORY_LABEL: Record<string, string> = {
  weapon_melee: '近战', weapon_ranged: '远程',
  armor_head: '头盔', armor_body: '护甲', armor_legs: '腿甲', armor_feet: '靴子',
  attack: '攻击', defense: '防御',
  magic_skill: '法术', combat_skill: '战技',
  pill_hp: '回血', pill_mp: '回蓝', pill_cultivation: '修炼', pill_breakthrough: '突破', pill_stat: '属性', scroll: '卷轴',
  herb: '草药', ore: '矿石', gem: '宝石', beast_part: '兽材', exp_fodder: '经验', special: '特殊',
  primary: '主币', faction: '势力', sect: '宗门', honor: '荣誉', ascension: '飞升', event: '活动',
};

/** 来源中文 */
export const SOURCE_LABEL: Record<string, string> = {
  drop: '掉落', shop: '商店', craft: '合成', quest: '任务', initial: '初始',
};

/** 品类专属内容分发 */
export function TooltipCategorySection({ item }: { item: ResolvedItem }) {
  switch (item.category) {
    case 'equipment': return <EquipmentSection item={item} />;
    case 'technique': return <TechniqueSection item={item} />;
    case 'skill': return <SkillSection item={item} />;
    case 'consumable': return <ConsumableSection item={item} />;
    case 'material': return <MaterialSection item={item} />;
    case 'fragment': return <FragmentSection item={item} />;
    default: return null;
  }
}

/** 装备专属 */
function EquipmentSection({ item }: { item: ResolvedItem }) {
  const ext = item.ext as {
    providesSkillSlots?: number; acceptedSkillTag?: string;
    compatibleElement?: string; compatibleBonus?: number; weaponCategory?: string;
  };

  return (
    <div className="space-y-1.5">
      {Object.keys(item.actualStats).length > 0 && (
        <div className="border-t border-border pt-1.5 space-y-0.5">
          {Object.entries(item.actualStats).map(([key, val]) => (
            <div key={key} className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">{STAT_LABEL[key] || key}</span>
              <span className="font-mono text-green-400">+{val}</span>
            </div>
          ))}
        </div>
      )}
      {item.affixes.length > 0 && (
        <div className="border-t border-border pt-1.5 space-y-0.5">
          <span className="text-[10px] text-muted-foreground">词缀</span>
          {item.affixes.map(affix => <AffixRow key={affix.id} affix={affix} />)}
        </div>
      )}
      {(ext.providesSkillSlots ?? 0) > 0 && (
        <div className="text-[11px] text-blue-400">
          技能槽: {ext.providesSkillSlots} 个
          {ext.acceptedSkillTag && ` (${SKILL_TAG_LABEL[ext.acceptedSkillTag] || ext.acceptedSkillTag})`}
        </div>
      )}
      {(ext.compatibleElement || ext.weaponCategory) && (
        <div className="text-[11px] text-muted-foreground flex gap-3">
          {ext.compatibleElement && <span>元素: {ext.compatibleElement}</span>}
          {ext.weaponCategory && <span>武器: {ext.weaponCategory}</span>}
        </div>
      )}
      {item.maxLevel > 1 && <LevelProgress item={item} />}
    </div>
  );
}

/** 功法专属 */
function TechniqueSection({ item }: { item: ResolvedItem }) {
  const ext = item.ext as {
    providesSkillSlots?: number; acceptedSkillTag?: string;
    compatibleWeapon?: string; compatibleBonus?: number;
    baseMpCost?: number; subElement?: string;
  };

  return (
    <div className="space-y-1.5">
      {Object.keys(item.actualStats).length > 0 && (
        <div className="border-t border-border pt-1.5 space-y-0.5">
          {Object.entries(item.actualStats).map(([key, val]) => (
            <div key={key} className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">{STAT_LABEL[key] || key}</span>
              <span className="font-mono text-green-400">+{val}</span>
            </div>
          ))}
        </div>
      )}
      {(ext.providesSkillSlots ?? 0) > 0 && (
        <div className="text-[11px] text-blue-400">
          技能槽: {ext.providesSkillSlots} 个
          {ext.acceptedSkillTag && ` (${SKILL_TAG_LABEL[ext.acceptedSkillTag] || ext.acceptedSkillTag})`}
        </div>
      )}
      <div className="text-[11px] text-muted-foreground flex gap-3">
        {ext.compatibleWeapon && <span>兼容: {ext.compatibleWeapon}</span>}
        {ext.compatibleBonus && <span>加成: +{Math.round(ext.compatibleBonus * 100)}%</span>}
        {ext.baseMpCost && <span>消耗: {ext.baseMpCost} MP</span>}
      </div>
      {item.maxLevel > 1 && <LevelProgress item={item} />}
    </div>
  );
}

/** 技能专属 */
function SkillSection({ item }: { item: ResolvedItem }) {
  const ext = item.ext as {
    effects?: { type?: string; description?: string; baseValue?: number }[];
    tags?: string[]; cooldown?: number;
    requiredElement?: string; weaponRestriction?: string; isUltimate?: boolean;
  };

  return (
    <div className="space-y-1.5">
      {ext.effects && ext.effects.length > 0 && (
        <div className="border-t border-border pt-1.5 space-y-1">
          {ext.effects.map((eff, i) => (
            <div key={i} className="text-[11px]">
              {eff.description ? (
                <span className="text-yellow-400">{eff.description}</span>
              ) : (
                <span className="text-yellow-400">{EFFECT_TYPE_LABEL[eff.type || ''] || eff.type}: {eff.baseValue}</span>
              )}
            </div>
          ))}
        </div>
      )}
      {ext.tags && ext.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ext.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-[9px] px-1 h-4">
              {SKILL_TAG_LABEL[tag] || tag}
            </Badge>
          ))}
          {ext.isUltimate && (
            <Badge variant="secondary" className="text-[9px] px-1 h-4 bg-quality-legendary/20 text-quality-legendary">
              绝技
            </Badge>
          )}
        </div>
      )}
      <div className="text-[11px] text-muted-foreground flex gap-3">
        {ext.cooldown !== undefined && <span>冷却: {ext.cooldown}秒</span>}
        {ext.requiredElement && <span>元素: {ext.requiredElement}</span>}
        {ext.weaponRestriction && <span>武器限制: {ext.weaponRestriction}</span>}
      </div>
    </div>
  );
}

/** 丹药专属 */
function ConsumableSection({ item }: { item: ResolvedItem }) {
  const ext = item.ext as {
    effects?: { description?: string; type?: string; baseValue?: number }[];
    cooldownSeconds?: number; requiredLevel?: number; requiredRealm?: number;
  };

  return (
    <div className="space-y-1.5">
      {ext.effects && ext.effects.length > 0 && (
        <div className="border-t border-border pt-1.5 space-y-1">
          {ext.effects.map((eff, i) => (
            <div key={i} className="text-[11px] text-green-400">
              {eff.description || `${EFFECT_TYPE_LABEL[eff.type || ''] || eff.type}: ${eff.baseValue}`}
            </div>
          ))}
        </div>
      )}
      <div className="text-[11px] text-muted-foreground flex gap-3">
        {ext.cooldownSeconds && <span>冷却: {ext.cooldownSeconds}秒</span>}
        {ext.requiredLevel && <span>需要 Lv.{ext.requiredLevel}</span>}
        {ext.requiredRealm && <span>需要境界 {ext.requiredRealm}</span>}
      </div>
    </div>
  );
}

/** 材料专属 */
function MaterialSection({ item }: { item: ResolvedItem }) {
  const ext = item.ext as { expValue?: number; applicableCategory?: string; };

  return (
    <div className="border-t border-border pt-1.5 text-[11px] text-muted-foreground">
      {ext.expValue && <div>经验值: +{ext.expValue} EXP</div>}
      {ext.applicableCategory && <div>适用: {CATEGORY_LABEL[ext.applicableCategory] || ext.applicableCategory}</div>}
    </div>
  );
}

/** 碎片专属 */
function FragmentSection({ item }: { item: ResolvedItem }) {
  const ext = item.ext as {
    sourceName?: string; sourceCategory?: string; sourceRarity?: Rarity;
  };
  const sourceRarityConfig = ext.sourceRarity ? RARITY_CONFIG[ext.sourceRarity] : null;

  return (
    <div className="border-t border-border pt-1.5 space-y-1">
      <div className="text-[11px]">
        <span className="text-muted-foreground">源物品: </span>
        {sourceRarityConfig ? (
          <span style={{ color: sourceRarityConfig.color }}>{ext.sourceName || '未知'}</span>
        ) : (
          <span>{ext.sourceName || '未知'}</span>
        )}
        {ext.sourceCategory && (
          <span className="text-muted-foreground"> · {CATEGORY_LABEL[ext.sourceCategory] || ext.sourceCategory}</span>
        )}
      </div>
      <div className="text-[11px] text-orange-400">收集碎片可合成完整物品</div>
    </div>
  );
}

/** 等级进度条 */
export function LevelProgress({ item }: { item: ResolvedItem }) {
  const expPercent = item.expToNext > 0 ? (item.exp / item.expToNext) * 100 : 100;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Lv.{item.level}/{item.maxLevel}</span>
        {item.level < item.maxLevel && <span>{item.exp}/{item.expToNext}</span>}
      </div>
      <Progress value={expPercent} className="h-1.5" indicatorClassName="bg-yellow-500" />
    </div>
  );
}

/** 词缀行 */
function AffixRow({ affix }: { affix: ItemAffix }) {
  const affixConfig = RARITY_CONFIG[affix.rarity];
  const effectText = Object.entries(affix.effects)
    .map(([k, v]) => `${STAT_LABEL[k] || k} ${v > 0 ? '+' : ''}${v}`)
    .join('，');

  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span style={{ color: affixConfig.color }} className="font-medium shrink-0">{affix.name}</span>
      <span className="text-muted-foreground truncate">{effectText}</span>
    </div>
  );
}
