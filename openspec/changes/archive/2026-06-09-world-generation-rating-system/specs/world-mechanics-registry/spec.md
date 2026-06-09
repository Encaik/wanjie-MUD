# world-mechanics-registry (delta)

## Purpose

世界特殊机制通过注册表注入。本次变更新增对固化模板世界机制的注册支持。

## ADDED Requirements

### Requirement: 模板世界机制自动注册

当 `TemplateWorldProvider` 注册世界模板时，模板中预定义的 `mechanics` 配置 SHALL 自动注册到 `WorldMechanicsRegistry`。

#### Scenario: 模板世界自带机制注册
- **WHEN** 加载一个包含 `mechanics` 配置的世界模板 JSON
- **THEN** 系统 SHALL 调用 `buildWorldMechanics(template.mechanics)` 构造机制对象
- **AND** SHALL 注册到 `WorldMechanicsRegistry`，key 为模板世界的 worldType
- **AND** 如果该 worldType 已注册机制，SHALL 发出覆盖警告但使用模板提供的机制

#### Scenario: 模板世界无 mechanics 时使用世界类型默认
- **WHEN** 模板世界的 JSON 中未提供 `mechanics` 字段
- **AND** 该模板的 worldType 已在 `WorldMechanicsRegistry` 中注册了机制
- **THEN** SHALL 使用已注册的机制（来自世界类型的默认机制配置）
- **AND** 不覆盖也不警告

#### Scenario: 模板世界类型未注册机制时抛出
- **WHEN** 模板世界既未提供 `mechanics` 字段
- **AND** 该 worldType 在 `WorldMechanicsRegistry` 中也未注册
- **THEN** 系统 SHALL 在模板注册时抛出 `Error` 明确说明缺失的机制
