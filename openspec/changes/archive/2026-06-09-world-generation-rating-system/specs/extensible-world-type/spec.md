# extensible-world-type (delta)

## Purpose

世界类型从硬编码联合类型改为可扩展字符串，通过 WorldDataRegistry 动态校验。本次变更新增世界视觉配置字段，消除 views/ 层硬编码映射。

## ADDED Requirements

### Requirement: WorldTypeData 包含视觉配置

`WorldDataRegistry` 中的 `WorldTypeData` 接口 SHALL 新增 `visualConfig` 字段，包含世界类型的图标、强调色、渐变样式和主题覆盖。

#### Scenario: Mod 提供视觉配置
- **WHEN** 一个 Mod 在其世界数据 JSON 中提供 `visualConfig` 字段
- **THEN** `WorldDataRegistry` SHALL 存储该视觉配置
- **AND** 所有 views/ 组件 SHALL 通过 `getWorldType(type)?.visualConfig` 读取视觉信息

#### Scenario: Mod 未提供视觉配置时使用通用默认
- **WHEN** 一个 Mod 的世界数据 JSON 中未提供 `visualConfig` 字段
- **THEN** 系统 SHALL 使用通用默认视觉配置（中性灰度色调 + 通用图标"?"）
- **AND** SHALL NOT 映射到某个已有的世界类型（如修仙）的视觉配置
- **AND** SHALL 发出 `console.warn` 提示该世界类型缺少视觉配置

### Requirement: views/ 层无硬编码视觉映射

`src/views/` 下的所有组件 SHALL NOT 包含硬编码的世界类型→视觉映射（如 `worldIcon`、`worldAccent`、`worldTheme`、`WORLD_ICONS`、`WORLD_COLORS`、`worldTypeConfig` 等）。所有视觉信息 SHALL 从 `WorldDataRegistry` 的 `visualConfig` 动态获取。

#### Scenario: WorldSelect 组件从注册中心获取视觉
- **WHEN** 检查 `WorldSelect.tsx` 的代码
- **THEN** SHALL NOT 存在 `const worldTheme: Record<string, ...> = { '修仙': ..., '高武': ..., ... }` 形式的硬编码映射
- **AND** 视觉配置 SHALL 通过 `WorldDataRegistry.getInstance().getWorldType(world.type)?.visualConfig` 获取

#### Scenario: WorldInfoPanel 从注册中心获取视觉
- **WHEN** 检查 `WorldInfoPanel.tsx` 的代码
- **THEN** SHALL NOT 存在 `const worldTypeConfig = { '修仙': {...}, '高武': {...}, ... }` 形式的硬编码映射
- **AND** 视觉配置 SHALL 从注册中心动态获取

#### Scenario: WorldReveal 从注册中心获取视觉
- **WHEN** 检查 `WorldReveal.tsx` 的代码
- **THEN** SHALL NOT 存在 `WORLD_ICONS` 或 `WORLD_COLORS` 等硬编码映射常量
- **AND** 图标和颜色 SHALL 从注册中心动态获取

#### Scenario: WorldInfoBar 从注册中心获取视觉
- **WHEN** 检查 `WorldInfoBar.tsx` 的代码
- **THEN** SHALL NOT 存在 `worldIcon` 或 `worldAccent` 等硬编码映射常量
- **AND** 图标和强调色 SHALL 从注册中心动态获取
