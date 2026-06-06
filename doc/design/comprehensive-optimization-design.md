# 修仙文字冒险游戏 - 综合优化设计方案

**版本**: v2.0
**设计日期**: 2025年1月
**基于**: game-design-review.md、numerical-balance-analysis.md、optimization-proposals.md
**设计规范**: game-design-strict 零Bug游戏系统设计规范

---

## 一、设计目标与原则

### 1.1 核心目标

基于评审报告中的P0/P1问题，本次优化设计聚焦以下核心目标：

| 目标 | 优先级 | 预期效果 |
|------|--------|----------|
| 提升战斗策略深度 | 🔴 P0 | 从纯数值比拼变为策略决策游戏 |
| 设计终局玩法 | 🔴 P0 | 飞升后有新内容，提升长期留存 |
| 平衡经济系统 | 🟠 P1 | 解决灵石通胀，增加高价值消耗途径 |
| 增加探索趣味性 | 🟠 P1 | 地牢随机事件，不可预测的惊喜 |
| 可扩展架构 | 🔴 P0 | 便于后续添加新功能 |

### 1.2 设计原则

1. **零容忍红线**：
   - 不引入流程阻塞问题
   - 不破坏现有存档兼容性
   - 不引入数值溢出风险

2. **渐进式实现**：
   - 分阶段实施，每阶段可独立验证
   - 优先解决P0问题
   - 保持系统可测试性

3. **可扩展性**：
   - 新系统与现有系统解耦
   - 使用接口抽象，便于扩展
   - 配置驱动，减少硬编码

---

## 二、系统架构设计

### 2.1 总体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         游戏核心层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  状态管理     │  │  存档系统     │  │  事件总线     │          │
│  │ (GameState)  │  │ (SaveSystem) │  │ (EventBus)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         游戏系统层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 修炼系统     │  │  任务系统     │  │  成就系统     │          │
│  │Cultivation   │  │TaskSystem    │  │Achievement   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 商店系统     │  │  势力系统     │  │  碎片系统     │          │
│  │ShopSystem    │  │FactionSystem │  │FragmentSystem│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      【新增】战斗策略层                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 战斗技能系统  │  │ 战斗决策系统  │  │ 战斗事件系统  │          │
│  │BattleSkill   │  │BattleDecision│  │BattleEvent   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 战斗AI系统   │  │ 战斗回放系统  │  │ 战斗结算系统  │          │
│  │BattleAI      │  │BattleReplay  │  │BattleResult  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      【新增】终局玩法层                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 飞升境界系统  │  │ 排行榜系统    │  │ 每周Boss系统  │          │
│  │AscensionRealm│  │Leaderboard   │  │WeeklyBoss    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 飞升副本系统  │  │ 飞升商店系统  │  │ 赛季系统     │          │
│  │AscensionDgn  │  │AscensionShop │  │SeasonSystem  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      【新增】探索增强层                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 地牢事件系统  │  │ 随机宝箱系统  │  │ 隐藏房间系统  │          │
│  │DungeonEvent  │  │RandomTreasure│  │HiddenRoom    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      【新增】经济平衡层                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 装备重铸系统  │  │ 功法突破系统  │  │ 外观商店系统  │          │
│  │EquipReforge  │  │TechBreakthrough│ │AppearanceShop│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ 货币调节系统  │  │ 消耗监控系统  │                             │
│  │CurrencyReg   │  │SinkMonitor   │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流向

```
玩家操作 → 战斗决策系统 → 战斗技能系统 → 伤害计算 → 克制关系 → 战斗结算
                ↓
           战斗事件系统 ← 战斗AI系统
                ↓
           战斗回放系统 → 战斗结算系统
                ↓
           经济平衡层（消耗灵石/获取奖励）
                ↓
           终局玩法层（飞升印记/排行榜积分）
```

---

## 三、P0-1：战斗策略系统详细设计

### 3.1 问题分析

**当前问题**：
- 战斗是纯数值比拼，玩家无法影响结果
- 战斗过程自动进行，无决策点
- 克制关系只能在战斗开始后得知，无法利用

**影响**：
- 玩法枯燥，核心乐趣缺失
- 策略深度为零，无法体现玩家能力
- 装备/功法选择缺乏策略意义

### 3.2 设计方案

#### 3.2.1 战斗行动类型系统

```typescript
// src/lib/game/battle/types.ts

/** 战斗行动类型 */
export type BattleActionType = 
  | 'normal_attack'   // 普通攻击（无消耗）
  | 'skill_attack'    // 功法攻击（消耗MP）
  | 'defend'          // 防御（减少伤害，恢复MP）
  | 'use_item'        // 使用物品（消耗道具）
  | 'flee';           // 逃跑（有成功率）

/** 战斗行动定义 */
export interface BattleAction {
  type: BattleActionType;
  skillId?: string;    // 功法攻击时指定功法
  itemId?: string;     // 使用物品时指定物品
}

/** 战斗行动结果 */
export interface BattleActionResult {
  action: BattleAction;
  success: boolean;
  damage?: number;     // 造成的伤害
  healing?: number;    // 恢复的生命
  mpCost?: number;     // 消耗的法力
  message: string;     // 行动描述
  effects?: ActiveEffect[]; // 触发的效果
  critical?: boolean;  // 是否暴击
  restraint?: RestraintResult; // 克制关系
}

/** 战斗状态（扩展） */
export interface ExtendedBattleState extends BattleState {
  // 玩家状态
  playerMaxMp: number;
  playerCurrentMp: number;
  playerIsDefending: boolean; // 本回合是否防御
  
  // 技能冷却
  skillCooldowns: Map<string, number>;
  
  // 战斗事件
  activeEvents: BattleEvent[];
  
  // 行动历史（用于回放）
  actionHistory: BattleActionRecord[];
  
  // 敌人属性
  enemyElement: Element | null;
  enemyWeaponCategory: WeaponCategory | null;
  enemyEnhancement?: EnemyEnhancement;
}

/** 战斗行动记录 */
export interface BattleActionRecord {
  round: number;
  turn: 'player' | 'enemy';
  action: BattleAction;
  result: BattleActionResult;
  timestamp: number;
}
```

#### 3.2.2 战斗技能系统

```typescript
// src/lib/game/battle/skillSystem.ts

/** 战斗技能定义 */
export interface BattleSkill {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'buff' | 'debuff' | 'special';
  
  // 消耗
  mpCost: number;
  cooldown: number; // 回合数
  
  // 效果
  effect: {
    damageMultiplier?: number;  // 攻击倍率
    healing?: number;           // 固定治疗
    healingPercent?: number;    // 百分比治疗
    buff?: StatBuff;            // 增益效果
    debuff?: StatBuff;          // 减益效果
    special?: SpecialEffect;    // 特殊效果
  };
  
  // 条件
  requirements?: {
    minHp?: number;     // 最低血量要求
    minMp?: number;     // 最低法力要求
    minLevel?: number;  // 最低等级要求
  };
  
  // 属性（继承自功法）
  element?: Element;
  weaponCategory?: WeaponCategory;
}

/** 属性增益/减益 */
export interface StatBuff {
  stat: 'attack' | 'defense' | 'critRate' | 'evasion';
  value: number;       // 固定值
  percent?: number;    // 百分比加成
  duration: number;    // 持续回合，-1表示永久
}

/** 特殊效果 */
export type SpecialEffect = 
  | { type: 'life_steal'; percent: number }     // 吸血
  | { type: 'ignore_defense'; percent: number } // 无视防御
  | { type: 'multi_hit'; count: number }        // 多段攻击
  | { type: 'stun'; rounds: number }            // 眩晕
  | { type: 'poison'; damage: number; rounds: number }; // 中毒

/** 从功法生成战斗技能 */
export function generateBattleSkillFromTechnique(technique: Technique): BattleSkill {
  const baseDamageMultiplier = 1 + (technique.power / 100) * (1 + technique.bonus / 100);
  
  return {
    id: `skill_${technique.id}`,
    name: technique.name,
    description: `消耗${technique.mpCost}法力，造成${Math.round(baseDamageMultiplier * 100)}%伤害`,
    type: technique.type === 'attack' ? 'attack' : 'defense',
    mpCost: technique.mpCost,
    cooldown: Math.max(1, Math.floor(technique.mpCost / 20)), // 按法力消耗计算冷却
    effect: {
      damageMultiplier: baseDamageMultiplier,
    },
    element: technique.element,
    weaponCategory: technique.weaponCategory,
  };
}
```

