# 飞升系统设计文档

## 一、系统概述

### 1.1 背景
当前游戏在满级（100级）后，"挑战穿越守卫"按钮无响应，缺少完整的飞升流程。飞升是修仙类游戏的核心玩法之一，代表着角色突破当前世界束缚，前往更高层次世界的宏大事件。

### 1.2 设计目标
- 为满级玩家提供明确的进阶目标和成就感
- 实现跨世界观的游戏体验
- 增加游戏的可重玩性和长期留存
- 保持游戏平衡，飞升后重新开始但有永久提升

### 1.3 核心概念
- **穿越守卫**：守护世界边界的强大存在，必须击败才能飞升
- **飞升**：突破当前世界，前往新世界观的过程
- **轮回**：飞升后重置等级，但保留部分永久提升
- **飞升印记**：每次飞升获得的永久属性加成
- **命运抉择**：飞升后可选择留下的传承之物

---

## 二、飞升前置条件

### 2.1 基础条件（必须全部满足）
```typescript
interface AscensionRequirements {
  level: 100;              // 必须满级
  hpFull: boolean;         // HP必须满
  mpFull: boolean;         // MP必须满
}
```

### 2.2 可选条件（增加成功率）
| 条件 | 增加成功率 | 说明 |
|------|-----------|------|
| 心境稳定度 >= 70 | +5% | 心境稳固，突破更易 |
| 心境稳定度 >= 90 | +10% | 心境圆满 |
| 拥有飞升丹 | +10% | 珍贵丹药，辅助突破 |
| 流派等级 >= 5 | +5% | 流派精通，根基扎实 |
| 流派等级 >= 8 | +8% | 流派大成 |
| 全套传说装备 | +10% | 顶级装备加持 |
| 击败过50级渡劫 | +5% | 已有大劫经验 |

### 2.3 成功率计算
```typescript
function calculateSuccessRate(protagonist: Protagonist): number {
  let rate = 0.4; // 基础40%
  
  // 心境加成
  if (protagonist.mentalState?.stability >= 90) rate += 0.10;
  else if (protagonist.mentalState?.stability >= 70) rate += 0.05;
  
  // 道具加成
  const hasAscensionPill = protagonist.inventory.some(
    item => item.definition.id === 'ascension_pill'
  );
  if (hasAscensionPill) rate += 0.10;
  
  // 流派加成
  if (protagonist.pathLevel >= 8) rate += 0.08;
  else if (protagonist.pathLevel >= 5) rate += 0.05;
  
  // 装备加成
  const legendaryCount = protagonist.equipments.filter(
    eq => eq.rarity === '传说'
  ).length;
  if (legendaryCount >= 6) rate += 0.10;
  
  // 渡劫经验
  if (protagonist.tribulationPassed) rate += 0.05;
  
  // 上限95%
  return Math.min(0.95, rate);
}
```

### 2.4 UI 提示设计
```
条件状态显示：
┌─────────────────────────────────────────────┐
│  ⚔️ 穿越守卫挑战                             │
├─────────────────────────────────────────────┤
│  基础成功率：40%                             │
│  ─────────────────────────────────────      │
│  ✓ 等级已满（100级）                        │
│  ✓ 生命值已满                               │
│  ✓ 法力值已满                               │
│  ○ 心境稳定度 +5%（需70+，当前85）          │
│  ○ 拥有飞升丹 +10%（未拥有）                │
│  ○ 流派精通 +5%（需5级，当前3级）           │
│  ─────────────────────────────────────      │
│  预计成功率：45%                            │
│                                             │
│  [  挑战穿越守卫  ]                         │
│                                             │
│  ⚠️ 失败将损失大量状态，请谨慎挑战           │
└─────────────────────────────────────────────┘
```

---

## 三、穿越守卫战斗机制

### 3.1 守卫属性设计
穿越守卫的属性基于玩家当前属性进行缩放，确保战斗具有挑战性但不至于不可能。

