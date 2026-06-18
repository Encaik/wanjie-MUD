## Why

当前游戏主线流程（创角 → 新手引导 → 核心玩法）只能靠开发者手动逐页点击验证。任何一个环节断裂（API 报错、状态丢失、UI 渲染异常）都需要人工发现，效率低且容易遗漏。

项目所有 API 路由均为 Next.js 内置 Route Handler，角色模板、背景故事、世界详情均使用种子/模板确定性生成，无外部 AI 依赖。`pnpm dev` 启动后即可获得完整玩家体验，无需任何 mock。

## What Changes

- 安装 `@playwright/test` 作为 E2E 测试框架
- 新建 `e2e/` 目录，存放测试用例和辅助工具
- 实现 **S1: 创角流程** 测试（首页 → 选世界 → 选角色 → 背景故事 → 进入游戏）
- 实现 **S2: 新手引导全流程** 测试（领取物资 → 使用丹药 → 修炼 → 机缘战斗 → 升级到3 → 加入势力 → 完成机缘 → 领取成就）
- 添加 `pnpm test:e2e` 脚本

## Capabilities

### New Capabilities
- `e2e-mainline-tests`: Playwright 驱动的游戏主线 E2E 测试

## Impact

- `e2e/` — 新增目录
- `package.json` — 新增 `@playwright/test` 依赖和脚本
- `playwright.config.ts` — 新增配置文件
