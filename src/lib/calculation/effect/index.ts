/**
 * 效果模块导出
 */

export { EffectRegistry, createEffectRegistry } from './registry';
export { EffectProcessor, createEffectProcessor } from './processor';
export {
  EffectRegistrationService,
  createEffectRegistrationService,
  type RegistrationResult,
  type BatchRegistrationResult,
  type UnregistrationResult,
} from './registrationService';
