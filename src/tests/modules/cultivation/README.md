# 修炼系统功能模块

## 功能概述

修炼系统是游戏的核心玩法之一，玩家通过消耗灵石进行修炼来提升等级和实力。

## 功能列表

### 1. 修炼功能
- **功能描述**: 消耗灵石进行修炼，获取经验值
- **相关文件**: `src/hooks/useGameState.tsx` - `performCultivation()`
- **测试文件**: `cultivation.test.ts` - 修炼功能

**验证点**:
- [x] 修炼消耗灵石（每次10灵石）
- [x] 修炼获得经验（10-25点随机）
- [x] `performCultivation` 函数可用
- [x] `CultivationPanel` 组件可导入

### 2. 自动修炼功能
- **功能描述**: 自动消耗灵石修炼直到灵石不足或等级提升
- **相关文件**: `src/hooks/useGameState.tsx` - `toggleAutoCultivation()`
- **测试文件**: `cultivation.test.ts` - 自动修炼功能

**验证点**:
- [x] 灵石不足时自动停止
- [x] 经验满时自动升级
- [x] `toggleAutoCultivation` 函数可用

### 3. 境界系统
- **功能描述**: 管理玩家等级和境界名称
- **相关文件**: `src/lib/game/realmSystem.ts`, `src/lib/game/generators.ts`
- **测试文件**: `cultivation.test.ts` - 境界系统

**验证点**:
- [x] 有最大等级限制（MAX_LEVEL）
- [x] 能获取境界名称（`getRealmName`）
- [x] 不同世界有不同境界名
- [x] 能计算升级所需经验
- [x] 等级越高所需经验越多

### 4. 突破系统
- **功能描述**: 计算突破概率和增益效果
- **相关文件**: `src/lib/game/cultivation.ts`
- **测试文件**: `cultivation.test.ts` - 突破系统

**验证点**:
- [x] 能计算最大经验值（`getMaxExperience`）
- [x] 能计算突破概率（`calculateBreakthroughRate`）
- [x] 低等级突破概率高
- [x] 突破增益提高成功率
- [x] 悟性影响突破概率

### 5. 体力系统
- **功能描述**: 管理玩家体力值
- **相关文件**: `src/lib/game/typesExtension.ts`
- **测试文件**: `cultivation.test.ts` - 体力系统

**验证点**:
- [x] 默认体力100点
- [x] 体力不低于0
- [x] 体力可以恢复
- [x] `performRest` 函数可用

### 6. 流派系统
- **功能描述**: 修炼流派选择和技能解锁
- **相关文件**: `src/lib/data/cultivationPathData.ts`
- **测试文件**: `cultivation.test.ts` - 流派系统

**验证点**:
- [x] 有多种修炼流派
- [x] 流派等级经验正确计算
- [x] 每个流派有多个技能

### 7. 战力计算
- **功能描述**: 计算玩家综合战力
- **相关文件**: `src/lib/game/combatPower.ts`
- **测试文件**: `cultivation.test.ts` - 战力计算

**验证点**:
- [x] `calculatePlayerCombatPower` 函数可用
- [x] 能计算玩家战力
- [x] 等级越高战力越高

## 测试运行

```bash
# 运行修炼系统模块测试
pnpm test src/tests/modules/cultivation/cultivation.test.ts

# 运行并查看覆盖率
pnpm test:coverage src/tests/modules/cultivation/cultivation.test.ts
```

## 相关组件

- `src/components/game/CultivationPanel.tsx` - 修炼面板
- `src/components/game/StatusBar.tsx` - 状态栏（显示等级、经验等）
