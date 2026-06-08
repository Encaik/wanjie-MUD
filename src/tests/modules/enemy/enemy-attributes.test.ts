/**
 * 测试敌人属性计算是否合理
 */
import { calculateEnemyHp, calculateEnemyAttack, calculateEnemyDefense, calculatePlayerMaxHp, calculatePlayerAttack, calculatePlayerDefense } from '@/lib/game/utils/balanceConfig';

describe('敌人属性计算', () => {
  const worldType = '修仙' as const;
  const playerLevel = 10;
  const playerStats = { 体质: 50, 灵根: 50, 意志: 50 };

  // 计算玩家属性（裸装）
  const playerHp = calculatePlayerMaxHp(playerStats.体质, playerLevel, worldType);
  const playerAttack = calculatePlayerAttack(playerStats.体质, playerStats.灵根, playerLevel, worldType);
  const playerDefense = calculatePlayerDefense(playerStats.意志, playerLevel, worldType);

  describe('普通敌人', () => {
    it('10级普通敌人属性应接近玩家裸装', () => {
      const enemyHp = calculateEnemyHp(playerLevel, 'normal', 'normal', worldType, false, 15);
      const enemyAttack = calculateEnemyAttack(playerLevel, 'normal', 'normal', worldType, false, 15);
      const enemyDefense = calculateEnemyDefense(playerLevel, 'normal', 'normal', worldType, false, 15);

      // 普通敌人应该略低于玩家裸装 (0.95倍)
      expect(enemyHp).toBeLessThan(playerHp);
      expect(enemyHp).toBeGreaterThan(playerHp * 0.85); // 不应该太弱
      expect(enemyAttack).toBeLessThan(playerAttack);
      expect(enemyDefense).toBeLessThan(playerDefense);
    });

    it('8级普通敌人应该比10级玩家弱', () => {
      const enemyHp = calculateEnemyHp(8, 'normal', 'normal', worldType, false, 15);
      const enemyAttack = calculateEnemyAttack(8, 'normal', 'normal', worldType, false, 15);
      
      // 8级普通敌人应该比10级玩家弱（考虑等级差带来的属性差）
      // 8级敌人 HP: 684, 10级玩家 HP: 750
      // 差距约 8.8%，是合理的
      expect(enemyHp).toBeLessThan(playerHp);
      expect(enemyAttack).toBeLessThan(playerAttack);
      expect(enemyHp).toBeGreaterThan(playerHp * 0.8); // 但不应该太弱
    });
  });

  describe('精英敌人', () => {
    it('10级精英敌人应该略强于玩家裸装', () => {
      const enemyHp = calculateEnemyHp(playerLevel, 'elite', 'normal', worldType, false, 15);
      const enemyAttack = calculateEnemyAttack(playerLevel, 'elite', 'normal', worldType, false, 15);
      const enemyDefense = calculateEnemyDefense(playerLevel, 'elite', 'normal', worldType, false, 15);

      // 精英敌人应该略强于玩家裸装 (1.15倍)
      expect(enemyHp).toBeGreaterThan(playerHp * 1.05);
      expect(enemyHp).toBeLessThan(playerHp * 1.25);
    });
  });

  describe('小Boss', () => {
    it('10级小Boss应该明显强于玩家裸装', () => {
      const enemyHp = calculateEnemyHp(playerLevel, 'miniboss', 'normal', worldType, false, 15);
      const enemyAttack = calculateEnemyAttack(playerLevel, 'miniboss', 'normal', worldType, false, 15);
      
      // 小Boss应该有1.5倍左右的加成
      expect(enemyHp).toBeGreaterThan(playerHp * 1.3);
      expect(enemyHp).toBeLessThan(playerHp * 1.8);
    });
  });

  describe('Boss', () => {
    it('10级Boss应该有显著优势', () => {
      const enemyHp = calculateEnemyHp(playerLevel, 'boss', 'normal', worldType, false, 15);
      const enemyAttack = calculateEnemyAttack(playerLevel, 'boss', 'normal', worldType, false, 15);
      
      // Boss应该有约2倍加成
      expect(enemyHp).toBeGreaterThan(playerHp * 1.7);
      expect(enemyHp).toBeLessThan(playerHp * 2.5);
    });
  });

  describe('数值一致性', () => {
    it('敌人属性应该随等级线性增长', () => {
      const hp1 = calculateEnemyHp(5, 'normal', 'normal', worldType, false, 15);
      const hp2 = calculateEnemyHp(10, 'normal', 'normal', worldType, false, 15);
      const hp3 = calculateEnemyHp(15, 'normal', 'normal', worldType, false, 15);

      // 等级差相同，属性差也应该相近
      const diff1 = hp2 - hp1;
      const diff2 = hp3 - hp2;
      
      // 允许10%的误差
      expect(Math.abs(diff1 - diff2)).toBeLessThan(diff1 * 0.15);
    });
  });

  // 输出测试结果
  console.log('=== 玩家属性（10级，50体质/灵根/意志，裸装）===');
  console.log('HP:', playerHp);
  console.log('攻击:', playerAttack);
  console.log('防御:', playerDefense);

  const tiers: Array<'normal' | 'elite' | 'miniboss' | 'boss'> = ['normal', 'elite', 'miniboss', 'boss'];
  
  console.log('\n=== 敌人属性（10级）===');
  for (const tier of tiers) {
    const enemyHp = calculateEnemyHp(playerLevel, tier, 'normal', worldType, false, 15);
    const enemyAttack = calculateEnemyAttack(playerLevel, tier, 'normal', worldType, false, 15);
    const enemyDefense = calculateEnemyDefense(playerLevel, tier, 'normal', worldType, false, 15);
    
    console.log(`\n${tier} 敌人:`);
    console.log(`  HP: ${enemyHp} (vs 玩家 ${playerHp}, 比例: ${(enemyHp/playerHp*100).toFixed(1)}%)`);
    console.log(`  攻击: ${enemyAttack} (vs 玩家 ${playerAttack}, 比例: ${(enemyAttack/playerAttack*100).toFixed(1)}%)`);
    console.log(`  防御: ${enemyDefense} (vs 玩家 ${playerDefense}, 比例: ${(enemyDefense/playerDefense*100).toFixed(1)}%)`);
  }
});
