## Context

万界修行录是 Next.js 16 全栈应用。所有 API 路由在 `src/app/api/` 下，使用模板/种子确定性生成，无外部 AI 调用。E2E 测试只需 `pnpm dev` 前置运行，零 mock。

游戏主线分两个阶段：
1. **创角流程**：4 个页面跳转 + 2 个 API 调用
2. **新手引导**：5 阶段 9 步骤，事件驱动推进

## Goals / Non-Goals

**Goals:**
- 覆盖完整的创角到新手引导结束的 Happy Path
- 失败时清晰报告断在哪一步
- 测试脚本可独立运行（每个 `test()` 用独立 browserContext）
- 使用真实 `pnpm dev` 服务器，不 mock 任何 API

**Non-Goals:**
- 不覆盖错误路径（断网、API 报错等）
- 不做视觉回归测试（截图对比）
- 不接入 CI（先跑通本地）
- 不测试第三方登录/支付

## Decisions

### 测试框架：Playwright

选择 Playwright 而非 Cypress 的理由：
- 多 browserContext 隔离（每个 test 独立 localStorage，互不干扰）
- 原生支持 Next.js（`webServer` 配置自动启停 dev server）
- `page.waitForSelector` / `page.waitForURL` 处理异步加载
- 自带 trace viewer 用于失败调试

### 测试文件组织

```
e2e/
├── mainline.spec.ts        # 主线测试（S1 + S2）
├── utils/
│   └── selectors.ts        # CSS 选择器常量
└── .gitkeep
```

### 测试策略：分段可独立运行

```
test.describe('S1: 创角流程', () => {
  test('首页 → 世界选择', ...)
  test('世界选择 → 角色选择', ...)
  test('角色选择 → 背景故事', ...)
  test('背景故事 → 进入游戏', ...)
})

test.describe('S2: 新手引导全流程', () => {
  test('阶段0: 领取初始物资', ...)
  test('阶段1: 使用丹药 + 修炼', ...)
  test('阶段2: 机缘探索 + 战斗', ...)
  test('阶段3: 升级到3 + 加入势力', ...)
  test('阶段4: 完成机缘 + 领取成就', ...)
})
```

每个 `test()` 使用独立的 `browserContext`（Playwright 默认行为），通过 `page.evaluate()` 预设 localStorage 状态来实现增量测试。

### 状态注入策略

完整主线（S2）如果每步都从头点击，单次运行需要 30-60 秒。为加速迭代，S2 的每个测试通过 `page.evaluate()` 注入前置状态到 localStorage，直接从当前阶段开始验证。

```typescript
// 预设：已完成创角，正在进行新手引导阶段1
await page.evaluate(() => {
  const saved = localStorage.getItem('wanjie-game-state');
  if (saved) {
    const state = JSON.parse(saved);
    // 修改 state 中的引导进度
    state.tutorialState.completedStepIds = ['step_welcome'];
    localStorage.setItem('wanjie-game-state', JSON.stringify(state));
  }
});
```

### 机缘战斗策略

机缘探索中，战斗弹窗（BattleDialog）弹出后：
1. 确保自动战斗已开启（`gameState.autoBattle = true`）
2. 等待战斗结束（弹窗关闭）
3. 继续在网格中移动

对于快速通过测试，可以使用 `page.evaluate()` 直接触发战斗胜利事件。

### 选择器策略

优先使用 `getByRole` / `getByText`（可访问性友好），其次使用 `data-testid`，避免使用脆弱的选择器（CSS module class、随机生成的 key）。

关键元素使用 `data-testid` 标注（`data-testid="start-btn"` 等）。

## Risks / Mitigations

| 风险 | 缓解 |
|------|------|
| 异步生成（角色模板、背景故事）耗时不确定 | `waitForSelector` + 合理 timeout（15s） |
| localStorage 状态结构变化 | `page.evaluate` 注入代码与 GameState 类型同步维护 |
| 机缘网格移动路径不确定 | 使用"扫荡"模式或固定已通关难度 |
| 战斗结果随机 | 使用自动战斗 + devInvincible 无敌模式 |

## Open Questions

- 战斗无敌模式是否已有 UI 开关？（有 `devInvincible` 状态，可通过 dev panel 开启）
- 是否需要为新页面元素添加 `data-testid`？（建议渐进式添加，先用手头选择器跑通）
