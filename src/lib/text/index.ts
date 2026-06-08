/**
 * 文案统一管理系统
 * 
 * 类似 i18n 的结构，每个世界观一个独立文件
 * 添加新世界观只需复制文件并修改内容
 * 
 * 目录结构：
 * - worlds/     世界观文案（类似 i18n 的 locales）
 * - core/       核心功能（类型、解析器）
 * - hooks/      React Hooks
 * 
 * 使用示例：
 * ```tsx
 * import { useText } from '@/lib/text';
 * 
 * function MyComponent() {
 *   const { t } = useText('修仙');
 *   
 *   return <span>{t('combat.victory', { enemyName: '妖兽', exp: 100 })}</span>;
 * }
 * ```
 */

// 世界观文案
export * from './worlds';

// 核心模块
export * from './core';

// React Hooks — moved to @/hooks/text and @/contexts
// Pure functions exported from core and worlds modules
