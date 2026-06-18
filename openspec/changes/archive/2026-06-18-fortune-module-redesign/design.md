## Context

万界修行录是一个 Next.js 16 文字类修仙 MUD 游戏，遵循五层架构（app/ → views/ → modules/ → core/ → shared/）。当前机缘系统在 `modules/exploration/` 下以网格地牢探索形式运行，但设计简陋、代码臃肿、缺乏策略深度。

**当前机缘代码现状：**
| 文件 | 行数 | 问题 |
|------|------|------|
| `logic/adventure/adventure.ts` | 1288 | 超 500 行逻辑限制 2.5× |
| `hooks/useAdventure.ts` | 2191 | 超 200 行 Hook 限制 10× |
| `components/AdventurePanel.tsx` | ~500 | 超 300 行组件限制 |
| `data/rewardSystem.ts` | ~350 | @ts-nocheck，引用已删除模块 |

**重构环境：** 项目已完成一轮架构重构，旧目录(`hooks/`, `lib/`, `contexts/`)处于迁移过渡期。新模块必须完全对齐五层架构标准。

**关键约束：**
- `modules/fortune/logic/` 纯函数，无 React/浏览器 API，无 `Math.random()`
- 组件 ≤ 300 行，Hook ≤ 200 行，logic 文件 ≤ 500 行
- 禁止 `any` 类型
- 使用同一套 combat 引擎（`modules/combat/logic/engine/`）
- Mod 系统已有 `'opportunities'` 内容类型，直接复用

## Goals / Non-Goals

**Goals:**
1. 设计有策略深度的机缘探索玩法：地形选择 × 视野管理 × 风险决策
2. 网格保留探索自由度，但通过视野限制和信息不对称增加决策维度
3. 多种机缘主题提供差异化体验和资源侧重
4. 楼层推进机制取代固定难度，创造"见好就收 vs 继续深入"的经典 roguelike 张力
5. 事件系统支持 Mod 注入世界专属内容
6. 所有代码严格遵循五层架构，文件大小在约束内
7. 完全删除旧机缘代码，不保留任何兼容层

**Non-Goals:**
- 不改动 combat 引擎本身
- 不改动 Mod 加载框架
- 不改动游戏其他系统（修炼/宗门/爬塔等）
- 不改变战斗平衡数值
- 不考虑多人机缘（本期不做）

## Decisions

### D1: 机缘玩法模型 — 半隐网格 × 路径策略

**Decision:** 保留网格探索的形式，但通过视野限制（望气术）让玩家只能看到周围一定范围。未探索区域只显示地形类型（可远观），节点内容为 `???`。

**核心玩法循环：**
```
进入机缘 → 生成 F1 地图 → 探索中（移动→地形效果→节点处理→视野更新）
→ 找到出口 → 选择[撤退/继续] → F2...Fn → 通关或撤退 → 结算
```

**决策维度：**
- **路径选择**：基于地形推断和望气术感应选择移动方向
- **资源权衡**：走密林（高宝箱概率但视野差）vs 走平地（安全但概率低）
- **风险决策**：每层出口选择撤退（稳拿收获）vs 继续（翻倍收益但可能失去最近层收获）
- **主题匹配**：根据当前资源需求选择不同主题的机缘

**对比：**
```
旧：全亮网格 → 看到什么就踩什么 → 没有决策 → 走到 Boss → 结束
新：半隐网格 → 地形暗示+感应提示 → 路径决策 → 见好就收？→ 策略收尾
```

**Alternatives considered:**
- **纯分支路径（Slay the Spire 式）** — 被拒绝：丢失网格探索感，用户明确要求保留
- **全随机关卡（Roguelike dungeon）** — 被拒绝：文字类 MUD 不合适太快的实时操作

### D2: 地形系统 — 7 种地形 × 区域生长算法

**Decision:** 地形不是随机散落，而是用**区域生长算法**生成连片的自然地形区块。不同机缘主题有不同的地形分布权重。

```
7 种地形效果矩阵：
┌──────────┬────────┬──────────┬──────────────────────┐
│ 地形     │ 移动消耗│ 视野修正  │ 隐藏效果              │
├──────────┼────────┼──────────┼──────────────────────┤
│ 平地     │ 1体力  │ 0        │ 无                   │
│ 密林     │ 1体力  │ -1       │ 宝箱概率×2, 事件+20%  │
│ 洞窟     │ 1体力  │ 强制=1格 │ 必有稀有节点, 敌人增强  │
│ 山崖     │ 2体力  │ +1       │ 单向通行(只能上下)    │
│ 毒沼     │ 1体力  │ 0        │ 每步入场-2%HP, 材料×3 │
│ 灵泉     │ 0体力  │ 0        │ 到达恢复30%HP/MP      │
│ 遗迹     │ 1体力  │ 0        │ 保证试炼碑/祭坛节点   │
└──────────┴────────┴──────────┴──────────────────────┘
```

