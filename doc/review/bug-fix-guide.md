# 万界修仙录 - Bug修复指南

> 本文档基于 game-design-strict 技能的 Bug 模式库，针对项目中已识别的问题提供详细修复方案

---

## 📋 已识别问题清单

| 编号 | 类型 | 严重度 | 状态 | 位置 |
|------|------|--------|------|------|
| BUG-001 | 存档损坏风险 | P0 | ✅ 已修复 | useGameState.tsx |
| BUG-002 | 数值负数风险 | P0 | ✅ 已修复 | adventure.ts |
| BUG-003 | 除零/负防御风险 | P0 | ✅ 已修复 | balanceConfig.ts |
| BUG-004 | 战斗判定不公 | P1 | ✅ 已修复 | adventure.ts |
| BUG-005 | 经验无限累积 | P1 | ✅ 已修复 | cultivation.ts |
| BUG-006 | 数值溢出 | P1 | ✅ 已修复 | constants.ts |
| BUG-007 | 数组越界 | P1 | ✅ 已修复 | useGameHooks.ts |
| BUG-008 | 内存泄漏 | P1 | ✅ 已修复 | useGameState.tsx |

---

## 🔴 P0级修复方案

### BUG-001: 存档覆盖风险

**Bug模式**: 存档损坏

**症状**:
- 写入过程中断导致数据不完整
- 无备份机制，损坏后无法恢复

**当前代码** (`useGameState.tsx` Line ~200):
```typescript
useEffect(() => {
  if (!isInitialized.current) return;
  if (gameState.phase === 'character-select') return;
  
  try {
    localStorage.setItem('gameState', JSON.stringify(gameState));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}, [gameState]);
```

**修复后代码**:
```typescript
/**
 * 安全存档函数
 * 实现：备份 + 原子写入 + 错误回滚
 */
function safeSaveGameState(state: GameState): { success: boolean; error?: string } {
  const STORAGE_KEY = 'gameState';
  const BACKUP_KEY = 'gameState_backup';
  const TEMP_KEY = 'gameState_temp';
  
  try {
    const json = JSON.stringify(state);
    
    // 1. 检查存储空间
    const usedSpace = JSON.stringify(localStorage).length;
    const newItemSize = json.length;
    // localStorage 通常限制 5MB
    if (usedSpace + newItemSize > 4.5 * 1024 * 1024) {
      // 清理旧消息减少存储占用
      const compressedState = {
        ...state,
        messages: state.messages.slice(0, 50),
      };
      return safeSaveGameState(compressedState);
    }
    
    // 2. 备份当前存档
    const currentSave = localStorage.getItem(STORAGE_KEY);
    if (currentSave) {
      localStorage.setItem(BACKUP_KEY, currentSave);
    }
    
    // 3. 原子写入（先写临时文件）
    localStorage.setItem(TEMP_KEY, json);
    
    // 4. 切换（原子操作模拟）
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, json);
    localStorage.removeItem(TEMP_KEY);
    
    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    
    // 5. 回滚
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      try {
        localStorage.setItem(STORAGE_KEY, backup);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    
    return { success: false, error };
  }
}

// 使用
useEffect(() => {
  if (!isInitialized.current) return;
  if (gameState.phase === 'character-select') return;
  
  const result = safeSaveGameState(gameState);
  if (!result.success) {
    // 通知用户
    console.error('Save failed:', result.error);
    // 可以触发 UI 警告
  }
}, [gameState]);
```

**存档恢复函数**:
```typescript
function loadGameStateWithRecovery(): GameState | null {
  const STORAGE_KEY = 'gameState';
  const BACKUP_KEY = 'gameState_backup';
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 验证基本结构
      if (parsed && parsed.phase) {
        return parsed;
      }
    }
    
    // 主存档损坏，尝试备份
    console.warn('Main save corrupted, trying backup...');
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      const parsed = JSON.parse(backup);
      if (parsed && parsed.phase) {
        // 恢复主存档
        localStorage.setItem(STORAGE_KEY, backup);
        return parsed;
      }
    }
    
    return null;
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}
```

---

### BUG-002: HP/MP 负数风险

**Bug模式**: 数值溢出/下溢

**症状**:
- 战斗中 HP 显示负数
- 恢复计算异常

