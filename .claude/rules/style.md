# 代码风格指南

> **级别：SHOULD（建议遵循）**
> 这些规则定义代码风格和格式约定，确保项目代码风格一致。

---

## 一、导入顺序

导入语句必须按以下顺序组织，组间空行分隔：

```typescript
// 1. React 相关
import { useState, useEffect, useCallback, useMemo } from 'react';

// 2. 第三方库
import { z } from 'zod';
import { clsx } from 'clsx';
import { format } from 'date-fns';

// 3. @/ 别名（项目内部）— core/ 在前，modules/、shared/ 在后
import { gameEventManager } from '@/core/events';
import type { CharacterStats } from '@/core/types';
import { Button } from '@/shared/ui/button';
import { useGameState } from '@/hooks/useGameState';
import { calculateDamage } from '@/lib/game/combat';
import type { Player } from '@/lib/game/types';

// 4. 相对路径
import { LocalComponent } from './LocalComponent';
import { localUtil } from './utils';
```

**规则**：
- 各组内部按字母序排列
- 类型导入（`import type`）放在同组最后
- ESLint `import/order` 规则自动检查和修复

---

## 二、命名约定

### 2.1 文件命名
| 内容类型 | 命名规则 | 示例 |
|----------|----------|------|
| React 组件 | `PascalCase.tsx` | `BattlePanel.tsx`, `ShopPanel.tsx` |
| React Hook | `useCamelCase.ts` 或 `.tsx` | `useGameState.tsx`, `useAdventure.ts` |
| 工具/逻辑模块 | `camelCase.ts` | `balanceConfig.ts`, `damageCalc.ts` |
| 类型定义 | `types.ts`（固定名称） | `types.ts` |
| 数据/常量文件 | `camelCase.ts` | `realmData.ts`, `factionData.ts` |
| 桶文件 | `index.ts`（固定名称） | `index.ts` |
| 测试文件 | `<name>.test.ts` 或 `.spec.ts` | `combat.test.ts` |

### 2.2 代码命名
```typescript
// 组件：PascalCase
export function BattlePanel() {}
export function ShopProductCard() {}

// Hook：use + PascalCase
export function useGameState() {}
export function useCultivation() {}

// 函数：camelCase，动词开头
export function calculateDamage() {}
export function generateEnemy() {}
export function formatRealmName() {}
function hasEnoughGold() {}        // 布尔返回：has/is/should 开头

// 常量：UPPER_SNAKE_CASE
export const MAX_PLAYER_LEVEL = 100;
export const DEFAULT_WORLD_TYPE = 'cultivation';

// 枚举成员：PascalCase
export enum QualityTier {
  Legendary = 'legendary',
  Epic = 'epic',
  Rare = 'rare',
}

// 类型/接口：PascalCase
export type EnemyTier = 'normal' | 'elite' | 'boss';
export interface BattleState { /* ... */ }

// 泛型参数：单个大写字母，有意义的缩写
export function createMap<K, V>() {}
export interface Repository<TEntity> {}
```

### 2.3 避免的名称
- 避免单字母变量（除了循环中的 `i`、`j` 和泛型 `T`）
- 避免缩写（`usr` → `user`，`btn` → `button`）
- 避免无意义后缀（`Data`、`Info` → 除非真正需要区分）
- 避免否定式布尔名（`isNotValid` → `isValid`，使用 `!isValid`）

---

## 三、JSDoc 注释

### 3.1 必须注释
- 所有导出函数：描述用途、参数、返回值
- 所有导出类型/接口：每个字段的含义
- 所有导出常量：用途和使用场景
- 复杂算法：解释思路和步骤

### 3.2 模板
```typescript
/**
 * 计算两个实体间的战斗伤害
 *
 * 伤害计算遵循公式：baseAtk * (1 + critMultiplier) - defense * 0.7
 * 如果目标处于克制状态，伤害 * 1.5
 *
 * @param attacker - 攻击方战斗属性
 * @param defender - 防御方战斗属性
 * @param options - 战斗选项（环境加成、克制关系等）
 * @returns 伤害计算结果，包含最终伤害值和分解明细
 *
 * @example
 * const result = calculateDamage(player, enemy, { environment: 'forest' });
 * console.log(result.finalDamage); // 234
 */
export function calculateDamage(
  attacker: CombatStats,
  defender: CombatStats,
  options: BattleOptions
): DamageResult { /* ... */ }
```