```typescript
interface GuardianStats {
  name: string;           // 守卫名称（根据世界观不同）
  title: string;          // 守卫称号
  level: number;          // 守卫等级 = 玩家等级
  hp: number;             // HP = 玩家最大HP × 倍率
  maxHp: number;
  attack: number;         // 攻击 = 玩家攻击 × 1.5
  defense: number;        // 防御 = 玩家防御 × 1.2
  specialAbility: GuardianAbility[]; // 特殊能力列表
  phases: number;         // 战斗阶段数
  currentPhase: number;   // 当前阶段
  phaseThresholds: number[]; // 阶段血量阈值
  personality: string;    // 守卫性格（影响战斗风格）
}

// 守卫特殊能力
interface GuardianAbility {
  name: string;
  description: string;
  triggerCondition: 'phase' | 'hp' | 'round' | 'random';
  effect: AbilityEffect;
  cooldown: number;
  currentCooldown: number;
}

// 各世界观的穿越守卫详细配置
const WORLD_GUARDIANS: Record<WorldType, GuardianConfig> = {
  '修仙': {
    name: '天道化身',
    title: '天地法则的守护者',
    description: '化身天道，代行天罚。任何妄图突破世界壁垒者，必先过此关。',
    personality: '威严',
    hpMultiplier: 3.0,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.2,
    specialAbility: [
      {
        name: '天罚',
        description: '召唤天雷，造成大量伤害',
        triggerCondition: 'phase',
        effect: { type: 'damage', value: 1.5, target: 'player' },
        cooldown: 3
      },
      {
        name: '法则压制',
        description: '降低玩家所有属性10%',
        triggerCondition: 'hp',
        triggerValue: 0.5,
        effect: { type: 'debuff', stat: 'all', value: 0.1, duration: 3 },
        cooldown: 5
      },
      {
        name: '天道审判',
        description: '第三阶段终极技能，连续三次攻击',
        triggerCondition: 'phase',
        triggerPhase: 3,
        effect: { type: 'multi_attack', count: 3, damageMultiplier: 0.8 },
        cooldown: 4
      }
    ],
    phases: 3,
    phaseThresholds: [1.0, 0.5, 0.2], // 100%, 50%, 20%
    battleCries: {
      start: '凡人，竟敢妄图逆天而行！',
      phase2: '天道无情，尔等皆为蝼蚁！',
      phase3: '吾乃天道，何人能挡！',
      defeat: '天意...难违...'
    }
  },
  '高武': {
    name: '武道意志',
    title: '万古武道的化身',
    description: '汇聚万古武者意志，守护武道巅峰。',
    personality: '狂傲',
    hpMultiplier: 3.2,
    attackMultiplier: 1.6,
    defenseMultiplier: 1.1,
    specialAbility: [
      {
        name: '武魂附体',
        description: '召唤历代武者英魂，大幅提升攻击',
        triggerCondition: 'phase',
        effect: { type: 'buff', stat: 'attack', value: 0.5, duration: 3 },
        cooldown: 0
      },
      {
        name: '崩山拳',
        description: '蓄力一击，造成毁灭性伤害',
        triggerCondition: 'round',
        triggerValue: 5,
        effect: { type: 'damage', value: 2.0, target: 'player' },
        cooldown: 5
      }
    ],
    phases: 3,
    battleCries: {
      start: '武者，用你的拳头说话！',
      phase2: '不错！让我认真起来！',
      phase3: '这一战，痛快！',
      defeat: '后生可畏...武道后继有人...'
    }
  },
  '科技': {
    name: '系统终端',
    title: '维度守恒程序',
    description: '高级文明留下的维度守护系统，防止维度穿越。',
    personality: '冰冷',
    hpMultiplier: 2.8,
    attackMultiplier: 1.4,
    defenseMultiplier: 1.3,
    specialAbility: [
      {
        name: '数据重置',
        description: '强制重置玩家增益效果',
        triggerCondition: 'phase',
        effect: { type: 'dispel', target: 'player_buffs' },
        cooldown: 0
      },
      {
        name: '维度封锁',
        description: '封锁玩家技能，持续2回合',
        triggerCondition: 'hp',
        triggerValue: 0.5,
        effect: { type: 'silence', duration: 2 },
        cooldown: 6
      }
    ],
    phases: 3,
    battleCries: {
      start: '检测到非法穿越行为。启动拦截协议。',
      phase2: '警告：系统负载升高。提升战斗模式。',
      phase3: '终极协议启动。目标：清除入侵者。',
      defeat: '系统...崩溃...数据...丢失...'
    }
  },
  '魔幻': {
    name: '位面守护者',
    title: '诸神留下的守望者',
    description: '诸神时代留下的强大存在，守护位面不被侵犯。',
    personality: '神秘',
    hpMultiplier: 3.0,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.2,
    specialAbility: [
      {
        name: '禁咒封印',
        description: '封印玩家魔力，降低MP回复',
        triggerCondition: 'phase',
        effect: { type: 'mp_block', value: 0.5, duration: 3 },
        cooldown: 0
      },
      {
        name: '元素风暴',
        description: '召唤四元素攻击',
        triggerCondition: 'random',
        triggerValue: 0.3,
        effect: { type: 'random_damage', min: 1.0, max: 2.0 },
        cooldown: 3
      }
    ],
    phases: 3,
    battleCries: {
      start: '凡人，这里不是你该来的地方。',
      phase2: '诸神的愤怒，你承受不起。',
      phase3: '既然如此...让诸神的制裁降临吧！',
      defeat: '诸神...已经离去了吗...'
    }
  },
  '异能': {
    name: '觉醒之源',
    title: '异能的起源与终结',
    description: '所有异能的源头，也是异能者的最终归宿。',
    personality: '混沌',
    hpMultiplier: 3.0,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.2,
    specialAbility: [
      {
        name: '异能共鸣',
        description: '复制玩家上一个技能并反击',
        triggerCondition: 'round',
        triggerValue: 3,
        effect: { type: 'copy_skill' },
        cooldown: 4
      },
      {
        name: '异能剥夺',
        description: '随机封印一个技能槽',
        triggerCondition: 'hp',
        triggerValue: 0.6,
        effect: { type: 'seal_slot', duration: 3 },
        cooldown: 5
      }
    ],
    phases: 3,
    battleCries: {
      start: '又一个觉醒者...想要回归本源吗？',
      phase2: '你的力量...我很熟悉...',
      phase3: '那就...彻底觉醒吧！',
      defeat: '你...已经超越了起源...'
    }
  },
  '仙侠': {
    name: '天道化身',
    title: '天道意志',
    description: '天之道的化身，维护天地秩序。',
    personality: '超然',
    hpMultiplier: 3.0,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.2,
    specialAbility: [
      {
        name: '天罚',
        description: '召唤天雷，造成大量伤害',
        triggerCondition: 'phase',
        effect: { type: 'damage', value: 1.5, target: 'player' },
        cooldown: 3
      }
    ],
    phases: 3,
    battleCries: {
      start: '道友，回头是岸。',
      phase2: '天道无常，顺应自然。',
      phase3: '既然执意如此...',
      defeat: '道...可道...'
    }
  },
  '武侠': {
    name: '武道真意',
    title: '天下第一',
    description: '武道的极致，所有武者心中的那座高峰。',
    personality: '侠义',
    hpMultiplier: 3.0,
    attackMultiplier: 1.6,
    defenseMultiplier: 1.1,
    specialAbility: [
      {
        name: '天人合一',
        description: '进入天人合一状态，攻击必中',
        triggerCondition: 'phase',
        effect: { type: 'buff', stat: 'accuracy', value: 1.0, duration: 3 },
        cooldown: 0
      }
    ],
    phases: 3,
    battleCries: {
      start: '请赐教。',
      phase2: '好武功！让我认真对待。',
      phase3: '这一战，问心无愧！',
      defeat: '长江后浪推前浪...'
    }
  },
  '末世': {
    name: '末日审判',
    title: '毁灭与新生',
    description: '末世的终点，也是新世界的起点。',
    personality: '悲悯',
    hpMultiplier: 3.2,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.2,
    specialAbility: [
      {
        name: '毁灭降临',
        description: '召唤末日灾难',
        triggerCondition: 'phase',
        effect: { type: 'aoe_damage', value: 1.2 },
        cooldown: 3
      },
      {
        name: '新生之门',
        description: '自我恢复HP',
        triggerCondition: 'hp',
        triggerValue: 0.3,
        effect: { type: 'heal', value: 0.2 },
        cooldown: 8
      }
    ],
    phases: 3,
    battleCries: {
      start: '穿越者...末日之后，可有新生？',
      phase2: '毁灭是宿命，新生是希望。',
      phase3: '那就...用你的方式，证明新生！',
      defeat: '愿你在新世界...找到希望...'
    }
  }
};
```

