/**
 * logic/poolEngine.ts — 池子引擎
 *
 * 纯函数模块：奖励池的核心滚动逻辑。
 * resolve → rarityRoll → select → generate → format。
 */

import type {
  RewardPool,
  RollContext,
  RollResult,
  RollResultItem,
  RollResultCurrency,
  ResolvedEntry,
  PoolEntry,
  StaticEntry,
  FilterEntry,
  CurrencyEntry,
  PoolRefEntry,
  EntryCondition,
} from '../types';
import type { Rarity } from '@/modules/item/types';
import type { ItemTemplateData } from '@/core/types';
import { getPool, getFilterCache, setFilterCache } from './poolRegistry';
import { applyFilter, filterCacheKey } from './itemFilter';
import { rollRarity, clampWeightsByRarity, getMaxRarityByLevel } from './rarityRoller';
import { generateItemInstance } from '@/modules/item/logic/itemGenerator';
import { getAllTemplates, getTemplate } from '@/modules/item/data/index';
import { ALL_RARITIES, RARITY_ORDER, RARITY_CONFIG } from '@/modules/item/data/rarity';
import { createRng, randomWeighted, randomInt, randomItem } from '@/shared/utils/rng';
import { createLogger } from '@/core/logger';
import { emitRewardEvent } from '../events';

const logger = createLogger('reward-pool.engine');

// ============================================
// 主入口
// ============================================

/**
 * 滚动奖励池，产生奖励
 *
 * 完整流程：resolve → select → rarity → generate → format
 *
 * @param poolId - 池子 ID
 * @param ctx - 滚动上下文
 * @returns 奖励结果（物品 + 货币 + 摘要文本）
 */
export function rollPool(poolId: string, ctx: RollContext): RollResult {
  const pool = getPool(poolId);
  if (!pool) {
    logger.warn(`池子 "${poolId}" 不存在，返回空结果`);
    return { items: [], currencies: [], summary: '未获得任何物品' };
  }

  const rng = ctx.seed !== undefined ? createRng(ctx.seed) : createRng(Date.now());

  // 应用难度倍率
  const diffMultiplier =
    ctx.difficulty && pool.difficultyMultiplier
      ? (pool.difficultyMultiplier[ctx.difficulty] ?? 1.0)
      : 1.0;

  // ① resolve：展开条目 + 过滤条件
  const resolved = resolvePool(pool, ctx);

  if (resolved.length === 0) {
    return { items: [], currencies: [], summary: '未获得任何物品' };
  }

  // ② 加权选取 dropCount 个条目
  const actualDropCount = randomInt(
    rng,
    pool.dropCount[0],
    pool.dropCount[1]
  );

  const items: RollResultItem[] = [];
  const currencies: RollResultCurrency[] = [];

  // 可用条目池（避免重复选取同一 static 条目）
  const availableEntries = [...resolved];

  for (let i = 0; i < actualDropCount && availableEntries.length > 0; i++) {
    const weights = availableEntries.map(e => e.effectiveWeight * diffMultiplier);
    const totalWeight = weights.reduce((s, w) => s + w, 0);

    if (totalWeight <= 0) break;

    const selectedIdx = randomWeighted(rng, weights);
    const selected = availableEntries[selectedIdx];

    // ③ 处理选中条目
    const result = processEntry(selected, ctx, rng);

    if (result) {
      if ('templateId' in result) {
        items.push(result);
      } else {
        currencies.push(result);
      }
    }

    // 移除已选条目（不放回）
    availableEntries.splice(selectedIdx, 1);
  }

  // ④ 格式化摘要
  const summary = formatSummary(items, currencies);

  // ⑤ 发射事件
  emitRewardEvent({
    poolId,
    source: { module: 'reward-pool' },
    result: { items, currencies, summary },
  });

  return { items, currencies, summary };
}

// ============================================
// 条目解析
// ============================================

/**
 * 解析池子条目
 *
 * - 展开 PoolRefEntry（递归获取子池条目）
 * - 检查 EntryCondition（不满足的剔除）
 * - 计算生效权重
 *
 * @param pool - 池子定义
 * @param ctx - 滚动上下文
 * @returns 已解析、已过滤、已加权重的条目列表
 */
