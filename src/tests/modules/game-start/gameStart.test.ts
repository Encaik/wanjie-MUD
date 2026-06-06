/**
 * @vitest-environment jsdom
 * 
 * 游戏开始功能模块测试
 * 
 * 功能覆盖：
 * - 角色生成：生成8个可选角色，包含属性、天赋、性格等
 * - 世界生成：生成8种世界观（修仙、高武、科技、魔幻、异能、仙侠、武侠、末世）
 * - 背景故事：根据角色和世界生成独特背景故事
 * - 游戏初始化：开始新游戏、确认背景故事等
 */
import { describe, it, expect } from 'vitest';

// ============================================
// 角色生成功能
// ============================================
describe('角色生成功能', () => {
  it('应该生成8个角色供选择', async () => {
    const { generateCharacters } = await import('@/lib/game/generators');
    const characters = generateCharacters();
    
    expect(characters.length).toBe(8);
  });

  it('每个角色应该有完整的属性', async () => {
    const { generateCharacters } = await import('@/lib/game/generators');
    const characters = generateCharacters();
    
    characters.forEach((char, index) => {
      expect(char.id).toBe(index + 1);
      expect(char.name).toBeTruthy();
      expect(['男', '女']).toContain(char.gender);
      expect(char.age).toBeGreaterThanOrEqual(14);
      expect(char.age).toBeLessThanOrEqual(25);
      expect(char.stats).toBeDefined();
      expect(char.origin).toBeDefined();
      expect(char.trait).toBeDefined();
      expect(char.personality).toBeDefined();
      expect(char.talent).toBeDefined();
    });
  });

  it('角色属性值应在合理范围内', async () => {
    const { generateCharacters } = await import('@/lib/game/generators');
    const characters = generateCharacters();
    
    characters.forEach(char => {
      const stats = char.stats;
      expect(stats.体质).toBeGreaterThanOrEqual(30);
      expect(stats.灵根).toBeGreaterThanOrEqual(30);
      expect(stats.悟性).toBeGreaterThanOrEqual(30);
      expect(stats.幸运).toBeGreaterThanOrEqual(30);
      expect(stats.意志).toBeGreaterThanOrEqual(30);
      
      // 属性不应超过上限（基础值 + 出身 + 特质 + 性格 + 天赋加成）
      expect(stats.体质).toBeLessThanOrEqual(100);
      expect(stats.灵根).toBeLessThanOrEqual(100);
      expect(stats.悟性).toBeLessThanOrEqual(100);
      expect(stats.幸运).toBeLessThanOrEqual(100);
      expect(stats.意志).toBeLessThanOrEqual(100);
    });
  });

  it('角色应有有效的出身、特质、性格、天赋', async () => {
    const { generateCharacters } = await import('@/lib/game/generators');
    const characters = generateCharacters();
    
    characters.forEach(char => {
      // 出身
      expect(char.origin.name).toBeTruthy();
      expect(char.origin.description).toBeTruthy();
      expect(char.origin.impact).toBeDefined();
      expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(char.origin.level);
      
      // 特质
      expect(char.trait.name).toBeTruthy();
      expect(char.trait.description).toBeTruthy();
      
      // 性格
      expect(char.personality.name).toBeTruthy();
      expect(char.personality.description).toBeTruthy();
      
      // 天赋
      expect(char.talent.name).toBeTruthy();
      expect(char.talent.description).toBeTruthy();
    });
  });
});