### 3.2 三阶段战斗系统

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        穿越守卫战斗流程                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐        │
│  │    第一阶段     │ -> │    第二阶段     │ -> │    第三阶段     │        │
│  │   (100%-50%HP) │    │   (50%-20%HP)  │    │   (20%-0%HP)   │        │
│  └────────────────┘    └────────────────┘    └────────────────┘        │
│         │                     │                     │                  │
│         v                     v                     v                  │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐        │
│  │ • 常规攻击     │    │ • 特殊能力激活  │    │ • 狂暴模式      │        │
│  │ • 偶尔技能     │    │ • 强力技能     │    │ • 连续技能      │        │
│  │ • 测试玩家     │    │ • 召唤助手     │    │ • 真正伤害      │        │
│  │                 │    │ • 削弱效果     │    │ • 绝境反击      │        │
│  └────────────────┘    └────────────────┘    └────────────────┘        │
│                                                                         │
│  战斗上限：20回合                                                        │
│  玩家失败：HP降为0                                                       │
│  玩家胜利：守卫HP降为0                                                   │
│  平局判定：回合耗尽，判玩家失败                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 战斗奖励计算
```typescript
interface BattleResult {
  victory: boolean;
  turnsUsed: number;
  remainingHpPercent: number;
  remainingMpPercent: number;
  damageDealt: number;
  damageTaken: number;
  skillsUsed: string[];
  phasesCleared: number;
}

function calculateAscensionReward(result: BattleResult): AscensionReward {
  if (!result.victory) {
    // 失败惩罚
    return {
      success: false,
      penalty: {
        hpLoss: 0.3,           // 损失30%最大HP
        mentalDrop: 20,        // 心境下降20
        demonChanceAdd: 10,    // 心魔概率+10%
        cooldownHours: 24,     // 24小时冷却
        phasesCleared: result.phasesCleared, // 记录清除了几个阶段
      }
    };
  }
  
  // 胜利奖励计算
  let statBonus = 10;  // 基础属性加成
  let bonusMultiplier = 1.0;
  let bonusRewards: BonusReward[] = [];
  
  // 表现奖励
  if (result.turnsUsed <= 8) {
    bonusMultiplier += 0.2;
    bonusRewards.push({ type: 'speed_clear', name: '速战速决', bonus: 0.2 });
  }
  if (result.remainingHpPercent >= 70) {
    bonusMultiplier += 0.15;
    bonusRewards.push({ type: 'low_damage', name: '游刃有余', bonus: 0.15 });
  }
  if (result.remainingHpPercent >= 50) {
    bonusMultiplier += 0.1;
    bonusRewards.push({ type: 'solid_win', name: '稳操胜券', bonus: 0.1 });
  }
  if (result.phasesCleared === 3 && result.turnsUsed <= 15) {
    bonusMultiplier += 0.1;
    bonusRewards.push({ type: 'perfect', name: '完美飞升', bonus: 0.1 });
  }
  
  return {
    success: true,
    statBonus: Math.floor(statBonus * bonusMultiplier),
    bonusRewards,
    bonusMultiplier,
  };
}
```

---

## 四、飞升成功流程

### 4.1 核心设计：随机世界生成

