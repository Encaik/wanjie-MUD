# serverless-db-storage

**Purpose:** 数据库文件存储在 Serverless 兼容路径，支持环境变量配置数据目录，在只读文件系统中优雅回退到 `/tmp/` 或内存数据库。

## ADDED Requirements

### Requirement: 数据目录可配置
数据库存放目录 SHALL 支持通过环境变量 `WANJIE_DATA_DIR` 配置。若不设置，默认使用 `{process.cwd()}/.data`。

#### Scenario: 使用自定义数据目录
- **WHEN** 设置环境变量 `WANJIE_DATA_DIR=/data/wanjie`
- **AND** 首次调用 `getDb()`
- **THEN** 数据库文件创建在 `/data/wanjie/worlds.db`

#### Scenario: 使用默认数据目录
- **WHEN** 未设置 `WANJIE_DATA_DIR` 环境变量
- **AND** 首次调用 `getDb()`
- **THEN** 数据库目录为 `{cwd}/.data`

### Requirement: Serverless 文件系统回退
当默认或配置的数据目录创建失败（`ENOENT` / `EACCES` 错误）时，系统 SHALL 自动尝试 `/tmp/wanjie-data` 作为备选目录。若 `/tmp/` 同样不可写，SHALL 回退到 SQLite 内存数据库（`:memory:`）。

#### Scenario: 生产环境自动使用 /tmp/
- **WHEN** 部署在 Serverless 平台（如 Vercel），`process.cwd()` 为 `/var/task/`（只读）
- **AND** 调用 `ensureDatabase()` 创建 `.data` 目录失败
- **THEN** 系统自动尝试创建 `/tmp/wanjie-data/` 目录并在此存放数据库文件
- **AND** 输出 WARN 级别日志说明目录回退

#### Scenario: /tmp 不可用时回退内存数据库
- **WHEN** 默认目录和 `/tmp/wanjie-data` 均无法创建
- **THEN** 系统使用 `:memory:` SQLite 数据库
- **AND** 输出 ERROR 级别日志警告数据不持久

### Requirement: 遗留数据迁移
首次启动时若旧路径 `{cwd}/.data/worlds.db` 存在且新路径无数据库文件，系统 SHALL 自动将旧数据库文件复制到新路径。

#### Scenario: 自动迁移遗留数据
- **WHEN** 旧路径 `{cwd}/.data/worlds.db` 文件存在
- **AND** 新数据目录下的 `worlds.db` 不存在
- **THEN** 系统自动复制旧数据库到新路径
- **AND** 输出 INFO 级别日志说明迁移完成
