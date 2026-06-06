# 工具函数模块

## 功能概述

工具函数模块包含项目中使用的各种工具函数，包括ID生成器、类型守卫、日志系统等。

## 功能列表

### 1. ID生成器
- **功能描述**: 生成唯一标识符
- **相关文件**: `src/lib/game/generators.ts` - `generateId()`
- **测试文件**: `utils.test.ts` - ID生成器

**验证点**:
- [x] 生成非空字符串
- [x] 生成唯一的ID

### 2. 类型守卫
- **功能描述**: 运行时类型检查函数
- **相关文件**: `src/lib/game/typeGuards.ts`
- **测试文件**: `utils.test.ts` - 类型守卫

**验证点**:

#### isObject
- [x] null返回false
- [x] undefined返回false
- [x] 基本类型返回false
- [x] 对象返回true

#### isNumber
- [x] 非数字返回false
- [x] 有效数字返回true
- [x] NaN返回false

#### isProtagonist
- [x] null返回false
- [x] 无效对象返回false
- [x] 有效的protagonist返回true

#### isTechnique
- [x] null返回false
- [x] 无效对象返回false
- [x] 有效的technique返回true

#### isEquipment
- [x] null返回false
- [x] 无效对象返回false
- [x] 有效的equipment返回true

### 3. 日志系统
- **功能描述**: 统一的日志输出管理
- **相关文件**: `src/utils/logger.ts`
- **测试文件**: `utils.test.ts` - 日志系统

**验证点**:
- [x] 有debug方法
- [x] 有info方法
- [x] 有warn方法
- [x] 有error方法

### 4. 日志级别
- **功能描述**: 控制日志输出级别
- **相关文件**: `src/utils/logger.ts` - `LogLevel`
- **测试文件**: `utils.test.ts` - 日志级别

**验证点**:
- [x] 有正确的顺序（DEBUG < INFO < WARN < ERROR < NONE）

**日志级别**:
| 级别 | 说明 |
|------|------|
| DEBUG | 调试信息 |
| INFO | 一般信息 |
| WARN | 警告信息 |
| ERROR | 错误信息 |
| NONE | 不输出日志 |

### 5. Context系统
- **功能描述**: React Context提供全局状态
- **相关文件**: `src/contexts/ProtagonistContext.tsx`
- **测试文件**: `utils.test.ts` - Context系统

**验证点**:
- [x] ProtagonistProvider可导出
- [x] useProtagonist hook可导出
- [x] useInventory hook可导出

## 测试运行

```bash
# 运行工具函数模块测试
pnpm test src/tests/modules/utils/utils.test.ts

# 运行并查看覆盖率
pnpm test:coverage src/tests/modules/utils/utils.test.ts
```

## 相关文件

- `src/lib/game/generators.ts` - 生成器函数
- `src/lib/game/typeGuards.ts` - 类型守卫函数
- `src/utils/logger.ts` - 日志系统
- `src/contexts/ProtagonistContext.tsx` - Context提供者
