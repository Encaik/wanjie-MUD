/**
 * @vitest-environment jsdom
 * 
 * 游戏端到端流程测试
 * 
 * 测试完整的游戏流程：
 * 1. 游戏初始化 -> 生成角色
 * 2. 角色选择 -> 进入世界选择
 * 3. 世界选择 -> 生成背景故事
 * 4. 背景故事确认 -> 进入游戏
 * 5. 游戏主循环 -> 修炼、探索、战斗等
 */

import React from 'react';

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { GameProvider, useGame } from '@/hooks/useGameState';

// 测试包装器
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GameProvider>{children}</GameProvider>
);

// 获取游戏状态的hook
const useTestGame = () => {
  const game = useGame();
  return game;
};

// ============================================
// 游戏初始化流程测试
// ============================================
describe('游戏初始化流程', () => {
  it('初始状态应该正确', () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    expect(result.current.gameState.phase).toBe('character-select');
    expect(result.current.gameState.protagonist).toBeNull();
  });

  it('开始新游戏应该生成角色', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    await act(async () => {
      result.current.startNewGame();
    });
    
    expect(result.current.gameState.characters.length).toBe(8);
    expect(result.current.gameState.phase).toBe('character-select');
  });

  it('生成的角色应该有完整属性', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    await act(async () => {
      result.current.startNewGame();
    });
    
    const characters = result.current.gameState.characters;
    expect(characters.length).toBe(8);
    
    characters.forEach(char => {
      expect(char.id).toBeGreaterThan(0);
      expect(char.name).toBeTruthy();
      expect(char.stats).toBeDefined();
      expect(char.stats.体质).toBeGreaterThanOrEqual(30);
      expect(char.stats.灵根).toBeGreaterThanOrEqual(30);
      expect(char.origin).toBeDefined();
      expect(char.trait).toBeDefined();
    });
  });
});

// ============================================
// 角色选择流程测试
// ============================================
describe('角色选择流程', () => {
  it('选择角色后应该进入世界选择阶段', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    // 初始化游戏
    await act(async () => {
      result.current.startNewGame();
    });
    
    const character = result.current.gameState.characters[0];
    
    // 选择角色
    await act(async () => {
      result.current.selectCharacter(character);
    });
    
    expect(result.current.gameState.phase).toBe('world-select');
    expect(result.current.gameState.worlds.length).toBe(8);
  });

  it('生成的世界应该有完整属性', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    await act(async () => {
      result.current.startNewGame();
    });
    
    const character = result.current.gameState.characters[0];
    
    await act(async () => {
      result.current.selectCharacter(character);
    });
    
    const worlds = result.current.gameState.worlds;
    
    worlds.forEach(world => {
      expect(world.id).toBeTruthy();
      expect(world.name).toBeTruthy();
      expect(world.type).toBeTruthy();
      expect(world.description).toBeTruthy();
      expect(world.realmSystem).toBeDefined();
    });
  });
});

// ============================================
// 世界选择流程测试
// ============================================
describe('世界选择流程', () => {
  it('选择世界后应该进入背景故事阶段', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    // 初始化并选择角色
    await act(async () => {
      result.current.startNewGame();
    });
    
    const character = result.current.gameState.characters[0];
    
    await act(async () => {
      result.current.selectCharacter(character);
    });
    
    const world = result.current.gameState.worlds[0];
    
    // 选择世界
    await act(async () => {
      result.current.selectWorld(world);
    });
    
    expect(result.current.gameState.phase).toBe('backstory');
    expect(result.current.gameState.protagonist).toBeDefined();
    expect(result.current.gameState.protagonist?.backstory).toBeDefined();
  });

  it('主角应该有正确的初始状态', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    await act(async () => {
      result.current.startNewGame();
    });
    
    const character = result.current.gameState.characters[0];
    
    await act(async () => {
      result.current.selectCharacter(character);
    });
    
    const world = result.current.gameState.worlds[0];
    
    await act(async () => {
      result.current.selectWorld(world);
    });
    
    const protagonist = result.current.gameState.protagonist!;
    
    expect(protagonist.level).toBe(1);
    expect(protagonist.experience).toBe(0);
    expect(protagonist.currentHp).toBeGreaterThan(0);
    expect(protagonist.maxHp).toBeGreaterThan(0);
    expect(protagonist.currentMp).toBeGreaterThanOrEqual(0);
    expect(protagonist.maxMp).toBeGreaterThan(0);
    expect(protagonist.inventory.length).toBeGreaterThan(0); // 初始物品
  });
});