#### 3.2.3 战斗决策系统

```typescript
// src/lib/game/battle/decisionSystem.ts

/** 战斗决策上下文 */
export interface BattleDecisionContext {
  player: ExtendedBattleState;
  enemy: EnemyState;
  availableSkills: BattleSkill[];
  availableItems: InventoryItem[];
  roundNumber: number;
}

/** 决策选项 */
export interface DecisionOption {
  action: BattleAction;
  label: string;
  description: string;
  disabled: boolean;
  disabledReason?: string;
  recommended?: boolean; // AI推荐
}

/** 获取可用决策选项 */
export function getAvailableDecisions(context: BattleDecisionContext): DecisionOption[] {
  const options: DecisionOption[] = [];
  const { player, enemy, availableSkills, availableItems } = context;
  
  // 1. 普通攻击 - 始终可用
  options.push({
    action: { type: 'normal_attack' },
    label: '普通攻击',
    description: '使用武器进行攻击',
    disabled: false,
  });
  
  // 2. 功法攻击 - 检查MP和冷却
  for (const skill of availableSkills) {
    const cooldownRemaining = player.skillCooldowns.get(skill.id) || 0;
    const canUse = player.playerCurrentMp >= skill.mpCost && cooldownRemaining === 0;
    
    options.push({
      action: { type: 'skill_attack', skillId: skill.id },
      label: skill.name,
      description: `${skill.description} (${skill.mpCost}MP)`,
      disabled: !canUse,
      disabledReason: !canUse 
        ? (player.playerCurrentMp < skill.mpCost ? '法力不足' : `冷却中(${cooldownRemaining}回合)`)
        : undefined,
      recommended: isSkillRecommended(skill, context),
    });
  }
  
  // 3. 使用物品 - 检查物品数量
  const usableItems = availableItems.filter(item => 
    item.definition.effects?.some(e => 
      ['restore_hp', 'restore_mp', 'stat_boost', 'combat_boost'].includes(e.type)
    )
  );
  
  for (const item of usableItems) {
    options.push({
      action: { type: 'use_item', itemId: item.id },
      label: item.definition.name,
      description: getItemEffectDescription(item.definition),
      disabled: item.quantity <= 0,
    });
  }
  
  // 4. 防御 - 始终可用
  options.push({
    action: { type: 'defend' },
    label: '防御',
    description: '减少50%受到的伤害，恢复5点法力',
    disabled: false,
  });
  
  // 5. 逃跑 - Boss战中不可用
  const isBoss = enemy.tier === 'boss' || enemy.tier === 'miniboss';
  options.push({
    action: { type: 'flee' },
    label: '逃跑',
    description: isBoss ? 'Boss战中无法逃跑' : '有一定概率逃离战斗',
    disabled: isBoss,
  });
  
  return options;
}

/** AI推荐判断 */
function isSkillRecommended(skill: BattleSkill, context: BattleDecisionContext): boolean {
  const { enemy, player } = context;
  
  // 克制敌人时推荐
  if (skill.element && enemy.element) {
    const restraint = calculateElementMultiplier(skill.element, enemy.element);
    if (restraint > 1.1) return true;
  }
  
  // 低血量时推荐防御型技能
  if (player.playerCurrentHp < player.playerMaxHp * 0.3 && skill.type === 'defense') {
    return true;
  }
  
  return false;
}
```

#### 3.2.4 战斗事件系统

```typescript
// src/lib/game/battle/eventSystem.ts

/** 战斗事件类型 */
export type BattleEventType = 
  | 'round_start'      // 回合开始
  | 'round_end'        // 回合结束
  | 'critical_hit'     // 暴击时
  | 'low_hp'           // 低血量时
  | 'kill_enemy'       // 击杀敌人时
  | 'player_turn'      // 玩家回合
  | 'enemy_turn';      // 敌人回合

/** 战斗事件触发器 */
export interface BattleEventTrigger {
  type: BattleEventType;
  condition?: (context: BattleDecisionContext) => boolean;
  probability?: number; // 触发概率
}

/** 战斗事件效果 */
export interface BattleEventEffect {
  type: 'buff' | 'debuff' | 'damage' | 'healing' | 'special';
  target: 'player' | 'enemy' | 'both';
  value: number;
  description: string;
  icon?: string;
}

/** 战斗事件定义 */
export interface BattleEventDefinition {
  id: string;
  name: string;
  description: string;
  trigger: BattleEventTrigger;
  effects: BattleEventEffect[];
  duration?: number; // 效果持续回合
  oneTime?: boolean; // 是否一次性事件
}

/** 预定义战斗事件 */
export const PREDEFINED_BATTLE_EVENTS: BattleEventDefinition[] = [
  {
    id: 'event_desperate_awakening',
    name: '绝境觉醒',
    description: 'HP低于20%时，攻击力提升50%，持续3回合',
    trigger: {
      type: 'low_hp',
      condition: (ctx) => ctx.player.playerCurrentHp < ctx.player.playerMaxHp * 0.2,
      probability: 0.5,
    },
    effects: [
      {
        type: 'buff',
        target: 'player',
        value: 50,
        description: '攻击力+50%',
        icon: '🔥',
      },
    ],
    duration: 3,
    oneTime: true,
  },
  {
    id: 'event_elemental_storm',
    name: '元素风暴',
    description: '回合开始时，随机元素风暴，对双方造成伤害',
    trigger: {
      type: 'round_start',
      probability: 0.1,
    },
    effects: [
      {
        type: 'damage',
        target: 'both',
        value: 20, // 基于等级缩放
        description: '元素风暴！双方受到伤害',
        icon: '🌪️',
      },
    ],
  },
  {
    id: 'event_spirit_surge',
    name: '灵气暴动',
    description: '回合结束时，所有人MP恢复30%',
    trigger: {
      type: 'round_end',
      probability: 0.15,
    },
    effects: [
      {
        type: 'healing',
        target: 'both',
        value: 30, // 百分比
        description: '灵气暴动！双方MP恢复30%',
        icon: '✨',
      },
    ],
  },
];
```

#### 3.2.5 战斗流程重构

```typescript
// src/lib/game/battle/battleFlow.ts

/** 战斗流程控制器 */
export class BattleFlowController {
  private state: ExtendedBattleState;
  private decisionQueue: BattleAction[] = [];
  private eventSystem: BattleEventSystem;
  
  constructor(
    initialState: ExtendedBattleState,
    eventSystem: BattleEventSystem
  ) {
    this.state = initialState;
    this.eventSystem = eventSystem;
  }
  
  /** 玩家提交决策 */
  submitDecision(action: BattleAction): void {
    this.decisionQueue.push(action);
  }
  
  /** 执行一个回合 */
  executeTurn(): TurnResult {
    const playerAction = this.decisionQueue.shift();
    if (!playerAction) {
      throw new Error('No player action submitted');
    }
    
    // 1. 触发回合开始事件
    const startEvents = this.eventSystem.triggerEvents('round_start', this.state);
    this.applyEventEffects(startEvents);
    
    // 2. 玩家行动
    const playerResult = this.executePlayerAction(playerAction);
    
    // 3. 检查战斗是否结束
    if (this.state.enemyCurrentHp <= 0) {
      return this.endBattle(true, playerResult);
    }
    
    // 4. 敌人行动（如果敌人还活着）
    const enemyResult = this.executeEnemyAction();
    
    // 5. 检查战斗是否结束
    if (this.state.playerCurrentHp <= 0) {
      return this.endBattle(false, enemyResult);
    }
    
    // 6. 触发回合结束事件
    const endEvents = this.eventSystem.triggerEvents('round_end', this.state);
    this.applyEventEffects(endEvents);
    
    // 7. 更新冷却
    this.updateCooldowns();
    
    // 8. 记录行动历史
    this.state.actionHistory.push({
      round: this.state.currentRound,
      turn: 'player',
      action: playerAction,
      result: playerResult,
      timestamp: Date.now(),
    });
    
    return {
      playerResult,
      enemyResult,
      events: [...startEvents, ...endEvents],
      battleOver: false,
    };
  }
  
  /** 执行玩家行动 */
  private executePlayerAction(action: BattleAction): BattleActionResult {
    switch (action.type) {
      case 'normal_attack':
        return this.executeNormalAttack();
      case 'skill_attack':
        return this.executeSkillAttack(action.skillId!);
      case 'defend':
        return this.executeDefend();
      case 'use_item':
        return this.executeUseItem(action.itemId!);
      case 'flee':
        return this.executeFlee();
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
  
  /** 执行普通攻击 */
  private executeNormalAttack(): BattleActionResult {
    const damage = this.calculatePlayerDamage(null);
    const restraint = this.calculateRestraint(null);
    
    this.state.enemyCurrentHp = Math.max(0, this.state.enemyCurrentHp - damage);
    
    return {
      action: { type: 'normal_attack' },
      success: true,
      damage,
      message: `你发动攻击，造成${damage}点伤害`,
      restraint,
    };
  }
  
  /** 执行防御 */
  private executeDefend(): BattleActionResult {
    this.state.playerIsDefending = true;
    const mpRecovery = 5;
    this.state.playerCurrentMp = Math.min(
      this.state.playerMaxMp,
      this.state.playerCurrentMp + mpRecovery
    );
    
    return {
      action: { type: 'defend' },
      success: true,
      healing: 0,
      mpCost: -mpRecovery,
      message: '你摆出防御姿态，准备抵御攻击。恢复5点法力。',
    };
  }
  
  /** 执行逃跑 */
  private executeFlee(): BattleActionResult {
    const levelDiff = this.state.playerLevel - this.state.enemyLevel;
    const baseRate = 0.3;
    const levelBonus = levelDiff * 0.05;
    const enemyPenalty = this.state.enemyTier === 'boss' ? 0.2 : 0;
    
    const fleeRate = Math.max(0.1, Math.min(0.8, baseRate + levelBonus - enemyPenalty));
    const success = Math.random() < fleeRate;
    
    return {
      action: { type: 'flee' },
      success,
      message: success ? '你成功逃离了战斗！' : '逃跑失败！敌人挡住了你的去路。',
    };
  }
}

/** 回合结果 */
export interface TurnResult {
  playerResult: BattleActionResult;
  enemyResult?: BattleActionResult;
  events: BattleEvent[];
  battleOver: boolean;
  victory?: boolean;
}
```

