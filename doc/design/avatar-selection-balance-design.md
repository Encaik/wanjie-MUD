# 化身选择界面平衡系统设计

> **状态**: ✅ 已迁移到 `game-design/characters.md`

## 一、问题分析

### 1.1 当前问题
当前化身选择界面使用 `totalPower` 简单累加所有属性加成，导致：
- **无脑选择**：玩家只需选择数值最高的角色，无需思考
- **策略缺失**：词条组合、属性协同完全没有价值
- **体验单调**：8个角色同质化严重，选择变成纯粹比大小

### 1.2 根因分析
```typescript
// 当前计算方式
const totalPower = Object.values(totalImpact).reduce((sum, v) => sum + (v || 0), 0);
// 问题：体质+10 和 幸运+10 在数学上等值，但游戏效果完全不同
```

### 1.3 设计目标
1. **差异化定位**：每个角色应有明确的定位标签
2. **协同加成**：词条组合应产生额外价值
3. **策略选择**：玩家应根据游戏风格做出有意义的选择
4. **动态评估**：多维度评估替代单一分数

---

## 二、解决方案：多维度角色评估系统

### 2.1 属性价值矩阵

不同属性在不同场景的价值不同，建立价值矩阵：

```typescript
/**
 * 属性价值矩阵
 * 定义每个属性在不同维度的权重
 * 
 * 战斗维度：体质>意志>幸运>灵根>悟性
 * 修炼维度：灵根>悟性>体质>意志>幸运
 * 生存维度：体质>意志>灵根>幸运>悟性
 * 探索维度：幸运>悟性>灵根>体质>意志
 */
const ATTRIBUTE_VALUE_MATRIX = {
  // 战斗评分（影响战斗伤害、防御、暴击）
  combat: {
    体质: 1.0,   // 生命值=体质×10，直接影响生存
    意志: 0.7,   // 影响抗性、意志技能效果
    幸运: 0.5,   // 暴击概率
    灵根: 0.4,   // 法术伤害
    悟性: 0.3,   // 技能学习速度
  },
  
  // 修炼评分（影响修炼速度、突破成功率）
  cultivation: {
    灵根: 1.0,   // 修炼效率基础
    悟性: 0.8,   // 突破悟性要求
    体质: 0.3,   // 境界根基
    意志: 0.4,   // 突破心境要求
    幸运: 0.2,   // 随机顿悟概率
  },
  
  // 生存评分（影响逃跑成功率、恢复速度）
  survival: {
    体质: 1.0,   // 基础生存能力
    意志: 0.8,   // 精神抗性
    灵根: 0.3,   // 灵力护盾
    幸运: 0.5,   // 躲避概率
    悟性: 0.2,   // 危机判断
  },
  
  // 探索评分（影响机缘发现、掉落概率）
  exploration: {
    幸运: 1.0,   // 核心探索属性
    悟性: 0.6,   // 理解隐藏线索
    灵根: 0.4,   // 感应灵气
    体质: 0.2,   // 体力消耗
    意志: 0.3,   // 坚持探索
  },
};
```

### 2.2 协同加成系统

词条组合应产生协同效果：