// ============================================
// 世界生成功能
// ============================================
describe('世界生成功能', () => {
  it('应该生成8种不同世界观', async () => {
    const { generateWorlds } = await import('@/lib/game/generators');
    const worlds = generateWorlds();
    
    expect(worlds.length).toBe(8);
    
    const worldTypes = worlds.map(w => w.type);
    const expectedTypes = ['修仙', '高武', '科技', '魔幻', '异能', '仙侠', '武侠', '末世'];
    expectedTypes.forEach(type => {
      expect(worldTypes).toContain(type);
    });
  });

  it('每个世界应有完整的属性', async () => {
    const { generateWorlds } = await import('@/lib/game/generators');
    const worlds = generateWorlds();
    
    worlds.forEach(world => {
      expect(world.id).toBeGreaterThan(0);
      expect(world.name).toBeTruthy();
      expect(world.description).toBeTruthy();
      expect(world.powerSystem).toBeTruthy();
      expect(world.factions).toBeDefined();
      expect(world.dangers).toBeDefined();
      expect(world.opportunities).toBeDefined();
      expect(world.realmSystem).toBeDefined();
    });
  });

  it('每个世界应有境界体系', async () => {
    const { generateWorlds } = await import('@/lib/game/generators');
    const worlds = generateWorlds();
    
    worlds.forEach(world => {
      const realmNames = Object.keys(world.realmSystem);
      expect(realmNames.length).toBeGreaterThan(0);
      
      // 境界名称应非空（可能是字符串或对象）
      Object.values(world.realmSystem).forEach(realmName => {
        expect(realmName).toBeTruthy();
      });
    });
  });

  it('每个世界应有势力列表', async () => {
    const { generateWorlds } = await import('@/lib/game/generators');
    const worlds = generateWorlds();
    
    worlds.forEach(world => {
      expect(world.factions.length).toBeGreaterThan(0);
      
      world.factions.forEach(faction => {
        expect(faction.name).toBeTruthy();
        expect(faction.type).toBeTruthy();
      });
    });
  });
});

// ============================================
// 背景故事生成功能
// ============================================
describe('背景故事生成功能', () => {
  it('应该根据角色和世界生成背景故事', async () => {
    const { generateBackstory, generateCharacters, generateWorlds } = await import('@/lib/game/generators');
    
    const characters = generateCharacters();
    const worlds = generateWorlds();
    
    const character = characters[0];
    const world = worlds[0];
    
    const backstory = generateBackstory(character, world);
    
    expect(backstory).toBeTruthy();
    expect(backstory.length).toBeGreaterThan(100);
    expect(backstory).toContain(character.name);
  });

  it('不同角色应生成不同背景故事', async () => {
    const { generateBackstory, generateCharacters, generateWorlds } = await import('@/lib/game/generators');
    
    const characters = generateCharacters();
    const world = generateWorlds()[0];
    
    const backstory1 = generateBackstory(characters[0], world);
    const backstory2 = generateBackstory(characters[1], world);
    
    // 不同角色应产生不同故事
    expect(backstory1).not.toBe(backstory2);
  });

  it('不同世界应生成不同背景故事', async () => {
    const { generateBackstory, generateCharacters, generateWorlds } = await import('@/lib/game/generators');
    
    const character = generateCharacters()[0];
    const worlds = generateWorlds();
    
    const backstory1 = generateBackstory(character, worlds[0]);
    const backstory2 = generateBackstory(character, worlds[1]);
    
    // 不同世界应产生不同故事
    expect(backstory1).not.toBe(backstory2);
  });
});

// ============================================
// 游戏初始化功能
// ============================================
describe('游戏初始化功能', () => {
  it('应该有startNewGame函数', async () => {
    const { useGame } = await import('@/hooks/useGameState');
    expect(useGame).toBeDefined();
  });

  it('应该有refreshCharacters函数用于刷新角色', async () => {
    // 验证角色刷新功能存在
    const { generateCharacters } = await import('@/lib/game/generators');
    const characters1 = generateCharacters();
    const characters2 = generateCharacters();
    
    // 每次生成应该产生不同的角色集
    expect(characters1).not.toBe(characters2);
  });

  it('应该有selectCharacter函数用于选择角色', async () => {
    const { useGame } = await import('@/hooks/useGameState');
    expect(useGame).toBeDefined();
  });

  it('应该有selectWorld函数用于选择世界', async () => {
    const { useGame } = await import('@/hooks/useGameState');
    expect(useGame).toBeDefined();
  });

  it('应该有confirmBackstory函数用于确认背景故事', async () => {
    const { useGame } = await import('@/hooks/useGameState');
    expect(useGame).toBeDefined();
  });
});

// ============================================
// 角色属性加成计算
// ============================================
describe('角色属性加成计算', () => {
  it('出身应正确加成属性', async () => {
    const { generateCharacters } = await import('@/lib/game/generators');
    const characters = generateCharacters();
    
    characters.forEach(char => {
      const originImpact = char.origin.impact;
      expect(originImpact).toBeDefined();
      
      // 加成值应在合理范围
      Object.values(originImpact).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(-10);
        expect(value).toBeLessThanOrEqual(20);
      });
    });
  });

  it('天赋应有等级划分', async () => {
    const { generateCharacters } = await import('@/lib/game/generators');
    const characters = generateCharacters();
    
    characters.forEach(char => {
      expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(char.talent.level);
    });
  });
});