**当前代码** (`adventure.ts`):
```typescript
// 仅在最终约束
result.playerHpAfter = battleState.playerCurrentHp;
```

**修复后代码**:
```typescript
/**
 * HP/MP 安全操作工具函数
 */
export function clampHpMp(
  current: number, 
  max: number, 
  min: number = 0
): { current: number; max: number } {
  return {
    current: Math.max(min, Math.min(current, max)),
    max: Math.max(min, max), // max 也需要有下限
  };
}

// 在每次 HP 变化后立即约束
function applyDamage(state: BattleState, damage: number): void {
  state.playerCurrentHp = Math.max(0, state.playerCurrentHp - damage);
  // 确保不超过上限（恢复时）
  state.playerCurrentHp = Math.min(state.playerCurrentHp, state.playerMaxHp);
}

function applyHeal(state: BattleState, heal: number): void {
  state.playerCurrentHp = Math.max(0, state.playerCurrentHp + heal);
  state.playerCurrentHp = Math.min(state.playerCurrentHp, state.playerMaxHp);
}

// 在 battleState 初始化时也要约束
const battleState: BattleState = {
  // ...
  playerCurrentHp: Math.max(0, Math.min(protagonist.currentHp, playerMaxHp)),
  // ...
};
```

---

### BUG-003: 除零/负防御风险

**Bug模式**: 数值计算类Bug - 除零错误

**症状**:
- 负防御导致伤害异常放大
- 数值计算出现 NaN

**当前代码** (`balanceConfig.ts`):
```typescript
export function calculateDamage(
  attack: number,
  defense: number,
  levelDiff: number = 0
): number {
  // ...
  let damage = attack * (defenseReductionFactor / (defenseReductionFactor + defense));
  // ...
}
```

**修复后代码**:
```typescript
/**
 * 安全数值计算工具函数
 */
export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function calculateDamage(
  attack: number,
  defense: number,
  levelDiff: number = 0
): number {
  const { 
    damageVariance, 
    defenseReductionFactor, 
    levelDiffDamageFactor, 
    maxLevelDiffModifier 
  } = COMBAT_CONFIG;
  
  // 1. 参数约束
  const safeAttack = clampNumber(attack, 1, 999999);
  const safeDefense = clampNumber(defense, 0, 999999); // 防御最小为 0
  const safeLevelDiff = clampNumber(levelDiff, -100, 100);
  
  // 2. 基础伤害（防御最小为 0，确保分母有效）
  let damage = safeAttack * (defenseReductionFactor / (defenseReductionFactor + safeDefense));
  
  // 3. 等级差距修正
  const levelModifier = clampNumber(
    safeLevelDiff * levelDiffDamageFactor,
    -maxLevelDiffModifier,
    maxLevelDiffModifier
  );
  damage *= (1 + levelModifier);
  
  // 4. 随机浮动
  const variance = 1 - damageVariance + Math.random() * damageVariance * 2;
  damage *= clampNumber(variance, 0.5, 1.5); // 约束浮动范围
  
  // 5. 最终约束
  return Math.max(1, Math.floor(damage));
}

// 同样修复其他计算函数
export function calculateCritRate(luck: number): number {
  const { baseCritRate, critRatePerLuck, maxCritRate } = COMBAT_CONFIG;
  const safeLuck = clampNumber(luck, 0, 1000);
  return Math.min(maxCritRate, baseCritRate + safeLuck * critRatePerLuck);
}

export function calculateDodgeRate(luck: number): number {
  const { baseDodgeRate, dodgeRatePerLuck, maxDodgeRate } = COMBAT_CONFIG;
  const safeLuck = clampNumber(luck, 0, 1000);
  return Math.min(maxDodgeRate, baseDodgeRate + safeLuck * dodgeRatePerLuck);
}
```

---

## 🟠 P1级修复方案

### BUG-004: 战斗判定不公平

**Bug模式**: 逻辑完整性问题

**问题分析**:
- 当前使用绝对 HP 比较
- 忽略了最大 HP 差异
- 对高血量玩家/敌人不公平

**当前代码**:
```typescript
battleState.victory = battleState.playerCurrentHp > battleState.enemyCurrentHp;
```