### 3.3 UI设计

```typescript
// src/components/game/battle/BattleActionPanel.tsx

interface BattleActionPanelProps {
  state: ExtendedBattleState;
  onAction: (action: BattleAction) => void;
  disabled: boolean;
}

export function BattleActionPanel({ state, onAction, disabled }: BattleActionPanelProps) {
  const decisions = useMemo(() => getAvailableDecisions({
    player: state,
    enemy: state.enemy,
    availableSkills: state.availableSkills,
    availableItems: state.availableItems,
    roundNumber: state.currentRound,
  }), [state]);
  
  return (
    <div className="battle-action-panel">
      {/* 快捷操作栏 */}
      <div className="quick-actions flex gap-2">
        <Button
          onClick={() => onAction({ type: 'normal_attack' })}
          disabled={disabled}
          variant="default"
        >
          <Sword className="w-4 h-4 mr-1" />
          攻击
        </Button>
        
        <Button
          onClick={() => onAction({ type: 'defend' })}
          disabled={disabled}
          variant="outline"
        >
          <Shield className="w-4 h-4 mr-1" />
          防御
        </Button>
        
        <Button
          onClick={() => onAction({ type: 'flee' })}
          disabled={disabled || state.enemyTier === 'boss'}
          variant="destructive"
        >
          <LogOut className="w-4 h-4 mr-1" />
          逃跑
        </Button>
      </div>
      
      {/* 功法选择 */}
      <div className="skill-actions mt-2">
        <Select
          onValueChange={(skillId) => onAction({ type: 'skill_attack', skillId })}
          disabled={disabled}
        >
          <SelectTrigger>
            <Zap className="w-4 h-4 mr-1" />
            功法
          </SelectTrigger>
          <SelectContent>
            {decisions
              .filter(d => d.action.type === 'skill_attack')
              .map(d => (
                <SelectItem
                  key={d.action.skillId}
                  value={d.action.skillId!}
                  disabled={d.disabled}
                >
                  <div className="flex items-center gap-2">
                    <span>{d.label}</span>
                    {d.recommended && <Badge variant="secondary">推荐</Badge>}
                    {d.disabled && <span className="text-muted-foreground text-xs">{d.disabledReason}</span>}
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* 物品选择 */}
      <div className="item-actions mt-2">
        <Select
          onValueChange={(itemId) => onAction({ type: 'use_item', itemId })}
          disabled={disabled}
        >
          <SelectTrigger>
            <Package className="w-4 h-4 mr-1" />
            物品
          </SelectTrigger>
          <SelectContent>
            {decisions
              .filter(d => d.action.type === 'use_item')
              .map(d => (
                <SelectItem
                  key={d.action.itemId}
                  value={d.action.itemId!}
                  disabled={d.disabled}
                >
                  {d.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

### 3.4 验证测试

#### 边界条件测试

```typescript
// __tests__/battle/boundary.test.ts

describe('Battle System Boundary Tests', () => {
  test('玩家MP为0时无法使用功法', () => {
    const state = createMockBattleState({ playerCurrentMp: 0 });
    const decisions = getAvailableDecisions({ ...state, availableSkills: [mockSkill] });
    
    const skillDecision = decisions.find(d => d.action.type === 'skill_attack');
    expect(skillDecision?.disabled).toBe(true);
    expect(skillDecision?.disabledReason).toBe('法力不足');
  });
  
  test('Boss战中逃跑按钮禁用', () => {
    const state = createMockBattleState({ enemyTier: 'boss' });
    const decisions = getAvailableDecisions(state);
    
    const fleeDecision = decisions.find(d => d.action.type === 'flee');
    expect(fleeDecision?.disabled).toBe(true);
  });
  
  test('伤害下界保护：最低伤害为1', () => {
    const state = createMockBattleState({
      playerAttack: 1,
      enemyDefense: 999999,
    });
    const result = executeNormalAttack(state);
    
    expect(result.damage).toBeGreaterThanOrEqual(1);
  });
  
  test('伤害上界保护：单次伤害不超过目标HP的60%', () => {
    const state = createMockBattleState({
      playerAttack: 999999,
      enemyMaxHp: 100,
      enemyCurrentHp: 100,
    });
    const result = executeNormalAttack(state);
    
    expect(result.damage).toBeLessThanOrEqual(60);
  });
  
  test('逃跑成功率在10%-80%之间', () => {
    // 测试各种等级差下的逃跑率
    const testCases = [
      { levelDiff: -50, expectedMin: 0.1, expectedMax: 0.8 },
      { levelDiff: 0, expectedMin: 0.1, expectedMax: 0.8 },
      { levelDiff: 50, expectedMin: 0.1, expectedMax: 0.8 },
    ];
    
    testCases.forEach(({ levelDiff, expectedMin, expectedMax }) => {
      const state = createMockBattleState({
        playerLevel: 50,
        enemyLevel: 50 - levelDiff,
      });
      const fleeRate = calculateFleeRate(state);
      
      expect(fleeRate).toBeGreaterThanOrEqual(expectedMin);
      expect(fleeRate).toBeLessThanOrEqual(expectedMax);
    });
  });
});
```

#### 状态机验证

```
战斗状态机：

[战斗开始] → [玩家回合] → [玩家行动] → [检查结束]
                                          ↓
                     ← [战斗继续] ← [否] ←
                          ↓
                     [敌人回合] → [敌人行动] → [检查结束]
                                              ↓
                         ← [战斗继续] ← [否] ←
                              ↓
                         [回合结束] → [玩家回合]
                              
[是] → [战斗结束] → [结算]
```

---

## 四、P0-2：终局玩法系统详细设计

### 4.1 问题分析

**当前问题**：
- 飞升后无新内容
- 达到最高境界后玩家流失
- 缺乏长期目标和竞争机制

**影响**：
- 游戏生命周期短（1-2个月）
- 无留存动力
- 玩家成就感无法延续

### 4.2 设计方案

#### 4.2.1 飞升境界系统

```typescript
// src/lib/game/ascension/realmSystem.ts

/** 飞升境界 */
export interface AscensionRealm {
  id: string;
  name: string;
  description: string;
  requiredMarks: number; // 需要的飞升印记
  
  // 加成效果
  bonuses: {
    statMultiplier: number;      // 属性倍率
    expMultiplier: number;       // 经验倍率
    dropRateBonus: number;       // 掉率加成
    newFeatures: string[];       // 解锁的新功能
  };
  
