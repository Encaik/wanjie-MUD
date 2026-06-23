/**
 * gameClock 命名空间单元测试
 */
import { describe, it, expect } from 'vitest';

import {
  createDefaultGameClock,
  advance,
  advanceBySeconds,
  getAge,
  getShichen,
  format,
  formatShort,
} from '../gameClock';
import { createDefaultRealClock } from '../realClock';

import type { TimeState } from '../types';

/** 创建测试用的 TimeState */
function makeTime(): TimeState {
  return {
    game: createDefaultGameClock(),
    real: createDefaultRealClock(Date.now()),
  };
}

describe('gameClock', () => {
  describe('advance', () => {
    it('修炼行为应增加对应的游戏时间', () => {
      const time = makeTime();
      const result = advance(time, 'cultivate');
      expect(result.game.totalSeconds).toBe(3600);
    });

    it('历练行为应增加 7200 秒', () => {
      const time = makeTime();
      const result = advance(time, 'explore');
      expect(result.game.totalSeconds).toBe(7200);
    });
  });

  describe('advanceBySeconds', () => {
    it('应正确推进指定秒数', () => {
      const time = makeTime();
      const result = advanceBySeconds(time, 5000);
      expect(result.game.totalSeconds).toBe(5000);
    });

    it('应正确进位时辰（每 7200 秒一个时辰）', () => {
      const time = makeTime();
      const result = advanceBySeconds(time, 7200);
      expect(result.game.shichen).toBe(2); // totalSeconds 从 0 开始：7200/7200 + 1 = 2
    });

    it('应正确进位日期（12 时辰 = 1 天）', () => {
      const time = makeTime();
      const result = advanceBySeconds(time, 7200 * 12);
      expect(result.game.day).toBe(2);
      expect(result.game.shichen).toBe(1); // 从 0 重新开始进位
    });
  });

  describe('getAge', () => {
    it('默认初始年龄为 16 岁', () => {
      const time = makeTime();
      expect(getAge(time)).toBe(16);
    });

    it('积累一年游戏时间后年龄增长', () => {
      const time = makeTime();
      const oneYear = 31536000;
      const result = advanceBySeconds(time, oneYear);
      expect(getAge(result)).toBe(17);
    });
  });

  describe('getShichen', () => {
    it('默认 shichen=6 为巳时', () => {
      const time = makeTime();
      expect(getShichen(time)).toEqual({ index: 6, name: '巳' });
    });

    it('子时为 shichen=1', () => {
      const time = makeTime();
      time.game.shichen = 1;
      expect(getShichen(time).name).toBe('子');
    });
  });

  describe('format', () => {
    it('应返回完整时间字符串', () => {
      const time = makeTime();
      const result = format(time);
      expect(result).toContain('初元1年正月1日');
      expect(result).toContain('16岁');
    });
  });

  describe('formatShort', () => {
    it('应返回简短时间字符串', () => {
      const time = makeTime();
      const result = formatShort(time);
      expect(result).toContain('第1年1月1日');
      expect(result).toContain('16岁');
    });
  });
});
