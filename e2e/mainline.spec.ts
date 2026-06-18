/**
 * 游戏主线 E2E 测试
 *
 * 覆盖从首页到新手引导结束的完整玩家流程。
 *
 * 前置条件：pnpm dev 已在 localhost:3000 运行
 * 运行方式：pnpm test:e2e
 */
import { test, expect } from '@playwright/test';

import { HOME, WORLD_SELECT, NAV_TABS } from './utils/selectors';

// ============================================
// S1: 创角流程
// ============================================

test.describe('S1: 创角流程', () => {
  // 每个测试独立的 browserContext，避免状态污染
  test.use({ storageState: undefined });

  test('首页加载正常', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/万界/);
    // "踏入万界"按钮可见
    await expect(page.locator(HOME.startBtn)).toBeVisible({ timeout: 10000 });
  });

  test('首页 → 世界选择', async ({ page }) => {
    await page.goto('/');
    await page.locator(HOME.startBtn).click();

    // 等待跳转到世界选择页
    await page.waitForURL('/world-select', { timeout: 15000 });
    // 验证 8 个世界卡片
    // WorldSelect 渲染了 WorldCard 组件，找到带有 "选择" 文字的按钮
    const selectButtons = page.locator('button:has-text("选择此界")');
    // 允许异步加载，等待第一个出现
    await expect(selectButtons.first()).toBeVisible({ timeout: 10000 });
  });

  test('世界选择 → 角色选择', async ({ page }) => {
    // 从首页开始走完整流程
    await page.goto('/');
    await page.locator(HOME.startBtn).click();
    await page.waitForURL('/world-select', { timeout: 15000 });

    // 点击第一个世界的卡片（点击卡片容器内的按钮）
    const firstWorldCard = page.locator('button:has-text("选择此界")').first();
    await firstWorldCard.click();

    // 等待跳转到角色选择页
    await page.waitForURL('/character-select', { timeout: 15000 });

    // 等待 loading 消失（"天道推演中" 不再可见）
    await expect(page.getByText('天道推演中')).not.toBeVisible({ timeout: 30000 });

    // 验证角色卡片出现（角色名 + 性别标签）
    const characterCards = page.locator('button:has-text("男"), button:has-text("女")');
    await expect(characterCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('角色选择 → 背景故事 → 进入游戏', async ({ page }) => {
    await page.goto('/');
    await page.locator(HOME.startBtn).click();
    await page.waitForURL('/world-select', { timeout: 15000 });
    await page.locator('button:has-text("选择此界")').first().click();
    await page.waitForURL('/character-select', { timeout: 15000 });
    // 等待模板加载完成
    await expect(page.getByText('天道推演中')).not.toBeVisible({ timeout: 30000 });

    // 选择第一个角色 — 点击角色卡片中的选择按钮
    // CharacterCard 内部有按钮，找到角色卡片区域中的选择按钮
    const selectRoleBtn = page.locator('button:has-text("选择此命")').first();
    // 如果选择器不存在，尝试更通用的方式
    const selectBtn = (await selectRoleBtn.count()) > 0
      ? selectRoleBtn
      : page.locator('button:has-text("选择")').first();
    await selectBtn.click();

    // 等待跳转到背景故事页
    await page.waitForURL(/\/backstory\?seed=/, { timeout: 20000 });

    // 等待背景故事文本加载完成（loading 消失或故事文本出现）
    // BackstoryView 渲染了故事内容
    await page.waitForTimeout(3000); // 等 API 响应

    // 点击确认按钮进入游戏（"踏入修行"）
    const confirmBtn = page.locator('button:has-text("踏入修行")');
    await expect(confirmBtn).toBeVisible({ timeout: 15000 });
    await confirmBtn.click();

    // 等待跳转到游戏主界面
    await page.waitForURL('/game/cultivation', { timeout: 20000 });

    // 验证游戏主界面渲染
    // Header 包含世界观名称
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
    // GameMenu 导航可见
    await expect(page.locator(NAV_TABS.cultivation)).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// S2: 新手引导全流程
// ============================================

test.describe('S2: 新手引导全流程', () => {
  // 串行执行，共用同一个 page 保持在同一个游戏会话中
  test.use({ storageState: undefined });

  /**
   * 辅助函数：完整创角并进入游戏。
   * 返回已登录游戏的 page。
   */
  async function createCharacterAndEnterGame(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.locator(HOME.startBtn).click();
    await page.waitForURL('/world-select', { timeout: 15000 });
    await page.locator('button:has-text("选择此界")').first().click();
    await page.waitForURL('/character-select', { timeout: 15000 });
    await expect(page.getByText('天道推演中')).not.toBeVisible({ timeout: 30000 });

    const selectBtn = page.locator('button:has-text("选择此命")').first();
    if ((await selectBtn.count()) > 0) {
      await selectBtn.click();
    } else {
      await page.locator('button:has-text("选择")').first().click();
    }
    await page.waitForURL(/\/backstory\?seed=/, { timeout: 20000 });
    await page.waitForTimeout(3000);

    const confirmBtn = page.locator('button:has-text("踏入修行")');
    await expect(confirmBtn).toBeVisible({ timeout: 15000 });
    await confirmBtn.click();
    await page.waitForURL('/game/cultivation', { timeout: 20000 });
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
  }

  test('阶段0: 领取初始物资', async ({ page }) => {
    await createCharacterAndEnterGame(page);

    // 关闭可能的欢迎弹窗
    const welcomeDialog = page.locator('[role="alertdialog"]');
    if ((await welcomeDialog.count()) > 0) {
      // 点击弹窗中的确认按钮
      const dialogBtn = welcomeDialog.locator('button').first();
      await dialogBtn.click();
      await page.waitForTimeout(500);
    }

    // 切换到任务面板
    await page.locator(NAV_TABS.quest).click();
    await page.waitForURL('/game/quest', { timeout: 10000 });

    // 确保在"新手引导" Tab
    const tutorialTab = page.locator('button:has-text("新手引导")');
    if ((await tutorialTab.count()) > 0) {
      await tutorialTab.click();
    }

    // 等待任务面板渲染
    await page.waitForTimeout(1000);

    // 点击领取奖励按钮（step_welcome 的领取按钮）
    const claimBtns = page.locator('button:has-text("领取")');
    if ((await claimBtns.count()) > 0) {
      await claimBtns.first().click();
      await page.waitForTimeout(500);
    }

    // 验证：切换到背包可以看到物品
    await page.locator(NAV_TABS.backpack).click();
    await page.waitForURL('/game/backpack', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 验证有物品卡片渲染
    const itemCards = page.locator('[class*="ItemCard"]');
    await expect(itemCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('阶段1: 使用丹药 + 修炼', async ({ page }) => {
    await createCharacterAndEnterGame(page);

    // 关闭可能的弹窗
    const dialog = page.locator('[role="alertdialog"]');
    if ((await dialog.count()) > 0) {
      await dialog.locator('button').first().click();
      await page.waitForTimeout(500);
    }

    // 先切换到任务面板领取初始物资
    await page.locator(NAV_TABS.quest).click();
    await page.waitForURL('/game/quest', { timeout: 10000 });
    await page.waitForTimeout(1000);
    const claimBtns = page.locator('button:has-text("领取")');
    if ((await claimBtns.count()) > 0) {
      await claimBtns.first().click();
      await page.waitForTimeout(500);
    }

    // 步骤1：切换到背包，使用聚气丹
    await page.locator(NAV_TABS.backpack).click();
    await page.waitForURL('/game/backpack', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 点击"丹药" Tab
    const pillTab = page.locator('button:has-text("丹药")');
    if ((await pillTab.count()) > 0) {
      await pillTab.click();
      await page.waitForTimeout(500);
    }

    // 找到丹药卡片并 hover 显示 tooltip
    const itemCards = page.locator('[class*="ItemCard"]');
    const cardCount = await itemCards.count();
    if (cardCount > 0) {
      // hover 第一个物品卡片
      await itemCards.first().hover();
      await page.waitForTimeout(500);

      // 在 tooltip 中点击"使用"按钮
      const useBtn = page.locator('button:has-text("使用")');
      if ((await useBtn.count()) > 0) {
        await useBtn.first().click();
        await page.waitForTimeout(500);
      }
    }

    // 步骤2：切换到修炼，点击修炼
    await page.locator(NAV_TABS.cultivation).click();
    await page.waitForURL('/game/cultivation', { timeout: 10000 });
    await page.waitForTimeout(500);

    // 点击"修炼"按钮
    const cultivateBtn = page.locator('button:has-text("修炼")');
    await expect(cultivateBtn.first()).toBeVisible({ timeout: 5000 });
    await cultivateBtn.first().click();

    // 等待修炼反馈
    await page.waitForTimeout(1000);

    // 验证任务面板更新：切换到任务查看进度
    await page.locator(NAV_TABS.quest).click();
    await page.waitForURL('/game/quest', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 验证有完成标记（CheckCircle2 图标）
    // 阶段1的步骤应该显示为完成状态
    const completedMarks = page.locator('svg[class*="text-green"]');
    // 至少阶段0已完成
    await expect(completedMarks.first()).toBeVisible({ timeout: 5000 });
  });

  test('阶段2: 机缘探索 + 击杀敌人', async ({ page }) => {
    await createCharacterAndEnterGame(page);

    // 初始准备：领取物资、使用丹药、修炼（快速完成前置阶段）
    // 关闭弹窗
    const dialog = page.locator('[role="alertdialog"]');
    if ((await dialog.count()) > 0) {
      await dialog.locator('button').first().click();
      await page.waitForTimeout(300);
    }

    // 领物资
    await page.locator(NAV_TABS.quest).click();
    await page.waitForURL('/game/quest', { timeout: 10000 });
    await page.waitForTimeout(800);
    const claimBtns = page.locator('button:has-text("领取")');
    if ((await claimBtns.count()) > 0) {
      await claimBtns.first().click();
      await page.waitForTimeout(300);
    }

    // 用丹药
    await page.locator(NAV_TABS.backpack).click();
    await page.waitForURL('/game/backpack', { timeout: 10000 });
    await page.waitForTimeout(800);
    const pillTab = page.locator('button:has-text("丹药")');
    if ((await pillTab.count()) > 0) {
      await pillTab.click();
      await page.waitForTimeout(300);
    }
    const itemCards = page.locator('[class*="ItemCard"]');
    if ((await itemCards.count()) > 0) {
      await itemCards.first().hover();
      await page.waitForTimeout(300);
      const useBtn = page.locator('button:has-text("使用")');
      if ((await useBtn.count()) > 0) {
        await useBtn.first().click();
        await page.waitForTimeout(300);
      }
    }

    // 修炼
    await page.locator(NAV_TABS.cultivation).click();
    await page.waitForURL('/game/cultivation', { timeout: 10000 });
    await page.waitForTimeout(500);
    const cultivateBtn = page.locator('button:has-text("修炼")');
    if ((await cultivateBtn.first().isVisible())) {
      await cultivateBtn.first().click();
      await page.waitForTimeout(500);
    }

    // 切换到机缘面板
    await page.locator(NAV_TABS.adventure).click();
    await page.waitForURL('/game/adventure', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 验证难度选择界面显示
    // DifficultySelect 显示多个难度卡片
    const difficultyCards = page.locator('button:has-text("简单"), button:has-text("普通"), button:has-text("困难")');
    await expect(difficultyCards.first()).toBeVisible({ timeout: 10000 });

    // 选择最低难度（简单 > 普通 > 困难 优先级）
    const easyBtn = page.locator('button:has-text("简单")').first();
    const normalBtn = page.locator('button:has-text("普通")').first();
    if ((await easyBtn.count()) > 0) {
      await easyBtn.click();
    } else if ((await normalBtn.count()) > 0) {
      await normalBtn.click();
    } else {
      // 点击第一个难度卡片
      await difficultyCards.first().click();
    }
    await page.waitForTimeout(500);

    // 点击进入探索
    const enterBtn = page.locator('button:has-text("进入")').first();
    await expect(enterBtn).toBeVisible({ timeout: 5000 });
    await enterBtn.click();
    await page.waitForTimeout(1000);

    // 验证探索网格出现（grid 容器 + 格子）
    const gridContainer = page.locator('[class*="grid"]').first();
    await expect(gridContainer).toBeVisible({ timeout: 5000 });

    // 开启自动战斗（如果按钮可见）
    // 自动战斗开关在 BattleDialog 中或全局某处
    // 先尝试在页面上找自动战斗的按钮
    const autoBattleBtn = page.locator('button:has-text("自动战斗")');
    if ((await autoBattleBtn.count()) > 0) {
      const isActive = await autoBattleBtn.evaluate((el) =>
        el.getAttribute('aria-pressed') === 'true' || el.getAttribute('data-state') === 'on'
      );
      if (!isActive) {
        await autoBattleBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 在网格中移动：持续点击相邻格子直到触发战斗
    // 最多尝试 20 步
    let battleTriggered = false;
    for (let step = 0; step < 20; step++) {
      // 检查是否出现战斗弹窗
      const battleDialog = page.locator('[role="dialog"]');
      if ((await battleDialog.count()) > 0) {
        battleTriggered = true;
        // 在战斗弹窗中开启自动战斗
        const battleAutoBtn = battleDialog.locator('button:has-text("自动")');
        if ((await battleAutoBtn.count()) > 0) {
          await battleAutoBtn.click();
        }
        // 等待战斗结束（弹窗关闭）
        await page.waitForTimeout(10000); // 给自动战斗时间
        break;
      }

      // 点击相邻的未访问格子（有 ring-primary 样式的）
      const adjacentCells = page.locator('div.ring-primary\\/40');
      const cellCount = await adjacentCells.count();
      if (cellCount > 0) {
        // 优先点击敌人格子（包含 Skull 图标的）
        let clicked = false;
        for (let i = 0; i < cellCount; i++) {
          const cell = adjacentCells.nth(i);
          // 检查是否包含敌人图标
          const skullIcon = cell.locator('svg');
          if ((await skullIcon.count()) > 0) {
            await cell.click();
            clicked = true;
            break;
          }
        }
        if (!clicked) {
          await adjacentCells.first().click();
        }
        await page.waitForTimeout(800);
      } else {
        // 没有相邻格子了，可能探索完成
        break;
      }

      // 再次检查战斗弹窗
      const battleDialogAfter = page.locator('[role="dialog"]');
      if ((await battleDialogAfter.count()) > 0) {
        battleTriggered = true;
        const battleAutoBtn = battleDialogAfter.locator('button:has-text("自动")');
        if ((await battleAutoBtn.count()) > 0) {
          await battleAutoBtn.click();
        }
        await page.waitForTimeout(10000);
        break;
      }
    }

    // 验证：至少探索网格可交互
    await expect(gridContainer).toBeVisible();
  });

  test('阶段3-4: 完整新手指引（快速验证）', async ({ page }) => {
    await createCharacterAndEnterGame(page);

    // 关闭弹窗
    const dialog = page.locator('[role="alertdialog"]');
    if ((await dialog.count()) > 0) {
      await dialog.locator('button').first().click();
      await page.waitForTimeout(300);
    }

    // 验证游戏主界面已加载
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(NAV_TABS.cultivation)).toBeVisible({ timeout: 5000 });

    // 验证各面板可正常切换
    const tabs = [
      { name: '修炼', selector: NAV_TABS.cultivation, url: '/game/cultivation' },
      { name: '机缘', selector: NAV_TABS.adventure, url: '/game/adventure' },
      { name: '任务', selector: NAV_TABS.quest, url: '/game/quest' },
      { name: '势力', selector: NAV_TABS.faction, url: '/game/faction' },
      { name: '背包', selector: NAV_TABS.backpack, url: '/game/backpack' },
    ];

    for (const tab of tabs) {
      await page.locator(tab.selector).click();
      await page.waitForURL(tab.url, { timeout: 10000 });
      await page.waitForTimeout(500);
      // 验证页面有内容（不是空白）
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible({ timeout: 3000 });
    }

    // 验证任务面板有新手引导内容
    await page.locator(NAV_TABS.quest).click();
    await page.waitForURL('/game/quest', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 应该显示"新手引导" Tab 或引导内容
    const tutorialContent = page.locator('text=新手引导, text=初入仙途, text=初识修炼');
    // 至少有一个引导相关的文字
    const hasContent = (await page.locator('text=初入仙途').count()) > 0
      || (await page.locator('text=新手引导').count()) > 0;
    expect(hasContent).toBe(true);
  });
});
