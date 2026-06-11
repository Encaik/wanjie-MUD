# docker-ci-publish

**Purpose**: 定义 Docker 镜像的 CI/CD 自动构建与发布流程，支持多平台镜像推送至 Docker Hub。

## ADDED Requirements

### Requirement: 自动 Docker 镜像构建与推送
项目 SHALL 包含 `.github/workflows/docker-publish.yml` 工作流，在推送到 main 分支时自动构建 Docker 镜像并推送至 Docker Hub 仓库 `encaik/wanjie-mud`。

#### Scenario: 推送触发
- **WHEN** 代码被推送到 main 分支
- **THEN** GitHub Actions SHALL 自动触发 Docker 镜像构建和推送流程
- **THEN** 工作流也 SHALL 支持手动触发（workflow_dispatch）

#### Scenario: 构建流程
- **WHEN** CI 工作流运行
- **THEN** SHALL 检出源码（actions/checkout@v4）
- **THEN** SHALL 登录 Docker Hub（使用 `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN` Secrets）
- **THEN** SHALL 设置 Docker Buildx 和 QEMU（支持多平台）
- **THEN** SHALL 构建并推送 Docker 镜像至 `encaik/wanjie-mud`

### Requirement: 多平台镜像构建
CI 工作流 SHALL 构建同时支持 `linux/amd64` 和 `linux/arm64` 两个平台的多架构 Docker 镜像，通过 Docker Buildx 和 QEMU 实现。

#### Scenario: 多平台构建
- **WHEN** CI 执行 Docker 构建
- **THEN** SHALL 使用 `docker/setup-qemu-action` 安装 QEMU 模拟器
- **THEN** SHALL 使用 `docker/setup-buildx-action` 创建 Buildx builder
- **THEN** 构建的镜像 SHALL 同时支持 `linux/amd64` 和 `linux/arm64` 平台

#### Scenario: 多平台推送
- **WHEN** 构建完成
- **THEN** Docker Hub 上的 manifest list SHALL 包含两个平台的镜像引用
- **THEN** `docker pull encaik/wanjie-mud:latest` SHALL 自动选择匹配当前系统架构的镜像

### Requirement: 镜像 Tag 策略
Docker 镜像 SHALL 使用两级 Tag：从 `package.json` 读取的版本号作为语义 Tag，同时打 `latest` Tag 指向最新版本。

#### Scenario: Tag 生成
- **WHEN** CI 构建 Docker 镜像
- **THEN** SHALL 从 `package.json` 的 `version` 字段提取版本号
- **THEN** SHALL 推送 `<version>` Tag（如 `0.1.0`）
- **THEN** SHALL 同时推送 `latest` Tag

### Requirement: Docker Hub 认证
GitHub Actions 工作流 SHALL 通过 GitHub Secrets 安全存储 Docker Hub 认证信息，不在代码中硬编码凭据。

#### Scenario: 认证流程
- **WHEN** CI 执行 Docker 登录
- **THEN** SHALL 使用 `docker/login-action` 配合 `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN` Secrets
- **THEN** 登录失败时工作流 SHALL 中止并报告错误