  // 外观
  appearance: {
    title: string;               // 称号
    aura: string;                // 光环效果
    auraColor: string;           // 光环颜色
  };
}

/** 飞升境界配置 */
export const ASCENSION_REALMS: AscensionRealm[] = [
  {
    id: 'ascension_1',
    name: '天人境',
    description: '初入仙途，脱胎换骨。凡尘俗世已无法束缚你的脚步。',
    requiredMarks: 100,
    bonuses: {
      statMultiplier: 1.5,
      expMultiplier: 1.2,
      dropRateBonus: 0.1,
      newFeatures: ['ascension_shop', 'weekly_boss'],
    },
    appearance: {
      title: '天人',
      aura: '淡金色光晕',
      auraColor: '#FFD700',
    },
  },
  {
    id: 'ascension_2',
    name: '真仙境',
    description: '仙气缭绕，神通广大。天地法则开始为你所用。',
    requiredMarks: 500,
    bonuses: {
      statMultiplier: 2.0,
      expMultiplier: 1.5,
      dropRateBonus: 0.2,
      newFeatures: ['ascension_dungeon', 'leaderboard'],
    },
    appearance: {
      title: '真仙',
      aura: '七彩霞光',
      auraColor: '#7FFF00',
    },
  },
  {
    id: 'ascension_3',
    name: '金仙境',
    description: '金光万丈，法力无边。一念之间，天地变色。',
    requiredMarks: 2000,
    bonuses: {
      statMultiplier: 3.0,
      expMultiplier: 2.0,
      dropRateBonus: 0.3,
      newFeatures: ['realm_trial', 'pvp_arena'],
    },
    appearance: {
      title: '金仙',
      aura: '璀璨金光',
      auraColor: '#FFD700',
    },
  },
  {
    id: 'ascension_4',
    name: '大罗金仙',
    description: '跳出三界外，不在五行中。万劫不磨，永恒不灭。',
    requiredMarks: 10000,
    bonuses: {
      statMultiplier: 5.0,
      expMultiplier: 3.0,
      dropRateBonus: 0.5,
      newFeatures: ['world_creation', 'disciple_system'],
    },
    appearance: {
      title: '大罗金仙',
      aura: '混沌紫光',
      auraColor: '#9400D3',
    },
  },
  {
    id: 'ascension_5',
    name: '混元道果',
    description: '证得混元，与道合真。此乃修仙之极境。',
    requiredMarks: 50000,
    bonuses: {
      statMultiplier: 10.0,
      expMultiplier: 5.0,
      dropRateBonus: 1.0,
      newFeatures: ['transcendence'],
    },
    appearance: {
      title: '混元',
      aura: '无色无相',
      auraColor: '#FFFFFF',
    },
  },
];

/** 获取当前飞升境界 */
export function getCurrentAscensionRealm(marks: number): AscensionRealm | null {
  let currentRealm: AscensionRealm | null = null;
  
  for (const realm of ASCENSION_REALMS) {
    if (marks >= realm.requiredMarks) {
      currentRealm = realm;
    } else {
      break;
    }
  }
  
  return currentRealm;
}

/** 获取下一个飞升境界 */
export function getNextAscensionRealm(marks: number): AscensionRealm | null {
  for (const realm of ASCENSION_REALMS) {
    if (marks < realm.requiredMarks) {
      return realm;
    }
  }
  return null;
}

/** 计算飞升印记获取量 */
export function calculateAscensionMarkGain(
  source: 'boss' | 'weekly_boss' | 'pvp' | 'achievement' | 'season',
  level: number
): number {
  const baseGain = {
    boss: 5,
    weekly_boss: 50,
    pvp: 10,
    achievement: 20,
    season: 100,
  };
  
  return Math.floor(baseGain[source] * (1 + level * 0.01));
}
```

#### 4.2.2 排行榜系统

```typescript
// src/lib/game/ascension/leaderboardSystem.ts

/** 排行榜类型 */
export type LeaderboardType = 
  | 'combat_power'   // 战力排行
  | 'speedrun'       // 通关速度
  | 'achievement'    // 成就点数
  | 'ascension';     // 飞升境界

/** 排行榜条目 */
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  extraData?: Record<string, any>;
  updatedAt: number;
}

/** 排行榜奖励 */
export interface LeaderboardReward {
  rankRange: [number, number]; // [minRank, maxRank]
  rewards: {
    spiritStones: number;
    ascensionMarks: number;
    items?: ItemDefinition[];
    title?: string;
  };
}

/** 周常排行榜奖励 */
export const WEEKLY_LEADERBOARD_REWARDS: LeaderboardReward[] = [
  {
    rankRange: [1, 1],
    rewards: {
      spiritStones: 10000,
      ascensionMarks: 50,
      title: '周冠',
    },
  },
  {
    rankRange: [2, 3],
    rewards: {
      spiritStones: 5000,
      ascensionMarks: 30,
    },
  },
  {
    rankRange: [4, 10],
    rewards: {
      spiritStones: 2000,
      ascensionMarks: 15,
    },
  },
  {
    rankRange: [11, 50],
    rewards: {
      spiritStones: 500,
      ascensionMarks: 5,
    },
  },
  {
    rankRange: [51, 100],
    rewards: {
      spiritStones: 200,
      ascensionMarks: 2,
    },
  },
];

/** 排行榜服务 */
export class LeaderboardService {
  private entries: Map<LeaderboardType, LeaderboardEntry[]> = new Map();
  
  /** 更新排行榜 */
  updateLeaderboard(type: LeaderboardType, entry: Omit<LeaderboardEntry, 'rank'>): void {
    let entries = this.entries.get(type) || [];
    
    // 移除旧记录
    entries = entries.filter(e => e.playerId !== entry.playerId);
    
    // 添加新记录
    entries.push({
      ...entry,
      rank: 0, // 临时值，后面重新计算
    });
    
    // 按分数排序
    entries.sort((a, b) => b.score - a.score);
    
    // 更新排名
    entries.forEach((e, index) => {
      e.rank = index + 1;
    });
    
    // 只保留前100名
    entries = entries.slice(0, 100);
    
    this.entries.set(type, entries);
  }
  
  /** 获取排行榜 */
  getLeaderboard(type: LeaderboardType): LeaderboardEntry[] {
    return this.entries.get(type) || [];
  }
  
  /** 获取玩家排名 */
  getPlayerRank(type: LeaderboardType, playerId: string): number | null {
    const entries = this.entries.get(type);
    if (!entries) return null;
    
    const entry = entries.find(e => e.playerId === playerId);
    return entry?.rank || null;
  }
  
  /** 结算周常奖励 */
  settleWeeklyRewards(): Map<string, LeaderboardReward> {
    const rewards = new Map<string, LeaderboardReward>();
    
    for (const [type, entries] of this.entries) {
      for (const entry of entries) {
        const reward = this.getRewardForRank(entry.rank);
        if (reward) {
          rewards.set(entry.playerId, reward);
        }
      }
    }
    
    return rewards;
  }
  
  private getRewardForRank(rank: number): LeaderboardReward | null {
    for (const reward of WEEKLY_LEADERBOARD_REWARDS) {
      if (rank >= reward.rankRange[0] && rank <= reward.rankRange[1]) {
        return reward;
      }
    }
    return null;
  }
}
```

#### 4.2.3 每周Boss系统

```typescript
// src/lib/game/ascension/weeklyBossSystem.ts

/** 每周Boss配置 */
export interface WeeklyBoss {
  id: string;
  name: string;
  description: string;
  
  // 属性
  element: Element;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  
  // 特殊能力
  specialAbility: WeeklyBossAbility;
  
  // 奖励
  rewards: WeeklyBossReward[];
  
  // 时间
  availableFrom: number;
  availableUntil: number;
  weekNumber: number;
}

/** 每周Boss特殊能力 */
export interface WeeklyBossAbility {
  id: string;
  name: string;
  description: string;
  trigger: 'round_start' | 'hp_threshold' | 'turn_count';
  effect: {
    type: 'damage' | 'buff' | 'summon' | 'special';
    value: number;
    target: 'player' | 'self';
  };
}

/** 每周Boss奖励 */
export interface WeeklyBossReward {
  type: 'first_kill' | 'daily_damage' | 'ranking';
  threshold?: number; // 伤害阈值或排名
  rewards: {
    ascensionMarks: number;
    items?: ItemDefinition[];
  };
}

