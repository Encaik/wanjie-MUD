/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { generateId } from '@/lib/game/generators';

describe('generators', () => {
  describe('generateId', () => {
    it('should generate a non-empty string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      // 所有 ID 应该唯一
      expect(ids.size).toBe(100);
    });
  });
});
