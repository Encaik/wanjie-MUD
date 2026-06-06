# 游戏开始功能模块

## 功能概述

游戏开始模块是玩家进入游戏的第一步，负责角色创建、世界选择和背景故事生成。

## 功能列表

### 1. 角色生成
- **功能描述**: 生成8个可选角色供玩家选择
- **相关文件**: `src/lib/game/generators.ts` - `generateCharacters()`
- **测试文件**: `gameStart.test.ts` - 角色生成功能

**验证点**:
- [x] 生成8个角色
- [x] 每个角色有完整的属性（id、name、gender、age、stats等）
- [x] 属性值在合理范围内（30-100）
- [x] 有有效的出身、特质、性格、天赋

### 2. 世界生成
- **功能描述**: 生成8种不同世界观供玩家选择
- **相关文件**: `src/lib/game/generators.ts` - `generateWorlds()`
- **测试文件**: `gameStart.test.ts` - 世界生成功能

**验证点**:
- [x] 生成8种世界观（修仙、高武、科技、魔幻、异能、仙侠、武侠、末世）
- [x] 每个世界有完整属性（id、name、description、powerSystem等）
- [x] 每个世界有境界体系
- [x] 每个世界有势力列表

### 3. 背景故事生成
- **功能描述**: 根据角色和世界生成独特的背景故事
- **相关文件**: `src/lib/game/generators.ts` - `generateBackstory()`
- **测试文件**: `gameStart.test.ts` - 背景故事生成功能

**验证点**:
- [x] 根据角色和世界生成背景故事
- [x] 不同角色生成不同故事
- [x] 不同世界生成不同故事

### 4. 游戏初始化
- **功能描述**: 开始新游戏、选择角色/世界、确认背景故事
- **相关文件**: `src/hooks/useGameState.tsx`
- **测试文件**: `gameStart.test.ts` - 游戏初始化功能

**验证点**:
- [x] `startNewGame` - 开始新游戏
- [x] `refreshCharacters` - 刷新角色列表
- [x] `selectCharacter` - 选择角色
- [x] `selectWorld` - 选择世界
- [x] `confirmBackstory` - 确认背景故事

## 测试运行

```bash
# 运行游戏开始模块测试
pnpm test src/tests/modules/game-start/gameStart.test.ts

# 运行并查看覆盖率
pnpm test:coverage src/tests/modules/game-start/gameStart.test.ts
```

## 相关组件

- `src/components/game/CharacterSelect.tsx` - 角色选择界面
- `src/components/game/WorldSelect.tsx` - 世界选择界面
- `src/components/game/BackstoryConfirm.tsx` - 背景故事确认界面
