/**
 * ClientModLoader 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientModLoader } from '../client-loader';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ClientModLoader', () => {
  let loader: ClientModLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new ClientModLoader('/test-mods');
  });

  describe('discover', () => {
    it('should return empty array when mod-list.json fetch fails', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });
      const result = await loader.discover();
      expect(result).toEqual([]);
    });

    it('should return mod entries from valid mod-list.json', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          mods: [
            { id: 'theme-pack', path: 'theme-pack' },
            { id: 'style-pack', path: 'style-pack' },
          ],
        }),
      });

      const result = await loader.discover();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'theme-pack', path: 'theme-pack' });
    });
  });

  describe('loadAll', () => {
    it('should return zero counts when no mods found', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });
      const result = await loader.loadAll();
      expect(result).toEqual({ loaded: 0, failed: 0, total: 0 });
    });
  });
});
