/**
 * 游戏消息装饰器
 *
 * 提供 @GameMessage 和 @GameMessageClass 装饰器，自动将方法执行
 * 转化为游戏消息框中的消息记录。装饰器通过 MessageManager 广播消息。
 *
 * @module core/message-log
 */

import { getMessageManager } from './messageManager';

import type { GameMessageOptions, GameMessageClassOptions } from './types';

// ============================================
// 内部工具函数
// ============================================

/**
 * 解析消息选项的值（静态字符串或生成器函数）
 */
function resolveValue(
  value: string | ((args: unknown[], result: unknown) => string),
  args: unknown[],
  result: unknown
): string {
  return typeof value === 'function' ? value(args, result) : value;
}

/**
 * 为单个方法创建消息生成包装
 *
 * @param method - 原始方法
 * @param methodName - 方法名（用于日志标识）
 * @param options - 消息配置
 * @returns 包装后的方法
 */
function wrapMethod<T extends (...args: unknown[]) => unknown>(
  method: T,
  methodName: string,
  options: GameMessageOptions
): T {
  const wrapped = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const result = method.apply(this, args);

    // 仅当方法正常返回时生成消息（异常不生成）
    try {
      const title = resolveValue(options.title, args, result);
      const content = resolveValue(options.content, args, result);

      getMessageManager().broadcast({
        channel: options.channel,
        level: options.level || 'info',
        title,
        content,
      });
    } catch {
      // 消息生成失败不影响业务逻辑
    }

    return result as ReturnType<T>;
  };

  // 保留原方法名
  Object.defineProperty(wrapped, 'name', { value: methodName });

  return wrapped as T;
}

// ============================================
// 方法装饰器
// ============================================

/**
 * 游戏消息方法装饰器
 *
 * 装饰的方法成功返回时，自动根据配置从参数和返回值生成
 * 游戏消息并通过 MessageManager 广播。
 *
 * @param options - 消息配置
 * @returns 方法装饰器
 *
 * @example
 * class CultivationService {
 *   @GameMessage({
 *     channel: 'cultivation',
 *     title: '修炼完成',
 *     content: (args, result) => `获得 ${result.experience} 点修炼经验`,
 *     level: 'success',
 *   })
 *   cultivate(player: Protagonist, hours: number): CultivationResult {
 *     // 原有逻辑
 *   }
 * }
 */
export function GameMessage(options: GameMessageOptions) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new Error(
        `@GameMessage 只能用于方法，但 "${propertyKey}" 不是函数`
      );
    }

    descriptor.value = wrapMethod(originalMethod, propertyKey, options);

    return descriptor;
  };
}

// ============================================
// 异步方法装饰器
// ============================================

/**
 * 游戏消息异步方法装饰器
 *
 * 与 @GameMessage 类似，但适用于返回 Promise 的异步方法。
 * 等待 Promise resolve 后生成消息。
 *
 * @param options - 消息配置
 * @returns 方法装饰器
 *
 * @example
 * class NetworkService {
 *   @GameMessageAsync({
 *     channel: 'system',
 *     title: '数据同步完成',
 *     content: (args, result) => `同步了 ${result.count} 条记录`,
 *   })
 *   async syncData(): Promise<SyncResult> {
 *     // 原有逻辑
 *   }
 * }
 */
export function GameMessageAsync(options: GameMessageOptions) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new Error(
        `@GameMessageAsync 只能用于方法，但 "${propertyKey}" 不是函数`
      );
    }

    const wrapped = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      const result = await originalMethod.apply(this, args);

      // 仅当 Promise resolve 时生成消息
      try {
        const title = resolveValue(options.title, args, result);
        const content = resolveValue(options.content, args, result);

        getMessageManager().broadcast({
          channel: options.channel,
          level: options.level || 'info',
          title,
          content,
        });
      } catch {
        // 消息生成失败不影响业务逻辑
      }

      return result;
    };

    Object.defineProperty(wrapped, 'name', { value: propertyKey });

    descriptor.value = wrapped;
    return descriptor;
  };
}

// ============================================
// 类装饰器
// ============================================

/**
 * 游戏消息类装饰器
 *
 * 对类中所有公共方法（不含构造函数）自动生成游戏消息。
 * 消息标题默认为方法名，可通过 exclude 排除特定方法。
 *
 * @param options - 类级消息配置
 * @returns 类装饰器
 *
 * @example
 * @GameMessageClass({ channel: 'economy', exclude: ['toString'] })
 * class EconomyService {
 *   buy() { ... }   // 自动生成 channel='economy' 的消息
 *   sell() { ... }  // 自动生成 channel='economy' 的消息
 * }
 */
export function GameMessageClass(options: GameMessageClassOptions) {
  return function <T extends new (...args: unknown[]) => object>(
    constructor: T
  ): T {
    const excludeSet = new Set(options.exclude || []);
    const prototype = constructor.prototype;

    // 遍历原型上的所有自有属性
    const propertyNames = Object.getOwnPropertyNames(prototype);

    for (const name of propertyNames) {
      // 跳过构造函数、排除列表中的方法、非函数属性
      if (name === 'constructor' || excludeSet.has(name)) continue;

      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      if (!descriptor || typeof descriptor.value !== 'function') continue;

      // 为每个方法创建消息配置
      const methodOptions: GameMessageOptions = {
        channel: options.channel,
        level: options.level || 'info',
        title: name, // 默认标题为方法名
        content: (args: unknown[], result: unknown) =>
          `${name} 执行完成，返回: ${JSON.stringify(result)}`,
      };

      const wrappedDescriptor = GameMessage(methodOptions)(
        prototype,
        name,
        descriptor
      );

      Object.defineProperty(prototype, name, wrappedDescriptor!);
    }

    return constructor;
  };
}