### 3.3 接口注释
```typescript
/** 玩家完整属性 */
export interface Player {
  /** 玩家唯一标识 */
  id: string;
  /** 当前生命值（0 表示死亡） */
  currentHp: number;
  /** 最大生命值 */
  maxHp: number;
  /** 当前修炼境界索引 */
  realmIndex: number;
  /** 拥有物品列表（key=itemId, value=数量） */
  inventory: Record<string, number>;
}
```

---

## 四、TypeScript 严格模式

### 4.1 类型标注
```typescript
// ✅ 函数参数和返回值显式标注
export function createPlayer(name: string, worldType: WorldType): Player { ... }

// ✅ 变量尽可能推断，必要时显式标注
const player = createPlayer('张三', 'cultivation');  // 推断为 Player
const items: InventoryItem[] = [];                    // 空数组需显式标注

// ❌ 禁止 any（ESLint error）
function process(data: any): any { ... }

// ✅ 不确定类型时使用 unknown + 类型守卫
function process(data: unknown): ProcessResult {
  if (isValidPayload(data)) {
    return handlePayload(data);  // 类型守卫后 data 是 ValidPayload
  }
  throw new Error('Invalid data');
}
```

### 4.2 类型 vs 接口
- 优先使用 `interface`（可扩展、更清晰的错误消息）
- 使用 `type` 的场景：联合类型、元组、映射类型、工具类型
```typescript
// ✅ interface：对象形状
export interface Player { id: string; name: string; }

// ✅ type：联合/工具/映射
export type WorldType = 'cultivation' | 'martial' | 'tech' | 'magic';
export type PlayerUpdate = Partial<Pick<Player, 'name' | 'hp'>>;
```

### 4.3 空值处理
```typescript
// ✅ 明确可能为 null/undefined
function findPlayer(id: string): Player | undefined { ... }

// ✅ 使用可选链和空值合并
const name = player?.profile?.name ?? '未知';

// ❌ 非空断言（除非有充分理由）
const name = player!.name;  // ESLint 会警告
```

---

## 五、错误处理

### 5.1 游戏逻辑
```typescript
// lib/game/ 中的纯函数：返回结果对象
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function performAction(state: GameState, action: Action): ActionResult<GameState> {
  if (!isValidAction(state, action)) {
    return { success: false, error: '无效操作：资源不足' };
  }
  return { success: true, data: applyAction(state, action) };
}
```

### 5.2 API 调用
```typescript
// storage/ 和 hooks/ 中：try-catch + 用户反馈
try {
  const result = await supabase.from('players').select('*');
  // 处理结果
} catch (error) {
  console.error('数据库查询失败:', error);
  addMessage({ type: 'error', text: '数据加载失败，请稍后重试' });
}
```

---

## 六、React 最佳实践

### 6.1 性能优化
```typescript
// 事件处理函数用 useCallback（仅在作为 props 传递时有意义）
const handleClick = useCallback(() => {
  doSomething(id);
}, [id, doSomething]);

// 昂贵计算用 useMemo
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.price - b.price);
}, [items]);

// 派生状态优先使用计算而非 useEffect
// ❌ 不推荐
const [total, setTotal] = useState(0);
useEffect(() => { setTotal(items.reduce((s, i) => s + i.price, 0)); }, [items]);

// ✅ 推荐
const total = items.reduce((s, i) => s + i.price, 0);
```

### 6.2 条件渲染
```typescript
// ✅ 简单条件：三元或 &&
{isLoading && <LoadingSpinner />}
{player ? <PlayerCard player={player} /> : <NoPlayer />}

// ✅ 多分支：映射表（3+ 个分支）
const PANEL_MAP: Record<TabType, React.FC<PanelProps>> = {
  cultivation: CultivationPanel,
  adventure: AdventurePanel,
  equipment: EquipmentPanel,
};
const PanelComponent = PANEL_MAP[activeTab];
return <PanelComponent {...panelProps} />;
```
