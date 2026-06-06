# 势力系统功能模块

## 功能概述

势力系统允许玩家加入游戏中的各种势力组织，通过完成任务、捐献等方式提升声望和职位，获得更多福利。

## 功能列表

### 1. 势力数据
- **功能描述**: 各世界观的势力列表和详情
- **相关文件**: `src/lib/data/factionData.ts`
- **测试文件**: `faction.test.ts` - 势力数据

**验证点**:
- [x] 每个世界类型都有势力
- [x] 能通过ID获取势力
- [x] 势力有正确的类型（sect、empire、guild等）

### 2. 加入势力
- **功能描述**: 选择并加入世界观对应的势力
- **相关文件**: `src/hooks/useGameState.tsx` - `joinFaction()`, `leaveFaction()`
- **测试文件**: `faction.test.ts` - 加入势力功能

**验证点**:
- [x] `joinFaction` 函数可用
- [x] `leaveFaction` 函数可用
- [x] 加入势力初始化进度数据

### 3. 声望系统
- **功能描述**: 声望等级、声望获取、声望奖励
- **相关文件**: `src/lib/data/factionProgressData.ts`, `src/lib/game/expansionLogic.ts`
- **测试文件**: `faction.test.ts` - 声望系统

**验证点**:
- [x] 能正确计算声望等级
- [x] 声望等级配置有效
- [x] 声望可以增加

**声望等级表**:
| 等级 | 名称 | 所需声望 |
|------|------|----------|
| outsider | 门外汉 | 0 |
| neutral | 中立 | 1,000 |
| friendly | 友善 | 5,000 |
| honored | 尊敬 | 20,000 |
| revered | 崇敬 | 50,000 |
| exalted | 崇拜 | 100,000 |

### 4. 职位系统
- **功能描述**: 职位晋升、职位福利
- **相关文件**: `src/lib/data/factionProgressData.ts`, `src/lib/game/expansionLogic.ts`
- **测试文件**: `faction.test.ts` - 职位系统

**验证点**:
- [x] 宗门势力有有效职位
- [x] 每个职位有福利
- [x] 不同势力类型有不同职位
- [x] 能检查职位晋升资格

### 5. 任务系统
- **功能描述**: 日常任务、周常任务、任务进度追踪
- **相关文件**: `src/lib/data/factionProgressData.ts`, `src/hooks/useGameState.tsx`
- **测试文件**: `faction.test.ts` - 任务系统

**验证点**:
- [x] 有有效的势力任务
- [x] 任务有有效的需求
- [x] 任务有有效的奖励
- [x] `acceptTask` 函数可用
- [x] `submitTask` 函数可用
- [x] `refreshTasks` 函数可用
- [x] 能更新任务进度

### 6. 捐献系统
- **功能描述**: 捐献灵石获取贡献和声望
- **相关文件**: `src/hooks/useGameState.tsx` - `donate()`
- **测试文件**: `faction.test.ts` - 捐献系统

**验证点**:
- [x] 捐献获得贡献（50%）
- [x] 捐献获得声望（200%）
- [x] `donate` 函数可用

### 7. 势力面板组件
- **功能描述**: 势力信息展示和操作界面
- **相关文件**: `src/components/game/FactionPanel.tsx`
- **测试文件**: `faction.test.ts` - 势力面板组件

**验证点**:
- [x] `FactionPanel` 组件可导入
- [x] `RankDetailDialog` 组件可导入
- [x] `ReputationDetailDialog` 组件可导入
- [x] 任务和日常并列显示

## 测试运行

```bash
# 运行势力系统模块测试
pnpm test src/tests/modules/faction/faction.test.ts

# 运行并查看覆盖率
pnpm test:coverage src/tests/modules/faction/faction.test.ts
```

## 相关组件

- `src/components/game/FactionPanel.tsx` - 势力面板
- `src/components/game/RankDetailDialog.tsx` - 职位详情弹窗
- `src/components/game/ReputationDetailDialog.tsx` - 声望详情弹窗
