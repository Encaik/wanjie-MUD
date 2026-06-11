/**
 * 服务端时间获取
 *
 * 从 /api/v1/status 获取服务端时间戳，防止客户端修改系统时间作弊。
 * 失败时降级为客户端本地时间。
 */

/**
 * 获取服务端当前时间戳
 *
 * @returns Unix 毫秒时间戳。服务端不可用时降级返回 Date.now()
 */
export async function fetchServerTime(): Promise<number> {
  try {
    const res = await fetch('/api/v1/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const serverTime = json?.data?.serverTime;
    if (serverTime) {
      return new Date(serverTime).getTime();
    }
    throw new Error('Missing serverTime in response');
  } catch {
    // 降级：服务端不可用时使用客户端时间
    return Date.now();
  }
}