**设计理念**：飞升是突破世界壁垒的过程，穿越后到达哪个世界是由宇宙法则随机决定的，代表命运的不可预测性。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           飞升成功！                                     │
│                                                                         │
│         恭喜你击败了【天道化身】，成功突破世界壁垒！                       │
│                                                                         │
│                      ✨ 世界通道已开启 ✨                                │
│                                                                         │
│         ┌─────────────────────────────────────────────┐                │
│         │                                             │                │
│         │      正在感应新世界的召唤...                 │                │
│         │                                             │                │
│         │         ████████████████                    │                │
│         │         █  命运之轮转动中  █                 │                │
│         │         ████████████████                    │                │
│         │                                             │                │
│         │           ▼ ▼ ▼ ▼ ▼                        │                │
│         │                                             │                │
│         │      【新世界已确定】                        │                │
│         │                                             │                │
│         │      世界类型：魔幻世界                      │                │
│         │      世界名称：艾尔德兰大陆                  │                │
│         │      魔法充盈度：极高                        │                │
│         │                                             │                │
│         └─────────────────────────────────────────────┘                │
│                                                                         │
│                    [ 确认前往新世界 ]                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 世界随机生成规则

```typescript
interface NewWorldInfo {
  type: WorldType;           // 世界类型
  name: string;              // 世界名称（随机生成）
  description: string;       // 世界描述
  difficulty: number;        // 难度系数（1.0-2.0，根据飞升次数增加）
  specialFeatures: string[]; // 世界特性
  resourceAbundance: number; // 资源丰富度
  danger: string;            // 危险等级描述
}

// 世界名称生成器
const WORLD_NAME_GENERATORS: Record<WorldType, string[]> = {
  '修仙': ['青云界', '玄天大陆', '灵域', '仙霞山', '问道山', '长生界', '九天仙域'],
  '高武': ['武神大陆', '百战域', '龙腾神州', '玄武界', '天武山', '破苍穹'],
  '科技': ['银河联邦', '机械之心', '星渊', '数据之海', '量子领域', '新纪元'],
  '魔幻': ['艾尔德兰', '魔法之源', '元素之地', '龙之谷', '精灵之森', '暗影界'],
  '异能': ['觉醒之城', '异域', '超能联邦', '变异之地', '源能世界', '新人类纪元'],
  '仙侠': ['剑仙大陆', '问道天涯', '仙缘界', '青云门', '万剑山', '仙侠传'],
  '武侠': ['江湖', '武林', '侠客行', '武林盟', '华山论剑', '武林风云'],
  '末世': ['废土', '末世残存', '求生之地', '新世界', '希望之城', '黎明破晓']
};

// 世界特性库
const WORLD_FEATURES: Record<WorldType, string[]> = {
  '修仙': [
    '灵气浓郁，修炼速度+20%',
    '天材地宝众多',
    '宗门林立，机缘众多',
    '妖兽横行，危险与机遇并存',
    '古道遗迹遍布',
    '仙人洞府现世'
  ],
  '高武': [
    '武道昌盛，武馆遍布',
    '武者圣地，突破更容易',
    '妖魔横行，需小心应对',
    '武道传承丰富',
    '百战之地，成长迅速',
    '武魂觉醒率高'
  ],
  '科技': [
    '科技高度发达',
    '资源采集效率高',
    '人工智能辅助',
    '基因进化技术成熟',
    '星际航道开通',
    '能源充足'
  ],
  '魔幻': [
    '魔法元素充沛',
    '龙族栖息地',
    '精灵王国',
    '魔法学院众多',
    '神器遗迹',
    '魔法生物丰富'
  ],
  '异能': [
    '觉醒者众多',
    '异能进化更容易',
    '异能组织林立',
    '基因变异频发',
    '神秘遗迹',
    '源能矿脉丰富'
  ],
  '仙侠': [
    '剑修圣地',
    '仙缘众多',
    '飞剑传说道',
    '炼丹术发达',
    '仙侠世家',
    '古剑冢'
  ],
  '武侠': [
    '江湖风云',
    '门派林立',
    '武功秘籍众多',
    '武林大会定期举办',
    '侠客云集',
    '奇人异事频发'
  ],
  '末世': [
    '资源稀缺但珍贵',
    '变异生物众多',
    '幸存者聚落',
    '废墟遗迹丰富',
    '新秩序建立中',
    '进化者联盟'
  ]
};

function generateNewWorld(ascensionCount: number): NewWorldInfo {
  // 1. 随机选择世界类型（排除当前世界）
  const allTypes: WorldType[] = ['修仙', '高武', '科技', '魔幻', '异能', '仙侠', '武侠', '末世'];
  const weights = calculateWorldWeights(ascensionCount);
  const selectedType = weightedRandom(allTypes, weights);
  
  // 2. 随机生成世界名称
  const names = WORLD_NAME_GENERATORS[selectedType];
  const worldName = names[Math.floor(Math.random() * names.length)];
  
  // 3. 随机选择世界特性（1-3个）
  const features = WORLD_FEATURES[selectedType];
  const featureCount = Math.random() > 0.7 ? 3 : Math.random() > 0.4 ? 2 : 1;
  const selectedFeatures = shuffle(features).slice(0, featureCount);
  
  // 4. 计算难度系数
  const difficulty = 1.0 + (ascensionCount * 0.1);
  
  // 5. 随机资源丰富度
  const resourceAbundance = 0.8 + Math.random() * 0.4;
  
  // 6. 危险等级
  const dangerLevels = ['安全', '普通', '危险', '高危', '死亡之地'];
  const dangerIndex = Math.min(4, Math.floor(difficulty - 1 + Math.random() * 2));
  
  return {
    type: selectedType,
    name: worldName,
    description: generateWorldDescription(selectedType, worldName, selectedFeatures),
    difficulty,
    specialFeatures: selectedFeatures,
    resourceAbundance,
    danger: dangerLevels[dangerIndex],
  };
}

// 世界权重计算（飞升次数越多，越可能进入稀有世界）
function calculateWorldWeights(ascensionCount: number): Record<WorldType, number> {
  return {
    '修仙': 10 + ascensionCount,
    '高武': 10,
    '科技': 8 + ascensionCount * 0.5,
    '魔幻': 6 + ascensionCount * 0.8,
    '异能': 8 + ascensionCount * 0.3,
    '仙侠': 10,
    '武侠': 10,
    '末世': 5 + ascensionCount,
  };
}
```