```typescript
/**
 * 协同效果定义
 * 当特定词条组合同时出现时，触发额外加成
 */
interface SynergyEffect {
  id: string;
  name: string;
  description: string;
  traits: string[];        // 参与的词条名
  stats: string[];         // 影响的属性
  bonus: number;           // 额外加成值
  type: 'combat' | 'cultivation' | 'survival' | 'exploration';
}

const SYNERGY_EFFECTS: SynergyEffect[] = [
  // 战斗类协同
  {
    id: 'warrior_soul',
    name: '战魂',
    description: '战斗天赋觉醒',
    traits: ['战斗狂人', '武痴', '血性'],
    stats: ['体质', '意志'],
    bonus: 5,
    type: 'combat',
  },
  {
    id: 'twin_attack',
    name: '双修',
    description: '体质与灵根相辅相成',
    traits: ['强体', '灵慧'],
    stats: ['体质', '灵根'],
    bonus: 3,
    type: 'cultivation',
  },
  
  // 修炼类协同
  {
    id: 'wisdom_body',
    name: '智体双修',
    description: '悟性与体质相得益彰',
    traits: ['聪明', '强健'],
    stats: ['悟性', '体质'],
    bonus: 4,
    type: 'cultivation',
  },
  {
    id: 'enlightenment',
    name: '顿悟',
    description: '高悟性配合灵根，修炼如有神助',
    traits: ['天才', '灵童'],
    stats: ['悟性', '灵根'],
    bonus: 6,
    type: 'cultivation',
  },
  
  // 生存类协同
  {
    id: 'iron_will',
    name: '铁意志',
    description: '坚定意志配合强健体魄',
    traits: ['意志坚定', '钢筋铁骨'],
    stats: ['意志', '体质'],
    bonus: 4,
    type: 'survival',
  },
  
  // 探索类协同
  {
    id: 'fortune_bless',
    name: '天眷',
    description: '幸运与悟性双重加持',
    traits: ['天选之人', '吉星高照'],
    stats: ['幸运', '悟性'],
    bonus: 5,
    type: 'exploration',
  },
];
```

### 2.3 角色定位标签

基于多维度评分，生成角色定位标签：

```typescript
type RoleArchetype = 
  | 'combat_warrior'   // 战斗型：体质/意志为核心
  | 'cultivation_genius' // 修炼型：灵根/悟性为核心
  | 'survival_master'  // 生存型：体质/意志为核心
  | 'fortune_seeker'   // 探索型：幸运/悟性为核心
  | 'balanced'         // 均衡型：各项平均
  | 'specialist';      // 特化型：某项极高

interface RoleProfile {
  archetype: RoleArchetype;
  label: string;
  description: string;
  recommendedPlaystyle: string;
  strengths: string[];
  weaknesses: string[];
}

/**
 * 根据属性分布确定角色定位
 */
function determineArchetype(
  stats: Record<string, number>,
  synergies: SynergyEffect[]
): RoleProfile {
  const { combat, cultivation, survival, exploration } = calculateDimensionScores(stats, synergies);
  
  const scores = [
    { type: 'combat_warrior', score: combat },
    { type: 'cultivation_genius', score: cultivation },
    { type: 'survival_master', score: survival },
    { type: 'fortune_seeker', score: exploration },
  ].sort((a, b) => b.score - a.score);
  
  const primary = scores[0];
  const secondary = scores[1];
  const variance = calculateVariance(scores.map(s => s.score));
  
  // 判断是否为均衡型
  if (variance < 20) {
    return {
      archetype: 'balanced',
      label: '均衡型',
      description: '各项属性发展均衡，没有明显短板',
      recommendedPlaystyle: '适合各种玩法，随机应变能力强',
      strengths: ['无明显弱点', '适应性强'],
      weaknesses: ['没有突出优势'],
    };
  }
  
  // 判断是否为特化型
  if (primary.score - secondary.score > 30) {
    return {
      archetype: 'specialist',
      label: getSpecialistLabel(primary.type),
      description: '极端发展某一项能力',
      recommendedPlaystyle: getSpecialistPlaystyle(primary.type),
      strengths: [getSpecialistStrength(primary.type)],
      weaknesses: [getSpecialistWeakness(primary.type)],
    };
  }
  
  return {
    archetype: primary.type,
    label: getArchetypeLabel(primary.type),
    description: getArchetypeDescription(primary.type),
    recommendedPlaystyle: getRecommendedPlaystyle(primary.type),
    strengths: getStrengths(primary.type, secondary.type),
    weaknesses: getWeaknesses(primary.type),
  };
}
```

### 2.4 多维度评分计算