export function resolvePool(
  pool: RewardPool,
  ctx: RollContext
): ResolvedEntry[] {
  const result: ResolvedEntry[] = [];

  for (const entry of pool.entries) {
    // 检查条件
    if (!checkConditions(entry.conditions, ctx)) {
      continue;
    }

    // 世界观过滤（池子级别）
    if (pool.worldView && pool.worldView !== ctx.worldView) {
      continue;
    }

    switch (entry.type) {
      case 'static':
      case 'filter':
      case 'currency':
        result.push({
          entry,
          effectiveWeight: entry.weight,
        });
        break;

      case 'pool_ref': {
        // 递归展开子池
        const subPool = getPool(entry.poolId);
        if (!subPool) {
          logger.warn(`pool_ref 引用的池子 "${entry.poolId}" 不存在，跳过`);
          continue;
        }

        // 检查子池条件
        if (!checkConditions(entry.conditions, ctx)) {
          continue;
        }

        const subResolved = resolvePool(subPool, ctx);
        for (const sub of subResolved) {
          result.push({
            ...sub,
            effectiveWeight: sub.effectiveWeight * (entry.weight / 100),
            rarityOverride: entry.rarityOverride ?? sub.rarityOverride,
          });
        }
        break;
      }
    }
  }

  return result;
}

// ============================================
// 条目处理
// ============================================

/**
 * 处理单个选中条目，产出物品或货币
 *
 * @returns RollResultItem | RollResultCurrency | null（产出为空）
 */
function processEntry(
  resolved: ResolvedEntry,
  ctx: RollContext,
  rng: () => number
): RollResultItem | RollResultCurrency | null {
  const { entry, rarityOverride } = resolved;

  switch (entry.type) {
    case 'static':
      return processStaticEntry(entry, ctx, rarityOverride, rng);

    case 'filter':
      return processFilterEntry(entry, ctx, rarityOverride, rng);

    case 'currency':
      return processCurrencyEntry(entry, ctx, rng);

    default:
      return null;
  }
}

/**
 * 处理 StaticEntry：稀有度投骰 → 生成实例
 */
function processStaticEntry(
  entry: StaticEntry,
  ctx: RollContext,
  rarityOverride: Partial<Record<Rarity, number>> | undefined,
  rng: () => number
): RollResultItem | null {
  // 获取有效稀有度权重
  const weights = rarityOverride ?? entry.rarityWeights;
  if (!weights || Object.keys(weights).length === 0) {
    // 无稀有度配置，使用模板默认稀有度
    try {
      const template = getTemplate(entry.templateId);
      const quantity = rollQuantity(entry.quantity, ctx.quantityMultiplier, rng);
      const instance = generateItemInstance(
        entry.templateId,
        Math.max(1, Math.floor(ctx.playerLevel / 10)),
        Math.floor(rng() * 1000000)
      );
      return {
        templateId: entry.templateId,
        instanceId: instance.instanceId,
        quantity,
        rarity: template.rarity,
      };
    } catch {
      logger.warn(`StaticEntry 模板 "${entry.templateId}" 不存在`);
      return null;
    }
  }

  // 裁剪稀有度上限
  let effectiveWeights = weights;
  if (ctx.maxRarityOverride) {
    effectiveWeights = clampWeightsByRarity(weights, ctx.maxRarityOverride);
  }

  // 投骰稀有度
  const rarity = rollRarity(
    effectiveWeights,
    ctx.luck,
    Math.floor(rng() * 1000000)
  );

  // 生成实例
  const quantity = rollQuantity(entry.quantity, ctx.quantityMultiplier, rng);
  const level = Math.max(1, Math.floor(ctx.playerLevel / 10));
  const seed = Math.floor(rng() * 1000000);

  try {
    const instance = generateItemInstance(entry.templateId, level, seed);
    return {
      templateId: entry.templateId,
      instanceId: instance.instanceId,
      quantity,
      rarity,
    };
  } catch {
    logger.warn(`StaticEntry 模板 "${entry.templateId}" 生成失败`);
    return null;
  }
}

/**
 * 处理 FilterEntry：稀有度投骰 → 过滤 → 随机选模板 → 生成实例
 */
function processFilterEntry(
  entry: FilterEntry,
  ctx: RollContext,
  rarityOverride: Partial<Record<Rarity, number>> | undefined,
  rng: () => number
): RollResultItem | null {
  // 获取有效稀有度权重
  let weights = rarityOverride ?? entry.rarityWeights;

  // 裁剪稀有度上限
  if (ctx.maxRarityOverride) {
    weights = clampWeightsByRarity(weights, ctx.maxRarityOverride);
  }

  // 投骰稀有度
  const rarity = rollRarity(
    weights,
    ctx.luck,
    Math.floor(rng() * 1000000)
  );

  // 查询缓存或过滤模板
  const cacheKey = filterCacheKey(entry.filter);
  let matchingTemplateIds = getFilterCache(cacheKey);

  if (!matchingTemplateIds) {
    const allTemplates = getAllTemplates();
    const filtered = applyFilter(allTemplates, entry.filter);
    matchingTemplateIds = filtered.map(t => t.templateId);
    setFilterCache(cacheKey, matchingTemplateIds);
  }

  // 按稀有度二次过滤
  const allTemplates = getAllTemplates();
  const rarityMatched = allTemplates.filter(
    t => matchingTemplateIds!.includes(t.templateId) && t.rarity === rarity
  );

  if (rarityMatched.length === 0) {
    // 降级：放宽到更低稀有度
    const fallback = allTemplates.filter(
      t =>
        matchingTemplateIds!.includes(t.templateId) &&
        (RARITY_ORDER[t.rarity as Rarity] ?? 0) <= RARITY_ORDER[rarity] &&
        (RARITY_ORDER[t.rarity as Rarity] ?? 0) > 0
    );
    if (fallback.length === 0) return null;

    const picked = randomItem(rng, fallback);
    return buildResultItem(picked, rarity, entry.quantity, ctx, rng);
  }

  const picked = randomItem(rng, rarityMatched);
  return buildResultItem(picked, rarity, entry.quantity, ctx, rng);
}

