/**
 * ServerModLoader 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ServerModLoader } from '../server-loader';

// Mock fs
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

import fs from 'fs';

// Mock registries
vi.mock('@/core/registry/WorldViewRegistry', () => ({
  WorldViewRegistry: {
    getInstance: vi.fn(() => ({
      register: vi.fn(),
      getAllIds: vi.fn(() => []),
      getAll: vi.fn(() => []),
      count: 0,
    })),
  },
}));

vi.mock('@/core/registry/WorldMechanicsRegistry', () => ({
  WorldMechanicsRegistry: {
    getInstance: vi.fn(() => ({
      register: vi.fn(),
      has: vi.fn(() => false),
    })),
  },
}));

vi.mock('@/core/registry/AttributeRegistry', () => ({
  AttributeRegistry: {
    getInstance: vi.fn(() => ({
      registerAll: vi.fn(),
      count: 0,
    })),
  },
}));

vi.mock('@/core/registry/RaceRegistry', () => ({
  RaceRegistry: {
    getInstance: vi.fn(() => ({
      register: vi.fn(),
    })),
  },
}));

vi.mock('@/core/registry/TalentRegistry', () => ({
  TalentRegistry: {
    getInstance: vi.fn(() => ({
      registerAll: vi.fn(),
    })),
  },
}));

vi.mock('@/core/registry/NPCDataRegistry', () => ({
  NPCDataRegistry: {
    getInstance: vi.fn(() => ({
      registerAll: vi.fn(),
    })),
  },
}));

vi.mock('@/core/registry/QuestRegistry', () => ({
  QuestRegistry: {
    getInstance: vi.fn(() => ({
      registerAll: vi.fn(),
    })),
  },
}));

vi.mock('@/core/world/WorldProviderRegistry', () => ({
  WorldProviderRegistry: {
    getInstance: vi.fn(() => ({
      has: vi.fn(() => false),
      register: vi.fn(),
    })),
  },
}));

describe('ServerModLoader', () => {
  let loader: ServerModLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new ServerModLoader('/fake-mods');
  });

  describe('discover', () => {
    it('should return empty array when mods directory does not exist', async () => {
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const result = await loader.discover();
      expect(result).toEqual([]);
    });

    it('should discover mods from subdirectories with mod.json', async () => {
      (fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation(
        (p: string) => p === '/fake-mods' || p.endsWith('mod.json')
      );
      (fs.readdirSync as ReturnType<typeof vi.fn>).mockReturnValue([
        { name: 'wanjie-core', isDirectory: () => true },
        { name: 'wanjie-template', isDirectory: () => true },
        { name: 'README.md', isDirectory: () => false },
      ]);

      const result = await loader.discover();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'wanjie-core', path: 'wanjie-core' });
    });
  });

  describe('loadModManifest', () => {
    it('should read and parse mod.json', async () => {
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify({
          id: 'test-mod',
          name: '测试 Mod',
          version: '1.0.0',
          description: '测试',
          author: 'tester',
          gameVersion: '>=1.0.0',
          contentTypes: ['worldview'],
          dataFiles: { worldview: 'data/world.json' },
        })
      );

      const manifest = await loader.loadModManifest('test-mod');
      expect(manifest.id).toBe('test-mod');
      expect(manifest.contentTypes).toEqual(['worldview']);
    });

    it('should throw on invalid mod.json', async () => {
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue('not json');

      await expect(loader.loadModManifest('bad-mod')).rejects.toThrow();
    });
  });

  describe('loadAll', () => {
    it('should return zero counts when no mods found', async () => {
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const result = await loader.loadAll();
      expect(result).toEqual({ loaded: 0, failed: 0, total: 0 });
    });
  });
});
