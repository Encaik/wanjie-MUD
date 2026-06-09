/**
 * registerProviders — 世界提供者自动注册
 *
 * 在 ModLoader.loadAll() 完成后调用，从 WorldDataRegistry 创建对应的 WorldProvider 并注册到
 * WorldProviderRegistry。
 *
 * @module modules/identity/logic/worlds
 */

import { WorldDataRegistry } from '@/shared/lib/registry';
import { WorldProviderRegistry } from '@/shared/lib/world/WorldProviderRegistry';
import { TemplateWorldProvider } from '@/shared/lib/world/TemplateWorldProvider';
import { ModRandomWorldProvider } from './ModRandomWorldProvider';

/**
 * 注册所有世界提供者
 *
 * 从 WorldDataRegistry 读取已注册的世界类型和固化模板，创建对应的 WorldProvider。
 *
 * - 对于已注册世界类型数据的 mod，创建一个 type='random' 的 ModRandomWorldProvider
 * - 对于固化世界模板，创建 type='template' 的 TemplateWorldProvider
 *
 * 此函数应在 ModLoader.loadAll() 完成后调用。
 */
export function registerWorldProviders(): void {
  const registry = WorldDataRegistry.getInstance();
  const providerRegistry = WorldProviderRegistry.getInstance();

  const worldTypes = registry.getAllWorldTypes();

  // 随机生成 provider（只要有已注册的世界类型就创建）
  if (worldTypes.length > 0) {
    const randomProviderId = 'wanjie-core';
    if (!providerRegistry.has(randomProviderId)) {
      const provider = new ModRandomWorldProvider(randomProviderId, '万界随机生成');
      providerRegistry.register(provider);
    }
  }

  // 固化模板 provider
  const templates = registry.getAllWorldTemplates();
  if (templates.length > 0) {
    // 按 mod 来源分组（模板 ID 格式为 modId 前缀，但这里所有模板统一处理）
    // 为简单起见，每个模板作为一个独立的提供者
    for (const template of templates) {
      const providerId = `template-${template.id}`;
      if (!providerRegistry.has(providerId)) {
        const provider = new TemplateWorldProvider(
          providerId,
          `固化世界: ${template.world.name}`,
          [template]
        );
        providerRegistry.register(provider);
        console.log(`[registerProviders] 注册固化模板提供者: ${providerId} (${template.world.name})`);
      }
    }
  }
}