```typescript
interface DimensionScores {
  combat: number;
  cultivation: number;
  survival: number;
  exploration: number;
  overall: number;  // 综合评分
}

/**
 * 计算多维度评分
 */
function calculateDimensionScores(
  stats: Record<string, number>,
  synergies: SynergyEffect[]
): DimensionScores {
  // 基础评分（使用价值矩阵）
  const combat = calculateDimensionScore(stats, 'combat');
  const cultivation = calculateDimensionScore(stats, 'cultivation');
  const survival = calculateDimensionScore(stats, 'survival');
  const exploration = calculateDimensionScore(stats, 'exploration');
  
  // 协同加成
  let combatBonus = 0;
  let cultivationBonus = 0;
  let survivalBonus = 0;
  let explorationBonus = 0;
  
  for (const synergy of synergies) {
    switch (synergy.type) {
      case 'combat': combatBonus += synergy.bonus; break;
      case 'cultivation': cultivationBonus += synergy.bonus; break;
      case 'survival': survivalBonus += synergy.bonus; break;
      case 'exploration': explorationBonus += synergy.bonus; break;
    }
  }
  
  return {
    combat: Math.max(0, combat + combatBonus),
    cultivation: Math.max(0, cultivation + cultivationBonus),
    survival: Math.max(0, survival + survivalBonus),
    exploration: Math.max(0, exploration + explorationBonus),
    overall: (combat + cultivation + survival + exploration) / 4 + 
             (combatBonus + cultivationBonus + survivalBonus + explorationBonus) / 4,
  };
}

/**
 * 使用价值矩阵计算单维度评分
 */
function calculateDimensionScore(
  stats: Record<string, number>,
  dimension: keyof typeof ATTRIBUTE_VALUE_MATRIX
): number {
  const weights = ATTRIBUTE_VALUE_MATRIX[dimension];
  let score = 0;
  
  for (const [attr, weight] of Object.entries(weights)) {
    const value = stats[attr] || 0;
    // 以50为基准值，偏离越大影响越大
    const deviation = value - 50;
    score += deviation * weight;
  }
  
  // 归一化到 0-100 范围
  return Math.round(50 + score / 10);
}
```

---

## 三、UI 展示设计

### 3.1 新版角色卡片设计

```
┌────────────────────────────────────────────────────────────────┐
│  [战斗型]  李天行                                    ⚔️ 战斗型  │
│  ────────────────────────────────────────────────────────────  │
│  性别: 男  年龄: 18岁                                               │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 词条品质： [传说] [史诗] [稀有] [优秀] [普通]                 │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ 出身： 战斗世家 ────────── 体质+8，意志+5                   │ │
│  │ 特性： 武痴 ─────────────── 体质+6，攻击+3%                  │ │
│  │ 性格： 坚毅 ─────────────── 意志+7                          │ │
│  │ 天赋： 战斗直觉 ─────────── 暴击+5%                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ████████████░░░░  战斗  78   │  ██████████░░░░░░  修炼  52 │ │
│  │  ████████████░░░░  生存  71   │  ██████░░░░░░░░░░░  探索  35 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  协同效果：战魂(体质+意志)+5                                        │
│                                                                    │
│  ══════════════════════════════════════════════════════════════  │
│  推荐玩法：战斗流派，挑战副本                                        │
│  优势： 高生命、高抗性、暴击输出                                    │
│  劣势： 修炼速度较慢，探索能力一般                                   │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 评分条样式

```css
/* 维度评分条 */
.dimension-bar {
  height: 12px;
  background: linear-gradient(to right, 
    var(--muted) 0%, 
    var(--muted) var(--fill-percent),
    transparent var(--fill-percent)
  );
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

/* 填充动画 */
.dimension-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: var(--fill-percent);
  background: var(--bar-color);
  transition: width 0.5s ease-out;
}

