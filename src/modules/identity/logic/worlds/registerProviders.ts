/**
 * registerProviders — 世界提供者自动注册
 *
 * 在 ModLoader.loadAll() 完成后调用，从 WorldViewRegistry 创建对应的 WorldProvider 并注册到
 * WorldProviderRegistry。
 *
 * @module modules/identity/logic/worlds
 */

import { WorldViewRegistry } from '@/core/registry';
import { WorldProviderRegistry } from '@/core/world/WorldProviderRegistry';
import { ModRandomWorldProvider } from './ModRandomWorldProvider';

/**
 * 注册所有世界提供者
 *
 * 从 WorldViewRegistry 读取已注册的世界观，创建 WorldProvider。
 */
export function registerWorldProviders(): void {
  const registry = WorldViewRegistry.getInstance();
  const providerRegistry = WorldProviderRegistry.getInstance();

  const worldviewIds = registry.getAllIds();

  // 随机生成 provider（只要有已注册的世界观就创建）
  if (worldviewIds.length > 0) {
    const randomProviderId = 'wanjie-core';
    if (!providerRegistry.has(randomProviderId)) {
      const provider = new ModRandomWorldProvider(randomProviderId, '万界随机生成');
      providerRegistry.register(provider);
    }
  }
}
