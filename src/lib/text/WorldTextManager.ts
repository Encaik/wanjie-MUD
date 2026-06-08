/**
 * 世界观文案管理器
 * 
 * 职责：
 * 1. 缓存已加载的世界观文案，避免频繁读取文件
 * 2. 提供统一的文案获取接口
 * 3. 支持世界切换时重新加载
 * 
 * 使用方式：
 * - 通过 WorldTextContext 获取当前世界文案
 * - 页面组件使用 useWorldText() hook 获取文案
 */

import { WorldType } from '../game/types';

// 导入所有世界观文案
import { gaowuTexts } from './worlds/gaowu';
import { kejiTexts } from './worlds/keji';
import { mohuanTexts } from './worlds/mohuan';
import { moshiTexts } from './worlds/moshi';
import { WorldTextDefinition } from './worlds/types';
import { wuxiaTexts } from './worlds/wuxia';
import { xianxiaTexts } from './worlds/xianxia';
import { xiuxianTexts } from './worlds/xiuxian';
import { yinengTexts } from './worlds/yineng';

/**
 * 世界观文案映射表
 * 静态导入，构建时确定，无需运行时读取文件
 */
const WORLD_TEXT_MAP: Record<WorldType, WorldTextDefinition> = {
  '修仙': xiuxianTexts,
  '高武': gaowuTexts,
  '科技': kejiTexts,
  '魔幻': mohuanTexts,
  '异能': yinengTexts,
  '仙侠': xianxiaTexts,
  '武侠': wuxiaTexts,
  '末世': moshiTexts,
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
   * @param worldType 世界观类型
   */
  setWorld(worldType: WorldType): void {
    if (this.currentWorldType === worldType && this.currentText) {
      return; // 已加载，无需重复
    }
    this.currentWorldType = worldType;
    this.currentText = WORLD_TEXT_MAP[worldType];
  }

  /**
   * 获取当前世界观文案
   */
  getText(): WorldTextDefinition {
    if (!this.currentText) {
      // 默认返回修仙世界文案
      return WORLD_TEXT_MAP['修仙'];
    }
    return this.currentText;
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