**区域生成算法（简化）：**
1. 在网格中随机撒 N 个种子点（N 取决于机缘主题的区块数）
2. 每个种子分配一个地形类型（按主题权重）
3. 区域扩张：每个种子向四邻扩张，直到所有格子被覆盖
4. 加入特殊地形：灵泉在离起点中等距离处，遗迹在靠近 Boss 区域

**Alternatives considered:**
- **纯随机散落** — 被拒绝：没有区域感，玩家无法通过地形判断路线
- **手动设计固定地图** — 被拒绝：不可重玩

### D3: 视野系统（望气术）— 属性驱动 × 逐步揭示

**Decision:** 视野范围由玩家属性（悟性 + 灵识）决定，分 4 级。地形会 buff/debuff 视野。视野内的节点清晰可见，视野外只看到地形类型和模糊感应提示。

```
望气术等级计算:
  senseScore = 悟性 × 0.6 + 灵识 × 0.4
  Lv.0 (score <10) → 曼哈顿距离 1 (相邻4格)
  Lv.1 (score 10-29) → 曼哈顿距离 2
  Lv.2 (score 30-59) → 曼哈顿距离 3
  Lv.3 (score 60+) → 曼哈顿距离 3 + 可发现隐藏节点

实际视野 = senseLevel + terrainVisionModifier (clamped to [1, 4])

视野内可见:
  Lv.0: 节点类型 + 地形
  Lv.1: + 敌人等级范围
  Lv.2: + 宝箱品质预感、事件关键词
  Lv.3: + 隐藏节点发现

视野外可见:
  地形类型 ✓ (可远观地貌)
  节点类型 = ???
  模糊感应 (随机文字提示，不保证准确)
```

**策略意义：** 玩家可能看到"密林区"在地图某处，知道那里可能有宝箱，但不确定具体有什么敌人——需要权衡探索价值 vs 风险。

**Alternatives considered:**
- **固定视野 2 格** — 被拒绝：没有成长感，属性系统无法影响机缘体验
- **完全无视野（全部 ???）** — 被拒绝：过于随机，失去策略性

### D4: 深度楼层系统 — 可变层数 × 递增风险

**Decision:** 一次机缘包含 2-5 层（由机缘主题和难度决定）。每层一个独立地图，网格从 5×5 递增到 13×13。奖励倍率逐层叠加。层间出口到达时弹出选择。

```
深度推进规则:
  ┌─────────────────────────────────────────────────┐
  │ Layer  │ Grid   │ Multiplier │ Enemy Lv  │ Risk  │
  │ F1     │ 5×5    │ ×1.0      │ base      │ Low   │
  │ F2     │ 7×7    │ ×1.3      │ base+3    │ Med   │
  │ F3     │ 9×9    │ ×1.6      │ base+6    │ Med   │
  │ F4     │ 11×11  │ ×2.0      │ base+10   │ High  │
  │ F5     │ 13×13  │ ×2.5      │ base+15   │ High  │
  └─────────────────────────────────────────────────┘

撤退 vs 继续决策:
  撤退: 带走本层 100% 收获 → 安全
  继续: 保留收获 + 进入下层的更高倍率 → 风险

死亡惩罚 (战败):
  F1 死亡 → 丢失 F1 50% 收获
  F2 死亡 → 保留 F1(100%) + 丢失 F2 50%
  F3+ 死亡 → 保留前 N-2 层(100%) + 丢失最近 2 层 50%

通关奖励 (击败最终 Boss):
  全部收获 + 楼层完成奖励 + 永久解锁该机缘主题扫荡到通关层
```

**核心张力：** 玩家打完 F2 后知道 F3 有更好的东西，但敌人更强、地图更大、可能回不来。这个决策本身就是可玩性。

**Alternatives considered:**
- **固定 5 层** — 被拒绝：不同机缘主题应该有不同的深度
- **无限层** — 被拒绝：没有结束条件会让玩家迷失

### D5: 机缘主题 — 差异化资源产出

