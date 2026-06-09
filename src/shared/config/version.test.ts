/**
 * version.ts 测试 — semver 解析和版本兼容性检查
 */

import { describe, it, expect } from 'vitest';
import { parseSemver, checkWorldTemplateCompatibility, GAME_VERSION } from './version';

describe('parseSemver', () => {
  it('should parse valid semver', () => {
    expect(parseSemver('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('should parse zero version', () => {
    expect(parseSemver('0.1.0')).toEqual({ major: 0, minor: 1, patch: 0 });
  });

  it('should parse large version numbers', () => {
    expect(parseSemver('999.888.777')).toEqual({ major: 999, minor: 888, patch: 777 });
  });

  it('should throw on invalid format (missing patch)', () => {
    expect(() => parseSemver('1.2')).toThrow('无效的 semver 格式');
  });

  it('should throw on non-numeric parts', () => {
    expect(() => parseSemver('a.b.c')).toThrow('无效的 semver 格式');
  });
});

describe('checkWorldTemplateCompatibility', () => {
  it('should return compatible when major and minor match', () => {
    // 当前 GAME_VERSION = '0.1.0'，模板 '0.1.5' 仅 patch 不同
    expect(checkWorldTemplateCompatibility('0.1.5')).toBe('compatible');
    expect(checkWorldTemplateCompatibility('0.1.0')).toBe('compatible');
  });

  it('should return needs-update when minor differs', () => {
    // 当前 '0.1.0'，模板 '0.2.0' 次版本号不同
    expect(checkWorldTemplateCompatibility('0.2.0')).toBe('needs-update');
  });

  it('should return incompatible when major differs', () => {
    expect(checkWorldTemplateCompatibility('1.0.0')).toBe('incompatible');
    expect(checkWorldTemplateCompatibility('2.5.3')).toBe('incompatible');
  });

  it('should handle invalid version strings gracefully', () => {
    expect(checkWorldTemplateCompatibility('invalid')).toBe('incompatible');
    expect(checkWorldTemplateCompatibility('')).toBe('incompatible');
  });
});

describe('GAME_VERSION', () => {
  it('should be a valid semver string', () => {
    expect(() => parseSemver(GAME_VERSION)).not.toThrow();
  });

  it('should match package.json version', () => {
    // 基本格式校验：x.y.z
    expect(GAME_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