### 4.3 飞升成功完整流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         飞升成功完整流程                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  步骤1: 战斗胜利                                                         │
│    └─> 守卫倒下动画                                                      │
│    └─> 显示战斗结算（回合数、剩余HP、表现评价）                            │
│    └─> 计算奖励倍率                                                      │
│                                                                         │
│  步骤2: 命运抉择（可选）                                                  │
│    └─> 选择传承功法（从已拥有功法中选1本）                                 │
│    └─> 选择传承装备（从已拥有装备中选1件）                                 │
│    └─> 选择携带灵石比例（最多50%）                                        │
│    └─> 可跳过（不传承任何东西）                                           │
│                                                                         │
│  步骤3: 世界随机                                                         │
│    └─> 命运之轮动画                                                      │
│    └─> 随机生成新世界                                                    │
│    └─> 展示新世界信息                                                    │
│    └─> 确认前往                                                          │
│                                                                         │
│  步骤4: 飞升动画                                                         │
│    └─> 天空裂开效果                                                      │
│    └─> 光芒吞噬角色                                                      │
│    └─> 穿越时空隧道                                                      │
│    └─> 新世界降临                                                        │
│                                                                         │
│  步骤5: 重生结算                                                         │
│    └─> 等级重置为1级                                                     │
│    └─> 属性重置（基础值 + 飞升印记加成）                                   │
│    └─> 应用新世界特性                                                    │
│    └─> 获得飞升称号                                                      │
│    └─> 更新飞升历史                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4 命运抉择界面

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ⚜️ 命运抉择 ⚜️                                     │
│                                                                         │
│      突破世界壁垒之际，你可选择带走部分传承...                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📜 传承功法（选择1本）                    [已选：天罡剑诀]      │   │
│  │                                                                   │   │
│  │  ○ 天罡剑诀 - 传说级 - 攻击功法                                   │   │
│  │  ○ 太乙真经 - 史诗级 - 防御功法                                   │   │
│  │  ○ 不传承功法                                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ⚔️ 传承装备（选择1件）                    [已选：诛仙剑]        │   │
│  │                                                                   │   │
│  │  ○ 诛仙剑 - 传说级 - 近战武器                                     │   │
│  │  ○ 天道战甲 - 史诗级 - 身体护甲                                   │   │
│  │  ○ 不传承装备                                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  💎 携带灵石                                [已选：50%]           │   │
│  │                                                                   │   │
│  │  当前灵石：12,580                                                 │   │
│  │  携带数量：6,290（最大50%）                                       │   │
│  │  ────────────────●────────────────  50%                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│           [ 确认选择并继续 ]    [ 放弃所有传承 ]                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.5 飞升印记系统

```typescript
interface AscensionMark {
  count: number;           // 飞升总次数
  totalStatBonus: {        // 累计属性加成
    体质: number;
    灵根: number;
    悟性: number;
    幸运: number;
    意志: number;
  };
  unlockedTitles: string[];           // 已解锁称号
  specialAbilities: string[];         // 特殊能力
  currentTitle: string | null;        // 当前佩戴称号
  worldRecords: WorldVisitRecord[];   // 世界访问记录
}

// 飞升次数奖励
const ASCENSION_MILESTONES: Record<number, AscensionReward> = {
  1: {
    statBonus: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 },
    title: '飞升者',
    ability: '跨界感知',
    description: '感知其他世界的存在，世界选择时可以重新随机一次'
  },
  2: {
    statBonus: { 体质: 8, 灵根: 8, 悟性: 8, 幸运: 8, 意志: 8 },
    title: '多界行者',
    ability: '经验传承',
    description: '经验获取+10%，修炼速度提升'
  },
  3: {
    statBonus: { 体质: 7, 灵根: 7, 悟性: 7, 幸运: 7, 意志: 7 },
    title: '世界穿梭者',
    ability: '传承强化',
    description: '传承功法/装备等级+2'
  },
  5: {
    statBonus: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 },
    title: '万界至尊',
    ability: '命运眷顾',
    description: '世界特性更有利，资源丰富度+20%'
  },
  10: {
    statBonus: { 体质: 15, 灵根: 15, 悟性: 15, 幸运: 15, 意志: 15 },
    title: '永恒存在',
    ability: '轮回不灭',
    description: '解锁专属技能树，可以携带2本功法和2件装备'
  },
};

// 称号系统
const TITLE_SYSTEM: Record<string, TitleEffect> = {
  '飞升者': {
    description: '突破世界壁垒的勇者',
    effects: ['跨界感知'],
    display: '✨ 飞升者'
  },
  '多界行者': {
    description: '行走于多个世界的旅者',
    effects: ['经验+10%'],
    display: '🌟 多界行者'
  },
  '世界穿梭者': {
    description: '在世界间自由穿梭的强者',
    effects: ['传承等级+2'],
    display: '💫 世界穿梭者'
  },
  '万界至尊': {
    description: '征服多个世界的霸主',
    effects: ['资源+20%', '特性加成'],
    display: '👑 万界至尊'
  },
  '永恒存在': {
    description: '超脱轮回的永恒之身',
    effects: ['双传承', '专属技能'],
    display: '∞ 永恒存在'
  }
};
```

