/**
 * 世界观文案管理器
 *
 * 职责：
 * 1. 缓存已加载的世界观文案，避免频繁读取文件
 * 2. 提供统一的文案获取接口
 * 3. 支持世界切换时重新加载
 * 4. 优先从 WorldViewRegistry 读取，回退到静态导入
 *
 * 使用方式：
 * - 通过 WorldTextContext 获取当前世界文案
 * - 页面组件使用 useWorldText() hook 获取文案
 */

import { WorldType } from '@/core/types';
import { WorldViewRegistry } from '@/core/registry';
import type { WorldTextDefinition } from '@/core/registry';

// 保留静态导入作为 fallback（过渡期）
import { gaowuTexts } from '../data/worlds/gaowu';
import { kejiTexts } from '../data/worlds/keji';
import { mohuanTexts } from '../data/worlds/mohuan';
import { moshiTexts } from '../data/worlds/moshi';
import { wuxiaTexts } from '../data/worlds/wuxia';
import { xianxiaTexts } from '../data/worlds/xianxia';
import { xiuxianTexts } from '../data/worlds/xiuxian';
import { yinengTexts } from '../data/worlds/yineng';

/**
 * @deprecated 过渡期静态映射表，新代码应从 WorldViewRegistry 获取
 * 中文 WorldType → 英文 worldviewId 映射
 */
const CHINESE_TO_ENGLISH: Record<string, string> = {
  '修仙': 'cultivation',
  '高武': 'martial',
  '科技': 'tech',
  '魔幻': 'magic',
  '异能': 'psi',
  '仙侠': 'xianxia',
  '武侠': 'wuxia',
  '末世': 'apocalypse',
};

/**
 * 世界观文案静态映射表（fallback）
 * @deprecated 过渡期使用，数据迁移完成后移除
 */
const WORLD_TEXT_MAP: Record<WorldType, WorldTextDefinition> = {
  '修仙': xiuxianTexts as unknown as WorldTextDefinition,
  '高武': gaowuTexts as unknown as WorldTextDefinition,
  '科技': kejiTexts as unknown as WorldTextDefinition,
  '魔幻': mohuanTexts as unknown as WorldTextDefinition,
  '异能': yinengTexts as unknown as WorldTextDefinition,
  '仙侠': xianxiaTexts as unknown as WorldTextDefinition,
  '武侠': wuxiaTexts as unknown as WorldTextDefinition,
  '末世': moshiTexts as unknown as WorldTextDefinition,
};

/**
 * 世界观文案管理器
 * 单例模式，全局缓存
 */
class WorldTextManager {
  private static instance: WorldTextManager;
  private currentWorldType: WorldType | null = null;
  private currentText: WorldTextDefinition | null = null;

  private constructor() {}

  static getInstance(): WorldTextManager {
    if (!WorldTextManager.instance) {
      WorldTextManager.instance = new WorldTextManager();
    }
    return WorldTextManager.instance;
  }

  /**
   * 切换世界观
   * 优先从 WorldViewRegistry 读取，回退到静态映射表
   *
   * @param worldType 世界观类型（中文显示名或英文 worldviewId）
   */
  setWorld(worldType: WorldType): void {
    if (this.currentWorldType === worldType && this.currentText) {
      return; // 已加载，无需重复
    }
    this.currentWorldType = worldType;

    // 优先从 registry 读取（通过英文 ID 或中文名映射）
    const registry = WorldViewRegistry.getInstance();
    const englishId = CHINESE_TO_ENGLISH[worldType] ?? worldType;

    // 尝试从 worldview 获取文本
    const worldview = registry.get(englishId);
    if (worldview?.texts) {
      this.currentText = worldview.texts;
      return;
    }

    // 尝试从旧 worldTexts 存储获取
    const storedText = registry.get(englishId)?.texts;
    if (storedText && typeof storedText === 'object' && 'terminology' in storedText) {
      this.currentText = storedText as unknown as WorldTextDefinition;
      return;
    }

    // 回退到静态映射表
    this.currentText = WORLD_TEXT_MAP[worldType] ?? null;
  }

  /**
   * 获取当前世界观文案
   * 如果没有设置世界观，尝试从 registry 获取第一个可用的，最后回退到修仙
   */
  getText(): WorldTextDefinition {
    if (this.currentText) {
      return this.currentText;
    }
    // 尝试从 registry 获取
    const registry = WorldViewRegistry.getInstance();
    const allIds = registry.getAllIds();
    if (allIds.length > 0) {
      const first = registry.get(allIds[0]);
      if (first?.texts) return first.texts;
    }
    // 最终回退到静态修仙文本
    return WORLD_TEXT_MAP['修仙']!;
  }

  /**
   * 获取当前世界观类型
   */
  getWorldType(): WorldType | null {
    return this.currentWorldType;
  }

  /**
   * 通过路径获取文案
   * 支持点分隔路径，如 'terminology.resource'、'stats.body'
   */
  get(path: string): string {
    const text = this.getText();
    const keys = path.split('.');
    let result: any = text;
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        console.warn(`[WorldTextManager] Path not found: ${path}`);
        return path; // 返回路径作为 fallback
      }
    }
    
    if (typeof result === 'string') {
      return result;
    }
    
    console.warn(`[WorldTextManager] Path does not resolve to string: ${path}`);
    return path;
  }

  /**
   * 获取流派文案
   * @param pathId 流派类型ID (body/sword/spell/alchemy/demon)
   */
  getPathText(pathId: string): WorldTextDefinition['paths'][keyof WorldTextDefinition['paths']] {
    const text = this.getText();
    if (pathId in text.paths) {
      return text.paths[pathId as keyof WorldTextDefinition['paths']];
    }
    // 默认返回 body
    return text.paths.body;
  }

  /**
   * 获取属性名称
   * @param statKey 属性键名 (body/talent/wisdom/luck/will)
   */
  getStatName(statKey: string): string {
    const text = this.getText();
    if (statKey in text.stats) {
      return text.stats[statKey as keyof typeof text.stats];
    }
    return statKey;
  }

  /**
   * 获取术语
   * @param termKey 术语键名
   */
  getTerm(termKey: keyof WorldTextDefinition['terminology']): string {
    const text = this.getText();
    return text.terminology[termKey];
  }
}

// 导出单例
export const worldTextManager = WorldTextManager.getInstance();

/**
 * 获取指定世界观的文案（纯函数，不依赖 React）
 * 用于服务端渲染或非组件场景
 */
export function getWorldText(worldType: WorldType): WorldTextDefinition {
  return WORLD_TEXT_MAP[worldType];
}

// 导出类型和工具函数
export { WORLD_TEXT_MAP };
export type { WorldTextDefinition };
