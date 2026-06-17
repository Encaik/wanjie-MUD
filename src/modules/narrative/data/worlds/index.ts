/**
 * 世界观文案统一导出
 *
 * @deprecated 世界观文本数据已迁移到 mods/wanjie-core/data/world/*.json 的 text 字段。
 * 新代码应通过 WorldViewRegistry.getWorldviewTexts(id) 或 WorldTextManager 获取文本。
 * 本文件及其引用的 *.ts 静态文件保留用于：
 * 1. 向后兼容（WorldTextManager 的 fallback）
 * 2. 作为 Mod JSON 的参考源
 * 3. 客户端在 registry 未初始化时的兜底
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
import { WorldTextDefinition, WorldTextsMap, WorldTerminology, WorldStatNames } from './types';
import { wuxiaTexts } from './wuxia';
import { xianxiaTexts } from './xianxia';
import { xiuxianTexts } from './xiuxian';
import { yinengTexts } from './yineng';
import { WorldType } from '@/core/types';

// ============================================
// 世界观文案映射表
// ============================================

/**
 * 所有世界观文案
 */
const worldTexts: WorldTextsMap = {
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