### 4.6 重置与保留详细规则

```typescript
interface ResetRules {
  // 完全保留
  keepFull: {
    ascensionMark: AscensionMark;      // 飞升印记
    titles: string[];                   // 称号
    achievements: string[];             // 成就
    collection: CollectionData;         // 图鉴
    worldRecords: WorldVisitRecord[];   // 世界访问记录
    playTime: number;                   // 累计游戏时间
    ascensionHistory: AscensionRecord[]; // 飞升历史
  };
  
  // 部分保留
  keepPartial: {
    spiritStones: number;               // 灵石（最高50%）
    inheritanceTechnique: Technique;    // 传承功法（1本）
    inheritanceEquipment: Equipment;    // 传承装备（1件）
    // 飞升10次后可携带更多
    extraTechnique?: Technique;         // 额外功法（10次后）
    extraEquipment?: Equipment;         // 额外装备（10次后）
  };
  
  // 完全重置
  reset: {
    level: 1;                           // 等级
    experience: 0;                      // 经验
    stats: CharacterStats;              // 属性（重置为基础值 + 印记加成）
    currentHp: number;                  // 当前HP
    currentMp: number;                  // 当前MP
    techniques: Technique[];            // 功法（仅保留传承）
    equipments: Equipment[];            // 装备（仅保留传承）
    inventory: InventoryItem[];         // 物品
    cultivationPath: CultivationPath;   // 流派
    pathLevel: number;                  // 流派等级
    faction: FactionProgress;           // 势力
    cooldowns: CooldownState;           // 冷却
    mentalState: MentalState;           // 心境（重置为稳定）
  };
  
  // 新世界特有
  newWorld: {
    world: World;                       // 新世界
    worldFeatures: string[];            // 世界特性
    difficultyMultiplier: number;       // 难度系数
    startingBonus: StartingBonus;       // 开局加成
  };
}
```

---

## 五、飞升失败处理

### 5.1 失败惩罚机制
```typescript
interface AscensionPenalty {
  // 必定惩罚
  mandatory: {
    hpLoss: number;           // 损失最大HP的30%
    mpLoss: number;           // 损失最大MP的30%
    mentalDrop: number;       // 心境稳定度下降20
    demonChanceAdd: number;   // 心魔概率+10%
  };
  
  // 可选惩罚（根据阶段）
  conditional: {
    phasesCleared: number;    // 清除的阶段数（0-3）
    // 清除阶段越多，惩罚越轻
    reducedPenalty: number;   // 惩罚减免比例
  };
  
  // 冷却机制
  cooldown: {
    base: number;             // 基础冷却24小时
    max: number;              // 最大冷却72小时
    consecutiveFailures: number; // 连续失败次数
  };
}
```

### 5.2 冷却时间计算
```typescript
function calculateCooldown(consecutiveFailures: number): number {
  const baseHours = 24;
  const multiplier = Math.pow(2, consecutiveFailures - 1);
  const maxHours = 72;
  
  return Math.min(maxHours, baseHours * multiplier);
}

// 示例：
// 第1次失败：24小时
// 第2次失败：48小时
// 第3次及以后：72小时（上限）
```

### 5.3 心魔触发机制
```typescript
function checkDemonTrigger(
  mentalStability: number,
  hasFailed: boolean
): DemonTriggerResult {
  if (!hasFailed) return { triggered: false };
  
  let probability = 0;
  
  if (mentalStability < 30) {
    probability = 1.0;  // 必定触发
  } else if (mentalStability < 50) {
    probability = 0.5;  // 50%概率
  } else if (mentalStability < 70) {
    probability = 0.2;  // 20%概率
  } else {
    probability = 0.05; // 5%概率
  }
  
  const triggered = Math.random() < probability;
  
  return {
    triggered,
    probability,
    severity: mentalStability < 30 ? 'severe' : mentalStability < 50 ? 'moderate' : 'mild'
  };
}
```

