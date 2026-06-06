/**
 * 环境配置工具
 * 
 * 通过环境变量 MODE 控制开发者模式
 * - debug: 开发调试模式，显示开发者面板
 * - production: 生产模式，隐藏开发者面板
 */

// 检查是否为调试模式
export function isDebugMode(): boolean {
  const mode = process.env.MODE || process.env.NODE_ENV;
  return mode === 'debug' || mode === 'development';
}

// 检查是否为生产模式
export function isProductionMode(): boolean {
  return !isDebugMode();
}

// 获取当前模式
export function getMode(): 'debug' | 'production' {
  return isDebugMode() ? 'debug' : 'production';
}
