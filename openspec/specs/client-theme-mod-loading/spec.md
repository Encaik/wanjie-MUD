# client-theme-mod-loading

## Purpose

客户端主题/样式 Mod 加载能力，实现类似 Minecraft 客户端 Mod 的扩展模式。

## Requirements

### Requirement: 客户端主题/样式 Mod 加载

项目 SHALL 在 `ClientModLoader` 中支持加载主题和样式类型的 Mod 内容。

#### Scenario: 加载样式内容
- **WHEN** `ClientModLoader` 加载一个 Mod，其 `contentTypes` 包含 `styles`
- **THEN** 加载器读取 `dataFiles` 中配置的 CSS 文件路径
- **AND** 通过 `fetch` 获取 CSS 文本
- **AND** 将样式注入到页面中

#### Scenario: 加载主题配置
- **WHEN** `ClientModLoader` 加载一个 Mod，其 `contentTypes` 包含 `theme`
- **THEN** 加载器读取主题配置数据
- **AND** 将主题变量注册到前端主题系统中

#### Scenario: 样式隔离
- **WHEN** 多个客户端 Mod 注入样式
- **THEN** 每个 Mod 的样式通过命名空间/前缀隔离
- **AND** 不同 Mod 间的样式冲突通过后加载覆盖前加载处理

### Requirement: ModInitProvider 接入客户端状态

`modules/mod/ModInitProvider` SHALL 接入 `ClientModLoader` 的状态，向下层组件提供真实的加载阶段和错误信息。

#### Scenario: 加载中状态
- **WHEN** `ClientModLoader` 正在加载客户端 Mod
- **THEN** `ModInitProvider` 向下层提供 `phase: 'loading'` 和当前进度
- **AND** 组件根据加载状态决定是否显示加载提示

#### Scenario: 错误传递
- **WHEN** `ClientModLoader` 的部分 Mod 加载失败
- **THEN** `ModInitProvider` 传递警告列表到 `ModErrorBanner`
- **AND** 用户可在页面顶部看到可关闭的警告
