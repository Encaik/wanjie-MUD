# 测试目录结构

本测试目录按功能模块划分，每个模块包含测试文件和功能说明文档。

## 目录结构

```
src/tests/
├── modules/                    # 功能模块测试
│   ├── game-start/            # 游戏开始模块
│   │   ├── gameStart.test.ts  # 测试文件
│   │   └── README.md          # 功能说明
│   ├── cultivation/           # 修炼系统模块
│   │   ├── cultivation.test.ts
│   │   └── README.md
│   ├── faction/               # 势力系统模块
│   │   ├── faction.test.ts
│   │   └── README.md
│   ├── adventure/             # 机缘冒险模块
│   │   ├── adventure.test.ts
│   │   └── README.md
│   ├── items/                 # 物品系统模块
│   │   ├── items.test.ts
│   │   └── README.md
│   └── utils/                 # 工具函数模块
│       ├── utils.test.ts
│       └── README.md
├── lib/                       # 库函数测试（保留）
│   └── game/
│       ├── generators.test.ts
│       └── typeGuards.test.ts
├── contexts/                  # Context测试（保留）
│   └── ProtagonistContext.test.tsx
├── setup.ts                   # 测试配置
└── README.md                  # 本文件
```

## 功能模块列表

| 模块 | 测试文件 | 说明 |
|------|----------|------|
| [游戏开始](./modules/game-start/README.md) | gameStart.test.ts | 角色生成、世界生成、背景故事 |
| [修炼系统](./modules/cultivation/README.md) | cultivation.test.ts | 修炼、境界、突破、体力、流派 |
| [势力系统](./modules/faction/README.md) | faction.test.ts | 加入势力、声望、职位、任务、捐献 |
| [机缘冒险](./modules/adventure/README.md) | adventure.test.ts | 机缘、战斗、扫荡、战利品、事件 |
| [物品系统](./modules/items/README.md) | items.test.ts | 丹药、装备、功法、背包、成就 |
| [工具函数](./modules/utils/README.md) | utils.test.ts | ID生成、类型守卫、日志、Context |

## 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定模块测试
pnpm test src/tests/modules/game-start/gameStart.test.ts

# 运行并查看覆盖率
pnpm test:coverage

# 监听模式
pnpm test:watch
```

## 测试覆盖的功能

### 游戏开始模块
- ✅ 角色生成：生成8个可选角色
- ✅ 世界生成：生成8种世界观
- ✅ 背景故事：根据角色和世界生成
- ✅ 游戏初始化：开始新游戏、选择角色/世界

### 修炼系统模块
- ✅ 修炼功能：消耗灵石修炼
- ✅ 自动修炼：自动消耗灵石
- ✅ 境界系统：等级和境界名称
- ✅ 突破系统：突破概率和增益
- ✅ 体力系统：体力消耗和恢复
- ✅ 流派系统：修炼流派选择
- ✅ 战力计算：玩家综合战力

### 势力系统模块
- ✅ 势力数据：各世界观的势力
- ✅ 加入势力：加入/离开势力
- ✅ 声望系统：声望等级和奖励
- ✅ 职位系统：职位晋升和福利
- ✅ 任务系统：日常/周常任务
- ✅ 捐献系统：捐献获取贡献

### 机缘冒险模块
- ✅ 机缘系统：进入地图、探索
- ✅ 怪物比例：按难度调整
- ✅ 战斗系统：回合制战斗
- ✅ 扫荡系统：快速扫荡
- ✅ 战利品系统：背包、清空、带走
- ✅ 事件系统：随机事件
- ✅ 日常历练：历练活动

### 物品系统模块
- ✅ 丹药系统：修炼丹药、突破丹
- ✅ 灵石系统：游戏货币
- ✅ 装备系统：装备槽位和属性
- ✅ 功法系统：功法类型和效果
- ✅ 背包系统：物品堆叠和使用
- ✅ 消息系统：消息记录
- ✅ 成就系统：成就奖励

### 工具函数模块
- ✅ ID生成器：生成唯一ID
- ✅ 类型守卫：运行时类型检查
- ✅ 日志系统：日志输出管理
- ✅ Context系统：React Context

## 测试目标

走通这些测试文件，就代表对应的功能正常可用：

1. **游戏开始模块** - 玩家可以正常开始游戏
2. **修炼系统模块** - 玩家可以正常修炼提升
3. **势力系统模块** - 玩家可以正常加入势力
4. **机缘冒险模块** - 玩家可以正常进行冒险
5. **物品系统模块** - 物品系统正常运作
6. **工具函数模块** - 工具函数正常工作
