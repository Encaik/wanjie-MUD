/**
 * identity.ts 测试 — 世界 ID 生成与解析
 */

import { describe, it, expect } from 'vitest';
import {
  createWorldId,
  parseWorldId,
  extractSeed,
} from './identity';

describe('createWorldId', () => {
  it('应创建标准世界 ID', () => {
    const id = createWorldId('wanjie-core', 'cultivation', 'a0b1c2d3');
    expect(id).toBe('wanjie-core:cultivation:a0b1c2d3');
  });
});

describe('parseWorldId', () => {
  it('应解析标准世界 ID', () => {
    const result = parseWorldId('wanjie-core:cultivation:a0b1c2d3');
    expect(result).toEqual({
      providerId: 'wanjie-core',
      worldviewId: 'cultivation',
      seed: 'a0b1c2d3',
    });
  });

  it('无效格式应抛出错误', () => {
    expect(() => parseWorldId('invalid')).toThrow('无效的世界 ID 格式');
    expect(() => parseWorldId('a:b')).toThrow('无效的世界 ID 格式');
  });
});

describe('extractSeed', () => {
  it('应从世界 ID 中提取种子', () => {
    expect(extractSeed('wanjie-core:cultivation:a0b1c2d3')).toBe('a0b1c2d3');
  });
});