**Decision:** 5 种预置机缘主题，通过不同的地形权重、节点权重和奖励倍率组合实现差异化。主题由玩家在机缘大厅选择。

```
┌────────────┬────────────────┬──────────────┬────────────┐
│ 主题       │ 主要地形       │ 奖励侧重      │ 难度       │
├────────────┼────────────────┼──────────────┼────────────┤
│ 灵矿脉     │ 洞窟55%/山崖25% │ 灵石×2.0     │ ★ (3-5F)  │
│ 古战场     │ 遗迹50%/平地35% │ 碎片×2.0     │ ★★ (3-5F) │
│ 药谷       │ 密林55%/灵泉20% │ 丹药×2.0     │ ★ (3-6F)  │
│ 秘境       │ 混合均匀       │ 稀有度+1级   │ ★★★ (3-5F)│
│ 魔渊       │ 毒沼55%/洞窟30% │ 传说率×3     │ ★★★★★(2-4F)│
└────────────┴────────────────┴──────────────┴────────────┘
```

**玩家动机：** "我需要灵石突破 → 去灵矿脉"，"我缺装备碎片 → 去古战场"。资源获取从盲目变为有目标。

**Mod 扩展：** Mod 可以注册新的机缘主题（如武侠世界专属的"剑冢"），通过 `fortuneTypeRegistry` 注册。

### D6: 节点类型 — 15 种 × 4 类

**Decision:** 从现有的 5 种节点扩展到 15 种，按 4 大类组织。每类有不同的处理逻辑。

```
战斗类节点:
  ⚔️ 普通敌人 — 调用 combat 引擎，标准掉落
  🔥 精英敌人 — 数值翻倍，额外碎片
  👹 小Boss   — 高行动力恢复
  💀 守卫     — 镇守出口，击败才能推进

资源类节点:
  💎 宝箱     — 随机灵石+物品
  ⛏️ 矿脉     — 大量灵石（主题加成）
  🌿 药草     — 丹药+材料
  📜 残卷     — 功法/装备碎片

交互类节点:
  ❓ 事件     — 叙事选择，Mod 可注入
  🛒 游商     — 随机价格买卖物品
  🕯️ 祭坛     — 消耗灵石换临时 Buff
  ⚡ 试炼碑   — 限制条件战斗，高回报

特殊类节点:
  🔮 传送阵   — 跳转到地图另一位置
  ☠️ 陷阱     — 扣 HP/MP 或施加 Debuff
  🌫️ 迷雾     — 进入前类型未知，可能是惊喜或危险
```

**节点分布规则：**
- 守卫必然出现在楼层出口
- 游商/祭坛/试炼碑仅在 F2+ 出现
- 传送阵必须成对出现
- 迷雾节点在 F3+ 才出现，增加后期不确定性

### D7: 事件引擎 — Mod 注入机制

**Decision:** 事件系统采用注册制。机缘事件模板通过事件注册表管理。Mod 在加载时通过 `'opportunities'` 内容类型注册事件。

```
事件注册表 (fortuneEventRegistry):
  register(eventTemplate) → void
  query({ worldType, fortuneType, minDepth, maxDepth }) → FortuneEventTemplate[]
  unregister(eventId) → void

事件模板结构:
  {
    id: string
    worldType?: WorldType       // 限定世界（undefined=通用）
    fortuneType?: FortuneTypeId // 限定机缘类型
    minDepth?: number
    rarity: 'common'|'uncommon'|'rare'|'legendary'
    title: string
    description: string
    choices: EventChoice[]      // 每个选项有 effects + 结果文本
  }
```

**Mod 注入流程：**
```
ModLoader.loadAll() 
→ 扫描 mods/<id>/opportunities/*.json
→ fortuneEventRegistry.register(eventTemplate)
→ 机缘生成时: eventEngine.getFortuneEvents(worldType, fortuneType, depth)
→ 返回匹配的事件池 → 按权重随机选择
```

### D8: Module 架构 — 完全对齐五层结构

**Decision:** 新建 `modules/fortune/` 模块，严格按模板组织。

