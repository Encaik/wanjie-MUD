/**
 * E2E 测试 CSS 选择器常量
 *
 * 集中管理所有测试中使用到的选择器，
 * 当 UI 结构变化时只需在此文件修改。
 */

/** 首页 */
export const HOME = {
  /** "踏入万界" 按钮 */
  startBtn: 'button:has-text("踏入万界")',
} as const;

/** 世界选择页 */
export const WORLD_SELECT = {
  /** 世界卡片容器 */
  cardList: '[class*="grid"]',
  /** 单个世界卡片 */
  card: 'button:has-text("选择")',
  /** 第一个世界卡片 */
  firstCard: 'button:has-text("选择"):first-child',
} as const;

/** 角色选择页 */
export const CHARACTER_SELECT = {
  /** 加载指示器 */
  loading: 'text=天道推演中',
  /** 角色卡片 */
  card: '[class*="CharacterCard"]',
  /** 选择按钮 */
  selectBtn: 'button:has-text("选择")',
} as const;

/** 背景故事页 */
export const BACKSTORY = {
  /** 背景故事文本容器 */
  storyText: '[class*="backstory"]',
  /** 确认按钮 */
  confirmBtn: 'button:has-text("踏入修行")',
} as const;

/** 游戏主界面 */
export const GAME = {
  /** 顶栏标题 */
  header: 'header',
  /** 左侧角色信息 */
  leftSidebar: 'aside',
  /** GameMenu 导航 */
  nav: 'nav',
} as const;

/** GameMenu 导航 Tab */
export const NAV_TABS = {
  cultivation: 'a[href="/game/cultivation"]',
  adventure: 'a[href="/game/adventure"]',
  quest: 'a[href="/game/quest"]',
  faction: 'a[href="/game/faction"]',
  backpack: 'a[href="/game/backpack"]',
  achievement: 'a[href="/game/achievement"]',
} as const;

/** 修炼面板 */
export const CULTIVATION = {
  /** 修炼按钮 */
  cultivateBtn: 'button:has-text("修炼")',
  /** 自动修炼开关 */
  autoToggle: 'button:has-text("自动修炼")',
} as const;

/** 机缘/冒险面板 */
export const ADVENTURE = {
  /** 难度选择卡片 */
  difficultyCard: 'button:has-text("普通")',
  /** 最低难度（简单） */
  easyDifficulty: 'button:has-text("简单")',
  /** 进入探索按钮 */
  enterBtn: 'button:has-text("进入")',
  /** 自动战斗开关 */
  autoBattleToggle: 'button:has-text("自动战斗")',
  /** 退出机缘按钮 */
  exitBtn: 'button:has-text("退出机缘")',
} as const;

/** 战斗弹窗 */
export const BATTLE = {
  /** 战斗弹窗容器 */
  dialog: '[role="dialog"]',
  /** 自动战斗开关 */
  autoToggle: 'button:has-text("自动")',
  /** 战斗结果 */
  victoryText: 'text=胜利',
  defeatText: 'text=失败',
} as const;

/** 任务面板 */
export const QUEST = {
  /** 新手引导 Tab */
  tutorialTab: 'button:has-text("新手引导")',
  /** 领取奖励按钮 */
  claimBtn: 'button:has-text("领取")',
  /** 阶段完成标记 */
  phaseComplete: '[class*="checkCircle"]',
} as const;

/** 背包面板 */
export const BACKPACK = {
  /** 丹药 Tab */
  pillTab: 'button:has-text("丹药")',
  /** 物品卡片 */
  itemCard: '[class*="ItemCard"]',
  /** 物品浮层 */
  tooltip: '[class*="Tooltip"]',
  /** 使用按钮 */
  useBtn: 'button:has-text("使用")',
} as const;

/** 势力面板 */
export const FACTION = {
  /** 势力卡片 */
  factionCard: '[class*="FactionCard"]',
  /** 加入按钮 */
  joinBtn: 'button:has-text("加入")',
} as const;

/** 成就面板 */
export const ACHIEVEMENT = {
  /** 成就卡片 */
  achievementCard: '[class*="AchievementCard"]',
  /** 领取奖励按钮 */
  claimBtn: 'button:has-text("领取")',
} as const;
