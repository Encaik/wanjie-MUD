/**
 * identity.ts 测试 — 世界 ID 生成与解析
 */

import { describe, it, expect } from 'vitest';
import {
  createWorldId,
  parseWorldId,
  isTemplateWorldId,
  extractSeed,
} from './identity';

describe('createWorldId', () => {
  it('should create random world ID', () => {
    const id = createWorldId('wanjie-core', '修仙', 'a0b1c2d3');
    expect(id).toBe('wanjie-core:修仙:a0b1c2d3');
  });

  it('should create template world ID when worldType is "tpl"', () => {
    const id = createWorldId('wanjie-template', 'tpl', 'huanjing');
    expect(id).toBe('wanjie-template:tpl:huanjing');
  });

  it('should use "unknown" when seed/templateId is undefined', () => {
    expect(createWorldId('test', '修仙')).toBe('test:修仙:unknown');
    expect(createWorldId('test', 'tpl')).toBe('test:tpl:unknown');
  });
});

describe('parseWorldId', () => {
  it('should parse random world ID', () => {
    const result = parseWorldId('wanjie-core:修仙:a0b1c2d3');
    expect(result).toEqual({
      providerId: 'wanjie-core',
      worldType: '修仙',
      seed: 'a0b1c2d3',
    });
  });

  it('should parse template world ID', () => {
    const result = parseWorldId('wanjie-template:tpl:huanjing');
    expect(result).toEqual({
      providerId: 'wanjie-template',
      worldType: 'tpl',
      templateId: 'huanjing',
    });
  });

  it('should throw on invalid format', () => {
    expect(() => parseWorldId('invalid')).toThrow('无效的世界 ID 格式');
    expect(() => parseWorldId('a:b')).toThrow('无效的世界 ID 格式');
  });
});

describe('isTemplateWorldId', () => {
  it('should return true for template IDs', () => {
    expect(isTemplateWorldId('wanjie-template:tpl:huanjing')).toBe(true);
  });

  it('should return false for random world IDs', () => {
    expect(isTemplateWorldId('wanjie-core:修仙:a0b1c2d3')).toBe(false);
  });

  it('should return false for invalid format', () => {
    expect(isTemplateWorldId('garbage')).toBe(false);
  });
});

describe('extractSeed', () => {
  it('should extract seed from random world ID', () => {
    expect(extractSeed('wanjie-core:修仙:a0b1c2d3')).toBe('a0b1c2d3');
  });

  it('should return undefined for template world ID', () => {
    expect(extractSeed('wanjie-template:tpl:huanjing')).toBeUndefined();
  });
});
