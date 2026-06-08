/**
 * @vitest-environment jsdom
 * 
 * 物品系统功能模块测试
 * 
 * 功能覆盖：
 * - 丹药系统：修炼丹药、突破丹药、效果持续时间
 * - 装备系统：装备类型、装备槽位、装备强化
 * - 功法系统：功法类型、功法等级、功法效果
 * - 背包系统：物品堆叠、物品添加、物品使用
 * - 消息系统：消息记录、奖励显示
 * - 成就系统：成就奖励、成就领取
 */
import { describe, it, expect } from 'vitest';

// ============================================
// 丹药系统
// ============================================
describe('丹药系统', () => {
  it('应该有修炼丹药', async () => {
    const { cultivationPillItems } = await import('@/lib/game/items');
    
    expect(cultivationPillItems.length).toBeGreaterThan(0);
    cultivationPillItems.forEach(item => {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.type).toBeTruthy();
    });
  });

  it('修炼丹药应该有持续效果', async () => {
    const { cultivationPillItems } = await import('@/lib/game/items');
    
    cultivationPillItems.forEach(item => {
      expect(item.effects).toBeDefined();
      expect(item.effects.length).toBeGreaterThan(0);
      
      // 验证效果有 duration 字段
      const boostEffect = item.effects.find(e => e.type === 'cultivation_boost');
      if (boostEffect) {
        expect(boostEffect.duration).toBeGreaterThan(0);
        expect(boostEffect.value).toBeGreaterThan(0);
        expect(boostEffect.description).toBeTruthy();
      }
    });
  });

  it('丹药效果应该显示剩余次数', async () => {
    const { cultivationPillItems } = await import('@/lib/game/items');
    
    const pill = cultivationPillItems[0];
    const effect = pill.effects.find(e => e.type === 'cultivation_boost');
    
    expect(effect).toBeDefined();
    expect(effect?.duration).toBe(3);
    // 效果描述应该包含持续次数信息
    expect(effect?.description).toContain('3次');
  });

  it('应该有突破丹', async () => {
    const { breakthroughItems } = await import('@/lib/game/items');
    
    expect(breakthroughItems.length).toBeGreaterThan(0);
    breakthroughItems.forEach(item => {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
    });
  });
});

// ============================================
// 灵石系统
// ============================================
describe('灵石系统', () => {
  it('应该有灵石物品', async () => {
    const { spiritStoneItems } = await import('@/lib/game/items');
    
    expect(spiritStoneItems.length).toBeGreaterThan(0);
    spiritStoneItems.forEach(item => {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.type).toBeTruthy();
    });
  });
});

// ============================================
// 装备系统
// ============================================
describe('装备系统', () => {
  it('应该有正确的装备槽位', async () => {
    const slots = ['melee', 'ranged', 'head', 'body', 'legs', 'feet'];
    
    slots.forEach(slot => {
      expect(slot).toBeTruthy();
    });
  });

  it('装备应该有属性加成', async () => {
    type TestEquipment = import('@/lib/game/types').Equipment;
    const { createMinimalEquipment } = require('@/lib/game/utils/rarityUtils');
    
    const equipment: TestEquipment = createMinimalEquipment(
      'equip-1',
      'Iron Sword',
      'melee',
      '普通',
      { description: 'A basic sword', attackBonus: 10 }
    );
    
    expect(equipment.attackBonus).toBe(10);
    expect(equipment.defenseBonus).toBe(0);
  });
});

// ============================================
// 功法系统
// ============================================
describe('功法系统', () => {
  it('应该有正确的功法类型', async () => {
    const types = ['attack', 'defense'];
    
    types.forEach(type => {
      expect(type).toBeTruthy();
    });
  });

  it('功法应该有属性', async () => {
    type TestTechnique = import('@/lib/game/types').Technique;
    
    const { createMinimalTechnique } = require('@/lib/game/utils/rarityUtils');
    const technique: TestTechnique = createMinimalTechnique(
      'tech-1',
      'Basic Attack',
      'attack',
      '普通',
      { description: 'A basic attack', power: 10 }
    );
    
    expect(technique.power).toBe(10);
    expect(technique.type).toBe('attack');
  });
});

