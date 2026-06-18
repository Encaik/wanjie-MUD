/**
 * Playwright E2E 测试配置
 *
 * 前置条件：pnpm dev 在 localhost:3000 运行。
 * 也可通过 webServer 配置自动启动（注释掉的部分）。
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 主线测试串行执行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 单 worker，避免状态冲突
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // 游戏不需要截图/录像，失败时靠 trace 排查
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 可选：自动启动 dev server（需确保 3000 端口空闲）
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120000,
  // },
});
