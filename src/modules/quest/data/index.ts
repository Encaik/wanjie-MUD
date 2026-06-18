/**
 * modules/quest/data — 桶导出
 *
 * 模块加载时同步注册内置模板，消除与 UI 挂载的时序竞态。
 * Mod 模板由 ModLoader 注册到 QuestTemplateRegistry，再由 initModQuestTemplates() 统一编译。
 *
 * @module modules/quest
 */

import { QuestTemplateRegistry } from '@/core/registry/QuestTemplateRegistry';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import { TUTORIAL_QUEST_TEMPLATES } from './quests/tutorial';
import { compileTemplate } from '../logic/templateCompiler';

export { TUTORIAL_STORYLINE } from './storylines/tutorial';
export { DEFAULT_BOARDS, BOARD_TUTORIAL, BOARD_MAIN_STORY, BOARD_DAILY, BOARD_WEEKLY } from './boards/default';
export { TUTORIAL_QUEST_TEMPLATES } from './quests/tutorial';

// ============================================
// 模块加载时同步注册内置模板
// ============================================

(function registerBuiltinTemplatesSync() {
  const templateRegistry = QuestTemplateRegistry.getInstance();
  const questRegistry = QuestRegistry.getInstance();

  for (const template of TUTORIAL_QUEST_TEMPLATES) {
    // 幂等：热重载时跳过已注册的模板
    if (templateRegistry.get(template.templateId)) continue;
    templateRegistry.register(template);

    if (!questRegistry.getById(template.templateId)) {
      questRegistry.register(compileTemplate(template));
    }
  }
})();

// ============================================
// Mod 模板初始化（启动后调用）
// ============================================

/**
 * 编译 Mod 注册的模板并注入 QuestRegistry
 *
 * 在 initQuestRegistries() 中调用，此时 ModLoader 已将 Mod 模板
 * 注册到 QuestTemplateRegistry。只需编译未注册的模板即可。
 */
export function initModQuestTemplates(): void {
  const templateRegistry = QuestTemplateRegistry.getInstance();
  const questRegistry = QuestRegistry.getInstance();

  for (const template of templateRegistry.getAll()) {
    if (!questRegistry.getById(template.templateId)) {
      questRegistry.register(compileTemplate(template));
    }
  }
}
