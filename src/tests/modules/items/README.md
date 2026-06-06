# 物品系统功能模块

## 功能概述

物品系统管理游戏中的所有物品，包括丹药、装备、功法、灵石等，以及背包管理和奖励系统。

## 功能列表

### 1. 丹药系统
- **功能描述**: 修炼丹药、突破丹药、效果持续时间
- **相关文件**: `src/lib/game/items.ts`
- **测试文件**: `items.test.ts` - 丹药系统

**验证点**:
- [x] 有修炼丹药
- [x] 修炼丹药有持续效果
- [x] 丹药效果显示剩余次数
- [x] 有突破丹

### 2. 灵石系统
- **功能描述**: 游戏货币系统
- **相关文件**: `src/lib/game/items.ts`
- **测试文件**: `items.test.ts` - 灵石系统

**验证点**:
- [x] 有灵石物品

### 3. 装备系统
- **功能描述**: 装备类型、装备槽位、装备强化
- **相关文件**: `src/lib/game/types.ts`
- **测试文件**: `items.test.ts` - 装备系统

**验证点**:
- [x] 有正确的装备槽位
- [x] 装备有属性加成

**装备槽位**:
| 槽位 | 说明 |
|------|------|
| melee | 近战武器 |
| ranged | 远程武器 |
| head | 头部 |
| body | 身体 |
| legs | 腿部 |
| feet | 脚部 |

### 4. 功法系统
- **功能描述**: 功法类型、功法等级、功法效果
- **相关文件**: `src/lib/game/types.ts`
- **测试文件**: `items.test.ts` - 功法系统

**验证点**:
- [x] 有正确的功法类型
- [x] 功法有属性

**功法类型**:
| 类型 | 说明 |
|------|------|
| attack | 攻击功法 |
| defense | 防御功法 |

### 5. 背包系统
- **功能描述**: 物品堆叠、物品添加、物品使用
- **相关文件**: `src/lib/game/types.ts`
- **测试文件**: `items.test.ts` - 背包系统

**验证点**:
- [x] 能创建背包物品
- [x] 相同ID的物品堆叠
- [x] 有ActiveEffect类型

### 6. 消息系统
- **功能描述**: 消息记录、奖励显示
- **相关文件**: `src/lib/game/types.ts`
- **测试文件**: `items.test.ts` - 消息系统

**验证点**:
- [x] 有消息配置
- [x] 消息记录包含奖励信息

### 7. 成就系统
- **功能描述**: 成就奖励、成就领取
- **相关文件**: `src/lib/data/achievementData.ts`
- **测试文件**: `items.test.ts` - 成就系统

**验证点**:
- [x] 成就有经验奖励
- [x] 部分成就有物品奖励
- [x] 成就有正确的结构

### 8. 随机物品获取
- **功能描述**: 根据等级随机获取物品
- **相关文件**: `src/lib/game/items.ts` - `getRandomItem()`
- **测试文件**: `items.test.ts` - 随机物品获取

**验证点**:
- [x] 能获取随机物品
- [x] 更高等级有更好的奖励

### 9. 物品稀有度
- **功能描述**: 物品稀有度分级
- **相关文件**: `src/lib/game/types.ts`
- **测试文件**: `items.test.ts` - 物品稀有度

**验证点**:
- [x] 有正确的稀有度等级

**稀有度等级**:
| 稀有度 | 说明 |
|--------|------|
| 普通 | 常见物品 |
| 稀有 | 较好物品 |
| 史诗 | 优秀物品 |
| 传说 | 顶级物品 |
| 神话 | 极品物品 |

## 测试运行

```bash
# 运行物品系统模块测试
pnpm test src/tests/modules/items/items.test.ts

# 运行并查看覆盖率
pnpm test:coverage src/tests/modules/items/items.test.ts
```

## 相关组件

- `src/components/game/InventoryPanel.tsx` - 背包面板
- `src/components/game/TechniquePanel.tsx` - 功法面板
- `src/components/game/EquipmentPanel.tsx` - 装备面板
- `src/components/game/MessageLog.tsx` - 消息日志
