/**
 * 游戏版本系统
 *
 * 提供统一的游戏版本号常量、semver 解析和世界模板兼容性检查。
 * 版本号与 package.json 保持同步（通过 scripts/sync-version.ts 构建时同步）。
 *
 * @module shared/config
 */

// ============================================
// 版本常量
// ============================================

/** 当前游戏版本号（semver 格式，与 package.json 同步） */
export const GAME_VERSION = '0.1.0';

// ============================================
// Semver 解析
// ============================================

/** semver 解析结果 */
export interface SemverParts {
  major: number;
  minor: number;
  patch: number;
}

/**
 * 解析 semver 版本字符串
 *
 * @param version - semver 格式版本号（如 "1.2.3"）
 * @returns 解析后的主版本号、次版本号、补丁版本号
 * @throws 如果版本号格式无效
 */
export function parseSemver(version: string): SemverParts {
  const parts = version.split('.');
  if (parts.length < 3) {
    throw new Error(`无效的 semver 格式: "${version}"，期望格式 "major.minor.patch"`);
  }
  const major = Number(parts[0]);
  const minor = Number(parts[1]);
  const patch = Number(parts[2]);
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    throw new Error(`无效的 semver 格式: "${version}"，版本号各部分必须为数字`);
  }
  return { major, minor, patch };
}

// ============================================
// 版本兼容性检查
// ============================================

/** 版本兼容性结果 */
export type VersionCompatibility = 'compatible' | 'needs-update' | 'incompatible';

/**
 * 检查世界模板版本是否与当前游戏版本兼容
 *
 * 兼容性规则：
 * - 主版本号不同 → `'incompatible'`（数据结构可能有 breaking changes）
 * - 主版本号相同，次版本号不同 → `'needs-update'`（兼容但可能缺少新特性）
 * - 主版本号和次版本号相同 → `'compatible'`（完全兼容）
 *
 * @param templateVersion - 模板创建时的游戏版本（semver 格式）
 * @returns 兼容性结果
 */
export function checkWorldTemplateCompatibility(
  templateVersion: string,
): VersionCompatibility {
  try {
    const template = parseSemver(templateVersion);
    const current = parseSemver(GAME_VERSION);

    if (template.major !== current.major) {
      return 'incompatible';
    }
    if (template.minor !== current.minor) {
      return 'needs-update';
    }
    return 'compatible';
  } catch {
    // 版本号解析失败时，保守处理为不兼容
    return 'incompatible';
  }
}