/** 生成每周Boss */
export function generateWeeklyBoss(weekNumber: number): WeeklyBoss {
  const elements: Element[] = ['fire', 'ice', 'thunder', 'wind', 'earth', 'light', 'dark'];
  const element = elements[weekNumber % elements.length];
  
  const baseLevel = 100 + Math.floor(weekNumber / 10) * 10;
  const baseHp = 100000 + weekNumber * 2000;
  
  return {
    id: `weekly_boss_${weekNumber}`,
    name: `${ELEMENT_NAMES[element]}域守护者`,
    description: `来自${ELEMENT_NAMES[element]}之域的强大存在，每周更替，难度递增`,
    element,
    level: baseLevel,
    hp: baseHp,
    attack: 500 + weekNumber * 10,
    defense: 200 + weekNumber * 5,
    specialAbility: generateWeeklyBossAbility(element, weekNumber),
    rewards: [
      {
        type: 'first_kill',
        rewards: {
          ascensionMarks: 100,
          items: generateBossUniqueDrop(element, weekNumber),
        },
      },
      {
        type: 'daily_damage',
        threshold: 10000,
        rewards: { ascensionMarks: 20 },
      },
      {
        type: 'ranking',
        threshold: 10, // 前10名
        rewards: {
          ascensionMarks: 50,
          items: generateBossRankingDrop(element),
        },
      },
    ],
    availableFrom: getWeekStart(weekNumber),
    availableUntil: getWeekEnd(weekNumber),
    weekNumber,
  };
}

/** 生成每周Boss特殊能力 */
function generateWeeklyBossAbility(element: Element, weekNumber: number): WeeklyBossAbility {
  const abilities: Record<Element, WeeklyBossAbility> = {
    fire: {
      id: 'ability_flame_nova',
      name: '烈焰新星',
      description: '每3回合对玩家造成持续燃烧伤害',
      trigger: 'turn_count',
      effect: { type: 'damage', value: 100 + weekNumber * 2, target: 'player' },
    },
    ice: {
      id: 'ability_frozen_prison',
      name: '寒冰囚笼',
      description: 'HP低于50%时冻结玩家1回合',
      trigger: 'hp_threshold',
      effect: { type: 'special', value: 1, target: 'player' },
    },
    // ... 其他元素能力
  };
  
  return abilities[element];
}

/** 获取周开始时间 */
function getWeekStart(weekNumber: number): number {
  const now = Date.now();
  const currentWeek = getWeekNumber(now);
  const weeksDiff = weekNumber - currentWeek;
  return now + weeksDiff * 7 * 24 * 60 * 60 * 1000;
}

/** 获取周结束时间 */
function getWeekEnd(weekNumber: number): number {
  return getWeekStart(weekNumber) + 7 * 24 * 60 * 60 * 1000;
}
```

### 4.3 验证测试

#### 边界条件测试

```typescript
describe('Ascension System Boundary Tests', () => {
  test('飞升印记为0时返回null境界', () => {
    const realm = getCurrentAscensionRealm(0);
    expect(realm).toBeNull();
  });
  
  test('飞升印记正好等于需求时返回对应境界', () => {
    const realm = getCurrentAscensionRealm(100);
    expect(realm?.id).toBe('ascension_1');
  });
  
  test('飞升印记超过最高境界时返回最高境界', () => {
    const realm = getCurrentAscensionRealm(999999);
    expect(realm?.id).toBe('ascension_5');
  });
  
  test('排行榜只保留前100名', () => {
    const service = new LeaderboardService();
    
    // 添加200个玩家
    for (let i = 0; i < 200; i++) {
      service.updateLeaderboard('combat_power', {
        playerId: `player_${i}`,
        playerName: `Player ${i}`,
        score: 1000 - i,
        updatedAt: Date.now(),
      });
    }
    
    const leaderboard = service.getLeaderboard('combat_power');
    expect(leaderboard.length).toBe(100);
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[99].rank).toBe(100);
  });
});
```

---

## 五、P1-1：经济平衡系统详细设计

### 5.1 问题分析

**当前问题**：
- 灵石产出过剩，产出/消耗比约5:1到9:1
- 后期货币贬值
- 缺乏高价值消耗途径

**影响**：
- 经济系统失衡
- 玩家成就感下降
- 长期游戏动力不足

### 5.2 设计方案

#### 5.2.1 灵石消耗系统

```typescript
// src/lib/game/economy/spiritStoneSink.ts

/** 灵石消耗途径定义 */
export interface SpiritStoneSink {
  id: string;
  name: string;
  description: string;
  
  // 消耗计算
  calculateCost: (params: Record<string, any>) => number;
  
  // 限制
  maxPerDay?: number;
  cooldown?: number; // 毫秒
  
  // 效果
  effect: SinkEffect;
}

/** 消耗效果 */
export interface SinkEffect {
  type: 'stat_boost' | 'item_reforge' | 'skill_upgrade' | 'appearance';
  description: string;
  apply: (player: Protagonist, cost: number) => void;
}

/** 灵石消耗途径配置 */
export const SPIRIT_STONE_SINKS: SpiritStoneSink[] = [
  {
    id: 'equipment_reforge',
    name: '装备重铸',
    description: '消耗灵石重新生成装备词缀',
    calculateCost: (params) => {
      const { level, rarity } = params;
      const rarityMultiplier: Record<ItemRarity, number> = {
        '普通': 1,
        '稀有': 2,
        '史诗': 5,
        '传说': 10,
      };
      return level * 100 * rarityMultiplier[rarity];
    },
    cooldown: 0,
    effect: {
      type: 'item_reforge',
      description: '重新生成装备词缀',
      apply: (player, cost) => {
        // 实现重铸逻辑
      },
    },
  },
  {
    id: 'technique_breakthrough',
    name: '功法突破',
    description: '消耗灵石提升功法等级上限',
    calculateCost: (params) => {
      const { currentMaxLevel } = params;
      return currentMaxLevel * 200;
    },
    maxPerDay: 3,
    effect: {
      type: 'skill_upgrade',
      description: '功法等级上限+1',
      apply: (player, cost) => {
        // 实现突破逻辑
      },
    },
  },
  {
    id: 'realm_breakthrough_assist',
    name: '境界突破辅助',
    description: '消耗灵石提高突破成功率15%',
    calculateCost: (params) => {
      const { realmLevel } = params;
      return realmLevel * 500;
    },
    maxPerDay: 5,
    effect: {
      type: 'stat_boost',
      description: '突破成功率+15%',
      apply: (player, cost) => {
        // 实现辅助逻辑
      },
    },
  },
  {
    id: 'stat_reset',
    name: '属性重置',
    description: '消耗灵石重新分配属性点',
    calculateCost: () => 1000,
    maxPerDay: 1,
    effect: {
      type: 'stat_boost',
      description: '重置所有属性点',
      apply: (player, cost) => {
        // 实现重置逻辑
      },
    },
  },
];

/** 装备重铸服务 */
export class EquipmentReforgeService {
  /** 执行重铸 */
  reforge(
    equipment: Equipment,
    player: Protagonist
  ): { success: boolean; cost: number; newAffixes?: EquipmentAffix[] } {
    const cost = this.calculateReforgeCost(equipment);
    
    // 检查灵石是否足够
    const spiritStone = getCurrency(player, 'spirit_stone');
    if (spiritStone < cost) {
      return { success: false, cost };
    }
    
    // 扣除灵石
    deductCurrency(player, 'spirit_stone', cost);
    
    // 生成新词缀
    const newAffixes = generateAffixes(equipment);
    
    return { success: true, cost, newAffixes };
  }
  
  /** 计算重铸消耗 */
  private calculateReforgeCost(equipment: Equipment): number {
    const sink = SPIRIT_STONE_SINKS.find(s => s.id === 'equipment_reforge')!;
    return sink.calculateCost({
      level: equipment.level,
      rarity: equipment.rarity,
    });
  }
}
```

#### 5.2.2 货币调节系统

```typescript
// src/lib/game/economy/currencyRegulator.ts

/** 货币调节配置 */
export interface CurrencyRegulation {
  currencyType: CurrencyType;
  
  // 产出调节
  productionMultiplier: number;
  
  // 等级相关调节
  levelScaling: {
    minLevel: number;
    maxLevel: number;
    multiplierRange: [number, number];
  };
}

