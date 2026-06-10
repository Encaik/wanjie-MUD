/**
 * validateWorldTemplate — 校验固化世界模板 JSON 结构
 *
 * 验证 WorldTemplate JSON 文件的必要字段完整性，确保 world 字段
 * 中的 name/description/factions/dangers/opportunities 为确定值（非池），
 * 以及 gameVersion 必填。
 *
 * @module shared/lib/world
 */

import type { WorldTemplate } from './types';

/** 校验结果 */
export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 校验固化世界模板
 *
 * @param data - 待校验的原始 JSON 对象
 * @returns 校验结果（valid + errors 列表）
 */
export function validateWorldTemplate(data: unknown): TemplateValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['模板数据必须是一个 JSON 对象'] };
  }

  const t = data as Record<string, unknown>;

  // id
  if (typeof t.id !== 'string' || t.id.length === 0) {
    errors.push('缺少 id 字段（模板唯一标识）');
  }

  // gameVersion
  if (typeof t.gameVersion !== 'string' || t.gameVersion.length === 0) {
    errors.push('缺少 gameVersion 字段（必填，semver 格式）');
  }

  // world
  const world = t.world as Record<string, unknown> | undefined;
  if (!world || typeof world !== 'object') {
    errors.push('缺少 world 字段（完整世界数据对象）');
    return { valid: false, errors };
  }

  // world.name
  if (typeof world.name !== 'string' || world.name.length === 0) {
    errors.push('world.name 缺失（世界名称，必须为确定值）');
  }

  // world.type
  if (typeof world.type !== 'string' || world.type.length === 0) {
    errors.push('world.type 缺失（世界类型标识）');
  }

  // world.description
  if (typeof world.description !== 'string' || world.description.length === 0) {
    errors.push('world.description 缺失（世界描述，必须为确定值）');
  }

  // world.realmSystem
  if (!world.realmSystem || typeof world.realmSystem !== 'object') {
    errors.push('world.realmSystem 缺失（境界体系，必须为确定值）');
  }

  // world.powerSystem
  if (typeof world.powerSystem !== 'string' || world.powerSystem.length === 0) {
    errors.push('world.powerSystem 缺失（力量体系描述，必须为确定值）');
  }

  // world.majorForces
  if (typeof world.majorForces !== 'string' || world.majorForces.length === 0) {
    errors.push('world.majorForces 缺失（主要势力描述，必须为确定值）');
  }

  // world.factions
  if (!Array.isArray(world.factions) || world.factions.length === 0) {
    errors.push('world.factions 缺失或为空（势力列表，必须为确定值）');
  }

  // world.dangers
  if (!Array.isArray(world.dangers)) {
    errors.push('world.dangers 必须为数组（危险列表，可以为空数组）');
  }

  // world.opportunities
  if (!Array.isArray(world.opportunities)) {
    errors.push('world.opportunities 必须为数组（机缘列表，可以为空数组）');
  }

  // world.baseCoefficient
  if (typeof world.baseCoefficient !== 'number') {
    errors.push('world.baseCoefficient 缺失（难度系数，必须为确定值）');
  }

  // world.actualCoefficient
  if (typeof world.actualCoefficient !== 'number') {
    errors.push('world.actualCoefficient 缺失（实际难度系数）');
  }

  // world.difficulty
  if (typeof world.difficulty !== 'string' || world.difficulty.length === 0) {
    errors.push('world.difficulty 缺失（难度等级）');
  }

  return { valid: errors.length === 0, errors };
}