**修复后代码**:
```typescript
// 超时判定 - 使用 HP 百分比
if (!battleState.isOver) {
  battleState.isOver = true;
  
  // 计算双方剩余 HP 百分比
  const playerHpPercent = clampNumber(
    battleState.playerCurrentHp / Math.max(1, battleState.playerMaxHp),
    0,
    1
  );
  const enemyHpPercent = clampNumber(
    battleState.enemyCurrentHp / Math.max(1, battleState.enemyMaxHp),
    0,
    1
  );
  
  // 百分比高者获胜
  if (playerHpPercent > enemyHpPercent) {
    battleState.victory = true;
  } else if (playerHpPercent < enemyHpPercent) {
    battleState.victory = false;
  } else {
    // 百分比相同，使用战力比较
    battleState.victory = battleState.playerCombatPower >= battleState.enemyCombatPower;
  }
  
  battleState.logs.push({
    round: battleState.currentRound,
    attacker: 'player',
    action: battleState.victory 
      ? `战斗僵持，你略占上风！(HP: ${Math.floor(playerHpPercent * 100)}% vs ${Math.floor(enemyHpPercent * 100)}%)` 
      : `战斗僵持，敌人更强！(HP: ${Math.floor(playerHpPercent * 100)}% vs ${Math.floor(enemyHpPercent * 100)}%)`,
    special: 'draw'
  });
}
```

---

### BUG-005: 经验无限累积

**Bug模式**: 数值系统问题

**问题分析**:
- `overflowExperience` 无上限
- 后期可累积大量溢出经验
- 导致突破过于容易

**修复后代码**:
```typescript
// 在 types.ts 或 constants.ts 中定义
export const EXPERIENCE_CONSTRAINTS = {
  /** 最大溢出经验倍率（相对于当前等级所需经验） */
  MAX_OVERFLOW_MULTIPLIER: 2,
  /** 溢出经验转化突破率的效率 */
  OVERFLOW_TO_BREAKTHROUGH_RATE: 0.1,
};

// 在 cultivation.ts 中使用
function calculateOverflowPenalty(overflowExp: number, maxExp: number): number {
  // 限制溢出经验上限
  const maxOverflow = maxExp * EXPERIENCE_CONSTRAINTS.MAX_OVERFLOW_MULTIPLIER;
  const clampedOverflow = Math.min(overflowExp, maxOverflow);
  
  // 溢出越多，惩罚越大，但最大不超过 60%
  const ratio = clampedOverflow / (maxExp * 2);
  return Math.min(ratio * 0.6, 0.6);
}

// 在突破率计算中
export function calculateBreakthroughRate(
  level: number, 
  luck: number, 
  breakthroughBoost: number = 0,
  overflowExperience: number = 0,
  maxExp: number = 0
): number {
  // ... 现有逻辑 ...
  
  // 限制溢出经验加成（最多 15%）
  const maxOverflow = maxExp * EXPERIENCE_CONSTRAINTS.MAX_OVERFLOW_MULTIPLIER;
  const clampedOverflow = Math.min(overflowExperience, maxOverflow);
  const overflowBonus = maxExp > 0 ? Math.min(clampedOverflow / maxExp * 10, 15) : 0;
  
  // 总概率，上限 100%
  return Math.min(100, baseBreakthroughRate + luckBonus + breakthroughBoost + overflowBonus);
}
```

---

### BUG-006: 数值溢出

**Bug模式**: 数值溢出

**修复后代码**:
```typescript
// 在 constants.ts 中添加
export const VALUE_LIMITS = {
  /** 最大属性值 */
  MAX_STAT: 99999,
  /** 最大等级 */
  MAX_LEVEL: 100,
  /** 最大资源数量 */
  MAX_RESOURCE: 999999999, // 10亿
  /** 最大击杀数 */
  MAX_KILLS: 999999999,
  /** 最大经验值 */
  MAX_EXPERIENCE: 999999999,
} as const;

// 安全增量函数
export function safeIncrement(current: number, delta: number, max: number): number {
  const result = current + delta;
  if (!Number.isFinite(result)) return max;
  return Math.max(0, Math.min(result, max));
}

// 在 statistics 更新时使用
state.statistics = {
  ...state.statistics,
  totalEnemiesKilled: safeIncrement(
    state.statistics.totalEnemiesKilled, 
    1, 
    VALUE_LIMITS.MAX_KILLS
  ),
  totalBossKilled: safeIncrement(
    state.statistics.totalBossKilled, 
    1, 
    VALUE_LIMITS.MAX_KILLS
  ),
  // ...
};
```