### 5.4 失败界面设计
```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ⚠️ 飞升失败 ⚠️                                 │
│                                                                         │
│      你在与【天道化身】的战斗中落败...                                    │
│                                                                         │
│      "天道不可违，回去吧..."                                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📊 战斗统计                                                      │   │
│  │                                                                   │   │
│  │  战斗回合：12回合                                                 │   │
│  │  突破阶段：2/3                                                    │   │
│  │  造成伤害：45,230                                                 │   │
│  │                                                                   │   │
│  │  💔 损失惩罚                                                      │   │
│  │  • 最大HP -30%                                                    │   │
│  │  • 最大MP -30%                                                    │   │
│  │  • 心境稳定度 -20（阶段减免：+10）                                 │   │
│  │  • 心魔概率 +10%                                                  │   │
│  │                                                                   │   │
│  │  ⏰ 冷却时间：24小时                                               │   │
│  │  可再次挑战时间：2024-01-15 14:30                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                    [ 返回修炼 ]    [ 查看战斗回放 ]                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 六、UI/UX 完整设计

### 6.1 挑战入口设计
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 修炼面板（满级时显示）                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  ⚔️ 穿越守卫 ⚔️                            已达此界巅峰！          │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │                                                                     │ │
│  │  守卫：天道化身                                                      │ │
│  │  "天地法则的守护者，任何妄图突破世界壁垒者，必先过此关。"             │ │
│  │                                                                     │ │
│  │  ─────────────────────────────────────────────────────────────     │ │
│  │                                                                     │ │
│  │  挑战条件：                                                          │ │
│  │  ✅ 等级已满（100级）                                               │ │
│  │  ✅ 生命值已满                                                       │ │
│  │  ✅ 法力值已满                                                       │ │
│  │                                                                     │ │
│  │  ─────────────────────────────────────────────────────────────     │ │
│  │                                                                     │ │
│  │  成功率加成：                                                        │ │
│  │  • 基础成功率：40%                                                  │ │
│  │  • 心境稳定度(85)：+5%                                              │ │
│  │  • 流派精通(3级)：未达标（需5级）                                    │ │
│  │  • 飞升丹：未拥有                                                   │ │
│  │  ────────────────────                                               │ │
│  │  预计成功率：45%                                                    │ │
│  │                                                                     │ │
│  │  ████████████████████████████████░░░░░░░░░░░░░░░░░░░░ 45%          │ │
│  │                                                                     │ │
│  │  ─────────────────────────────────────────────────────────────     │ │
│  │                                                                     │ │
│  │           [ ⚔️ 挑战穿越守卫 ]                                       │ │
│  │                                                                     │ │
│  │  ⚠️ 提示：失败将损失大量状态，建议准备充分后再战                      │ │
│  │                                                                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 战斗界面特效
- **守卫出场**：天空裂开，守卫从裂缝中降临
- **阶段转换**：守卫外形变化，背景改变
- **技能释放**：专属技能名称 + 动画效果
- **胜利瞬间**：守卫消散，光芒冲天

### 6.3 飞升动画序列
```
1. 胜利结算
   └─> 守卫倒下 + 战果统计

2. 命运抉择
   └─> 选择传承物品（可选跳过）

3. 世界随机
   └─> 命运之轮旋转动画
   └─> 世界卡片翻转揭示

4. 穿越通道
   └─> 天空完全裂开
   └─> 光柱吞噬角色
   └─> 时空隧道穿梭

5. 新世界降临
   └─> 新世界观场景展现
   └─> 角色重生动画
   └─> 飞升奖励展示
```

---

## 七、数据结构定义

### 7.1 核心类型
```typescript
// src/lib/game/typesExtension.ts

// 飞升印记
export interface AscensionMark {
  count: number;                        // 飞升次数
  totalStatBonus: CharacterStats;       // 累计属性加成
  unlockedTitles: string[];             // 已解锁称号
  specialAbilities: string[];           // 特殊能力
  currentTitle: string | null;          // 当前佩戴称号
  rerollAvailable: boolean;             // 是否有重新随机机会
}

// 世界访问记录
export interface WorldVisitRecord {
  worldType: WorldType;                 // 世界类型
  worldName: string;                    // 世界名称
  visitedAt: number;                    // 访问时间
  ascendedFrom: boolean;                // 是否从这里飞升
  timeSpent: number;                    // 停留时长
  maxLevel: number;                     // 达到的最高等级
}

// 飞升记录
export interface AscensionRecord {
  id: string;
  timestamp: number;                    // 飞升时间
  fromWorld: WorldType;                 // 原世界
  fromWorldName: string;                // 原世界名称
  toWorld: WorldType;                   // 新世界
  toWorldName: string;                  // 新世界名称
  battleResult: {
    turnsUsed: number;
    remainingHpPercent: number;
    phasesCleared: number;
    bonusRewards: string[];
  };
  inheritance: {
    technique: string | null;           // 传承功法ID
    equipment: string | null;           // 传承装备ID
    spiritStones: number;               // 携带灵石
  };
  reward: {
    statBonus: CharacterStats;
    title: string;
  };
}

// 穿越守卫状态
export interface GuardianBattleState {
  guardian: GuardianStats;              // 守卫属性
  currentPhase: number;                 // 当前阶段
  playerBonusActive: boolean;           // 玩家加成是否激活
  cooldownUntil: number | null;         // 冷却结束时间
  consecutiveFailures: number;          // 连续失败次数
}

// Protagonist 扩展
declare module './types' {
  interface Protagonist {
    ascensionMark?: AscensionMark;      // 飞升印记
    ascensionHistory?: AscensionRecord[]; // 飞升历史
    guardianBattle?: GuardianBattleState; // 守卫战斗状态
    worldRecords?: WorldVisitRecord[];  // 世界访问记录
    inheritanceTechnique?: Technique | null; // 传承功法
    inheritanceEquipment?: Equipment | null; // 传承装备
    carriedSpiritStones?: number;       // 携带灵石
  }
}
```

### 7.2 配置文件
```typescript
// src/lib/data/ascensionData.ts

