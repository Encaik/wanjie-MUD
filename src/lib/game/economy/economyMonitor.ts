/**
 * 经济监控服务
 * 
 * 监控游戏经济健康度
 * 提供通胀/通缩检测和预警
 */

import { CurrencyType } from '../shop/types';
import {
  EconomyStatistics,
  EconomyHealthReport,
  EconomyHealthStatus,
  DailyEconomyData,
} from './types';

/**
 * 经济监控服务
 */
export class EconomyMonitor {
  private stats: EconomyStatistics;

  constructor(initialStats?: Partial<EconomyStatistics>) {
    this.stats = {
      totalSpiritStoneProduced: 0,
      totalSpiritStoneConsumed: 0,
      sinkUsage: {},
      productionBySource: {},
      periodStart: Date.now(),
      lastUpdated: Date.now(),
      dailyHistory: [],
      ...initialStats,
    };
  }

  /**
   * 记录货币产出
   */
  recordProduction(
    currencyType: CurrencyType,
    amount: number,
    source: string
  ): void {
    if (currencyType === 'spirit_stone') {
      this.stats.totalSpiritStoneProduced += amount;
      this.stats.productionBySource[source] = 
        (this.stats.productionBySource[source] || 0) + amount;
    }
    this.stats.lastUpdated = Date.now();
  }

  /**
   * 记录货币消耗
   */
  recordConsumption(sinkId: string, amount: number): void {
    this.stats.totalSpiritStoneConsumed += amount;
    this.stats.sinkUsage[sinkId] = (this.stats.sinkUsage[sinkId] || 0) + 1;
    this.stats.lastUpdated = Date.now();
  }

