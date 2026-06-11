/**
 * 世界身份系统 — ID 生成与解析
 *
 * 世界 ID 格式：{providerId}:{worldviewId}:{seed}
 *
 * @module core/world/identity
 */

/** 解析后的世界 ID 组成部分 */
export interface WorldIdParts {
  /** 提供者 ID（如 "wanjie-core"） */
  providerId: string;
  /** 世界观 ID（如 "cultivation"） */
  worldviewId: string;
  /** 种子字符串 */
  seed: string;
}

/**
 * 构造世界唯一 ID
 *
 * @param providerId - 提供者 ID
 * @param worldviewId - 世界观 ID
 * @param seed - 种子字符串
 * @returns 格式化的世界 ID
 *
 * @example
 * createWorldId('wanjie-core', 'cultivation', 'a0b1c2d3')  // "wanjie-core:cultivation:a0b1c2d3"
 */
export function createWorldId(
  providerId: string,
  worldviewId: string,
  seed: string,
): string {
  return `${providerId}:${worldviewId}:${seed}`;
}

/**
 * 解析世界 ID 为组成部分
 *
 * @param worldId - 世界 ID 字符串
 * @returns 解析后的 ID 部分
 *
 * @example
 * parseWorldId("wanjie-core:cultivation:a0b1c2d3")
 * // { providerId: "wanjie-core", worldviewId: "cultivation", seed: "a0b1c2d3" }
 */
export function parseWorldId(worldId: string): WorldIdParts {
  const parts = worldId.split(':');
  if (parts.length < 3) {
    throw new Error(`无效的世界 ID 格式: "${worldId}"`);
  }
  const [providerId, worldviewId, seed] = parts;
  return { providerId, worldviewId, seed };
}

/**
 * 从世界 ID 中提取种子字符串
 *
 * @param worldId - 世界 ID 字符串
 * @returns 种子字符串
 */
export function extractSeed(worldId: string): string {
  const parts = parseWorldId(worldId);
  return parts.seed;
}
