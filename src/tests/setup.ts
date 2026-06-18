/**
 * Vitest 全局测试配置
 *
 * 在所有测试运行前执行的设置。
 */
import '@testing-library/jest-dom/vitest';
import { ItemRegistry } from '@/core/registry/ItemRegistry';
import { invalidateTemplateCache } from '@/modules/item/data/index';
import cultivationItems from '../../mods/wanjie-core/data/items/cultivation.json';
import xianxiaItems from '../../mods/wanjie-core/data/items/xianxia.json';
import wuxiaItems from '../../mods/wanjie-core/data/items/wuxia.json';
import magicItems from '../../mods/wanjie-core/data/items/magic.json';
import martialItems from '../../mods/wanjie-core/data/items/martial.json';
import techItems from '../../mods/wanjie-core/data/items/tech.json';
import psiItems from '../../mods/wanjie-core/data/items/psi.json';
import apocalypseItems from '../../mods/wanjie-core/data/items/apocalypse.json';

// 将所有世界观物品注册到 ItemRegistry，确保测试中 getTemplate() 可查到
ItemRegistry.resetInstance();
const allItems = [
  ...cultivationItems as unknown[],
  ...xianxiaItems as unknown[],
  ...wuxiaItems as unknown[],
  ...magicItems as unknown[],
  ...martialItems as unknown[],
  ...techItems as unknown[],
  ...psiItems as unknown[],
  ...apocalypseItems as unknown[],
];
ItemRegistry.getInstance().registerAll(allItems as import('@/core/types').ItemTemplateData[]);
invalidateTemplateCache();