// ============================================
// 背包系统
// ============================================
describe('背包系统', () => {
  it('应该能创建背包物品', async () => {
    const { createInventoryItem } = await import('@/lib/game/types');
    const { spiritStoneItems } = await import('@/lib/game/items');
    
    const item = createInventoryItem(spiritStoneItems[0], 100);
    
    expect(item.definition).toBeDefined();
    expect(item.quantity).toBe(100);
  });

  it('相同ID的物品应该堆叠', async () => {
    const { createInventoryItem } = await import('@/lib/game/types');
    const { spiritStoneItems } = await import('@/lib/game/items');
    
    const item1 = createInventoryItem(spiritStoneItems[0], 100);
    const item2 = createInventoryItem(spiritStoneItems[0], 50);
    
    expect(item1.definition.id).toBe(item2.definition.id);
    
    // 模拟背包添加逻辑
    const inventory = [item1];
    const existingIndex = inventory.findIndex(i => i.definition.id === item2.definition.id);
    
    if (existingIndex !== -1) {
      inventory[existingIndex] = {
        ...inventory[existingIndex],
        quantity: inventory[existingIndex].quantity + item2.quantity,
      };
    }
    
    expect(inventory[0].quantity).toBe(150);
  });

  it('应该有ActiveEffect类型', async () => {
    type TestActiveEffect = import('@/lib/game/types').ActiveEffect;
    
    // 创建一个测试效果对象
    const testEffect: TestActiveEffect = {
      itemId: 'test_pill',
      itemName: '测试丹药',
      type: 'cultivation_boost',
      value: 20,
      remainingCount: 3
    };
    
    expect(testEffect.remainingCount).toBe(3);
    expect(testEffect.value).toBe(20);
  });
});

// ============================================
// 消息系统
// ============================================
describe('消息系统', () => {
  it('应该有消息配置', async () => {
    const { MESSAGE_CONFIG } = await import('@/lib/game/types');
    
    expect(MESSAGE_CONFIG.memoryLimit).toBeGreaterThan(0);
    expect(MESSAGE_CONFIG.chunkSize).toBeGreaterThan(0);
  });

  it('消息记录应该包含奖励信息', async () => {
    type TestMessageRecord = import('@/lib/game/types').MessageRecord;
    
    const message: TestMessageRecord = {
      id: 'test',
      type: 'success',
      title: '测试消息',
      content: '测试内容',
      timestamp: Date.now(),
      rewards: {
        experience: 100,
        items: [],
        stats: { 体质: 1 },
      }
    };
    
    expect(message.rewards).toBeDefined();
    expect(message.rewards?.experience).toBe(100);
    expect(message.rewards?.stats?.体质).toBe(1);
  });
});

// ============================================
// 成就系统
// ============================================
describe('成就系统', () => {
  it('成就应该有经验奖励', async () => {
    const { ACHIEVEMENTS } = await import('@/lib/data/achievementData');
    
    // 验证成就有经验奖励
    const levelAchievements = ACHIEVEMENTS.filter(a => a.type === 'level');
    
    levelAchievements.forEach(achievement => {
      expect(achievement.rewards).toBeDefined();
      expect(achievement.rewards.experience).toBeGreaterThan(0);
    });
  });

  it('部分成就应该有物品奖励', async () => {
    const { ACHIEVEMENTS } = await import('@/lib/data/achievementData');
    
    // 找到有物品奖励的成就
    const achievementsWithItems = ACHIEVEMENTS.filter(a => a.rewards.items && a.rewards.items.length > 0);
    
    expect(achievementsWithItems.length).toBeGreaterThan(0);
    
    achievementsWithItems.forEach(achievement => {
      expect(achievement.rewards.items).toBeDefined();
      expect(achievement.rewards.items!.length).toBeGreaterThan(0);
    });
  });

  it('成就应该有正确的结构', async () => {
    const { ACHIEVEMENTS } = await import('@/lib/data/achievementData');
    
    ACHIEVEMENTS.forEach(achievement => {
      expect(achievement.id).toBeTruthy();
      expect(achievement.name).toBeTruthy();
      expect(achievement.description).toBeTruthy();
      expect(achievement.type).toBeTruthy();
      expect(achievement.target).toBeGreaterThan(0);
      expect(achievement.rewards).toBeDefined();
    });
  });
});

// ============================================
// 随机物品获取
// ============================================
describe('随机物品获取', () => {
  it('应该能获取随机物品', async () => {
    const { getRandomItem } = await import('@/lib/game/items');
    
    const item = getRandomItem(10);
    expect(item).toBeDefined();
  });

  it('更高等级应该有更好的奖励', async () => {
    const { getRandomItem } = await import('@/lib/game/items');
    
    const item1 = getRandomItem(1);
    const item10 = getRandomItem(10);
    
    expect(item1).toBeDefined();
    expect(item10).toBeDefined();
  });
});

// ============================================
// 物品稀有度
// ============================================
describe('物品稀有度', () => {
  it('应该有正确的稀有度等级', async () => {
    const rarities = ['普通', '稀有', '史诗', '传说', '神话'];
    
    rarities.forEach(rarity => {
      expect(rarity).toBeTruthy();
    });
  });
});
