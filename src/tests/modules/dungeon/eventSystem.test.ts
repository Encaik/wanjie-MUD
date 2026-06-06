/**
 * @vitest-environment jsdom
 * 
 * 地牢随机事件系统测试
 * 
 * 测试覆盖：
 * - 事件类型和配置
 * - 事件触发机制
 * - 需求检查
 * - 事件执行
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DUNGEON_EVENTS,
  EVENTS_BY_TYPE,
  getEventById,
  getAvailableEvents,
  EventTriggerService,
  getEventTriggerService,
  resetEventTriggerService,
  checkRequirements,
  getAvailableChoices,
  quickHandleEvent,
} from '@/lib/game/dungeon';
import { createTestProtagonist } from '../adventure/test-helpers';

// ============================================
// 事件配置测试
// ============================================
describe('事件配置', () => {
  it('应该有预定义的事件列表', () => {
    expect(DUNGEON_EVENTS.length).toBeGreaterThan(0);
  });

  it('每个事件应该有必需的字段', () => {
    for (const event of DUNGEON_EVENTS) {
      expect(event.id).toBeDefined();
      expect(event.type).toBeDefined();
      expect(event.name).toBeDefined();
      expect(event.description).toBeDefined();
      expect(event.icon).toBeDefined();
      expect(event.choices.length).toBeGreaterThan(0);
      expect(event.weight).toBeGreaterThan(0);
    }
  });

  it('每个选择应该有至少一个结果', () => {
    for (const event of DUNGEON_EVENTS) {
      for (const choice of event.choices) {
        expect(choice.outcomes.length).toBeGreaterThan(0);
        
        // 检查概率总和为1
        const totalProbability = choice.outcomes.reduce((sum, o) => sum + o.probability, 0);
        expect(totalProbability).toBeCloseTo(1.0, 1);
      }
    }
  });

  it('应该按类型分组事件', () => {
    expect(EVENTS_BY_TYPE.treasure.length).toBeGreaterThan(0);
    expect(EVENTS_BY_TYPE.mystery.length).toBeGreaterThan(0);
    expect(EVENTS_BY_TYPE.trap.length).toBeGreaterThan(0);
    expect(EVENTS_BY_TYPE.merchant.length).toBeGreaterThan(0);
    expect(EVENTS_BY_TYPE.shrine.length).toBeGreaterThan(0);
    expect(EVENTS_BY_TYPE.hidden_room.length).toBeGreaterThan(0);
    expect(EVENTS_BY_TYPE.elite_guardian.length).toBeGreaterThan(0);
    expect(EVENTS_BY_TYPE.blessing.length).toBeGreaterThan(0);
  });

  it('应该能通过ID获取事件', () => {
    const event = getEventById('event_ancient_altar');
    expect(event).toBeDefined();
    expect(event?.name).toBe('古老祭坛');
  });
});

// ============================================
// 事件可用性测试
// ============================================
describe('事件可用性', () => {
  it('应该能根据玩家等级筛选事件', () => {
    const lowLevelEvents = getAvailableEvents(5, 100, 10);
    const highLevelEvents = getAvailableEvents(50, 100, 50);
    
    // 高等级玩家应该能看到更多事件
    expect(highLevelEvents.length).toBeGreaterThanOrEqual(lowLevelEvents.length);
  });

  it('应该能根据HP百分比筛选事件', () => {
    const normalHpEvents = getAvailableEvents(30, 80, 30);
    const lowHpEvents = getAvailableEvents(30, 20, 30);
    
    expect(normalHpEvents.length).toBeGreaterThan(0);
    expect(lowHpEvents.length).toBeGreaterThan(0);
  });
});

// ============================================
// 需求检查测试
// ============================================
describe('需求检查', () => {
  let player: ReturnType<typeof createTestProtagonist>;

  beforeEach(() => {
    player = createTestProtagonist();
  });

  it('应该能检查等级需求', () => {
    const requirements = { minLevel: 20 };
    const result = checkRequirements(requirements, player);
    
    if (player.level < 20) {
      expect(result.satisfied).toBe(false);
      expect(result.missingReqs.length).toBeGreaterThan(0);
    } else {
      expect(result.satisfied).toBe(true);
    }
  });

  it('应该能检查属性需求', () => {
    const requirements = { stats: { 悟性: 50 } };
    const result = checkRequirements(requirements, player);
    
    if (player.stats.悟性 < 50) {
      expect(result.satisfied).toBe(false);
    } else {
      expect(result.satisfied).toBe(true);
    }
  });

  it('应该能检查灵石需求', () => {
    const requirements = { spiritStones: 1000 };
    const result = checkRequirements(requirements, player);
    
    // 检查玩家是否有足够的灵石
    const spiritStones = player.inventory.find(
      item => item.definition.id === 'spirit_stone' || item.definition.type === '灵石'
    )?.quantity || 0;
    
    if (spiritStones < 1000) {
      expect(result.satisfied).toBe(false);
    } else {
      expect(result.satisfied).toBe(true);
    }
  });
});

// ============================================
// 事件触发测试
// ============================================
describe('事件触发', () => {
  let service: EventTriggerService;
  let player: ReturnType<typeof createTestProtagonist>;

  beforeEach(() => {
    service = new EventTriggerService();
    player = createTestProtagonist();
  });

  it('应该能判断是否触发事件', () => {
    // 多次测试概率
    let triggeredCount = 0;
    const trials = 1000;
    
    for (let i = 0; i < trials; i++) {
      if (service.shouldTriggerEvent('event', player)) {
        triggeredCount++;
      }
    }
    
    // 触发率应该在合理范围内
    const triggerRate = triggeredCount / trials;
    expect(triggerRate).toBeGreaterThan(0.05); // 至少5%
    expect(triggerRate).toBeLessThan(0.4); // 最多40%
  });

  it('低血量时触发率应该提高', () => {
    const normalPlayer = createTestProtagonist();
    normalPlayer.currentHp = normalPlayer.maxHp; // 满血
    
    const lowHpPlayer = createTestProtagonist();
    lowHpPlayer.currentHp = Math.floor(lowHpPlayer.maxHp * 0.2); // 20%血量
    
    let normalTriggered = 0;
    let lowHpTriggered = 0;
    const trials = 500;
    
    for (let i = 0; i < trials; i++) {
      const normalService = new EventTriggerService();
      const lowHpService = new EventTriggerService();
      
      if (normalService.shouldTriggerEvent('event', normalPlayer)) {
        normalTriggered++;
      }
      if (lowHpService.shouldTriggerEvent('event', lowHpPlayer)) {
        lowHpTriggered++;
      }
    }
    
    // 低血量触发率应该更高
    expect(lowHpTriggered).toBeGreaterThan(normalTriggered);
  });

  it('非事件格子不应该触发事件', () => {
    expect(service.shouldTriggerEvent('enemy', player)).toBe(false);
    expect(service.shouldTriggerEvent('boss', player)).toBe(false);
    expect(service.shouldTriggerEvent('treasure', player)).toBe(false);
  });

  it('应该能选择随机事件', () => {
    const event = service.selectRandomEvent(player, 20);
    
    if (event) {
      expect(event.id).toBeDefined();
      expect(event.type).toBeDefined();
      expect(event.choices.length).toBeGreaterThan(0);
    }
  });
});

// ============================================
// 选择可用性测试
// ============================================
describe('选择可用性', () => {
  let player: ReturnType<typeof createTestProtagonist>;

  beforeEach(() => {
    player = createTestProtagonist();
  });

  it('应该能获取可用选择列表', () => {
    const event = getEventById('event_ancient_altar');
    if (!event) {
      throw new Error('Event not found');
    }
    
    const choices = getAvailableChoices(event, player);
    
    expect(choices.length).toBeGreaterThan(0);
    // 至少应该有一个"离开"选项是可用的
    expect(choices.some(c => c.choice.id === 'leave' && c.isAvailable)).toBe(true);
  });

  it('离开选项应该总是可用', () => {
    const event = getEventById('event_mystery_chest');
    if (!event) {
      throw new Error('Event not found');
    }
    
    const choices = getAvailableChoices(event, player);
    const leaveChoice = choices.find(c => c.choice.id === 'leave');
    
    expect(leaveChoice).toBeDefined();
    expect(leaveChoice?.isAvailable).toBe(true);
  });
});

// ============================================
// 快速事件处理测试
// ============================================
describe('快速事件处理', () => {
  let player: ReturnType<typeof createTestProtagonist>;

  beforeEach(() => {
    player = createTestProtagonist();
    resetEventTriggerService();
  });

  it('应该能快速处理事件', () => {
    const result = quickHandleEvent(player, {
      difficulty: 20,
      rows: 10,
      cols: 10,
    });
    
    expect(result).toBeDefined();
    expect(result.triggered).toBeDefined();
    expect(result.message).toBeDefined();
  });

  it('事件结果应该有有效的消息', () => {
    // 多次触发以测试不同结果
    for (let i = 0; i < 10; i++) {
      resetEventTriggerService();
      const result = quickHandleEvent(player, {
        difficulty: 20,
        rows: 10,
        cols: 10,
      });
      
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});

// ============================================
// 概率分布测试
// ============================================
describe('概率分布', () => {
  let service: EventTriggerService;
  let player: ReturnType<typeof createTestProtagonist>;

  beforeEach(() => {
    service = new EventTriggerService();
    player = createTestProtagonist();
  });

  it('事件选择结果概率应该符合配置', () => {
    const event = getEventById('event_ancient_altar');
    if (!event) {
      throw new Error('Event not found');
    }
    
    const prayChoice = event.choices.find(c => c.id === 'pray');
    if (!prayChoice) {
      throw new Error('Choice not found');
    }
    
    const outcomeCounts: Record<string, number> = {};
    const trials = 10000;
    
    for (let i = 0; i < trials; i++) {
      const outcome = service.executeChoice(event, 'pray', player);
      outcomeCounts[outcome.id] = (outcomeCounts[outcome.id] || 0) + 1;
    }
    
    // 检查概率分布是否接近配置
    // pray选项有三个结果：50%, 30%, 20%
    const blessingRate = outcomeCounts['blessing'] / trials;
    expect(blessingRate).toBeGreaterThan(0.4); // 应该接近50%
    expect(blessingRate).toBeLessThan(0.6);
  });
});
