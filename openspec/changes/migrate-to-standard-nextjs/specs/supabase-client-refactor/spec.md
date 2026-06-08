## ADDED Requirements

### Requirement: 标准环境变量命名
Supabase 客户端 SHALL 使用 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 环境变量，替代 `COZE_SUPABASE_URL` 和 `COZE_SUPABASE_ANON_KEY`。

#### Scenario: 客户端环境变量可访问
- **WHEN** 在浏览器中运行应用
- **THEN** Supabase URL 和 anon key SHALL 通过 `process.env.NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 获取
- **THEN** Supabase 客户端 SHALL 成功初始化

#### Scenario: 缺少环境变量时报错
- **WHEN** `NEXT_PUBLIC_SUPABASE_URL` 或 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 未设置
- **THEN** 应用 SHALL 抛出明确错误信息，提示开发者配置环境变量

### Requirement: 移除 Coze Workload Identity
Supabase 客户端初始化 SHALL 移除通过 Python `coze_workload_identity` 库动态获取凭证的逻辑，SHALL 移除 `execSync` 调用。

#### Scenario: 无 Python 依赖
- **WHEN** 项目在未安装 Python 的环境中运行
- **THEN** Supabase 客户端初始化 SHALL 不尝试执行 Python 脚本
- **THEN** `child_process` 模块 SHALL 不被引入

#### Scenario: 直接从环境变量读取
- **WHEN** 环境变量已正确设置
- **THEN** SHALL 直接从 `process.env` 读取凭证
- **THEN** 不依赖 `dotenv` 库进行运行时加载（Next.js 内置 .env 支持）

### Requirement: 客户端优先架构
Supabase 客户端 SHALL 设计为纯客户端可用，使用 `createClient` 创建浏览器端实例。

#### Scenario: 客户端调用 Supabase
- **WHEN** React 组件需要查询数据
- **THEN** SHALL 直接 import 并调用 Supabase 客户端方法
- **THEN** 不经过 Next.js API Route 中转

#### Scenario: RLS 兼容
- **WHEN** Supabase 项目配置了 Row Level Security
- **THEN** 客户端请求 SHALL 携带用户认证 token（如登录状态存在）
- **THEN** 匿名用户 SHALL 仅能访问公开数据