export const ASCENSION_CONFIG = {
  // 基础成功率
  baseSuccessRate: 0.4,
  
  // 战斗参数
  battle: {
    maxTurns: 20,
    hpMultiplier: 3.0,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.2,
    phaseThresholds: [1.0, 0.5, 0.2],
  },
  
  // 属性加成（每次飞升）
  statBonusPerAscension: {
    1: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 },
    2: { 体质: 8, 灵根: 8, 悟性: 8, 幸运: 8, 意志: 8 },
    3: { 体质: 7, 灵根: 7, 悟性: 7, 幸运: 7, 意志: 7 },
    5: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 },
    10: { 体质: 15, 灵根: 15, 悟性: 15, 幸运: 15, 意志: 15 },
  },
  
  // 失败惩罚
  penalty: {
    hpLossPercent: 0.3,
    mpLossPercent: 0.3,
    mentalDrop: 20,
    demonChanceAdd: 10,
    cooldownBaseHours: 24,
    cooldownMaxHours: 72,
  },
  
  // 传承限制
  inheritance: {
    maxSpiritStonesPercent: 0.5,
    maxTechniques: 1,
    maxEquipments: 1,
    // 飞升10次后
    extraSlots: {
      ascensionRequired: 10,
      extraTechniques: 1,
      extraEquipments: 1,
    },
  },
};
```

---

## 八、实现步骤

### 8.1 第一阶段：基础框架（优先级最高）
1. 创建 `ascensionData.ts` 配置文件
2. 扩展 `typesExtension.ts` 添加飞升相关类型
3. 实现 `ascensionLogic.ts` 核心逻辑函数
4. 在 `useGameState.tsx` 中实现 `challengeGuardian` 回调
5. 修复现有 `onChallengeGuardian` 未传递的问题

### 8.2 第二阶段：战斗系统
1. 创建 `GuardianBattle.tsx` 战斗组件
2. 实现三阶段战斗逻辑
3. 添加守卫特殊技能和AI
4. 实现战斗结算和奖励计算

### 8.3 第三阶段：飞升流程
1. 创建 `InheritanceSelect.tsx` 传承选择组件
2. 创建 `WorldReveal.tsx` 世界揭示组件
3. 实现世界随机生成逻辑
4. 实现属性重置和印记保留
5. 添加飞升动画效果

### 8.4 第四阶段：完善优化
1. 添加飞升成就系统
2. 实现称号系统
3. 优化UI/UX体验
4. 添加音效和粒子特效
5. 完善冷却和失败处理

---

## 九、平衡性设计

### 9.1 难度曲线
| 飞升次数 | 守卫强度 | 基础成功率 | 推荐准备 |
|---------|---------|-----------|---------|
| 1 | 1.0x | 40% | 满状态即可尝试 |
| 2 | 1.1x | 35% | 建议携带飞升丹 |
| 3 | 1.2x | 30% | 需要充分准备 |
| 5 | 1.4x | 25% | 需要顶级装备 |
| 10 | 1.6x | 20% | 极限挑战 |

### 9.2 奖励递增设计
| 飞升次数 | 属性加成 | 累计加成 | 称号 |
|---------|---------|---------|------|
| 1 | +10 | +10 | 飞升者 |
| 2 | +8 | +18 | 多界行者 |
| 3 | +7 | +25 | 世界穿梭者 |
| 5 | +10 | +45 | 万界至尊 |
| 10 | +15 | +85 | 永恒存在 |

---

## 十、测试用例清单

### 10.1 功能测试
- [ ] 满级时显示穿越守卫挑战入口
- [ ] HP/MP未满时按钮禁用
- [ ] 成功率计算正确
- [ ] 点击按钮触发战斗
- [ ] 三阶段战斗正常运作
- [ ] 阶段转换触发正确
- [ ] 守卫技能正确释放

### 10.2 飞升流程测试
- [ ] 战斗胜利后进入传承选择
- [ ] 传承物品正确保存
- [ ] 世界随机生成正确
- [ ] 属性重置正确（基础+印记）
- [ ] 飞升印记累计正确
- [ ] 称号解锁正确

### 10.3 失败处理测试
- [ ] 失败惩罚正确应用
- [ ] 冷却时间正确设置
- [ ] 连续失败惩罚递增
- [ ] 心魔触发概率正确
- [ ] 阶段减免正确计算

### 10.4 边界测试
- [ ] 10次飞升后双传承生效
- [ ] 重新随机机会正确使用
- [ ] 存档兼容性正常
- [ ] 世界特性正确应用

---

## 十一、风险评估

| 风险 | 影响等级 | 缓解措施 |
|------|---------|---------|
| 飞升后玩家流失 | 高 | 丰富新世界内容，添加飞升专属剧情 |
| 难度设计不当 | 中 | 成功率可视化，失败不重置太多进度 |
| 世界随机不公 | 中 | 添加重新随机机会，平衡世界权重 |
| 存档兼容问题 | 高 | 完善数据迁移，添加默认值兜底 |
| 动画性能问题 | 低 | 可关闭动画，使用CSS动画替代JS |

---

## 附录：术语表

| 术语 | 解释 |
|------|------|
| 飞升 | 满级角色击败穿越守卫后，穿越到新世界的过程 |
| 穿越守卫 | 守护世界边界的强大存在，必须击败才能飞升 |
| 飞升印记 | 每次飞升获得的永久属性加成，累计叠加 |
| 传承功法 | 飞升时可选择保留的一本功法 |
| 传承装备 | 飞升时可选择保留的一件装备 |
| 命运抉择 | 飞升成功后选择传承物品的环节 |
| 世界特性 | 新世界特有的增益或特点 |
| 命运之轮 | 随机决定新世界类型的视觉表现 |
