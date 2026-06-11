/**
 * Mod 清单 / 列表类型（精简版，供服务端 API 初始化使用）
 *
 * 避免引入 full ModManifest 模块（其内部依赖 browser fetch），
 * 只定义 JSON 结构的类型。
 */

/** mod-list.json 结构 */
export interface ModList {
  mods: Array<{
    id: string;
    path: string;
  }>;
}

/** mod.json 清单（仅包含数据加载所需字段） */
export interface ModManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  gameVersion: string;
  dependencies: string[];
  required: boolean;
  template: boolean;
  contentTypes: string[];
  /** 数据文件路径映射（contentType → filename） */
  dataFiles: Record<string, string>;
  /** 固化世界模板 ID 列表 */
  worldTemplates?: string[];
}