  /**
   * 获取经济健康度报告
   */
  getEconomyHealth(): EconomyHealthReport {
    const ratio = this.stats.totalSpiritStoneProduced / 
                  Math.max(1, this.stats.totalSpiritStoneConsumed);

    let status: EconomyHealthStatus;
    let recommendation: string;

    if (ratio > 5) {
      status = 'inflation';
      recommendation = '灵石通胀严重，建议增加消耗途径或减少产出';
    } else if (ratio < 0.5) {
      status = 'deflation';
      recommendation = '灵石通缩，建议减少消耗或增加产出';
    } else {
      status = 'healthy';
      recommendation = '经济系统健康';
    }

    // 获取使用最多的消耗途径
    const topSinks = Object.entries(this.stats.sinkUsage)
      .map(([id, count]) => ({
        id,
        name: this.getSinkName(id),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 判断趋势
    const trend = this.analyzeTrend();

    return {
      status,
      ratio: Math.round(ratio * 100) / 100,
      recommendation,
      details: {
        produced: this.stats.totalSpiritStoneProduced,
        consumed: this.stats.totalSpiritStoneConsumed,
        topSinks,
        trend,
      },
    };
  }

  /**
   * 获取消耗途径名称
   */
  private getSinkName(sinkId: string): string {
    const names: Record<string, string> = {
      equipment_reforge: '装备重铸',
      technique_breakthrough: '功法突破',
      realm_breakthrough_assist: '境界突破辅助',
      stat_reset: '属性重置',
    };
    return names[sinkId] || sinkId;
  }

  /**
   * 分析趋势
   */
  private analyzeTrend(): 'improving' | 'stable' | 'worsening' {
    const history = this.stats.dailyHistory;
    if (history.length < 3) return 'stable';

    const recent = history.slice(-3);
    const ratios = recent.map(d => d.ratio);
    
    const avgRecent = (ratios[1] + ratios[2]) / 2;
    const avgOlder = ratios[0];

    if (avgRecent < avgOlder * 0.9 && avgRecent > 0.5 && avgRecent < 3) {
      return 'improving';
    } else if (avgRecent > avgOlder * 1.1) {
      return 'worsening';
    }
    return 'stable';
  }

  /**
   * 获取统计数据
   */
  getStatistics(): EconomyStatistics {
    return { ...this.stats };
  }

  /**
   * 记录每日数据
   */
  recordDailyData(): void {
    const today = new Date().toISOString().split('T')[0];
    const ratio = this.stats.totalSpiritStoneProduced / 
                  Math.max(1, this.stats.totalSpiritStoneConsumed);

    this.stats.dailyHistory.push({
      date: today,
      produced: this.stats.totalSpiritStoneProduced,
      consumed: this.stats.totalSpiritStoneConsumed,
      ratio,
    });

    // 只保留最近30天的数据
    if (this.stats.dailyHistory.length > 30) {
      this.stats.dailyHistory = this.stats.dailyHistory.slice(-30);
    }
  }

  /**
   * 重置统计（新周期开始）
   */
  resetPeriod(): void {
    // 保存旧数据
    this.recordDailyData();

    // 重置计数器
    this.stats.totalSpiritStoneProduced = 0;
    this.stats.totalSpiritStoneConsumed = 0;
    this.stats.periodStart = Date.now();
    this.stats.lastUpdated = Date.now();
  }

  /**
   * 获取产出来源分布
   */
  getProductionDistribution(): Array<{ source: string; amount: number; percentage: number }> {
    const total = this.stats.totalSpiritStoneProduced;
    if (total === 0) return [];

    return Object.entries(this.stats.productionBySource)
      .map(([source, amount]) => ({
        source,
        amount,
        percentage: Math.round((amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * 获取消耗途径分布
   */
  getConsumptionDistribution(): Array<{ sinkId: string; name: string; count: number; percentage: number }> {
    const total = Object.values(this.stats.sinkUsage).reduce((sum, c) => sum + c, 0);
    if (total === 0) return [];

    return Object.entries(this.stats.sinkUsage)
      .map(([sinkId, count]) => ({
        sinkId,
        name: this.getSinkName(sinkId),
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 导出数据（用于存档）
   */
  export(): EconomyStatistics {
    return JSON.parse(JSON.stringify(this.stats));
  }

  /**
   * 导入数据（从存档恢复）
   */
  import(data: EconomyStatistics): void {
    this.stats = { ...data };
  }
}

/**
 * 全局经济监控实例
 */
let globalMonitor: EconomyMonitor | null = null;

/**
 * 获取全局经济监控实例
 */
export function getGlobalEconomyMonitor(): EconomyMonitor {
  if (!globalMonitor) {
    globalMonitor = new EconomyMonitor();
  }
  return globalMonitor;
}

/**
 * 重置全局经济监控实例
 */
export function resetGlobalEconomyMonitor(): void {
  globalMonitor = null;
}

/**
 * 经济报告格式化工具
 */
export class EconomyReportFormatter {
  /**
   * 格式化健康报告
   */
  static formatHealthReport(report: EconomyHealthReport): string {
    const statusEmoji = {
      healthy: '✅',
      inflation: '⚠️',
      deflation: '📉',
    };

    const lines = [
      `${statusEmoji[report.status]} 经济状态：${
        report.status === 'healthy' ? '健康' :
        report.status === 'inflation' ? '通胀' : '通缩'
      }`,
      `📊 产出/消耗比：${report.ratio.toFixed(2)}`,
      `💰 总产出：${this.formatNumber(report.details.produced)} 灵石`,
      `💸 总消耗：${this.formatNumber(report.details.consumed)} 灵石`,
      `📈 趋势：${
        report.details.trend === 'improving' ? '改善中' :
        report.details.trend === 'worsening' ? '恶化中' : '稳定'
      }`,
      `💡 建议：${report.recommendation}`,
    ];

    if (report.details.topSinks.length > 0) {
      lines.push('\n🔥 热门消耗途径：');
      report.details.topSinks.forEach((sink, index) => {
        lines.push(`  ${index + 1}. ${sink.name}: ${sink.count}次`);
      });
    }

    return lines.join('\n');
  }

  /**
   * 格式化数字
   */
  private static formatNumber(num: number): string {
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1)}亿`;
    }
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toLocaleString();
  }
}