/* 战斗型配色：红/橙 */
.combat .bar-color { background: linear-gradient(90deg, #ef4444, #f97316); }

/* 修炼型配色：蓝/紫 */
.cultivation .bar-color { background: linear-gradient(90deg, #3b82f6, #8b5cf6); }

/* 生存型配色：绿 */
.survival .bar-color { background: linear-gradient(90deg, #22c55e, #10b981); }

/* 探索型配色：黄/金 */
.exploration .bar-color { background: linear-gradient(90deg, #eab308, #ca8a04); }
```

### 3.3 选择提示文案

根据角色定位，显示不同的选择提示：

```typescript
const SELECTION_HINTS: Record<RoleArchetype, string[]> = {
  'combat_warrior': [
    '你是天生的战士，战场是你最好的舞台',
    '喜欢战斗和挑战？选这个没错',
    '敌人会在你的铁拳下颤抖',
  ],
  'cultivation_genius': [
    '修炼天才，境界突破对你来说轻而易举',
    '追求快速升级？这个角色是首选',
    '悟道成仙，你是天选之人',
  ],
  'survival_master': [
    '即使面对绝境，你也能绝处逢生',
    '容错率高，适合新手玩家',
    '稳扎稳打，一步一个脚印',
  ],
  'fortune_seeker': [
    '幸运女神眷顾你，处处都有惊喜',
    '喜欢探索和发现？这个选择不会让你失望',
    '机缘巧合，命运眷顾',
  ],
  'balanced': [
    '没有明显的弱点，适合各种玩法',
    '中规中矩，但不失为稳健的选择',
    '进可攻退可守，全能型选手',
  ],
  'specialist': [
    '极致的发展路线，高风险高回报',
    '单点突破，是极限挑战者的最爱',
    '专精一路，其他方面需要更多资源弥补',
  ],
};
```

---

## 四、实现方案

### 4.1 代码修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/lib/game/types.ts` | 添加 `RoleArchetype`、`DimensionScores` 类型 |
| `src/lib/game/generators.ts` | 修改角色生成逻辑，添加协同检测和定位判断 |
| `src/components/pages/character-select/CharacterSelect.tsx` | 更新UI，显示多维度评分和定位标签 |

### 4.2 关键函数签名

```typescript
// 计算多维度评分
function calculateDimensionScores(stats: CharacterStats): DimensionScores;

// 检测协同效果
function detectSynergies(traits: ImpactfulTrait[]): SynergyEffect[];

// 确定角色定位
function determineArchetype(
  stats: CharacterStats,
  synergies: SynergyEffect[]
): RoleProfile;

// 生成完整角色评估
interface CharacterEvaluation {
  scores: DimensionScores;
  synergies: SynergyEffect[];
  archetype: RoleProfile;
  hints: string[];
}

function evaluateCharacter(character: Character): CharacterEvaluation;
```

### 4.3 兼容性考虑

- **向后兼容**：保留 `totalPower` 字段用于显示，但不作为主要决策依据
- **平滑过渡**：旧存档继续有效，仅影响新角色生成
- **数据迁移**：可选，将旧角色按新系统重新计算评分

---

## 五、验证标准

### 5.1 功能验证

- [ ] 8个角色应有至少4种不同的定位类型
- [ ] 相同定位角色的评分差异应在合理范围（±15%）
- [ ] 协同效果应正确触发并计算加成
- [ ] UI应清晰展示各维度评分

### 5.2 平衡验证

- [ ] 战斗型角色在战斗场景应有明显优势（+20%以上）
- [ ] 修炼型角色在经验获取应有明显优势（+20%以上）
- [ ] 任何定位的角色都应能正常游戏，不会出现死路
- [ ] 极端角色（特化型）应在某些方面有补偿机制

### 5.3 体验验证

- [ ] 玩家应能快速理解各角色的定位差异
- [ ] 选择提示应有吸引力，帮助玩家做决定
- [ ] 刷新后角色应有明显不同的体验

---

## 六、风险与注意事项

### 6.1 已知风险

1. **数值膨胀**：协同加成可能导致最终数值超出预期范围
   - 缓解：协同加成设置上限（每种类型最多+10）

2. **定位过少**：如果随机性不够，可能出现大量相同定位
   - 缓解：词条池设计时确保多样性

3. **新手困惑**：多维度评分可能让新手更难选择
   - 缓解：保留总评分数，并提供推荐玩法提示

### 6.2 后续优化方向

1. 添加更多协同效果组合
2. 根据玩家游戏历史推荐角色定位
3. 添加角色故事背景生成系统
4. 设计角色专属技能或被动效果