/**
 * 处理 CurrencyEntry：直接产出货币
 */
function processCurrencyEntry(
  entry: CurrencyEntry,
  ctx: RollContext,
  rng: () => number
): RollResultCurrency {
  const [min, max] = entry.amount;
  let amount = randomInt(rng, min, max);

  // 应用数量倍率
  if (ctx.quantityMultiplier && ctx.quantityMultiplier !== 1) {
    amount = Math.floor(amount * ctx.quantityMultiplier);
  }

  return { type: entry.currencyType, amount };
}

// ============================================
// 工具函数
// ============================================

/**
 * 检查条目条件
 */
function checkConditions(
  conditions: EntryCondition[] | undefined,
  ctx: RollContext
): boolean {
  if (!conditions || conditions.length === 0) return true;

  for (const cond of conditions) {
    switch (cond.type) {
      case 'playerLevelMin':
        if (ctx.playerLevel < cond.value) return false;
        break;
      case 'playerLevelMax':
        if (ctx.playerLevel > cond.value) return false;
        break;
      case 'worldView':
        if (ctx.worldView !== cond.value) return false;
        break;
      case 'luckMin':
        if (ctx.luck < cond.value) return false;
        break;
      case 'difficultyMin': {
        const diffOrder = { normal: 0, hard: 1, nightmare: 2 };
        const ctxDiff = ctx.difficulty ?? 'normal';
        if ((diffOrder[ctxDiff] ?? 0) < (diffOrder[cond.value] ?? 0)) return false;
        break;
      }
      case 'questCompleted':
        // questCompleted 检查由调用方在 context 中提供
        // 此处默认通过（调用方应预检查）
        break;
    }
  }

  return true;
}

/**
 * 滚动数量
 */
function rollQuantity(
  quantity: [number, number] | undefined,
  multiplier: number | undefined,
  rng: () => number
): number {
  const [min, max] = quantity ?? [1, 1];
  let qty = randomInt(rng, min, max);
  if (multiplier && multiplier !== 1) {
    qty = Math.max(1, Math.floor(qty * multiplier));
  }
  return qty;
}

/**
 * 从模板构建 RollResultItem
 */
function buildResultItem(
  template: ItemTemplateData,
  rolledRarity: Rarity,
  quantity: [number, number] | undefined,
  ctx: RollContext,
  rng: () => number
): RollResultItem | null {
  const qty = rollQuantity(quantity, ctx.quantityMultiplier, rng);
  const level = Math.max(1, Math.floor(ctx.playerLevel / 10));
  const seed = Math.floor(rng() * 1000000);

  try {
    const instance = generateItemInstance(template.templateId, level, seed);
    return {
      templateId: template.templateId,
      instanceId: instance.instanceId,
      quantity: qty,
      rarity: rolledRarity,
    };
  } catch {
    return null;
  }
}

// ============================================
// 格式化
// ============================================

/**
 * 格式化奖励摘要文本
 *
 * @param items - 物品列表
 * @param currencies - 货币列表
 * @returns 玩家可读的摘要文本（如 "获得了 [凡品] 铁剑 ×1、灵石 ×50"）
 */
export function formatSummary(
  items: RollResultItem[],
  currencies: RollResultCurrency[]
): string {
  const parts: string[] = [];

  // 物品
  if (items.length > 0) {
    for (const item of items) {
      try {
        const template = getTemplate(item.templateId);
        const rarityName = RARITY_CONFIG[item.rarity]?.displayName ?? item.rarity;
        const qtyStr = item.quantity > 1 ? ` ×${item.quantity}` : '';
        parts.push(`[${rarityName}] ${template.name}${qtyStr}`);
      } catch {
        parts.push(`${item.templateId}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`);
      }
    }
  }

  // 货币
  for (const c of currencies) {
    parts.push(`${c.type} ×${c.amount}`);
  }

  if (parts.length === 0) {
    return '未获得任何物品';
  }

  return `获得了 ${parts.join('、')}`;
}