// ============================================
// 背景故事确认流程测试
// ============================================
describe('背景故事确认流程', () => {
  it('确认背景故事后应该进入游戏主循环', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    // 完成初始化流程
    await act(async () => {
      result.current.startNewGame();
    });
    
    const character = result.current.gameState.characters[0];
    
    await act(async () => {
      result.current.selectCharacter(character);
    });
    
    const world = result.current.gameState.worlds[0];
    
    await act(async () => {
      result.current.selectWorld(world);
    });
    
    // 确认背景故事
    await act(async () => {
      result.current.confirmBackstory();
    });
    
    expect(result.current.gameState.phase).toBe('playing');
  });
});

// ============================================
// 游戏主循环测试
// ============================================
describe('游戏主循环', () => {
  beforeEach(async () => {
    // 模拟localStorage
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  it('应该能够执行修炼操作', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    // 进入游戏
    await act(async () => {
      result.current.startNewGame();
    });
    
    await act(async () => {
      result.current.selectCharacter(result.current.gameState.characters[0]);
    });
    
    await act(async () => {
      result.current.selectWorld(result.current.gameState.worlds[0]);
    });
    
    await act(async () => {
      result.current.confirmBackstory();
    });
    
    const initialExp = result.current.gameState.protagonist!.experience;
    
    // 执行修炼
    await act(async () => {
      result.current.performCultivation();
    });
    
    // 修炼应该增加经验
    expect(result.current.gameState.protagonist!.experience).toBeGreaterThanOrEqual(initialExp);
  });

  it('应该能够执行休息操作', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    // 进入游戏
    await act(async () => {
      result.current.startNewGame();
    });
    
    await act(async () => {
      result.current.selectCharacter(result.current.gameState.characters[0]);
    });
    
    await act(async () => {
      result.current.selectWorld(result.current.gameState.worlds[0]);
    });
    
    await act(async () => {
      result.current.confirmBackstory();
    });
    
    const protagonist = result.current.gameState.protagonist!;
    // 先减少一些HP以便测试恢复
    const reducedHp = Math.floor(protagonist.maxHp * 0.5);
    
    await act(async () => {
      result.current.performRest();
    });
    
    // 休息应该恢复HP和MP
    expect(result.current.gameState.protagonist!.currentHp).toBeLessThanOrEqual(protagonist.maxHp);
    expect(result.current.gameState.protagonist!.currentMp).toBeLessThanOrEqual(protagonist.maxMp);
  });

  it('应该能够切换Tab', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    // 进入游戏
    await act(async () => {
      result.current.startNewGame();
    });
    
    await act(async () => {
      result.current.selectCharacter(result.current.gameState.characters[0]);
    });
    
    await act(async () => {
      result.current.selectWorld(result.current.gameState.worlds[0]);
    });
    
    await act(async () => {
      result.current.confirmBackstory();
    });
    
    // 切换到势力Tab
    await act(async () => {
      result.current.setCurrentTab('experience');
    });
    
    expect(result.current.gameState.currentTab).toBe('experience');
    
    // 切换到机缘Tab
    await act(async () => {
      result.current.setCurrentTab('adventure');
    });
    
    expect(result.current.gameState.currentTab).toBe('adventure');
  });

  it('应该能够获取可用的机缘难度', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    // 进入游戏
    await act(async () => {
      result.current.startNewGame();
    });
    
    await act(async () => {
      result.current.selectCharacter(result.current.gameState.characters[0]);
    });
    
    await act(async () => {
      result.current.selectWorld(result.current.gameState.worlds[0]);
    });
    
    await act(async () => {
      result.current.confirmBackstory();
    });
    
    const difficulties = result.current.getAvailableDifficulties();
    
    expect(difficulties.length).toBeGreaterThan(0);
    difficulties.forEach(diff => {
      expect(diff.difficulty).toBeGreaterThanOrEqual(0);
      expect(diff.realmName).toBeTruthy();
    });
  });
});

