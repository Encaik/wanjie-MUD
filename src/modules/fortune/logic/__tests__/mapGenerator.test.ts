/**
 * mapGenerator 单元测试
 */

import { describe, it, expect } from 'vitest';

import { generateFortuneMap, manhattanDistance } from '../mapGenerator';

describe('mapGenerator', () => {
  describe('generateFortuneMap', () => {
    it('生成 F1 灵矿脉地图，网格 7×7', () => {
      const map = generateFortuneMap('spirit_vein', 1, 1, 42);
      expect(map.rows).toBe(7);  // 5 + 2*1
      expect(map.cols).toBe(7);
      expect(map.depth).toBe(1);
      expect(map.fortuneType).toBe('spirit_vein');
    });

    it('F3 深度网格 11×11', () => {
      const map = generateFortuneMap('ancient_battlefield', 3, 20, 42);
      expect(map.rows).toBe(11); // 5 + 2*3
    });

    it('相同种子生成相同地图', () => {
      const a = generateFortuneMap('mystic_realm', 2, 15, 12345);
      const b = generateFortuneMap('mystic_realm', 2, 15, 12345);
      // 检查网格结构一致
      expect(a.rows).toBe(b.rows);
      expect(a.cols).toBe(b.cols);
      expect(a.playerStart).toEqual(b.playerStart);
      expect(a.floorExit).toEqual(b.floorExit);
      // 地形一致
      for (let r = 0; r < a.rows; r++) {
        for (let c = 0; c < a.cols; c++) {
          expect(a.grid[r][c].terrain).toBe(b.grid[r][c].terrain);
        }
      }
    });

    it('起点在地图左侧', () => {
      const map = generateFortuneMap('herb_valley', 1, 1, 99);
      expect(map.playerStart.col).toBe(0);
    });

    it('出口在地图右侧', () => {
      const map = generateFortuneMap('demon_abyss', 2, 50, 77);
      expect(map.floorExit.col).toBe(map.cols - 1);
    });

    it('出口必有守卫节点', () => {
      const map = generateFortuneMap('spirit_vein', 1, 10, 1);
      const exitCell = map.grid[map.floorExit.row][map.floorExit.col];
      expect(exitCell.node).not.toBeNull();
      expect(exitCell.node!.type).toBe('guardian');
    });

    it('所有格子都有地形类型', () => {
      const map = generateFortuneMap('mystic_realm', 1, 1, 5);
      for (let r = 0; r < map.rows; r++) {
        for (let c = 0; c < map.cols; c++) {
          expect(map.grid[r][c].terrain).toBeDefined();
        }
      }
    });

    it('不同种子生成不同地图', () => {
      const a = generateFortuneMap('spirit_vein', 2, 10, 1);
      const b = generateFortuneMap('spirit_vein', 2, 10, 999);
      // 大概率不同（比较地形分布）
      let sameCount = 0;
      for (let r = 0; r < a.rows; r++) {
        for (let c = 0; c < a.cols; c++) {
          if (a.grid[r][c].terrain === b.grid[r][c].terrain) sameCount++;
        }
      }
      // 不太可能完全相同
      expect(sameCount).toBeLessThan(a.rows * a.cols);
    });
  });

  describe('manhattanDistance', () => {
    it('同行相邻距离=1', () => {
      expect(manhattanDistance({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(1);
    });
    it('对角线距离=2', () => {
      expect(manhattanDistance({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe(2);
    });
    it('同位置距离=0', () => {
      expect(manhattanDistance({ row: 5, col: 3 }, { row: 5, col: 3 })).toBe(0);
    });
  });
});