/** 货币调节服务 */
export class CurrencyRegulator {
  /** 根据玩家等级调整货币产出 */
  adjustCurrencyReward(
    baseReward: number,
    currencyType: CurrencyType,
    playerLevel: number
  ): number {
    // 后期减少灵石产出
    if (currencyType === 'spirit_stone') {
      if (playerLevel >= 100) {
        return Math.floor(baseReward * 0.5);
      } else if (playerLevel >= 80) {
        return Math.floor(baseReward * 0.7);
      } else if (playerLevel >= 60) {
        return Math.floor(baseReward * 0.85);
      }
    }
    
    // 后期增加飞升印记产出
    if (currencyType === 'ascension_mark') {
      if (playerLevel >= 100) {
        return Math.floor(baseReward * 1.5);
      }
    }
    
    return baseReward;
  }
  
  /** 获取推荐消耗途径 */
  getRecommendedSinks(player: Protagonist): SpiritStoneSink[] {
    const spiritStone = getCurrency(player, 'spirit_stone');
    
    // 根据灵石数量推荐不同的消耗途径
    if (spiritStone > 100000) {
      return SPIRIT_STONE_SINKS.filter(s => 
        ['equipment_reforge', 'technique_breakthrough'].includes(s.id)
      );
    } else if (spiritStone > 10000) {
      return SPIRIT_STONE_SINKS.filter(s => 
        ['realm_breakthrough_assist', 'stat_reset'].includes(s.id)
      );
    }
    
    return [];
  }
}
```

#### 5.2.3 经济监控系统

```typescript
// src/lib/game/economy/economyMonitor.ts

/** 经济统计数据 */
export interface EconomyStatistics {
  // 货币统计
  totalSpiritStoneProduced: number;
  totalSpiritStoneConsumed: number;
  
  // 消耗途径统计
  sinkUsage: Record<string, number>; // sinkId -> 使用次数
  
  // 时间统计
  lastUpdated: number;
}

/** 经济监控服务 */
export class EconomyMonitor {
  private stats: EconomyStatistics = {
    totalSpiritStoneProduced: 0,
    totalSpiritStoneConsumed: 0,
    sinkUsage: {},
    lastUpdated: Date.now(),
  };
  
  /** 记录货币产出 */
  recordProduction(currencyType: CurrencyType, amount: number): void {
    if (currencyType === 'spirit_stone') {
      this.stats.totalSpiritStoneProduced += amount;
    }
    this.stats.lastUpdated = Date.now();
  }
  
  /** 记录货币消耗 */
  recordConsumption(sinkId: string, amount: number): void {
    this.stats.totalSpiritStoneConsumed += amount;
    this.stats.sinkUsage[sinkId] = (this.stats.sinkUsage[sinkId] || 0) + 1;
    this.stats.lastUpdated = Date.now();
  }
  
  /** 获取经济健康度 */
  getEconomyHealth(): {
    status: 'healthy' | 'inflation' | 'deflation';
    ratio: number;
    recommendation: string;
  } {
    const ratio = this.stats.totalSpiritStoneProduced / 
                  Math.max(1, this.stats.totalSpiritStoneConsumed);
    
    if (ratio > 5) {
      return {
        status: 'inflation',
        ratio,
        recommendation: '灵石通胀严重，建议增加消耗途径或减少产出',
      };
    } else if (ratio < 0.5) {
      return {
        status: 'deflation',
        ratio,
        recommendation: '灵石通缩，建议减少消耗或增加产出',
      };
    }
    
    return {
      status: 'healthy',
      ratio,
      recommendation: '经济系统健康',
    };
  }
  
  /** 获取统计数据 */
  getStatistics(): EconomyStatistics {
    return { ...this.stats };
  }
}
```

### 5.3 验证测试

```typescript
describe('Economy System Tests', () => {
  test('装备重铸消耗正确计算', () => {
    const service = new EquipmentReforgeService();
    const equipment = createMockEquipment({ level: 50, rarity: '史诗' });
    const cost = service.calculateReforgeCost(equipment);
    
    // 50级史诗装备：50 * 100 * 5 = 25000
    expect(cost).toBe(25000);
  });
  
  test('后期灵石产出减少', () => {
    const regulator = new CurrencyRegulator();
    
    const lowLevelReward = regulator.adjustCurrencyReward(100, 'spirit_stone', 10);
    const highLevelReward = regulator.adjustCurrencyReward(100, 'spirit_stone', 100);
    
    expect(highLevelReward).toBeLessThan(lowLevelReward);
  });
  
  test('经济监控系统正确计算通胀比', () => {
    const monitor = new EconomyMonitor();
    
    monitor.recordProduction('spirit_stone', 1000);
    monitor.recordProduction('spirit_stone', 1000);
    monitor.recordConsumption('equipment_reforge', 200);
    
    const health = monitor.getEconomyHealth();
    
    expect(health.ratio).toBe(10); // 2000/200
    expect(health.status).toBe('inflation');
  });
});
```

---

## 六、P1-2：地牢随机事件系统详细设计

### 6.1 问题分析

**当前问题**：
- 探索格子内容固定（敌人、宝箱、休息等）
- 内容可预测，缺乏惊喜
- 无随机事件机制

**影响**：
- 探索趣味性不足
- 内容消耗过快
- 重玩价值低

### 6.2 设计方案

#### 6.2.1 事件类型系统

```typescript
// src/lib/game/dungeon/eventSystem.ts

/** 地牢事件类型 */
export type DungeonEventType = 
  | 'treasure'        // 宝箱
  | 'mystery'         // 神秘事件
  | 'trap'            // 陷阱
  | 'merchant'        // 商人
  | 'shrine'          // 神殿
  | 'hidden_room'     // 隐藏房间
  | 'elite_guardian'  // 精英守护者
  | 'blessing';       // 祝福

/** 地牢事件 */
export interface DungeonEvent {
  id: string;
  type: DungeonEventType;
  name: string;
  description: string;
  icon: string;
  
  // 出现条件
  conditions?: {
    minLevel?: number;
    maxLevel?: number;
    minHp?: number;
    requiredItems?: string[];
    requiredStats?: Partial<CharacterStats>;
  };
  
  // 选项
  choices: DungeonChoice[];
  
  // 权重（用于随机抽取）
  weight: number;
}

/** 事件选择 */
export interface DungeonChoice {
  id: string;
  text: string;
  
  // 需求条件
  requirements?: {
    minLevel?: number;
    minHp?: number;
    item?: string;
    stats?: Partial<CharacterStats>;
  };
  
  // 结果（概率分布）
  outcomes: DungeonOutcome[];
}

/** 事件结果 */
export interface DungeonOutcome {
  probability: number; // 0-1
  effects: {
    hp?: number;
    mp?: number;
    spiritStones?: number;
    items?: { definition: ItemDefinition; quantity: number }[];
    buffs?: ActiveEffect[];
    teleport?: { row: number; col: number };
  };
  message: string;
}

