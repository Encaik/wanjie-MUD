/**
 * ID 生成工具
 *
 * 生成唯一 ID 字符串。适用于消息、实体等需要唯一标识的场景。
 * 格式：时间戳-随机字符串（如 "1623456789012-a1b2c3d4e"）
 *
 * @module shared/utils
 */

/**
 * 生成唯一 ID
 *
 * 使用 Date.now() 作为前缀，Math.random() 生成随机后缀。
 * 适用于非安全场景（非密码学用途）。
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