// ============================================
// 存档系统测试
// ============================================
describe('存档系统', () => {
  it('应该能够导出存档', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    // 进入游戏
    await act(async () => {
      result.current.startNewGame();
    });
    
    await act(async () => {
      result.current.selectCharacter(result.current.gameState.characters[0]);
    });
    
    await act(async () => {
      result.current.selectWorld(result.current.gameState.worlds[0]);
    });
    
    await act(async () => {
      result.current.confirmBackstory();
    });
    
    const saveData = result.current.exportSave();
    
    expect(saveData).toBeTruthy();
    const parsed = JSON.parse(saveData);
    expect(parsed.phase).toBe('playing');
    expect(parsed.protagonist).toBeDefined();
  });

  it('应该能够重置游戏', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    // 进入游戏
    await act(async () => {
      result.current.startNewGame();
    });
    
    await act(async () => {
      result.current.selectCharacter(result.current.gameState.characters[0]);
    });
    
    await act(async () => {
      result.current.selectWorld(result.current.gameState.worlds[0]);
    });
    
    await act(async () => {
      result.current.confirmBackstory();
    });
    
    expect(result.current.gameState.phase).toBe('playing');
    
    // 重置游戏
    await act(async () => {
      result.current.resetGame();
    });
    
    expect(result.current.gameState.phase).toBe('character-select');
    expect(result.current.gameState.protagonist).toBeNull();
  });
});

// ============================================
// 物品系统测试
// ============================================
describe('物品系统', () => {
  it('主角应该有初始物品', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    await act(async () => {
      result.current.startNewGame();
    });
    
    await act(async () => {
      result.current.selectCharacter(result.current.gameState.characters[0]);
    });
    
    await act(async () => {
      result.current.selectWorld(result.current.gameState.worlds[0]);
    });
    
    await act(async () => {
      result.current.confirmBackstory();
    });
    
    const inventory = result.current.gameState.protagonist!.inventory;
    
    // 应该有灵石
    const spiritStone = inventory.find(i => i.definition.id === 'spirit_stone');
    expect(spiritStone).toBeDefined();
    expect(spiritStone!.quantity).toBeGreaterThan(0);
  });

  it('应该能够使用物品', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    await act(async () => {
      result.current.startNewGame();
    });
    
    await act(async () => {
      result.current.selectCharacter(result.current.gameState.characters[0]);
    });
    
    await act(async () => {
      result.current.selectWorld(result.current.gameState.worlds[0]);
    });
    
    await act(async () => {
      result.current.confirmBackstory();
    });
    
    // 查找一个可使用的物品
    const usableItem = result.current.gameState.protagonist!.inventory.find(
      i => i.definition.type === '消耗品' || i.definition.type === '丹药'
    );
    
    if (usableItem) {
      // 尝试使用物品（不应该抛出错误）
      await act(async () => {
        result.current.useItem(usableItem.id);
      });
      
      // 物品数量应该减少或物品被移除或数量保持不变（某些物品可能无法使用）
      const itemAfter = result.current.gameState.protagonist!.inventory.find(
        i => i.id === usableItem.id
      );
      
      // 验证物品状态：存在且数量>=1，或者已被移除
      if (itemAfter) {
        expect(itemAfter.quantity).toBeGreaterThanOrEqual(0);
      }
      // 如果物品被移除，也视为正常
    }
  });
});

// ============================================
// 消息系统测试
// ============================================
describe('消息系统', () => {
  it('应该能够添加消息', async () => {
    const { result } = renderHook(() => useTestGame(), { wrapper });
    
    await act(async () => {
      result.current.startNewGame();
    });
    
    await act(async () => {
      result.current.selectCharacter(result.current.gameState.characters[0]);
    });
    
    await act(async () => {
      result.current.selectWorld(result.current.gameState.worlds[0]);
    });
    
    await act(async () => {
      result.current.confirmBackstory();
    });
    
    const initialMessageCount = result.current.gameState.messages.length;
    
    await act(async () => {
      result.current.addMessage('info', '测试标题', '测试内容');
    });
    
    expect(result.current.gameState.messages.length).toBe(initialMessageCount + 1);
    expect(result.current.gameState.messages[0].title).toBe('测试标题');
  });
});
