/**
 * 时间格式化工具 — 纯函数命名空间
 *
 * 提供毫秒数到可读字符串的转换，统一项目中所有时间显示格式。
 */

// ============================================
// 时长格式化
// ============================================

/**
 * 格式化时长（历史/离线时长）
 *
 * @param ms - 毫秒数
 * @returns 如 "1天3小时"、"25分钟"、"30秒"
 */
export function duration(ms: number): string {
  if (ms <= 0) return '刚刚';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  }

  if (minutes > 0) {
    return `${minutes}分钟`;
  }

  return `${seconds}秒`;
}

/**
 * 格式化冷却剩余时间
 *
 * @param ms - 剩余毫秒数
 * @returns 如 "2小时30分钟"、"45秒"、"已就绪"
 */
export function remaining(ms: number): string {
  if (ms <= 0) return '已就绪';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
  }

  return `${seconds}秒`;
}

/**
 * 格式化时间戳为日期字符串
 *
 * @param ts - Unix 毫秒时间戳
 * @returns 如 "2025-06-11 14:30:00"
 */
export function timestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
