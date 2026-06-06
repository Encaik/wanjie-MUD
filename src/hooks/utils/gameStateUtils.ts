/**
 * 游戏状态工具
 * 包含初始状态定义和状态处理工具函数
 * 
 * 注意：这是纯数据模块，不是 React Hook
 */

import { GameState, DEFAULT_STATISTICS } from '@/lib/game/types';
import { DEFAULT_ASCENSION_FLOW_STATE } from '@/lib/game/typesExtension';

/**
 * 初始游戏状态
 */
export const initialGameState: GameState = {
  phase: 'character-select',
  characters: [],
  worlds: [],
  selectedCharacter: null,
  selectedWorld: null,
  protagonist: null,
  currentEvent: null,
  lastActionResult: null,
  adventureGrid: null,
  adventurePosition: null,
  adventureConfig: null,
  adventurePhase: 'select',
  adventureLoot: [],
  adventureExperience: 0,
  currentTab: 'cultivation',
  battleState: null,
  activeBattle: null,
  messages: [],
  autoCultivating: false,
  autoBattle: false,
  lastExploreTime: 0,
  totalMessageCount: 0,
  crafting: null,
  forging: null,
  statistics: { ...DEFAULT_STATISTICS },
  unlockedAchievementIds: [],
  claimedAchievementIds: [],
  completedTutorialTaskIds: [],
  hasCompletedNoviceAdventure: false,
  timeSystem: null,
  ascensionFlow: DEFAULT_ASCENSION_FLOW_STATE,
};

/**
 * 消息添加辅助函数（纯函数版本）
 */
export function addMessageToState(
  messages: import('@/lib/game/types').MessageRecord[],
  type: import('@/lib/game/types').MessageRecord['type'],
  title: string,
  content: string,
  details?: string,
  rewards?: import('@/lib/game/types').MessageRecord['rewards']
): import('@/lib/game/types').MessageRecord[] {
  const newMessage: import('@/lib/game/types').MessageRecord = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    title,
    content,
    details,
    rewards,
    timestamp: Date.now(),
  };
  return [newMessage, ...messages].slice(0, 100);
}
