/**
 * 确定性随机数生成器（RNG）
 *
 * 使用 Mulberry32 算法，接受数字种子，返回可复现的随机序列。
 * 替代 Math.random() 用于 lib/game/ 中的纯函数，确保相同输入 → 相同输出。
 *
 * 使用示例：
 * ```ts
 * const rng = createRng(42);
 * const roll = rng(); // 0.0 ~ 1.0 的伪随机数
 * const dice = Math.floor(rng() * 6) + 1; // 1~6
 * ```
 *
 * @param seed - 数字种子（整数）
 * @returns 返回一个无参函数，每次调用返回 [0, 1) 区间的伪随机数
 */
export function createRng(seed: number): () => number {
  // Mulberry32 — 简单快速的 32 位 PRNG
  let state = seed | 0;

  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 从一个种子生成多个独立的 RNG 实例
 *
 * 用于需要多个独立随机流的场景（如战斗系统需要分别控制伤害、暴击、闪避的随机数）
 *
 * @param baseSeed - 基础种子
 * @param count - 需要的 RNG 实例数量
 * @returns RNG 函数数组
 */
export function createRngs(baseSeed: number, count: number): Array<() => number> {
  const rngs: Array<() => number> = [];
  let seed = baseSeed;
  for (let i = 0; i < count; i++) {
    rngs.push(createRng(seed));
    seed = (seed * 1103515245 + 12345) | 0; // 简单的 LCG 递进种子
  }
  return rngs;
}

/**
 * 使用 RNG 在 [min, max] 范围内生成随机整数（含两端）
 */
export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * 使用 RNG 从数组中随机选取一个元素
 */
export function randomItem<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * 使用 RNG 按权重随机选取索引
 *
 * @param rng - 随机数生成器
 * @param weights - 权重数组（无需归一化）
 * @returns 被选中的索引
 */
export function randomWeighted(rng: () => number, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
