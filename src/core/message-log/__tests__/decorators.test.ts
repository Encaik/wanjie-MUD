/**
 * 游戏消息装饰器单元测试
 *
 * 注意：装饰器测试需要 TypeScript experimentalDecorators 支持。
 * 测试环境（vitest + tsconfig）已配置该选项。
 */
import { describe, it, expect, afterEach } from 'vitest';

import { GameMessage, GameMessageAsync, GameMessageClass } from '../decorators';
import { getMessageManager, resetMessageManager } from '../messageManager';

afterEach(() => {
  resetMessageManager();
});

// ============================================
// @GameMessage 测试
// ============================================

describe('@GameMessage', () => {
  it('方法成功返回时生成游戏消息（静态标题/内容）', () => {
    class TestService {
      @GameMessage({
        channel: 'system',
        title: '测试标题',
        content: '测试内容',
        level: 'success',
      })
      doSomething(): string {
        return 'result';
      }
    }

    const service = new TestService();
    service.doSomething();

    const messages = getMessageManager().getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].channel).toBe('system');
    expect(messages[0].title).toBe('测试标题');
    expect(messages[0].content).toBe('测试内容');
    expect(messages[0].type).toBe('success');
  });

  it('应支持函数式标题和内容生成', () => {
    class TestService {
      @GameMessage({
        channel: 'combat',
        title: (args) => `攻击 ${args[0]}`,
        content: (_args, result) => `造成了 ${result} 点伤害`,
        level: 'info',
      })
      attack(_target: string): number {
        return 100;
      }
    }

    const service = new TestService();
    service.attack('妖兽');

    const messages = getMessageManager().getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].title).toBe('攻击 妖兽');
    expect(messages[0].content).toBe('造成了 100 点伤害');
  });

  it('方法抛出异常时不生成消息', () => {
    class TestService {
      @GameMessage({
        channel: 'system',
        title: '不应该出现',
        content: '不应该出现',
      })
      throwError(): string {
        throw new Error('测试异常');
      }
    }

    const service = new TestService();
    expect(() => service.throwError()).toThrow('测试异常');

    // 不应该有消息生成
    const messages = getMessageManager().getMessages();
    expect(messages).toHaveLength(0);
  });

  it('未指定 level 时默认使用 info', () => {
    class TestService {
      @GameMessage({
        channel: 'exploration',
        title: '探索',
        content: '完成探索',
      })
      explore(): string {
        return 'done';
      }
    }

    const service = new TestService();
    service.explore();

    expect(getMessageManager().getMessages()[0].type).toBe('info');
  });
});

// ============================================
// @GameMessageAsync 测试
// ============================================

describe('@GameMessageAsync', () => {
  it('异步方法 resolve 后生成消息', async () => {
    class TestService {
      @GameMessageAsync({
        channel: 'system',
        title: '同步完成',
        content: (_args, result) => `同步了 ${(result as { count: number }).count} 条`,
      })
      async sync(): Promise<{ count: number }> {
        return { count: 42 };
      }
    }

    const service = new TestService();
    await service.sync();

    const messages = getMessageManager().getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('同步了 42 条');
  });

  it('异步方法 reject 时不生成消息', async () => {
    class TestService {
      @GameMessageAsync({
        channel: 'system',
        title: '不应该',
        content: '不应该',
      })
      async fail(): Promise<void> {
        throw new Error('异步错误');
      }
    }

    const service = new TestService();
    await expect(service.fail()).rejects.toThrow('异步错误');

    expect(getMessageManager().getMessages()).toHaveLength(0);
  });
});

// ============================================
// @GameMessageClass 测试
// ============================================

describe('@GameMessageClass', () => {
  it('应为所有公共方法生成消息', () => {
    @GameMessageClass({ channel: 'economy' })
    class EconomyService {
      buy(): string {
        return '买入成功';
      }

      sell(): string {
        return '卖出成功';
      }
    }

    const service = new EconomyService();
    service.buy();
    service.sell();

    const messages = getMessageManager().getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].channel).toBe('economy');
    expect(messages[1].channel).toBe('economy');
  });

  it('应排除指定方法', () => {
    @GameMessageClass({ channel: 'system', exclude: ['toString'] })
    class TestService {
      doWork(): string {
        return 'done';
      }

      toString(): string {
        return 'TestService';
      }
    }

    const service = new TestService();
    service.doWork();
    service.toString();

    // 只有一个消息（toString 被排除）
    const messages = getMessageManager().getMessages();
    expect(messages).toHaveLength(1);
  });

  it('不应为构造函数生成消息', () => {
    @GameMessageClass({ channel: 'system' })
    class TestService {
      constructor() {
        // 构造逻辑
      }
    }

    // 构造时不应生成消息
    new TestService();
    expect(getMessageManager().getMessages()).toHaveLength(0);
  });
});
