/**
 * 模块⑭ 社交公告 — 对外契约
 */

// —— 公告系统 ——
export { AnnouncementGenerator, createAnnouncementGenerator } from './logic/announcement/generator';
export type { AnnouncementContext } from './logic/announcement/generator';

// —— 公告组件 ——
export { AnnouncementContainer } from './components/AnnouncementContainer';
export { AnnouncementToast } from './components/AnnouncementToast';

// —— 消息 Hook ——
export { useGameMessages } from './hooks/useMessages';
