# world-aware-names

增量规格：修复 `getNamePoolFromRegistry` 接收中文名导致姓名池加载失败的 bug。

## MODIFIED Requirements

### Requirement: 姓名池按世界类型分组

名称生成系统 SHALL 提供 `getNamePoolFromRegistry(worldviewId: string): NamePool`，接受英文 kebab-case 世界观 ID（如 `"cultivation"`、`"wuxia"`）并从 `WorldViewRegistry` 获取对应世界观的姓名池。`generateCharacter(id, worldviewId)` SHALL 使用英文 ID 查找姓名池。

**变更前**：`getNamePoolFromRegistry(worldType)` 接受 `WorldType`（中文如 `"修仙"`）查找 `WORLD_NAME_POOLS` 硬编码映射。

**变更后**：`getNamePoolFromRegistry(worldviewId)` 接受英文 kebab-case ID（如 `"cultivation"`、`"wuxia"`），直接从 `WorldViewRegistry.get(worldviewId).namePool` 获取姓名池数据。废弃的 `WORLD_NAME_POOLS` 常量保留但标注 `@deprecated`。

#### Scenario: 修仙世界使用中文古风名

- **WHEN** 为修仙世界（`worldviewId = "cultivation"`）生成角色
- **THEN** 姓名 SHALL 从 `WorldViewRegistry.get("cultivation").namePool` 获取
- **AND** 姓氏 SHALL 来自修仙世界对应的姓氏池（如 [李,王,张,刘,陈...]）
- **AND** 男名 SHALL 来自对应的男名池
- **AND** 女名 SHALL 来自对应的女名池

#### Scenario: 科技世界使用代号/英文混血名

- **WHEN** 为科技世界（`worldviewId = "tech"`）生成角色
- **THEN** 姓名 SHALL 来自科技世界观姓名池（如"Alex·陈"、"Nova·林"、"赛博"）
- **AND** SHALL NOT 出现"紫嫣"、"浩然"等古风名

#### Scenario: 魔幻世界使用西幻名

- **WHEN** 为魔幻世界（`worldviewId = "magic"`）生成角色
- **THEN** 姓名 SHALL 来自魔幻世界观姓名池（如"艾琳·风语者"、"索林·铁锤"）

#### Scenario: 末世世界使用代号/简称

- **WHEN** 为末世世界（`worldviewId = "apocalypse"`）生成角色
- **THEN** 姓名 SHALL 来自末世世界观姓名池（如"铁牙"、"灰烬"、"独狼"）

#### Scenario: 未注册 worldviewId 抛出错误

- **WHEN** 传入未在 `WorldViewRegistry` 中注册的 `worldviewId`
- **THEN** SHALL 抛出错误 `姓名池未加载: "<worldviewId>"`。请确保 wanjie-core Mod 已正确加载。
- **AND** 错误消息 SHALL 包含传入的实际值，便于调试

### Requirement: 姓名池数据从 WorldviewDefinition 获取

姓名池数据 SHALL 从 `WorldViewRegistry` 中已注册的 `WorldviewDefinition.namePool` 获取，SHALL NOT 使用硬编码的 `WORLD_NAME_POOLS` 常量（该常量标记为 `@deprecated`）。

#### Scenario: 数据来源为注册中心

- **WHEN** 检查 `getNamePoolFromRegistry` 的实现
- **THEN** 数据来源 SHALL 为 `WorldViewRegistry.getInstance().get(id)?.namePool`
- **AND** SHALL NOT 从 `WORLD_NAME_POOLS` 硬编码映射获取
