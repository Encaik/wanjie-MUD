# module-readme-docs

## Purpose

为 `core/` 和 `modules/` 目录添加模块总览 README，降低新开发者和 AI Agent 的了解成本。

## Requirements

### Requirement: core/README.md 模块总览

项目 SHALL 在 `src/core/README.md` 中提供 `core/` 下所有子模块的用途总览文档。

#### Scenario: 覆盖所有子模块
- **WHEN** 查看 `src/core/README.md`
- **THEN** 文档列出 `core/` 下所有子目录（calculation、engine、events、logger、message-log、mod、registry、server、time、types、world），每个子模块一行描述其核心职责

#### Scenario: 内容准确
- **WHEN** 对比 `src/core/README.md` 的描述与子模块实际代码
- **THEN** 描述与模块的实际功能一致（如 `core/types/` 描述为核心游戏类型定义）

### Requirement: modules/README.md 模块总览

项目 SHALL 在 `src/modules/README.md` 中提供所有业务模块的用途总览文档。

#### Scenario: 覆盖所有业务模块
- **WHEN** 查看 `src/modules/README.md`
- **THEN** 文档列出 `src/modules/` 下所有子目录（ascension、collection、combat、crafting、economy、equipment、exploration、faction、identity、mod、narrative、npc、progression、quest、social、techniques、theme、tower、world-pool、world-rating），每个模块一行描述其功能用途

#### Scenario: 按功能域分组
- **WHEN** 阅读 `src/modules/README.md`
- **THEN** 模块按功能域分组排列（如「成长系统」「社交系统」「战斗系统」等），组间有清晰的分隔

### Requirement: README 文档维护义务

项目 SHALL 在规则文件中明确要求：当创建、删除或重命名 core/modules 子模块时，必须同步更新对应的 README.md。

#### Scenario: 新增模块同步
- **WHEN** 在 `src/core/` 或 `src/modules/` 下新增子模块
- **THEN** 必须同步更新对应 README.md，添加该模块的描述行

#### Scenario: 删除模块同步
- **WHEN** 删除 `src/core/` 或 `src/modules/` 下的子模块
- **THEN** 必须同步更新对应 README.md，移除该模块的描述行

#### Scenario: 模块重命名同步
- **WHEN** 重命名 `src/core/` 或 `src/modules/` 下的子模块
- **THEN** 必须同步更新对应 README.md，修改该模块的名称和（如适用）描述
