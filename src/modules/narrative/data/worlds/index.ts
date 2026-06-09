/**
 * 世界观文案统一导出
 * 
 * 类似 i18n 的结构：
 * - 每个世界观一个独立文件
 * - 添加新世界观只需复制文件并修改内容
 * - 统一导出便于管理
 */


// 导入所有世界观文案
import { gaowuTexts } from './gaowu';
import { kejiTexts } from './keji';
import { mohuanTexts } from './mohuan';
import { moshiTexts } from './moshi';
import { WorldTextDefinition, WorldTextsMap, WorldTerminology, WorldStatNames, PathTextDefinition, PathTypeId } from './types';
import { wuxiaTexts } from './wuxia';
import { xianxiaTexts } from './xianxia';
import { xiuxianTexts } from './xiuxian';
import { yinengTexts } from './yineng';
import { WorldType } from '@/shared/lib/types';

// ============================================
// 世界观文案映射表
// ============================================

/**
 * 所有世界观文案
 * 
 * 添加新世界观：
 * 1. 复制 worlds/xiuxian.ts 为新文件
 * 2. 修改文件中的文案内容
 * 3. 在上方 import 新文件
 * 4. 在下方映射表中添加新条目
 */
export const worldTexts: WorldTextsMap = {
  '修仙': xiuxianTexts,
  '高武': gaowuTexts,
  '科技': kejiTexts,
  '魔幻': mohuanTexts,
  '异能': yinengTexts,
  '仙侠': xianxiaTexts,
  '武侠': wuxiaTexts,
  '末世': moshiTexts,
};

// ============================================
// 辅助函数
// ============================================

/**
 * 获取指定世界观的文案定义
 */
export function getWorldTexts(worldType: WorldType): WorldTextDefinition {
  const texts = worldTexts[worldType];
  if (!texts) {
    // 默认返回修仙世界观
    console.warn(`未找到世界观 "${worldType}" 的文案，使用默认"修仙"`);
    return xiuxianTexts;
  }
  return texts;
}

/**
 * 获取指定世界观的术语
 */
export function getWorldTerminology(worldType: WorldType): WorldTerminology {
  return getWorldTexts(worldType).terminology;
}

/**
 * 获取指定世界观的属性名
 */
export function getWorldStatNames(worldType: WorldType): WorldStatNames {
  return getWorldTexts(worldType).stats;
}

/**
 * 获取所有支持的世界观列表
 */
export function getSupportedWorlds(): WorldType[] {
  return Object.keys(worldTexts) as WorldType[];
}

/**
 * 检查世界观是否支持
 */
export function isWorldSupported(worldType: string): worldType is WorldType {
  return worldType in worldTexts;
}

// ============================================
// 流派相关辅助函数
// ============================================

/**
 * 获取指定世界观的所有流派文案
 */
export function getWorldPaths(worldType: WorldType): WorldTextDefinition['paths'] {
  return getWorldTexts(worldType).paths;
}

/**
 * 获取指定世界观的特定流派文案
 */
export function getPathText(worldType: WorldType, pathId: PathTypeId): PathTextDefinition {
  const paths = getWorldPaths(worldType);
  return paths[pathId];
}

/**
 * 获取流派的显示名称
 */
export function getPathName(worldType: WorldType, pathId: PathTypeId): string {
  return getPathText(worldType, pathId).name;
}

/**
 * 获取流派的描述
 */
export function getPathDescription(worldType: WorldType, pathId: PathTypeId): string {
  return getPathText(worldType, pathId).description;
}

// ============================================
// 导出类型和各世界观数据
// ============================================

export * from './types';
export {
  xiuxianTexts,
  gaowuTexts,
  kejiTexts,
  mohuanTexts,
  yinengTexts,
  xianxiaTexts,
  wuxiaTexts,
  moshiTexts,
};
