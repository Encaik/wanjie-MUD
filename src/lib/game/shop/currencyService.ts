/**
 * 货币服务
 * 
 * 提供货币的获取、扣除、检查等功能
 */

import {
  CurrencyType,
  CurrencyCost,
  PlayerCurrencies,
  CURRENCY_CONFIGS,
  createDefaultCurrencies,
} from './types';

/**
 * 货币服务类
 */
export class CurrencyService {
  /**
   * 获取货币数量
   */
  static getCurrency(
    currencies: PlayerCurrencies,
    type: CurrencyType
  ): number {
    return currencies[type] ?? 0;
  }

  /**
   * 检查是否有足够货币
   */
  static canAfford(
    currencies: PlayerCurrencies,
    cost: CurrencyCost
  ): boolean {
    const amount = this.getCurrency(currencies, cost.type);
    return amount >= cost.amount;
  }

  /**
   * 扣除货币
   * @returns 扣除后的货币状态，或 null（货币不足）
   */
  static deduct(
    currencies: PlayerCurrencies,
    cost: CurrencyCost
  ): PlayerCurrencies | null {
    if (!this.canAfford(currencies, cost)) {
      return null;
    }

    const currentAmount = this.getCurrency(currencies, cost.type);
    return {
      ...currencies,
      [cost.type]: currentAmount - cost.amount,
    };
  }

  /**
   * 增加货币（有上限限制）
   */
  static add(
    currencies: PlayerCurrencies,
    type: CurrencyType,
    amount: number
  ): PlayerCurrencies {
    const config = CURRENCY_CONFIGS[type];
    if (!config) {
      console.warn(`Unknown currency type: ${type}`);
      return currencies;
    }

    const current = this.getCurrency(currencies, type);
    const newAmount = Math.min(config.maxStack, current + amount);

    return {
      ...currencies,
      [type]: newAmount,
    };
  }

  /**
   * 设置货币数量（用于初始化或重置）
   */
  static set(
    currencies: PlayerCurrencies,
    type: CurrencyType,
    amount: number
  ): PlayerCurrencies {
    const config = CURRENCY_CONFIGS[type];
    if (!config) {
      console.warn(`Unknown currency type: ${type}`);
      return currencies;
    }

    const clampedAmount = Math.max(0, Math.min(config.maxStack, amount));

    return {
      ...currencies,
      [type]: clampedAmount,
    };
  }

  /**
   * 格式化货币显示
   */
  static format(amount: number): string {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}亿`;
    }
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}万`;
    }
    return amount.toString();
  }

  /**
   * 格式化货币花费显示
   */
  static formatCost(cost: CurrencyCost, currencies: PlayerCurrencies): string {
    const amount = this.format(cost.amount);
    const name = this.getName(cost.type);
    return `${amount} ${name}`;
  }

  /**
   * 获取货币信息（图标、名称、颜色等）
   */
  static getCurrencyInfo(type: CurrencyType): {
    icon: string;
    name: string;
    color: string;
    colorClass: string;
  } {
    const config = CURRENCY_CONFIGS[type];
    return {
      icon: this.getIcon(type),
      name: this.getName(type),
      color: config?.color || 'gray',
      colorClass: this.getColorClass(type),
    };
  }

  /**
   * 获取货币图标
   */
  static getIcon(type: CurrencyType): string {
    return CURRENCY_CONFIGS[type]?.icon || '💰';
  }

  /**
   * 获取货币名称
   */
  static getName(type: CurrencyType): string {
    return CURRENCY_CONFIGS[type]?.name || type;
  }

  /**
   * 获取货币颜色类名
   */
  static getColorClass(type: CurrencyType): string {
    const config = CURRENCY_CONFIGS[type];
    if (!config) return 'text-muted-foreground';

    switch (config.color) {
      case 'yellow':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'blue':
        return 'text-blue-600 dark:text-blue-400';
      case 'purple':
        return 'text-purple-600 dark:text-purple-400';
      case 'orange':
        return 'text-orange-600 dark:text-orange-400';
      case 'cyan':
        return 'text-cyan-600 dark:text-cyan-400';
      case 'pink':
        return 'text-pink-600 dark:text-pink-400';
      default:
        return 'text-muted-foreground';
    }
  }

  /**
   * 验证货币数据完整性
   */
  static validate(currencies: PlayerCurrencies | null | undefined): PlayerCurrencies {
    if (!currencies) {
      return createDefaultCurrencies();
    }

    // 确保所有货币类型都有值
    const defaultCurrencies = createDefaultCurrencies();
    const result: PlayerCurrencies = { ...defaultCurrencies };

    for (const type of Object.keys(defaultCurrencies) as CurrencyType[]) {
      const value = currencies[type];
      if (typeof value === 'number' && !isNaN(value) && value >= 0) {
        result[type] = Math.min(value, CURRENCY_CONFIGS[type].maxStack);
      }
    }

    return result;
  }
}

/**
 * 从旧格式迁移货币数据
 */
export function migrateCurrencies(old: {
  spiritStones?: number;
  contribution?: number;
}): PlayerCurrencies {
  return {
    spirit_stone: old.spiritStones ?? 0,
    contribution: old.contribution ?? 0,
    sect_point: 0,
    honor: 0,
    ascension_mark: 0,
    event_token: 0,
  };
}