```
modules/fortune/
├── index.ts               # 桶导出
├── types.ts               # 全部类型定义 (≤300行)
├── state.ts               # FortuneSlice (≤200行)
├── logic/
│   ├── index.ts
│   ├── mapGenerator.ts    # 地图+地形+节点生成 (≤500行)
│   ├── terrainSystem.ts   # 地形效果 (≤300行)
│   ├── visionSystem.ts    # 视野/感应 (≤300行)
│   ├── nodeResolver.ts    # 节点处理分发 (≤400行)
│   ├── depthManager.ts    # 楼层管理 (≤300行)
│   ├── rewardCalculator.ts # 奖励计算 (≤400行)
│   └── eventEngine.ts     # 事件引擎 (≤300行)
├── hooks/
│   └── useFortune.ts      # 主 Hook (≤200行)
├── components/
│   ├── FortuneHub.tsx      # 机缘大厅 (≤300行)
│   ├── FortuneMapView.tsx  # 地图+迷雾 (≤300行)
│   ├── FortuneCell.tsx     # 单格 (≤200行)
│   ├── FloorTransition.tsx # 楼层过渡弹窗 (≤200行)
│   └── FortuneResult.tsx   # 结算面板 (≤200行)
└── data/
    ├── terrainConfig.ts    # 地形配置 (≤300行)
    ├── nodeTypeConfig.ts   # 节点配置 (≤300行)
    ├── fortuneTypeConfig.ts # 主题配置 (≤300行)
    └── defaultEvents.ts    # 默认事件 (≤400行)
```

### D9: 内存占用控制

**Decision:** GridCell 使用**按需计算缓存**，通过 shared/lib 中的快速序列化工具，支持机缘状态的轻量级持久化。限制 floor 总数 ≤ 5，grid 最大 13×13 = 169 cells × ≤5 floors = ≤845 cells 总内存占用。同时 Session 内只缓存最近 2 层的 full map，以上楼层保留精简摘要。

### D10: 纯函数设计

**Decision:** `mapGenerator` 本身不是严格纯函数（它生成的是随机布局），但通过传入 seed 实现确定性生成。其余 logic 文件必须是纯函数。

## Risks / Trade-offs

- **Risk: 一次性重写工作量大** → Mitigation: 分 4 阶段实施（骨架→逻辑→UI→清理），每个阶段独立可验证
- **Risk: 旧代码删除导致引用断裂** → Mitigation: 先用 grep 找到所有引用点，逐个更新
- **Risk: GameState 结构变更影响序列化** → Mitigation: 添加 saveMigrator 处理旧存档中的 adventure 字段
- **Trade-off: 地形+视野增加复杂度** → 给新手的机缘主题（灵矿脉/药谷）难度低、视野范围大，降低入门门槛

## Migration Plan

### Stage 1: 核心骨架
1. 创建 `modules/fortune/` 目录和 `index.ts/types.ts/state.ts`
2. 实现 `logic/mapGenerator.ts`（地图生成）
3. 实现 `logic/terrainSystem.ts`（地形效果）
4. 实现 `logic/visionSystem.ts`（视野计算）
5. 写入 `data/` 配置文件
6. 运行单元测试验证

### Stage 2: 交互逻辑
7. 实现 `logic/nodeResolver.ts`（节点处理）
8. 实现 `logic/depthManager.ts`（楼层管理）
9. 实现 `logic/rewardCalculator.ts`（奖励计算）
10. 实现 `logic/eventEngine.ts`（事件引擎）
11. 集成 combat 引擎调用
12. 运行单元测试验证

### Stage 3: UI 层
13. 实现 `hooks/useFortune.ts`
14. 实现所有 components
15. 创建 `views/game/pages/FortunePage.tsx`（替换 AdventurePage）
16. 更新 GameState 添加 fortuneSlice
17. 运行 `pnpm dev` 手动测试

### Stage 4: 清理与集成
18. 删除旧 exploration 机缘相关文件
19. 清理 GameState 旧字段 + 添加 saveMigrator
20. 集成 Mod opportunities 加载
21. 更新 modules/README.md
22. 运行 `pnpm ts-check && pnpm build && pnpm test`
23. E2E 测试

### Rollback
每个 Stage 是独立的 commit。如果某个 Stage 引入问题，revert 该 commit。Stage 1-2 不涉及 UI 改动，不影响玩家体验。Stage 3 完成后若发现问题可回退到 Stage 2。

## Open Questions

1. **扫荡功能是否第一期做？** — 建议 Stage 4 追加，扫荡 = 对已通关深度的快捷获取保底奖励
2. **望气术的属性公式需要调优吗？** — 可以先用 `悟性×0.6 + 灵识×0.4`，后续根据数据调整
3. **Mod 事件模板的 JSON Schema 需要定义吗？** — 建议第二阶段由 Mod 系统统一规范
