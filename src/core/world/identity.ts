/**
 * 世界身份系统 — ID 生成与解析
 *
 * 世界 ID 格式：
 *   随机生成世界: {providerId}:{worldType}:{seed}
 *   固化模板世界: {providerId}:tpl:{templateId}
 *
 * @module shared/lib/world/identity
 */

/** 解析后的世界 ID 组成部分 */
export interface WorldIdParts {
  /** 提供者 ID（如 "wanjie-core"） */
  providerId: string;
  /** 世界类型（如 "修仙"），模板世界为 "tpl" */
  worldType: string;
  /** 种子字符串，模板世界为 undefined */
  seed?: string;
  /** 模板 ID，仅模板世界有此值 */
  templateId?: string;
}

/**
 * 构造随机生成世界的 ID
 *
 * @param providerId - 提供者 ID
 * @param worldType - 世界类型
 * @param seed - 种子字符串
 * @returns 格式化的世界 ID
 */
function createRandomWorldId(providerId: string, worldType: string, seed: string): string {
  return `${providerId}:${worldType}:${seed}`;
}

/**
 * 构造固化模板世界的 ID
 *
 * @param providerId - 提供者 ID
 * @param templateId - 模板 ID
 * @returns 格式化的世界 ID
 */
function createTemplateWorldId(providerId: string, templateId: string): string {
  return `${providerId}:tpl:${templateId}`;
}

/**
 * 构造世界唯一 ID
 *
 * 根据是否有 seed 参数自动判断 ID 格式。有 seed 时为随机世界，无 seed 时为模板世界。
 *
 * @param providerId - 提供者 ID
 * @param worldType - 世界类型（随机世界）或模板标识（模板世界）
 * @param seedOrTemplateId - 种子字符串（随机世界）或模板 ID（模板世界）
 * @returns 格式化的世界 ID
 *
 * @example
 * createWorldId('wanjie-core', '修仙', 'a0b1c2d3')  // "wanjie-core:修仙:a0b1c2d3"
 * createWorldId('wanjie-template', 'tpl', 'huanjing') // "wanjie-template:tpl:huanjing"
 */
export function createWorldId(
  providerId: string,
  worldType: string,
  seedOrTemplateId?: string,
): string {
  if (worldType === 'tpl') {
    return createTemplateWorldId(providerId, seedOrTemplateId ?? 'unknown');
  }
  return createRandomWorldId(providerId, worldType, seedOrTemplateId ?? 'unknown');
}

/**
 * 解析世界 ID 为组成部分
 *
 * @param worldId - 世界 ID 字符串
 * @returns 解析后的 ID 部分
 *
 * @example
 * parseWorldId("wanjie-core:修仙:a0b1c2d3")  // { providerId: "wanjie-core", worldType: "修仙", seed: "a0b1c2d3" }
 * parseWorldId("wanjie-template:tpl:huanjing") // { providerId: "wanjie-template", worldType: "tpl", templateId: "huanjing" }
 */
export function parseWorldId(worldId: string): WorldIdParts {
  const parts = worldId.split(':');
  if (parts.length < 3) {
    throw new Error(`无效的世界 ID 格式: "${worldId}"`);
  }
  const [providerId, worldType, third] = parts;
  if (worldType === 'tpl') {
    return { providerId, worldType, templateId: third };
  }
  return { providerId, worldType, seed: third };
}

/**
 * 判断世界 ID 是否为模板世界
 *
 * @param worldId - 世界 ID 字符串
 * @returns 如果 ID 对应模板世界则返回 true
 */
export function isTemplateWorldId(worldId: string): boolean {
  try {
    const parts = parseWorldId(worldId);
    return parts.worldType === 'tpl';
  } catch {
    return false;
  }
}

/**
 * 从世界 ID 中提取种子字符串
 *
 * 模板世界返回 undefined。
 *
 * @param worldId - 世界 ID 字符串
 * @returns 种子字符串，模板世界为 undefined
 */
export function extractSeed(worldId: string): string | undefined {
  const parts = parseWorldId(worldId);
  return parts.seed;
}