---

### BUG-007: 数组越界

**Bug模式**: 资源管理类Bug

**修复后代码**:
```typescript
// 在 types.ts 中已定义
export const TECHNIQUE_SLOT_COUNT = 3;

// 添加安全访问函数
export function getTechniqueAtSlot(
  techniques: (Technique | null)[],
  index: number
): Technique | null {
  if (index < 0 || index >= TECHNIQUE_SLOT_COUNT) {
    console.warn(`Invalid technique slot index: ${index}`);
    return null;
  }
  return techniques[index] ?? null;
}

export function setTechniqueAtSlot(
  techniques: (Technique | null)[],
  technique: Technique,
  index: number
): (Technique | null)[] {
  if (index < 0 || index >= TECHNIQUE_SLOT_COUNT) {
    throw new Error(`Invalid technique slot index: ${index}`);
  }
  
  const newTechniques = [...techniques];
  // 确保数组长度正确
  while (newTechniques.length < TECHNIQUE_SLOT_COUNT) {
    newTechniques.push(null);
  }
  
  newTechniques[index] = technique;
  return newTechniques;
}

// 在 useGameState.tsx 中使用
const equipTechniqueAtIndex = useCallback((
  technique: Technique, 
  index: number,
  type: 'attack' | 'defense'
) => {
  setGameState(prev => {
    if (!prev.protagonist) return prev;
    
    try {
      const slots = type === 'attack' 
        ? prev.protagonist.equippedAttackTechniques 
        : prev.protagonist.equippedDefenseTechniques;
      
      const newSlots = setTechniqueAtSlot(slots, technique, index);
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          [type === 'attack' ? 'equippedAttackTechniques' : 'equippedDefenseTechniques']: newSlots,
        },
      };
    } catch (e) {
      console.error('Failed to equip technique:', e);
      return prev;
    }
  });
}, []);
```

---

### BUG-008: 内存泄漏

**Bug模式**: 资源管理类Bug - 内存泄漏

**修复后代码**:
```typescript
// 在 useGameState.tsx 或专门的 hook 中
import { useEffect, useRef } from 'react';
import { gameEventManager } from '@/lib/game/eventManager';
import { achievementSystem } from '@/lib/game/achievementSystem';
import { collectionSystem } from '@/lib/game/collectionSystem';

export function useGameSystems() {
  const initializedRef = useRef(false);
  
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // 初始化系统
    // 系统已在 gameSystems.ts 中初始化
    
    return () => {
      // 清理：组件卸载时销毁系统
      achievementSystem.destroy();
      collectionSystem.destroy();
      gameEventManager.removeAllListeners();
      
      initializedRef.current = false;
    };
  }, []);
}

// 在 GameProvider 中使用
export function GameProvider({ children }: { children: React.ReactNode }) {
  useGameSystems(); // 确保系统在组件卸载时清理
  
  // ... 其他逻辑 ...
}
```

---

## 🔧 通用修复工具函数

```typescript
/**
 * 数值约束工具集
 * 放置于 src/lib/game/utils/numberUtils.ts
 */

/** 数值约束 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/** 非负数约束 */
export function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

/** 安全除法（避免除零） */
export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (denominator === 0 || !Number.isFinite(denominator)) {
    return fallback;
  }
  return numerator / denominator;
}

/** 安全百分比（0-1范围） */
export function clampPercent(value: number): number {
  return clamp(value, 0, 1);
}

/** 安全角度（0-360度） */
export function clampAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** 检查是否为有效数值 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value);
}

/** 安全解析数值 */
export function parseNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && isValidNumber(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isValidNumber(parsed) ? parsed : fallback;
  }
  return fallback;
}

/** 带精度的四舍五入 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
```

---

## ✅ 修复验证清单

每个修复完成后，请执行以下验证：

- [ ] 单元测试通过
- [ ] 边界条件测试通过
- [ ] 无 TypeScript 类型错误
- [ ] 无运行时警告
- [ ] 性能无明显下降
- [ ] 文档已更新

---

*本文档基于 game-design-strict 技能 Bug 模式库生成*