/** 预定义事件 */
export const DUNGEON_EVENTS: DungeonEvent[] = [
  // 神秘事件
  {
    id: 'event_ancient_altar',
    type: 'mystery',
    name: '古老祭坛',
    description: '你发现了一座古老的祭坛，上面散发着神秘的光芒。',
    icon: '🏛️',
    weight: 10,
    choices: [
      {
        id: 'pray',
        text: '虔诚祈祷',
        outcomes: [
          {
            probability: 0.5,
            effects: { buffs: [{ type: 'stat_boost', stat: '灵根', value: 10, remainingCount: 5 }] },
            message: '神灵回应了你的祈祷，你感到灵力大增！',
          },
          {
            probability: 0.3,
            effects: { hp: -20 },
            message: '祭坛突然爆发出一阵暗光，你受到了反噬！',
          },
          {
            probability: 0.2,
            effects: { spiritStones: 100 },
            message: '祭坛中涌出一股灵气，凝聚成了灵石！',
          },
        ],
      },
      {
        id: 'take_risk',
        text: '强行吸收祭坛能量',
        requirements: { minLevel: 30 },
        outcomes: [
          {
            probability: 0.3,
            effects: { buffs: [{ type: 'stat_boost', stat: '体质', value: 5, remainingCount: -1 }] },
            message: '你成功吸收了祭坛的精华，体质永久提升！',
          },
          {
            probability: 0.5,
            effects: { hp: -50, mp: -30 },
            message: '能量过于强大，你的身体无法承受！',
          },
          {
            probability: 0.2,
            effects: { items: [{ definition: RARE_ARTIFACT, quantity: 1 }] },
            message: '祭坛崩塌，露出了一件古老的神器！',
          },
        ],
      },
      {
        id: 'leave',
        text: '离开',
        outcomes: [
          { probability: 1.0, effects: {}, message: '你决定不冒险，继续前进。' },
        ],
      },
    ],
  },
  
  // 宝箱事件
  {
    id: 'event_mysterious_chest',
    type: 'treasure',
    name: '神秘宝箱',
    description: '一个古老的宝箱静静地躺在角落，散发着微弱的光芒。',
    icon: '📦',
    weight: 15,
    choices: [
      {
        id: 'open',
        text: '打开宝箱',
        outcomes: [
          {
            probability: 0.4,
            effects: { items: [{ definition: RANDOM_RARE_ITEM, quantity: 1 }] },
            message: '宝箱打开，里面有一件稀有物品！',
          },
          {
            probability: 0.3,
            effects: { spiritStones: 200 },
            message: '宝箱里装满了灵石！',
          },
          {
            probability: 0.2,
            effects: { hp: -30 },
            message: '宝箱是一个陷阱！你受到了伤害！',
          },
          {
            probability: 0.1,
            effects: { items: [{ definition: LEGENDARY_ITEM, quantity: 1 }] },
            message: '宝箱发出耀眼光芒，里面竟然是一件传说装备！',
          },
        ],
      },
      {
        id: 'examine',
        text: '仔细检查',
        requirements: { stats: { 悟性: 30 } },
        outcomes: [
          {
            probability: 0.7,
            effects: {},
            message: '你发现这是一个安全的宝箱，可以放心打开。',
          },
          {
            probability: 0.3,
            effects: { hp: -10 },
            message: '你发现了陷阱并成功拆除，但还是受了点伤。',
          },
        ],
      },
      {
        id: 'leave',
        text: '离开',
        outcomes: [
          { probability: 1.0, effects: {}, message: '你决定不冒险，继续前进。' },
        ],
      },
    ],
  },
  
  // 商人事件
  {
    id: 'event_wandering_merchant',
    type: 'merchant',
    name: '流浪商人',
    description: '一个神秘的商人出现在你面前，他的货物看起来非常特别。',
    icon: '🧙',
    weight: 8,
    conditions: { minLevel: 10 },
    choices: [
      {
        id: 'buy_rare',
        text: '购买稀有物品（500灵石）',
        requirements: { item: 'spirit_stone_500' },
        outcomes: [
          {
            probability: 1.0,
            effects: { spiritStones: -500, items: [{ definition: RANDOM_RARE_ITEM, quantity: 1 }] },
            message: '你花费500灵石购买了一件稀有物品。',
          },
        ],
      },
      {
        id: 'trade',
        text: '交换情报（消耗一瓶丹药）',
        requirements: { item: 'random_pill' },
        outcomes: [
          {
            probability: 1.0,
            effects: { buffs: [{ type: 'stat_boost', stat: '悟性', value: 5, remainingCount: 3 }] },
            message: '商人告诉了你一些关于这座地牢的秘密，你受益匪浅。',
          },
        ],
      },
      {
        id: 'ignore',
        text: '无视商人',
        outcomes: [
          { probability: 1.0, effects: {}, message: '你无视了商人，继续前进。' },
        ],
      },
    ],
  },
  
  // 祝福事件
  {
    id: 'event_divine_blessing',
    type: 'blessing',
    name: '神圣祝福',
    description: '一道金光从天而降，你感到浑身充满了力量。',
    icon: '✨',
    weight: 5,
    conditions: { minLevel: 20 },
    choices: [
      {
        id: 'accept',
        text: '接受祝福',
        outcomes: [
          {
            probability: 0.6,
            effects: { hp: 50, mp: 30, buffs: [{ type: 'stat_boost', stat: '灵根', value: 10, remainingCount: 5 }] },
            message: '你接受了祝福，感到力量涌入体内！',
          },
          {
            probability: 0.3,
            effects: { hp: 30, mp: 20 },
            message: '祝福温和地治愈了你的伤势。',
          },
          {
            probability: 0.1,
            effects: { hp: -20, buffs: [{ type: 'stat_boost', stat: '意志', value: 20, remainingCount: 10 }] },
            message: '祝福的力量过于强大，你受到了一些伤害，但意志更加坚定了。',
          },
        ],
      },
      {
        id: 'refuse',
        text: '拒绝',
        outcomes: [
          { probability: 1.0, effects: {}, message: '你警惕地拒绝了，继续前进。' },
        ],
      },
    ],
  },
];
```

#### 6.2.2 事件触发系统

```typescript
// src/lib/game/dungeon/eventTrigger.ts

/** 事件触发配置 */
export interface EventTriggerConfig {
  // 触发概率
  baseProbability: number;
  
  // 修正因子
  modifiers: {
    lowHp: number;      // 低血量时
    highLevel: number;  // 高等级时
    firstVisit: number; // 首次访问时
  };
}

/** 默认触发配置 */
const DEFAULT_TRIGGER_CONFIG: EventTriggerConfig = {
  baseProbability: 0.15, // 15%基础概率
  modifiers: {
    lowHp: 1.5,    // 低血量时提高50%
    highLevel: 0.8, // 高等级时降低20%
    firstVisit: 2.0, // 首次访问时翻倍
  },
};

/** 事件触发服务 */
export class EventTriggerService {
  private triggeredEvents: Set<string> = new Set();
  
  /** 检查是否触发事件 */
  shouldTriggerEvent(
    cellType: CellType,
    player: Protagonist,
    config: EventTriggerConfig = DEFAULT_TRIGGER_CONFIG
  ): boolean {
    // 只有空格子和特定类型格子可以触发事件
    if (!['empty', 'event'].includes(cellType)) {
      return false;
    }
    
    let probability = config.baseProbability;
    
    // 低血量修正
    if (player.currentHp < player.maxHp * 0.3) {
      probability *= config.modifiers.lowHp;
    }
    
    // 高等级修正
    if (player.level >= 50) {
      probability *= config.modifiers.highLevel;
    }
    
    return Math.random() < probability;
  }
  
  /** 随机选择事件 */
  selectRandomEvent(player: Protagonist): DungeonEvent | null {
    // 过滤符合条件的事件
    const availableEvents = DUNGEON_EVENTS.filter(event => {
      if (event.conditions) {
        if (event.conditions.minLevel && player.level < event.conditions.minLevel) {
          return false;
        }
        if (event.conditions.maxLevel && player.level > event.conditions.maxLevel) {
          return false;
        }
        if (event.conditions.minHp && player.currentHp < event.conditions.minHp) {
          return false;
        }
      }
      return true;
    });
    
    if (availableEvents.length === 0) {
      return null;
    }
    
    // 加权随机选择
    const totalWeight = availableEvents.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const event of availableEvents) {
      random -= event.weight;
      if (random <= 0) {
        return event;
      }
    }
    
