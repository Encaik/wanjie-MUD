/**
 * cooldown 命名空间单元测试
 */
import { describe, it, expect } from 'vitest';

import { createDefaultGameClock } from '../gameClock';
import { createDefaultRealClock } from '../realClock';
import { set, remove, isActive, remaining, progress, clearExpired } from '../cooldown';
import type { TimeState } from '../types';

const NOW = 1000000000000;

function makeTime(serverNow: number = NOW): TimeState {
  return {
    game: createDefaultGameClock(),
    real: createDefaultRealClock(serverNow),
  };
}

describe('cooldown', () => {
  describe('set / isActive / remaining / progress', () => {
    it('设置冷却后应处于激活状态', () => {
      let time = makeTime(NOW);
      time = set(time, 'explore', 30000, NOW);
      expect(isActive(time, 'explore', NOW)).toBe(true);
    });

    it('冷却结束后不再激活', () => {
      let time = makeTime(NOW);
      time = set(time, 'explore', 30000, NOW);
      expect(isActive(time, 'explore', NOW + 30001)).toBe(false);
    });

    it('冷却不存在时 isActive 返回 false', () => {
      const time = makeTime(NOW);
      expect(isActive(time, 'nonexistent', NOW)).toBe(false);
    });

    it('应正确计算剩余时间', () => {
      let time = makeTime(NOW);
      time = set(time, 'explore', 30000, NOW);
      expect(remaining(time, 'explore', NOW + 10000)).toBe(20000);
    });

    it('冷却结束时剩余时间返回 0', () => {
      let time = makeTime(NOW);
      time = set(time, 'explore', 30000, NOW);
      expect(remaining(time, 'explore', NOW + 35000)).toBe(0);
    });

    it('应正确计算进度', () => {
      let time = makeTime(NOW);
      time = set(time, 'explore', 30000, NOW);
      expect(progress(time, 'explore', NOW + 15000)).toBeCloseTo(0.5, 1);
    });

    it('冷却结束时进度返回 1', () => {
      let time = makeTime(NOW);
      time = set(time, 'explore', 30000, NOW);
      expect(progress(time, 'explore', NOW + 30000)).toBe(1);
    });
  });

  describe('remove', () => {
    it('移除冷却后不再激活', () => {
      let time = makeTime(NOW);
      time = set(time, 'explore', 30000, NOW);
      time = remove(time, 'explore');
      expect(isActive(time, 'explore', NOW)).toBe(false);
    });
  });

  describe('clearExpired', () => {
    it('应清理所有过期冷却', () => {
      let time = makeTime(NOW);
      time = set(time, 'explore', 10000, NOW);
      time = set(time, 'cultivate', 50000, NOW);
      const { time: cleaned, expired } = clearExpired(time, NOW + 20000);
      expect(expired).toContain('explore');
      expect(expired).not.toContain('cultivate');
      expect(isActive(cleaned, 'explore', NOW + 20000)).toBe(false);
      expect(isActive(cleaned, 'cultivate', NOW + 20000)).toBe(true);
    });

    it('无过期冷却时不返回过期 ID', () => {
      let time = makeTime(NOW);
      time = set(time, 'cultivate', 50000, NOW);
      const { expired } = clearExpired(time, NOW + 10000);
      expect(expired.length).toBe(0);
    });
  });
});
