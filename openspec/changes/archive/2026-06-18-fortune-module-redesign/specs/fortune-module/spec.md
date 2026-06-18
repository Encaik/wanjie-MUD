## ADDED Requirements

### Requirement: 机缘大厅 — 主题选择
系统 SHALL 提供一个机缘大厅界面，展示所有可用的机缘主题，玩家可选择进入。

#### Scenario: 主题列表展示
- **WHEN** 玩家打开机缘页面
- **THEN** 显示所有已解锁的机缘主题卡片，每张卡片展示主题名称、难度星级、层数范围、主要产出类型、推荐等级

#### Scenario: 主题解锁条件
- **WHEN** 玩家等级不满足机缘主题的最低等级要求
- **THEN** 该主题卡片显示为锁定状态，展示解锁条件

#### Scenario: 选择主题进入
- **WHEN** 玩家点击已解锁的机缘主题
- **THEN** 消耗体力，生成 F1 地图，进入探索状态

### Requirement: 地图生成 — 地形+节点
系统 SHALL 使用种子驱动的地图生成器创建机缘地图，包含地形区块和节点内容。

#### Scenario: 地形区域生成
- **WHEN** 生成 F(N) 机缘地图
- **THEN** 使用区域生长算法，按机缘主题的地形权重生成连片的自然地形区块，网格大小为 `5 + 2×N` × `5 + 2×N`

#### Scenario: 节点放置
- **WHEN** 地形生成完成
- **THEN** 在每个格子上按机缘主题的节点权重放置节点，守卫类节点必须出现在楼层出口位置，传送阵必须成对出现

#### Scenario: 起点和出口
- **WHEN** 地图生成完成
- **THEN** 玩家起点位于地图左侧，楼层出口位于地图右侧靠近边缘处，出口格必须有守卫节点

#### Scenario: 确定性生成
- **WHEN** 使用相同的种子、机缘类型、深度和玩家等级
- **THEN** 生成完全相同的地图

### Requirement: 地形效果系统
系统 SHALL 在玩家移动到格子时结算地形效果，影响体力消耗、视野和特殊效果。

#### Scenario: 不同地形移动消耗
- **WHEN** 玩家移动到平地/密林/洞窟/毒沼/灵泉/遗迹格子
- **THEN** 消耗 1 体力；移动到山崖消耗 2 体力；移动到灵泉消耗 0 体力

#### Scenario: 地形特殊效果
- **WHEN** 玩家进入毒沼格子
- **THEN** 扣除当前 HP 的 2%
- **WHEN** 玩家进入灵泉格子
- **THEN** 恢复最大 HP/MP 的 30%
- **WHEN** 玩家进入遗迹格子
- **THEN** 保证该格节点为试炼碑或祭坛

#### Scenario: 地形影响节点概率
- **WHEN** 密林中的格子生成节点
- **THEN** 宝箱概率翻倍，事件概率增加 20%
- **WHEN** 洞窟中的格子生成节点
- **THEN** 必有稀有节点，但敌人等级增加

### Requirement: 望气术视野系统
系统 SHALL 根据玩家属性计算视野范围，限制可见节点信息。

#### Scenario: 视野范围计算
- **WHEN** 计算玩家视野
- **THEN** `senseScore = 悟性×0.6 + 灵识×0.4`，score<10 视野=1格，score 10-29 视野=2格，score 30-59 视野=3格，score≥60 视野=3格且可发现隐藏节点

#### Scenario: 地形修正视野
- **WHEN** 玩家站在密林格子
- **THEN** 视野-1
- **WHEN** 玩家站在洞窟格子
- **THEN** 视野强制=1
- **WHEN** 玩家站在山崖格子
- **THEN** 视野+1

#### Scenario: 视野内信息可见
- **WHEN** 某节点在玩家视野范围内
- **THEN** 显示节点类型图标和名称；若 senseScore≥10 显示敌人等级范围；若 senseScore≥30 显示宝箱品质；若 senseScore≥60 显示隐藏节点

#### Scenario: 视野外信息隐藏
- **WHEN** 某格子不在玩家视野范围内
- **THEN** 显示地形类型但节点类型显示为 "???"，提供模糊感应文字提示

### Requirement: 深度楼层推进
系统 SHALL 在每层出口到达时提供撤退/继续选择，支持可变楼层数量。

#### Scenario: 楼层出口到达
- **WHEN** 玩家清理楼层出口的守卫节点后移动到出口格
- **THEN** 弹出"撤退/继续"选择对话框，展示当前收获摘要和下一层预览

#### Scenario: 安全撤退
- **WHEN** 玩家选择撤退
- **THEN** 保留本层 100% 收获，退出机缘，解锁该主题的当前深度扫荡

#### Scenario: 继续深入
- **WHEN** 玩家选择继续
- **THEN** 生成新的 F(N+1) 地图，网格增大，奖励倍率叠加，保留已积累的全部收获

#### Scenario: 死亡惩罚
- **WHEN** 玩家在 F1 战败
- **THEN** 丢失 F1 50% 收获
- **WHEN** 玩家在 F2 战败
- **THEN** 保留 F1 100% 收获，丢失 F2 50% 收获
- **WHEN** 玩家在 F3 或更深处战败
- **THEN** 保留前 N-2 层 100% 收获，丢失最近 2 层 50% 收获

#### Scenario: 通关奖励
- **WHEN** 玩家击败最终楼层 Boss 并选择撤退
- **THEN** 获得全部收获 + 楼层完成奖励 + 永久解锁该机缘的扫荡功能（到通关深度）