    return availableEvents[0];
  }
  
  /** 执行事件选择 */
  executeChoice(
    event: DungeonEvent,
    choiceId: string,
    player: Protagonist
  ): DungeonOutcome {
    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) {
      throw new Error(`Choice ${choiceId} not found in event ${event.id}`);
    }
    
    // 检查需求条件
    if (choice.requirements) {
      if (choice.requirements.minLevel && player.level < choice.requirements.minLevel) {
        throw new Error('等级不足');
      }
      if (choice.requirements.minHp && player.currentHp < choice.requirements.minHp) {
        throw new Error('生命值不足');
      }
    }
    
    // 按概率选择结果
    const random = Math.random();
    let cumulative = 0;
    
    for (const outcome of choice.outcomes) {
      cumulative += outcome.probability;
      if (random < cumulative) {
        return outcome;
      }
    }
    
    // 兜底：返回最后一个结果
    return choice.outcomes[choice.outcomes.length - 1];
  }
  
  /** 标记事件已触发 */
  markEventTriggered(eventId: string): void {
    this.triggeredEvents.add(eventId);
  }
  
  /** 检查事件是否已触发 */
  isEventTriggered(eventId: string): boolean {
    return this.triggeredEvents.has(eventId);
  }
}
```

### 6.3 验证测试

```typescript
describe('Dungeon Event System Tests', () => {
  test('事件概率分布符合配置', () => {
    const service = new EventTriggerService();
    const player = createMockPlayer({ level: 30 });
    
    let eventCount = 0;
    const trials = 10000;
    
    for (let i = 0; i < trials; i++) {
      if (service.shouldTriggerEvent('empty', player)) {
        eventCount++;
      }
    }
    
    // 概率应该在15%左右
    const ratio = eventCount / trials;
    expect(ratio).toBeGreaterThan(0.12);
    expect(ratio).toBeLessThan(0.18);
  });
  
  test('低血量时事件触发率提高', () => {
    const service = new EventTriggerService();
    const normalPlayer = createMockPlayer({ 
      level: 30,
      currentHp: 100,
      maxHp: 100,
    });
    const lowHpPlayer = createMockPlayer({ 
      level: 30,
      currentHp: 20,
      maxHp: 100,
    });
    
    const normalRate = testTriggerRate(service, normalPlayer, 1000);
    const lowHpRate = testTriggerRate(service, lowHpPlayer, 1000);
    
    expect(lowHpRate).toBeGreaterThan(normalRate);
  });
  
  test('事件选择结果符合概率分布', () => {
    const service = new EventTriggerService();
    const player = createMockPlayer({ level: 30 });
    const event = DUNGEON_EVENTS.find(e => e.id === 'event_ancient_altar')!;
    
    const outcomeCounts: Record<string, number> = {};
    const trials = 10000;
    
    for (let i = 0; i < trials; i++) {
      const outcome = service.executeChoice(event, 'pray', player);
      outcomeCounts[outcome.message] = (outcomeCounts[outcome.message] || 0) + 1;
    }
    
    // 概率应该接近配置值
    // pray 选项有三个结果：50%, 30%, 20%
    expect(outcomeCounts['神灵回应了你的祈祷，你感到灵力大增！'] / trials).toBeCloseTo(0.5, 1);
  });
});
```

---

## 七、实施计划

### 7.1 分阶段实施

| 阶段 | 内容 | 预计工时 | 依赖 |
|------|------|----------|------|
| **阶段一** | 战斗策略系统 | 1-2周 | 无 |
| **阶段二** | 经济平衡系统 | 3-5天 | 无 |
| **阶段三** | 地牢随机事件 | 1周 | 无 |
| **阶段四** | 终局玩法系统 | 2周 | 阶段一、二 |
| **阶段五** | 社交系统 | 2周 | 阶段四 |
| **阶段六** | 集成测试与优化 | 1周 | 全部 |

### 7.2 风险评估

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| 存档兼容性 | 🟠 中 | 新增字段使用可选类型，提供默认值 |
| 性能影响 | 🟡 低 | 新系统按需加载，懒初始化 |
| 平衡性问题 | 🟠 中 | 充分测试，提供配置热更新机制 |
| 玩家适应 | 🟡 低 | 新手引导，逐步解锁功能 |

### 7.3 验证清单

- [ ] 所有新数值有上下界约束
- [ ] 所有新状态有默认值
- [ ] 所有新功能有单元测试
- [ ] 存档兼容性测试通过
- [ ] 性能测试无明显下降
- [ ] 边界条件测试覆盖完整

---

## 八、附录

### 8.1 类型定义汇总

所有新增类型定义统一放置在：
- `src/lib/game/battle/types.ts` - 战斗系统类型
- `src/lib/game/ascension/types.ts` - 终局玩法类型
- `src/lib/game/economy/types.ts` - 经济系统类型
- `src/lib/game/dungeon/types.ts` - 地牢事件类型

### 8.2 配置文件位置

所有可配置项统一放置在：
- `src/lib/game/battle/config.ts` - 战斗配置
- `src/lib/game/ascension/config.ts` - 终局玩法配置
- `src/lib/game/economy/config.ts` - 经济配置
- `src/lib/game/dungeon/eventConfigs.ts` - 事件配置

### 8.3 测试文件位置

所有测试文件放置在：
- `__tests__/battle/` - 战斗系统测试
- `__tests__/ascension/` - 终局玩法测试
- `__tests__/economy/` - 经济系统测试
- `__tests__/dungeon/` - 地牢事件测试

---

*本设计文档基于 game-design-strict 零Bug游戏系统设计规范编写*
*版本历史：v1.0 初始设计 → v2.0 综合优化设计*

---

## 九、实施进度记录

### 9.1 阶段一：战斗策略系统 ✅ 已完成

**完成日期**: 2025年1月

**实现内容**:

1. **类型定义** (`src/lib/game/battle/types.ts`)
   - ✅ BattleActionType - 战斗行动类型
   - ✅ BattleAction - 战斗行动定义
   - ✅ BattleSkill - 战斗技能定义
   - ✅ StatBuff - 属性增益/减益
   - ✅ SpecialEffectType - 特殊效果类型
   - ✅ ExtendedBattleState - 扩展战斗状态
   - ✅ BattlePhase - 战斗阶段
   - ✅ DecisionOption - 决策选项
   - ✅ TurnResult - 回合结果
   - ✅ BattleStatistics - 战斗统计
   - ✅ TriggeredEvent - 触发事件
   - ✅ Enemy/PlayerData - 敌人/玩家数据类型

2. **战斗技能系统** (`src/lib/game/battle/skillSystem.ts`)
   - ✅ generateSkillFromTechnique - 从功法生成战斗技能
   - ✅ generateSkillsFromTechniques - 批量生成技能
   - ✅ isSkillUsable - 检查技能可用性
   - ✅ isSkillRecommended - 技能推荐判断
   - ✅ calculateSkillDamage - 技能伤害计算
   - ✅ updateSkillCooldowns - 更新技能冷却
   - ✅ getBasicAttackSkill/getDefendSkill/getFleeSkill - 基础技能

3. **战斗决策系统** (`src/lib/game/battle/decisionSystem.ts`)
   - ✅ getAvailableDecisions - 获取可用决策选项
   - ✅ executePlayerAction - 执行玩家行动
   - ✅ executeEnemyAction - 执行敌人行动
   - ✅ executeTurn - 执行完整回合
   - ✅ executeAutoTurn - 执行自动战斗回合
   - ✅ calculateFleeRate - 计算逃跑成功率

4. **战斗事件系统** (`src/lib/game/battle/eventSystem.ts`)
   - ✅ checkBattleEvents - 检测并生成战斗事件
   - ✅ applyEventEffect - 应用事件效果
   - ✅ addBuff/removeBuff - Buff管理
   - ✅ updateBuffDurations - 更新Buff持续时间
   - ✅ calculateBuffBonuses - 计算Buff属性加成
   - ✅ generateRandomBattleEvent - 生成随机战斗事件
   - ✅ formatEventMessages - 格式化事件消息

5. **战斗流程控制器** (`src/lib/game/battle/battleController.ts`)
   - ✅ createBattleState - 创建战斗状态
   - ✅ createBattleStatistics - 创建战斗统计
   - ✅ startBattle - 开始战斗
   - ✅ getCurrentDecisions - 获取当前可用决策
   - ✅ executePlayerTurn - 执行玩家回合
   - ✅ executeAutoPlayerTurn - 执行自动战斗回合
   - ✅ quickBattle - 快速战斗
   - ✅ settleBattle - 结算战斗
   - ✅ getBattleStatusSummary - 获取战斗状态摘要

6. **冒险集成层** (`src/lib/game/adventureBattleIntegration.ts`)
   - ✅ executeAutoBattle - 自动战斗（用于冒险模式）
   - ✅ initInteractiveBattle - 交互式战斗初始化
   - ✅ performPlayerAction - 执行玩家回合
   - ✅ estimateBattleDifficulty - 预估战斗难度
   - ✅ getBattlePreview - 获取战斗预览信息

**验证结果**:
- ✅ TypeScript 类型检查通过 (`npx tsc --noEmit`)
- ✅ 所有模块导出正常
- ✅ 与现有类型系统兼容

**待后续完善**:
- ⏳ UI组件集成（战斗界面重构）
- ⏳ 与 adventure.ts 的完整集成
- ⏳ 单元测试编写

### 9.2 后续阶段规划

| 阶段 | 状态 | 备注 |
|------|------|------|
| 阶段一：战斗策略系统 | ✅ 已完成 | 核心逻辑已实现 |
| 阶段二：经济平衡系统 | ⏳ 待实施 | - |
| 阶段三：地牢随机事件 | ⏳ 待实施 | - |
| 阶段四：终局玩法系统 | ⏳ 待实施 | - |
| 阶段五：社交系统 | ⏳ 待实施 | - |
| 阶段六：集成测试与优化 | ⏳ 待实施 | - |
