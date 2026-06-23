/**
 * 客户端 Mod 加载器
 *
 * 通过 fetch 从 public/mods/ 加载主题/样式 Mod。
 * 不阻塞页面渲染，加载状态通过回调通知 UI。
 *
 * 职责：
 * - fetch mod-list.json 获取 Mod 索引
 * - 按清单加载样式/主题数据
 * - 注入 CSS 样式
 * - 加载失败不影响页面运行
 *
 * @module core/mod/loader
 */

import { createLogger } from '@/core/logger';

import { BaseModLoader } from './base-loader';
import { parseManifest } from '../ModManifest';

import type { ModManifest } from '../ModManifest';
import type { ModEntry } from '../types';

const log = createLogger('ClientModLoader');

/** mod-list.json 中的条目 */
interface ModListEntry {
  id: string;
  path: string;
}

/** mod-list.json 的结构 */
interface ModList {
  mods: ModListEntry[];
}

/**
 * 客户端 Mod 加载器
 *
 * 浏览器端使用。通过 fetch 加载 public/mods/ 下的样式/主题 Mod。
 * 数据包 Mod（worldview 等）已在服务端启动时加载完毕，客户端不再重复处理。
 */
export class ClientModLoader extends BaseModLoader {
  constructor(basePath = '/mods') {
    super(basePath);
  }

  /**
   * 从 public/mods/mod-list.json 发现 Mod
   */
  async discover(): Promise<ModEntry[]> {
    try {
      const url = `${this.basePath}/mod-list.json`;
      const response = await fetch(url);
      if (!response.ok) {
        log.warn(`无法获取 Mod 列表: ${response.status} ${response.statusText}`);
        return [];
      }
      const data: ModList = await response.json();
      if (!data.mods || !Array.isArray(data.mods)) {
        log.warn('mod-list.json 格式错误：缺少 mods 数组');
        return [];
      }
      return data.mods;
    } catch (err) {
      log.info('未发现 mod-list.json，无外挂 Mod');
      return [];
    }
  }

  /**
   * 加载单个 Mod 的清单文件（通过 fetch）
   */
  async loadModManifest(modPath: string): Promise<ModManifest> {
    const url = `${this.basePath}/${modPath}/mod.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`无法获取 mod.json: HTTP ${response.status}`);
    }
    const json = await response.text();
    const { manifest, errors } = parseManifest(json);
    if (!manifest) {
      throw new Error(`mod.json 校验失败: ${errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
    }
    return manifest;
  }

  /**
   * 加载 Mod 数据文件并注册（客户端侧仅处理 styles/theme）
   */
  async loadModDataAndRegister(modId: string, manifest: ModManifest): Promise<void> {
    const baseUrl = `${this.basePath}/${modId}`;

    for (const contentType of manifest.contentTypes) {
      const dataPathValue = manifest.dataFiles[contentType];
      if (!dataPathValue) continue;

      // 仅处理客户端内容类型
      if (contentType !== 'styles' && contentType !== 'theme') continue;

      const dataPaths = Array.isArray(dataPathValue) ? dataPathValue : [dataPathValue];

      for (const dataPath of dataPaths) {
        try {
          const url = `${baseUrl}/${dataPath}`;

          if (contentType === 'styles') {
            await this.loadModStyles(modId, url);
          } else if (contentType === 'theme') {
            await this.loadModTheme(modId, url);
          }
        } catch (err) {
          log.warn(`加载 "${modId}" 的 "${dataPath}" 失败:`, err);
        }
      }
    }
  }

  /**
   * 加载 Mod CSS 样式
   */
  private async loadModStyles(modId: string, cssUrl: string): Promise<void> {
    try {
      const response = await fetch(cssUrl);
      if (!response.ok) {
        log.warn(`Mod "${modId}" 样式文件加载失败: HTTP ${response.status}`);
        return;
      }
      const cssContent = await response.text();
      const { StyleLoader } = await import('@/modules/theme/logic/styleLoader');
      StyleLoader.getInstance().injectModStyles(modId, cssContent, 3);
      log.info(`Mod "${modId}": 注入样式成功`);
    } catch (err) {
      log.warn(`Mod "${modId}" 样式注入失败:`, err);
    }
  }

  /**
   * 加载 Mod 主题配置
   */
  private async loadModTheme(modId: string, themeUrl: string): Promise<void> {
    try {
      const response = await fetch(themeUrl);
      if (!response.ok) {
        log.warn(`Mod "${modId}" 主题文件加载失败: HTTP ${response.status}`);
        return;
      }
      // 主题数据暂由调用方处理（未来可扩展）
      log.info(`Mod "${modId}": 主题数据已就绪`);
    } catch (err) {
      log.warn(`Mod "${modId}" 主题加载失败:`, err);
    }
  }
}