### Requirement: 机缘主题差异化
系统 SHALL 提供 5 种机缘主题，通过地形分布、节点权重和奖励倍率实现差异化体验。

#### Scenario: 灵矿脉主题
- **WHEN** 玩家选择灵矿脉机缘
- **THEN** 地形权重偏向洞窟(55%)和山崖(25%)，节点权重偏向矿脉(25%)和陷阱(12%)，灵石奖励×2.0，其他奖励×0.7，3-5层

#### Scenario: 古战场主题
- **WHEN** 玩家选择古战场机缘
- **THEN** 地形权重偏向遗迹(50%)和平地(35%)，节点权重偏向残卷(20%)和试炼碑(10%)，碎片奖励×2.0，其他奖励×0.7，3-5层

#### Scenario: 药谷主题
- **WHEN** 玩家选择药谷机缘
- **THEN** 地形权重偏向密林(55%)和灵泉(20%)，节点权重偏向药草(25%)和游商(8%)，丹药×2.0、材料×1.5，3-6层

#### Scenario: 秘境主题
- **WHEN** 玩家选择秘境机缘
- **THEN** 地形混合均匀，节点种类均衡，稀有度掉落+1级，3-5层

#### Scenario: 魔渊主题
- **WHEN** 玩家选择魔渊机缘
- **THEN** 地形权重偏向毒沼(55%)和洞窟(30%)，传说品质概率×3，死亡惩罚×2，2-4层

### Requirement: 15 种节点处理
系统 SHALL 为每种节点类型提供正确的处理逻辑。

#### Scenario: 战斗类节点
- **WHEN** 玩家触发敌人/精英/小Boss/守卫节点
- **THEN** 调用 `modules/combat/logic/engine/` 的战斗状态机，战斗结果影响体力恢复和奖励计算

#### Scenario: 资源类节点
- **WHEN** 玩家触发宝箱/矿脉/药草/残卷节点
- **THEN** 直接计算奖励（灵石/物品/碎片/丹药/材料），受机缘主题倍率影响

#### Scenario: 交互类节点
- **WHEN** 玩家触发事件节点
- **THEN** 从事件注册表查询匹配的事件模板，展示叙事选择和效果
- **WHEN** 玩家触发游商节点
- **THEN** 展示随机物品列表，以随机折扣出售
- **WHEN** 玩家触发祭坛节点
- **THEN** 消耗灵石换取当前机缘内持续 Buff
- **WHEN** 玩家触发试炼碑节点
- **THEN** 进入限制条件战斗（如禁用功法），胜利获得丰厚奖励

#### Scenario: 特殊类节点
- **WHEN** 玩家触发传送阵
- **THEN** 传送到配对的传送阵位置
- **WHEN** 玩家触发陷阱
- **THEN** 随机扣除 HP/MP 或施加 Debuff
- **WHEN** 玩家触发迷雾节点
- **THEN** 进入后揭示真实节点类型（可能是任何类型）

### Requirement: Mod 事件注入
系统 SHALL 支持 Mod 通过 `'opportunities'` 内容类型注册机缘事件模板。

#### Scenario: Mod 事件注册
- **WHEN** Mod 加载器加载包含 `opportunities/` 目录的 Mod
- **THEN** 解析事件 JSON/YAML 文件，调用 `fortuneEventRegistry.register()` 注册事件模板

#### Scenario: 事件查询匹配
- **WHEN** 机缘生成需要放置事件节点
- **THEN** 根据当前世界类型、机缘主题和深度查询注册表，返回匹配的事件池，按权重随机选择

#### Scenario: 通用事件回退
- **WHEN** 没有 Mod 事件匹配当前条件
- **THEN** 使用 `defaultEvents.ts` 中的默认事件模板

### Requirement: 模块架构合规
系统 SHALL 遵循五层架构标准组织 `modules/fortune/`。

#### Scenario: 文件大小合规
- **WHEN** 检查 fortune 模块文件大小
- **THEN** logic 文件 ≤ 500 行，组件 ≤ 300 行，Hook ≤ 200 行，类型文件 ≤ 300 行，数据文件 ≤ 800 行

#### Scenario: 纯函数 logic 层
- **WHEN** fortune logic 文件导出函数
- **THEN** 所有函数为纯函数（无 React 依赖、无浏览器 API、不接受 seed 参数时不调用 Math.random()）

#### Scenario: 桶导出完整
- **WHEN** fortune 模块被导入
- **THEN** 所有公开 API 通过 `index.ts` 桶文件导出

### Requirement: 旧代码清理
系统 SHALL 完全删除旧机缘代码，不保留兼容层。

#### Scenario: 旧文件删除
- **WHEN** 新 fortune 模块完成并验证
- **THEN** 删除 `adventure.ts`、`adventureStamina.ts`、`adventureBattleNew.ts`、`adventureBattleIntegration.ts`、`opportunityConfig.ts`、`rewardSystem.ts`、`fogOfWar.ts` 及对应的旧 Hook/组件

#### Scenario: GameState 迁移
- **WHEN** 新 fortune 系统上线
- **THEN** GameState 中移除 `adventureGrid`、`adventurePosition`、`adventureConfig`、`adventurePhase`、`adventureLoot`、`adventureExperience`、`adventureFragments`、`adventureSession`、`activeBattle` 等旧字段，替换为 `fortuneSlice`

#### Scenario: 旧引用清理
- **WHEN** 旧机缘文件被删除
- **THEN** 所有引用被更新为新的 fortune 模块导入路径，无一残留
